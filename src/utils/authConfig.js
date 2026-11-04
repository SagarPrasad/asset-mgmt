// Access Control & Master Vault Password Configuration

const WHITELIST_KEY = 'family_vault_authorized_emails';
const PASSWORD_VERIFY_KEY = 'family_vault_pwd_verifier';
const PRIMARY_HOLDER_KEY = 'family_vault_primary_holder_email';
const PRIMARY_VAULT_OWNER_ID_KEY = 'family_vault_owner_id';

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
 * Get the Supabase UUID of the primary vault owner (to keep records unified)
 */
export const getPrimaryVaultOwnerId = () => {
  return localStorage.getItem(PRIMARY_VAULT_OWNER_ID_KEY) || null;
};

/**
 * Set the Supabase UUID of the primary vault owner
 */
export const setPrimaryVaultOwnerId = (id) => {
  if (id) {
    localStorage.setItem(PRIMARY_VAULT_OWNER_ID_KEY, id);
  }
};

/**
 * Set or transfer the Primary Vault Holder email
 */
export const setPrimaryHolderEmail = (email, supabase = null) => {
  if (!email) return;
  const clean = email.trim().toLowerCase();
  localStorage.setItem(PRIMARY_HOLDER_KEY, clean);
  
  // Ensure the primary holder is always whitelisted
  const list = getAuthorizedEmails();
  if (!list.includes(clean)) {
    saveAuthorizedEmails([clean, ...list], supabase);
  }

  if (supabase) {
    saveVaultSettingToCloud(supabase, 'primary_holder_email', clean).catch(console.warn);
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
    if (user.id) setPrimaryVaultOwnerId(user.id);
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

export const saveAuthorizedEmails = (emails, supabase = null) => {
  localStorage.setItem(WHITELIST_KEY, JSON.stringify(emails));
  if (supabase) {
    saveVaultSettingToCloud(supabase, 'authorized_emails', emails).catch(console.warn);
  }
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

export const setMasterPasswordVerification = (verifierToken, supabase = null) => {
  localStorage.setItem(PASSWORD_VERIFY_KEY, verifierToken);
  if (supabase) {
    saveVaultSettingToCloud(supabase, 'password_verifier', verifierToken).catch(console.warn);
  }
};

export const getMasterPasswordVerification = () => {
  return localStorage.getItem(PASSWORD_VERIFY_KEY);
};

/**
 * Save a single shared setting key/value to Supabase public.vault_settings
 */
export const saveVaultSettingToCloud = async (supabase, key, value) => {
  if (!supabase || !key) return;
  try {
    await supabase.from('vault_settings').upsert({
      key,
      value,
      updated_at: new Date().toISOString()
    }, { onConflict: 'key' });
  } catch (err) {
    console.warn(`Notice: Failed to sync shared setting "${key}" to cloud:`, err.message);
  }
};

/**
 * Synchronize all shared vault settings from Supabase public.vault_settings
 * Allows new browsers and family members to automatically receive whitelist & verifier
 */
export const syncVaultSettingsFromCloud = async (supabase) => {
  if (!supabase) return false;
  try {
    const { data: rows, error } = await supabase
      .from('vault_settings')
      .select('key, value');

    if (!error && Array.isArray(rows)) {
      rows.forEach(r => {
        if (r.key === 'authorized_emails' && Array.isArray(r.value)) {
          localStorage.setItem(WHITELIST_KEY, JSON.stringify(r.value));
        } else if (r.key === 'primary_holder_email' && typeof r.value === 'string') {
          localStorage.setItem(PRIMARY_HOLDER_KEY, r.value.trim().toLowerCase());
        } else if (r.key === 'primary_holder_id' && typeof r.value === 'string') {
          localStorage.setItem(PRIMARY_VAULT_OWNER_ID_KEY, r.value);
        } else if (r.key === 'password_verifier' && typeof r.value === 'string') {
          localStorage.setItem(PASSWORD_VERIFY_KEY, r.value);
        }
      });
      return true;
    }
  } catch (err) {
    console.warn('Notice: Could not sync cloud vault settings (using local settings):', err.message);
  }
  return false;
};
