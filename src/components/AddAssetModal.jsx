import React, { useState, useEffect } from 'react';
import { X, PlusCircle, CreditCard, Calendar, Building2, Landmark, Percent, ShieldCheck } from 'lucide-react';
import { saveLocalData, syncDataToSupabase } from '../services/dataService';
import { getSupabaseClient } from '../lib/supabaseClient';

export const AddAssetModal = ({
  isOpen,
  onClose,
  initialType = 'bank',
  initialCategory = null,
  activeMemberId = 'all',
  data,
  setData,
  activeFy,
  user,
  masterPassword
}) => {
  if (!isOpen) return null;

  const defaultMemberId = (activeMemberId && activeMemberId !== 'all')
    ? activeMemberId
    : (data?.members?.[0]?.id || '');

  const [assetType, setAssetType] = useState(initialType);
  const [formData, setFormData] = useState({
    title: '',
    member_id: defaultMemberId,
    amount: '',
    interest_acquired: '',
    branch: '',
    notes: '',
    category: initialCategory || (initialType === 'liability' ? 'Loans & Liabilities' : (initialType === 'bank' ? 'Savings Account' : '')),
    account_number: '',
    provider: '',
    policy_no: '',
    sum_insured: '',
    premium: '',
    city: 'Bangalore',
    cost: '',
    year: '2024',
    payment_source: '',
    reminder_schedule: 'Monthly',
    co_ownership: 'Individual'
  });

  useEffect(() => {
    setAssetType(initialType);
    setFormData(prev => ({
      ...prev,
      member_id: defaultMemberId,
      category: initialCategory || (initialType === 'liability' ? 'Loans & Liabilities' : (initialType === 'bank' ? 'Savings Account' : ''))
    }));
  }, [initialType, initialCategory, defaultMemberId]);

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
        branch: formData.branch || '',
        notes: formData.notes || '',
        snapshots: {
          [activeFy.id]: {
            balance: Number(formData.amount || 0),
            interest_acquired: Number(formData.interest_acquired || 0),
            investments_linked: 0
          }
        }
      };
      updated.bankAccounts = [newAccount, ...(updated.bankAccounts || [])];
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
      updated.investments = [newInv, ...(updated.investments || [])];
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
      updated.insurancePolicies = [newPolicy, ...(updated.insurancePolicies || [])];
    } else if (assetType === 'property') {
      const newProp = {
        id: `prop_${Date.now()}`,
        member_id: formData.member_id,
        title: formData.title,
        description: formData.category || 'Self Occupied',
        premises: formData.title,
        city: formData.city,
        state: 'Karnataka',
        country: 'India',
        cost_amount: Number(formData.cost || formData.amount || 0),
        current_valuation: Number(formData.amount || formData.cost || 0),
        co_ownership: formData.co_ownership || 'Individual'
      };
      updated.immovableProperties = [newProp, ...(updated.immovableProperties || [])];
    } else if (assetType === 'movable') {
      const newMovable = {
        id: `mov_${Date.now()}`,
        member_id: formData.member_id,
        category: formData.category || 'Vehicles / Boats etc.',
        item_name: formData.title,
        year_of_purchase: Number(formData.year || 2024),
        original_cost: Number(formData.cost || formData.amount || 0),
        current_value: Number(formData.amount || formData.cost || 0),
        status: 'Active',
        notes: formData.notes
      };
      updated.movableAssets = [newMovable, ...(updated.movableAssets || [])];
    } else if (assetType === 'liability') {
      const newLiability = {
        id: `liab_${Date.now()}`,
        member_id: formData.member_id,
        category: formData.category || 'Loans & Liabilities',
        title: formData.title,
        amount: Number(formData.amount || 0),
        payment_source: formData.payment_source || formData.notes || '',
        reminder_schedule: formData.reminder_schedule || 'Monthly',
        notes: formData.notes || ''
      };
      updated.liabilitiesAndExpenses = [newLiability, ...(updated.liabilitiesAndExpenses || [])];
    }

    saveLocalData(updated, user);
    setData(updated);
    if (getSupabaseClient() && user) {
      syncDataToSupabase(updated, user, masterPassword).catch(err => console.warn('Supabase sync background notice:', err));
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
          {[
            { id: 'bank', label: 'Bank Account' },
            { id: 'investment', label: 'Investment' },
            { id: 'insurance', label: 'Insurance' },
            { id: 'property', label: 'Property' },
            { id: 'movable', label: 'Movable Asset' },
            { id: 'liability', label: 'Liability / Outflow' }
          ].map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => {
                setAssetType(type.id);
                if (type.id === 'liability' && !formData.category) {
                  setFormData(prev => ({ ...prev, category: 'Loans & Liabilities' }));
                }
              }}
              className={`fy-pill ${assetType === type.id ? 'active' : ''}`}
            >
              {type.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Owner Family Member / Entity Selector */}
          <div className="form-group">
            <label className="form-label">Family Member / Entity Owner</label>
            <select
              name="member_id"
              value={formData.member_id}
              onChange={handleChange}
              className="form-input"
              required
            >
              {(data?.members || []).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.relation || 'Member'})
                </option>
              ))}
            </select>
          </div>

          {/* Bank / Deposit Category Selector */}
          {assetType === 'bank' && (
            <div className="form-group">
              <label className="form-label">Account / Deposit Type</label>
              <select
                name="category"
                value={formData.category || 'Savings Account'}
                onChange={handleChange}
                className="form-input"
              >
                <option value="Fixed Deposit (FD)">Fixed Deposit (FD)</option>
                <option value="Term Deposit">Term Deposit</option>
                <option value="Recurring Deposit (RD)">Recurring Deposit (RD)</option>
                <option value="Savings Account">Savings Account</option>
                <option value="Salary Account">Salary Account</option>
                <option value="Current Account">Current Account</option>
              </select>
            </div>
          )}

          {/* Liability Sub-Category Selector */}
          {assetType === 'liability' && (
            <div className="form-group">
              <label className="form-label">Category Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, category: 'Loans & Liabilities' })}
                  className={`fy-pill ${formData.category !== 'Fixed Monthly Expenditure' ? 'active' : ''}`}
                  style={{ padding: '0.625rem', textAlign: 'center', justifyContent: 'center' }}
                >
                  <CreditCard size={14} />
                  <span>Loan / Liability</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, category: 'Fixed Monthly Expenditure' })}
                  className={`fy-pill ${formData.category === 'Fixed Monthly Expenditure' ? 'active' : ''}`}
                  style={{ padding: '0.625rem', textAlign: 'center', justifyContent: 'center' }}
                >
                  <Calendar size={14} />
                  <span>Fixed Monthly Outflow</span>
                </button>
              </div>
            </div>
          )}

          {/* Title / Name */}
          <div className="form-group">
            <label className="form-label">
              {assetType === 'bank' && (formData.category?.includes('Deposit') || formData.category?.includes('FD') ? 'Bank / Institution (e.g. HDFC Bank, SBI)' : 'Bank Name (e.g. HDFC Bank)')}
              {assetType === 'investment' && 'Institution / Platform (e.g. Zerodha, EPFO)'}
              {assetType === 'insurance' && 'Plan Name (e.g. LIC Jeevan Anand)'}
              {assetType === 'property' && 'Property Title / Premises (e.g. Skyline Apartments)'}
              {assetType === 'movable' && 'Item / Asset Name (e.g. Gold Bullion, Honda City)'}
              {assetType === 'liability' && (formData.category === 'Fixed Monthly Expenditure' ? 'Outflow / Bill Name (e.g. House Rent, Maintenance)' : 'Loan / Liability Title (e.g. Home Loan EMI)')}
            </label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="form-input"
              placeholder={assetType === 'bank' && (formData.category?.includes('Deposit') || formData.category?.includes('FD')) ? "e.g. HDFC Bank / SBI Term Deposit" : (assetType === 'liability' && formData.category === 'Fixed Monthly Expenditure' ? "e.g. Apartment Maintenance / Cloud Subscriptions" : "Enter title or name...")}
            />
          </div>

          {/* Amount / Balance */}
          <div className="form-group">
            <label className="form-label">
              {assetType === 'bank' && (formData.category?.includes('Deposit') || formData.category?.includes('FD') ? 'Deposit Principal / Balance on 31st March (INR)' : 'Balance on 31st March (INR)')}
              {assetType === 'liability' && (formData.category === 'Fixed Monthly Expenditure' ? 'Monthly Outflow Amount (INR)' : 'Total Outstanding Loan Amount (INR)')}
              {assetType === 'property' && 'Acquisition Cost / Valuation (INR)'}
              {assetType === 'movable' && 'Current Value / Original Cost (INR)'}
              {assetType === 'investment' && 'Valuation / Invested Amount (INR)'}
              {assetType === 'insurance' && 'Sum Insured (INR)'}
            </label>
            <input
              type="number"
              step="any"
              name="amount"
              required
              value={formData.amount}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g. 250000"
            />
          </div>

          {/* Bank & FD Interest Acquired & Branch Fields */}
          {assetType === 'bank' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">FY Interest Accrued / Earned (INR)</label>
                <input
                  type="number"
                  step="any"
                  name="interest_acquired"
                  value={formData.interest_acquired}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g. 18500 (Annual interest)"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Branch / IFSC (Optional)</label>
                <input
                  type="text"
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g. Indiranagar Branch"
                />
              </div>
            </div>
          )}

          {/* Liability Specific Fields (Payment Source & Reminder Schedule) */}
          {assetType === 'liability' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Payment Source (Bank A/C / Card)</label>
                <input
                  type="text"
                  name="payment_source"
                  value={formData.payment_source}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g. HDFC Salary A/c or Credit Card"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Schedule / Due Date</label>
                <input
                  type="text"
                  name="reminder_schedule"
                  value={formData.reminder_schedule}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g. 5th every month / Monthly"
                />
              </div>
            </div>
          )}

          {/* Account Number / Identifier */}
          {(assetType === 'bank' || assetType === 'investment') && (
            <div className="form-group">
              <label className="form-label">
                {assetType === 'bank' && (formData.category?.includes('Deposit') || formData.category?.includes('FD') ? 'Deposit Account Number / FD Certificate No.' : 'Account Number')}
                {assetType === 'investment' && 'Account Number / Demat ID / UAN'}
              </label>
              <input
                type="text"
                name="account_number"
                value={formData.account_number}
                onChange={handleChange}
                className="form-input"
                placeholder={assetType === 'bank' && (formData.category?.includes('Deposit') || formData.category?.includes('FD')) ? "e.g. 50100788835243 or FD-987654" : "e.g. 50100788835243"}
              />
            </div>
          )}

          {/* Property Specific Fields */}
          {assetType === 'property' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">City / Location</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="e.g. Bangalore"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Ownership Type</label>
                <select
                  name="co_ownership"
                  value={formData.co_ownership}
                  onChange={handleChange}
                  className="form-input"
                >
                  <option value="Individual">Individual Sole Owner</option>
                  <option value="HUF">HUF Owned</option>
                  <option value="Co-Owned">Co-Owned with Spouse</option>
                </select>
              </div>
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
                  <label className="form-label">Annual Premium (INR)</label>
                  <input
                    type="number"
                    step="any"
                    name="premium"
                    value={formData.premium}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="e.g. 24000"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Insurance Provider</label>
                  <input
                    type="text"
                    name="provider"
                    value={formData.provider}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="e.g. LIC / HDFC Life"
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
              placeholder={assetType === 'bank' && (formData.category?.includes('Deposit') || formData.category?.includes('FD')) ? "Maturity date, interest rate % (e.g. 7.25% p.a.), tenure, nominee..." : "Branch name, reminders, folio or notes..."}
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
