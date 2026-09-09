---
name: zero-personal-data
description: >-
  Ensures that no personally identifiable information (PII), real names, email addresses,
  phone numbers, PAN numbers, Aadhaar numbers, financial account credentials, or real personal assets
  are ever hardcoded, committed, or exposed in the codebase or git repositories.
---

# Zero Personal Information (PII) Protection Policy & Skill

This skill enforces strict data privacy, sanitization, and security standards across the codebase. It guarantees that no personal or sensitive data is committed to Git or exposed publicly.

## 1. Prohibited Information in Codebase

Under no circumstances should the following data types be hardcoded or committed into code, comments, documentation, or mock files:
1. **Real Names & Family Identities**: Do not hardcode specific individual, spouse, parent, child, or HUF names. Use generic identifiers such as `"Primary Member"`, `"Member HUF"`, `"Spouse"`, or `"Sample Family"`.
2. **Tax & National Identity Numbers**:
   - Indian Permanent Account Numbers (PAN) format: `[A-Z]{5}[0-9]{4}[A-Z]`
   - Aadhaar numbers: 12-digit national IDs
   - Passport numbers, Voter IDs, PRAN / NPS numbers
3. **Contact Details**:
   - Personal phone numbers, mobile numbers
   - Personal or corporate email addresses (use `user@example.com` or placeholders)
4. **Financial & Security Credentials**:
   - Plaintext passwords, netbanking passwords, ATM/card PINs, PIN hints
   - Bank account numbers, demat account numbers, policy numbers (must be encrypted client-side via user's master password before storing in Supabase)
   - Supabase `service_role` secret keys (only public `anon` keys are permitted in client builds)
5. **Real Asset & Balance Figures in Source**:
   - Avoid hardcoding real portfolio balances or personal financial amounts in mock data.

## 2. Pre-Commit Verification Checklist

Before staging or committing code to Git:
1. **Grep / Search Staged Diffs**:
   - Search for common name strings, email domains, phone patterns.
   - Run regex checks:
     ```bash
     git diff --cached | grep -Ei "([A-Z]{5}[0-9]{4}[A-Z]|@gmail\.com|@yahoo\.com|[0-9]{10})"
     ```
2. **Review Comments & Docstrings**:
   - Check that function explanations and inline comments use generic terms instead of real person names (e.g. use "Primary Member" rather than a real name).
3. **Inspect Migration Scripts & Seed Data**:
   - Verify that any `.sql` or seed files do not contain personal records or actual dump data.
4. **Build & Bundler Output**:
   - Ensure source maps or environment files do not bundle `.env.local` containing secrets.

## 3. Storage and Encryption Architecture

- All user data must be entered dynamically by the user at runtime.
- Sensitive fields (`account_no`, `policy_no`, `folio_no`, `login_password`, `pin_hint`, etc.) must be encrypted client-side using `AES-GCM` (`crypto.subtle`) with the user's master password before persistence.
- Supabase Row Level Security (RLS) must isolate rows by `user_id = auth.uid()`.
