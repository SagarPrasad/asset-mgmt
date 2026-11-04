# 🏦 Family Asset Vault

A secure, private, client-side encrypted family wealth, asset management, multi-user family sharing portal, and ITR Schedule AL tracking application built for Indian families.

---

## 🌟 Key Highlights & Architecture

- **Zero Personal Data in Code**: The codebase contains only generic template schemas. All personal records are loaded securely & dynamically from your Supabase PostgreSQL database at runtime.
- **Client-Side AES-256-GCM Encryption**: All sensitive identity numbers (PAN, Aadhaar, Voter ID, Driving License, Passport), bank account numbers, netbanking credentials, Demat account identifiers, and insurance policy numbers are encrypted in your browser with your Master Password using PBKDF2 with 100,000 iterations and Web Crypto API.
- **Multi-User Family Sharing & Unified Vault**: Authorize multiple family member Gmail accounts under a shared family vault. All authorized family members can log in with their own Google accounts and view or update the family portfolio without data silos.
- **5-Point Rolling Data Snapshots in Binary BLOB Format**: Take point-in-time backups saved in a separate table (`public.vault_data_snapshots`) as binary `BYTEA` BLOBs and in browser storage. Restore to any of the last 5 checkpoints with a single click, protected by an automated pre-restore safety checkpoint.
- **Cloud-Synced Whitelist & Settings**: Centralized `public.vault_settings` table synchronizes authorized family Gmail accounts, primary vault holder identity, and zero-knowledge password verifier tokens across all devices.
- **Device & Mobile Pairing Link**: Instant pairing via QR code or `#connect=...` link that transfers database configuration, whitelist, and verification hashes directly to other browsers or phones.
- **Single-Click Next Financial Year Roll-Forward**: Add a new FY (`FY 2026-27`, `FY 2027-28`, etc.) with 1 click, automatically copying ending balances and stock/MF valuations while resetting annual interest.
- **Live Stock & Mutual Fund Market Prices**: Direct AMFI API integration (`api.mfapi.in`) for instant live mutual fund NAV updates, plus Indian stock exchange quotes (NSE) with real-time Unrealized Gain / Loss and return % calculation.
- **Automated Insurance Reminders**: Automatic renewal alerts for policies due within 45 days upon vault unlock and a notification bell with countdown badges.
- **ITR Schedule AL Compliance**: 1-click printable and PDF exportable Schedule AL report formatted to Indian Income Tax Department guidelines.
- **Full Excel & JSON Import/Export**: Export the entire portfolio to a multi-tab Excel workbook (`Portfolio_Summary`, `Bank_Accounts`, `Demat_Holdings`) or full portable JSON backups.

---

## 🚀 Quick Start

### 1. Install Dependencies & Run Locally
```bash
# Install packages
npm install

# Start Vite dev server
npm run dev
```
The application will be live at `http://localhost:5173`.

### 2. Connect Supabase & Google Sign-In
1. Follow the step-by-step setup guide in [GOOGLE_LOGIN_AND_SUPABASE_SETUP.md](./GOOGLE_LOGIN_AND_SUPABASE_SETUP.md).
2. Execute the base schema in [supabase/schema.sql](./supabase/schema.sql) in your Supabase SQL Editor.
3. Open `http://localhost:5173`, click **Settings / Config**, enter your Supabase URL and Anon Key, and sign in with your authorized Google Account.

---

## 🛡️ Security & Privacy Architecture

```
User -> Google OAuth -> Cloud Whitelist Check -> Master Password Challenge -> AES-256 Decryption In-Memory
```

| Security Layer | Implementation Details |
| :--- | :--- |
| **Authentication** | Supabase Auth with Google OAuth 2.0 provider |
| **Authorization** | Whitelisted family Gmail accounts synchronized in `vault_settings`; unauthorized users blocked |
| **Data Encryption** | AES-GCM 256-bit with PBKDF2 key derivation (100,000 rounds) |
| **Disaster Recovery** | 5-point rolling binary BLOB snapshots in `vault_data_snapshots` with primary account restore/delete |
| **Credentials Protection** | Netbanking passwords & PINs masked by default; revealed via eye icon (👁️) with Master Password |
| **Source Code Privacy** | `src/data/seedData.js` contains zero user records. `.gitignore` strictly ignores spreadsheets and secrets |

---

## 📁 Application Modules

### 1. Executive Overview (`src/components/OverviewTab.jsx`)
- Multi-year financial timeline comparison (`FY 2023-24`, `FY 2024-25`, `FY 2025-26`, `FY 2026-27`).
- Total Net Worth, Bank Balances, Demat & Retirement valuations, Real Estate, and Outflows.
- **Family Member Identity Vault**: PAN, Aadhaar, Voter ID, Driving License, and Passport with toggle masking.

### 2. Bank Balances & Term Deposits (`src/components/BankSection.jsx`)
- Year-end balances and interest acquired per financial year.
- Protected netbanking credentials with 1-click copy for customer IDs, usernames, and passwords.
- Real-time family entity filtering (All Family, individual members, HUF entity).

### 3. Demat Portfolio & Retirement Assets (`src/components/InvestmentSection.jsx`)
- **Demat Stocks & Mutual Funds**: Tracks symbol, units, avg buy cost, invested amount, live market price, current value, and unrealized P&L.
- **AMFI Live NAV Integration**: Search mutual fund schemes and fetch live daily NAVs via `marketPriceService.js`.
- **Retirement Funds**: EPFO, NPS Tier-1 PRAN, corporate bonds, and fixed income.

### 4. Insurance Portfolio (`src/components/InsuranceSection.jsx`)
- Life insurance, term coverage, endowment plans, and family health floater policies.
- Sum insured coverage, annual premium outflows, and renewal due date countdowns.
- Automatic reminder popups upon vault unlock for policies due within 45 days.

### 5. Immovable Properties (`src/components/PropertySection.jsx`)
- Residential flats, land, and under-construction real estate holdings.
- Acquisition cost, estimated market valuation, occupancy description, and co-ownership breakdown.

### 6. Movable Physical Assets (`src/components/MovableSection.jsx`)
- Vehicles, precious bullion, diamond jewelry, fine artwork, and vault cash reserves.
- Categorized filtering and acquisition cost tracking.

### 7. Liabilities & Commitments (`src/components/LiabilitySection.jsx`)
- Outstanding car/home loans, recurring household maintenance, EMIs, and auto-debit accounts.

### 8. ITR Schedule AL Report (`src/components/ScheduleALView.jsx`)
- Tax-compliant Schedule AL statement as of March 31st.
- Direct 1-click print / save to PDF functionality.

### 9. Data Snapshots & 5-Point Rollback (`src/components/SnapshotManagerModal.jsx`)
- Point-in-time disaster recovery checkpoints stored in `public.vault_data_snapshots` table as binary `BYTEA` BLOBs.
- Primary Account only controls for rollback and snapshot deletion.
- Automated pre-restore safety checkpoint ensures zero accidental data loss.

---

## 🗄️ Database Migrations & Supabase Maintenance

All database scripts are maintained in the [`supabase/`](./supabase/) folder:
- `supabase/schema.sql`: Full baseline relational schema with Row Level Security (RLS) policies and `vault_settings`.
- `supabase/migrations/add_vault_snapshots_table.sql`: Creates `public.vault_data_snapshots` table with binary `BYTEA` BLOB column.
- `supabase/migrations/enable_family_sharing_rls.sql`: Enables shared family vault access and creates `public.vault_settings`.
- `supabase/drop_all_tables.sql`: Clean database wipe script if you ever wish to recreate tables from scratch.
