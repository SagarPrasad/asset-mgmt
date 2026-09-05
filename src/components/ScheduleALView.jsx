import React from 'react';
import { FileText, Printer, Shield, CheckCircle2 } from 'lucide-react';
import { formatINR } from '../utils/formatters';

export const ScheduleALView = ({
  data,
  activeFy,
  privacyMode
}) => {
  // Compute exact values matching sheet '26' / ITR Schedule AL
  const immovableTotal = (data.immovableProperties || []).reduce((acc, p) => acc + Number(p.cost_amount || 0), 0);
  
  const bankDeposits = (data.bankAccounts || []).reduce((acc, b) => {
    return acc + Number(b.snapshots?.[activeFy.id]?.balance || 0);
  }, 0);

  const dematHoldingsValue = (data.dematHoldings || []).reduce((acc, h) => {
    const curVal = Number(h.current_value) || (Number(h.units || 0) * Number(h.current_price || 0)) || Number(h.invested_amount || 0);
    return acc + curVal;
  }, 0);

  const sharesAndSecurities = dematHoldingsValue + (data.investments || [])
    .filter(inv => inv.category === 'Shares and Securities' || inv.category === 'Fixed Income / Bonds')
    .reduce((acc, inv) => {
      return acc + Number(inv.values?.[activeFy.id] ?? inv.values?.['fy_25_26'] ?? inv.current_value ?? 0);
    }, 0);

  const activeInsurance = (data.insurancePolicies || [])
    .filter(p => p.status !== 'All Paid Up')
    .reduce((acc, p) => acc + Number(p.annual_premium || 0), 0);

  const jewellery = (data.movableAssets || [])
    .filter(m => m.category === 'Jewellery, bullion etc.' && m.status !== 'Sold')
    .reduce((acc, m) => acc + Number(m.current_value || 0), 0);

  const artwork = (data.movableAssets || [])
    .filter(m => m.category === 'Paintings / Artwork etc.' && m.status !== 'Sold')
    .reduce((acc, m) => acc + Number(m.current_value || 0), 0);

  const vehicles = (data.movableAssets || [])
    .filter(m => m.category === 'Vehicles / Boats etc.' && m.status !== 'Sold')
    .reduce((acc, m) => acc + Number(m.current_value || 0), 0);

  const cashInHand = (data.movableAssets || [])
    .filter(m => m.category === 'Cash in hand' && m.status !== 'Sold')
    .reduce((acc, m) => acc + Number(m.current_value || 0), 0);

  const loans = (data.liabilitiesAndExpenses || [])
    .filter(l => l.category === 'Loans & Liabilities')
    .reduce((acc, l) => acc + Number(l.amount || 0), 0);

  const totalMovables = bankDeposits + sharesAndSecurities + activeInsurance + cashInHand + jewellery + artwork + vehicles;
  const netAssets = (immovableTotal + totalMovables) - loans;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} color="#38bdf8" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
              ITR Schedule AL (Assets and Liabilities as on 31st March)
            </h2>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
            Formatted in compliance with Indian Income Tax Department Schedule AL reporting guidelines for {activeFy.label}.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="btn-secondary"
        >
          <Printer size={16} />
          <span>Print / Save PDF</span>
        </button>
      </div>

      <div style={{
        background: 'var(--bg-card-inner)',
        border: '1px solid var(--border-glass-bright)',
        borderRadius: 'var(--radius-md)',
        padding: '1.5rem',
        color: 'var(--text-primary)'
      }}>
        {/* Document Header */}
        <div style={{ borderBottom: '2px solid var(--border-glass)', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, letterSpacing: '0.05em', color: '#38bdf8' }}>
              SCHEDULE AL - ASSETS AND LIABILITIES AT THE END OF THE YEAR
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Applicable for individuals / HUFs where total income exceeds statutory threshold
            </div>
          </div>
          <span className="badge-tag">
            As on 31st March ({activeFy.label})
          </span>
        </div>

        {/* Schedule AL Structured Breakdown Table */}
        <table className="custom-table" style={{ fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
              <th style={{ width: '60px' }}>Item</th>
              <th>Particulars of Asset</th>
              <th style={{ width: '220px', textAlign: 'right' }}>Amount (Cost / Val) in INR</th>
            </tr>
          </thead>
          <tbody>
            {/* Part 1: Immovable */}
            <tr style={{ background: 'rgba(245, 158, 11, 0.06)' }}>
              <td style={{ fontWeight: 700 }}>1</td>
              <td style={{ fontWeight: 700 }}>Immovable asset (Land & Building)</td>
              <td style={{ textAlign: 'right', fontWeight: 700, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
                {formatINR(immovableTotal, privacyMode)}
              </td>
            </tr>
            <tr>
              <td></td>
              <td style={{ paddingLeft: '2rem', color: '#cbd5e1' }}>a. Land (Plots / Sites under development)</td>
              <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>₹0</td>
            </tr>
            <tr>
              <td></td>
              <td style={{ paddingLeft: '2rem', color: '#cbd5e1' }}>
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
              <td style={{ paddingLeft: '2rem', color: '#cbd5e1' }}>
                a. Financial Assets:
              </td>
              <td></td>
            </tr>
            <tr>
              <td></td>
              <td style={{ paddingLeft: '3.5rem', color: '#94a3b8' }}>
                i. Deposits in Bank (including savings, salary, and term deposits)
              </td>
              <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#10b981' }}>
                {formatINR(bankDeposits, privacyMode)}
              </td>
            </tr>
            <tr>
              <td></td>
              <td style={{ paddingLeft: '3.5rem', color: '#94a3b8' }}>
                ii. Shares and securities (Demat Equities, Mutual Funds, EPFO, NPS)
              </td>
              <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#c084fc' }}>
                {formatINR(sharesAndSecurities, privacyMode)}
              </td>
            </tr>
            <tr>
              <td></td>
              <td style={{ paddingLeft: '3.5rem', color: '#94a3b8' }}>
                iii. Insurance policies (Annualized active premiums paid)
              </td>
              <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                {formatINR(activeInsurance, privacyMode)}
              </td>
            </tr>
            <tr>
              <td></td>
              <td style={{ paddingLeft: '3.5rem', color: '#94a3b8' }}>
                iv. Loans and Advances given
              </td>
              <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                ₹0
              </td>
            </tr>
            <tr>
              <td></td>
              <td style={{ paddingLeft: '3.5rem', color: '#94a3b8' }}>
                v. Cash in hand
              </td>
              <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                {formatINR(cashInHand, privacyMode)}
              </td>
            </tr>
            <tr>
              <td></td>
              <td style={{ paddingLeft: '2rem', color: '#cbd5e1' }}>
                b. Jewellery, bullion etc. (Gold, bullion & jewelry)
              </td>
              <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#f472b6' }}>
                {formatINR(jewellery, privacyMode)}
              </td>
            </tr>
            <tr>
              <td></td>
              <td style={{ paddingLeft: '2rem', color: '#cbd5e1' }}>
                c. Archaeological collections, drawings, paintings, sculptures or work of art
              </td>
              <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                {formatINR(artwork, privacyMode)}
              </td>
            </tr>
            <tr>
              <td></td>
              <td style={{ paddingLeft: '2rem', color: '#cbd5e1' }}>
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
              <td style={{ fontWeight: 700 }}>Liability in relation to Assets at (1) and (2) above</td>
              <td style={{ textAlign: 'right', fontWeight: 700, color: '#fb7185', fontFamily: 'var(--font-mono)' }}>
                {formatINR(loans, privacyMode)}
              </td>
            </tr>

            {/* Total Net Declared Wealth */}
            <tr style={{ background: 'rgba(16, 185, 129, 0.12)', borderTop: '2px solid rgba(16, 185, 129, 0.3)' }}>
              <td style={{ fontWeight: 800, color: '#34d399' }}>NET</td>
              <td style={{ fontWeight: 800, color: '#34d399' }}>NET ASSETS (TOTAL ASSETS MINUS LIABILITIES)</td>
              <td style={{ textAlign: 'right', fontWeight: 800, fontSize: '1.125rem', color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                {formatINR(netAssets, privacyMode)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
