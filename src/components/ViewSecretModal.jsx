import React, { useState } from 'react';
import { X, Lock, Eye, EyeOff, Copy, Check, Key, ShieldCheck } from 'lucide-react';
import { getMasterPasswordVerification } from '../utils/authConfig';
import { verifyPasswordWithToken } from '../utils/crypto';

export const ViewSecretModal = ({
  isOpen,
  onClose,
  accountTitle,
  accountType,
  credentials = {},
  sessionMasterPassword
}) => {
  if (!isOpen) return null;

  const [passwordInput, setPasswordInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState('');
  const [copiedKey, setCopiedKey] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');

    if (sessionMasterPassword && passwordInput === sessionMasterPassword) {
      setIsUnlocked(true);
      return;
    }

    const storedVerifier = getMasterPasswordVerification();
    if (storedVerifier) {
      const isValid = await verifyPasswordWithToken(passwordInput, storedVerifier);
      if (!isValid) {
        setError('Incorrect Master Password. Access denied.');
        return;
      }
    }

    setIsUnlocked(true);
  };

  const handleCopy = (key, text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(192, 132, 252, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc' }}>
              <Key size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                {accountTitle}
              </h2>
              <span className="badge-purple" style={{ fontSize: '10px' }}>{accountType} Credentials</span>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        {!isUnlocked ? (
          /* Master Password Challenge */
          <form onSubmit={handleVerify}>
            <div style={{ padding: '1rem', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '10px', border: '1px solid var(--border-glass)', marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '0.8125rem', color: '#94a3b8', marginBottom: '1rem', lineHeight: '1.5' }}>
                For your security, enter your <strong>Master Vault Password</strong> to decrypt and view the login username, password, and transaction PIN for this account.
              </p>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Lock size={13} color="#38bdf8" />
                  <span>Master Vault Password</span>
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="form-input"
                  placeholder="Enter master password to reveal..."
                />
              </div>
            </div>

            {error && (
              <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '6px', fontSize: '0.75rem', color: '#f87171', marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                <ShieldCheck size={15} /> Reveal Credentials
              </button>
            </div>
          </form>
        ) : (
          /* Decrypted Credentials View */
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {/* Account Number */}
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: '#94a3b8', textTransform: 'uppercase' }}>Account / Demat Identifier</div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                    {credentials.account_number || credentials.identifier || '-'}
                  </div>
                </div>
                <button
                  onClick={() => handleCopy('acc', credentials.account_number || credentials.identifier)}
                  className="btn-icon"
                  title="Copy Account Number"
                >
                  {copiedKey === 'acc' ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                </button>
              </div>

              {/* Netbanking / Portal Username */}
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: '#94a3b8', textTransform: 'uppercase' }}>Login Username / Customer ID</div>
                  <div style={{ fontSize: '0.9375rem', fontWeight: 600, fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                    {credentials.username || credentials.customer_id || '-'}
                  </div>
                </div>
                <button
                  onClick={() => handleCopy('user', credentials.username || credentials.customer_id)}
                  className="btn-icon"
                  title="Copy Username"
                >
                  {copiedKey === 'user' ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                </button>
              </div>

              {/* Password */}
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(192, 132, 252, 0.08)', borderRadius: '8px', border: '1px solid rgba(192, 132, 252, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.6875rem', color: '#c084fc', textTransform: 'uppercase' }}>Netbanking / Login Password</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#f8fafc' }}>
                    {showPassword ? (credentials.password || 'No password saved') : '••••••••••••'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="btn-icon"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    onClick={() => handleCopy('pwd', credentials.password)}
                    className="btn-icon"
                    title="Copy Password"
                  >
                    {copiedKey === 'pwd' ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              {/* PIN / Profile Hints */}
              {credentials.pin_hint && (
                <div style={{ padding: '0.75rem 1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                  <div style={{ fontSize: '0.6875rem', color: '#94a3b8', textTransform: 'uppercase' }}>Security Notes / PIN Hint</div>
                  <div style={{ fontSize: '0.8125rem', color: '#e2e8f0', marginTop: '2px' }}>
                    {credentials.pin_hint}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={onClose} className="btn-secondary">
                Done & Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
