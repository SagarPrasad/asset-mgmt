import { createClient } from '@supabase/supabase-js';

// Retrieve credentials from environment or localStorage for in-app configuration
const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const localUrl = localStorage.getItem('family_vault_supabase_url');
  const localKey = localStorage.getItem('family_vault_supabase_key');

  return {
    url: localUrl || envUrl || '',
    key: localKey || envKey || ''
  };
};

let supabaseInstance = null;

export const getSupabaseClient = () => {
  const { url, key } = getSupabaseConfig();
  if (url && key && url.startsWith('http')) {
    if (!supabaseInstance) {
      supabaseInstance = createClient(url, key, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      });
    }
    return supabaseInstance;
  }
  return null;
};

export const resetSupabaseClient = (newUrl, newKey) => {
  if (newUrl && newKey) {
    localStorage.setItem('family_vault_supabase_url', newUrl);
    localStorage.setItem('family_vault_supabase_key', newKey);
    supabaseInstance = createClient(newUrl, newKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
    return supabaseInstance;
  } else {
    localStorage.removeItem('family_vault_supabase_url');
    localStorage.removeItem('family_vault_supabase_key');
    supabaseInstance = null;
    return null;
  }
};

export const signInWithGoogle = async () => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase is not configured yet. Please provide your Supabase URL & Anon Key in Settings.');
  }

  // Ensure redirectTo preserves the full app path (e.g. /asset-mgmt/ on GitHub Pages)
  const redirectUrl = window.location.href.split('#')[0].split('?')[0];

  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl
    }
  });

  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const client = getSupabaseClient();
  if (client) {
    await client.auth.signOut();
  }
};
