// Clean Architecture Template Data (Zero Personal / User Data)
// All user financial records are loaded securely & dynamically from Supabase at runtime.

export const INITIAL_FINANCIAL_YEARS = [
  { id: 'fy_23_24', label: 'FY 2023-24', as_on_date: '2024-03-31', is_current: false },
  { id: 'fy_24_25', label: 'FY 2024-25', as_on_date: '2025-03-31', is_current: false },
  { id: 'fy_25_26', label: 'FY 2025-26', as_on_date: '2026-03-31', is_current: true }
];

export const INITIAL_FAMILY_MEMBERS = [];
export const INITIAL_BANK_ACCOUNTS = [];
export const INITIAL_INVESTMENTS = [];
export const INITIAL_DEMAT_HOLDINGS = [];
export const INITIAL_INSURANCE_POLICIES = [];
export const INITIAL_IMMOVABLE_PROPERTIES = [];
export const INITIAL_MOVABLE_ASSETS = [];
export const INITIAL_LIABILITIES_AND_EXPENSES = [];
