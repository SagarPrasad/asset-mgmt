import React, { useState, useEffect } from 'react';
import { FileText, Printer, Shield, CheckCircle2, UserCheck, Users, Building, AlertCircle } from 'lucide-react';
import { formatINR, maskSensitive, matchesMember } from '../utils/formatters';

export const ScheduleALView = ({
  data,
  activeFy,
  activeMemberId,
  privacyMode
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState(activeMemberId || 'all');

  // Keep synced if user switches member from top bar
  useEffect(() => {
    if (activeMemberId) {
      setSelectedMemberId(activeMemberId);
    }
  }, [activeMemberId]);

  const members = data.members || [];
  const selectedMember = members.find(m => m.id === selectedMemberId);
  const isHuf = selectedMember ? (selectedMember.name || '').toLowerCase().includes('huf') : false;

  // Derive Assessment Year from activeFy (e.g. FY 2025-26 -> AY 2026-27)
  const getAssessmentYear = (fyLabel = '') => {
    const match = fyLabel.match(/(\d{2,4})[^\d]+(\d{2,4})/);
    if (match) {
      const startYear = parseInt(match[1].length === 2 ? `20${match[1]}` : match[1], 10);
      return `AY ${startYear + 1}-${String(startYear + 2).slice(-2)}`;
    }
    return 'AY 2026-27';
  };

  const assessmentYear = getAssessmentYear(activeFy?.label);

  // Filter asset collections strictly by selected taxpayer
  const filteredProps = (data.immovableProperties || []).filter(p =>
    matchesMember(p.member_id, selectedMemberId, members)
  );

  const filteredBanks = (data.bankAccounts || []).filter(b =>
    matchesMember(b.member_id, selectedMemberId, members)
  );

  const filteredDemat = (data.dematHoldings || []).filter(h =>
    matchesMember(h.member_id, selectedMemberId, members)
  );

  const filteredInvs = (data.investments || []).filter(inv =>
    matchesMember(inv.member_id, selectedMemberId, members)
  );

  const filteredInsurance = (data.insurancePolicies || []).filter(p =>
    matchesMember(p.member_id, selectedMemberId, members)
  );

  const filteredMovables = (data.movableAssets || []).filter(m =>
    matchesMember(m.member_id, selectedMemberId, members)
  );

  const filteredLiabs = (data.liabilitiesAndExpenses || []).filter(l =>
    matchesMember(l.member_id, selectedMemberId, members)
  );

  // Compute exact values matching sheet '26' / ITR Schedule AL
  const immovableTotal = filteredProps.reduce((acc, p) => acc + Number(p.cost_amount || 0), 0);

  const bankDeposits = filteredBanks.reduce((acc, b) => {
    return acc + Number(b.snapshots?.[activeFy.id]?.balance || 0);
  }, 0);

  const dematHoldingsValue = filteredDemat.reduce((acc, h) => {
    const curVal = Number(h.current_value) || (Number(h.units || 0) * Number(h.current_price || 0)) || Number(h.invested_amount || 0);
    return acc + curVal;
  }, 0);

  const sharesAndSecurities = dematHoldingsValue + filteredInvs
    .filter(inv => inv.category === 'Shares and Securities' || inv.category === 'Fixed Income / Bonds')
    .reduce((acc, inv) => {
      return acc + Number(inv.values?.[activeFy.id] ?? inv.values?.['fy_25_26'] ?? inv.current_value ?? 0);
    }, 0);

  const activeInsurance = filteredInsurance
    .filter(p => p.status !== 'All Paid Up')
    .reduce((acc, p) => acc + Number(p.annual_premium || 0), 0);

  const jewellery = filteredMovables
    .filter(m => m.category === 'Jewellery, bullion etc.' && m.status !== 'Sold')
    .reduce((acc, m) => acc + Number(m.current_value || 0), 0);

  const artwork = filteredMovables
    .filter(m => m.category === 'Paintings / Artwork etc.' && m.status !== 'Sold')
    .reduce((acc, m) => acc + Number(m.current_value || 0), 0);

  const vehicles = filteredMovables
    .filter(m => m.category === 'Vehicles / Boats etc.' && m.status !== 'Sold')
    .reduce((acc, m) => acc + Number(m.current_value || 0), 0);

  const cashInHand = filteredMovables
    .filter(m => m.category === 'Cash in hand' && m.status !== 'Sold')
    .reduce((acc, m) => acc + Number(m.current_value || 0), 0);

  const loans = filteredLiabs
    .filter(l => l.category === 'Loans & Liabilities')
    .reduce((acc, l) => acc + Number(l.amount || l.outstanding_balance || 0), 0);

  const totalMovables = bankDeposits + sharesAndSecurities + activeInsurance + cashInHand + jewellery + artwork + vehicles;
  const netAssets = (immovableTotal + totalMovables) - loans;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="glass-card">
      {/* Top Header & Taxpayer Selector */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} color="#38bdf8" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
              ITR Schedule AL (Assets and Liabilities as on 31st March)
            </h2>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Statutory tax disclosure formatted in compliance with Indian Income Tax Department guidelines.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={handlePrint}
            className="btn-secondary"
            title="Print Schedule AL or save as PDF"
          >
            <Printer size={16} />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Taxpayer Entity Switcher Pills */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '1.25rem',
        padding: '0.5rem 0.75rem',
        background: 'var(--bg-card-inner)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-glass)',
        overflowX: 'auto'
      }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '0.25rem' }}>
          Taxpayer:
        </span>
        <button
          onClick={() => setSelectedMemberId('all')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.35rem 0.75rem',
            borderRadius: '999px',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            border: selectedMemberId === 'all' ? '1px solid #38bdf8' : '1px solid var(--border-glass)',
            background: selectedMemberId === 'all' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            color: selectedMemberId === 'all' ? '#38bdf8' : 'var(--text-secondary)',
            transition: 'all 0.15s ease'
          }}
        >
          <Users size={13} />
          All Family (Consolidated)
        </button>

        {members.map(m => {
          const isSelected = selectedMemberId === m.id;
          const isMemberHuf = (m.name || '').toLowerCase().includes('huf');
          return (
            <button
              key={m.id}
              onClick={() => setSelectedMemberId(m.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: isSelected ? `1px solid ${m.avatar_color || '#10b981'}` : '1px solid var(--border-glass)',
                background: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                color: isSelected ? (m.avatar_color || '#34d399') : 'var(--text-secondary)',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: m.avatar_color || '#10b981'
              }} />
              {m.name}
              {isMemberHuf && <span style={{ fontSize: '0.625rem', opacity: 0.8 }}>(HUF)</span>}
            </button>
          );
        })}
      </div>

      <div style={{
        background: 'var(--bg-card-inner)',
        border: '1px solid var(--border-glass-bright)',
        borderRadius: 'var(--radius-md)',
        padding: '1.5rem',
        color: 'var(--text-primary)'
      }}>
        {/* Taxpayer Information Summary Card */}
        <div style={{
          borderBottom: '2px solid var(--border-glass)',
          paddingBottom: '1.25rem',
          marginBottom: '1.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          background: 'rgba(255, 255, 255, 0.02)',
          padding: '1rem',
          borderRadius: 'var(--radius-sm)'
        }}>
          <div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Taxpayer Name
            </div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
              {selectedMember ? selectedMember.name : 'Consolidated Family Wealth'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Status / Entity Type
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: isHuf ? '#fbbf24' : '#38bdf8', marginTop: '0.2rem' }}>
              {selectedMemberId === 'all' ? 'Multi-Entity Consolidated' : (isHuf ? 'Hindu Undivided Family (HUF)' : 'Individual Taxpayer')}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Permanent Account Number (PAN)
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
              {selectedMember?.pan ? maskSensitive(selectedMember.pan, privacyMode, 4) : 'Recorded in IT Portal'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Assessment Year / Valuation Date
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#10b981', marginTop: '0.2rem' }}>
              {assessmentYear} (As on 31-03-{activeFy.label?.slice(-2) || '26'})
            </div>
          </div>
        </div>

        {/* Schedule AL Structured Breakdown Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table" style={{ fontSize: '0.875rem', width: '100%' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                <th style={{ width: '50px' }}>Item</th>
                <th>Particulars of Asset / Liability</th>
                <th style={{ width: '220px', textAlign: 'right' }}>Amount (Cost / Val) in INR</th>
              </tr>
            </thead>
            <tbody>
              {/* Part 1: Immovable */}
              <tr style={{ background: 'rgba(245, 158, 11, 0.06)' }}>
                <td style={{ fontWeight: 700 }}>1</td>
                <td style={{ fontWeight: 700 }}>
                  Immovable asset (Land & Building)
                  {filteredProps.length > 0 && (
                    <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#fbbf24', marginLeft: '0.5rem' }}>
                      ({filteredProps.length} registered properties)
                    </span>
                  )}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
                  {formatINR(immovableTotal, privacyMode)}
                </td>
              </tr>
              <tr>
                <td></td>
                <td style={{ paddingLeft: '2rem', color: 'var(--text-secondary)' }}>a. Land (Plots / Sites under development)</td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>₹0</td>
              </tr>
              <tr>
                <td></td>
                <td style={{ paddingLeft: '2rem', color: 'var(--text-secondary)' }}>
                  b. Building (Residential Flats, Commercial & Under Construction)
                </td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                  {formatINR(immovableTotal, privacyMode)}
                </td>
              </tr>

              {/* Part 2: Movable */}
              <tr style={{ background: 'rgba(56, 189, 248, 0.06)' }}>
                <td style={{ fontWeight: 700 }}>2</td>
                <td style={{ fontWeight: 700 }}>Movable Asset</td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                  {formatINR(totalMovables, privacyMode)}
                </td>
              </tr>
              <tr>
                <td></td>
                <td style={{ paddingLeft: '2rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                  a. Financial Assets:
                </td>
                <td></td>
              </tr>
              <tr>
                <td></td>
                <td style={{ paddingLeft: '3.5rem', color: 'var(--text-secondary)' }}>
                  i. Deposits in Bank (including savings, salary, and term deposits)
                  {filteredBanks.length > 0 && ` (${filteredBanks.length} accounts)`}
                </td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#10b981' }}>
                  {formatINR(bankDeposits, privacyMode)}
                </td>
              </tr>
              <tr>
                <td></td>
                <td style={{ paddingLeft: '3.5rem', color: 'var(--text-secondary)' }}>
                  ii. Shares and securities (Demat Equities, Mutual Funds, Fixed Income)
                </td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#c084fc' }}>
                  {formatINR(sharesAndSecurities, privacyMode)}
                </td>
              </tr>
              <tr>
                <td></td>
                <td style={{ paddingLeft: '3.5rem', color: 'var(--text-secondary)' }}>
                  iii. Insurance policies (Annualized active premiums paid)
                </td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                  {formatINR(activeInsurance, privacyMode)}
                </td>
              </tr>
              <tr>
                <td></td>
                <td style={{ paddingLeft: '3.5rem', color: 'var(--text-secondary)' }}>
                  iv. Loans and Advances given
                </td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                  ₹0
                </td>
              </tr>
              <tr>
                <td></td>
                <td style={{ paddingLeft: '3.5rem', color: 'var(--text-secondary)' }}>
                  v. Cash in hand
                </td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                  {formatINR(cashInHand, privacyMode)}
                </td>
              </tr>
              <tr>
                <td></td>
                <td style={{ paddingLeft: '2rem', color: 'var(--text-secondary)' }}>
                  b. Jewellery, bullion etc. (Gold, bullion & jewelry)
                </td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#f472b6' }}>
                  {formatINR(jewellery, privacyMode)}
                </td>
              </tr>
              <tr>
                <td></td>
                <td style={{ paddingLeft: '2rem', color: 'var(--text-secondary)' }}>
                  c. Archaeological collections, drawings, paintings, sculptures or work of art
                </td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                  {formatINR(artwork, privacyMode)}
                </td>
              </tr>
              <tr>
                <td></td>
                <td style={{ paddingLeft: '2rem', color: 'var(--text-secondary)' }}>
                  d. Vehicles, yachts, boats and aircrafts (Motor vehicles & transport)
                </td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                  {formatINR(vehicles, privacyMode)}
                </td>
              </tr>

              {/* Part 3: Partnership */}
              <tr>
                <td style={{ fontWeight: 700 }}>3</td>
                <td style={{ fontWeight: 600 }}>Interest held in the assets of a firm as a partner</td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                  ₹0
                </td>
              </tr>

              {/* Part 4: Liabilities */}
              <tr style={{ background: 'rgba(244, 63, 94, 0.06)' }}>
                <td style={{ fontWeight: 700 }}>4</td>
                <td style={{ fontWeight: 700 }}>
                  Liability in relation to Assets at (1) and (2) above (Loans & Borrowings)
                  {loans > 0 && ` (${filteredLiabs.filter(l => l.category === 'Loans & Liabilities').length} items)`}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: '#fb7185', fontFamily: 'var(--font-mono)' }}>
                  {formatINR(loans, privacyMode)}
                </td>
              </tr>

              {/* Total Net Declared Wealth */}
              <tr style={{ background: 'rgba(16, 185, 129, 0.12)', borderTop: '2px solid rgba(16, 185, 129, 0.3)' }}>
                <td style={{ fontWeight: 800, color: '#34d399' }}>NET</td>
                <td style={{ fontWeight: 800, color: '#34d399' }}>
                  NET TAXABLE ASSETS (TOTAL ASSETS MINUS LIABILITIES)
                </td>
                <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '1.125rem', color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                  {formatINR(netAssets, privacyMode)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Itemized Annexures for Immovable Properties & Liabilities */}
        {filteredProps.length > 0 && (
          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1.25rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Building size={16} />
              Annexure A: Schedule of Immovable Properties
            </h3>
            <table className="custom-table" style={{ fontSize: '0.8125rem' }}>
              <thead>
                <tr>
                  <th>Premises / Property Name</th>
                  <th>Location / City</th>
                  <th>Ownership Type</th>
                  <th style={{ textAlign: 'right' }}>Cost Value</th>
                  <th style={{ textAlign: 'right' }}>Current Valuation</th>
                </tr>
              </thead>
              <tbody>
                {filteredProps.map(p => (
                  <tr key={p.id || p.premises}>
                    <td style={{ fontWeight: 600 }}>{p.premises || p.title}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{p.city || '-'}, {p.state || '-'}</td>
                    <td><span className="badge-tag" style={{ fontSize: '0.6875rem' }}>{p.co_ownership || 'Individual'}</span></td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{formatINR(p.cost_amount, privacyMode)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#34d399' }}>{formatINR(p.current_valuation, privacyMode)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredLiabs.filter(l => l.category === 'Loans & Liabilities').length > 0 && (
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1.25rem' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#fb7185', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <AlertCircle size={16} />
              Annexure B: Schedule of Liabilities & Loans
            </h3>
            <table className="custom-table" style={{ fontSize: '0.8125rem' }}>
              <thead>
                <tr>
                  <th>Liability / Loan Title</th>
                  <th>Lender / Source</th>
                  <th>Payment Schedule</th>
                  <th style={{ textAlign: 'right' }}>Outstanding Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredLiabs.filter(l => l.category === 'Loans & Liabilities').map(l => (
                  <tr key={l.id || l.title}>
                    <td style={{ fontWeight: 600 }}>{l.title}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{l.payment_source || '-'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{l.schedule || l.reminder_schedule || 'Monthly'}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#fb7185' }}>
                      {formatINR(l.amount || l.outstanding_balance, privacyMode)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
