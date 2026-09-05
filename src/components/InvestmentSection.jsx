import React, { useState } from 'react';
import {
  Percent,
  TrendingUp,
  Eye,
  Edit2,
  Trash2,
  PlusCircle,
  RefreshCw,
  Landmark,
  Shield,
  ArrowUpRight,
  ArrowDownRight,
  Layers
} from 'lucide-react';
import { formatINR, maskSensitive, matchesMember } from '../utils/formatters';
import { refreshAllHoldings } from '../services/marketPriceService';
import { saveLocalData, syncDataToSupabase } from '../services/dataService';
import { getSupabaseClient } from '../lib/supabaseClient';

export const InvestmentSection = ({
  data,
  setData,
  activeFy,
  activeMemberId,
  privacyMode,
  user,
  masterPassword,
  onOpenAddModal,
  onEditAsset,
  onDeleteAsset,
  onViewCredentials,
  onOpenAddHolding,
  onEditHolding
}) => {
  const [isRefreshingPrices, setIsRefreshingPrices] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState(null);

  // Filter holdings using matchesMember
  const dematHoldings = (data.dematHoldings || []).filter(h => {
    return matchesMember(h.member_id, activeMemberId, data.members || []);
  });

  // Filter macro investments (EPFO, NPS, Bonds) using matchesMember
  const filteredInvestments = (data.investments || []).filter(inv => {
    return matchesMember(inv.member_id, activeMemberId, data.members || []);
  });

  // Calculate Demat Holdings Totals
  const totalInvestedAmount = dematHoldings.reduce((sum, h) => sum + Number(h.invested_amount || 0), 0);
  const totalCurrentDematValue = dematHoldings.reduce((sum, h) => {
    const units = Number(h.units || 0);
    const price = Number(h.current_price || 0);
    const val = (units > 0 && price > 0) ? (units * price) : (Number(h.current_value) || Number(h.invested_amount || 0));
    return sum + val;
  }, 0);
  const totalDematPnl = totalCurrentDematValue - totalInvestedAmount;
  const totalDematPnlPercent = totalInvestedAmount > 0 ? ((totalDematPnl / totalInvestedAmount) * 100) : 0;

  // Calculate Macro Retirement Total
  const totalRetirementValue = filteredInvestments.reduce((acc, inv) => {
    const val = inv.values?.[activeFy.id] ?? inv.values?.['fy_25_26'] ?? inv.current_value ?? 0;
    return acc + Number(val);
  }, 0);

  const grandTotal = totalCurrentDematValue + totalRetirementValue;

  // Handle Refresh All Market Prices
  const handleRefreshLivePrices = async () => {
    setIsRefreshingPrices(true);
    setRefreshMessage('Fetching latest AMFI NAVs and stock quotes...');

    try {
      const updatedHoldings = await refreshAllHoldings(data.dematHoldings || []);
      const updated = {
        ...data,
        dematHoldings: updatedHoldings
      };

      saveLocalData(updated, user);
      setData(updated);

      if (getSupabaseClient() && user) {
        syncDataToSupabase(updated, user, masterPassword).catch(console.warn);
      }

      setRefreshMessage('✓ Live prices and NAVs updated successfully!');
      setTimeout(() => setRefreshMessage(null), 4000);
    } catch (err) {
      console.error('Refresh live prices failed:', err);
      setRefreshMessage('Failed to update some quotes: ' + err.message);
      setTimeout(() => setRefreshMessage(null), 4000);
    } finally {
      setIsRefreshingPrices(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* SECTION 1: Demat Portfolio (Holdings: Stocks, MFs, ETFs) */}
      <div className="glass-card">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={22} color="#38bdf8" />
              Demat Portfolio: Stocks, Mutual Funds & ETFs
            </h2>
            <p style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
              Individual holdings with original invested amounts, units, live market NAV/price, and unrealized gains.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={handleRefreshLivePrices}
              disabled={isRefreshingPrices}
              className="btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                color: '#38bdf8',
                borderColor: 'rgba(56, 189, 248, 0.35)'
              }}
              title="Fetch live NAVs from AMFI and stock market quotes"
            >
              <RefreshCw size={14} className={isRefreshingPrices ? 'animate-spin' : ''} />
              <span>{isRefreshingPrices ? 'Updating Quotes...' : 'Refresh Live Prices'}</span>
            </button>

            <button
              onClick={onOpenAddHolding}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <PlusCircle size={15} />
              <span>+ Add Stock / Fund</span>
            </button>
          </div>
        </div>

        {/* Live Refresh Status Message */}
        {refreshMessage && (
          <div style={{
            padding: '0.6rem 1rem',
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '8px',
            fontSize: '0.8125rem',
            color: '#38bdf8',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <RefreshCw size={14} className={isRefreshingPrices ? 'animate-spin' : ''} />
            <span>{refreshMessage}</span>
          </div>
        )}

        {/* Demat KPI Summary Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          {/* Total Invested */}
          <div style={{
            padding: '1rem',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '10px',
            border: '1px solid var(--border-glass)'
          }}>
            <div style={{ fontSize: '0.6875rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Original Invested Amount
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#f8fafc', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
              {formatINR(totalInvestedAmount, privacyMode)}
            </div>
          </div>

          {/* Current Portfolio Value */}
          <div style={{
            padding: '1rem',
            background: 'rgba(56, 189, 248, 0.06)',
            borderRadius: '10px',
            border: '1px solid rgba(56, 189, 248, 0.25)'
          }}>
            <div style={{ fontSize: '0.6875rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Current Portfolio Value
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#38bdf8', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
              {formatINR(totalCurrentDematValue, privacyMode)}
            </div>
          </div>

          {/* Unrealized Gain / Loss */}
          <div style={{
            padding: '1rem',
            background: totalDematPnl >= 0 ? 'rgba(52, 211, 153, 0.08)' : 'rgba(244, 63, 94, 0.08)',
            borderRadius: '10px',
            border: `1px solid ${totalDematPnl >= 0 ? 'rgba(52, 211, 153, 0.25)' : 'rgba(244, 63, 94, 0.25)'}`
          }}>
            <div style={{ fontSize: '0.6875rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>Total Unrealized P&L</span>
              {totalDematPnl >= 0 ? <ArrowUpRight size={14} color="#34d399" /> : <ArrowDownRight size={14} color="#fb7185" />}
            </div>
            <div style={{
              fontSize: '1.35rem',
              fontWeight: 700,
              color: totalDematPnl >= 0 ? '#34d399' : '#fb7185',
              fontFamily: 'var(--font-mono)',
              marginTop: '4px'
            }}>
              {totalDematPnl >= 0 ? '+' : ''}{formatINR(totalDematPnl, privacyMode)}
              <span style={{ fontSize: '0.875rem', marginLeft: '6px', fontWeight: 600 }}>
                ({totalDematPnlPercent >= 0 ? '+' : ''}{totalDematPnlPercent.toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* Total Holdings Count */}
          <div style={{
            padding: '1rem',
            background: 'rgba(168, 85, 247, 0.06)',
            borderRadius: '10px',
            border: '1px solid rgba(168, 85, 247, 0.25)'
          }}>
            <div style={{ fontSize: '0.6875rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Holdings Count
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#c084fc', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
              {dematHoldings.length} Assets
            </div>
          </div>
        </div>

        {/* Demat Holdings Table */}
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Code & Name</th>
                <th>Category</th>
                <th style={{ textAlign: 'right' }}>Units / Qty</th>
                <th style={{ textAlign: 'right' }}>Avg Buy Price</th>
                <th style={{ textAlign: 'right' }}>Invested Amount</th>
                <th style={{ textAlign: 'right' }}>Live Price / NAV</th>
                <th style={{ textAlign: 'right' }}>Current Value</th>
                <th style={{ textAlign: 'right' }}>Unrealized Gain / Loss</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {dematHoldings.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    No stocks or mutual funds added yet. Click <strong>"+ Add Stock / Fund"</strong> to start tracking!
                  </td>
                </tr>
              ) : (
                dematHoldings.map((h) => {
                  const member = data.members?.find(m => m.id === h.member_id || matchesMember(h.member_id, m.id, data.members));
                  const units = Number(h.units || 0);
                  const currentPrice = Number(h.current_price || 0);
                  const investedAmount = Number(h.invested_amount || 0);
                  const avgBuyPrice = Number(h.avg_buy_price) || (units > 0 ? investedAmount / units : 0);
                  const currentValue = (units > 0 && currentPrice > 0)
                    ? (units * currentPrice)
                    : (Number(h.current_value) || investedAmount);
                  const unrealizedPnl = currentValue - investedAmount;
                  const unrealizedPnlPercent = investedAmount > 0
                    ? ((unrealizedPnl / investedAmount) * 100)
                    : 0;
                  const isProfit = unrealizedPnl >= 0;

                  return (
                    <tr key={h.id}>
                      <td>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span className="badge-tag" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#38bdf8' }}>
                              {h.symbol}
                            </span>
                            <span style={{ fontWeight: 600 }}>{h.name}</span>
                          </div>
                          {h.notes && (
                            <div style={{ fontSize: '0.6875rem', color: '#94a3b8', marginTop: '2px' }}>
                              {h.notes}
                            </div>
                          )}
                        </div>
                      </td>

                      <td>
                        <span className="badge-purple" style={{ fontSize: '10px' }}>
                          {h.category}
                        </span>
                      </td>

                      <td className="mono-text" style={{ textAlign: 'right', fontWeight: 600 }}>
                        {privacyMode ? '••••' : units.toLocaleString('en-IN', { maximumFractionDigits: 3 })}
                      </td>

                      <td className="mono-text" style={{ textAlign: 'right', color: '#cbd5e1' }}>
                        {formatINR(avgBuyPrice, privacyMode)}
                      </td>

                      <td className="mono-text" style={{ textAlign: 'right', color: '#f8fafc', fontWeight: 600 }}>
                        {formatINR(investedAmount, privacyMode)}
                      </td>

                      <td className="mono-text" style={{ textAlign: 'right', color: '#38bdf8', fontWeight: 600 }}>
                        {formatINR(currentPrice, privacyMode)}
                      </td>

                      <td className="mono-text" style={{ textAlign: 'right', fontWeight: 700, color: '#38bdf8', fontSize: '0.9375rem' }}>
                        {formatINR(currentValue, privacyMode)}
                      </td>

                      {/* Gain / Loss */}
                      <td className="mono-text" style={{ textAlign: 'right' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                          color: isProfit ? '#34d399' : '#fb7185',
                          fontWeight: 700
                        }}>
                          {isProfit ? '+' : ''}{formatINR(unrealizedPnl, privacyMode)}
                          <span style={{ fontSize: '0.72rem', opacity: 0.9 }}>
                            ({isProfit ? '+' : ''}{Number(unrealizedPnlPercent || 0).toFixed(2)}%)
                          </span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          <button
                            onClick={() => onEditHolding(h)}
                            className="btn-icon"
                            style={{ width: 28, height: 28 }}
                            title="Edit holding units, buy cost, or current price"
                          >
                            <Edit2 size={13} color="#38bdf8" />
                          </button>
                          <button
                            onClick={() => onDeleteAsset(h.name, 'Stock / Fund Holding', () => {
                              const updated = {
                                ...data,
                                dematHoldings: (data.dematHoldings || []).filter(item => item.id !== h.id)
                              };
                              return updated;
                            })}
                            className="btn-icon"
                            style={{ width: 28, height: 28 }}
                            title="Delete holding (Requires Master Password)"
                          >
                            <Trash2 size={13} color="#f87171" />
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

      {/* SECTION 2: Provident Funds & Long-Term Retirement Assets (EPFO, NPS, Bonds) */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Landmark size={20} color="#c084fc" />
              Retirement Funds & Fixed Assets (EPFO, NPS & Bonds)
            </h2>
            <p style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
              Employee Provident Fund (EPFO), NPS Trust (Tier-1 PRAN), and corporate bonds.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.5rem 1rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '10px', border: '1px solid rgba(139, 92, 246, 0.25)', textAlign: 'right' }}>
              <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>Retirement Funds Total</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#c084fc', fontFamily: 'var(--font-mono)' }}>
                {formatINR(totalRetirementValue, privacyMode)}
              </div>
            </div>
            <button
              onClick={() => onOpenAddModal('investment')}
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <PlusCircle size={15} />
              <span>+ Add Fund</span>
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Institution & Category</th>
                <th>Account Identifier</th>
                <th>Credentials & Password</th>
                <th>{activeFy.label} Value</th>
                <th>Notes / Details</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvestments.map((inv) => {
                const currentFyVal = inv.values?.[activeFy.id] ?? inv.values?.['fy_25_26'] ?? 0;

                return (
                  <tr key={inv.id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600 }}>{inv.institution}</div>
                        <span className="badge-purple" style={{ fontSize: '10px', marginTop: '2px', display: 'inline-block' }}>
                          {inv.category}
                        </span>
                      </div>
                    </td>
                    <td className="mono-text">
                      {maskSensitive(inv.account_identifier, privacyMode)}
                    </td>

                    {/* Protected Credentials & Eye Icon */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div>
                          <div style={{ fontSize: '0.8125rem', color: '#e2e8f0', fontWeight: 500 }}>
                            {inv.login_user || 'Portal Login'}
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: '#94a3b8', letterSpacing: '0.1em' }}>
                            ••••••••
                          </div>
                        </div>
                        <button
                          onClick={() => onViewCredentials({
                            title: inv.institution,
                            type: inv.category,
                            username: inv.login_user,
                            identifier: inv.account_identifier,
                            password: inv.login_password,
                            pin_hint: inv.pin_hint
                          })}
                          className="btn-icon"
                          style={{ width: 28, height: 28, borderColor: 'rgba(192, 132, 252, 0.3)' }}
                          title="View credentials with Master Password"
                        >
                          <Eye size={13} color="#c084fc" />
                        </button>
                      </div>
                    </td>

                    <td className="mono-text" style={{ fontWeight: 700, color: '#38bdf8', fontSize: '0.9375rem' }}>
                      {formatINR(currentFyVal, privacyMode)}
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                      {inv.notes || '-'}
                    </td>

                    {/* Edit & Delete Action Buttons */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          onClick={() => onEditAsset(inv, 'investment')}
                          className="btn-icon"
                          style={{ width: 30, height: 30 }}
                          title="Edit investment details and valuations"
                        >
                          <Edit2 size={13} color="#38bdf8" />
                        </button>
                        <button
                          onClick={() => onDeleteAsset(inv.institution, 'Investment', () => {
                            const updated = {
                              ...data,
                              investments: data.investments.filter(i => i.id !== inv.id)
                            };
                            return updated;
                          })}
                          className="btn-icon"
                          style={{ width: 30, height: 30 }}
                          title="Delete investment (Requires Master Password)"
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
    </div>
  );
};
