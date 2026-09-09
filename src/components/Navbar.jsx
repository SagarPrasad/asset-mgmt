import React, { useState, useRef, useEffect } from 'react';
import {
  Shield,
  Eye,
  EyeOff,
  Download,
  Database,
  LogIn,
  LogOut,
  Sparkles,
  Lock,
  Bell,
  Crown,
  ChevronDown,
  FileSpreadsheet
} from 'lucide-react';
import { exportToExcel, exportToJsonBackup } from '../services/dataService';
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
  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportMenuRef = useRef(null);

  // Close export dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setIsExportOpen(false);
      }
    };
    if (isExportOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isExportOpen]);

  // Extract a clean display name (truncate if long)
  const getDisplayName = () => {
    if (!user) return '';
    const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
    return fullName.length > 14 ? fullName.slice(0, 12) + '…' : fullName;
  };

  return (
    <header className="top-navbar">
      {/* Brand Section */}
      <div className="brand-section">
        <div className="brand-icon-wrapper">
          <Shield size={22} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 className="brand-title" style={{ fontSize: '1.15rem' }}>
              FAMILY ASSET VAULT
            </h1>
            <span
              className="badge-tag"
              style={{
                fontSize: '0.625rem',
                padding: '0.1rem 0.45rem',
                background: isSupabaseConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: isSupabaseConnected ? '#34d399' : '#fbbf24',
                borderColor: isSupabaseConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: isSupabaseConnected ? '#10b981' : '#f59e0b'
                }}
              />
              {isSupabaseConnected ? 'Cloud Synced' : 'Local Vault'}
            </span>
          </div>
          <div className="brand-subtitle" style={{ fontSize: '0.6875rem' }}>
            <span>ITR Schedule AL Aligned Wealth Suite</span>
          </div>
        </div>
      </div>

      {/* Streamlined Executive Action Controls */}
      <div className="header-actions" style={{ gap: '0.5rem' }}>
        {/* Privacy Mask Pill */}
        <button
          onClick={() => setPrivacyMode(!privacyMode)}
          className={`nav-btn-compact ${privacyMode ? 'active-privacy' : ''}`}
          title={privacyMode ? 'Sensitive figures are masked. Click to reveal.' : 'Click to mask sensitive balances & PANs.'}
        >
          {privacyMode ? <EyeOff size={15} color="#f43f5e" /> : <Eye size={15} color="#38bdf8" />}
          <span>{privacyMode ? 'Masked' : 'Privacy'}</span>
        </button>

        {/* Visual Theme Selector */}
        <ThemePicker theme={theme} setTheme={setTheme} />

        {/* Consolidated Export & Backup Dropdown Menu */}
        <div ref={exportMenuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setIsExportOpen(!isExportOpen)}
            className="nav-btn-compact"
            title="Export portfolio or download data backup"
            style={{ borderColor: isExportOpen ? 'var(--border-focus)' : 'var(--border-glass)' }}
          >
            <Download size={15} color="#10b981" />
            <span>Export</span>
            <ChevronDown
              size={12}
              style={{
                transform: isExportOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.18s ease'
              }}
            />
          </button>

          {isExportOpen && (
            <div className="nav-dropdown-menu">
              <button
                className="nav-dropdown-item"
                onClick={() => {
                  exportToExcel(data, activeFy);
                  setIsExportOpen(false);
                }}
              >
                <div style={{
                  width: 30,
                  height: 30,
                  borderRadius: 6,
                  background: 'rgba(16, 185, 129, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <FileSpreadsheet size={16} color="#10b981" />
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Export to Excel (.xlsx)
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
                    Formatted multi-year workbook & Schedule AL
                  </div>
                </div>
              </button>

              <button
                className="nav-dropdown-item"
                onClick={() => {
                  exportToJsonBackup(data, user);
                  setIsExportOpen(false);
                }}
              >
                <div style={{
                  width: 30,
                  height: 30,
                  borderRadius: 6,
                  background: 'rgba(56, 189, 248, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Database size={16} color="#38bdf8" />
                </div>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Backup Vault (.json)
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>
                    Full encrypted disaster recovery snapshot
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>

        <div className="nav-divider" />

        {/* Policy Renewal Reminders Bell */}
        {onOpenReminders && (
          <button
            onClick={onOpenReminders}
            className="nav-btn-icon"
            title="Upcoming Policy Renewals & Reminders"
          >
            <Bell size={16} color={upcomingRemindersCount > 0 ? '#fbbf24' : 'var(--text-secondary)'} />
            {upcomingRemindersCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-3px',
                  right: '-3px',
                  minWidth: '16px',
                  height: '16px',
                  padding: '0 3px',
                  borderRadius: '10px',
                  background: '#fbbf24',
                  color: '#0f172a',
                  fontSize: '10px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid var(--bg-card)'
                }}
              >
                {upcomingRemindersCount}
              </span>
            )}
          </button>
        )}

        {/* Lock Vault Button */}
        {user && onLockVault && (
          <button
            onClick={onLockVault}
            className="nav-btn-icon"
            title="Lock Vault with Master Password"
          >
            <Lock size={15} color="#c084fc" />
          </button>
        )}

        {/* Supabase Database Settings */}
        <button
          onClick={onOpenSettings}
          className="nav-btn-icon"
          title={isPrimaryHolder(user) ? 'Security & Database Settings (Primary Holder)' : 'Security & Database Settings (View Only)'}
        >
          <Database size={16} />
        </button>

        {/* User Profile / Auth */}
        {user ? (
          <div className="user-profile-compact" title={user.email || ''}>
            {user.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="User Avatar"
                style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: 'var(--gradient-brand)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#ffffff'
                }}
              >
                {user.email?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}

            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {getDisplayName()}
            </span>

            {isPrimaryHolder(user) && (
              <span title="Primary Portfolio Owner">
                <Crown size={13} color="#fbbf24" style={{ display: 'block' }} />
              </span>
            )}

            <button
              onClick={onSignOut}
              className="btn-icon"
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0
              }}
              title="Sign Out"
            >
              <LogOut size={13} />
            </button>
          </div>
        ) : (
          <button
            onClick={onGoogleSignIn}
            className="btn-google"
            title="Sign in with Google via Supabase"
            style={{ height: 36, padding: '0 0.85rem' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span style={{ fontSize: '0.8125rem' }}>Sign in</span>
          </button>
        )}
      </div>
    </header>
  );
};
