import React from 'react';
import { Shield, Eye, EyeOff, Download, Database, LogIn, LogOut, CheckCircle, Sparkles, Lock, Bell, Crown } from 'lucide-react';
import { exportToExcel } from '../services/dataService';
import { isPrimaryHolder } from '../utils/authConfig';
import { ThemePicker } from './ThemePicker';

export const Navbar = ({
  privacyMode,
  setPrivacyMode,
  user,
  onGoogleSignIn,
  onSignOut,
  onOpenSettings,
  isSupabaseConnected,
  data,
  activeFy,
  onLockVault,
  onOpenReminders,
  upcomingRemindersCount = 0,
  theme,
  setTheme
}) => {
  return (
    <header className="top-navbar">
      <div className="brand-section">
        <div className="brand-icon-wrapper">
          <Shield size={22} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <h1 className="brand-title">FAMILY ASSET VAULT</h1>
            <span className="badge-tag">
              <Sparkles size={11} /> FY Wealth Manager
            </span>
          </div>
          <div className="brand-subtitle">
            <span>ITR Schedule AL Aligned</span>
            <span>•</span>
            <span style={{ color: isSupabaseConnected ? '#34d399' : '#fbbf24', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: isSupabaseConnected ? '#10b981' : '#f59e0b' }}></span>
              {isSupabaseConnected ? 'Supabase Cloud Synced' : 'Local Secure Vault'}
            </span>
          </div>
        </div>
      </div>

      <div className="header-actions">
        {/* Privacy Mask Toggle */}
        <button
          onClick={() => setPrivacyMode(!privacyMode)}
          className="btn-secondary"
          title={privacyMode ? 'Reveal sensitive numbers' : 'Mask sensitive numbers'}
        >
          {privacyMode ? <EyeOff size={16} color="#f43f5e" /> : <Eye size={16} color="#38bdf8" />}
          <span style={{ fontSize: '0.8125rem' }}>{privacyMode ? 'Privacy: ON' : 'Privacy: OFF'}</span>
        </button>

        {/* Visual Theme Selector */}
        <ThemePicker theme={theme} setTheme={setTheme} />

        {/* Export to Excel */}
        <button
          onClick={() => exportToExcel(data, activeFy)}
          className="btn-secondary"
          title="Export current portfolio to Excel (.xlsx)"
        >
          <Download size={16} color="#10b981" />
          <span style={{ fontSize: '0.8125rem' }}>Export Excel</span>
        </button>

        {/* Lock Vault Button */}
        {user && onLockVault && (
          <button
            onClick={onLockVault}
            className="btn-secondary"
            title="Lock Vault with Master Password"
            style={{ borderColor: 'rgba(192, 132, 252, 0.3)' }}
          >
            <Lock size={15} color="#c084fc" />
            <span style={{ fontSize: '0.8125rem' }}>Lock Vault</span>
          </button>
        )}

        {/* Policy Renewal Reminders Bell */}
        {onOpenReminders && (
          <button
            onClick={onOpenReminders}
            className="btn-icon"
            title="Upcoming Policy Renewals & Reminders"
            style={{ position: 'relative' }}
          >
            <Bell size={18} color={upcomingRemindersCount > 0 ? '#fbbf24' : '#94a3b8'} />
            {upcomingRemindersCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                minWidth: '17px',
                height: '17px',
                padding: '0 4px',
                borderRadius: '10px',
                background: '#fbbf24',
                color: '#0f172a',
                fontSize: '10px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #0f172a'
              }}>
                {upcomingRemindersCount}
              </span>
            )}
          </button>
        )}

        {/* Supabase Database Settings */}
        <button
          onClick={onOpenSettings}
          className="btn-icon"
          title={isPrimaryHolder(user) ? 'Security & Database Settings (Primary Holder)' : 'Security & Database Settings (View Only)'}
        >
          <Database size={18} />
        </button>

        {/* Google Authentication Section */}
        {user ? (
          <div className="user-profile-badge">
            {user.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="User Avatar"
                className="user-avatar"
              />
            ) : (
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700
              }}>
                {user.email?.charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#f8fafc' }}>
                {user.user_metadata?.full_name || user.email?.split('@')[0]}
              </span>
              <span style={{
                fontSize: '0.6875rem',
                color: isPrimaryHolder(user) ? '#fbbf24' : '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                fontWeight: isPrimaryHolder(user) ? 600 : 400
              }}>
                {isPrimaryHolder(user) ? '👑 Primary Holder' : 'Family Member'}
              </span>
            </div>
            <button
              onClick={onSignOut}
              className="btn-icon"
              style={{ width: 28, height: 28, marginLeft: '0.25rem' }}
              title="Sign Out"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={onGoogleSignIn}
            className="btn-google"
            title="Sign in with Google via Supabase"
          >
            {/* Google Logo SVG */}
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span>Sign in with Google</span>
          </button>
        )}
      </div>
    </header>
  );
};
