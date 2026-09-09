import { getSupabaseClient } from '../lib/supabaseClient.js';
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
} from '../data/seedData.js';
import { encryptField, decryptField } from '../utils/crypto.js';
import * as XLSX from 'xlsx';
import { getCleanWorkbookData } from './excelImporter.js';

import { calculateHoldingMetrics } from './marketPriceService.js';

const STORAGE_KEY_PREFIX = 'family_vault_app_data_';

// Get user storage key
const getStorageKey = (userId) => `${STORAGE_KEY_PREFIX}${userId || 'local_guest'}`;

// Validate standard UUID format
export const isValidUuid = (str) => {
  return typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
};

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

  // 3. Name substring match across family members (with HUF distinction)
  for (const member of members) {
    const memFirst = (member.name || '').split(' ')[0].toLowerCase().trim();
    const isMemHuf = (member.name || '').toLowerCase().includes('huf');
    const itemStr = `${item?.member_name || ''} ${item?.bank_name || ''} ${item?.notes || ''} ${item?.plan_name || ''}`.toLowerCase();
    const isItemHuf = itemStr.includes('huf');
    if (isMemHuf !== isItemHuf) continue;

    if (memFirst && memFirst.length > 2) {
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
        // 1. Decrypt members (with metadata unpacking from notes)
        const decryptedMembers = await Promise.all(
          (members || []).map(async (m) => {
            let meta = {};
            if (m.notes && typeof m.notes === 'string' && m.notes.startsWith('{') && m.notes.endsWith('}')) {
              try { meta = JSON.parse(m.notes); } catch {}
            }
            return {
              ...m,
              pan: await safeDecrypt(m.pan),
              aadhaar: await safeDecrypt(m.aadhaar),
              voter_id: await safeDecrypt(m.voter_id),
              driving_license: await safeDecrypt(m.driving_license),
              passport: await safeDecrypt(m.passport),
              pran: m.pran || meta.pran || '',
              demat_info: m.demat_info || meta.demat_info || '',
              avatar_color: m.avatar_color || meta.avatar_color || m.avatar_url || '#3b82f6'
            };
          })
        );

        // 2. Decrypt & Deduplicate Bank Accounts (with PIN hints and passwords)
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

            // Extract PIN Hint & Netbanking Password from columns or packed notes
            let pinHint = b.pin_hint || '';
            let rawNetPass = b.netbanking_password || '';
            let bankNotes = b.notes || '';
            if (bankNotes && typeof bankNotes === 'string' && bankNotes.startsWith('{')) {
              try {
                const parsed = JSON.parse(bankNotes);
                if (!pinHint && parsed.pin_hint) pinHint = parsed.pin_hint;
                if (!rawNetPass && parsed.netbanking_password) rawNetPass = parsed.netbanking_password;
                if (parsed.notes !== undefined) bankNotes = parsed.notes;
              } catch {}
            }

            const netbankingPassword = await safeDecrypt(rawNetPass);

            return {
              ...b,
              member_id: resolvedMemberId,
              account_number: accNum,
              customer_id: custId,
              netbanking_user: b.netbanking_user || '',
              netbanking_password: netbankingPassword || '',
              pin_hint: pinHint || '',
              notes: bankNotes || '',
              branch: b.branch || '',
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
            if (!existing.pin_hint && b.pin_hint) existing.pin_hint = b.pin_hint;
            if (!existing.netbanking_password && b.netbanking_password) existing.netbanking_password = b.netbanking_password;
            if (!existing.notes && b.notes) existing.notes = b.notes;
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

            let pinHint = inv.pin_hint || '';
            let rawLoginPass = inv.login_password || '';
            let invNotes = inv.notes || '';
            if (invNotes && typeof invNotes === 'string' && invNotes.startsWith('{')) {
              try {
                const parsed = JSON.parse(invNotes);
                if (!pinHint && parsed.pin_hint) pinHint = parsed.pin_hint;
                if (!rawLoginPass && parsed.login_password) rawLoginPass = parsed.login_password;
                if (parsed.notes !== undefined) invNotes = parsed.notes;
              } catch {}
            }

            const loginPassword = await safeDecrypt(rawLoginPass);

            return {
              ...inv,
              member_id: resolvedMemberId,
              account_identifier: accId,
              login_user: inv.login_user || '',
              login_password: loginPassword || '',
              pin_hint: pinHint || '',
              notes: invNotes || '',
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
          const key = (rawH.id || `${rawH.symbol || rawH.name}_${rawH.member_id || ''}`).trim().toUpperCase();
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

// Delete a specific asset permanently from Supabase database tables
export const deleteAssetFromSupabase = async (assetCategory, item, user) => {
  const supabase = getSupabaseClient();
  if (!supabase || !user || !item) return;

  const userId = user.id;

  try {
    switch (assetCategory) {
      case 'dematHolding': {
        let deleted = false;
        if (item.id && isValidUuid(item.id)) {
          const { data } = await supabase
            .from('demat_holdings')
            .delete()
            .eq('user_id', userId)
            .eq('id', item.id)
            .select();
          if (data && data.length > 0) deleted = true;
        }
        if (!deleted && item.symbol) {
          await supabase
            .from('demat_holdings')
            .delete()
            .eq('user_id', userId)
            .eq('symbol', item.symbol);
        }
        break;
      }
      case 'bankAccount': {
        if (item.id && isValidUuid(item.id)) {
          await supabase.from('bank_snapshots').delete().eq('bank_account_id', item.id);
          await supabase.from('bank_accounts').delete().eq('user_id', userId).eq('id', item.id);
        } else if (item.bank_name) {
          const { data: userBanks } = await supabase
            .from('bank_accounts')
            .select('id, bank_name')
            .eq('user_id', userId);
          for (const b of userBanks || []) {
            if (b.bank_name.toLowerCase().trim() === item.bank_name.toLowerCase().trim()) {
              await supabase.from('bank_snapshots').delete().eq('bank_account_id', b.id);
              await supabase.from('bank_accounts').delete().eq('id', b.id);
            }
          }
        }
        break;
      }
      case 'investment': {
        let deleted = false;
        if (item.id && isValidUuid(item.id)) {
          const { data } = await supabase
            .from('investments')
            .delete()
            .eq('user_id', userId)
            .eq('id', item.id)
            .select();
          if (data && data.length > 0) deleted = true;
        }
        if (!deleted && item.institution) {
          await supabase
            .from('investments')
            .delete()
            .eq('user_id', userId)
            .eq('institution', item.institution);
        }
        break;
      }
      case 'insurancePolicy': {
        let deleted = false;
        if (item.id && isValidUuid(item.id)) {
          const { data } = await supabase
            .from('insurance_policies')
            .delete()
            .eq('user_id', userId)
            .eq('id', item.id)
            .select();
          if (data && data.length > 0) deleted = true;
        }
        if (!deleted && item.provider && item.plan_name) {
          await supabase
            .from('insurance_policies')
            .delete()
            .eq('user_id', userId)
            .eq('provider', item.provider)
            .eq('plan_name', item.plan_name);
        }
        break;
      }
      case 'immovableProperty': {
        let deleted = false;
        if (item.id && isValidUuid(item.id)) {
          const { data } = await supabase
            .from('immovable_properties')
            .delete()
            .eq('user_id', userId)
            .eq('id', item.id)
            .select();
          if (data && data.length > 0) deleted = true;
        }
        if (!deleted && (item.premises || item.title)) {
          await supabase
            .from('immovable_properties')
            .delete()
            .eq('user_id', userId)
            .eq('premises', item.premises || item.title);
        }
        break;
      }
      case 'movableAsset': {
        let deleted = false;
        if (item.id && isValidUuid(item.id)) {
          const { data } = await supabase
            .from('movable_assets')
            .delete()
            .eq('user_id', userId)
            .eq('id', item.id)
            .select();
          if (data && data.length > 0) deleted = true;
        }
        if (!deleted && item.item_name) {
          await supabase
            .from('movable_assets')
            .delete()
            .eq('user_id', userId)
            .eq('item_name', item.item_name);
        }
        break;
      }
      case 'liability':
      case 'expense': {
        let deleted = false;
        if (item.id && isValidUuid(item.id)) {
          const { data } = await supabase
            .from('liabilities_expenses')
            .delete()
            .eq('user_id', userId)
            .eq('id', item.id)
            .select();
          if (data && data.length > 0) deleted = true;
        }
        if (!deleted && item.title) {
          await supabase
            .from('liabilities_expenses')
            .delete()
            .eq('user_id', userId)
            .eq('title', item.title);
        }
        break;
      }
      case 'member': {
        if (item.id && isValidUuid(item.id)) {
          await supabase.from('family_members').delete().eq('user_id', userId).eq('id', item.id);
        } else if (item.name) {
          await supabase.from('family_members').delete().eq('user_id', userId).eq('name', item.name);
        }
        break;
      }
      default:
        console.warn('Unknown asset category for deletion:', assetCategory);
    }
  } catch (err) {
    console.error(`deleteAssetFromSupabase failed for ${assetCategory}:`, err);
  }
};

// Encrypt & Upload all data to Supabase database with automated deletion pruning & reconciliation
export const syncDataToSupabase = async (data, user, masterPassword) => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase client is not connected.');
  }

  const userId = user?.id || null;
  const encryptionKey = masterPassword || user?.id || 'local_guest';

  // 1. Sync Family Members with encrypted credentials and metadata notes
  const memberIdMap = {};
  for (const m of (data.members || [])) {
    const encPan = await encryptField(m.pan, encryptionKey);
    const encAadhaar = await encryptField(m.aadhaar, encryptionKey);
    const encVoter = await encryptField(m.voter_id, encryptionKey);
    const encDl = await encryptField(m.driving_license, encryptionKey);
    const encPassport = await encryptField(m.passport, encryptionKey);

    const memberNotesMeta = JSON.stringify({
      pran: m.pran || '',
      demat_info: m.demat_info || '',
      avatar_color: m.avatar_color || '#3b82f6',
      notes: m.notes || ''
    });

    const { data: savedMember } = await supabase.from('family_members').upsert({
      name: m.name,
      relation: m.relation,
      pan: encPan,
      aadhaar: encAadhaar,
      voter_id: encVoter,
      driving_license: encDl,
      passport: encPassport,
      avatar_url: m.avatar_color || m.avatar_url || '#3b82f6',
      notes: memberNotesMeta,
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

  // 3. Sync Bank Accounts & Snapshots with automated pruning
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

  if (Array.isArray(data.bankAccounts)) {
    // 3a. Reconcile deleted bank accounts from Supabase
    const currentBankIds = new Set(data.bankAccounts.map(b => b.id).filter(Boolean));
    const currentBankKeys = new Set(data.bankAccounts.map(b => {
      const normBank = (b.bank_name || '').trim().toLowerCase();
      const normAcc = (b.account_number || '').trim().slice(-6);
      return `${normBank}_${normAcc}`;
    }));

    for (const eb of decryptedExistingBanks) {
      const ebKey = `${(eb.bank_name || '').trim().toLowerCase()}_${(eb.plainAcc || '').trim().slice(-6)}`;
      if (!currentBankIds.has(eb.id) && !currentBankKeys.has(ebKey)) {
        await supabase.from('bank_snapshots').delete().eq('bank_account_id', eb.id);
        await supabase.from('bank_accounts').delete().eq('id', eb.id);
      }
    }

    // 3b. Upsert remaining bank accounts
    for (const b of data.bankAccounts) {
      const encAcc = await encryptField(b.account_number, encryptionKey);
      const encCust = await encryptField(b.customer_id, encryptionKey);
      const encNetPass = b.netbanking_password ? await encryptField(b.netbanking_password, encryptionKey) : null;
      const memberId = getSupabaseMemberId(b, 'bank');

      const matchedExisting = decryptedExistingBanks.find((eb) => {
        if (eb.bank_name !== b.bank_name) return false;
        if (b.account_number && eb.plainAcc) {
          return eb.plainAcc.slice(-6) === b.account_number.slice(-6);
        }
        return true;
      });

      let bankRecordId = null;

      // Pack pin_hint & netbanking_password into notes as a resilient fallback
      const packedNotes = JSON.stringify({
        notes: b.notes || '',
        pin_hint: b.pin_hint || '',
        netbanking_password: encNetPass || ''
      });

      const bankPayload = {
        bank_name: b.bank_name,
        account_type: b.account_type,
        account_number: encAcc,
        customer_id: encCust,
        branch: b.branch || '',
        netbanking_user: b.netbanking_user || '',
        member_id: memberId,
        notes: packedNotes
      };

      if (matchedExisting) {
        bankRecordId = matchedExisting.id;
        try {
          await supabase.from('bank_accounts').update({
            ...bankPayload,
            pin_hint: b.pin_hint || '',
            netbanking_password: encNetPass
          }).eq('id', bankRecordId);
        } catch {
          await supabase.from('bank_accounts').update(bankPayload).eq('id', bankRecordId);
        }

        const duplicateRows = decryptedExistingBanks.filter(
          eb => eb.id !== bankRecordId && eb.bank_name === b.bank_name &&
          (!b.account_number || !eb.plainAcc || eb.plainAcc.slice(-6) === b.account_number.slice(-6))
        );
        for (const dup of duplicateRows) {
          await supabase.from('bank_snapshots').delete().eq('bank_account_id', dup.id);
          await supabase.from('bank_accounts').delete().eq('id', dup.id);
        }
      } else {
        let insertedBank = null;
        try {
          const res = await supabase.from('bank_accounts').insert({
            ...bankPayload,
            pin_hint: b.pin_hint || '',
            netbanking_password: encNetPass,
            user_id: userId
          }).select().single();
          insertedBank = res.data;
        } catch {
          const res = await supabase.from('bank_accounts').insert({
            ...bankPayload,
            user_id: userId
          }).select().single();
          insertedBank = res.data;
        }

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
  }

  // 4. Sync Immovable Properties with automated pruning
  if (Array.isArray(data.immovableProperties)) {
    const { data: existingProps } = await supabase
      .from('immovable_properties')
      .select('id, premises, title')
      .eq('user_id', userId);

    if (existingProps && existingProps.length > 0) {
      const currentIds = new Set(data.immovableProperties.map(p => p.id).filter(Boolean));
      const currentPremises = new Set(data.immovableProperties.map(p => (p.premises || p.title || '').toLowerCase().trim()).filter(Boolean));
      const staleProps = existingProps.filter(ex => {
        const idMatch = currentIds.has(ex.id);
        const premisesMatch = currentPremises.has((ex.premises || ex.title || '').toLowerCase().trim());
        return !idMatch && !premisesMatch;
      });
      for (const stale of staleProps) {
        await supabase.from('immovable_properties').delete().eq('user_id', userId).eq('id', stale.id);
      }
    }

    for (const p of data.immovableProperties) {
      const memberId = getSupabaseMemberId(p, 'property');
      const propPayload = {
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
      };
      if (p.id && isValidUuid(p.id)) {
        propPayload.id = p.id;
      }
      await supabase.from('immovable_properties').upsert(propPayload, { onConflict: 'user_id,premises' });
    }
  }

  // 5. Sync Investments (EPFO, NPS, Bonds) with automated pruning
  if (Array.isArray(data.investments)) {
    const { data: existingInvs } = await supabase
      .from('investments')
      .select('id, institution')
      .eq('user_id', userId);

    if (existingInvs && existingInvs.length > 0) {
      const currentIds = new Set(data.investments.map(i => i.id).filter(Boolean));
      const currentInsts = new Set(data.investments.map(i => (i.institution || '').toLowerCase().trim()).filter(Boolean));
      const staleInvs = existingInvs.filter(ex => {
        const idMatch = currentIds.has(ex.id);
        const instMatch = currentInsts.has((ex.institution || '').toLowerCase().trim());
        return !idMatch && !instMatch;
      });
      for (const stale of staleInvs) {
        await supabase.from('investments').delete().eq('user_id', userId).eq('id', stale.id);
      }
    }

    for (const inv of data.investments) {
      const encId = await encryptField(inv.account_identifier, encryptionKey);
      const encLoginPass = inv.login_password ? await encryptField(inv.login_password, encryptionKey) : null;
      const memberId = getSupabaseMemberId(inv, 'investment');

      const packedNotes = JSON.stringify({
        notes: inv.notes || '',
        pin_hint: inv.pin_hint || '',
        login_password: encLoginPass || ''
      });

      const invPayload = {
        category: inv.category,
        institution: inv.institution,
        account_identifier: encId,
        cost_value: Number(inv.cost_value || 0),
        current_value: Number(inv.values?.fy_25_26 || inv.values?.fy_24_25 || inv.values?.fy_23_24 || inv.current_value || 0),
        login_user: inv.login_user || '',
        login_password: encLoginPass,
        notes: packedNotes,
        member_id: memberId,
        user_id: userId
      };
      if (inv.id && isValidUuid(inv.id)) {
        invPayload.id = inv.id;
      }
      try {
        await supabase.from('investments').upsert(invPayload, { onConflict: 'user_id,institution' });
      } catch {
        delete invPayload.login_user;
        delete invPayload.login_password;
        await supabase.from('investments').upsert(invPayload, { onConflict: 'user_id,institution' });
      }
    }
  }

  // 5b. Sync Demat Holdings (Stocks & Mutual Funds) with automated pruning
  if (Array.isArray(data.dematHoldings)) {
    try {
      const { data: existingDemat } = await supabase
        .from('demat_holdings')
        .select('id, symbol, name')
        .eq('user_id', userId);

      if (existingDemat && existingDemat.length > 0) {
        const currentIds = new Set(data.dematHoldings.map(h => h.id).filter(Boolean));
        const currentSymbols = new Set(data.dematHoldings.map(h => (h.symbol || '').toUpperCase().trim()).filter(Boolean));
        const currentNames = new Set(data.dematHoldings.map(h => (h.name || '').toLowerCase().trim()).filter(Boolean));

        const staleHoldings = existingDemat.filter(ex => {
          const idMatch = currentIds.has(ex.id);
          const symbolMatch = ex.symbol && currentSymbols.has(ex.symbol.toUpperCase().trim());
          const nameMatch = ex.name && currentNames.has(ex.name.toLowerCase().trim());
          return !idMatch && !symbolMatch && !nameMatch;
        });

        for (const stale of staleHoldings) {
          await supabase.from('demat_holdings').delete().eq('user_id', userId).eq('id', stale.id);
        }
      }

      for (const h of data.dematHoldings) {
        const memberId = getSupabaseMemberId(h, 'demat');
        const holdingPayload = {
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
        };
        if (h.id && isValidUuid(h.id)) {
          holdingPayload.id = h.id;
        }
        await supabase.from('demat_holdings').upsert(holdingPayload, { onConflict: 'user_id,symbol' });
      }
    } catch (e) {
      console.warn('demat_holdings sync notice:', e.message);
    }
  }

  // 6. Sync Insurance Policies with automated pruning
  if (Array.isArray(data.insurancePolicies)) {
    const { data: existingIns } = await supabase
      .from('insurance_policies')
      .select('id, provider, plan_name')
      .eq('user_id', userId);

    if (existingIns && existingIns.length > 0) {
      const currentIds = new Set(data.insurancePolicies.map(i => i.id).filter(Boolean));
      const currentKeys = new Set(data.insurancePolicies.map(i => `${(i.provider || '').toLowerCase().trim()}_${(i.plan_name || '').toLowerCase().trim()}`));
      const staleIns = existingIns.filter(ex => {
        const idMatch = currentIds.has(ex.id);
        const keyMatch = currentKeys.has(`${(ex.provider || '').toLowerCase().trim()}_${(ex.plan_name || '').toLowerCase().trim()}`);
        return !idMatch && !keyMatch;
      });
      for (const stale of staleIns) {
        await supabase.from('insurance_policies').delete().eq('user_id', userId).eq('id', stale.id);
      }
    }

    for (const ins of data.insurancePolicies) {
      const encPolicyNo = await encryptField(ins.policy_no, encryptionKey);
      const memberId = getSupabaseMemberId(ins, 'insurance');
      const insPayload = {
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
      };
      if (ins.id && isValidUuid(ins.id)) {
        insPayload.id = ins.id;
      }
      await supabase.from('insurance_policies').upsert(insPayload, { onConflict: 'user_id,provider,plan_name' });
    }
  }

  // 7. Sync Movable Assets with automated pruning
  if (Array.isArray(data.movableAssets)) {
    const { data: existingMovs } = await supabase
      .from('movable_assets')
      .select('id, item_name')
      .eq('user_id', userId);

    if (existingMovs && existingMovs.length > 0) {
      const currentIds = new Set(data.movableAssets.map(m => m.id).filter(Boolean));
      const currentNames = new Set(data.movableAssets.map(m => (m.item_name || '').toLowerCase().trim()).filter(Boolean));
      const staleMovs = existingMovs.filter(ex => {
        const idMatch = currentIds.has(ex.id);
        const nameMatch = currentNames.has((ex.item_name || '').toLowerCase().trim());
        return !idMatch && !nameMatch;
      });
      for (const stale of staleMovs) {
        await supabase.from('movable_assets').delete().eq('user_id', userId).eq('id', stale.id);
      }
    }

    for (const m of data.movableAssets) {
      const memberId = getSupabaseMemberId(m, 'movable');
      const movPayload = {
        category: m.category,
        item_name: m.item_name,
        year_of_purchase: m.year_of_purchase,
        original_cost: Number(m.original_cost || 0),
        current_value: Number(m.current_value || 0),
        status: m.status,
        notes: m.notes,
        member_id: memberId,
        user_id: userId
      };
      if (m.id && isValidUuid(m.id)) {
        movPayload.id = m.id;
      }
      await supabase.from('movable_assets').upsert(movPayload, { onConflict: 'user_id,item_name' });
    }
  }

  // 8. Sync Liabilities & Expenses with automated pruning
  if (Array.isArray(data.liabilitiesAndExpenses)) {
    const { data: existingLiabs } = await supabase
      .from('liabilities_expenses')
      .select('id, title')
      .eq('user_id', userId);

    if (existingLiabs && existingLiabs.length > 0) {
      const currentIds = new Set(data.liabilitiesAndExpenses.map(l => l.id).filter(Boolean));
      const currentTitles = new Set(data.liabilitiesAndExpenses.map(l => (l.title || '').toLowerCase().trim()).filter(Boolean));
      const staleLiabs = existingLiabs.filter(ex => {
        const idMatch = currentIds.has(ex.id);
        const titleMatch = currentTitles.has((ex.title || '').toLowerCase().trim());
        return !idMatch && !titleMatch;
      });
      for (const stale of staleLiabs) {
        await supabase.from('liabilities_expenses').delete().eq('user_id', userId).eq('id', stale.id);
      }
    }

    for (const l of data.liabilitiesAndExpenses) {
      const liabPayload = {
        category: l.category,
        title: l.title,
        amount: Number(l.amount || 0),
        payment_source: l.payment_source,
        reminder_schedule: l.reminder_schedule,
        notes: l.notes,
        user_id: userId
      };
      if (l.id && isValidUuid(l.id)) {
        liabPayload.id = l.id;
      }
      await supabase.from('liabilities_expenses').upsert(liabPayload, { onConflict: 'user_id,title' });
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

/**
 * Export full decrypted portfolio dataset as a downloadable JSON backup
 */
export const exportToJsonBackup = (data, user) => {
  const exportPayload = {
    app: 'family-asset-vault',
    version: '1.0.0',
    export_date: new Date().toISOString(),
    exported_by: user?.email || 'authenticated_user',
    user_id: user?.id || null,
    data: {
      members: data.members || [],
      financialYears: data.financialYears || [],
      bankAccounts: data.bankAccounts || [],
      investments: data.investments || [],
      dematHoldings: data.dematHoldings || [],
      insurancePolicies: data.insurancePolicies || [],
      immovableProperties: data.immovableProperties || [],
      movableAssets: data.movableAssets || [],
      liabilitiesAndExpenses: data.liabilitiesAndExpenses || []
    }
  };

  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(exportPayload, null, 2)
  )}`;
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', jsonString);
  const dateStr = new Date().toISOString().split('T')[0];
  downloadAnchor.setAttribute('download', `family_vault_backup_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};

/**
 * Import & restore dataset from JSON backup, then sync to Supabase to recreate all records
 */
export const importFromJsonBackup = async (jsonString, user, masterPassword) => {
  const parsed = JSON.parse(jsonString);
  const rawData = parsed.data || parsed;

  if (!rawData || typeof rawData !== 'object') {
    throw new Error('Invalid backup file format.');
  }

  const restoredData = {
    members: rawData.members || [],
    financialYears: rawData.financialYears || [],
    bankAccounts: rawData.bankAccounts || [],
    investments: rawData.investments || [],
    dematHoldings: rawData.dematHoldings || [],
    insurancePolicies: rawData.insurancePolicies || [],
    immovableProperties: rawData.immovableProperties || [],
    movableAssets: rawData.movableAssets || [],
    liabilitiesAndExpenses: rawData.liabilitiesAndExpenses || []
  };

  saveLocalData(restoredData, user);

  if (getSupabaseClient() && user) {
    await syncDataToSupabase(restoredData, user, masterPassword);
  }

  return restoredData;
};
