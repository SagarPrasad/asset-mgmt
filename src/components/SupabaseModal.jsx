import React, { useState } from 'react';
import { X, Database, CheckCircle2, CloudUpload, RefreshCw, LogIn, LogOut, Key, ExternalLink, Shield, Users, Plus, Trash2, KeyRound, Smartphone } from 'lucide-react';
import { resetSupabaseClient } from '../lib/supabaseClient';
import { syncDataToSupabase, loadInitialData, saveLocalData } from '../services/dataService';
import { getAuthorizedEmails, saveAuthorizedEmails, setMasterPasswordVerification, isPrimaryHolder, getPrimaryHolderEmail } from '../utils/authConfig';
import { createPasswordVerifier } from '../utils/crypto';
import { MobileConnectModal } from './MobileConnectModal';

export const SupabaseModal = ({
  isOpen,
  onClose,
  user,
  onGoogleSignIn,
  onSignOut,
  data,
  setData,
  isSupabaseConnected,
  setIsSupabaseConnected,
  masterPassword,
  setMasterPassword
}) => {
  if (!isOpen) return null;

  const isPrimary = isPrimaryHolder(user);
  const primaryHolderEmail = getPrimaryHolderEmail();

  const [url, setUrl] = useState(localStorage.getItem('family_vault_supabase_url') || import.meta.env.VITE_SUPABASE_URL || '');
  const [key, setKey] = useState(localStorage.getItem('family_vault_supabase_key') || import.meta.env.VITE_SUPABASE_ANON_KEY || '');
  const [syncStatus, setSyncStatus] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

  // Whitelist state
  const [authorizedEmails, setAuthorizedEmailsState] = useState(getAuthorizedEmails());
  const [newEmail, setNewEmail] = useState('');

  // Password update state
  const [newMasterPwd, setNewMasterPwd] = useState('');
  const [pwdUpdateMsg, setPwdUpdateMsg] = useState('');

  const handleSaveConfig = () => {
    if (!isPrimary) {
      alert('Access Denied: Only the Primary Vault Holder can modify Supabase database credentials.');
      return;
    }
    if (url && key) {
      resetSupabaseClient(url.trim(), key.trim());
      setIsSupabaseConnected(true);
      setSyncStatus('Supabase credentials saved successfully!');
    } else {
      resetSupabaseClient('', '');
      setIsSupabaseConnected(false);
      setSyncStatus('Reverted to Local Storage Vault mode.');
    }
  };

  const handleSyncToSupabase = async () => {
    try {
      setIsSyncing(true);
      setSyncStatus('Encrypting & uploading all records to Supabase tables...');
      await syncDataToSupabase(data, user, masterPassword);
      setSyncStatus('All portfolio data successfully synchronized with Supabase!');
    } catch (err) {
      console.error(err);
      setSyncStatus(`Sync error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleReloadFromSupabase = async () => {
    try {
      setIsSyncing(true);
      setSyncStatus('Fetching & decrypting clean records from Supabase...');
      const fresh = await loadInitialData(user, masterPassword);
      setData(fresh);
      saveLocalData(fresh, user);
      setSyncStatus('✓ Successfully fetched and decrypted all records from Supabase!');
    } catch (err) {
      console.error(err);
      setSyncStatus(`Fetch error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddEmail = (e) => {
    e.preventDefault();
    if (!isPrimary) {
      alert('Access Denied: Only the Primary Vault Holder can add authorized email accounts.');
      return;
    }
    const clean = newEmail.toLowerCase().trim();
    if (clean && !authorizedEmails.includes(clean)) {
      const updated = [...authorizedEmails, clean];
      setAuthorizedEmailsState(updated);
      saveAuthorizedEmails(updated);
      setNewEmail('');
    }
  };

  const handleRemoveEmail = (emailToRemove) => {
    if (!isPrimary) {
      alert('Access Denied: Only the Primary Vault Holder can remove authorized email accounts.');
      return;
    }
    const clean = emailToRemove.toLowerCase().trim();
    if (clean === primaryHolderEmail.toLowerCase().trim()) {
      alert('Cannot remove the Primary Vault Holder email account.');
      return;
    }
    if (authorizedEmails.length <= 1) {
      alert('You must keep at least one authorized email address.');
      return;
    }
    const updated = authorizedEmails.filter(e => e.toLowerCase().trim() !== clean);
    setAuthorizedEmailsState(updated);
    saveAuthorizedEmails(updated);
  };

  const handleUpdateMasterPassword = async (e) => {
    e.preventDefault();
    if (!isPrimary) {
      setPwdUpdateMsg('Access Denied: Only the Primary Vault Holder can update the Master Password.');
      return;
    }
    if (!newMasterPwd || newMasterPwd.length < 4) {
      setPwdUpdateMsg('Password must be at least 4 characters.');
      return;
    }
    try {
      const verifier = await createPasswordVerifier(newMasterPwd);
      setMasterPasswordVerification(verifier);
      if (setMasterPassword) setMasterPassword(newMasterPwd);
      setPwdUpdateMsg('Master Vault Password updated successfully!');
      setNewMasterPwd('');
    } catch (err) {
      setPwdUpdateMsg('Failed to update password.');
    }
  };

  const handleResetData = () => {
    handleReimportCleanExcel();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Database size={20} color="#38bdf8" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                  Security & Access Control
                </h2>
                {isPrimary ? (
                  <span className="badge-tag" style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#facc15', border: '1px solid rgba(234, 179, 8, 0.35)', fontSize: '0.6875rem' }}>
                    👑 Primary Holder (Admin)
                  </span>
                ) : (
                  <span className="badge-purple" style={{ fontSize: '0.6875rem' }}>
                    🛡️ Family Member (Read Only)
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {isPrimary
                  ? 'Manage authorized Gmail accounts, master decryption password, and Supabase.'
                  : `Security settings are locked. Only the Primary Holder (${primaryHolderEmail || 'Admin'}) can modify credentials.`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Section 1: Authorized Family Logins (Gmail Whitelist) */}
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={16} color="#a855f7" />
              Authorized Family Gmail Logins
            </h3>
            <span className="badge-purple">
              {isPrimary ? 'Full Access' : 'Protected'}
            </span>
          </div>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
            Only Google accounts matching this whitelist can sign in and view the financial records.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.875rem' }}>
            {authorizedEmails.map(email => {
              const isThisPrimary = primaryHolderEmail && email.toLowerCase().trim() === primaryHolderEmail.toLowerCase().trim();
              return (
                <span
                  key={email}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '0.35rem 0.65rem',
                    borderRadius: '6px',
                    background: isThisPrimary ? 'rgba(234, 179, 8, 0.15)' : 'rgba(168, 85, 247, 0.12)',
                    border: isThisPrimary ? '1px solid rgba(234, 179, 8, 0.4)' : '1px solid rgba(168, 85, 247, 0.3)',
                    fontSize: '0.75rem',
                    color: isThisPrimary ? '#fef08a' : '#e2e8f0',
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  {isThisPrimary && <span title="Primary Vault Holder">👑</span>}
                  <span>{email}</span>
                  {isThisPrimary && <span style={{ fontSize: '0.625rem', color: '#facc15', fontWeight: 700 }}>[PRIMARY]</span>}
                  {isPrimary && !isThisPrimary && (
                    <button
                      onClick={() => handleRemoveEmail(email)}
                      style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                      title="Remove email"
                    >
                      <X size={12} />
                    </button>
                  )}
                </span>
              );
            })}
          </div>

          {isPrimary ? (
            <form onSubmit={handleAddEmail} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="email"
                placeholder="Add family member Gmail (e.g. spouse@gmail.com)..."
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="form-input"
                style={{ fontSize: '0.8125rem' }}
                required
              />
              <button type="submit" className="btn-secondary" style={{ fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                <Plus size={14} /> Add Email
              </button>
            </form>
          ) : (
            <div style={{
              padding: '0.625rem 0.875rem',
              background: 'rgba(245, 158, 11, 0.08)',
              borderRadius: '8px',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              fontSize: '0.75rem',
              color: '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Shield size={14} color="#fbbf24" />
              <span>Only the Primary Holder ({primaryHolderEmail || 'Admin'}) can add or remove authorized emails.</span>
            </div>
          )}
        </div>

        {/* Section 2: Master Vault Password */}
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <KeyRound size={16} color="#c084fc" />
            Master Decryption Password
          </h3>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.75rem' }}>
            Required to decrypt your accounts and numbers. Change your master decryption password anytime.
          </p>

          {isPrimary ? (
            <form onSubmit={handleUpdateMasterPassword} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="password"
                placeholder="Enter new Master Password..."
                value={newMasterPwd}
                onChange={(e) => setNewMasterPwd(e.target.value)}
                className="form-input"
                style={{ fontSize: '0.8125rem' }}
              />
              <button type="submit" className="btn-secondary" style={{ fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                Update Password
              </button>
            </form>
          ) : (
            <div style={{ padding: '0.625rem 0.875rem', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.25)', fontSize: '0.75rem', color: '#fbbf24' }}>
              Only the Primary Vault Holder can update the master decryption password.
            </div>
          )}
          {pwdUpdateMsg && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: pwdUpdateMsg.includes('success') ? '#34d399' : '#f87171' }}>
              {pwdUpdateMsg}
            </div>
          )}
        </div>

        {/* Section 3: Supabase Cloud Connection */}
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Key size={16} color="#10b981" />
              Supabase Project Connection
            </h3>
            <span className={isSupabaseConnected ? 'badge-tag' : 'badge-amber'}>
              {isSupabaseConnected ? 'Connected' : 'Offline / Local Mode'}
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Supabase Project URL</label>
            <input
              type="text"
              placeholder="https://xyzcompany.supabase.co"
              value={isPrimary ? url : (url ? url.replace(/^(https:\/\/[^.]+).*/, '$1.••••••') : '')}
              onChange={(e) => setUrl(e.target.value)}
              className="form-input"
              disabled={!isPrimary}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Supabase Anon Public API Key</label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="form-input"
              disabled={!isPrimary}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {isPrimary && (
              <button onClick={handleSaveConfig} className="btn-primary" style={{ fontSize: '0.8125rem' }}>
                Save & Connect Supabase
              </button>
            )}
            {isSupabaseConnected && (
              <>
                <button
                  onClick={() => setIsMobileModalOpen(true)}
                  className="btn-secondary"
                  style={{
                    fontSize: '0.8125rem',
                    color: '#c084fc',
                    borderColor: 'rgba(192, 132, 252, 0.4)',
                    background: 'rgba(168, 85, 247, 0.1)'
                  }}
                  title="Generate QR code to pair your mobile phone / tablet"
                >
                  <Smartphone size={14} color="#c084fc" />
                  Connect Mobile (QR Code)
                </button>
                <button onClick={handleSyncToSupabase} disabled={isSyncing} className="btn-secondary" style={{ fontSize: '0.8125rem' }}>
                  <CloudUpload size={14} color="#34d399" />
                  {isSyncing ? 'Syncing...' : 'Sync Vault to Supabase'}
                </button>
                <button onClick={handleReloadFromSupabase} disabled={isSyncing} className="btn-secondary" style={{ fontSize: '0.8125rem', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.4)' }}>
                  <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                  Fetch Latest from DB
                </button>
              </>
            )}
          </div>

          {syncStatus && (
            <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.25)', fontSize: '0.75rem', color: '#38bdf8' }}>
              {syncStatus}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Connect QR Modal */}
      <MobileConnectModal
        isOpen={isMobileModalOpen}
        onClose={() => setIsMobileModalOpen(false)}
        url={url}
        anonKey={key}
      />
    </div>
  );
};
