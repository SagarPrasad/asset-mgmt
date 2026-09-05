// Dynamic Excel Parser & Clean Template Service
// ZERO personal or user-identifiable data is stored in the codebase.
// All financial records are loaded dynamically from Supabase or parsed at runtime from user-uploaded files.

import * as XLSX from 'xlsx';

export const getCleanWorkbookData = () => ({
  members: [],
  financialYears: [
    { id: 'fy_23_24', label: 'FY 2023-24', as_on_date: '2024-03-31', is_current: false },
    { id: 'fy_24_25', label: 'FY 2024-25', as_on_date: '2025-03-31', is_current: false },
    { id: 'fy_25_26', label: 'FY 2025-26', as_on_date: '2026-03-31', is_current: true }
  ],
  bankAccounts: [],
  investments: [],
  dematHoldings: [],
  insurancePolicies: [],
  immovableProperties: [],
  movableAssets: [],
  liabilitiesAndExpenses: []
});

/**
 * Dynamic browser-based parser for user-uploaded .xlsx spreadsheet files.
 * Parses sheets at runtime directly in browser memory without storing any data to disk or git.
 */
export const parseUploadedExcel = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const result = parseWorkbookData(workbook);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Dynamically parse sheets from an uploaded XLSX Workbook instance
 */
function parseWorkbookData(wb) {
  const result = getCleanWorkbookData();

  // 1. Detect family members from sheet names
  const detectedMembers = [];
  const systemSheets = ['20-25', '26', 'LOANS', 'SHEET1', 'SUMMARY', 'HUF'];

  for (const sheetName of wb.SheetNames) {
    const clean = sheetName.trim();
    if (!systemSheets.includes(clean.toUpperCase())) {
      const id = 'mem_' + clean.toLowerCase().replace(/[^a-z0-9]/g, '_');
      detectedMembers.push({
        id,
        name: clean,
        relation: detectedMembers.length === 0 ? 'Self' : 'Family Member',
        pan: '',
        aadhaar: '',
        voter_id: '',
        driving_license: '',
        passport: '',
        demat_info: '',
        pran: '',
        avatar_color: detectedMembers.length === 0 ? '#3b82f6' : (detectedMembers.length === 1 ? '#ec4899' : '#a855f7')
      });
    }
  }

  // Check for HUF sheet
  if (wb.SheetNames.some(s => s.trim().toUpperCase() === 'HUF')) {
    detectedMembers.push({
      id: 'mem_huf',
      name: 'Family HUF',
      relation: 'HUF Entity',
      pan: '',
      aadhaar: 'N/A',
      voter_id: 'N/A',
      driving_license: 'N/A',
      passport: 'N/A',
      demat_info: '',
      pran: '',
      avatar_color: '#f59e0b'
    });
  }

  result.members = detectedMembers;
  const primaryMemberId = detectedMembers[0]?.id || 'mem_primary';

  // 2. Parse Sheets
  for (const sheetName of wb.SheetNames) {
    const sheet = wb.Sheets[sheetName];
    if (!sheet) continue;
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    if (!rows || rows.length === 0) continue;

    const sheetUpper = sheetName.trim().toUpperCase();

    // Parse Primary / 23-24 Sheet
    if (!['20-25', '26', 'LOANS', 'HUF'].includes(sheetUpper)) {
      parseMainSheetRows(rows, sheetName, primaryMemberId, result);
    }

    // Parse Multi-Year Snapshots (20-25 and 26 sheets)
    if (sheetUpper === '20-25' || sheetUpper === '24-25') {
      parseYearSnapshots(rows, 'fy_24_25', result);
    }
    if (sheetUpper === '26' || sheetUpper === '25-26') {
      parseYearSnapshots(rows, 'fy_25_26', result);
    }

    // Parse Loans & Expenses Sheet
    if (sheetUpper === 'LOANS' || sheetUpper.includes('EXPENSE')) {
      parseLoansSheet(rows, result);
    }
  }

  return result;
}

function parseMainSheetRows(rows, sheetName, memberId, result) {
  let section = '';

  rows.forEach((r, idx) => {
    if (!r || r.length === 0) return;
    const firstCell = String(r[0] || '').trim();

    if (firstCell.includes('Bank') && firstCell.includes('deposit')) section = 'bank';
    else if (firstCell.includes('Shares and Securities')) section = 'shares';
    else if (firstCell.includes('Insurance policies')) section = 'insurance';
    else if (firstCell.includes('Immovable assets')) section = 'immovable';
    else if (firstCell.includes('Assets') && r[1] === 'Year of Purchase') section = 'movable';
    else if (firstCell.includes('Bank (23-24)') || firstCell.includes('Bank Account')) section = 'bank_table';

    // Parse Bank Rows
    if (section === 'bank_table' && firstCell && !firstCell.includes('Bank') && !firstCell.includes('Credit Card')) {
      const bankName = firstCell;
      const accountDesc = String(r[1] || '');
      const accMatch = accountDesc.match(/\d{6,}/);
      const accNum = accMatch ? accMatch[0] : '';
      const balance = Number(r[2] || 0);
      const interest = Number(r[3] || 0);
      const custId = String(r[4] || '');

      if (bankName.length > 2) {
        const id = 'bank_' + bankName.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + idx;
        result.bankAccounts.push({
          id,
          member_id: memberId,
          bank_name: bankName,
          account_type: bankName.toLowerCase().includes('salary') ? 'Salary Account' : 'Savings Account',
          account_number: accNum,
          customer_id: custId,
          netbanking_user: String(r[5] || ''),
          netbanking_password: '',
          pin_hint: String(r[6] || ''),
          branch: '',
          snapshots: {
            fy_23_24: { balance, interest_acquired: interest, investments_linked: 0 },
            fy_24_25: { balance: 0, interest_acquired: 0, investments_linked: 0 },
            fy_25_26: { balance: 0, interest_acquired: 0, investments_linked: 0 }
          }
        });
      }
    }

    // Parse Insurance Rows
    if (firstCell.length > 2 && (section === 'insurance' || r[1] && String(r[1]).match(/^\d{6,}$/))) {
      const policyNo = String(r[1] || '');
      if (policyNo.match(/^\d{6,}$/)) {
        result.insurancePolicies.push({
          id: 'ins_' + policyNo,
          member_id: memberId,
          provider: String(r[2] || 'Insurance Provider'),
          plan_name: String(r[2] || 'Policy'),
          policy_no: policyNo,
          annual_premium: Number(r[3] || 0),
          sum_insured: Number(String(r[4] || '0').replace(/[^0-9]/g, '')),
          status: String(r[5] || '').toLowerCase().includes('paid') ? 'All Paid Up' : 'Active',
          payment_mode: String(r[5] || 'Annual'),
          premium_date: String(r[6] || '')
        });
      }
    }

    // Parse Immovable Property
    if (r[1] && typeof r[1] === 'number' && r[1] > 100000 && r[2] && r[3]) {
      result.immovableProperties.push({
        id: 'prop_' + idx,
        title: String(r[3] || 'Property'),
        description: String(r[0] || 'Real Estate Asset'),
        cost_amount: Number(r[1] || 0),
        current_valuation: Number(r[1] || 0),
        door_no: String(r[2] || ''),
        premises: String(r[3] || ''),
        road: String(r[4] || ''),
        area: String(r[5] || ''),
        city: String(r[6] || ''),
        state: String(r[7] || ''),
        country: String(r[8] || 'India'),
        pincode: String(r[9] || '')
      });
    }

    // Parse Movable Assets
    if (r[1] && typeof r[1] === 'number' && r[1] >= 1990 && r[1] <= 2030 && r[2]) {
      result.movableAssets.push({
        id: 'mov_' + idx,
        member_id: memberId,
        category: 'Vehicles / Boats etc.',
        item_name: String(r[0] || 'Vehicle'),
        year_of_purchase: Number(r[1]),
        original_cost: Number(r[2] || 0),
        current_value: Number(r[3] || 0),
        status: String(r[4] || '').toUpperCase() === 'SOLD' ? 'Sold' : 'Active'
      });
    }
  });
}

function parseYearSnapshots(rows, fyKey, result) {
  rows.forEach((r) => {
    if (!r || r.length === 0) return;
    const name = String(r[0] || '').toLowerCase();
    const balance = Number(r[2] || 0);
    const interest = Number(r[3] || 0);

    // Match existing bank account by name prefix
    const matchedBank = result.bankAccounts.find(b => {
      const bName = b.bank_name.toLowerCase();
      return bName.includes(name) || name.includes(bName.slice(0, 4));
    });

    if (matchedBank && matchedBank.snapshots) {
      matchedBank.snapshots[fyKey] = {
        balance: balance || matchedBank.snapshots[fyKey]?.balance || 0,
        interest_acquired: interest || 0,
        investments_linked: Number(r[4] || 0)
      };
    }
  });
}

function parseLoansSheet(rows, result) {
  rows.forEach((r, idx) => {
    if (!r || r.length === 0) return;
    const title = String(r[0] || '').trim();
    const amount = Number(r[1] || 0);

    if (title && amount > 0) {
      result.liabilitiesAndExpenses.push({
        id: 'exp_' + idx,
        category: amount > 50000 ? 'Loans & Liabilities' : 'Fixed Monthly Expenditure',
        title,
        amount,
        payment_source: String(r[2] || ''),
        reminder_schedule: String(r[3] || 'Monthly')
      });
    }
  });
}
