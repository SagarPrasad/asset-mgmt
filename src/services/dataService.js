import { getSupabaseClient } from '../lib/supabaseClient';
import {
  INITIAL_FAMILY_MEMBERS,
  INITIAL_FINANCIAL_YEARS,
  INITIAL_BANK_ACCOUNTS,
  INITIAL_INVESTMENTS,
  INITIAL_DEMAT_HOLDINGS,
  INITIAL_INSURANCE_POLICIES,
  INITIAL_IMMOVABLE_PROPERTIES,
  INITIAL_MOVABLE_ASSETS,
  INITIAL_LIABILITIES_AND_EXPENSES
} from '../data/seedData';
import { encryptField, decryptField } from '../utils/crypto';
import * as XLSX from 'xlsx';
import { getCleanWorkbookData } from './excelImporter';

import { calculateHoldingMetrics } from './marketPriceService';

const STORAGE_KEY_PREFIX = 'family_vault_app_data_';

// Get user storage key
const getStorageKey = (userId) => `${STORAGE_KEY_PREFIX}${userId || 'local_guest'}`;

// Helper to reliably link assets to the correct family member
export const resolveMemberId = (item, members = [], itemType = 'bank') => {
  if (!members || members.length === 0) return item?.member_id || null;

  // 1. Direct ID match
  if (item?.member_id) {
    const directMatch = members.find(m => m.id === item.member_id);
    if (directMatch) return directMatch.id;
  }

  // 2. Name match
  const candidateName = String(item?.member_name || item?.member_id || '').toLowerCase().trim();
  if (candidateName) {
    const nameMatch = members.find(m => m.name?.toLowerCase().trim() === candidateName);
    if (nameMatch) return nameMatch.id;
  }

  // 3. Name substring match across family members
  for (const member of members) {
    const memFirst = (member.name || '').split(' ')[0].toLowerCase().trim();
    if (memFirst && memFirst.length > 2) {
      const itemStr = `${item?.member_name || ''} ${item?.bank_name || ''} ${item?.notes || ''} ${item?.plan_name || ''}`.toLowerCase();
      if (itemStr.includes(memFirst)) {
        return member.id;
      }
    }
  }

  // Fallback to the primary / first family member
  return members[0]?.id || item?.member_id || null;
};

// Load data: If Supabase connected & user logged in, fetch from Supabase.
// Otherwise, load from encrypted local cache or seed.
export const loadInitialData = async (user, masterPassword) => {
  const supabase = getSupabaseClient();
  const primaryKey = masterPassword || user?.id || 'local_guest';
  const secondaryKey = user?.id || 'local_guest';

  // Safe fail-over decrypt helper
  const safeDecrypt = async (ciphertext) => {
    if (!ciphertext || typeof ciphertext !== 'string' || !ciphertext.startsWith('enc::')) {
      return ciphertext;
    }
    let dec = await decryptField(ciphertext, primaryKey);
    if (dec && dec.startsWith('enc::') && secondaryKey && secondaryKey !== primaryKey) {
      dec = await decryptField(ciphertext, secondaryKey);
    }
    return dec;
  };

  if (supabase && user) {
    try {
      // Fetch all user tables in parallel from Supabase
      const [
        { data: members },
        { data: fyList },
        { data: banks },
        { data: snaps },
        { data: invs },
        { data: insList },
        { data: props },
        { data: movs },
        { data: liabs },
        { data: dematList }
      ] = await Promise.all([
        supabase.from('family_members').select('*').eq('user_id', user.id),
        supabase.from('financial_years').select('*').eq('user_id', user.id),
        supabase.from('bank_accounts').select('*').eq('user_id', user.id),
        supabase.from('bank_snapshots').select('*').eq('user_id', user.id),
        supabase.from('investments').select('*').eq('user_id', user.id),
        supabase.from('insurance_policies').select('*').eq('user_id', user.id),
        supabase.from('immovable_properties').select('*').eq('user_id', user.id),
        supabase.from('movable_assets').select('*').eq('user_id', user.id),
        supabase.from('liabilities_expenses').select('*').eq('user_id', user.id),
        supabase.from('demat_holdings').select('*').eq('user_id', user.id)
      ]);

      const hasDataInSupabase = (members && members.length > 0) ||
        (banks && banks.length > 0) ||
        (invs && invs.length > 0) ||
        (insList && insList.length > 0) ||
        (props && props.length > 0);

      if (hasDataInSupabase) {
        // 1. Decrypt members
        const decryptedMembers = await Promise.all(
          (members || []).map(async (m) => ({
            ...m,
            pan: await safeDecrypt(m.pan),
            aadhaar: await safeDecrypt(m.aadhaar),
            voter_id: await safeDecrypt(m.voter_id),
            driving_license: await safeDecrypt(m.driving_license),
            passport: await safeDecrypt(m.passport)
          }))
        );

        // 2. Decrypt & Deduplicate Bank Accounts
        const rawDecryptedBanks = await Promise.all(
          (banks || []).map(async (b) => {
            const accNum = await safeDecrypt(b.account_number);
            const custId = await safeDecrypt(b.customer_id);
            const resolvedMemberId = resolveMemberId(
              { ...b, account_number: accNum },
              decryptedMembers,
              'bank'
            );

            // Reconstruct snapshots map
            const accountSnaps = {};
            (snaps || [])
              .filter((s) => s.bank_account_id === b.id)
              .forEach((s) => {
                accountSnaps[s.fy_id] = {
                  balance: Number(s.balance || 0),
                  interest_acquired: Number(s.interest_acquired || 0),
                  investments_linked: Number(s.investments_linked || 0)
                };
              });

            return {
              ...b,
              member_id: resolvedMemberId,
              account_number: accNum,
              customer_id: custId,
              snapshots: accountSnaps
            };
          })
        );

        // Deduplicate bank accounts by (bank_name + last 6 digits of account_number)
        const seenBanks = new Map();
        const dedupedBanks = [];
        for (const b of rawDecryptedBanks) {
          const normBank = (b.bank_name || '').trim().toLowerCase();
          const normAcc = (b.account_number || '').trim().slice(-6);
          const key = `${normBank}_${normAcc}`;
          if (!seenBanks.has(key)) {
            seenBanks.set(key, b);
            dedupedBanks.push(b);
          } else {
            // Merge snapshots if duplicate has extra data
            const existing = seenBanks.get(key);
            existing.snapshots = {
              ...(existing.snapshots || {}),
              ...(b.snapshots || {})
            };
          }
        }

        // Defensive fallback: if bank accounts table was empty, pull clean bank accounts from workbook
        const cleanWorkbook = getCleanWorkbookData();
        const finalBanks = dedupedBanks.length > 0 ? dedupedBanks : cleanWorkbook.bankAccounts;

        // 3. Decrypt & Deduplicate Investments (Retirement / Fixed)
        const decryptedInvestments = await Promise.all(
          (invs || []).map(async (inv) => {
            const accId = await safeDecrypt(inv.account_identifier);
            const resolvedMemberId = resolveMemberId(inv, decryptedMembers, 'investment');

            let valuesObj = inv.values;
            if (!valuesObj || typeof valuesObj !== 'object') {
              valuesObj = {
                'fy_23_24': Number(inv.cost_value || inv.current_value || 0),
                'fy_24_25': Number(inv.current_value || 0),
                'fy_25_26': Number(inv.current_value || 0)
              };
            }

            return {
              ...inv,
              member_id: resolvedMemberId,
              account_identifier: accId,
              cost_value: Number(inv.cost_value || 0),
              current_value: Number(inv.current_value || 0),
              values: valuesObj
            };
          })
        );

        // Deduplicate investments by institution
        const seenInvs = new Map();
        const dedupedInvestments = [];
        for (const inv of decryptedInvestments) {
          const key = (inv.institution || '').trim().toLowerCase();
          if (!seenInvs.has(key)) {
            seenInvs.set(key, inv);
            dedupedInvestments.push(inv);
          }
        }

        // 4. Process & Deduplicate Demat Holdings (Stocks & Mutual Funds)
        const seenHoldings = new Map();
        const dedupedHoldings = [];
        for (const rawH of (dematList || [])) {
          const key = (rawH.symbol || rawH.name || '').trim().toUpperCase();
          const resolvedMemberId = resolveMemberId(rawH, decryptedMembers, 'demat');
          const metrics = calculateHoldingMetrics({
            ...rawH,
            member_id: resolvedMemberId,
            units: Number(rawH.units || 0),
            invested_amount: Number(rawH.invested_amount || 0),
            avg_buy_price: Number(rawH.avg_buy_price || 0),
            current_price: Number(rawH.current_price || 0),
            current_value: Number(rawH.current_value || 0)
          });

          if (!seenHoldings.has(key)) {
            seenHoldings.set(key, metrics);
            dedupedHoldings.push(metrics);
          }
        }

        // 5. Decrypt & Deduplicate Insurance Policies
        const decryptedInsurance = await Promise.all(
          (insList || []).map(async (ins) => {
            const policyNo = await safeDecrypt(ins.policy_no);
            const resolvedMemberId = resolveMemberId(
              { ...ins, policy_no: policyNo },
              decryptedMembers,
              'insurance'
            );

            return {
              ...ins,
              member_id: resolvedMemberId,
              policy_no: policyNo,
              annual_premium: Number(ins.annual_premium || 0),
              sum_insured: Number(ins.sum_insured || 0)
            };
          })
        );

        const seenPolicies = new Map();
        const dedupedInsurance = [];
        for (const ins of decryptedInsurance) {
          const key = `${(ins.provider || '').trim().toLowerCase()}_${(ins.plan_name || '').trim().toLowerCase()}`;
          if (!seenPolicies.has(key)) {
            seenPolicies.set(key, ins);
            dedupedInsurance.push(ins);
          }
        }

        // 6. Properties & Movables with Member Resolution
        const dedupedProps = (props || []).map(p => ({
          ...p,
          member_id: resolveMemberId(p, decryptedMembers, 'property'),
          cost_amount: Number(p.cost_amount || 0),
          current_valuation: Number(p.current_valuation || 0)
        }));

        const dedupedMovables = (movs || []).map(m => ({
          ...m,
          member_id: resolveMemberId(m, decryptedMembers, 'movable'),
          original_cost: Number(m.original_cost || 0),
          current_value: Number(m.current_value || 0)
        }));

        return {
          members: decryptedMembers,
          financialYears: (fyList && fyList.length > 0) ? fyList : INITIAL_FINANCIAL_YEARS,
          bankAccounts: finalBanks,
          investments: dedupedInvestments,
          dematHoldings: dedupedHoldings,
          insurancePolicies: dedupedInsurance,
          immovableProperties: dedupedProps,
          movableAssets: dedupedMovables,
          liabilitiesAndExpenses: liabs || []
        };
      } else {
        // No records in Supabase yet for this user.
        return getCleanWorkbookData();
      }
    } catch (e) {
      console.warn('Supabase fetch failed, falling back to local vault:', e);
    }
  }

  // Fallback to local storage
  const cached = localStorage.getItem(getStorageKey(user?.id));
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (!parsed.dematHoldings) {
        parsed.dematHoldings = [];
      }
      if (!parsed.bankAccounts || parsed.bankAccounts.length === 0) {
        parsed.bankAccounts = getCleanWorkbookData().bankAccounts;
      }
      return parsed;
    } catch (e) {
      console.error('Parse error, returning clean workbook data');
    }
  }

  return getCleanWorkbookData();
};

export const getFreshSeedData = () => ({
  members: INITIAL_FAMILY_MEMBERS,
  financialYears: INITIAL_FINANCIAL_YEARS,
  bankAccounts: INITIAL_BANK_ACCOUNTS,
  investments: INITIAL_INVESTMENTS,
  dematHoldings: INITIAL_DEMAT_HOLDINGS,
  insurancePolicies: INITIAL_INSURANCE_POLICIES,
  immovableProperties: INITIAL_IMMOVABLE_PROPERTIES,
  movableAssets: INITIAL_MOVABLE_ASSETS,
  liabilitiesAndExpenses: INITIAL_LIABILITIES_AND_EXPENSES
});

// Save updated local & cloud state
export const saveLocalData = async (data, user) => {
  const key = getStorageKey(user?.id);
  localStorage.setItem(key, JSON.stringify(data));
};

// Reset to Excel workbook data
export const resetToSeedData = (user) => {
  const key = getStorageKey(user?.id);
  const cleanData = getCleanWorkbookData();
  localStorage.setItem(key, JSON.stringify(cleanData));
  return cleanData;
};

// Encrypt & Upload all data to Supabase database using Master Password
export const syncDataToSupabase = async (data, user, masterPassword) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client is not connected.');
  }

  const userId = user?.id || null;
  const encryptionKey = masterPassword || user?.id || 'local_guest';

  // 1. Sync Family Members with encrypted PAN, Aadhaar, Voter ID, DL, Passport
  const memberIdMap = {};
  for (const m of (data.members || [])) {
    const encPan = await encryptField(m.pan, encryptionKey);
    const encAadhaar = await encryptField(m.aadhaar, encryptionKey);
    const encVoter = await encryptField(m.voter_id, encryptionKey);
    const encDl = await encryptField(m.driving_license, encryptionKey);
    const encPassport = await encryptField(m.passport, encryptionKey);

    const { data: savedMember } = await supabase.from('family_members').upsert({
      name: m.name,
      relation: m.relation,
      pan: encPan,
      aadhaar: encAadhaar,
      voter_id: encVoter,
      driving_license: encDl,
      passport: encPassport,
      user_id: userId
    }, { onConflict: 'user_id,name' }).select().single();

    if (savedMember) {
      if (m.id) memberIdMap[m.id] = savedMember.id;
      memberIdMap[m.name.toLowerCase().trim()] = savedMember.id;
    }
  }

  // Helper to map item's member_id to Supabase member UUID
  const getSupabaseMemberId = (item, itemType = 'bank') => {
    const resolvedLocalId = resolveMemberId(item, data.members || [], itemType);
    return memberIdMap[resolvedLocalId] || resolvedLocalId || null;
  };

  // 2. Sync Financial Years
  for (const fy of (data.financialYears || [])) {
    await supabase.from('financial_years').upsert({
      label: fy.label,
      as_on_date: fy.as_on_date,
      is_current: fy.is_current,
      user_id: userId
    }, { onConflict: 'user_id,label' });
  }

  // 3. Sync Bank Accounts & Snapshots
  // To avoid duplicate bank rows created by randomized IV encryption:
  // Fetch existing user bank rows and match by bank_name and last digits
  const { data: existingBanks } = await supabase
    .from('bank_accounts')
    .select('id, bank_name, account_number')
    .eq('user_id', userId);

  const decryptedExistingBanks = await Promise.all(
    (existingBanks || []).map(async (eb) => ({
      ...eb,
      plainAcc: await decryptField(eb.account_number, encryptionKey)
    }))
  );

  for (const b of (data.bankAccounts || [])) {
    const encAcc = await encryptField(b.account_number, encryptionKey);
    const encCust = await encryptField(b.customer_id, encryptionKey);
    const memberId = getSupabaseMemberId(b, 'bank');

    // Find matching existing bank account
    const matchedExisting = decryptedExistingBanks.find((eb) => {
      if (eb.bank_name !== b.bank_name) return false;
      if (b.account_number && eb.plainAcc) {
        return eb.plainAcc.slice(-6) === b.account_number.slice(-6);
      }
      return true;
    });

    let bankRecordId = null;

    if (matchedExisting) {
      // Update existing record in place
      bankRecordId = matchedExisting.id;
      await supabase.from('bank_accounts').update({
        bank_name: b.bank_name,
        account_type: b.account_type,
        account_number: encAcc,
        customer_id: encCust,
        branch: b.branch,
        netbanking_user: b.netbanking_user,
        member_id: memberId
      }).eq('id', bankRecordId);

      // Clean up any other duplicate rows in DB matching this bank
      const duplicateRows = decryptedExistingBanks.filter(
        eb => eb.id !== bankRecordId && eb.bank_name === b.bank_name &&
        (!b.account_number || !eb.plainAcc || eb.plainAcc.slice(-6) === b.account_number.slice(-6))
      );
      for (const dup of duplicateRows) {
        await supabase.from('bank_accounts').delete().eq('id', dup.id);
      }
    } else {
      // Insert new bank record
      const { data: insertedBank } = await supabase.from('bank_accounts').insert({
        bank_name: b.bank_name,
        account_type: b.account_type,
        account_number: encAcc,
        customer_id: encCust,
        branch: b.branch,
        netbanking_user: b.netbanking_user,
        member_id: memberId,
        user_id: userId
      }).select().single();

      if (insertedBank) {
        bankRecordId = insertedBank.id;
      }
    }

    // Upsert snapshots
    if (bankRecordId && b.snapshots) {
      for (const [fyKey, snap] of Object.entries(b.snapshots)) {
        await supabase.from('bank_snapshots').upsert({
          bank_account_id: bankRecordId,
          fy_id: fyKey,
          balance: Number(snap.balance || 0),
          interest_acquired: Number(snap.interest_acquired || 0),
          investments_linked: Number(snap.investments_linked || 0),
          user_id: userId
        }, { onConflict: 'bank_account_id,fy_id' });
      }
    }
  }

  // 4. Sync Immovable Properties
  for (const p of (data.immovableProperties || [])) {
    const memberId = getSupabaseMemberId(p, 'property');
    await supabase.from('immovable_properties').upsert({
      description: p.description,
      premises: p.premises,
      door_no: p.door_no,
      road: p.road,
      area: p.area,
      city: p.city,
      state: p.state,
      country: p.country,
      pincode: p.pincode,
      cost_amount: Number(p.cost_amount || 0),
      current_valuation: Number(p.current_valuation || 0),
      co_ownership: p.co_ownership,
      member_id: memberId,
      user_id: userId
    }, { onConflict: 'user_id,premises' });
  }

  // 5. Sync Investments (Demat, EPFO, NPS, Bonds)
  if (data.investments) {
    for (const inv of data.investments) {
      const encId = await encryptField(inv.account_identifier, encryptionKey);
      const memberId = getSupabaseMemberId(inv, 'investment');
      await supabase.from('investments').upsert({
        category: inv.category,
        institution: inv.institution,
        account_identifier: encId,
        cost_value: Number(inv.cost_value || 0),
        current_value: Number(inv.values?.fy_25_26 || inv.values?.fy_24_25 || inv.values?.fy_23_24 || inv.current_value || 0),
        notes: inv.notes,
        member_id: memberId,
        user_id: userId
      }, { onConflict: 'user_id,institution' });
    }
  }

  // 5b. Sync Demat Holdings (Stocks & Mutual Funds)
  if (data.dematHoldings) {
    try {
      for (const h of data.dematHoldings) {
        const memberId = getSupabaseMemberId(h, 'demat');
        await supabase.from('demat_holdings').upsert({
          symbol: h.symbol,
          name: h.name,
          category: h.category || 'Equity / Stocks',
          exchange: h.exchange || 'NSE',
          units: Number(h.units || 0),
          invested_amount: Number(h.invested_amount || 0),
          avg_buy_price: Number(h.avg_buy_price || 0),
          current_price: Number(h.current_price || 0),
          current_value: Number(h.current_value || (Number(h.units || 0) * Number(h.current_price || 0)) || 0),
          notes: h.notes || '',
          member_id: memberId,
          user_id: userId
        }, { onConflict: 'user_id,symbol' });
      }
    } catch (e) {
      console.warn('demat_holdings sync skipped:', e.message);
    }
  }

  // 6. Sync Insurance Policies with encrypted policy number
  if (data.insurancePolicies) {
    for (const ins of data.insurancePolicies) {
      const encPolicyNo = await encryptField(ins.policy_no, encryptionKey);
      const memberId = getSupabaseMemberId(ins, 'insurance');
      await supabase.from('insurance_policies').upsert({
        provider: ins.provider,
        plan_name: ins.plan_name,
        policy_no: encPolicyNo,
        annual_premium: Number(ins.annual_premium || 0),
        sum_insured: Number(ins.sum_insured || 0),
        premium_date: ins.premium_date,
        payment_mode: ins.payment_mode,
        status: ins.status,
        reminder_enabled: ins.reminder_enabled !== false,
        reminder_days: ins.reminder_days || 30,
        notes: ins.notes,
        member_id: memberId,
        user_id: userId
      }, { onConflict: 'user_id,provider,plan_name' });
    }
  }

  // 7. Sync Movable Assets
  if (data.movableAssets) {
    for (const m of data.movableAssets) {
      const memberId = getSupabaseMemberId(m, 'movable');
      await supabase.from('movable_assets').upsert({
        category: m.category,
        item_name: m.item_name,
        year_of_purchase: m.year_of_purchase,
        original_cost: Number(m.original_cost || 0),
        current_value: Number(m.current_value || 0),
        status: m.status,
        notes: m.notes,
        member_id: memberId,
        user_id: userId
      }, { onConflict: 'user_id,item_name' });
    }
  }

  // 8. Sync Liabilities & Expenses
  if (data.liabilitiesAndExpenses) {
    for (const l of data.liabilitiesAndExpenses) {
      await supabase.from('liabilities_expenses').upsert({
        category: l.category,
        title: l.title,
        amount: Number(l.amount || 0),
        payment_source: l.payment_source,
        reminder_schedule: l.reminder_schedule,
        notes: l.notes,
        user_id: userId
      }, { onConflict: 'user_id,title' });
    }
  }

  return { success: true, timestamp: new Date().toISOString() };
};

// Export entire portfolio to Excel matching original workbook structure
export const exportToExcel = (data, activeFy) => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Executive Summary & ITR Schedule AL
  const summaryRows = [
    ['FAMILY WEALTH & ASSET REPORT', `Financial Year: ${activeFy?.label || 'All'}`],
    ['Generated on:', new Date().toLocaleString('en-IN')],
    [],
    ['PART A: IMMOVABLE ASSETS (LAND & BUILDINGS)', 'Cost Amount (INR)', 'Estimated Valuation (INR)', 'Occupancy / Description'],
    ...(data.immovableProperties || []).map(p => [
      `${p.premises} (${p.door_no || ''}) - ${p.city}`,
      p.cost_amount,
      p.current_valuation,
      `${p.description} | ${p.co_ownership}`
    ]),
    [],
    ['PART B: MOVABLE ASSETS', 'Category', 'Year of Purchase', 'Current Value (INR)'],
    ...(data.movableAssets || []).map(m => [
      m.item_name,
      m.category,
      m.year_of_purchase || 'N/A',
      m.current_value
    ]),
    [],
    ['PART C: BANK ACCOUNTS & DEPOSITS', 'Account Number', 'Balance (INR)', 'Interest Acquired (INR)'],
    ...(data.bankAccounts || []).map(b => {
      const snap = b.snapshots?.[activeFy?.id] || { balance: 0, interest_acquired: 0 };
      return [
        `${b.bank_name} - ${b.account_type}`,
        b.account_number,
        snap.balance,
        snap.interest_acquired
      ];
    }),
    [],
    ['PART D: INVESTMENTS, RETIREMENT & DEMAT', 'Account / Plan ID', 'Value (INR)', 'Notes'],
    ...(data.investments || []).map(i => {
      const val = i.values?.[activeFy?.id] ?? i.values?.['fy_25_26'] ?? i.current_value ?? 0;
      return [
        `${i.institution} (${i.category})`,
        i.account_identifier,
        val,
        i.notes
      ];
    }),
    [],
    ['PART E: INSURANCE POLICIES', 'Policy Number', 'Sum Insured (INR)', 'Annual Premium (INR)', 'Status'],
    ...(data.insurancePolicies || []).map(ins => [
      `${ins.provider} - ${ins.plan_name}`,
      ins.policy_no,
      ins.sum_insured,
      ins.annual_premium,
      `${ins.status} (${ins.payment_mode})`
    ]),
    [],
    ['PART F: LIABILITIES & COMMITMENTS', 'Title', 'Amount (INR)', 'Frequency / Source'],
    ...(data.liabilitiesAndExpenses || []).map(l => [
      l.title,
      l.category,
      l.amount,
      `${l.frequency} via ${l.payment_source}`
    ])
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Portfolio_Summary');

  // Sheet 2: Bank Accounts Detailed
  const bankRows = [
    ['Bank Name', 'Account Type', 'Account Number', 'Customer ID', 'Netbanking User', 'FY 23-24 Balance', 'FY 24-25 Balance', 'FY 25-26 Balance'],
    ...(data.bankAccounts || []).map(b => [
      b.bank_name,
      b.account_type,
      b.account_number,
      b.customer_id,
      b.netbanking_user,
      b.snapshots?.fy_23_24?.balance || 0,
      b.snapshots?.fy_24_25?.balance || 0,
      b.snapshots?.fy_25_26?.balance || 0
    ])
  ];
  const wsBanks = XLSX.utils.aoa_to_sheet(bankRows);
  XLSX.utils.book_append_sheet(wb, wsBanks, 'Bank_Accounts');

  // Sheet 3: Demat Holdings (Stocks & Mutual Funds)
  const dematRows = [
    ['Symbol / Scheme Code', 'Name', 'Category', 'Exchange', 'Units / Qty', 'Avg Buy Price', 'Invested Amount', 'Live Price / NAV', 'Current Value', 'Unrealized Gain / Loss', 'Return %', 'Notes'],
    ...(data.dematHoldings || []).map(h => {
      const units = Number(h.units || 0);
      const price = Number(h.current_price || 0);
      const invested = Number(h.invested_amount || 0);
      const curVal = Number(h.current_value) || (units * price) || invested;
      const pnl = curVal - invested;
      const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
      return [
        h.symbol,
        h.name,
        h.category,
        h.exchange || 'NSE',
        units,
        Number(h.avg_buy_price || 0),
        invested,
        price,
        curVal,
        pnl,
        `${pnlPct.toFixed(2)}%`,
        h.notes || ''
      ];
    })
  ];
  const wsDemat = XLSX.utils.aoa_to_sheet(dematRows);
  XLSX.utils.book_append_sheet(wb, wsDemat, 'Demat_Holdings');

  // Write file
  const fileName = `Family_Asset_Vault_${activeFy?.label?.replace(/\s+/g, '_') || 'Portfolio'}.xlsx`;
  XLSX.writeFile(wb, fileName);
};
