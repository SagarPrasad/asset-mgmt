-- ===================================================================================
-- FAMILY ASSET VAULT - COMPLETE CLEAN SUPABASE POSTGRESQL SCHEMA
-- Fully compatible with Supabase Auth (Google OAuth), RLS, and Anti-Duplication Constraints
-- ===================================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Family Members / Entities
CREATE TABLE IF NOT EXISTS public.family_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    relation TEXT NOT NULL DEFAULT 'Self', -- Self, Spouse, Child, HUF, Parent
    pan TEXT,
    aadhaar TEXT,
    voter_id TEXT,
    driving_license TEXT,
    passport TEXT,
    avatar_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- 2. Financial Years (FY 2023-24, FY 2024-25, etc.)
CREATE TABLE IF NOT EXISTS public.financial_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    label TEXT NOT NULL, -- e.g. 'FY 2023-24'
    as_on_date DATE NOT NULL, -- e.g. '2024-03-31'
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, label)
);

-- 3. Bank Accounts
CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
    bank_name TEXT NOT NULL,
    account_type TEXT NOT NULL DEFAULT 'Savings', -- Savings, Salary, Demat Linked, Current, FD
    account_number TEXT,
    customer_id TEXT,
    branch TEXT,
    netbanking_user TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, bank_name, account_number)
);

-- 4. Yearly Bank Snapshots (Balances & Interest)
CREATE TABLE IF NOT EXISTS public.bank_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
    fy_id TEXT NOT NULL, -- 'fy_23_24', 'fy_24_25', etc.
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    interest_acquired NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    investments_linked NUMERIC(15, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(bank_account_id, fy_id)
);

-- 5. Demat & Retirement Investments (Stocks, EPFO, NPS, Fixed Income)
CREATE TABLE IF NOT EXISTS public.investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
    fy_id UUID REFERENCES public.financial_years(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- 'Demat / Shares', 'EPFO', 'NPS', 'Fixed Income / Bonds'
    institution TEXT NOT NULL, -- 'Demat Account', 'EPFO', 'NPS', 'Fixed Income'
    account_identifier TEXT, -- PRAN, UAN, Demat A/C No
    cost_value NUMERIC(15, 2) DEFAULT 0.00,
    current_value NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, institution)
);

-- 5b. Individual Demat Holdings (Stocks, Mutual Funds, ETFs)
CREATE TABLE IF NOT EXISTS public.demat_holdings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
    symbol TEXT NOT NULL, -- e.g. 'RELIANCE', '122639' (AMFI Scheme Code)
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Equity / Stocks', -- 'Equity / Stocks', 'Mutual Fund', 'ETF / Bullion'
    exchange TEXT DEFAULT 'NSE', -- 'NSE', 'BSE', 'AMFI'
    units NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    invested_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    avg_buy_price NUMERIC(15, 2) DEFAULT 0.00,
    current_price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    current_value NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, symbol)
);

-- 6. Insurance Policies
CREATE TABLE IF NOT EXISTS public.insurance_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
    provider TEXT NOT NULL, -- LIC, MAX-LIFE, TATA AIA, NIVA BUPA
    plan_name TEXT NOT NULL,
    policy_no TEXT,
    annual_premium NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    sum_insured NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    premium_date TEXT, -- e.g. '23-MAY', '19-July', '18-SEP'
    payment_mode TEXT DEFAULT 'Auto Debit', -- Auto Debit, Yearly, Paid Up
    status TEXT DEFAULT 'Active', -- Active, All Paid Up, Matured
    reminder_enabled BOOLEAN DEFAULT TRUE,
    reminder_days INTEGER DEFAULT 30,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, provider, plan_name)
);

-- 7. Immovable Assets (Real Estate)
CREATE TABLE IF NOT EXISTS public.immovable_properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL, -- Staying in this one, Rented, Under Construction
    premises TEXT NOT NULL, -- 'Premises / Apartment / Plot Name'
    door_no TEXT,
    road TEXT,
    area TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    country TEXT DEFAULT 'India',
    pincode TEXT,
    cost_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    current_valuation NUMERIC(15, 2) DEFAULT 0.00,
    co_ownership TEXT, -- 'Co-Owned', 'Individual'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, premises)
);

-- 8. Movable Physical Assets (Vehicles, Jewellery, Art, Cash)
CREATE TABLE IF NOT EXISTS public.movable_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
    fy_id TEXT, -- 'fy_25_26'
    category TEXT NOT NULL, -- 'Vehicles', 'Jewellery & Bullion', 'Paintings & Art', 'Cash in Hand'
    item_name TEXT NOT NULL, -- 'Vehicle Name', 'Jewellery', 'Cash'
    year_of_purchase INTEGER,
    original_cost NUMERIC(15, 2) DEFAULT 0.00,
    current_value NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    status TEXT DEFAULT 'Active', -- Active, Sold
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, item_name)
);

-- 9. Liabilities & Fixed Monthly / Yearly Expenses
CREATE TABLE IF NOT EXISTS public.liabilities_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- 'Loan', 'Fixed Monthly Expenditure', 'Yearly Expenditure'
    title TEXT NOT NULL, -- 'Car Loan EMI', 'Home Loan', 'Cloud Storage', 'Subscriptions'
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    payment_source TEXT, -- 'Bank Account', 'Credit Card', 'UPI'
    reminder_schedule TEXT, -- '20th every month', '1st week'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, title)
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demat_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.immovable_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movable_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liabilities_expenses ENABLE ROW LEVEL SECURITY;

-- Allow users to read & manage only their own data
CREATE POLICY "Users can manage their own family members" ON public.family_members FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can manage their own FYs" ON public.financial_years FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can manage their own bank accounts" ON public.bank_accounts FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can manage their own bank snapshots" ON public.bank_snapshots FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can manage their own investments" ON public.investments FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can manage their own demat holdings" ON public.demat_holdings FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can manage their own insurance policies" ON public.insurance_policies FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can manage their own immovable properties" ON public.immovable_properties FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can manage their own movable assets" ON public.movable_assets FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can manage their own liabilities" ON public.liabilities_expenses FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);
