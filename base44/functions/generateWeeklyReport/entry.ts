import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { format } from 'npm:date-fns';
import Stripe from 'npm:stripe@14.21.0';

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
    weekday: obj.weekday, // "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"
  };
}

// Returns a UTC Date representing midnight of a given Sydney local date (y, m, d).
// Uses Intl to correctly account for AEST/AEDT offset — no hardcoded +10/+11.
function sydneyMidnightToUTC(year, month, day) {
  // Construct a Sydney-local midnight string and resolve it to UTC via the TZ offset trick.
  // We do this by formatting a candidate UTC date back to Sydney and iterating if needed —
  // but the simplest correct approach is: find the UTC ms for Sydney 00:00 via binary search
  // on Intl.DateTimeFormat output. Since Sydney is always UTC+10 or UTC+11, we can just
  // try the two candidates and pick the right one.
  const pad = (n) => String(n).padStart(2, '0');
  const localStr = `${year}-${pad(month)}-${pad(day)}`;

  // Try UTC-10 and UTC-11 candidates
  for (const offsetHours of [10, 11]) {
    const candidateUTC = new Date(`${localStr}T00:00:00Z`);
    candidateUTC.setUTCHours(candidateUTC.getUTCHours() - offsetHours); // shift: sydMidnight = UTC - offset => UTC = sydMidnight + offset
    // Actually: Sydney local = UTC + offset => UTC = Sydney local - offset
    const check = getSydneyTime(new Date(Date.UTC(year, 0, 1))); // just init
    // Use simpler reliable method: construct as ISO and let Intl verify
    const tryUTC = new Date(`${localStr}T00:00:00+${String(offsetHours).padStart(2,'0')}:00`);
    const verify = getSydneyTime(tryUTC);
    if (verify.year === year && verify.month === month && verify.day === day && verify.hour === 0) {
      return tryUTC;
    }
  }
  // Fallback: shouldn't reach here, but use a best-effort UTC+10
  return new Date(`${localStr}T00:00:00+10:00`);
}

// Returns { start, end } as UTC Dates for the Sydney Mon–Sun week containing `date`.
function getSydneyWeekBounds(date = new Date()) {
  const syd = getSydneyTime(date);

  const weekdayOffsets = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  const daysFromMonday = weekdayOffsets[syd.weekday] ?? 0;

  // Build a JS Date for today in Sydney and step back to Monday
  // We work in Sydney calendar days directly
  const sydDateMs = Date.UTC(syd.year, syd.month - 1, syd.day);
  const mondaySydMs = sydDateMs - daysFromMonday * 86400000;
  const mondaySyd = new Date(mondaySydMs);

  const weekStart = sydneyMidnightToUTC(
    mondaySyd.getUTCFullYear(),
    mondaySyd.getUTCMonth() + 1,
    mondaySyd.getUTCDate()
  );

  // End = next Monday 00:00 Sydney (exclusive upper bound)
  const nextMondaySydMs = mondaySydMs + 7 * 86400000;
  const nextMondaySyd = new Date(nextMondaySydMs);
  const weekEnd = sydneyMidnightToUTC(
    nextMondaySyd.getUTCFullYear(),
    nextMondaySyd.getUTCMonth() + 1,
    nextMondaySyd.getUTCDate()
  );

  return { start: weekStart, end: weekEnd };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow service role calls (from emailWeeklyReport automation) or admin users
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const now = new Date();

    // Sydney-aware week boundaries
    const { start: thisWeekStart, end: thisWeekEnd } = getSydneyWeekBounds(now);
    const lastWeekStartMs = thisWeekStart.getTime() - 7 * 86400000;
    const lastWeekStart = new Date(lastWeekStartMs);
    const lastWeekEnd = thisWeekStart; // last week ends exactly when this week starts

    // Fetch Stripe payment intents for this week and last week
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    const fetchStripeRevenue = async (start, end) => {
      const charges = await stripe.paymentIntents.list({
        created: { gte: Math.floor(start.getTime() / 1000), lte: Math.floor(end.getTime() / 1000) },
        limit: 100
      });
      return charges.data
        .filter(pi => pi.status === 'succeeded')
        .reduce((sum, pi) => sum + (pi.amount_received / 100), 0);
    };

    // Fetch all data in parallel
    const [allMemberships, allCheckins, allOfferRedemptions, allTransactions, allOffers, stripeThisWeek, stripeLastWeek] = await Promise.all([
      base44.asServiceRole.entities.Membership.list('-created_date', 2000),
      base44.asServiceRole.entities.CheckIn.list('-timestamp', 1000),
      base44.asServiceRole.entities.OfferRedemption.list('-timestamp', 1000),
      base44.asServiceRole.entities.Transaction.list('-timestamp', 1000),
      base44.asServiceRole.entities.Offer.filter({ is_active: true }),
      fetchStripeRevenue(thisWeekStart, thisWeekEnd),
      fetchStripeRevenue(lastWeekStart, lastWeekEnd)
    ]);

    const filterByWindow = (items, dateField, start, end) =>
      items.filter(i => { const d = new Date(i[dateField]); return d >= start && d < end; });

    // Current week metrics
    const thisWeekCheckins = filterByWindow(allCheckins, 'timestamp', thisWeekStart, thisWeekEnd);
    const thisWeekRedemptions = filterByWindow(allOfferRedemptions, 'timestamp', thisWeekStart, thisWeekEnd);
    const thisWeekTransactions = filterByWindow(allTransactions, 'timestamp', thisWeekStart, thisWeekEnd);
    const thisWeekSignups = filterByWindow(allMemberships, 'created_date', thisWeekStart, thisWeekEnd);

    // Last week metrics
    const lastWeekCheckins = filterByWindow(allCheckins, 'timestamp', lastWeekStart, lastWeekEnd);
    const lastWeekTransactions = filterByWindow(allTransactions, 'timestamp', lastWeekStart, lastWeekEnd);
    const lastWeekSignups = filterByWindow(allMemberships, 'created_date', lastWeekStart, lastWeekEnd);

    // Calculate metrics
    const totalMembers = allMemberships.length;
    const paidMembers = allMemberships.filter(m => m.status === 'active').length;

    const thisWeekRevenue = thisWeekTransactions.reduce((sum, t) => sum + (t.final_amount || 0), 0);
    const lastWeekRevenue = lastWeekTransactions.reduce((sum, t) => sum + (t.final_amount || 0), 0);

    const stripeSalesChange = stripeLastWeek > 0 ? (((stripeThisWeek - stripeLastWeek) / stripeLastWeek) * 100).toFixed(1) : 0;

    // Top sponsor by offer redemptions
    const sponsorClicks = {};
    thisWeekRedemptions.forEach(r => {
      const sponsor = r.sponsor_name || 'Unknown';
      sponsorClicks[sponsor] = (sponsorClicks[sponsor] || 0) + 1;
    });
    const topSponsor = Object.entries(sponsorClicks).sort((a, b) => b[1] - a[1])[0] || ['None', 0];

    // Peak usage analysis — use Sydney hours, not UTC hours
    const hourlyActivity = {};
    thisWeekCheckins.forEach(c => {
      const hour = getSydneyTime(new Date(c.timestamp)).hour;
      hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
    });
    const peakHour = Object.entries(hourlyActivity).sort((a, b) => b[1] - a[1])[0];
    const peakTimeLabel = peakHour ? `${peakHour[0]}:00 - ${parseInt(peakHour[0]) + 1}:00 AEST` : 'N/A';

    // Percentage changes
    const revenueChange = lastWeekRevenue > 0 ? (((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100).toFixed(1) : 0;
    const engagementChange = lastWeekCheckins.length > 0 ? (((thisWeekCheckins.length - lastWeekCheckins.length) / lastWeekCheckins.length) * 100).toFixed(1) : 0;

    // Underperforming sponsors
    const sponsorPerformance = allOffers.map(offer => ({
      name: offer.sponsor_name,
      clicks: thisWeekRedemptions.filter(r => r.sponsor_id === offer.sponsor_id).length,
      offers: 1
    })).reduce((acc, curr) => {
      const existing = acc.find(s => s.name === curr.name);
      if (existing) { existing.clicks += curr.clicks; existing.offers += curr.offers; }
      else acc.push(curr);
      return acc;
    }, []);

    const avgClicks = sponsorPerformance.reduce((sum, s) => sum + s.clicks, 0) / Math.max(sponsorPerformance.length, 1);
    const underperformingSponsors = sponsorPerformance.filter(s => s.clicks < avgClicks * 0.5).map(s => s.name);

    // Insights
    const insights = [];
    if (peakHour) insights.push(`Peak engagement: ${peakTimeLabel}`);
    if (parseFloat(engagementChange) > 10) insights.push('Strong engagement growth this week');
    if (parseFloat(engagementChange) < -10) insights.push('Engagement declined - investigation needed');
    if (underperformingSponsors.length > 0) insights.push(`Underperforming sponsors: ${underperformingSponsors.join(', ')}`);
    if (parseFloat(revenueChange) > 15) insights.push('Revenue growth exceeding expectations');

    // Format the period display using Sydney-local dates
    const sydStart = getSydneyTime(thisWeekStart);
    const sydEnd = getSydneyTime(new Date(thisWeekEnd.getTime() - 1)); // 1ms before end = last second of Sunday

    const report = {
      week: format(now, 'w'),
      year: format(now, 'yyyy'),
      periodStart: `${sydStart.day}/${sydStart.month}`,
      periodEnd: `${sydEnd.day}/${sydEnd.month}`,
      metrics: {
        totalMembers,
        paidMembers,
        newSignups: thisWeekSignups.length,
        signupsChange: lastWeekSignups.length > 0 ? parseFloat((((thisWeekSignups.length - lastWeekSignups.length) / lastWeekSignups.length) * 100).toFixed(1)) : 0,
        stripeSales: stripeThisWeek.toFixed(2),
        stripeSalesChange: parseFloat(stripeSalesChange),
        revenue: thisWeekRevenue.toFixed(2),
        revenueChange: parseFloat(revenueChange),
        gameAttendance: thisWeekCheckins.length,
        attendanceChange: parseFloat(engagementChange),
        offerRedemptions: thisWeekRedemptions.length,
        topSponsor: { name: topSponsor[0], clicks: topSponsor[1] },
        peakTime: peakTimeLabel
      },
      insights,
      timestamp: now.toISOString()
    };

    return Response.json({ success: true, report });

  } catch (error) {
    console.error('Report generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});