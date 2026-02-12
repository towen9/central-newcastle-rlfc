import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Generate the report
    const reportResponse = await base44.asServiceRole.functions.invoke('generateWeeklyReport', {});
    
    if (!reportResponse.data.success) {
      throw new Error('Failed to generate report');
    }

    const { report } = reportResponse.data;

    // Format email HTML
    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; }
          .header { background: #1a365d; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .metric { background: white; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #1a365d; }
          .metric-title { font-size: 12px; color: #666; text-transform: uppercase; }
          .metric-value { font-size: 24px; font-weight: bold; color: #1a365d; }
          .metric-change { font-size: 14px; color: #666; margin-top: 5px; }
          .positive { color: #22c55e; }
          .negative { color: #ef4444; }
          .insights { background: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 8px; }
          .insight-item { margin: 5px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Central Digital Performance</h1>
          <p>Week ${report.week} – ${report.periodStart} to ${report.periodEnd}</p>
        </div>
        <div class="content">
          <div class="metric">
            <div class="metric-title">Total Members</div>
            <div class="metric-value">${report.metrics.totalMembers}</div>
            <div class="metric-change">Paid: ${report.metrics.paidMembers}</div>
          </div>
          
          <div class="metric">
            <div class="metric-title">Revenue Generated</div>
            <div class="metric-value">$${report.metrics.revenue}</div>
            <div class="metric-change ${report.metrics.revenueChange >= 0 ? 'positive' : 'negative'}">
              ${report.metrics.revenueChange >= 0 ? '+' : ''}${report.metrics.revenueChange}% vs last week
            </div>
          </div>
          
          <div class="metric">
            <div class="metric-title">Game Attendance (QR Scans)</div>
            <div class="metric-value">${report.metrics.gameAttendance}</div>
            <div class="metric-change ${report.metrics.attendanceChange >= 0 ? 'positive' : 'negative'}">
              ${report.metrics.attendanceChange >= 0 ? '+' : ''}${report.metrics.attendanceChange}% vs last week
            </div>
          </div>
          
          <div class="metric">
            <div class="metric-title">Top Sponsor</div>
            <div class="metric-value" style="font-size: 18px;">${report.metrics.topSponsor.name}</div>
            <div class="metric-change">${report.metrics.topSponsor.clicks} offer redemptions</div>
          </div>
          
          <div class="metric">
            <div class="metric-title">Peak Engagement Time</div>
            <div class="metric-value" style="font-size: 18px;">${report.metrics.peakTime}</div>
          </div>
          
          ${report.insights.length > 0 ? `
          <div class="insights">
            <strong>📊 Key Insights:</strong>
            ${report.insights.map(i => `<div class="insight-item">• ${i}</div>`).join('')}
          </div>
          ` : ''}
        </div>
      </body>
      </html>
    `;

    // Get admin email
    const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
    const adminEmails = admins.map(a => a.email).filter(Boolean);

    if (adminEmails.length === 0) {
      return Response.json({ success: false, error: 'No admin emails found' });
    }

    // Send email to all admins
    const emailPromises = adminEmails.map(email => 
      base44.asServiceRole.integrations.Core.SendEmail({
        to: email,
        subject: `Central Digital Performance – Week ${report.week}`,
        body: emailHTML
      })
    );

    await Promise.all(emailPromises);

    return Response.json({ 
      success: true, 
      report,
      emailsSent: adminEmails.length 
    });

  } catch (error) {
    console.error('Email report error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});