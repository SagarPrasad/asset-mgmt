import React from 'react';
import { ShieldCheck, HeartPulse, Calendar, PlusCircle, CheckCircle, Edit2, Trash2, Bell, AlertTriangle } from 'lucide-react';
import { formatINR, maskSensitive, matchesMember } from '../utils/formatters';
import { calculateNextDueDate, getUpcomingInsuranceReminders } from '../utils/reminderHelper';

export const InsuranceSection = ({
  data,
  activeMemberId,
  privacyMode,
  onOpenAddModal,
  onEditAsset,
  onDeleteAsset,
  onOpenRemindersModal
}) => {
  const filteredPolicies = (data.insurancePolicies || []).filter(p => {
    return matchesMember(p.member_id, activeMemberId, data.members || []);
  });

  const upcomingReminders = getUpcomingInsuranceReminders(filteredPolicies, 45);

  const totalSumInsured = filteredPolicies.reduce((acc, p) => acc + Number(p.sum_insured || 0), 0);
  const totalAnnualPremium = filteredPolicies
    .filter(p => p.status !== 'All Paid Up')
    .reduce((acc, p) => acc + Number(p.annual_premium || 0), 0);

  return (
    <div className="glass-card">
      {/* Upcoming Reminders Alert Banner if any due */}
      {upcomingReminders.length > 0 && (
        <div style={{
          padding: '0.85rem 1.25rem',
          background: 'rgba(251, 191, 36, 0.1)',
          border: '1px solid rgba(251, 191, 36, 0.3)',
          borderRadius: '10px',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Bell size={18} color="#fbbf24" />
            <div>
              <span style={{ fontWeight: 600, color: '#fbbf24' }}>
                {upcomingReminders.length} Insurance Renewal{upcomingReminders.length === 1 ? '' : 's'} Due Soon:
              </span>
              <span style={{ fontSize: '0.8125rem', color: '#e2e8f0', marginLeft: '6px' }}>
                Next due is {upcomingReminders[0]?.policy.provider} ({upcomingReminders[0]?.formattedDate})
              </span>
            </div>
          </div>
          <button
            onClick={onOpenRemindersModal}
            className="btn-secondary"
            style={{
              padding: '0.3rem 0.75rem',
              fontSize: '0.75rem',
              color: '#fbbf24',
              borderColor: 'rgba(251, 191, 36, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Bell size={12} />
            <span>View All Due Reminders</span>
          </button>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={20} color="#34d399" />
            Insurance Policies & Coverage Portfolio
          </h2>
          <p style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
            Life insurance, term coverage, endowment plans, and family health floater policies.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ padding: '0.5rem 1rem', background: 'rgba(52, 211, 153, 0.1)', borderRadius: '10px', border: '1px solid rgba(52, 211, 153, 0.25)', textAlign: 'right' }}>
            <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>Total Coverage / Sum Insured</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
              {formatINR(totalSumInsured, privacyMode)}
            </div>
          </div>
          <div style={{ padding: '0.5rem 1rem', background: 'rgba(244, 63, 94, 0.1)', borderRadius: '10px', border: '1px solid rgba(244, 63, 94, 0.25)', textAlign: 'right' }}>
            <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>Annual Premium Outflow</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fb7185', fontFamily: 'var(--font-mono)' }}>
              {formatINR(totalAnnualPremium, privacyMode)}
            </div>
          </div>

          <button
            onClick={onOpenRemindersModal}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#fbbf24', borderColor: 'rgba(251, 191, 36, 0.35)' }}
            title="Open upcoming policy renewal reminders popup"
          >
            <Bell size={15} />
            <span>Reminders ({upcomingReminders.length})</span>
          </button>

          <button
            onClick={() => onOpenAddModal('insurance')}
            className="btn-primary"
          >
            <PlusCircle size={15} />
            <span>Add Policy</span>
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Insured Member</th>
              <th>Provider & Plan</th>
              <th>Policy Number</th>
              <th>Sum Insured</th>
              <th>Annual Premium</th>
              <th>Due Date / Schedule</th>
              <th>Status & Mode</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPolicies.map((policy) => {
              const member = data.members?.find(m => m.id === policy.member_id || matchesMember(policy.member_id, m.id, data.members));
              const isPaidUp = policy.status === 'All Paid Up';

              return (
                <tr key={policy.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: member?.avatar_color || '#34d399' }}></span>
                      <span style={{ fontWeight: 600 }}>{member?.name || 'All Family Floater'}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{policy.provider}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{policy.plan_name}</div>
                  </td>
                  <td className="mono-text">
                    {maskSensitive(policy.policy_no, privacyMode)}
                  </td>
                  <td className="mono-text" style={{ fontWeight: 700, color: '#34d399' }}>
                    {formatINR(policy.sum_insured, privacyMode)}
                  </td>
                  <td className="mono-text" style={{ color: isPaidUp ? '#94a3b8' : '#fb7185' }}>
                    {isPaidUp ? '₹0 (Paid Up)' : formatINR(policy.annual_premium, privacyMode)}
                  </td>
                  <td>
                    {(() => {
                      const dueInfo = calculateNextDueDate(policy.premium_date || policy.due_date);
                      return (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem' }}>
                            <Calendar size={13} color="#fbbf24" />
                            <span style={{ fontWeight: 600 }}>{policy.premium_date || 'Annual'}</span>
                          </div>
                          {!isPaidUp && dueInfo && (
                            <div style={{ marginTop: '3px' }}>
                              <span style={{
                                fontSize: '10px',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                background: dueInfo.urgency === 'overdue' 
                                  ? 'rgba(248, 113, 113, 0.2)' 
                                  : dueInfo.urgency === 'due_soon' 
                                  ? 'rgba(251, 191, 36, 0.2)' 
                                  : 'rgba(56, 189, 248, 0.15)',
                                color: dueInfo.urgency === 'overdue' 
                                  ? '#f87171' 
                                  : dueInfo.urgency === 'due_soon' 
                                  ? '#fbbf24' 
                                  : '#38bdf8'
                              }}>
                                {dueInfo.badgeLabel}
                              </span>
                            </div>
                          )}
                          {policy.payment_mode && (
                            <div style={{ fontSize: '0.6875rem', color: '#94a3b8', marginTop: '2px' }}>
                              {policy.payment_mode}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  <td>
                    {isPaidUp ? (
                      <span className="badge-tag" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                        <CheckCircle size={10} /> Fully Paid Up
                      </span>
                    ) : (
                      <span className="badge-blue">
                        Active Premium
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                      <button
                        onClick={() => onEditAsset(policy, 'insurance')}
                        className="btn-icon"
                        style={{ width: 30, height: 30 }}
                        title="Edit policy"
                      >
                        <Edit2 size={13} color="#38bdf8" />
                      </button>
                      <button
                        onClick={() => onDeleteAsset(`${policy.provider} - ${policy.plan_name}`, 'Insurance Policy', () => {
                          const updated = {
                            ...data,
                            insurancePolicies: data.insurancePolicies.filter(p => p.id !== policy.id)
                          };
                          return updated;
                        })}
                        className="btn-icon"
                        style={{ width: 30, height: 30 }}
                        title="Delete policy (Requires Master Password)"
                      >
                        <Trash2 size={13} color="#f87171" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
