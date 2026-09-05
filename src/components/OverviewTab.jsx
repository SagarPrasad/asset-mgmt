import React from 'react';
import {
  TrendingUp,
  Building2,
  Landmark,
  ShieldCheck,
  Car,
  CreditCard,
  Percent,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Edit3,
  PlusCircle,
  Shield,
  FileBadge
} from 'lucide-react';
import { formatINR, formatCompactINR, maskSensitive } from '../utils/formatters';

export const OverviewTab = ({
  totals,
  totalsByFy,
  data,
  activeFy,
  activeMemberId,
  privacyMode,
  onNavigateTab,
  onEditMember,
  onAddMember
}) => {
  const currentMember = (data?.members || []).find(m => m.id === activeMemberId);

  // Calculate allocation percentages
  const totalAssets = totals.totalAssets || 1;
  const bankPercent = Math.round((totals.bankTotal / totalAssets) * 100);
  const invPercent = Math.round((totals.investmentTotal / totalAssets) * 100);
  const propPercent = Math.round((totals.propertyTotal / totalAssets) * 100);
  const movPercent = Math.round((totals.movableTotal / totalAssets) * 100);

  return (
    <div>
      {/* Top Executive KPI Cards */}
      <div className="metrics-grid">
        {/* Net Worth */}
        <div className="stat-card" style={{ '--card-accent': '#38bdf8' }}>
          <div className="stat-header">
            <span className="stat-title">Total Net Worth</span>
            <div className="stat-icon" style={{ background: 'rgba(56, 189, 248, 0.15)' }}>
              <TrendingUp size={18} color="#38bdf8" />
            </div>
          </div>
          <div className="stat-value" style={{ color: '#38bdf8' }}>
            {formatINR(totals.netWorth, privacyMode)}
          </div>
          <div className="stat-sub">
            <span style={{ color: '#34d399', fontWeight: 600 }}>
              {formatCompactINR(totals.netWorth, privacyMode)}
            </span>
            <span>• Assets minus Total Liabilities</span>
          </div>
        </div>

        {/* Bank Balances */}
        <div className="stat-card" style={{ '--card-accent': '#10b981' }}>
          <div className="stat-header">
            <span className="stat-title">Bank Balances & Deposits</span>
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
              <Landmark size={18} color="#10b981" />
            </div>
          </div>
          <div className="stat-value" style={{ color: '#10b981' }}>
            {formatINR(totals.bankTotal, privacyMode)}
          </div>
          <div className="stat-sub">
            <span style={{ color: '#fbbf24', fontWeight: 600 }}>
              +{formatINR(totals.interestTotal, privacyMode)}
            </span>
            <span>Bank interest earned in {activeFy?.label}</span>
          </div>
        </div>

        {/* Demat & Retirement */}
        <div className="stat-card" style={{ '--card-accent': '#8b5cf6' }}>
          <div className="stat-header">
            <span className="stat-title">Demat, PF & Retirement</span>
            <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.15)' }}>
              <Percent size={18} color="#8b5cf6" />
            </div>
          </div>
          <div className="stat-value" style={{ color: '#c084fc' }}>
            {formatINR(totals.investmentTotal, privacyMode)}
          </div>
          <div className="stat-sub">
            <span>EPFO + NPS + Equities & MFs</span>
          </div>
        </div>

        {/* Immovable Real Estate */}
        <div className="stat-card" style={{ '--card-accent': '#f59e0b' }}>
          <div className="stat-header">
            <span className="stat-title">Immovable Properties</span>
            <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)' }}>
              <Building2 size={18} color="#f59e0b" />
            </div>
          </div>
          <div className="stat-value" style={{ color: '#fbbf24' }}>
            {formatINR(totals.propertyTotal, privacyMode)}
          </div>
          <div className="stat-sub">
            <span>{data.immovableProperties?.length || 0} Registered Properties</span>
          </div>
        </div>

        {/* Movable Physical Assets */}
        <div className="stat-card" style={{ '--card-accent': '#ec4899' }}>
          <div className="stat-header">
            <span className="stat-title">Movable Physical Assets</span>
            <div className="stat-icon" style={{ background: 'rgba(236, 72, 153, 0.15)' }}>
              <Car size={18} color="#ec4899" />
            </div>
          </div>
          <div className="stat-value" style={{ color: '#f472b6' }}>
            {formatINR(totals.movableTotal, privacyMode)}
          </div>
          <div className="stat-sub">
            <span>Vehicles + Gold & Bullion + Art + Cash</span>
          </div>
        </div>

        {/* Liabilities */}
        <div className="stat-card" style={{ '--card-accent': '#f43f5e' }}>
          <div className="stat-header">
            <span className="stat-title">Liabilities & Loans</span>
            <div className="stat-icon" style={{ background: 'rgba(244, 63, 94, 0.15)' }}>
              <CreditCard size={18} color="#f43f5e" />
            </div>
          </div>
          <div className="stat-value" style={{ color: '#fb7185' }}>
            {formatINR(totals.liabilityTotal, privacyMode)}
          </div>
          <div className="stat-sub">
            <span>HUF Loan (₹15L) + Car Loan EMI</span>
          </div>
        </div>
      </div>

      {/* Grid: Asset Allocation + YoY Trend */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Asset Allocation Card */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Landmark size={18} color="#38bdf8" />
              Asset Allocation Breakdown ({activeFy?.label})
            </h2>
            <span className="badge-tag">Total: {formatCompactINR(totals.totalAssets, privacyMode)}</span>
          </div>

          {/* Progress Stack Bar */}
          <div style={{
            display: 'flex',
            height: '24px',
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '1.5rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-glass)'
          }}>
            <div style={{ width: `${propPercent}%`, background: '#f59e0b' }} title={`Real Estate: ${propPercent}%`}></div>
            <div style={{ width: `${invPercent}%`, background: '#8b5cf6' }} title={`Retirement & Demat: ${invPercent}%`}></div>
            <div style={{ width: `${bankPercent}%`, background: '#10b981' }} title={`Bank Balances: ${bankPercent}%`}></div>
            <div style={{ width: `${movPercent}%`, background: '#ec4899' }} title={`Physical & Movable: ${movPercent}%`}></div>
          </div>

          {/* Allocation Legend */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }}></span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Immovable Properties</span>
              </div>
              <span style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{propPercent}%</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(139, 92, 246, 0.08)', borderRadius: '10px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#8b5cf6' }}></span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Retirement & Demat</span>
              </div>
              <span style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{invPercent}%</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }}></span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Bank Accounts</span>
              </div>
              <span style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{bankPercent}%</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(236, 72, 153, 0.08)', borderRadius: '10px', border: '1px solid rgba(236, 72, 153, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ec4899' }}></span>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Vehicles & Physical</span>
              </div>
              <span style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{movPercent}%</span>
            </div>
          </div>
        </div>

        {/* Multi-Year Timeline Comparison */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={18} color="#10b981" />
              Multi-Year Portfolio Timeline
            </h2>
            <span className="badge-tag">As on 31st March</span>
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Financial Year</th>
                  <th>Bank Balances</th>
                  <th>Interest</th>
                  <th>Total Net Worth</th>
                </tr>
              </thead>
              <tbody>
                {data.financialYears.map((fy) => {
                  const t = totalsByFy[fy.id] || {};
                  const isActive = fy.id === activeFy?.id;
                  return (
                    <tr
                      key={fy.id}
                      style={{
                        background: isActive ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
                        fontWeight: isActive ? 600 : 400
                      }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ color: isActive ? '#38bdf8' : 'inherit' }}>{fy.label}</span>
                          {isActive && <span className="badge-tag" style={{ fontSize: '10px' }}>Active</span>}
                        </div>
                      </td>
                      <td className="mono-text">{formatINR(t.bankTotal, privacyMode)}</td>
                      <td className="mono-text" style={{ color: '#fbbf24' }}>+{formatINR(t.interestTotal, privacyMode)}</td>
                      <td className="mono-text" style={{ color: '#38bdf8', fontWeight: 700 }}>
                        {formatINR(t.netWorth, privacyMode)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={14} color="#10b981" />
            <span>Extracted directly from FY 23-24, FY 24-25, and FY 25-26 sheets in your workbook.</span>
          </div>
        </div>
      </div>

      {/* Highlights & Quick Schedule */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Insurance Calendar Highlights */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={16} color="#34d399" />
              Insurance Due Dates & Status
            </h3>
            <button
              onClick={() => onNavigateTab('insurance')}
              className="btn-secondary"
              style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem' }}
            >
              View All
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(data.insurancePolicies || []).slice(0, 3).map((ins) => (
              <div
                key={ins.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-glass)'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{ins.provider}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{ins.plan_name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#34d399' }}>
                    {ins.status === 'All Paid Up' ? 'Paid Up' : formatINR(ins.annual_premium, privacyMode)}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#fbbf24' }}>
                    {ins.premium_date || 'Due Annual'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Recurring Expenses & EMIs */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={16} color="#fbbf24" />
              Monthly EMIs & Commitments
            </h3>
            <button
              onClick={() => onNavigateTab('liabilities')}
              className="btn-secondary"
              style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem' }}
            >
              View All
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(data.liabilitiesAndExpenses || []).slice(0, 3).map((exp) => (
              <div
                key={exp.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-glass)'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{exp.title}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    {exp.reminder_schedule} • {exp.payment_source}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#fb7185' }}>
                    {formatINR(exp.amount, privacyMode)}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>
                    {exp.frequency}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Family Member Profile & Identity */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} color="#a855f7" />
              Family Member Identity Vault
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge-purple" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Shield size={11} /> AES-256
              </span>
              {onAddMember && (
                <button
                  onClick={onAddMember}
                  className="btn-secondary"
                  style={{
                    padding: '0.25rem 0.625rem',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    color: '#c084fc',
                    borderColor: 'rgba(192, 132, 252, 0.4)'
                  }}
                  title="Add New Family Member Entity"
                >
                  <PlusCircle size={13} />
                  <span>+ Add Member</span>
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {(activeMemberId === 'all' ? (data.members || []) : [currentMember]).filter(Boolean).map((mem) => (
              <div
                key={mem.id}
                style={{
                  padding: '0.85rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-glass)'
                }}
              >
                {/* Member Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: mem.avatar_color || '#3b82f6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#ffffff'
                    }}>
                      {mem.name.charAt(0)}
                    </div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: mem.avatar_color }}>{mem.name}</span>
                    <span className="badge-tag" style={{ fontSize: '10px', padding: '1px 6px' }}>{mem.relation}</span>
                  </div>

                  {onEditMember && (
                    <button
                      onClick={() => onEditMember(mem)}
                      className="btn-secondary"
                      style={{
                        padding: '0.2rem 0.55rem',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        color: '#38bdf8',
                        borderColor: 'rgba(56, 189, 248, 0.3)'
                      }}
                      title={`Edit ${mem.name}'s Aadhaar, PAN, Voter ID, DL, and Passport`}
                    >
                      <Edit3 size={12} />
                      <span>Edit IDs</span>
                    </button>
                  )}
                </div>

                {/* Identity Documents Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                  gap: '0.5rem',
                  fontSize: '0.75rem'
                }}>
                  {/* PAN */}
                  <div style={{
                    padding: '0.4rem 0.6rem',
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.6875rem', marginBottom: '2px' }}>PAN Card</div>
                    <div style={{ fontWeight: 600, color: mem.pan ? '#f8fafc' : '#64748b', fontFamily: 'var(--font-mono)' }}>
                      {mem.pan ? maskSensitive(mem.pan, privacyMode) : 'Not linked'}
                    </div>
                  </div>

                  {/* Aadhaar */}
                  <div style={{
                    padding: '0.4rem 0.6rem',
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.6875rem', marginBottom: '2px' }}>Aadhaar (12-Digit)</div>
                    <div style={{ fontWeight: 600, color: mem.aadhaar ? '#f8fafc' : '#64748b', fontFamily: 'var(--font-mono)' }}>
                      {mem.aadhaar ? maskSensitive(mem.aadhaar, privacyMode) : 'Not linked'}
                    </div>
                  </div>

                  {/* Voter ID */}
                  <div style={{
                    padding: '0.4rem 0.6rem',
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.6875rem', marginBottom: '2px' }}>Voter ID (EPIC)</div>
                    <div style={{ fontWeight: 600, color: mem.voter_id ? '#f8fafc' : '#64748b', fontFamily: 'var(--font-mono)' }}>
                      {mem.voter_id ? maskSensitive(mem.voter_id, privacyMode) : 'Not linked'}
                    </div>
                  </div>

                  {/* Driving License */}
                  <div style={{
                    padding: '0.4rem 0.6rem',
                    background: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    <div style={{ color: '#94a3b8', fontSize: '0.6875rem', marginBottom: '2px' }}>Driving License</div>
                    <div style={{ fontWeight: 600, color: mem.driving_license ? '#f8fafc' : '#64748b', fontFamily: 'var(--font-mono)' }}>
                      {mem.driving_license ? maskSensitive(mem.driving_license, privacyMode) : 'Not linked'}
                    </div>
                  </div>
                </div>

                {/* Additional IDs: Passport, PRAN, Demat */}
                {(mem.passport || mem.pran || mem.demat_info) && (
                  <div style={{
                    marginTop: '0.5rem',
                    paddingTop: '0.5rem',
                    borderTop: '1px dashed rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.85rem',
                    fontSize: '0.72rem',
                    color: '#94a3b8'
                  }}>
                    {mem.passport && (
                      <span>Passport: <strong style={{ color: '#f8fafc' }}>{maskSensitive(mem.passport, privacyMode)}</strong></span>
                    )}
                    {mem.pran && (
                      <span>NPS PRAN: <strong style={{ color: '#38bdf8' }}>{maskSensitive(mem.pran, privacyMode)}</strong></span>
                    )}
                    {mem.demat_info && (
                      <span>Demat: <strong style={{ color: '#a855f7' }}>{mem.demat_info}</strong></span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
