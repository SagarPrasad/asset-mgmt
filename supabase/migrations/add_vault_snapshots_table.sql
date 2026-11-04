-- ===================================================================================
-- Migration: Add Dedicated Vault Data Snapshots Table in Binary BLOB Format
-- Run this in the Supabase SQL Editor
-- ===================================================================================

CREATE TABLE IF NOT EXISTS public.vault_data_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    summary JSONB,
    blob_data BYTEA NOT NULL, -- Binary BLOB payload of complete portfolio snapshot
    byte_size INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.vault_data_snapshots ENABLE ROW LEVEL SECURITY;

-- Allow authenticated family users to view, create, and manage snapshots
DROP POLICY IF EXISTS "Family shared snapshots access" ON public.vault_data_snapshots;
CREATE POLICY "Family shared snapshots access" ON public.vault_data_snapshots
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);
