import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Module 0 step 7b: Club record is the tenant source of truth; ClubSettings is legacy fallback.
async function resolveClub(sb, clubId) {
  let club = { club_name: 'Central Newcastle RLFC', short_name: 'Butcher Boys', club_short_name: 'Central Newcastle', team_short: 'Central', venue_name: 'St John Oval', sport_emoji: '🏉', app_url: '', contact_email: '' };
  try {
    let rec = null;
    if (clubId) {
      const byId = await sb.entities.Club.filter({ id: clubId });
      rec = byId && byId[0];
    }
    if (!rec) {
      const live = await sb.entities.Club.filter({ status: 'live', is_active: true });
      if (live && live.length === 1) rec = live[0];
    }
    if (rec) {
      return {
        ...club,
        club_name: rec.name || club.club_name,
        short_name: rec.short_name || club.short_name,
        club_short_name: rec.club_short_name || club.club_short_name,
        team_short: rec.team_short || club.team_short,
        venue_name: rec.venue_name || club.venue_name,
        sport_emoji: rec.sport_emoji || club.sport_emoji,
        app_url: rec.app_url || club.app_url,
        contact_email: rec.contact_email || club.contact_email
      };
    }
    const settings = await sb.entities.ClubSettings.filter({ is_active: true });
    if (settings && settings[0]) club = { ...club, ...settings[0] };
  } catch (_) { /* fall back to defaults */ }
  return club;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const club = await resolveClub(base44.asServiceRole, null);

    const { alerts } = await req.json();

    if (!alerts || alerts.length === 0) {
      return Response.json({ success: false, error: 'No alerts provided' });
    }

    // Get admin emails
    const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
    const adminEmails = admins.map(a => a.email).filter(Boolean);

    if (adminEmails.length === 0) {
      return Response.json({ success: false, error: 'No admin emails found' });
    }

    // Build email content
    const severityEmoji = {
      critical: '🔴',
      high: '⚠️',
      medium: '🟡',
      low: '🔵'
    };

    const alertsHTML = alerts.map(alert => `
      <div style="background: ${alert.severity === 'critical' ? '#fee' : alert.severity === 'high' ? '#fef3c7' : '#f0f9ff'}; 
                  padding: 15px; margin: 15px 0; border-radius: 8px; 
                  border-left: 4px solid ${alert.severity === 'critical' ? '#dc2626' : alert.severity === 'high' ? '#f59e0b' : '#3b82f6'};">
        <div style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">
          ${severityEmoji[alert.severity]} ${alert.title}
        </div>
        <div style="margin-bottom: 8px; color: #555;">
          ${alert.description}
        </div>
        <div style="display: flex; gap: 20px; font-size: 13px; color: #666;">
          <div><strong>Current:</strong> ${alert.metric_value}</div>
          <div><strong>Expected:</strong> ${alert.threshold_value}</div>
        </div>
      </div>
    `).join('');

    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>⚠️ Operations Alert</h1>
          <p>${club.club_name} Digital Platform</p>
        </div>
        <div style="padding: 20px;">
          <p><strong>${alerts.length} alert(s) detected</strong> that require your attention:</p>
          ${alertsHTML}
          <p style="margin-top: 30px; padding: 15px; background: #f3f4f6; border-radius: 8px;">
            <strong>Action Required:</strong> Review these alerts in the Admin Monitoring dashboard.
          </p>
        </div>
      </body>
      </html>
    `;

    // Send emails
    const emailPromises = adminEmails.map(email =>
      base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject: `⚠️ Operations Alert: ${alerts.length} issue(s) detected`,
        body: emailHTML
      })
    );

    await Promise.all(emailPromises);

    return Response.json({ 
      success: true, 
      alertsSent: alerts.length,
      recipientCount: adminEmails.length 
    });

  } catch (error) {
    console.error('Alert send error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});