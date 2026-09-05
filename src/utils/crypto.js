// Client-Side Web Crypto AES-GCM 256-bit Encryption Module
// Requires Master Vault Password to decrypt family financial records

const ALGORITHM = 'AES-GCM';
const SALT = new TextEncoder().encode('family-vault-master-salt-2026');
const VERIFIER_PLAINTEXT = 'FAMILY_VAULT_DECRYPT_OK';

// Derive a 256-bit AES-GCM key from the user's Master Password using PBKDF2
export async function deriveKey(masterPassword) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(masterPassword || 'family_default_passphrase_2026'),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: SALT,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: ALGORITHM, length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Create an encrypted verification token used to test if a master password is correct
export async function createPasswordVerifier(masterPassword) {
  return await encryptField(VERIFIER_PLAINTEXT, masterPassword);
}

// Test if entered master password is valid
export async function verifyPasswordWithToken(masterPassword, verifierToken) {
  if (!verifierToken) return true; // If no verifier set yet
  try {
    const result = await decryptField(verifierToken, masterPassword);
    return result === VERIFIER_PLAINTEXT;
  } catch (e) {
    return false;
  }
}

// Encrypt plaintext string with Master Password -> Base64 string with IV
export async function encryptField(plaintext, masterPassword) {
  if (!plaintext || typeof plaintext !== 'string') return plaintext;
  try {
    const key = await deriveKey(masterPassword);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plaintext);

    const ciphertext = await window.crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      encoded
    );

    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);

    const b64 = btoa(String.fromCharCode(...combined));
    return `enc::${b64}`;
  } catch (err) {
    console.error('Encryption failed:', err);
    return plaintext;
  }
}

// Decrypt ciphertext string with Master Password -> original plaintext
export async function decryptField(ciphertext, masterPassword) {
  if (!ciphertext || typeof ciphertext !== 'string' || !ciphertext.startsWith('enc::')) {
    return ciphertext;
  }

  try {
    const key = await deriveKey(masterPassword);
    const raw = atob(ciphertext.replace('enc::', ''));
    const combined = new Uint8Array([...raw].map(c => c.charCodeAt(0)));

    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decrypted = await window.crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      data
    );

    return new TextDecoder().decode(decrypted);
  } catch (err) {
    console.warn('Decryption failed for ciphertext:', err.message);
    return ciphertext;
  }
}
