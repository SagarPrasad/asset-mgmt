import React, { useState } from 'react';
import { X, Edit, Save } from 'lucide-react';
import { saveLocalData, syncDataToSupabase } from '../services/dataService';
import { getSupabaseClient } from '../lib/supabaseClient';

export const EditAssetModal = ({
  isOpen,
  onClose,
  assetType,
  item,
  data,
  setData,
  activeFy,
  user,
  masterPassword
}) => {
  if (!isOpen || !item) return null;

  // Initialize form based on asset type
  const [formData, setFormData] = useState(() => {
    if (assetType === 'bank') {
      const snap = item.snapshots?.[activeFy.id] || { balance: 0, interest_acquired: 0, investments_linked: 0 };
      return {
        bank_name: item.bank_name || '',
        account_type: item.account_type || '',
        account_number: item.account_number || '',
        customer_id: item.customer_id || '',
        netbanking_user: item.netbanking_user || '',
        netbanking_password: item.netbanking_password || '',
        pin_hint: item.pin_hint || '',
        branch: item.branch || '',
        balance: snap.balance || 0,
        interest_acquired: snap.interest_acquired || 0
      };
    } else if (assetType === 'investment') {
      return {
        institution: item.institution || '',
        category: item.category || '',
        account_identifier: item.account_identifier || '',
        login_user: item.login_user || '',
        login_password: item.login_password || '',
        pin_hint: item.pin_hint || '',
        current_value: item.values?.[activeFy.id] ?? item.current_value ?? 0,
        notes: item.notes || ''
      };
    } else if (assetType === 'insurance') {
      return {
        provider: item.provider || '',
        plan_name: item.plan_name || '',
        policy_no: item.policy_no || '',
        sum_insured: item.sum_insured || 0,
        annual_premium: item.annual_premium || 0,
        premium_date: item.premium_date || '',
        payment_mode: item.payment_mode || '',
        status: item.status || 'Active',
        notes: item.notes || ''
      };
    } else if (assetType === 'property') {
      return {
        title: item.title || '',
        description: item.description || '',
        premises: item.premises || '',
        door_no: item.door_no || '',
        road: item.road || '',
        area: item.area || '',
        city: item.city || '',
        state: item.state || '',
        pincode: item.pincode || '',
        cost_amount: item.cost_amount || 0,
        current_valuation: item.current_valuation || 0,
        co_ownership: item.co_ownership || ''
      };
    } else if (assetType === 'movable') {
      return {
        item_name: item.item_name || '',
        category: item.category || '',
        year_of_purchase: item.year_of_purchase || '',
        original_cost: item.original_cost || 0,
        current_value: item.current_value || 0,
        status: item.status || 'Active',
        notes: item.notes || ''
      };
    } else if (assetType === 'liability') {
      return {
        title: item.title || '',
        category: item.category || '',
        amount: item.amount || 0,
        payment_source: item.payment_source || '',
        reminder_schedule: item.reminder_schedule || '',
        notes: item.notes || ''
      };
    }
    return {};
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updated = { ...data };

    if (assetType === 'bank') {
      updated.bankAccounts = updated.bankAccounts.map(b => {
        if (b.id === item.id) {
          const currentSnaps = b.snapshots || {};
          return {
            ...b,
            bank_name: formData.bank_name,
            account_type: formData.account_type,
            account_number: formData.account_number,
            customer_id: formData.customer_id,
            netbanking_user: formData.netbanking_user,
            netbanking_password: formData.netbanking_password,
            pin_hint: formData.pin_hint,
            branch: formData.branch,
            snapshots: {
              ...currentSnaps,
              [activeFy.id]: {
                balance: Number(formData.balance || 0),
                interest_acquired: Number(formData.interest_acquired || 0),
                investments_linked: currentSnaps[activeFy.id]?.investments_linked || 0
              }
            }
          };
        }
        return b;
      });
    } else if (assetType === 'investment') {
      updated.investments = updated.investments.map(inv => {
        if (inv.id === item.id) {
          const currentVals = inv.values || {};
          return {
            ...inv,
            institution: formData.institution,
            category: formData.category,
            account_identifier: formData.account_identifier,
            login_user: formData.login_user,
            login_password: formData.login_password,
            pin_hint: formData.pin_hint,
            values: {
              ...currentVals,
              [activeFy.id]: Number(formData.current_value || 0)
            },
            notes: formData.notes
          };
        }
        return inv;
      });
    } else if (assetType === 'insurance') {
      updated.insurancePolicies = updated.insurancePolicies.map(ins => {
        if (ins.id === item.id) {
          return {
            ...ins,
            provider: formData.provider,
            plan_name: formData.plan_name,
            policy_no: formData.policy_no,
            sum_insured: Number(formData.sum_insured || 0),
            annual_premium: Number(formData.annual_premium || 0),
            premium_date: formData.premium_date,
            payment_mode: formData.payment_mode,
            status: formData.status,
            notes: formData.notes
          };
        }
        return ins;
      });
    } else if (assetType === 'property') {
      updated.immovableProperties = updated.immovableProperties.map(p => {
        if (p.id === item.id) {
          return {
            ...p,
            title: formData.title,
            description: formData.description,
            premises: formData.premises,
            door_no: formData.door_no,
            road: formData.road,
            area: formData.area,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
            cost_amount: Number(formData.cost_amount || 0),
            current_valuation: Number(formData.current_valuation || 0),
            co_ownership: formData.co_ownership
          };
        }
        return p;
      });
    } else if (assetType === 'movable') {
      updated.movableAssets = updated.movableAssets.map(m => {
        if (m.id === item.id) {
          return {
            ...m,
            item_name: formData.item_name,
            category: formData.category,
            year_of_purchase: formData.year_of_purchase,
            original_cost: Number(formData.original_cost || 0),
            current_value: Number(formData.current_value || 0),
            status: formData.status,
            notes: formData.notes
          };
        }
        return m;
      });
    } else if (assetType === 'liability') {
      updated.liabilitiesAndExpenses = updated.liabilitiesAndExpenses.map(l => {
        if (l.id === item.id) {
          return {
            ...l,
            title: formData.title,
            category: formData.category,
            amount: Number(formData.amount || 0),
            payment_source: formData.payment_source,
            reminder_schedule: formData.reminder_schedule,
            notes: formData.notes
          };
        }
        return l;
      });
    }

    saveLocalData(updated, user);
    setData(updated);

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
              <Edit size={18} color="#38bdf8" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                Edit Details ({activeFy.label})
              </h2>
              <span className="badge-tag" style={{ textTransform: 'capitalize' }}>{assetType} Record</span>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* BANK FIELDS */}
          {assetType === 'bank' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Bank Name</label>
                  <input type="text" name="bank_name" value={formData.bank_name} onChange={handleChange} className="form-input" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Account Type</label>
                  <input type="text" name="account_type" value={formData.account_type} onChange={handleChange} className="form-input" required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Account Number</label>
                  <input type="text" name="account_number" value={formData.account_number} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Customer ID</label>
                  <input type="text" name="customer_id" value={formData.customer_id} onChange={handleChange} className="form-input" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Netbanking Username</label>
                  <input type="text" name="netbanking_user" value={formData.netbanking_user} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Netbanking Password</label>
                  <input type="text" name="netbanking_password" value={formData.netbanking_password} onChange={handleChange} className="form-input" placeholder="Save password..." />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">PIN Hint / Profile Note</label>
                <input type="text" name="pin_hint" value={formData.pin_hint} onChange={handleChange} className="form-input" placeholder="e.g. Profile password / OTP mobile" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">March 31 Balance ({activeFy.label})</label>
                  <input type="number" step="any" name="balance" value={formData.balance} onChange={handleChange} className="form-input" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Interest Earned ({activeFy.label})</label>
                  <input type="number" step="any" name="interest_acquired" value={formData.interest_acquired} onChange={handleChange} className="form-input" />
                </div>
              </div>
            </>
          )}

          {/* INVESTMENT FIELDS */}
          {assetType === 'investment' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Institution / Platform</label>
                  <input type="text" name="institution" value={formData.institution} onChange={handleChange} className="form-input" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input type="text" name="category" value={formData.category} onChange={handleChange} className="form-input" required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Account Identifier (PRAN / UAN / Demat A/C)</label>
                <input type="text" name="account_identifier" value={formData.account_identifier} onChange={handleChange} className="form-input" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Login Username / ID</label>
                  <input type="text" name="login_user" value={formData.login_user} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Login Password</label>
                  <input type="text" name="login_password" value={formData.login_password} onChange={handleChange} className="form-input" placeholder="Portal password..." />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Valuation in {activeFy.label} (INR)</label>
                  <input type="number" step="any" name="current_value" value={formData.current_value} onChange={handleChange} className="form-input" required />
                </div>
                <div className="form-group">
                  <label className="form-label">PIN / 2FA Note</label>
                  <input type="text" name="pin_hint" value={formData.pin_hint} onChange={handleChange} className="form-input" />
                </div>
              </div>
            </>
          )}

          {/* INSURANCE FIELDS */}
          {assetType === 'insurance' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Provider (LIC, Max Life, etc.)</label>
                  <input type="text" name="provider" value={formData.provider} onChange={handleChange} className="form-input" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Plan Name</label>
                  <input type="text" name="plan_name" value={formData.plan_name} onChange={handleChange} className="form-input" required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Policy Number</label>
                <input type="text" name="policy_no" value={formData.policy_no} onChange={handleChange} className="form-input" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Sum Insured (INR)</label>
                  <input type="number" name="sum_insured" value={formData.sum_insured} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Annual Premium (INR)</label>
                  <input type="number" name="annual_premium" value={formData.annual_premium} onChange={handleChange} className="form-input" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Due Date Schedule</label>
                  <input type="text" name="premium_date" value={formData.premium_date} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Status (Active / All Paid Up)</label>
                  <input type="text" name="status" value={formData.status} onChange={handleChange} className="form-input" />
                </div>
              </div>
            </>
          )}

          {/* PROPERTY FIELDS */}
          {assetType === 'property' && (
            <>
              <div className="form-group">
                <label className="form-label">Property Title</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} className="form-input" required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Premises / Project</label>
                  <input type="text" name="premises" value={formData.premises} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Door / Flat No</label>
                  <input type="text" name="door_no" value={formData.door_no} onChange={handleChange} className="form-input" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input type="text" name="city" value={formData.city} onChange={handleChange} className="form-input" required />
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <input type="text" name="state" value={formData.state} onChange={handleChange} className="form-input" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Acquisition Cost (INR)</label>
                  <input type="number" step="any" name="cost_amount" value={formData.cost_amount} onChange={handleChange} className="form-input" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Current Valuation (INR)</label>
                  <input type="number" step="any" name="current_valuation" value={formData.current_valuation} onChange={handleChange} className="form-input" />
                </div>
              </div>
            </>
          )}

          {/* MOVABLE FIELDS */}
          {assetType === 'movable' && (
            <>
              <div className="form-group">
                <label className="form-label">Item / Asset Name</label>
                <input type="text" name="item_name" value={formData.item_name} onChange={handleChange} className="form-input" required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Original Cost (INR)</label>
                  <input type="number" step="any" name="original_cost" value={formData.original_cost} onChange={handleChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Current Valuation (INR)</label>
                  <input type="number" step="any" name="current_value" value={formData.current_value} onChange={handleChange} className="form-input" required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Status (Active / Sold)</label>
                <input type="text" name="status" value={formData.status} onChange={handleChange} className="form-input" />
              </div>
            </>
          )}

          {/* LIABILITY FIELDS */}
          {assetType === 'liability' && (
            <>
              <div className="form-group">
                <label className="form-label">Liability / Commitment Title</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} className="form-input" required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Amount (INR)</label>
                  <input type="number" step="any" name="amount" value={formData.amount} onChange={handleChange} className="form-input" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Source (Card / Bank)</label>
                  <input type="text" name="payment_source" value={formData.payment_source} onChange={handleChange} className="form-input" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Schedule / Reminder (e.g. 20th every month)</label>
                <input type="text" name="reminder_schedule" value={formData.reminder_schedule} onChange={handleChange} className="form-input" />
              </div>
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <Save size={15} /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
