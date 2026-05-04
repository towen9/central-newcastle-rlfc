import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { membership_id } = await req.json();

    const membership = await base44.asServiceRole.entities.Membership.get(membership_id);
    if (!membership) {
      return Response.json({ error: 'Membership not found' }, { status: 404 });
    }

    const toEmail = membership.user_email;
    const toName = membership.user_name || 'Sponsor';

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: toEmail,
      from_name: 'Central Newcastle RLFC',
      subject: '🎉 Your Sponsor Season Pass Has Been Approved!',
      body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1a1a1a;">
  <div style="background: linear-gradient(135deg, #065f46, #059669); border-radius: 12px; padding: 32px; text-align: center; margin-bottom: 24px;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Central Newcastle RLFC</h1>
    <p style="color: #a7f3d0; margin: 8px 0 0; font-size: 14px;">Sponsor Season Pass</p>
  </div>

  <p style="font-size: 16px; line-height: 1.6;">Hi ${toName},</p>

  <p style="font-size: 16px; line-height: 1.6;">
    Great news — your <strong>Sponsor Season Pass</strong> application has been approved by the club! 🎉
  </p>

  <p style="font-size: 16px; line-height: 1.6;">
    We're absolutely stoked to have you on board as a sponsor of Central Newcastle RLFC. Your support means the world to the players, coaches, and everyone in our club community.
  </p>

  <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
    <p style="margin: 0 0 12px; font-size: 15px; color: #065f46; font-weight: bold;">Access your membership pass here:</p>
    <a href="https://butcher-boy-c0b7e412.base44.app" style="display: inline-block; background: #059669; color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; font-size: 15px;">Open My Membership →</a>
  </div>

  <p style="font-size: 15px; line-height: 1.6; color: #374151;">
    From your membership app you can view your digital pass, check in at games, and access all your sponsor benefits.
  </p>

  <p style="font-size: 15px; line-height: 1.6; color: #374151;">
    See you at the footy! 💙
  </p>

  <p style="font-size: 15px; color: #374151;">
    Cheers,<br/>
    <strong>Central Newcastle RLFC</strong>
  </p>

  <div style="border-top: 1px solid #e5e7eb; margin-top: 32px; padding-top: 16px; text-align: center;">
    <p style="font-size: 12px; color: #9ca3af;">Central Newcastle RLFC — Butcher Boys</p>
  </div>
</div>
      `.trim()
    });

    console.log(`Sponsor approval email sent to ${toEmail} for membership ${membership_id}`);
    return Response.json({ success: true });
  } catch (error) {
    console.error('Sponsor approval email error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});