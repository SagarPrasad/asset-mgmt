import React, { useState } from 'react';
import { KeyRound, Lock, Eye, EyeOff, ShieldCheck, LogOut, AlertCircle, Sparkles } from 'lucide-react';
import {
  hasMasterPasswordSet,
  getMasterPasswordVerification,
  setMasterPasswordVerification
} from '../utils/authConfig';
import { createPasswordVerifier, verifyPasswordWithToken } from '../utils/crypto';
import { ThemePicker } from './ThemePicker';

export const VaultUnlockScreen = ({
  user,
  onUnlockVault,
  onSignOut,
  theme,
  setTheme
}) => {
  const isFirstTimeSetup = !hasMasterPasswordSet();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (!password || password.length < 4) {
        setError('Master password must be at least 4 characters long.');
        setIsSubmitting(false);
        return;
      }

      if (isFirstTimeSetup) {
        if (password !== confirmPassword) {
          setError('Passwords do not match. Please re-enter.');
          setIsSubmitting(false);
          return;
        }

        // Generate verifier token and store
        const verifier = await createPasswordVerifier(password);
        setMasterPasswordVerification(verifier);
        onUnlockVault(password);
      } else {
        // Verify against existing token
        const storedVerifier = getMasterPasswordVerification();
        const isValid = await verifyPasswordWithToken(password, storedVerifier);
        if (!isValid) {
          setError('Incorrect master password. Please verify and try again.');
          setIsSubmitting(false);
          return;
        }
        onUnlockVault(password);
      }
    } catch (err) {
      console.error(err);
      setError('Decryption verification error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
      background: 'radial-gradient(circle at 50% 30%, var(--body-mesh-1) 0%, transparent 60%), radial-gradient(circle at 20% 80%, var(--body-mesh-2) 0%, transparent 50%), var(--bg-primary)'
    }}>
      {/* Top Right Theme Selector */}
      <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 50 }}>
        <ThemePicker theme={theme} setTheme={setTheme} />
      </div>

      <div style={{
        maxWidth: '480px',
        width: '100%',
        background: 'var(--bg-card)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--border-glass-bright)',
        borderRadius: 'var(--radius-xl)',
        padding: '2.5rem',
        boxShadow: 'var(--shadow-md)',
        textAlign: 'center'
      }}>
        {/* Lock Icon */}
        <div style={{
          width: 60,
          height: 60,
          borderRadius: '18px',
          background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem',
          boxShadow: '0 8px 24px rgba(139, 92, 246, 0.35)'
        }}>
          <KeyRound size={30} color="#ffffff" />
        </div>

        {/* User Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.35rem 0.75rem',
          borderRadius: '999px',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          fontSize: '0.75rem',
          color: '#34d399',
          fontWeight: 600,
          marginBottom: '1rem'
        }}>
          <ShieldCheck size={14} />
          <span>Google Verified: {user?.email}</span>
        </div>

        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.5rem',
          fontWeight: 700,
          marginBottom: '0.5rem',
          color: '#f8fafc'
        }}>
          {isFirstTimeSetup ? 'Set Master Vault Password' : 'Enter Decryption Password'}
        </h2>

        <p style={{ fontSize: '0.8125rem', color: '#94a3b8', marginBottom: '1.75rem', lineHeight: '1.5' }}>
          {isFirstTimeSetup
            ? 'Create a Master Password to encrypt and protect your family financial records using AES-GCM 256-bit.'
            : 'Your financial numbers and accounts are encrypted at rest. Enter your master password to unlock and decrypt.'}
        </p>

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Master Vault Password</span>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '3px' }}
              >
                {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                <span>{showPassword ? 'Hide' : 'Show'}</span>
              </button>
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="Enter your master password..."
              style={{ fontSize: '1rem', letterSpacing: showPassword ? 'normal' : '0.15em' }}
            />
          </div>

          {isFirstTimeSetup && (
            <div className="form-group">
              <label className="form-label">Confirm Master Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-input"
                placeholder="Confirm password..."
                style={{ fontSize: '1rem', letterSpacing: showPassword ? 'normal' : '0.15em' }}
              />
            </div>
          )}

          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 0.875rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              color: '#f87171',
              marginBottom: '1rem'
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary"
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '0.75rem',
              fontSize: '0.9375rem',
              borderRadius: '10px',
              fontWeight: 700
            }}
          >
            <Lock size={16} />
            <span>{isFirstTimeSetup ? 'Encrypt & Unlock Vault' : 'Decrypt & Access Vault'}</span>
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={onSignOut}
            className="btn-secondary"
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
          >
            <LogOut size={13} /> Switch Account
          </button>

          <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>
            AES-GCM • Zero-Knowledge Decryption
          </span>
        </div>
      </div>
    </div>
  );
};
