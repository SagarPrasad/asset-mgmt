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
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { formatINR, maskSensitive, matchesMember, getInvestmentValue } from '../utils/formatters';
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
  onEditHolding,
  onRefreshCloud,
  isSyncingCloud
}) => {
  const [isRefreshingPrices, setIsRefreshingPrices] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState(null);

  // Filter holdings using matchesMember
  const dematHoldings = (data.dematHoldings || []).filter(h => {
    return matchesMember(h.member_id, activeMemberId, data.members || []);
  });

  // Filter macro investments (Demat accounts, EPFO, NPS, Bonds) using matchesMember
  const filteredInvestments = (data.investments || []).filter(inv => {
    return matchesMember(inv.member_id, activeMemberId, data.members || []);
  });

  // Detect any macro Demat / Brokerage accounts listed in investments (e.g. Zerodha, Groww, ICICI Demat, NSDL Demat)
  const macroDematAccounts = filteredInvestments.filter(inv => {
    const cat = (inv.category || '').toLowerCase();
    const inst = (inv.institution || '').toLowerCase();
    return cat.includes('demat') || cat.includes('share') || cat.includes('stock') ||
           inst.includes('demat') || inst.includes('zerodha') || inst.includes('groww') || inst.includes('upstox') || inst.includes('angel') || inst.includes('icici direct');
  });

  const macroDematTotal = macroDematAccounts.reduce((acc, inv) => {
    return acc + getInvestmentValue(inv, activeFy.id);
  }, 0);

  // Calculate Demat Holdings Totals (combines itemized holdings and macro platform accounts)
  const totalItemizedInvested = dematHoldings.reduce((sum, h) => sum + Number(h.invested_amount || 0), 0);
  const totalItemizedCurrentValue = dematHoldings.reduce((sum, h) => {
    const units = Number(h.units || 0);
    const price = Number(h.current_price || 0);
    const val = (units > 0 && price > 0) ? (units * price) : (Number(h.current_value) || Number(h.invested_amount || 0));
    return sum + val;
  }, 0);

  const totalInvestedAmount = totalItemizedInvested + macroDematTotal;
  const totalCurrentDematValue = totalItemizedCurrentValue + macroDematTotal;
  const totalDematPnl = totalCurrentDematValue - totalInvestedAmount;
  const totalDematPnlPercent = totalInvestedAmount > 0 ? ((totalDematPnl / totalInvestedAmount) * 100) : 0;

  // Retirement investments (EPFO, NPS, Bonds)
  const retirementInvestments = filteredInvestments.filter(inv => !macroDematAccounts.some(ma => ma.id === inv.id));
  const totalRetirementValue = retirementInvestments.reduce((acc, inv) => {
    return acc + getInvestmentValue(inv, activeFy.id);
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
      {/* SECTION 1: Demat Portfolio (Holdings: Stocks, MFs, ETFs & Linked Demat Accounts) */}
      <div className="glass-card">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={22} color="#38bdf8" />
              Demat Portfolio: Stocks, Mutual Funds & ETFs
            </h2>
            <p style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
              Linked Demat accounts (Zerodha, ICICI, etc.) and individual stock holdings with live market prices, NAVs and returns.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {onRefreshCloud && (
              <button
                onClick={onRefreshCloud}
                disabled={isSyncingCloud}
                className="btn-secondary"
                title="Fetch latest demat holdings directly from Supabase DB"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  borderColor: isSyncingCloud ? 'rgba(56, 189, 248, 0.5)' : undefined
                }}
              >
                <RefreshCw
                  size={14}
                  color="#38bdf8"
                  className={isSyncingCloud ? 'animate-spin' : ''}
                  style={{
                    animation: isSyncingCloud ? 'spin 1s linear infinite' : 'none'
                  }}
                />
                <span>{isSyncingCloud ? 'Syncing...' : 'Sync Cloud'}</span>
              </button>
            )}

            <button
              onClick={handleRefreshLivePrices}
              disabled={isRefreshingPrices}
              className="btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                borderColor: isRefreshingPrices ? 'rgba(56, 189, 248, 0.5)' : undefined
              }}
              title="Fetch latest live stock prices from NSE/BSE and mutual fund NAVs from AMFI"
            >
              <RefreshCw
                size={14}
                className={isRefreshingPrices ? 'animate-spin' : ''}
                style={{
                  animation: isRefreshingPrices ? 'spin 1s linear infinite' : 'none'
                }}
              />
              <span>{isRefreshingPrices ? 'Updating Quotes...' : 'Refresh Prices / NAVs'}</span>
            </button>

            <button
              onClick={() => onOpenAddModal('investment', 'Demat / Shares')}
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              title="Add a Demat Account (e.g. Zerodha, ICICI Direct, Groww)"
            >
              <PlusCircle size={15} />
              <span>+ Add Demat A/c</span>
            </button>

            <button
              onClick={onOpenAddHolding}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              title="Add an individual Stock lot, ETF or Mutual Fund holding"
            >
              <PlusCircle size={15} />
              <span>+ Add Stock / Fund</span>
            </button>
          </div>
        </div>

        {/* Live quote update toast */}
        {refreshMessage && (
          <div style={{
            padding: '0.625rem 1rem',
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '8px',
            fontSize: '0.8125rem',
            color: '#38bdf8',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Sparkles size={16} />
            <span>{refreshMessage}</span>
          </div>
        )}

        {/* Demat KPI Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
          <div className="stat-card" style={{ padding: '1.25rem' }}>
            <div className="stat-header">
              <span className="stat-title">Total Invested (Demat)</span>
              <div className="stat-icon-wrapper purple">
                <Layers size={18} color="#c084fc" />
              </div>
            </div>
            <div className="stat-value" style={{ color: '#c084fc' }}>
              {formatINR(totalInvestedAmount, privacyMode)}
            </div>
            <div className="stat-footer">
              <span>{dematHoldings.length} stocks/funds + {macroDematAccounts.length} Demat A/c</span>
            </div>
          </div>

          <div className="stat-card" style={{ padding: '1.25rem' }}>
            <div className="stat-header">
              <span className="stat-title">Current Portfolio Value</span>
              <div className="stat-icon-wrapper blue">
                <TrendingUp size={18} color="#38bdf8" />
              </div>
            </div>
            <div className="stat-value" style={{ color: '#38bdf8' }}>
              {formatINR(totalCurrentDematValue, privacyMode)}
            </div>
            <div className="stat-footer">
              <span>Valuation in {activeFy.label}</span>
            </div>
          </div>

          <div className="stat-card" style={{ padding: '1.25rem' }}>
            <div className="stat-header">
              <span className="stat-title">Overall Unrealized P&L</span>
              <div className="stat-icon-wrapper" style={{ background: totalDematPnl >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }}>
                {totalDematPnl >= 0 ? <ArrowUpRight size={18} color="#34d399" /> : <ArrowDownRight size={18} color="#f87171" />}
              </div>
            </div>
            <div className="stat-value" style={{ color: totalDematPnl >= 0 ? '#34d399' : '#f87171' }}>
              {totalDematPnl >= 0 ? '+' : ''}{formatINR(totalDematPnl, privacyMode)}
            </div>
            <div className="stat-footer" style={{ color: totalDematPnl >= 0 ? '#34d399' : '#f87171' }}>
              <span>{totalDematPnl >= 0 ? '+' : ''}{totalDematPnlPercent.toFixed(2)}% total return</span>
            </div>
          </div>
        </div>

        {/* 1A. Linked Brokerage & Demat Accounts Table */}
        {macroDematAccounts.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers size={17} color="#38bdf8" />
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc' }}>
                  Linked Demat Accounts ({macroDematAccounts.length})
                </h3>
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#38bdf8', fontWeight: 600 }}>
                Total Demat Balance: {formatINR(macroDematTotal, privacyMode)}
              </div>
            </div>

            <div className="table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Platform & Broker</th>
                    <th>Demat Account / DP ID</th>
                    <th>Credentials & Portal</th>
                    <th>{activeFy.label} Value</th>
                    <th>Notes / Details</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {macroDematAccounts.map((acc) => {
                    const val = getInvestmentValue(acc, activeFy.id);
                    return (
                      <tr key={acc.id}>
                        <td>
                          <div>
                            <div style={{ fontWeight: 600, color: '#f8fafc' }}>{acc.institution}</div>
                            <span className="badge-purple" style={{ fontSize: '10px', marginTop: '2px', display: 'inline-block' }}>
                              {acc.category || 'Demat / Shares'}
                            </span>
                          </div>
                        </td>
                        <td className="mono-text">
                          {maskSensitive(acc.account_identifier, privacyMode)}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div>
                              <div style={{ fontSize: '0.8125rem', color: '#e2e8f0', fontWeight: 500 }}>
                                {acc.login_user || 'Portal Login'}
                              </div>
                              <div style={{ fontSize: '0.6875rem', color: '#94a3b8', letterSpacing: '0.1em' }}>
                                ••••••••
                              </div>
                            </div>
                            <button
                              onClick={() => onViewCredentials({
                                title: acc.institution,
                                type: acc.category,
                                username: acc.login_user,
                                identifier: acc.account_identifier,
                                password: acc.login_password,
                                pin_hint: acc.pin_hint
                              })}
                              className="btn-icon"
                              style={{ width: 28, height: 28, borderColor: 'rgba(56, 189, 248, 0.3)' }}
                              title="View credentials with Master Password"
                            >
                              <Eye size={13} color="#38bdf8" />
                            </button>
                          </div>
                        </td>
                        <td className="mono-text" style={{ fontWeight: 700, color: '#38bdf8', fontSize: '0.9375rem' }}>
                          {formatINR(val, privacyMode)}
                        </td>
                        <td style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                          {acc.notes || '-'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                            <button
                              onClick={() => onEditAsset(acc, 'investment')}
                              className="btn-icon"
                              style={{ width: 30, height: 30 }}
                              title="Edit Demat account details and balance"
                            >
                              <Edit2 size={13} color="#38bdf8" />
                            </button>
                            <button
                              onClick={() => onDeleteAsset(
                                acc.institution,
                                'Demat Account',
                                () => {
                                  const updated = {
                                    ...data,
                                    investments: (data.investments || []).filter(i => {
                                      if (i.id && acc.id) return i.id !== acc.id;
                                      return i.institution !== acc.institution;
                                    })
                                  };
                                  return updated;
                                },
                                acc,
                                'investment'
                              )}
                              className="btn-icon"
                              style={{ width: 30, height: 30 }}
                              title="Delete Demat Account"
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
        )}

        {/* 1B. Itemized Demat Holdings (Equities & Mutual Funds) */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={17} color="#a855f7" />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc' }}>
                Itemized Stocks, ETFs & Mutual Funds ({dematHoldings.length})
              </h3>
            </div>
            {dematHoldings.length > 0 && (
              <div style={{ fontSize: '0.8125rem', color: '#a855f7', fontWeight: 600 }}>
                Holdings Value: {formatINR(totalItemizedCurrentValue, privacyMode)}
              </div>
            )}
          </div>

          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Code & Name</th>
                  <th>Category</th>
                  <th>Exchange</th>
                  <th>Units Held</th>
                  <th>Avg Buy Price</th>
                  <th>Live Price / NAV</th>
                  <th>Invested Amount</th>
                  <th>Current Value</th>
                  <th>Unrealized P&L</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {dematHoldings.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                      No individual stock lots or mutual funds itemized yet. Click <strong>"+ Add Stock / Fund"</strong> above to track individual equities & live NAVs.
                    </td>
                  </tr>
                ) : (
                  dematHoldings.map((h) => {
                    const pnlPositive = (h.unrealized_pnl || 0) >= 0;
                    return (
                      <tr key={h.id}>
                        <td>
                          <div>
                            <div style={{ fontWeight: 600, color: '#f8fafc' }}>{h.symbol}</div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{h.name}</div>
                          </div>
                        </td>
                        <td>
                          <span className={h.category === 'Mutual Fund' ? 'badge-blue' : 'badge-purple'} style={{ fontSize: '10px' }}>
                            {h.category}
                          </span>
                        </td>
                        <td className="mono-text" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {h.exchange}
                        </td>
                        <td className="mono-text">
                          {privacyMode ? '••••' : Number(h.units).toLocaleString('en-IN')}
                        </td>
                        <td className="mono-text">
                          {formatINR(h.avg_buy_price, privacyMode)}
                        </td>
                        <td className="mono-text" style={{ fontWeight: 600, color: '#38bdf8' }}>
                          {formatINR(h.current_price, privacyMode)}
                        </td>
                        <td className="mono-text">
                          {formatINR(h.invested_amount, privacyMode)}
                        </td>
                        <td className="mono-text" style={{ fontWeight: 700, color: '#f8fafc' }}>
                          {formatINR(h.current_value, privacyMode)}
                        </td>
                        <td>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontWeight: 600,
                            fontSize: '0.8125rem',
                            color: pnlPositive ? '#34d399' : '#f87171'
                          }}>
                            {pnlPositive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                            <span>{pnlPositive ? '+' : ''}{formatINR(h.unrealized_pnl, privacyMode)}</span>
                            <span style={{ fontSize: '0.6875rem', opacity: 0.8 }}>
                              ({pnlPositive ? '+' : ''}{h.unrealized_pnl_percent?.toFixed(1)}%)
                            </span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                            <button
                              onClick={() => onEditHolding(h)}
                              className="btn-icon"
                              style={{ width: 30, height: 30 }}
                              title="Edit stock or mutual fund holding"
                            >
                              <Edit2 size={13} color="#38bdf8" />
                            </button>
                            <button
                              onClick={() => onDeleteAsset(
                                `${h.symbol} - ${h.name}`,
                                'Demat Holding',
                                () => {
                                  const updated = {
                                    ...data,
                                    dematHoldings: (data.dematHoldings || []).filter(item => item.id !== h.id)
                                  };
                                  return updated;
                                },
                                h,
                                'dematHolding'
                              )}
                              className="btn-icon"
                              style={{ width: 30, height: 30 }}
                              title="Delete Holding"
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
      </div>

      {/* SECTION 2: Retirement Funds & Fixed Assets (EPFO, NPS, PPF & Bonds) */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Landmark size={20} color="#c084fc" />
              Retirement Funds & Fixed Assets (EPFO, NPS & Bonds)
            </h2>
            <p style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
              Employee Provident Fund (EPFO), NPS Trust (Tier-1 PRAN), PPF, and Corporate Bonds.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ padding: '0.5rem 1rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '10px', border: '1px solid rgba(139, 92, 246, 0.25)', textAlign: 'right' }}>
              <div style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>Retirement Funds Total</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#c084fc', fontFamily: 'var(--font-mono)' }}>
                {formatINR(totalRetirementValue, privacyMode)}
              </div>
            </div>
            {onRefreshCloud && (
              <button
                onClick={onRefreshCloud}
                disabled={isSyncingCloud}
                className="btn-secondary"
                title="Fetch latest retirement funds and assets from Supabase DB"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  borderColor: isSyncingCloud ? 'rgba(56, 189, 248, 0.5)' : undefined
                }}
              >
                <RefreshCw
                  size={14}
                  color="#38bdf8"
                  className={isSyncingCloud ? 'animate-spin' : ''}
                  style={{
                    animation: isSyncingCloud ? 'spin 1s linear infinite' : 'none'
                  }}
                />
                <span>{isSyncingCloud ? 'Syncing...' : 'Sync Cloud'}</span>
              </button>
            )}
            <button
              onClick={() => onOpenAddModal('investment', 'Retirement (EPF)')}
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
              {retirementInvestments.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    No retirement funds or fixed assets added yet. Click <strong>"+ Add Fund"</strong> to track EPFO, NPS, or Bonds.
                  </td>
                </tr>
              ) : (
                retirementInvestments.map((inv) => {
                  const currentFyVal = getInvestmentValue(inv, activeFy.id);

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
                            onClick={() => onDeleteAsset(
                              inv.institution,
                              'Investment',
                              () => {
                                const updated = {
                                  ...data,
                                  investments: (data.investments || []).filter(i => {
                                    if (i.id && inv.id) return i.id !== inv.id;
                                    return i.institution !== inv.institution;
                                  })
                                };
                                return updated;
                              },
                              inv,
                              'investment'
                            )}
                            className="btn-icon"
                            style={{ width: 30, height: 30 }}
                            title="Delete Investment"
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
    </div>
  );
};
