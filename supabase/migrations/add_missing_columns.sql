-- ===================================================================================
-- OPTIONAL MIGRATION: Add dedicated columns for Bank PIN Hints & Netbanking Passwords
-- (Note: The application automatically supports these fields via resilient metadata fallback even without running this)
-- ===================================================================================

-- 1. Add pin_hint and netbanking_password to bank_accounts table
ALTER TABLE public.bank_accounts ADD COLUMN IF NOT EXISTS pin_hint TEXT;
ALTER TABLE public.bank_accounts ADD COLUMN IF NOT EXISTS netbanking_password TEXT;

-- 2. Add pin_hint to investments table
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS pin_hint TEXT;
