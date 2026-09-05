import React, { useState } from 'react';
import { X, PlusCircle } from 'lucide-react';
import { saveLocalData, syncDataToSupabase } from '../services/dataService';
import { getSupabaseClient } from '../lib/supabaseClient';

export const AddAssetModal = ({
  isOpen,
  onClose,
  initialType = 'bank',
  data,
  setData,
  activeFy,
  user
}) => {
  if (!isOpen) return null;

  const [assetType, setAssetType] = useState(initialType);
  const [formData, setFormData] = useState({
    title: '',
    member_id: data.members[0]?.id || '',
    amount: '',
    notes: '',
    category: '',
    account_number: '',
    provider: '',
    policy_no: '',
    sum_insured: '',
    premium: '',
    city: 'Bangalore',
    cost: '',
    year: '2024'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updated = { ...data };

    if (assetType === 'bank') {
      const newAccount = {
        id: `bank_${Date.now()}`,
        member_id: formData.member_id,
        bank_name: formData.title || 'New Bank',
        account_type: formData.category || 'Savings Account',
        account_number: formData.account_number,
        customer_id: '',
        branch: formData.notes,
        snapshots: {
          [activeFy.id]: {
            balance: Number(formData.amount || 0),
            interest_acquired: 0,
            investments_linked: 0
          }
        }
      };
      updated.bankAccounts = [newAccount, ...updated.bankAccounts];
    } else if (assetType === 'investment') {
      const newInv = {
        id: `inv_${Date.now()}`,
        member_id: formData.member_id,
        category: formData.category || 'Shares & Securities',
        institution: formData.title,
        account_identifier: formData.account_number,
        values: {
          [activeFy.id]: Number(formData.amount || 0)
        },
        notes: formData.notes
      };
      updated.investments = [newInv, ...updated.investments];
    } else if (assetType === 'insurance') {
      const newPolicy = {
        id: `ins_${Date.now()}`,
        member_id: formData.member_id,
        provider: formData.provider || formData.title,
        plan_name: formData.title,
        policy_no: formData.policy_no,
        annual_premium: Number(formData.premium || 0),
        sum_insured: Number(formData.sum_insured || 0),
        status: 'Active',
        notes: formData.notes
      };
      updated.insurancePolicies = [newPolicy, ...updated.insurancePolicies];
    } else if (assetType === 'property') {
      const newProp = {
        id: `prop_${Date.now()}`,
        title: formData.title,
        description: formData.category || 'Self Occupied',
        premises: formData.title,
        city: formData.city,
        state: 'Karnataka',
        country: 'India',
        cost_amount: Number(formData.cost || 0),
        current_valuation: Number(formData.cost || 0),
        co_ownership: 'Individual'
      };
      updated.immovableProperties = [newProp, ...updated.immovableProperties];
    } else if (assetType === 'movable') {
      const newMovable = {
        id: `mov_${Date.now()}`,
        member_id: formData.member_id,
        category: formData.category || 'Vehicles / Boats etc.',
        item_name: formData.title,
        year_of_purchase: Number(formData.year || 2024),
        original_cost: Number(formData.cost || 0),
        current_value: Number(formData.amount || formData.cost || 0),
        status: 'Active',
        notes: formData.notes
      };
      updated.movableAssets = [newMovable, ...updated.movableAssets];
    } else if (assetType === 'liability') {
      const newLiability = {
        id: `liab_${Date.now()}`,
        category: formData.category || 'Loans & Liabilities',
        title: formData.title,
        amount: Number(formData.amount || 0),
        payment_source: formData.notes,
        reminder_schedule: 'Monthly',
        notes: formData.notes
      };
      updated.liabilitiesAndExpenses = [newLiability, ...updated.liabilitiesAndExpenses];
    }

    saveLocalData(updated, user);
    setData(updated);
    if (getSupabaseClient() && user) {
      syncDataToSupabase(updated, user).catch(err => console.warn('Supabase sync background notice:', err));
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PlusCircle size={20} color="#38bdf8" />
            Add New Asset or Account ({activeFy.label})
          </h2>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Asset Type Selector */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {['bank', 'investment', 'insurance', 'property', 'movable', 'liability'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setAssetType(type)}
              className={`fy-pill ${assetType === type ? 'active' : ''}`}
              style={{ textTransform: 'capitalize' }}
            >
              {type}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Owner Family Member */}
          <div className="form-group">
            <label className="form-label">Family Member / Owner</label>
            <select
              name="member_id"
              value={formData.member_id}
              onChange={handleChange}
              className="form-input"
            >
              {data.members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.relation})
                </option>
              ))}
            </select>
          </div>

          {/* Title / Name */}
          <div className="form-group">
            <label className="form-label">
              {assetType === 'bank' && 'Bank Name (e.g. HDFC Bank)'}
              {assetType === 'investment' && 'Institution / Platform (e.g. Zerodha, EPFO)'}
              {assetType === 'insurance' && 'Plan Name (e.g. LIC Jeevan Anand)'}
              {assetType === 'property' && 'Property Name / Premises (e.g. Skyline Apartments)'}
              {assetType === 'movable' && 'Item / Asset Name (e.g. Gold Bullion, Honda City)'}
              {assetType === 'liability' && 'Loan / Liability Title (e.g. Home Loan EMI)'}
            </label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter title or name..."
            />
          </div>

          {/* Amount / Balance */}
          <div className="form-group">
            <label className="form-label">
              {assetType === 'bank' ? 'Balance on 31st March (INR)' : 'Current Value / Amount (INR)'}
            </label>
            <input
              type="number"
              name="amount"
              required
              value={formData.amount}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g. 250000"
            />
          </div>

          {/* Account Number / Identifier */}
          {(assetType === 'bank' || assetType === 'investment') && (
            <div className="form-group">
              <label className="form-label">Account Number / Demat ID / UAN</label>
              <input
                type="text"
                name="account_number"
                value={formData.account_number}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g. 50100788835243"
              />
            </div>
          )}

          {/* Insurance Specific Fields */}
          {assetType === 'insurance' && (
            <>
              <div className="form-group">
                <label className="form-label">Policy Number</label>
                <input
                  type="text"
                  name="policy_no"
                  value={formData.policy_no}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g. 001234567"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Sum Insured (INR)</label>
                  <input
                    type="number"
                    name="sum_insured"
                    value={formData.sum_insured}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Annual Premium (INR)</label>
                  <input
                    type="number"
                    name="premium"
                    value={formData.premium}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>
            </>
          )}

          {/* Notes / Details */}
          <div className="form-group">
            <label className="form-label">Notes & Details</label>
            <input
              type="text"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="form-input"
              placeholder="Branch name, payment source, reminders..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Asset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
