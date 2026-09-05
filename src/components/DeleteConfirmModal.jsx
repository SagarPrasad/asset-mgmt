import React, { useState } from 'react';
import { AlertTriangle, Lock, X } from 'lucide-react';
import { getMasterPasswordVerification } from '../utils/authConfig';
import { verifyPasswordWithToken } from '../utils/crypto';

export const DeleteConfirmModal = ({
  isOpen,
  onClose,
  itemTitle,
  itemType,
  onConfirmDelete,
  sessionMasterPassword
}) => {
  if (!isOpen) return null;

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsVerifying(true);

    try {
      // Check either session master password or stored verifier
      if (sessionMasterPassword && password === sessionMasterPassword) {
        onConfirmDelete();
        onClose();
        return;
      }

      const storedVerifier = getMasterPasswordVerification();
      if (storedVerifier) {
        const isValid = await verifyPasswordWithToken(password, storedVerifier);
        if (!isValid) {
          setError('Incorrect Master Password. Deletion cancelled.');
          setIsVerifying(false);
          return;
        }
      }

      onConfirmDelete();
      onClose();
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f87171' }}>
                Confirm Permanent Deletion
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Master Password authorization required
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '0.875rem', color: '#e2e8f0', marginBottom: '1rem', lineHeight: '1.5' }}>
          Are you sure you want to permanently delete:
          <br />
          <strong style={{ color: '#f8fafc', fontSize: '0.9375rem' }}>"{itemTitle}"</strong> ({itemType})?
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Lock size={13} color="#f87171" />
              <span>Enter Master Vault Password to Confirm</span>
            </label>
            <input
              type="password"
              required
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="Enter master password..."
              style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}
            />
          </div>

          {error && (
            <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '6px', fontSize: '0.75rem', color: '#f87171', marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isVerifying}
              className="btn-primary"
              style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', borderColor: 'rgba(239, 68, 68, 0.4)' }}
            >
              Confirm & Delete
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
