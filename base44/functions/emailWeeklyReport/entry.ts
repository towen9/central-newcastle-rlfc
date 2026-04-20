import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { subDays, startOfWeek, endOfWeek, format } from 'npm:date-fns';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const now = new Date();
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const lastWeekStart = subDays(thisWeekStart, 7);
    const lastWeekEnd = subDays(thisWeekEnd, 7);

    // Fetch all data using service role (no auth required)
    const [allMemberships, allCheckins, allOfferRedemptions, allTransactions, allOffers, admins] = await Promise.all([
      base44.asServiceRole.entities.Membership.list('-created_date', 2000),
      base44.asServiceRole.entities.CheckIn.list('-timestamp', 1000),
      base44.asServiceRole.entities.OfferRedemption.list('-timestamp', 1000),
      base44.asServiceRole.entities.Transaction.list('-timestamp', 1000),
      base44.asServiceRole.entities.Offer.filter({ is_active: true }),
      base44.asServiceRole.entities.User.filter({ role: 'admin' })
    ]);

    const adminEmails = admins.map(a => a.email).filter(Boolean);
    if (adminEmails.length === 0) {
      console.error('No admin emails found');
      return Response.json({ success: false, error: 'No admin emails found' });
    }

    // Filter by week
    const filterByWeek = (items, dateField, start, end) =>
      items.filter(i => { const d = new Date(i[dateField]); return d >= start && d <= end; });

    const thisWeekCheckins = filterByWeek(allCheckins, 'timestamp', thisWeekStart, thisWeekEnd);
    const lastWeekCheckins = filterByWeek(allCheckins, 'timestamp', lastWeekStart, lastWeekEnd);
    const thisWeekRedemptions = filterByWeek(allOfferRedemptions, 'timestamp', thisWeekStart, thisWeekEnd);
    const thisWeekTransactions = filterByWeek(allTransactions, 'timestamp', thisWeekStart, thisWeekEnd);
    const lastWeekTransactions = filterByWeek(allTransactions, 'timestamp', lastWeekStart, lastWeekEnd);
    const thisWeekSignups = filterByWeek(allMemberships, 'created_date', thisWeekStart, thisWeekEnd);
    const lastWeekSignups = filterByWeek(allMemberships, 'created_date', lastWeekStart, lastWeekEnd);

    // Metrics
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

    // Peak hour
    const hourlyActivity = {};
    thisWeekCheckins.forEach(c => {
      const hour = new Date(c.timestamp).getHours();
      hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
    });
    const peakHour = Object.entries(hourlyActivity).sort((a, b) => b[1] - a[1])[0];
    const peakTimeLabel = peakHour ? `${peakHour[0]}:00 - ${parseInt(peakHour[0]) + 1}:00` : 'N/A';

    // Insights
    const insights = [];
    if (thisWeekSignups.length > 0) insights.push(`${thisWeekSignups.length} new member${thisWeekSignups.length !== 1 ? 's' : ''} signed up this week`);
    if (parseFloat(attendanceChange) > 10) insights.push('Strong attendance growth this week');
    if (parseFloat(attendanceChange) < -10) insights.push('Attendance declined vs last week');
    if (parseFloat(revenueChange) > 15) insights.push('Revenue growth exceeding expectations');
    if (peakHour) insights.push(`Peak gate scan time: ${peakTimeLabel}`);

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
    <h1>📊 Central Newcastle RLFC</h1>
    <p>Weekly Performance Report — Week ${format(now, 'w')}, ${format(now, 'yyyy')}</p>
    <p>${format(thisWeekStart, 'MMM d')} – ${format(thisWeekEnd, 'MMM d, yyyy')}</p>
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
  <div class="footer">Central Newcastle RLFC Membership App • Auto-generated report</div>
</body>
</html>`;

    await Promise.all(adminEmails.map(email =>
      base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject: `📊 Weekly Report — Week ${format(now, 'w')}: ${thisWeekSignups.length} new sign-ups, ${thisWeekCheckins.length} check-ins`,
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