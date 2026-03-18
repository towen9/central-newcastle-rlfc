import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { subDays, startOfWeek, endOfWeek, format, differenceInDays } from 'npm:date-fns';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const now = new Date();
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const lastWeekStart = subDays(thisWeekStart, 7);
    const lastWeekEnd = subDays(thisWeekEnd, 7);

    // Fetch all data
    const [allMemberships, allCheckins, allOfferRedemptions, allTransactions, allOffers] = await Promise.all([
      base44.asServiceRole.entities.Membership.list(),
      base44.asServiceRole.entities.CheckIn.list('-timestamp', 1000),
      base44.asServiceRole.entities.OfferRedemption.list('-timestamp', 1000),
      base44.asServiceRole.entities.Transaction.list('-timestamp', 1000),
      base44.asServiceRole.entities.Offer.filter({ is_active: true })
    ]);

    // Current week metrics
    const thisWeekCheckins = allCheckins.filter(c => {
      const date = new Date(c.timestamp);
      return date >= thisWeekStart && date <= thisWeekEnd;
    });

    const thisWeekRedemptions = allOfferRedemptions.filter(r => {
      const date = new Date(r.timestamp);
      return date >= thisWeekStart && date <= thisWeekEnd;
    });

    const thisWeekTransactions = allTransactions.filter(t => {
      const date = new Date(t.timestamp);
      return date >= thisWeekStart && date <= thisWeekEnd;
    });

    // Last week metrics
    const lastWeekCheckins = allCheckins.filter(c => {
      const date = new Date(c.timestamp);
      return date >= lastWeekStart && date <= lastWeekEnd;
    });

    const lastWeekRedemptions = allOfferRedemptions.filter(r => {
      const date = new Date(r.timestamp);
      return date >= lastWeekStart && date <= lastWeekEnd;
    });

    const lastWeekTransactions = allTransactions.filter(t => {
      const date = new Date(t.timestamp);
      return date >= lastWeekStart && date <= lastWeekEnd;
    });

    // Calculate metrics
    const totalMembers = allMemberships.length;
    const activeMemberships = allMemberships.filter(m => m.status === 'active');
    const paidMembers = activeMemberships.length;

    const thisWeekRevenue = thisWeekTransactions.reduce((sum, t) => sum + (t.final_amount || 0), 0);
    const lastWeekRevenue = lastWeekTransactions.reduce((sum, t) => sum + (t.final_amount || 0), 0);

    // Top sponsor by offer clicks
    const sponsorClicks = {};
    thisWeekRedemptions.forEach(r => {
      const sponsor = r.sponsor_name || 'Unknown';
      sponsorClicks[sponsor] = (sponsorClicks[sponsor] || 0) + 1;
    });
    const topSponsor = Object.entries(sponsorClicks).sort((a, b) => b[1] - a[1])[0] || ['None', 0];

    // Peak usage analysis
    const hourlyActivity = {};
    thisWeekCheckins.forEach(c => {
      const hour = new Date(c.timestamp).getHours();
      hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
    });
    const peakHour = Object.entries(hourlyActivity).sort((a, b) => b[1] - a[1])[0];
    const peakTimeLabel = peakHour ? `${peakHour[0]}:00 - ${parseInt(peakHour[0]) + 1}:00` : 'N/A';

    // Calculate percentage changes
    const memberGrowth = ((totalMembers - (totalMembers - (thisWeekCheckins.length - lastWeekCheckins.length))) / Math.max(totalMembers, 1) * 100).toFixed(1);
    const revenueChange = lastWeekRevenue > 0 ? (((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100).toFixed(1) : 0;
    const engagementChange = lastWeekCheckins.length > 0 ? (((thisWeekCheckins.length - lastWeekCheckins.length) / lastWeekCheckins.length) * 100).toFixed(1) : 0;

    // Identify underperforming sponsors
    const sponsorPerformance = allOffers.map(offer => {
      const clicks = thisWeekRedemptions.filter(r => r.sponsor_id === offer.sponsor_id).length;
      return {
        name: offer.sponsor_name,
        clicks,
        offers: 1
      };
    }).reduce((acc, curr) => {
      const existing = acc.find(s => s.name === curr.name);
      if (existing) {
        existing.clicks += curr.clicks;
        existing.offers += curr.offers;
      } else {
        acc.push(curr);
      }
      return acc;
    }, []);

    const avgClicks = sponsorPerformance.reduce((sum, s) => sum + s.clicks, 0) / Math.max(sponsorPerformance.length, 1);
    const underperformingSponsors = sponsorPerformance.filter(s => s.clicks < avgClicks * 0.5).map(s => s.name);

    // Generate insights
    const insights = [];
    if (peakHour) insights.push(`Peak engagement: ${peakTimeLabel}`);
    if (parseFloat(engagementChange) > 10) insights.push('Strong engagement growth this week');
    if (parseFloat(engagementChange) < -10) insights.push('Engagement declined - investigation needed');
    if (underperformingSponsors.length > 0) insights.push(`Underperforming sponsors: ${underperformingSponsors.join(', ')}`);
    if (parseFloat(revenueChange) > 15) insights.push('Revenue growth exceeding expectations');

    const report = {
      week: format(now, 'w'),
      year: format(now, 'yyyy'),
      periodStart: format(thisWeekStart, 'MMM d'),
      periodEnd: format(thisWeekEnd, 'MMM d'),
      metrics: {
        totalMembers,
        paidMembers,
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