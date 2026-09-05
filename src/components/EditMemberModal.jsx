import React, { useState, useEffect } from 'react';
import { X, UserCheck, Save, Shield, PlusCircle } from 'lucide-react';
import { saveLocalData, syncDataToSupabase } from '../services/dataService';
import { getSupabaseClient } from '../lib/supabaseClient';

export const EditMemberModal = ({
  isOpen,
  onClose,
  member,
  data,
  setData,
  user,
  masterPassword
}) => {
  if (!isOpen) return null;

  const isCreatingNew = !member;

  const [formData, setFormData] = useState({
    name: member?.name || '',
    relation: member?.relation || 'Spouse',
    pan: member?.pan || '',
    aadhaar: member?.aadhaar || '',
    voter_id: member?.voter_id || '',
    driving_license: member?.driving_license || '',
    passport: member?.passport || '',
    pran: member?.pran || '',
    demat_info: member?.demat_info || '',
    avatar_color: member?.avatar_color || '#3b82f6'
  });

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name || '',
        relation: member.relation || 'Spouse',
        pan: member.pan || '',
        aadhaar: member.aadhaar || '',
        voter_id: member.voter_id || '',
        driving_license: member.driving_license || '',
        passport: member.passport || '',
        pran: member.pran || '',
        demat_info: member.demat_info || '',
        avatar_color: member.avatar_color || '#3b82f6'
      });
    } else {
      setFormData({
        name: '',
        relation: 'Spouse',
        pan: '',
        aadhaar: '',
        voter_id: '',
        driving_license: '',
        passport: '',
        pran: '',
        demat_info: '',
        avatar_color: '#3b82f6'
      });
    }
  }, [member, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updated = { ...data };

    if (isCreatingNew) {
      const newMember = {
        id: `mem_${Date.now()}`,
        name: formData.name.trim(),
        relation: formData.relation,
        pan: formData.pan.trim(),
        aadhaar: formData.aadhaar.trim(),
        voter_id: formData.voter_id.trim(),
        driving_license: formData.driving_license.trim(),
        passport: formData.passport.trim(),
        pran: formData.pran.trim(),
        demat_info: formData.demat_info.trim(),
        avatar_color: formData.avatar_color
      };
      updated.members = [...(updated.members || []), newMember];
    } else {
      updated.members = (updated.members || []).map(m => {
        if (m.id === member.id) {
          return {
            ...m,
            name: formData.name.trim(),
            relation: formData.relation,
            pan: formData.pan.trim(),
            aadhaar: formData.aadhaar.trim(),
            voter_id: formData.voter_id.trim(),
            driving_license: formData.driving_license.trim(),
            passport: formData.passport.trim(),
            pran: formData.pran.trim(),
            demat_info: formData.demat_info.trim(),
            avatar_color: formData.avatar_color
          };
        }
        return m;
      });
    }

    saveLocalData(updated, user);
    setData(updated);

    if (getSupabaseClient() && user) {
      syncDataToSupabase(updated, user, masterPassword).catch(console.warn);
    }

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7' }}>
              <UserCheck size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                {isCreatingNew ? 'Add Family Member Entity' : `Edit ${member.name}'s Identity Vault`}
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Store official government IDs (Aadhaar, PAN, Voter ID, Driving License, Passport) with client-side encryption.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g. John Doe"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Relation / Entity</label>
              <select
                name="relation"
                value={formData.relation}
                onChange={handleChange}
                className="form-input"
              >
                <option value="Self">Self</option>
                <option value="Spouse">Spouse</option>
                <option value="Daughter">Daughter</option>
                <option value="Son">Son</option>
                <option value="Mother">Mother</option>
                <option value="Father">Father</option>
                <option value="HUF Entity">HUF Entity</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* PAN */}
            <div className="form-group">
              <label className="form-label">PAN Number</label>
              <input
                type="text"
                name="pan"
                value={formData.pan}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g. ABCDE1234F"
              />
            </div>

            {/* Aadhaar */}
            <div className="form-group">
              <label className="form-label">Aadhaar Number (12-Digit)</label>
              <input
                type="text"
                name="aadhaar"
                value={formData.aadhaar}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g. 1234 5678 9012"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Voter ID */}
            <div className="form-group">
              <label className="form-label">Voter ID (EPIC Card Number)</label>
              <input
                type="text"
                name="voter_id"
                value={formData.voter_id}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g. ABC1234567"
              />
            </div>

            {/* Driving License */}
            <div className="form-group">
              <label className="form-label">Driving License (DL Number)</label>
              <input
                type="text"
                name="driving_license"
                value={formData.driving_license}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g. DL0120150000000"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Passport */}
            <div className="form-group">
              <label className="form-label">Passport Number</label>
              <input
                type="text"
                name="passport"
                value={formData.passport}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g. A1234567"
              />
            </div>

            {/* NPS PRAN */}
            <div className="form-group">
              <label className="form-label">NPS PRAN Number</label>
              <input
                type="text"
                name="pran"
                value={formData.pran}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g. 110000000000"
              />
            </div>
          </div>

          {/* Demat Info */}
          <div className="form-group">
            <label className="form-label">Demat Depository / Stock Broking Notes</label>
            <input
              type="text"
              name="demat_info"
              value={formData.demat_info}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g. IN300000 - 12345678 / Broker Demat"
            />
          </div>

          {/* Color tag */}
          <div className="form-group">
            <label className="form-label">Profile Accent Color</label>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {['#3b82f6', '#ec4899', '#a855f7', '#f59e0b', '#10b981', '#06b6d4', '#ef4444'].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, avatar_color: color })}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: color,
                    border: formData.avatar_color === color ? '3px solid #ffffff' : '1px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer',
                    boxShadow: formData.avatar_color === color ? '0 0 10px ' + color : 'none'
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <Save size={15} /> Save Identity Vault
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
