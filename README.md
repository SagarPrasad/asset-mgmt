# 🏦 Family Asset Vault

A secure, private, client-side encrypted family wealth, asset management, and ITR Schedule AL tracking application built for Indian families.

---

## 🌟 Key Highlights & Architecture

- **Zero Personal Data in Code**: The codebase contains only generic template schemas. All personal records are loaded securely & dynamically from your Supabase PostgreSQL database at runtime.
- **Client-Side AES-256-GCM Encryption**: All sensitive identity numbers (PAN, Aadhaar, Voter ID, Driving License, Passport), bank account numbers, netbanking credentials, Demat account identifiers, and insurance policy numbers are encrypted in your browser with your Master Password using PBKDF2 with 100,000 iterations and Web Crypto API.
- **Multi-Layer Authentication**: Google OAuth 2.0 sign-in combined with an email whitelist check, followed by an in-browser Master Vault Password challenge.
- **Single-Click Next Financial Year Roll-Forward**: Add a new FY (`FY 2026-27`, `FY 2027-28`, etc.) with 1 click, automatically copying ending balances and stock/MF valuations while resetting annual interest.
- **Live Stock & Mutual Fund Market Prices**: Direct AMFI API integration (`api.mfapi.in`) for instant live mutual fund NAV updates, plus Indian stock exchange quotes (NSE) with real-time Unrealized Gain / Loss and return % calculation.
- **Automated Insurance Reminders**: Automatic renewal alerts for policies due within 45 days upon vault unlock and a notification bell with countdown badges.
- **ITR Schedule AL Compliance**: 1-click printable and PDF exportable Schedule AL report formatted to Indian Income Tax Department guidelines.
- **Full Excel Import/Export**: Export the entire portfolio to a multi-tab workbook (`Portfolio_Summary`, `Bank_Accounts`, `Demat_Holdings`) matching standard asset management spreadsheets.

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
User -> Google OAuth -> Whitelist Verification -> Master Password Challenge -> AES-256 Decryption In-Memory
```

| Security Layer | Implementation Details |
| :--- | :--- |
| **Authentication** | Supabase Auth with Google OAuth 2.0 provider |
| **Authorization** | Whitelisted Gmail accounts only; unauthorized users blocked |
| **Data Encryption** | AES-GCM 256-bit with PBKDF2 key derivation (100,000 rounds) |
| **Credentials Protection** | Netbanking passwords & PINs masked by default; revealed via eye icon (👁️) with Master Password |
| **Source Code Privacy** | `src/data/seedData.js` contains zero user records. `.gitignore` strictly ignores spreadsheets and secrets |

---

## 📁 Application Modules

### 1. Executive Overview (`src/components/OverviewTab.jsx`)
- Multi-year financial timeline comparison (`FY 2023-24`, `FY 2024-25`, `FY 2025-26`).
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

---

## 🗄️ Database Migrations & Supabase Maintenance

All database scripts are maintained in the [`supabase/`](./supabase/) folder:
- `supabase/schema.sql`: Full baseline relational schema with Row Level Security (RLS) policies.
- `supabase/drop_all_tables.sql`: Clean database wipe script if you ever wish to recreate tables from scratch.
- `supabase/migrations/20260905_cleanup_duplicates.sql`: Cleanup migration to deduplicate existing rows and ensure foreign key linkage.
