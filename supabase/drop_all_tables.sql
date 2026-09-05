-- ===================================================================================
-- DROP ALL TABLES IN FAMILY ASSET VAULT
-- Run this in the Supabase SQL Editor to completely wipe and reset the schema.
-- ===================================================================================

DROP TABLE IF EXISTS public.demat_holdings CASCADE;
DROP TABLE IF EXISTS public.bank_snapshots CASCADE;
DROP TABLE IF EXISTS public.investments CASCADE;
DROP TABLE IF EXISTS public.insurance_policies CASCADE;
DROP TABLE IF EXISTS public.immovable_properties CASCADE;
DROP TABLE IF EXISTS public.movable_assets CASCADE;
DROP TABLE IF EXISTS public.liabilities_expenses CASCADE;
DROP TABLE IF EXISTS public.bank_accounts CASCADE;
DROP TABLE IF EXISTS public.financial_years CASCADE;
DROP TABLE IF EXISTS public.family_members CASCADE;
