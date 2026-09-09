import React from 'react';
import { CreditCard, Calendar, Clock, PlusCircle, AlertTriangle, Edit2, Trash2 } from 'lucide-react';
import { formatINR, matchesMember } from '../utils/formatters';

export const LiabilitySection = ({
  data,
  activeMemberId = 'all',
  privacyMode,
  onOpenAddModal,
  onEditAsset,
  onDeleteAsset
}) => {
  const members = data.members || [];
  const items = (data.liabilitiesAndExpenses || []).filter(item => {
    return matchesMember(item.member_id, activeMemberId, members);
  });

  const loans = items.filter(i => i.category === 'Loans & Liabilities');
  const monthlyExpenses = items.filter(i => i.category === 'Fixed Monthly Expenditure');

  const totalLoanCommitment = loans.reduce((acc, l) => acc + Number(l.amount || 0), 0);
  const monthlyOutflow = monthlyExpenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard size={20} color="#f43f5e" />
            Liabilities, Loans & Monthly Outflows
          </h2>
          <p style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
            Outstanding loan balances, recurring family maintenance, EMI dates, and auto-debit cards.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ padding: '0.5rem 1rem', background: 'rgba(244, 63, 94, 0.1)', borderRadius: '10px', border: '1px solid rgba(244, 63, 94, 0.25)', textAlign: 'right' }}>
            <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>Total Outstanding Loans</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fb7185', fontFamily: 'var(--font-mono)' }}>
              {formatINR(totalLoanCommitment, privacyMode)}
            </div>
          </div>
          <div style={{ padding: '0.5rem 1rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.25)', textAlign: 'right' }}>
            <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>Fixed Monthly Outflow</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
              {formatINR(monthlyOutflow, privacyMode)}/mo
            </div>
          </div>
          <button
            onClick={() => onOpenAddModal('liability', 'Loans & Liabilities')}
            className="btn-primary"
            style={{ background: 'linear-gradient(135deg, #f43f5e, #e11d48)' }}
            title="Add loan, mortgage, or credit liability"
          >
            <PlusCircle size={15} />
            <span>+ Add Loan</span>
          </button>
          <button
            onClick={() => onOpenAddModal('liability', 'Fixed Monthly Expenditure')}
            className="btn-primary"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)' }}
            title="Add recurring monthly expense, bill, or maintenance reminder"
          >
            <Calendar size={15} />
            <span>+ Add Monthly Outflow</span>
          </button>
        </div>
      </div>

      {/* Grid of Loans & Commitments */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {/* Loans Table */}
        <div style={{ background: 'rgba(0, 0, 0, 0.25)', borderRadius: 'var(--radius-md)', padding: '1.25rem', border: '1px solid var(--border-glass)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={16} color="#f43f5e" />
              Loans & Liability Commitments
            </h3>
            <button
              onClick={() => onOpenAddModal('liability', 'Loans & Liabilities')}
              className="btn-secondary"
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
            >
              <PlusCircle size={13} /> Add
            </button>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Title & Member</th>
                  <th>Amount</th>
                  <th>Payment Source</th>
                  <th>Schedule</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loans.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem 1rem' }}>
                      No loan commitments found for this entity.
                    </td>
                  </tr>
                ) : (
                  loans.map((l) => {
                    const owner = members.find(m => m.id === l.member_id);
                    return (
                      <tr key={l.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{l.title}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                            {owner && (
                              <span className="badge-tag" style={{ fontSize: '10px', padding: '1px 5px' }}>
                                <span style={{ width: 5, height: 5, borderRadius: '50%', background: owner.avatar_color || '#38bdf8' }}></span>
                                {owner.name}
                              </span>
                            )}
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{l.notes}</span>
                          </div>
                        </td>
                        <td className="mono-text" style={{ fontWeight: 700, color: '#fb7185' }}>
                          {formatINR(l.amount, privacyMode)}
                        </td>
                        <td>{l.payment_source || '-'}</td>
                        <td>
                          <span className="badge-amber" style={{ fontSize: '10px' }}>
                            {l.reminder_schedule || 'Monthly'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                            <button
                              onClick={() => onEditAsset(l, 'liability')}
                              className="btn-icon"
                              style={{ width: 28, height: 28 }}
                              title="Edit loan details"
                            >
                              <Edit2 size={12} color="#38bdf8" />
                            </button>
                            <button
                              onClick={() => onDeleteAsset(
                                l.title,
                                'Loan / Liability',
                                () => {
                                  const updated = {
                                    ...data,
                                    liabilitiesAndExpenses: (data.liabilitiesAndExpenses || []).filter(i => {
                                      if (i.id && l.id) return i.id !== l.id;
                                      return i.title !== l.title;
                                    })
                                  };
                                  return updated;
                                },
                                l,
                                'liability'
                              )}
                              className="btn-icon"
                              style={{ width: 28, height: 28 }}
                              title="Delete loan (Requires Master Password)"
                            >
                              <Trash2 size={12} color="#f87171" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Monthly Household & Subscription Commitments */}
        <div style={{ background: 'rgba(0, 0, 0, 0.25)', borderRadius: 'var(--radius-md)', padding: '1.25rem', border: '1px solid var(--border-glass)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={16} color="#38bdf8" />
              Fixed Monthly Outflows & Reminders
            </h3>
            <button
              onClick={() => onOpenAddModal('liability', 'Fixed Monthly Expenditure')}
              className="btn-secondary"
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
            >
              <PlusCircle size={13} /> Add
            </button>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Expenditure & Member</th>
                  <th>Monthly Amount</th>
                  <th>Account / Card</th>
                  <th>Schedule</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {monthlyExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem 1rem' }}>
                      No recurring monthly outflows found for this entity.
                    </td>
                  </tr>
                ) : (
                  monthlyExpenses.map((exp) => {
                    const owner = members.find(m => m.id === exp.member_id);
                    return (
                      <tr key={exp.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{exp.title}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                            {owner && (
                              <span className="badge-tag" style={{ fontSize: '10px', padding: '1px 5px' }}>
                                <span style={{ width: 5, height: 5, borderRadius: '50%', background: owner.avatar_color || '#38bdf8' }}></span>
                                {owner.name}
                              </span>
                            )}
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{exp.notes}</span>
                          </div>
                        </td>
                        <td className="mono-text" style={{ fontWeight: 600, color: '#fbbf24' }}>
                          {formatINR(exp.amount, privacyMode)}
                        </td>
                        <td>{exp.payment_source || '-'}</td>
                        <td>
                          <span className="badge-blue" style={{ fontSize: '10px' }}>
                            {exp.reminder_schedule || 'Monthly'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                            <button
                              onClick={() => onEditAsset(exp, 'liability')}
                              className="btn-icon"
                              style={{ width: 28, height: 28 }}
                              title="Edit expense details"
                            >
                              <Edit2 size={12} color="#38bdf8" />
                            </button>
                            <button
                              onClick={() => onDeleteAsset(
                                exp.title,
                                'Monthly Outflow',
                                () => {
                                  const updated = {
                                    ...data,
                                    liabilitiesAndExpenses: (data.liabilitiesAndExpenses || []).filter(i => {
                                      if (i.id && exp.id) return i.id !== exp.id;
                                      return i.title !== exp.title;
                                    })
                                  };
                                  return updated;
                                },
                                exp,
                                'liability'
                              )}
                              className="btn-icon"
                              style={{ width: 28, height: 28 }}
                              title="Delete expense (Requires Master Password)"
                            >
                              <Trash2 size={12} color="#f87171" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
