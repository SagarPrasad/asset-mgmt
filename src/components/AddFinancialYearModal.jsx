import React, { useState } from 'react';
import { X, Calendar, Copy, CheckCircle2, Sparkles } from 'lucide-react';
import { saveLocalData, syncDataToSupabase } from '../services/dataService';
import { getSupabaseClient } from '../lib/supabaseClient';

export const AddFinancialYearModal = ({
  isOpen,
  onClose,
  data,
  setData,
  activeFy,
  setActiveFyId,
  user,
  masterPassword
}) => {
  if (!isOpen) return null;

  // Compute default next FY
  const existingYears = data.financialYears || [];
  const latestFy = existingYears[existingYears.length - 1];

  let defaultNextLabel = 'FY 2026-27';
  let defaultNextDate = '2027-03-31';

  if (latestFy && latestFy.label.includes('-')) {
    const parts = latestFy.label.replace('FY ', '').split('-');
    if (parts.length === 2) {
      const startYear = parseInt(parts[0], 10);
      const endYear = parseInt(parts[1], 10);
      if (!isNaN(startYear) && !isNaN(endYear)) {
        defaultNextLabel = `FY ${startYear + 1}-${(endYear + 1).toString().slice(-2)}`;
        const endFullYear = 2000 + endYear + 1;
        defaultNextDate = `${endFullYear}-03-31`;
      }
    }
  }

  const [fyLabel, setFyLabel] = useState(defaultNextLabel);
  const [asOnDate, setAsOnDate] = useState(defaultNextDate);
  const [copyFromFyId, setCopyFromFyId] = useState(latestFy?.id || 'fy_25_26');
  const [cloneBalances, setCloneBalances] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();

    const newId = `fy_${fyLabel.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    // Check if FY already exists
    if (existingYears.some(fy => fy.id === newId || fy.label === fyLabel)) {
      alert(`Financial year "${fyLabel}" already exists.`);
      return;
    }

    const newFy = {
      id: newId,
      label: fyLabel.trim(),
      as_on_date: asOnDate,
      is_current: true
    };

    // Mark previous current as false
    const updatedYears = existingYears.map(fy => ({ ...fy, is_current: false }));
    updatedYears.push(newFy);

    const updated = { ...data, financialYears: updatedYears };

    // Clone balances and investment values if requested
    if (cloneBalances && copyFromFyId) {
      // 1. Clone Bank Snapshots
      updated.bankAccounts = updated.bankAccounts.map(bank => {
        const sourceSnapshot = bank.snapshots?.[copyFromFyId] || { balance: 0, interest_acquired: 0, investments_linked: 0 };
        return {
          ...bank,
          snapshots: {
            ...bank.snapshots,
            [newId]: {
              balance: sourceSnapshot.balance || 0,
              interest_acquired: 0, // Reset interest for the new year
              investments_linked: sourceSnapshot.investments_linked || 0
            }
          }
        };
      });

      // 2. Clone Investment values
      updated.investments = updated.investments.map(inv => {
        const sourceVal = inv.values?.[copyFromFyId] ?? 0;
        return {
          ...inv,
          values: {
            ...inv.values,
            [newId]: sourceVal
          }
        };
      });
    }

    // Save and switch active FY
    saveLocalData(updated, user);
    setData(updated);
    setActiveFyId(newId);

    if (getSupabaseClient() && user) {
      syncDataToSupabase(updated, user, masterPassword).catch(err => console.warn('Supabase sync notice:', err));
    }

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={20} color="#38bdf8" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                Add Next Financial Year
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Create a new yearly period and carry forward your previous asset balances.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Financial Year Label</label>
            <input
              type="text"
              required
              value={fyLabel}
              onChange={(e) => setFyLabel(e.target.value)}
              className="form-input"
              placeholder="e.g. FY 2026-27"
            />
          </div>

          <div className="form-group">
            <label className="form-label">As of Date (Year End)</label>
            <input
              type="date"
              required
              value={asOnDate}
              onChange={(e) => setAsOnDate(e.target.value)}
              className="form-input"
            />
          </div>

          <div style={{
            background: 'rgba(56, 189, 248, 0.06)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Copy size={16} color="#38bdf8" />
              <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#f8fafc' }}>
                Clone Previous Financial Year Data
              </span>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#e2e8f0', cursor: 'pointer', marginBottom: '0.75rem' }}>
              <input
                type="checkbox"
                checked={cloneBalances}
                onChange={(e) => setCloneBalances(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#38bdf8' }}
              />
              <span>Copy over bank account balances and investment valuations</span>
            </label>

            {cloneBalances && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Source Financial Year to Copy From:</label>
                <select
                  value={copyFromFyId}
                  onChange={(e) => setCopyFromFyId(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '0.8125rem' }}
                >
                  {existingYears.map((fy) => (
                    <option key={fy.id} value={fy.id}>
                      {fy.label} (As of {fy.as_on_date})
                    </option>
                  ))}
                </select>
                <div style={{ fontSize: '0.6875rem', color: '#94a3b8', marginTop: '0.35rem' }}>
                  * All bank balances and stocks/EPFO values will be copied over. Annual interest will reset to ₹0 for the fresh FY.
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <Sparkles size={15} /> Create & Open {fyLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
