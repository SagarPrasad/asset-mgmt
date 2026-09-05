import React, { useState } from 'react';
import { Shield, Lock, Sparkles, Database, Key, CheckCircle2, ArrowRight, Smartphone, X, Link2, Sliders } from 'lucide-react';
import { ThemePicker } from './ThemePicker';
import { resetSupabaseClient } from '../lib/supabaseClient';

export const LoginScreen = ({
  onGoogleSignIn,
  onOpenSettings,
  isSupabaseConnected,
  onBypassDemo,
  theme,
  setTheme
}) => {
  const [showPairModal, setShowPairModal] = useState(false);
  const [pairMode, setPairMode] = useState('link'); // 'link' | 'manual'
  const [pairInput, setPairInput] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [manualKey, setManualKey] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleApplyPairLink = (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      let raw = pairInput.trim();
      if (raw.includes('connect=')) {
        const match = raw.match(/connect=([^&]+)/);
        if (match && match[1]) {
          raw = decodeURIComponent(match[1]);
        }
      }
      const decoded = JSON.parse(decodeURIComponent(escape(atob(raw))));
      if (decoded.u && decoded.k) {
        localStorage.setItem('family_vault_supabase_url', decoded.u);
        localStorage.setItem('family_vault_supabase_key', decoded.k);
        resetSupabaseClient(decoded.u, decoded.k);
        window.location.reload();
      } else {
        setErrorMsg('Invalid pairing link format. Please copy the link again.');
      }
    } catch (err) {
      setErrorMsg('Could not decode setup link. Please verify you copied the complete link.');
    }
  };

  const handleManualSave = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!manualUrl.trim().startsWith('http')) {
      setErrorMsg('Project URL must start with https://');
      return;
    }
    if (!manualKey.trim()) {
      setErrorMsg('Anon API key is required.');
      return;
    }
    localStorage.setItem('family_vault_supabase_url', manualUrl.trim());
    localStorage.setItem('family_vault_supabase_key', manualKey.trim());
    resetSupabaseClient(manualUrl.trim(), manualKey.trim());
    window.location.reload();
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
      background: 'radial-gradient(circle at 50% 30%, var(--body-mesh-1) 0%, transparent 60%), radial-gradient(circle at 80% 80%, var(--body-mesh-2) 0%, transparent 50%), var(--bg-primary)'
    }}>
      {/* Top Right Theme Selector */}
      <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 50 }}>
        <ThemePicker theme={theme} setTheme={setTheme} />
      </div>

      {/* Background glow effects */}
      <div style={{
        maxWidth: '520px',
        width: '100%',
        background: 'var(--bg-card)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--border-glass-bright)',
        borderRadius: 'var(--radius-xl)',
        padding: '2.5rem',
        boxShadow: 'var(--shadow-md)',
        textAlign: 'center',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Brand Shield Icon */}
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '20px',
          background: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          boxShadow: '0 10px 25px rgba(14, 165, 233, 0.4)'
        }}>
          <Shield size={32} color="#ffffff" />
        </div>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.75rem',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          marginBottom: '0.5rem',
          background: 'linear-gradient(135deg, #ffffff 40%, #94a3b8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          FAMILY ASSET VAULT
        </h1>

        <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '1.75rem', lineHeight: '1.5' }}>
          Confidential family wealth & balance sheet portal. Data access is restricted to verified family Gmail accounts.
        </p>

        {/* Security Badges */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap',
          marginBottom: '2rem'
        }}>
          <span className="badge-tag">
            <Lock size={11} /> AES-GCM 256-Bit Encrypted
          </span>
          <span className="badge-blue">
            <Sparkles size={11} /> Multi-Year FY Tracking
          </span>
          <span className="badge-purple">
            <CheckCircle2 size={11} /> ITR Schedule AL
          </span>
        </div>

        {/* Google Sign-in Main Action */}
        <button
          onClick={onGoogleSignIn}
          className="btn-google"
          style={{
            width: '100%',
            justifyContent: 'center',
            padding: '0.875rem 1.25rem',
            fontSize: '1rem',
            borderRadius: '12px',
            marginBottom: '1rem',
            fontWeight: 700
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
          <span>Sign In with Google Account</span>
        </button>

        {/* Database Status (Secure / Protected) */}
        <div style={{
          padding: '0.875rem',
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '10px',
          border: '1px solid var(--border-glass)',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.8125rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8' }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: isSupabaseConnected ? '#10b981' : '#f59e0b',
              boxShadow: isSupabaseConnected ? '0 0 8px #10b981' : 'none'
            }}></span>
            <span>Cloud Database: <strong style={{ color: isSupabaseConnected ? '#34d399' : '#f59e0b' }}>{isSupabaseConnected ? 'Connected & Enforced' : 'Offline Mode'}</strong></span>
          </div>

          {!isSupabaseConnected ? (
            <button
              onClick={() => setShowPairModal(true)}
              style={{
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                color: '#38bdf8',
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.25rem 0.65rem',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Pair this mobile device or set up database"
            >
              <Smartphone size={13} />
              <span>Connect DB</span>
            </button>
          ) : (
            <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Shield size={12} color="#10b981" /> Whitelist Protected
            </span>
          )}
        </div>

        {/* Local Demo Bypass for instant testing */}
        <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1rem', marginTop: '0.5rem' }}>
          <button
            onClick={onBypassDemo}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              fontSize: '0.75rem',
              textDecoration: 'underline'
            }}
          >
            Preview offline as Demo User (Local Demo Session)
          </button>
        </div>
      </div>

      {/* Discreet Mobile Pairing Modal */}
      {showPairModal && (
        <div className="modal-overlay" onClick={() => setShowPairModal(false)}>
          <div className="modal-content" style={{ maxWidth: '440px', textAlign: 'left' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Smartphone size={18} color="var(--accent-primary)" />
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Connect Cloud Database</h3>
              </div>
              <button onClick={() => setShowPairModal(false)} className="btn-icon" style={{ width: 30, height: 30 }}>
                <X size={15} />
              </button>
            </div>

            {/* Mode Tabs */}
            <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-pill-container)', padding: '3px', borderRadius: '8px', marginBottom: '1rem' }}>
              <button
                type="button"
                onClick={() => { setPairMode('link'); setErrorMsg(''); }}
                style={{
                  flex: 1,
                  padding: '0.4rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  background: pairMode === 'link' ? 'var(--bg-pill-active)' : 'transparent',
                  color: pairMode === 'link' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                Paste Setup Link
              </button>
              <button
                type="button"
                onClick={() => { setPairMode('manual'); setErrorMsg(''); }}
                style={{
                  flex: 1,
                  padding: '0.4rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  background: pairMode === 'manual' ? 'var(--bg-pill-active)' : 'transparent',
                  color: pairMode === 'manual' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                Enter URL & Key
              </button>
            </div>

            {pairMode === 'link' ? (
              <form onSubmit={handleApplyPairLink}>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                  On your laptop Vault, go to <strong>Database Settings</strong> &gt; <strong>Connect Mobile (QR Code)</strong> and copy the link:
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="https://...#connect=..."
                    value={pairInput}
                    onChange={(e) => setPairInput(e.target.value)}
                    className="form-input"
                    autoFocus
                  />
                </div>
                {errorMsg && (
                  <div style={{ color: '#f87171', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                    {errorMsg}
                  </div>
                )}
                <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Pair & Connect Device
                </button>
              </form>
            ) : (
              <form onSubmit={handleManualSave}>
                <div className="form-group">
                  <label className="form-label">Supabase Project URL</label>
                  <input
                    type="text"
                    placeholder="https://xyz.supabase.co"
                    value={manualUrl}
                    onChange={(e) => setManualUrl(e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Supabase Anon Public Key</label>
                  <input
                    type="password"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI..."
                    value={manualKey}
                    onChange={(e) => setManualKey(e.target.value)}
                    className="form-input"
                  />
                </div>
                {errorMsg && (
                  <div style={{ color: '#f87171', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                    {errorMsg}
                  </div>
                )}
                <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Save & Connect
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <div style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
        Family Asset Vault • End-to-End Encrypted Financial Record System
      </div>
    </div>
  );
};
