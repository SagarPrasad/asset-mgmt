// Insurance Due Date & Renewal Reminder Utilities

const MONTH_MAP = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11
};

/**
 * Parses premium_date strings (e.g. '23-MAY', '19-JULY', '15-OCT', '2026-09-25')
 * and calculates the next due date and days remaining from reference date.
 */
export function calculateNextDueDate(dateStr, referenceDate = new Date()) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const cleanStr = dateStr.trim();

  // If status is paid up or single premium, skip
  if (/paid up|single premium|one time/i.test(cleanStr)) {
    return null;
  }

  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);
  const currentYear = today.getFullYear();

  let targetMonth = null;
  let targetDay = 1;

  // Pattern 1: ISO Date 'YYYY-MM-DD'
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
    const parts = cleanStr.split('-');
    targetMonth = parseInt(parts[1], 10) - 1;
    targetDay = parseInt(parts[2], 10);
  }
  // Pattern 2: '23-MAY', '19-JULY', '15-OCT'
  else if (/^(\d{1,2})[-/ ]([a-zA-Z]+)/i.test(cleanStr)) {
    const match = cleanStr.match(/^(\d{1,2})[-/ ]([a-zA-Z]+)/i);
    targetDay = parseInt(match[1], 10);
    const mStr = match[2].toLowerCase();
    targetMonth = MONTH_MAP[mStr];
  }
  // Pattern 3: 'MAY-23', 'JULY 19'
  else if (/^([a-zA-Z]+)[-/ ](\d{1,2})/i.test(cleanStr)) {
    const match = cleanStr.match(/^([a-zA-Z]+)[-/ ](\d{1,2})/i);
    const mStr = match[1].toLowerCase();
    targetMonth = MONTH_MAP[mStr];
    targetDay = parseInt(match[2], 10);
  }
  // Pattern 4: Just Month name, e.g. 'June', 'September'
  else if (MONTH_MAP[cleanStr.toLowerCase()] !== undefined) {
    targetMonth = MONTH_MAP[cleanStr.toLowerCase()];
    targetDay = 1;
  }

  if (targetMonth === null || isNaN(targetDay)) return null;

  // Build target date for current year
  let nextDueDate = new Date(currentYear, targetMonth, targetDay);
  nextDueDate.setHours(0, 0, 0, 0);

  // If the date has already passed by more than 30 days, assume next year's renewal
  const diffDaysFromToday = Math.round((nextDueDate - today) / (1000 * 60 * 60 * 24));
  if (diffDaysFromToday < -30) {
    nextDueDate = new Date(currentYear + 1, targetMonth, targetDay);
  }

  const finalDiffDays = Math.round((nextDueDate - today) / (1000 * 60 * 60 * 24));

  let urgency = 'upcoming';
  let badgeLabel = '';

  if (finalDiffDays < 0) {
    urgency = 'overdue';
    badgeLabel = `Overdue by ${Math.abs(finalDiffDays)} day${Math.abs(finalDiffDays) === 1 ? '' : 's'}`;
  } else if (finalDiffDays === 0) {
    urgency = 'due_today';
    badgeLabel = 'Due Today';
  } else if (finalDiffDays <= 7) {
    urgency = 'due_soon';
    badgeLabel = `Due in ${finalDiffDays} days (This Week)`;
  } else if (finalDiffDays <= 15) {
    urgency = 'due_soon';
    badgeLabel = `Due in ${finalDiffDays} days`;
  } else if (finalDiffDays <= 30) {
    urgency = 'upcoming';
    badgeLabel = `Due in ${finalDiffDays} days (This Month)`;
  } else {
    urgency = 'upcoming';
    badgeLabel = `Due in ${finalDiffDays} days`;
  }

  return {
    nextDueDate,
    daysRemaining: finalDiffDays,
    urgency,
    badgeLabel,
    formattedDate: nextDueDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  };
}

/**
 * Returns all insurance policies with upcoming due dates within a given threshold
 */
export function getUpcomingInsuranceReminders(policies, daysThreshold = 45) {
  if (!policies || !Array.isArray(policies)) return [];

  const reminders = [];

  for (const p of policies) {
    // Skip paid up policies
    if (p.status === 'All Paid Up') continue;
    // Check if reminder is explicitly disabled
    if (p.reminder_enabled === false) continue;

    const threshold = p.reminder_days || daysThreshold;
    const dueInfo = calculateNextDueDate(p.premium_date || p.due_date);

    if (dueInfo && dueInfo.daysRemaining <= threshold && dueInfo.daysRemaining >= -30) {
      reminders.push({
        policy: p,
        ...dueInfo
      });
    }
  }

  // Sort by daysRemaining ascending (overdue & soonest first)
  reminders.sort((a, b) => a.daysRemaining - b.daysRemaining);

  return reminders;
}
