// Access Control & Master Vault Password Configuration

const WHITELIST_KEY = 'family_vault_authorized_emails';
const PASSWORD_VERIFY_KEY = 'family_vault_pwd_verifier';
const PRIMARY_HOLDER_KEY = 'family_vault_primary_holder_email';

export const DEFAULT_AUTHORIZED_EMAILS = [
  ...(import.meta.env.VITE_AUTHORIZED_EMAILS 
    ? import.meta.env.VITE_AUTHORIZED_EMAILS.split(',').map(e => e.trim().toLowerCase()) 
    : []),
  ...(import.meta.env.VITE_PRIMARY_HOLDER_EMAIL
    ? [import.meta.env.VITE_PRIMARY_HOLDER_EMAIL.trim().toLowerCase()]
    : []),
  'demo.user@familyvault.local',
  'demo_vault_user'
];

/**
 * Get the designated Primary Vault Holder email
 */
export const getPrimaryHolderEmail = () => {
  const envEmail = (import.meta.env.VITE_PRIMARY_HOLDER_EMAIL || '').trim().toLowerCase();
  if (envEmail) return envEmail;
  const stored = localStorage.getItem(PRIMARY_HOLDER_KEY);
  if (stored) return stored.trim().toLowerCase();
  
  // Fallback to first non-demo authorized email
  const list = getAuthorizedEmails().filter(e => !e.includes('demo'));
  return list[0] || '';
};

/**
 * Set or transfer the Primary Vault Holder email
 */
export const setPrimaryHolderEmail = (email) => {
  if (!email) return;
  const clean = email.trim().toLowerCase();
  localStorage.setItem(PRIMARY_HOLDER_KEY, clean);
  
  // Ensure the primary holder is always whitelisted
  const list = getAuthorizedEmails();
  if (!list.includes(clean)) {
    saveAuthorizedEmails([clean, ...list]);
  }
};

/**
 * Check if the currently authenticated user is the Primary Vault Holder
 */
export const isPrimaryHolder = (user) => {
  if (!user) return false;
  // Offline Demo Session has admin privileges
  if (user.id === 'demo_vault_user' || user.email === 'demo.user@familyvault.local') {
    return true;
  }
  const userEmail = (user.email || '').trim().toLowerCase();
  if (!userEmail) return false;

  const primary = getPrimaryHolderEmail();
  if (primary) {
    return userEmail === primary;
  }

  // If no primary holder is configured anywhere yet, the first logged-in authorized email is designated primary
  const list = getAuthorizedEmails().filter(e => !e.includes('demo'));
  if (list.length === 0 || list[0] === userEmail) {
    setPrimaryHolderEmail(userEmail);
    return true;
  }

  return false;
};

export const getAuthorizedEmails = () => {
  const cached = localStorage.getItem(WHITELIST_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      console.error(e);
    }
  }
  return DEFAULT_AUTHORIZED_EMAILS;
};

export const saveAuthorizedEmails = (emails) => {
  localStorage.setItem(WHITELIST_KEY, JSON.stringify(emails));
};

export const isEmailAuthorized = (email) => {
  if (!email) return false;
  const lower = email.toLowerCase().trim();
  const primary = getPrimaryHolderEmail();
  if (primary && lower === primary) return true;
  const list = getAuthorizedEmails();
  // Allow exact matches or demo user
  if (list.some(item => lower === item.toLowerCase().trim() || lower.startsWith(item.toLowerCase().trim()))) {
    return true;
  }

  // Initial Setup Auto-Claim: If no primary holder is set yet and no real family emails are in the whitelist,
  // the first authenticated Google user automatically becomes the designated Primary Vault Holder
  const realEmails = list.filter(e => !e.includes('demo'));
  if (!primary && realEmails.length === 0) {
    setPrimaryHolderEmail(lower);
    return true;
  }

  return false;
};

export const hasMasterPasswordSet = () => {
  return !!localStorage.getItem(PASSWORD_VERIFY_KEY);
};

export const setMasterPasswordVerification = (verifierToken) => {
  localStorage.setItem(PASSWORD_VERIFY_KEY, verifierToken);
};

export const getMasterPasswordVerification = () => {
  return localStorage.getItem(PASSWORD_VERIFY_KEY);
};
