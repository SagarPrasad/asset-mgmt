import React from 'react';
import { Bell, AlertTriangle, Calendar, ShieldCheck, X, CheckCircle, ExternalLink } from 'lucide-react';
import { formatINR, matchesMember } from '../utils/formatters';

export const UpcomingRemindersModal = ({
  isOpen,
  onClose,
  reminders,
  data,
  privacyMode,
  onNavigateTab
}) => {
  if (!isOpen) return null;

  const totalUpcomingAmount = reminders.reduce((sum, r) => sum + Number(r.policy.annual_premium || 0), 0);

  const handleSnooze = () => {
    sessionStorage.setItem('insurance_reminders_snoozed', 'true');
    onClose();
  };

  const handleGoToInsurance = () => {
    onClose();
    if (onNavigateTab) {
      onNavigateTab('insurance');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '12px',
              background: 'rgba(251, 191, 36, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fbbf24',
              border: '1px solid rgba(251, 191, 36, 0.3)'
            }}>
              <Bell size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Upcoming Policy Due Reminders
                <span className="badge-tag" style={{ background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', fontSize: '11px' }}>
                  {reminders.length} Due Soon
                </span>
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Automated alert for insurance renewals and premium due dates.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        {/* Summary Card */}
        <div style={{
          padding: '1rem',
          background: 'rgba(251, 191, 36, 0.08)',
          borderRadius: '12px',
          border: '1px solid rgba(251, 191, 36, 0.25)',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Total Premium Outflow (Upcoming)</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
              {formatINR(totalUpcomingAmount, privacyMode)}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#e2e8f0' }}>
            <Calendar size={15} color="#38bdf8" />
            <span>Next Due: <strong>{reminders[0]?.formattedDate || 'Upcoming'}</strong></span>
          </div>
        </div>

        {/* Reminders List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
          {reminders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
              <CheckCircle size={36} color="#34d399" style={{ margin: '0 auto 0.75rem' }} />
              <p style={{ fontWeight: 600, color: '#f8fafc' }}>All Caught Up!</p>
              <p style={{ fontSize: '0.8125rem' }}>No policies have premium renewals due in the next 45 days.</p>
            </div>
          ) : (
            reminders.map(({ policy, daysRemaining, urgency, badgeLabel, formattedDate }) => {
              const member = data?.members?.find(m => m.id === policy.member_id || matchesMember(policy.member_id, m.id, data?.members || []));

              const badgeColor = urgency === 'overdue' 
                ? '#f87171' 
                : urgency === 'due_soon' 
                ? '#fbbf24' 
                : '#38bdf8';

              const badgeBg = urgency === 'overdue' 
                ? 'rgba(248, 113, 113, 0.15)' 
                : urgency === 'due_soon' 
                ? 'rgba(251, 191, 36, 0.15)' 
                : 'rgba(56, 189, 248, 0.15)';

              return (
                <div
                  key={policy.id}
                  style={{
                    padding: '1rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '10px',
                    border: '1px solid var(--border-glass)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#f8fafc' }}>
                        {policy.provider}
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                        {policy.plan_name}
                      </div>
                    </div>

                    {/* Urgency Badge */}
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: badgeBg,
                      color: badgeColor,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      border: `1px solid ${badgeColor}33`
                    }}>
                      <Calendar size={12} />
                      {badgeLabel}
                    </span>
                  </div>

                  {/* Policy Details Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: '0.65rem',
                    fontSize: '0.75rem',
                    marginTop: '0.5rem',
                    padding: '0.65rem',
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '8px'
                  }}>
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '0.6875rem' }}>Annual Premium</div>
                      <div style={{ fontWeight: 700, color: '#fb7185', fontSize: '0.875rem', fontFamily: 'var(--font-mono)' }}>
                        {formatINR(policy.annual_premium, privacyMode)}
                      </div>
                    </div>

                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '0.6875rem' }}>Due Date</div>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>
                        {formattedDate} ({policy.premium_date})
                      </div>
                    </div>

                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '0.6875rem' }}>Insured Member</div>
                      <div style={{ fontWeight: 600, color: member?.avatar_color || '#38bdf8' }}>
                        {member?.name || 'Family Floater'}
                      </div>
                    </div>

                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '0.6875rem' }}>Payment Mode</div>
                      <div style={{ color: '#cbd5e1' }}>
                        {policy.payment_mode || 'Auto Debit'}
                      </div>
                    </div>
                  </div>

                  {policy.notes && (
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                      💡 {policy.notes}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1rem' }}>
          <button
            onClick={handleSnooze}
            className="btn-secondary"
            style={{ fontSize: '0.8125rem' }}
          >
            Snooze for this session
          </button>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={handleGoToInsurance}
              className="btn-primary"
              style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <ExternalLink size={14} />
              <span>View Insurance Section</span>
            </button>
            <button
              onClick={onClose}
              className="btn-secondary"
              style={{ fontSize: '0.8125rem' }}
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
