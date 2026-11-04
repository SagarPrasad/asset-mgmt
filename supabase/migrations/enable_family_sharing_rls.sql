-- ===================================================================================
-- Migration: Enable Shared Family Vault Access & Settings Table
-- Run this in the Supabase SQL Editor
-- ===================================================================================

-- 1. Shared Vault Configuration Table (stores whitelist, verifier hash, and primary holder info)
CREATE TABLE IF NOT EXISTS public.vault_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on vault_settings
ALTER TABLE public.vault_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated family users to read & write shared settings
DROP POLICY IF EXISTS "Family shared settings access" ON public.vault_settings;
CREATE POLICY "Family shared settings access" ON public.vault_settings
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- 2. Update Row Level Security (RLS) on all family tables to allow shared family access
DO $$ 
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
        AND tablename IN (
            'family_members',
            'financial_years',
            'bank_accounts',
            'bank_snapshots',
            'investments',
            'demat_holdings',
            'insurance_policies',
            'immovable_properties',
            'movable_assets',
            'liabilities_expenses',
            'vault_data_snapshots'
        )
    LOOP
        -- Drop legacy single-user restrictive policies if they exist
        EXECUTE format('DROP POLICY IF EXISTS "Users can manage their own %s" ON public.%I', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Users can manage their own %s" ON public.%I', 
            CASE 
                WHEN tbl = 'financial_years' THEN 'FYs'
                WHEN tbl = 'immovable_properties' THEN 'immovable properties'
                WHEN tbl = 'movable_assets' THEN 'movable assets'
                WHEN tbl = 'insurance_policies' THEN 'insurance policies'
                WHEN tbl = 'liabilities_expenses' THEN 'liabilities'
                WHEN tbl = 'demat_holdings' THEN 'demat holdings'
                WHEN tbl = 'vault_data_snapshots' THEN 'snapshots'
                ELSE tbl 
            END, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Family shared access on %s" ON public.%I', tbl, tbl);
        
        -- Create clean shared family access policy for authenticated users
        EXECUTE format('CREATE POLICY "Family shared access on %s" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', tbl, tbl);
    END LOOP;
END $$;

