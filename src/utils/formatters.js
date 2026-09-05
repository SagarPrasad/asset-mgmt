// Indian Currency & Masking formatters

export const formatINR = (val, privacyMode = false) => {
  if (privacyMode) return '••••••••';
  if (val === undefined || val === null || isNaN(val)) return '₹0';

  const num = Number(val);
  return '₹' + num.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: num % 1 === 0 ? 0 : 2
  });
};

export const formatCompactINR = (val, privacyMode = false) => {
  if (privacyMode) return '••••';
  if (!val || isNaN(val)) return '₹0';
  const num = Math.abs(Number(val));

  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)} Cr`;
  } else if (num >= 100000) {
    return `₹${(num / 100000).toFixed(2)} L`;
  } else if (num >= 1000) {
    return `₹${(num / 1000).toFixed(1)} K`;
  }
  return `₹${num.toFixed(0)}`;
};

export const maskSensitive = (text, privacyMode = false, visibleChars = 4) => {
  if (!text) return '-';
  const str = String(text).trim();
  if (str.startsWith('enc::')) {
    return '•••• (Encrypted)';
  }
  if (!privacyMode) return text;

  if (str.length <= visibleChars) return '••••';
  return '•••• ' + str.slice(-visibleChars);
};

export const matchesMember = (itemMemberId, targetMemberId, members = []) => {
  if (!targetMemberId || targetMemberId === 'all') return true;
  if (!itemMemberId) return false;
  if (itemMemberId === targetMemberId) return true;

  const targetMember = members.find(m => m.id === targetMemberId);
  if (!targetMember) return false;

  const targetName = (targetMember.name || '').toLowerCase().trim();
  const itemId = String(itemMemberId).toLowerCase().trim();

  if (itemId === targetName) return true;
  if (targetName && (itemId.includes(targetName) || targetName.includes(itemId))) return true;

  return false;
};

// Calculate summary totals for a given financial year and optional member filter
export const calculateFinancialYearTotals = (data, fyId, memberFilterId = 'all') => {
  if (!data) return { bankTotal: 0, investmentTotal: 0, propertyTotal: 0, movableTotal: 0, liabilityTotal: 0, netWorth: 0, interestTotal: 0 };
  const members = data.members || [];

  // 1. Bank Balances & Interest
  let bankTotal = 0;
  let interestTotal = 0;
  (data.bankAccounts || []).forEach(b => {
    if (!matchesMember(b.member_id, memberFilterId, members)) return;
    const snap = b.snapshots?.[fyId];
    if (snap) {
      bankTotal += Number(snap.balance || 0);
      interestTotal += Number(snap.interest_acquired || 0);
    }
  });

  // 2. Investments (Demat, EPFO, NPS, Bonds)
  let investmentTotal = 0;
  (data.investments || []).forEach(inv => {
    if (!matchesMember(inv.member_id, memberFilterId, members)) return;
    const val = inv.values?.[fyId] ?? inv.values?.['fy_25_26'] ?? inv.current_value ?? 0;
    investmentTotal += Number(val || 0);
  });

  // 2b. Demat Holdings (Stocks & Mutual Funds)
  (data.dematHoldings || []).forEach(h => {
    if (!matchesMember(h.member_id, memberFilterId, members)) return;
    const curVal = Number(h.current_value || (Number(h.units || 0) * Number(h.current_price || 0)) || 0);
    investmentTotal += curVal;
  });

  // 3. Immovable Properties (Real estate)
  let propertyTotal = 0;
  (data.immovableProperties || []).forEach(prop => {
    if (prop.member_id && !matchesMember(prop.member_id, memberFilterId, members)) return;
    propertyTotal += Number(prop.cost_amount || prop.current_valuation || 0);
  });

  // 4. Movable Assets (Vehicles, Jewellery, Art, Cash)
  let movableTotal = 0;
  (data.movableAssets || []).forEach(m => {
    if (!matchesMember(m.member_id, memberFilterId, members)) return;
    if (m.status !== 'Sold') {
      movableTotal += Number(m.current_value || 0);
    }
  });

  // 5. Liabilities (Loans)
  let liabilityTotal = 0;
  (data.liabilitiesAndExpenses || []).forEach(l => {
    if (l.category === 'Loans & Liabilities') {
      liabilityTotal += Number(l.amount || 0);
    }
  });

  const totalAssets = bankTotal + investmentTotal + propertyTotal + movableTotal;
  const netWorth = totalAssets - liabilityTotal;

  return {
    bankTotal,
    interestTotal,
    investmentTotal,
    propertyTotal,
    movableTotal,
    totalAssets,
    liabilityTotal,
    netWorth
  };
};
