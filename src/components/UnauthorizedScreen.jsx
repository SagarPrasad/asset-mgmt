import React from 'react';
import { ShieldAlert, LogOut, Lock, ArrowLeft } from 'lucide-react';
import { ThemePicker } from './ThemePicker';

export const UnauthorizedScreen = ({
  user,
  onSignOut,
  theme,
  setTheme
}) => {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
      background: 'radial-gradient(circle at 50% 30%, rgba(239, 68, 68, 0.12) 0%, transparent 60%), var(--bg-primary)'
    }}>
      {/* Top Right Theme Selector */}
      <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 50 }}>
        <ThemePicker theme={theme} setTheme={setTheme} />
      </div>

      <div style={{
        maxWidth: '480px',
        width: '100%',
        background: 'var(--bg-card)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: 'var(--radius-xl)',
        padding: '2.5rem',
        boxShadow: 'var(--shadow-md)',
        textAlign: 'center'
      }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '20px',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          color: '#f87171'
        }}>
          <ShieldAlert size={32} />
        </div>

        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.5rem',
          fontWeight: 700,
          color: '#f87171',
          marginBottom: '0.75rem'
        }}>
          Access Denied: Unauthorized Account
        </h2>

        <div style={{
          padding: '0.625rem 1rem',
          background: 'rgba(239, 68, 68, 0.08)',
          borderRadius: '8px',
          fontSize: '0.875rem',
          color: '#e2e8f0',
          fontFamily: 'var(--font-mono)',
          marginBottom: '1.25rem',
          display: 'inline-block'
        }}>
          {user?.email || 'Unknown Google Account'}
        </div>

        <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: '1.6', marginBottom: '2rem' }}>
          This Family Asset Vault is strictly restricted to designated family members. This Google account does not have permission to view or manage the financial records.
        </p>

        <button
          onClick={onSignOut}
          className="btn-primary"
          style={{
            width: '100%',
            justifyContent: 'center',
            padding: '0.75rem',
            background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
            fontSize: '0.9375rem',
            borderRadius: '10px',
            fontWeight: 600
          }}
        >
          <LogOut size={16} />
          <span>Sign Out & Switch Google Account</span>
        </button>
      </div>
    </div>
  );
};
