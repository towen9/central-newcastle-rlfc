import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { subDays, subHours, startOfWeek } from 'npm:date-fns';


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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const now = new Date();
    const alerts = [];

    // Fetch data - keep limits small to avoid CPU timeout
    const [memberships, checkins, transactions, offerRedemptions, existingAlerts] = await Promise.all([
      base44.asServiceRole.entities.Membership.list('-created_date', 200),
      base44.asServiceRole.entities.CheckIn.list('-timestamp', 200),
      base44.asServiceRole.entities.Transaction.list('-timestamp', 200),
      base44.asServiceRole.entities.OfferRedemption.list('-timestamp', 100),
      base44.asServiceRole.entities.MonitoringAlert.filter({ status: 'active' })
    ]);

    // === TECHNICAL MONITORING ===

    // Check for QR scan failures (no checkins in last 24 hours during expected times)
    const last24Hours = subHours(now, 24);
    const recentCheckins = checkins.filter(c => new Date(c.timestamp) >= last24Hours);
    
    if (recentCheckins.length === 0 && getSydneyTime(now).weekday !== 'Sun') { // Not Sunday (Sydney time)
      alerts.push({
        alert_type: 'technical',
        severity: 'high',
        title: 'No QR Check-ins Detected',
        description: 'Zero check-ins recorded in the last 24 hours. Possible QR code or scanning issue.',
        metric_value: '0 check-ins',
        threshold_value: '> 5 expected'
      });
    }

    // === FINANCIAL MONITORING ===

    // Check for membership drop
    const activeMemberships = memberships.filter(m => m.status === 'active');
    const last7Days = subDays(now, 7);
    const last14Days = subDays(now, 14);
    
    const thisWeekMemberships = memberships.filter(m => 
      new Date(m.created_date) >= last7Days && m.status === 'active'
    ).length;
    
    const lastWeekMemberships = memberships.filter(m => {
      const created = new Date(m.created_date);
      return created >= last14Days && created < last7Days && m.status === 'active';
    }).length;

    if (lastWeekMemberships > 0 && thisWeekMemberships < lastWeekMemberships * 0.5) {
      const dropPercent = ((lastWeekMemberships - thisWeekMemberships) / lastWeekMemberships * 100).toFixed(1);
      alerts.push({
        alert_type: 'financial',
        severity: 'critical',
        title: 'Membership Sign-ups Dropped',
        description: `New memberships down ${dropPercent}% this week vs last week.`,
        metric_value: `${thisWeekMemberships} new members`,
        threshold_value: `Expected ~${lastWeekMemberships}`
      });
    }

    // Check revenue anomaly (last 2 hours vs typical)
    const last2Hours = subHours(now, 2);
    const recentTransactions = transactions.filter(t => new Date(t.timestamp) >= last2Hours);
    const failedTransactions = recentTransactions.filter(t => 
      t.final_amount === 0 || t.description?.toLowerCase().includes('failed')
    );

    if (failedTransactions.length >= 10) {
      alerts.push({
        alert_type: 'financial',
        severity: 'critical',
        title: 'Payment Failures Detected',
        description: `${failedTransactions.length} failed transactions in the last 2 hours.`,
        metric_value: `${failedTransactions.length} failures`,
        threshold_value: '< 5 acceptable'
      });
    }

    // Check for revenue drop
    const thisWeekRevenue = transactions
      .filter(t => new Date(t.timestamp) >= last7Days)
      .reduce((sum, t) => sum + (t.final_amount || 0), 0);
    
    const lastWeekRevenue = transactions
      .filter(t => {
        const date = new Date(t.timestamp);
        return date >= last14Days && date < last7Days;
      })
      .reduce((sum, t) => sum + (t.final_amount || 0), 0);

    if (lastWeekRevenue > 0 && thisWeekRevenue < lastWeekRevenue * 0.7) {
      const dropPercent = ((lastWeekRevenue - thisWeekRevenue) / lastWeekRevenue * 100).toFixed(1);
      alerts.push({
        alert_type: 'financial',
        severity: 'high',
        title: 'Revenue Drop Detected',
        description: `Revenue down ${dropPercent}% this week vs last week.`,
        metric_value: `$${thisWeekRevenue.toFixed(2)}`,
        threshold_value: `Expected ~$${lastWeekRevenue.toFixed(2)}`
      });
    }

    // === ENGAGEMENT MONITORING ===

    // Check weekly active users (based on checkins)
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const lastWeekStart = subDays(thisWeekStart, 7);
    
    const thisWeekActive = new Set(
      checkins.filter(c => new Date(c.timestamp) >= thisWeekStart).map(c => c.user_id)
    ).size;
    
    const lastWeekActive = new Set(
      checkins.filter(c => {
        const date = new Date(c.timestamp);
        return date >= lastWeekStart && date < thisWeekStart;
      }).map(c => c.user_id)
    ).size;

    if (lastWeekActive > 0 && thisWeekActive < lastWeekActive * 0.82) { // 18% drop threshold
      const dropPercent = ((lastWeekActive - thisWeekActive) / lastWeekActive * 100).toFixed(1);
      alerts.push({
        alert_type: 'engagement',
        severity: 'high',
        title: 'Weekly Active Users Down',
        description: `Active users dropped ${dropPercent}% this week vs last week.`,
        metric_value: `${thisWeekActive} users`,
        threshold_value: `Expected ~${lastWeekActive}`
      });
    }

    // Check sponsor engagement
    const recentRedemptions = offerRedemptions.filter(r => new Date(r.timestamp) >= last7Days);
    
    if (recentRedemptions.length === 0 && offerRedemptions.length > 0) {
      alerts.push({
        alert_type: 'engagement',
        severity: 'medium',
        title: 'No Sponsor Engagement',
        description: 'Zero sponsor offer redemptions in the last 7 days.',
        metric_value: '0 redemptions',
        threshold_value: '> 0 expected'
      });
    }

    // Check match attendance drop
    const recentMatchCheckins = checkins.filter(c => 
      new Date(c.timestamp) >= last7Days && 
      (c.location?.toLowerCase().includes('gate') || c.location?.toLowerCase().includes('entry'))
    );

    const previousMatchCheckins = checkins.filter(c => {
      const date = new Date(c.timestamp);
      return date >= last14Days && date < last7Days &&
        (c.location?.toLowerCase().includes('gate') || c.location?.toLowerCase().includes('entry'));
    });

    if (previousMatchCheckins.length > 20 && recentMatchCheckins.length < previousMatchCheckins.length * 0.7) {
      const dropPercent = ((previousMatchCheckins.length - recentMatchCheckins.length) / previousMatchCheckins.length * 100).toFixed(1);
      alerts.push({
        alert_type: 'engagement',
        severity: 'medium',
        title: 'Match Attendance Declining',
        description: `Gate scans down ${dropPercent}% this week vs last week.`,
        metric_value: `${recentMatchCheckins.length} scans`,
        threshold_value: `Expected ~${previousMatchCheckins.length}`
      });
    }

    // Create new alert records (in parallel)
    const alertsToCreate = alerts.filter(alert =>
      !existingAlerts.some(ea => ea.title === alert.title && ea.status === 'active')
    );
    const newAlerts = await Promise.all(
      alertsToCreate.map(alert => base44.asServiceRole.entities.MonitoringAlert.create(alert))
    );

    // Send notifications for new critical/high alerts
    const criticalAlerts = newAlerts.filter(a => a.severity === 'critical' || a.severity === 'high');
    if (criticalAlerts.length > 0) {
      await base44.asServiceRole.functions.invoke('sendOperationsAlert', { alerts: criticalAlerts });
      await Promise.all(
        criticalAlerts.map(alert =>
          base44.asServiceRole.entities.MonitoringAlert.update(alert.id, { notified_admins: true })
        )
      );
    }

    return Response.json({ 
      success: true, 
      alertsDetected: alerts.length,
      newAlertsCreated: newAlerts.length,
      criticalAlerts: newAlerts.filter(a => a.severity === 'critical').length
    });

  } catch (error) {
    console.error('Monitoring error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});