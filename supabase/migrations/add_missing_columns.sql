-- ===================================================================================
-- OPTIONAL MIGRATION: Add dedicated columns for Bank & Investment Credentials
-- (Note: The application automatically supports these fields via resilient metadata fallback even without running this)
-- ===================================================================================

-- 1. Add credentials columns to bank_accounts table
ALTER TABLE public.bank_accounts ADD COLUMN IF NOT EXISTS netbanking_user TEXT;
ALTER TABLE public.bank_accounts ADD COLUMN IF NOT EXISTS netbanking_password TEXT;
ALTER TABLE public.bank_accounts ADD COLUMN IF NOT EXISTS pin_hint TEXT;

-- 2. Add credentials columns to investments table
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS login_user TEXT;
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS login_password TEXT;
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS pin_hint TEXT;
