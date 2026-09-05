import React, { useState, useEffect } from 'react';
import { X, TrendingUp, RefreshCw, Search, Save, DollarSign } from 'lucide-react';
import { fetchMutualFundNav, searchMutualFunds, fetchStockPrice, calculateHoldingMetrics } from '../services/marketPriceService';
import { saveLocalData, syncDataToSupabase } from '../services/dataService';
import { getSupabaseClient } from '../lib/supabaseClient';
import { formatINR } from '../utils/formatters';

export const EditHoldingModal = ({
  isOpen,
  onClose,
  holding,
  data,
  setData,
  user,
  masterPassword
}) => {
  if (!isOpen) return null;

  const isCreating = !holding;

  const [formData, setFormData] = useState({
    name: holding?.name || '',
    symbol: holding?.symbol || '',
    category: holding?.category || 'Equity / Stocks',
    exchange: holding?.exchange || 'NSE',
    member_id: holding?.member_id || data?.members?.[0]?.id || '',
    units: holding?.units || '',
    invested_amount: holding?.invested_amount || '',
    current_price: holding?.current_price || '',
    notes: holding?.notes || ''
  });

  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [fetchStatus, setFetchStatus] = useState(null);

  useEffect(() => {
    if (holding) {
      setFormData({
        name: holding.name || '',
        symbol: holding.symbol || '',
        category: holding.category || 'Equity / Stocks',
        exchange: holding.exchange || 'NSE',
        member_id: holding.member_id || data?.members?.[0]?.id || '',
        units: holding.units || '',
        invested_amount: holding.invested_amount || '',
        current_price: holding.current_price || '',
        notes: holding.notes || ''
      });
    } else {
      setFormData({
        name: '',
        symbol: '',
        category: 'Equity / Stocks',
        exchange: 'NSE',
        member_id: data?.members?.[0]?.id || '',
        units: '',
        invested_amount: '',
        current_price: '',
        notes: ''
      });
    }
    setFetchStatus(null);
  }, [holding, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Live price / NAV fetcher based on code
  const handleFetchPrice = async () => {
    if (!formData.symbol) {
      setFetchStatus({ error: 'Please enter a Symbol or Scheme Code first.' });
      return;
    }

    setIsFetchingPrice(true);
    setFetchStatus(null);

    try {
      if (formData.category === 'Mutual Fund' || /^\d{5,7}$/.test(formData.symbol.trim())) {
        const mf = await fetchMutualFundNav(formData.symbol);
        if (mf && mf.nav > 0) {
          setFormData(prev => ({
            ...prev,
            current_price: mf.nav,
            name: prev.name || mf.name,
            exchange: 'AMFI'
          }));
          setFetchStatus({ success: `Fetched latest NAV: ₹${mf.nav} (${mf.date})` });
        } else {
          setFetchStatus({ error: `Could not find mutual fund with code "${formData.symbol}". Search fund below.` });
        }
      } else {
        const stock = await fetchStockPrice(formData.symbol);
        if (stock && stock.price > 0) {
          setFormData(prev => ({
            ...prev,
            current_price: stock.price,
            name: prev.name || stock.name,
            exchange: stock.exchange
          }));
          setFetchStatus({ success: `Fetched latest price: ₹${stock.price}` });
        } else {
          setFetchStatus({ error: `Could not find live quote for "${formData.symbol}". Please enter current price manually.` });
        }
      }
    } catch (err) {
      setFetchStatus({ error: 'Error fetching price: ' + err.message });
    } finally {
      setIsFetchingPrice(false);
    }
  };

  // Search mutual fund by name
  const handleSearchFund = async (query) => {
    if (!query || query.trim().length < 3) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const results = await searchMutualFunds(query);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleSelectFund = (fund) => {
    setFormData(prev => ({
      ...prev,
      symbol: fund.schemeCode,
      name: fund.schemeName,
      category: 'Mutual Fund',
      exchange: 'AMFI'
    }));
    setSearchResults([]);
    // Automatically trigger NAV fetch
    fetchMutualFundNav(fund.schemeCode).then(res => {
      if (res?.nav) {
        setFormData(prev => ({ ...prev, current_price: res.nav }));
        setFetchStatus({ success: `Loaded NAV: ₹${res.nav} (${res.date})` });
      }
    });
  };

  // Preview Calculations
  const unitsNum = parseFloat(formData.units) || 0;
  const investedNum = parseFloat(formData.invested_amount) || 0;
  const currentPriceNum = parseFloat(formData.current_price) || 0;
  const avgBuyPrice = unitsNum > 0 ? (investedNum / unitsNum) : 0;
  const currentValue = unitsNum * currentPriceNum;
  const unrealizedPnl = currentValue - investedNum;
  const unrealizedPnlPercent = investedNum > 0 ? ((unrealizedPnl / investedNum) * 100) : 0;

  const handleSubmit = (e) => {
    e.preventDefault();

    const holdingObj = calculateHoldingMetrics({
      id: isCreating ? `dh_${Date.now()}` : holding.id,
      name: formData.name.trim(),
      symbol: formData.symbol.trim().toUpperCase(),
      category: formData.category,
      exchange: formData.exchange,
      member_id: formData.member_id,
      units: unitsNum,
      invested_amount: investedNum,
      avg_buy_price: avgBuyPrice,
      current_price: currentPriceNum,
      current_value: currentValue,
      notes: formData.notes.trim()
    });

    const updated = { ...data };
    const existing = updated.dematHoldings || [];

    if (isCreating) {
      updated.dematHoldings = [...existing, holdingObj];
    } else {
      updated.dematHoldings = existing.map(h => h.id === holding.id ? holdingObj : h);
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
      <div
        className="modal-content"
        style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: 'rgba(139, 92, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#c084fc'
            }}>
              <TrendingUp size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                {isCreating ? 'Add Demat Holding / Mutual Fund' : `Edit ${holding?.name || 'Holding'}`}
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Track original invested amount, units, and live market price.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Category & Member */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Asset Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="form-input"
              >
                <option value="Equity / Stocks">Equity / Stocks (NSE/BSE)</option>
                <option value="Mutual Fund">Mutual Fund (AMFI NAV)</option>
                <option value="ETF / Bullion">ETF / Bullion (Gold/Nifty)</option>
                <option value="SGB / Gold Bond">SGB / Gold Bond</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Family Member Entity</label>
              <select
                name="member_id"
                value={formData.member_id}
                onChange={handleChange}
                className="form-input"
              >
                {data?.members?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.relation})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Symbol / Scheme Code + Live Fetch Button */}
          <div className="form-group">
            <label className="form-label">
              {formData.category === 'Mutual Fund' 
                ? 'AMFI Scheme Code (e.g. 122639 for Parag Parikh Flexi Cap)' 
                : 'Stock / Ticker Symbol (e.g. RELIANCE, TCS, HDFCBANK)'}
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                name="symbol"
                required
                value={formData.symbol}
                onChange={handleChange}
                className="form-input"
                placeholder={formData.category === 'Mutual Fund' ? '122639' : 'RELIANCE'}
                style={{ flex: 1, fontFamily: 'var(--font-mono)' }}
              />
              <button
                type="button"
                onClick={handleFetchPrice}
                disabled={isFetchingPrice}
                className="btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap', borderColor: 'rgba(56, 189, 248, 0.4)', color: '#38bdf8' }}
              >
                <RefreshCw size={14} className={isFetchingPrice ? 'animate-spin' : ''} />
                <span>{isFetchingPrice ? 'Fetching...' : 'Fetch Live Price'}</span>
              </button>
            </div>
            {fetchStatus?.success && (
              <div style={{ fontSize: '0.75rem', color: '#34d399', marginTop: '4px' }}>
                ✓ {fetchStatus.success}
              </div>
            )}
            {fetchStatus?.error && (
              <div style={{ fontSize: '0.75rem', color: '#fb7185', marginTop: '4px' }}>
                ⚠ {fetchStatus.error}
              </div>
            )}
          </div>

          {/* MF Search Helper (if Mutual Fund) */}
          {formData.category === 'Mutual Fund' && (
            <div className="form-group" style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px' }}>
              <label className="form-label" style={{ fontSize: '0.75rem', color: '#38bdf8' }}>
                🔍 Search Mutual Fund Scheme Code by Name
              </label>
              <input
                type="text"
                placeholder="Type fund name (e.g. Parag Parikh, Mirae, SBI)..."
                onChange={(e) => handleSearchFund(e.target.value)}
                className="form-input"
                style={{ fontSize: '0.8125rem' }}
              />
              {isSearching && <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>Searching AMFI database...</div>}
              {searchResults.length > 0 && (
                <div style={{ maxHeight: '130px', overflowY: 'auto', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {searchResults.map((f) => (
                    <button
                      key={f.schemeCode}
                      type="button"
                      onClick={() => handleSelectFund(f)}
                      style={{
                        textAlign: 'left',
                        padding: '5px 8px',
                        background: 'rgba(255,255,255,0.05)',
                        border: 'none',
                        borderRadius: '4px',
                        color: '#f8fafc',
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      <strong style={{ color: '#38bdf8' }}>{f.schemeCode}</strong>: {f.schemeName}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Asset Name */}
          <div className="form-group">
            <label className="form-label">Asset / Holding Full Name</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g. Reliance Industries Ltd or Parag Parikh Flexi Cap Fund"
            />
          </div>

          {/* Financial Values Grid: Units, Invested Amount, Current Price */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Units / Quantity</label>
              <input
                type="number"
                step="any"
                name="units"
                required
                value={formData.units}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g. 50 or 1450.25"
                style={{ fontFamily: 'var(--font-mono)' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Original Invested (₹)</label>
              <input
                type="number"
                step="any"
                name="invested_amount"
                required
                value={formData.invested_amount}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g. 120000"
                style={{ fontFamily: 'var(--font-mono)' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Current Price / NAV (₹)</label>
              <input
                type="number"
                step="any"
                name="current_price"
                required
                value={formData.current_price}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g. 2985.40"
                style={{ fontFamily: 'var(--font-mono)' }}
              />
            </div>
          </div>

          {/* Real-Time Calculation Preview Card */}
          <div style={{
            padding: '0.85rem',
            background: 'rgba(139, 92, 246, 0.08)',
            borderRadius: '10px',
            border: '1px solid rgba(139, 92, 246, 0.25)',
            marginBottom: '1rem',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1.2fr',
            gap: '0.5rem',
            fontSize: '0.75rem'
          }}>
            <div>
              <span style={{ color: '#94a3b8' }}>Avg Buy Cost / Unit:</span>
              <div style={{ fontWeight: 700, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                {avgBuyPrice > 0 ? formatINR(avgBuyPrice) : '₹0'}
              </div>
            </div>

            <div>
              <span style={{ color: '#94a3b8' }}>Current Portfolio Value:</span>
              <div style={{ fontWeight: 700, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                {formatINR(currentValue)}
              </div>
            </div>

            <div>
              <span style={{ color: '#94a3b8' }}>Unrealized Gain / Loss:</span>
              <div style={{
                fontWeight: 700,
                color: unrealizedPnl >= 0 ? '#34d399' : '#fb7185',
                fontFamily: 'var(--font-mono)'
              }}>
                {unrealizedPnl >= 0 ? '+' : ''}{formatINR(unrealizedPnl)} ({unrealizedPnlPercent >= 0 ? '+' : ''}{unrealizedPnlPercent.toFixed(2)}%)
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">Notes / Demat Account (Optional)</label>
            <input
              type="text"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g. Zerodha Demat / Coin SIP"
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <Save size={15} /> Save Holding
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
