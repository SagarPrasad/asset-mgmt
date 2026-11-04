---
name: github-commit-and-deploy
description: >-
  Standard operating procedure to verify Zero-PII safety, run production build validation,
  commit changes to Git with conventional commit formatting, push to GitHub, and deploy to GitHub Pages.
---

# GitHub Commit & Deployment Standard Operating Procedure (SOP)

This skill automates and standardizes the process of committing code and deploying the **Family Asset Vault** application to GitHub and GitHub Pages (`gh-pages`).

---

## Pre-Commit Verification (Crucial Safety Gates)

Before running any Git commit or deployment commands:

### 1. Zero Personal Data (PII) Check
Ensure no real identities, real account credentials, passwords, or personal details are exposed:
```bash
git diff --cached | grep -Ei "([A-Z]{5}[0-9]{4}[A-Z]|@gmail\.com|@yahoo\.com|[0-9]{10})"
```
*If any match is found, immediately unstage, sanitize the file, and replace with generic placeholders.*

### 2. Verify `.env` & Secrets Are Not Staged
Ensure `.env`, `.env.local`, or raw Supabase secret keys are never tracked:
```bash
git status --short
```
Verify no `.env*` or `*.xlsx` files are marked for staging.

### 3. Production Build Validation
Always test that the production build compiles cleanly without syntax or bundling errors:
```bash
npm run build
```
Do not proceed if the build fails.

### 4. Update README.md (Mandatory Before Every Commit)
Before committing, always review and update `README.md` to ensure it reflects:
- All newly added features, modals, or capabilities
- Any new database tables, columns, or Supabase migration scripts
- Any changes to security, encryption, or permissions
- Accurate application module descriptions and setup steps

---

## Git Commit Workflow

### 1. Stage Validated Files
Stage files cleanly (avoid staging temporary cache or unneeded binaries):
```bash
git add src/ supabase/ index.html package.json package-lock.json vite.config.js README.md .agents/
```

### 2. Format Conventional Commit Message
Use standard Conventional Commits:
- `feat:` for new capabilities (e.g. `feat: add 5-point BLOB data snapshots and family sharing RLS`)
- `fix:` for bug fixes
- `refactor:` for code restructuring without feature change
- `chore:` for build, dependency, or documentation updates

Example:
```bash
git commit -m "feat: add 5-point BLOB data snapshots and shared family vault access"
```

---

## GitHub Push & Deployment Workflow

### 1. Push to Remote Main Branch
Push commits to the central GitHub repository:
```bash
git push origin main
```

### 2. Deploy to GitHub Pages
Trigger the automated GitHub Pages build & deployment:
```bash
npm run deploy
```
*(This automatically runs `npm run predeploy` / `vite build` and deploys the `dist/` directory to the `gh-pages` branch).*

### 3. Verify Live Deployment
Ensure GitHub Pages is updated and accessible at the repository's published URL:
- `https://<github-username>.github.io/<repo-name>/`
