import React, { useState, useEffect } from 'react';
import {
  X,
  Camera,
  RotateCcw,
  Trash2,
  Download,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Database,
  FileCode,
  AlertTriangle,
  HardDrive,
  Copy,
  Check
} from 'lucide-react';
import {
  takeDataSnapshot,
  loadDataSnapshots,
  restoreDataSnapshot,
  deleteDataSnapshot,
  downloadSnapshotAsJson
} from '../services/dataService';
import { isPrimaryHolder } from '../utils/authConfig';

export const SnapshotManagerModal = ({
  isOpen,
  onClose,
  data,
  setData,
  user,
  masterPassword,
  isSupabaseConnected
}) => {
  if (!isOpen) return null;

  const isPrimary = isPrimaryHolder(user);
  const [snapshots, setSnapshots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTakingSnapshot, setIsTakingSnapshot] = useState(false);
  const [customName, setCustomName] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);
  const [confirmRestoreId, setConfirmRestoreId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [showSqlGuide, setShowSqlGuide] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchSnapshots = async () => {
      setIsLoading(true);
      try {
        const list = await loadDataSnapshots(user);
        if (isMounted) setSnapshots(list);
      } catch (err) {
        console.error('Failed to load snapshots:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchSnapshots();
    return () => { isMounted = false; };
  }, [user]);

  const handleTakeSnapshot = async (e) => {
    e.preventDefault();
    setIsTakingSnapshot(true);
    setStatusMessage(null);
    try {
      const { snapshot, snapshots: updated } = await takeDataSnapshot(data, user, customName);
      setSnapshots(updated);
      setCustomName('');
      setStatusMessage({
        type: 'success',
        text: `✓ Snapshot "${snapshot.name}" captured successfully in binary BLOB format!`
      });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: `Snapshot failed: ${err.message}`
      });
    } finally {
      setIsTakingSnapshot(false);
    }
  };

  const handleRestore = async (snapshot) => {
    if (!isPrimary) {
      alert('Access Denied: Only the Primary Vault Holder can restore the vault to a prior snapshot.');
      return;
    }
    setIsLoading(true);
    setStatusMessage(null);
    setConfirmRestoreId(null);
    try {
      const restored = await restoreDataSnapshot(snapshot, data, user, masterPassword);
      setData(restored);
      // Reload snapshots since an auto-recovery backup was created before restore
      const refreshedList = await loadDataSnapshots(user);
      setSnapshots(refreshedList);
      setStatusMessage({
        type: 'success',
        text: `✓ Vault successfully restored to "${snapshot.name}"! A safety backup of your previous state was also saved.`
      });
    } catch (err) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: `Restore failed: ${err.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (snapshotId) => {
    if (!isPrimary) {
      alert('Access Denied: Only the Primary Vault Holder can delete snapshots.');
      return;
    }
    setConfirmDeleteId(null);
    try {
      const remaining = await deleteDataSnapshot(snapshotId, user);
      setSnapshots(remaining);
      setStatusMessage({
        type: 'info',
        text: 'Snapshot deleted from history.'
      });
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      console.error(err);
      setStatusMessage({
        type: 'error',
        text: `Delete failed: ${err.message}`
      });
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const sqlCode = `-- Run this in Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS public.vault_data_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    summary JSONB,
    blob_data BYTEA NOT NULL,
    byte_size INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.vault_data_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family shared snapshots access" ON public.vault_data_snapshots
FOR ALL TO authenticated USING (true) WITH CHECK (true);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
            }}>
              <Camera size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Data Snapshots & 5-Point Rollback
                </h3>
                <span className="badge-tag" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#c084fc', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                  {snapshots.length} / 5 Slots
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Point-in-time binary BLOB snapshots stored in Supabase & local storage
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ width: 32, height: 32 }}>
            <X size={16} />
          </button>
        </div>

        {/* Status Alerts */}
        {statusMessage && (
          <div style={{
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.8125rem',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: statusMessage.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : statusMessage.type === 'info' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            border: `1px solid ${statusMessage.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : statusMessage.type === 'info' ? 'rgba(56, 189, 248, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
            color: statusMessage.type === 'error' ? '#f87171' : statusMessage.type === 'info' ? '#38bdf8' : '#34d399'
          }}>
            {statusMessage.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Capture Snapshot Section */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-glass)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          marginBottom: '1.25rem'
        }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            Capture Point-in-Time Snapshot
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.875rem' }}>
            Encodes the current portfolio into binary BLOB format and saves it across Supabase database & browser cache.
          </div>

          <form onSubmit={handleTakeSnapshot} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="Snapshot label (e.g. 'Before updating FY 24-25 banks')..."
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="form-input"
              style={{ flex: 1, fontSize: '0.8125rem' }}
            />
            <button
              type="submit"
              disabled={isTakingSnapshot}
              className="btn-primary"
              style={{
                fontSize: '0.8125rem',
                whiteSpace: 'nowrap',
                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Camera size={15} />
              <span>{isTakingSnapshot ? 'Saving BLOB...' : 'Take Snapshot'}</span>
            </button>
          </form>
        </div>

        {/* Snapshots History List */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={16} color="#a855f7" />
              <span>Snapshot Rollback History (Last 5)</span>
            </div>
            {!isPrimary && (
              <span style={{ fontSize: '0.7rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={12} /> Read-only mode (Primary user can restore/delete)
              </span>
            )}
          </div>

          {isLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
              Loading snapshots...
            </div>
          ) : snapshots.length === 0 ? (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              background: 'rgba(0, 0, 0, 0.15)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border-glass)',
              color: 'var(--text-muted)',
              fontSize: '0.8125rem'
            }}>
              No snapshots created yet. Click <strong>"Take Snapshot"</strong> above to store your first restore checkpoint.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {snapshots.map((snap, idx) => {
                const isLatest = idx === 0;
                const snapDate = snap.created_at ? new Date(snap.created_at) : null;
                const dateDisplay = snapDate
                  ? snapDate.toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'Recent checkpoint';

                const summary = snap.summary || {};
                const sizeText = formatBytes(snap.byte_size || summary.byteSize);

                return (
                  <div
                    key={snap.id}
                    style={{
                      background: isLatest ? 'rgba(139, 92, 246, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                      border: isLatest ? '1px solid rgba(139, 92, 246, 0.35)' : '1px solid var(--border-glass)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.625rem',
                      position: 'relative'
                    }}
                  >
                    {/* Top Row: Name, Tags & Actions */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                            {snap.name}
                          </span>
                          {isLatest && (
                            <span style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: '#10b981',
                              color: '#0f172a'
                            }}>
                              LATEST CHECKPOINT
                            </span>
                          )}
                          <span style={{
                            fontSize: '0.6875rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(56, 189, 248, 0.12)',
                            color: '#38bdf8',
                            fontFamily: 'var(--font-mono)'
                          }}>
                            {sizeText} BLOB
                          </span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Created: {dateDisplay}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {/* Download JSON Button */}
                        <button
                          onClick={() => downloadSnapshotAsJson(snap)}
                          className="btn-icon"
                          style={{ width: 30, height: 30 }}
                          title="Download this snapshot as a JSON backup file"
                        >
                          <Download size={14} color="#38bdf8" />
                        </button>

                        {/* Restore Button (Primary Account only) */}
                        {isPrimary && (
                          confirmRestoreId === snap.id ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <button
                                onClick={() => handleRestore(snap)}
                                style={{
                                  background: '#10b981',
                                  color: '#0f172a',
                                  border: 'none',
                                  padding: '0.3rem 0.6rem',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                Confirm Restore
                              </button>
                              <button
                                onClick={() => setConfirmRestoreId(null)}
                                className="btn-icon"
                                style={{ width: 26, height: 26 }}
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setConfirmRestoreId(snap.id); setConfirmDeleteId(null); }}
                              style={{
                                background: 'rgba(16, 185, 129, 0.15)',
                                border: '1px solid rgba(16, 185, 129, 0.4)',
                                color: '#34d399',
                                padding: '0.35rem 0.65rem',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Restore entire portfolio to this point in time"
                            >
                              <RotateCcw size={13} />
                              <span>Restore</span>
                            </button>
                          )
                        )}

                        {/* Delete Button (Primary Account only) */}
                        {isPrimary && (
                          confirmDeleteId === snap.id ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <button
                                onClick={() => handleDelete(snap.id)}
                                style={{
                                  background: '#ef4444',
                                  color: '#ffffff',
                                  border: 'none',
                                  padding: '0.3rem 0.6rem',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="btn-icon"
                                style={{ width: 26, height: 26 }}
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setConfirmDeleteId(snap.id); setConfirmRestoreId(null); }}
                              className="btn-icon"
                              style={{ width: 30, height: 30, color: '#f87171' }}
                              title="Delete snapshot from history"
                            >
                              <Trash2 size={14} />
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Snapshot Contents Summary Badges */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      <span style={{ padding: '2px 6px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '4px' }}>
                        🏦 {summary.bankAccountsCount || 0} Banks
                      </span>
                      <span style={{ padding: '2px 6px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '4px' }}>
                        📈 {summary.dematHoldingsCount || 0} Holdings
                      </span>
                      <span style={{ padding: '2px 6px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '4px' }}>
                        💼 {summary.investmentsCount || 0} Invest
                      </span>
                      <span style={{ padding: '2px 6px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '4px' }}>
                        🛡️ {summary.insuranceCount || 0} Policies
                      </span>
                      <span style={{ padding: '2px 6px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '4px' }}>
                        🏠 {summary.propertiesCount || 0} Properties
                      </span>
                      <span style={{ padding: '2px 6px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '4px' }}>
                        🚗 {summary.movablesCount || 0} Movables
                      </span>
                      <span style={{ padding: '2px 6px', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '4px' }}>
                        👥 {summary.membersCount || 0} Members
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Safety Guarantee Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '0.75rem 1rem',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.75rem',
          color: '#34d399',
          marginBottom: '0.75rem'
        }}>
          <ShieldCheck size={18} style={{ flexShrink: 0 }} />
          <span>
            <strong>Zero Data Loss Guarantee:</strong> Whenever you restore an older snapshot, the app automatically creates a safety auto-backup of your current state first, so you can never lose data.
          </span>
        </div>

        {/* Supabase Table SQL Setup Helper Toggle */}
        <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '0.75rem', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => setShowSqlGuide(!showSqlGuide)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '0.75rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <FileCode size={13} />
            <span>{showSqlGuide ? 'Hide Supabase BLOB Table SQL' : 'View Supabase BLOB Table SQL Script'}</span>
          </button>

          {showSqlGuide && (
            <div style={{ marginTop: '0.75rem', textAlign: 'left', background: 'var(--bg-input)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  Run in Supabase SQL Editor to create <code>public.vault_data_snapshots</code>:
                </span>
                <button
                  onClick={handleCopySql}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid var(--border-glass)',
                    color: '#e2e8f0',
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {copiedSql ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                  <span>{copiedSql ? 'Copied' : 'Copy SQL'}</span>
                </button>
              </div>
              <pre style={{
                fontSize: '0.7rem',
                fontFamily: 'var(--font-mono)',
                color: '#38bdf8',
                whiteSpace: 'pre-wrap',
                margin: 0,
                maxHeight: '120px',
                overflowY: 'auto'
              }}>
                {sqlCode}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

