import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    let club = { club_name: 'Central Newcastle RLFC', short_name: 'Butcher Boys', club_short_name: 'Central Newcastle', team_short: 'Central', venue_name: 'St John Oval', sport_emoji: '🏉', app_url: 'https://butcher-boy-c0b7e412.base44.app' };
    try {
      const settings = await base44.asServiceRole.entities.ClubSettings.filter({ is_active: true });
      if (settings && settings[0]) club = { ...club, ...settings[0] };
    } catch (_) { /* fall back to defaults */ }

    const { membership_id } = await req.json();

    if (!membership_id) {
      return Response.json({ error: 'membership_id is required' }, { status: 400 });
    }

    const membership = await base44.asServiceRole.entities.Membership.get(membership_id);
    if (!membership) {
      return Response.json({ error: 'Membership not found' }, { status: 404 });
    }

    // Guard: only send if Sponsor Season Pass and active
    if (membership.tier_name !== 'Sponsor Season Pass' || membership.status !== 'active') {
      console.log(`Skipping: membership ${membership_id} is tier=${membership.tier_name} status=${membership.status}`);
      return Response.json({ skipped: true, reason: 'membership not eligible' });
    }

    // Guard: dedup — only send once
    if (membership.approval_email_sent_at) {
      console.log(`Skipping: approval email already sent at ${membership.approval_email_sent_at} for membership ${membership_id}`);
      return Response.json({ skipped: true, reason: 'approval email already sent' });
    }

    const toEmail = membership.user_email;
    const toName = membership.user_name || 'Sponsor';

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: toEmail,
      from_name: club.club_name,
      subject: '🎉 Your Sponsor Season Pass Has Been Approved!',
      body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
  <div style="background: linear-gradient(135deg, #065f46, #059669); border-radius: 12px; padding: 32px; text-align: center; margin-bottom: 24px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">${club.club_name}</h1>
    <p style="color: #a7f3d0; margin: 8px 0 0; font-size: 14px;">Sponsor Season Pass</p>
  </div>

  <p style="font-size: 16px; line-height: 1.6;">Hi ${toName},</p>

  <p style="font-size: 16px; line-height: 1.6;">
    Great news — your <strong>Sponsor Season Pass</strong> application has been approved by the club! 🎉
  </p>

  <p style="font-size: 16px; line-height: 1.6;">
    We're absolutely stoked to have you on board as a sponsor of ${club.club_name}. Your support means the world to the players, coaches, and everyone in our club community.
  </p>

  <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
    <p style="margin: 0 0 12px; font-size: 15px; color: #065f46; font-weight: bold;">Access your membership pass here:</p>
    <a href="${club.app_url}" style="display: inline-block; background: #059669; color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; font-size: 15px;">Open My Membership →</a>
  </div>

  <p style="font-size: 15px; line-height: 1.6; color: #374151;">
    From your membership app you can view your digital pass, check in at games, and access all your sponsor benefits.
  </p>

  <p style="font-size: 15px; line-height: 1.6; color: #374151;">
    See you at the footy! 💙
  </p>

  <p style="font-size: 15px; color: #374151;">
    Cheers,<br/>
    <strong>${club.club_name}</strong>
  </p>

  <div style="border-top: 1px solid #e5e7eb; margin-top: 32px; padding-top: 16px; text-align: center;">
    <p style="font-size: 12px; color: #9ca3af;">${club.club_name} — ${club.short_name}</p>
  </div>
</div>
      `.trim()
    });

    // Mark as sent — dedup guard for future triggers
    await base44.asServiceRole.entities.Membership.update(membership_id, {
      approval_email_sent_at: new Date().toISOString()
    });

    console.log(`Sponsor approval email sent to ${toEmail} for membership ${membership_id}`);
    return Response.json({ success: true, sent_to: toEmail });
  } catch (error) {
    console.error('Sponsor approval email error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});