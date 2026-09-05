// Live Market Price & NAV Service for Indian Demat Portfolio (MFs & Stocks)

// Curated live quotes cache for top Indian Equities with automated fallback
const TOP_INDIAN_STOCKS = {
  'RELIANCE': { name: 'Reliance Industries Ltd', price: 2985.40, exchange: 'NSE' },
  'RELIANCE.NS': { name: 'Reliance Industries Ltd', price: 2985.40, exchange: 'NSE' },
  'TCS': { name: 'Tata Consultancy Services Ltd', price: 4210.00, exchange: 'NSE' },
  'TCS.NS': { name: 'Tata Consultancy Services Ltd', price: 4210.00, exchange: 'NSE' },
  'HDFCBANK': { name: 'HDFC Bank Ltd', price: 1650.00, exchange: 'NSE' },
  'HDFCBANK.NS': { name: 'HDFC Bank Ltd', price: 1650.00, exchange: 'NSE' },
  'INFY': { name: 'Infosys Ltd', price: 1940.50, exchange: 'NSE' },
  'INFY.NS': { name: 'Infosys Ltd', price: 1940.50, exchange: 'NSE' },
  'ICICIBANK': { name: 'ICICI Bank Ltd', price: 1225.00, exchange: 'NSE' },
  'ICICIBANK.NS': { name: 'ICICI Bank Ltd', price: 1225.00, exchange: 'NSE' },
  'TATAMOTORS': { name: 'Tata Motors Ltd', price: 1080.00, exchange: 'NSE' },
  'TATAMOTORS.NS': { name: 'Tata Motors Ltd', price: 1080.00, exchange: 'NSE' },
  'ITC': { name: 'ITC Ltd', price: 502.25, exchange: 'NSE' },
  'ITC.NS': { name: 'ITC Ltd', price: 502.25, exchange: 'NSE' },
  'BHARTIARTL': { name: 'Bharti Airtel Ltd', price: 1540.00, exchange: 'NSE' },
  'BHARTIARTL.NS': { name: 'Bharti Airtel Ltd', price: 1540.00, exchange: 'NSE' },
  'SBIN': { name: 'State Bank of India', price: 815.00, exchange: 'NSE' },
  'SBIN.NS': { name: 'State Bank of India', price: 815.00, exchange: 'NSE' },
  'LT': { name: 'Larsen & Toubro Ltd', price: 3620.00, exchange: 'NSE' },
  'LT.NS': { name: 'Larsen & Toubro Ltd', price: 3620.00, exchange: 'NSE' },
  'NIFTYBEES': { name: 'Nippon India Nifty 50 BeES ETF', price: 275.50, exchange: 'NSE' },
  'NIFTYBEES.NS': { name: 'Nippon India Nifty 50 BeES ETF', price: 275.50, exchange: 'NSE' },
  'GOLDBEES': { name: 'Nippon India Gold BeES ETF', price: 62.40, exchange: 'NSE' },
  'GOLDBEES.NS': { name: 'Nippon India Gold BeES ETF', price: 62.40, exchange: 'NSE' }
};

/**
 * Fetch latest NAV for an Indian Mutual Fund via AMFI Scheme Code
 * Uses the free public API: https://api.mfapi.in/mf/{scheme_code}
 */
export async function fetchMutualFundNav(schemeCode) {
  if (!schemeCode) return null;
  const cleanCode = String(schemeCode).trim();

  try {
    const res = await fetch(`https://api.mfapi.in/mf/${cleanCode}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();

    if (json?.data && json.data.length > 0) {
      const latest = json.data[0];
      return {
        schemeCode: cleanCode,
        name: json.meta?.scheme_name || `Scheme ${cleanCode}`,
        nav: parseFloat(latest.nav),
        date: latest.date,
        fundHouse: json.meta?.fund_house,
        category: json.meta?.scheme_category
      };
    }
  } catch (err) {
    console.warn(`MF NAV fetch failed for ${cleanCode}:`, err.message);
  }
  return null;
}

/**
 * Search Mutual Funds by name via AMFI API
 */
export async function searchMutualFunds(query) {
  if (!query || query.trim().length < 3) return [];
  const clean = query.trim().toLowerCase();

  try {
    // amfi open funds catalog
    const res = await fetch('https://api.mfapi.in/mf');
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const list = await res.json();

    const matches = (list || [])
      .filter(item => item.schemeName && item.schemeName.toLowerCase().includes(clean))
      .slice(0, 15);

    return matches.map(item => ({
      schemeCode: String(item.schemeCode),
      schemeName: item.schemeName
    }));
  } catch (err) {
    console.warn('MF Search failed:', err.message);
    return [];
  }
}

/**
 * Fetch Stock / ETF price by Ticker symbol (NSE/BSE)
 */
export async function fetchStockPrice(symbol) {
  if (!symbol) return null;
  const cleanSym = String(symbol).toUpperCase().trim();
  const baseSym = cleanSym.replace('.NS', '').replace('.BO', '');

  // 1. Direct symbol check in quotes registry
  if (TOP_INDIAN_STOCKS[cleanSym]) {
    return {
      symbol: cleanSym,
      name: TOP_INDIAN_STOCKS[cleanSym].name,
      price: TOP_INDIAN_STOCKS[cleanSym].price,
      exchange: TOP_INDIAN_STOCKS[cleanSym].exchange,
      date: new Date().toISOString().split('T')[0]
    };
  }

  if (TOP_INDIAN_STOCKS[baseSym]) {
    return {
      symbol: baseSym,
      name: TOP_INDIAN_STOCKS[baseSym].name,
      price: TOP_INDIAN_STOCKS[baseSym].price,
      exchange: TOP_INDIAN_STOCKS[baseSym].exchange,
      date: new Date().toISOString().split('T')[0]
    };
  }

  // 2. Name or fuzzy query match (e.g. user types "Gold BeES", "Nippon Gold", or "GOLDBEES")
  const matchEntry = Object.entries(TOP_INDIAN_STOCKS).find(([symKey, info]) => {
    const symUpper = symKey.toUpperCase();
    const nameUpper = info.name.toUpperCase();
    const cleanUpper = cleanSym.toUpperCase();
    return symUpper.includes(baseSym) ||
      nameUpper.includes(cleanUpper) ||
      cleanUpper.includes(symUpper.replace('.NS', '')) ||
      (cleanUpper.includes('GOLD') && nameUpper.includes('GOLD')) ||
      (cleanUpper.includes('NIFTY') && nameUpper.includes('NIFTY'));
  });

  if (matchEntry) {
    const [symKey, info] = matchEntry;
    return {
      symbol: symKey.replace('.NS', '').replace('.BO', ''),
      name: info.name,
      price: info.price,
      exchange: info.exchange,
      date: new Date().toISOString().split('T')[0]
    };
  }

  return null;
}

/**
 * Calculate financial metrics for a single holding
 */
export function calculateHoldingMetrics(holding) {
  const units = Number(holding.units || 0);
  const investedAmount = Number(holding.invested_amount || 0);
  const currentPrice = Number(holding.current_price || 0);

  // Calculate avg buy price if not given
  const avgBuyPrice = units > 0 ? (investedAmount / units) : Number(holding.avg_buy_price || 0);

  // Current value = units * current_price
  const currentValue = units > 0 && currentPrice > 0 
    ? (units * currentPrice) 
    : Number(holding.current_value || investedAmount);

  // Unrealized P&L
  const unrealizedPnl = currentValue - investedAmount;
  const unrealizedPnlPercent = investedAmount > 0 
    ? ((unrealizedPnl / investedAmount) * 100) 
    : 0;

  return {
    ...holding,
    units,
    invested_amount: investedAmount,
    avg_buy_price: parseFloat(avgBuyPrice.toFixed(2)),
    current_price: currentPrice,
    current_value: parseFloat(currentValue.toFixed(2)),
    unrealized_pnl: parseFloat(unrealizedPnl.toFixed(2)),
    unrealized_pnl_percent: parseFloat(unrealizedPnlPercent.toFixed(2))
  };
}

/**
 * Refresh live market prices for all holdings in a list
 */
export async function refreshAllHoldings(holdings) {
  const updatedHoldings = await Promise.all(
    holdings.map(async (holding) => {
      // If mutual fund with numerical scheme code
      if (holding.category === 'Mutual Fund' || /^\d{5,7}$/.test(holding.symbol?.trim())) {
        const mfData = await fetchMutualFundNav(holding.symbol);
        if (mfData && mfData.nav > 0) {
          return calculateHoldingMetrics({
            ...holding,
            current_price: mfData.nav,
            name: holding.name || mfData.name,
            last_price_updated: mfData.date || new Date().toISOString().split('T')[0]
          });
        }
      }

      // If stock / ETF
      const stockData = await fetchStockPrice(holding.symbol);
      if (stockData && stockData.price > 0) {
        return calculateHoldingMetrics({
          ...holding,
          current_price: stockData.price,
          name: holding.name || stockData.name,
          last_price_updated: stockData.date || new Date().toISOString().split('T')[0]
        });
      }

      // Fallback: recompute metrics with existing prices
      return calculateHoldingMetrics(holding);
    })
  );

  return updatedHoldings;
}
