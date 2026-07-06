import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Returns ISO week number for a given date
function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

const FALLBACK_ADMIN_EMAIL = 'tyneowen@live.com';

// TODO: extract to shared util when Deno supports local imports across functions.
// Returns decomposed Sydney local time for any UTC Date — handles AEST/AEDT automatically.
function getSydneyTime(date = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Sydney',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const obj = {};
  for (const p of parts) obj[p.type] = p.value;
  return {
    year: parseInt(obj.year),
    month: parseInt(obj.month),
    day: parseInt(obj.day),
    hour: parseInt(obj.hour),
    minute: parseInt(obj.minute),
    weekday: obj.weekday,
  };
}

// Returns a UTC Date representing midnight of a given Sydney local date (y, m, d).
function sydneyMidnightToUTC(year, month, day) {
  const pad = (n) => String(n).padStart(2, '0');
  const localStr = `${year}-${pad(month)}-${pad(day)}`;
  for (const offsetHours of [10, 11]) {
    const tryUTC = new Date(`${localStr}T00:00:00+${String(offsetHours).padStart(2,'0')}:00`);
    const verify = getSydneyTime(tryUTC);
    if (verify.year === year && verify.month === month && verify.day === day && verify.hour === 0) {
      return tryUTC;
    }
  }
  return new Date(`${localStr}T00:00:00+10:00`);
}

// Returns { start, end } as UTC Dates for the Sydney Mon–Sun week containing `date`.
function getSydneyWeekBounds(date = new Date()) {
  const syd = getSydneyTime(date);
  const weekdayOffsets = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  const daysFromMonday = weekdayOffsets[syd.weekday] ?? 0;

  const sydDateMs = Date.UTC(syd.year, syd.month - 1, syd.day);
  const mondaySydMs = sydDateMs - daysFromMonday * 86400000;
  const mondaySyd = new Date(mondaySydMs);

  const weekStart = sydneyMidnightToUTC(
    mondaySyd.getUTCFullYear(),
    mondaySyd.getUTCMonth() + 1,
    mondaySyd.getUTCDate()
  );

  const nextMondaySydMs = mondaySydMs + 7 * 86400000;
  const nextMondaySyd = new Date(nextMondaySydMs);
  const weekEnd = sydneyMidnightToUTC(
    nextMondaySyd.getUTCFullYear(),
    nextMondaySyd.getUTCMonth() + 1,
    nextMondaySyd.getUTCDate()
  );

  return { start: weekStart, end: weekEnd };
}

// Retry helper — attempts fn up to maxAttempts times with delayMs between each
async function withRetry(fn, maxAttempts = 3, delayMs = 500) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      console.warn(`Attempt ${attempt}/${maxAttempts} failed: ${err.message}`);
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    let club = { club_name: 'Central Newcastle RLFC', short_name: 'Butcher Boys', club_short_name: 'Central Newcastle', team_short: 'Central', venue_name: 'St John Oval', sport_emoji: '🏉', app_url: '' };
    try {
      const settings = await base44.asServiceRole.entities.ClubSettings.filter({ is_active: true });
      if (settings && settings[0]) club = { ...club, ...settings[0] };
    } catch (_) { /* fall back to defaults */ }

    const now = new Date();

    // Sydney-aware week boundaries
    const { start: thisWeekStart, end: thisWeekEnd } = getSydneyWeekBounds(now);
    const lastWeekStart = new Date(thisWeekStart.getTime() - 7 * 86400000);
    const lastWeekEnd = thisWeekStart;

    const filterByWindow = (items, dateField, start, end) =>
      items.filter(i => {
        const raw = i[dateField];
        if (!raw) return false;
        const d = new Date(raw);
        return !isNaN(d.getTime()) && d >= start && d < end;
      });

    // Fetch all data using service role (no auth required)
    const [allMemberships, allCheckins, allOfferRedemptions, allTransactions, allOffers, admins] = await Promise.all([
      base44.asServiceRole.entities.Membership.list('-created_date', 2000),
      base44.asServiceRole.entities.CheckIn.list('-timestamp', 1000),
      base44.asServiceRole.entities.OfferRedemption.list('-timestamp', 1000),
      base44.asServiceRole.entities.Transaction.list('-timestamp', 1000),
      base44.asServiceRole.entities.Offer.filter({ is_active: true }),
      withRetry(() => base44.asServiceRole.entities.User.filter({ role: 'admin' }))
    ]);

    let adminEmails = admins.map(a => a.email).filter(Boolean);
    if (adminEmails.length === 0) {
      console.warn(`Admin query returned empty — falling back to hardcoded admin: ${FALLBACK_ADMIN_EMAIL}`);
      adminEmails = [FALLBACK_ADMIN_EMAIL];
    }

    const thisWeekCheckins = filterByWindow(allCheckins, 'timestamp', thisWeekStart, thisWeekEnd);
    const lastWeekCheckins = filterByWindow(allCheckins, 'timestamp', lastWeekStart, lastWeekEnd);
    const thisWeekRedemptions = filterByWindow(allOfferRedemptions, 'timestamp', thisWeekStart, thisWeekEnd);
    const thisWeekTransactions = filterByWindow(allTransactions, 'timestamp', thisWeekStart, thisWeekEnd);
    const lastWeekTransactions = filterByWindow(allTransactions, 'timestamp', lastWeekStart, lastWeekEnd);
    const thisWeekSignups = filterByWindow(allMemberships, 'created_date', thisWeekStart, thisWeekEnd);
    const lastWeekSignups = filterByWindow(allMemberships, 'created_date', lastWeekStart, lastWeekEnd);

    const totalMembers = allMemberships.length;
    const paidMembers = allMemberships.filter(m => m.status === 'active').length;
    const thisWeekRevenue = thisWeekTransactions.reduce((sum, t) => sum + (t.final_amount || 0), 0);
    const lastWeekRevenue = lastWeekTransactions.reduce((sum, t) => sum + (t.final_amount || 0), 0);

    const revenueChange = lastWeekRevenue > 0 ? (((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100).toFixed(1) : 0;
    const attendanceChange = lastWeekCheckins.length > 0 ? (((thisWeekCheckins.length - lastWeekCheckins.length) / lastWeekCheckins.length) * 100).toFixed(1) : 0;
    const signupsChange = lastWeekSignups.length > 0 ? (((thisWeekSignups.length - lastWeekSignups.length) / lastWeekSignups.length) * 100).toFixed(1) : 0;

    // Top sponsor
    const sponsorClicks = {};
    thisWeekRedemptions.forEach(r => {
      const s = r.sponsor_name || 'Unknown';
      sponsorClicks[s] = (sponsorClicks[s] || 0) + 1;
    });
    const topSponsor = Object.entries(sponsorClicks).sort((a, b) => b[1] - a[1])[0] || ['None', 0];

    // Peak hour — Sydney local hours, not UTC
    const hourlyActivity = {};
    thisWeekCheckins.forEach(c => {
      const hour = getSydneyTime(new Date(c.timestamp)).hour;
      hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
    });
    const peakHour = Object.entries(hourlyActivity).sort((a, b) => b[1] - a[1])[0];
    const peakTimeLabel = peakHour ? `${peakHour[0]}:00 - ${parseInt(peakHour[0]) + 1}:00 AEST` : 'N/A';

    // Insights
    const insights = [];
    if (thisWeekSignups.length > 0) insights.push(`${thisWeekSignups.length} new member${thisWeekSignups.length !== 1 ? 's' : ''} signed up this week`);
    if (parseFloat(attendanceChange) > 10) insights.push('Strong attendance growth this week');
    if (parseFloat(attendanceChange) < -10) insights.push('Attendance declined vs last week');
    if (parseFloat(revenueChange) > 15) insights.push('Revenue growth exceeding expectations');
    if (peakHour) insights.push(`Peak gate scan time: ${peakTimeLabel}`);

    // Period label in Sydney dates
    const sydStart = getSydneyTime(thisWeekStart);
    const sydEnd = getSydneyTime(new Date(thisWeekEnd.getTime() - 1));
    const periodLabel = `${sydStart.day}/${sydStart.month} – ${sydEnd.day}/${sydEnd.month}/${sydEnd.year}`;

    const pct = (val) => `${parseFloat(val) >= 0 ? '+' : ''}${val}%`;
    const colorClass = (val) => parseFloat(val) >= 0 ? 'color:#22c55e' : 'color:#ef4444';

    const emailHTML = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; }
    .header { background: #1a365d; color: white; padding: 24px; text-align: center; }
    .header h1 { margin: 0 0 8px; font-size: 22px; }
    .header p { margin: 0; opacity: 0.8; font-size: 14px; }
    .content { padding: 20px; background: #f9f9f9; }
    .metric { background: white; padding: 16px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #1a365d; }
    .metric-title { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
    .metric-value { font-size: 28px; font-weight: bold; color: #1a365d; }
    .metric-change { font-size: 13px; color: #666; margin-top: 4px; }
    .insights { background: #eff6ff; border: 1px solid #bfdbfe; padding: 16px; margin: 16px 0; border-radius: 8px; }
    .insights strong { color: #1e40af; }
    .insight-item { margin: 6px 0; font-size: 14px; color: #374151; }
    .footer { padding: 16px; text-align: center; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 ${club.club_name}</h1>
    <p>Weekly Performance Report — Week ${getISOWeek(now)}, ${now.getUTCFullYear()}</p>
    <p>${periodLabel}</p>
  </div>
  <div class="content">

    <div class="metric">
      <div class="metric-title">New Sign-ups This Week</div>
      <div class="metric-value">${thisWeekSignups.length}</div>
      <div class="metric-change" style="${colorClass(signupsChange)}">${pct(signupsChange)} vs last week (${lastWeekSignups.length} last week)</div>
    </div>

    <div class="metric">
      <div class="metric-title">Total Members</div>
      <div class="metric-value">${totalMembers}</div>
      <div class="metric-change">Active/Paid: ${paidMembers}</div>
    </div>

    <div class="metric">
      <div class="metric-title">Game Attendance (QR Check-ins)</div>
      <div class="metric-value">${thisWeekCheckins.length}</div>
      <div class="metric-change" style="${colorClass(attendanceChange)}">${pct(attendanceChange)} vs last week</div>
    </div>

    <div class="metric">
      <div class="metric-title">Offer Redemptions</div>
      <div class="metric-value">${thisWeekRedemptions.length}</div>
      <div class="metric-change">Top sponsor: ${topSponsor[0]} (${topSponsor[1]} redemptions)</div>
    </div>

    <div class="metric">
      <div class="metric-title">Bar/Canteen Revenue</div>
      <div class="metric-value">$${thisWeekRevenue.toFixed(2)}</div>
      <div class="metric-change" style="${colorClass(revenueChange)}">${pct(revenueChange)} vs last week</div>
    </div>

    ${insights.length > 0 ? `
    <div class="insights">
      <strong>💡 Key Insights</strong>
      ${insights.map(i => `<div class="insight-item">• ${i}</div>`).join('')}
    </div>` : ''}

  </div>
  <div class="footer">${club.club_name} Membership App • Auto-generated report</div>
</body>
</html>`;

    await Promise.all(adminEmails.map(email =>
      base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject: `📊 Weekly Report — Week ${getISOWeek(now)}: ${thisWeekSignups.length} new sign-ups, ${thisWeekCheckins.length} check-ins`,
        body: emailHTML
      })
    ));

    console.log(`Weekly report sent to: ${adminEmails.join(', ')}`);
    return Response.json({ success: true, emailsSent: adminEmails.length, newSignups: thisWeekSignups.length });

  } catch (error) {
    console.error('Email report error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});