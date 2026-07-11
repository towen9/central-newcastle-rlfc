import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const EVENT_NAME = 'Ladies Long Lunch — Old Butchers Day 2026';
const EVENT_DATE = 'Saturday 1 August 2026';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ success: false, error: 'Unauthorised' }, { status: 401 });
    }

    let club = { club_name: 'Central Newcastle RLFC', short_name: 'Butcher Boys', club_short_name: 'Central Newcastle', team_short: 'Central', venue_name: 'St John Oval', sport_emoji: '🏉', app_url: '' };
    try {
      const settings = await base44.asServiceRole.entities.ClubSettings.filter({ is_active: true });
      if (settings && settings[0]) club = { ...club, ...settings[0] };
    } catch (_) { /* fall back to defaults */ }

    let body;
    try {
      body = await req.json();
    } catch (parseErr) {
      console.error('createEventTicket: failed to parse request body:', parseErr.message);
      return Response.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }

    const { stripe_payment_id, purchaser_name, purchaser_email, ticket_price, membership_id } = body;

    console.log('createEventTicket: received', { stripe_payment_id, purchaser_name, purchaser_email, ticket_price });

    if (!stripe_payment_id) {
      return Response.json({ success: false, error: 'Missing stripe_payment_id' }, { status: 400 });
    }
    if (!purchaser_name) {
      return Response.json({ success: false, error: 'Missing purchaser_name' }, { status: 400 });
    }
    if (!purchaser_email) {
      return Response.json({ success: false, error: 'Missing purchaser_email' }, { status: 400 });
    }

    // Prevent duplicate tickets for same payment
    let existing;
    try {
      existing = await base44.asServiceRole.entities.EventTicket.filter({ stripe_payment_id });
    } catch (dupErr) {
      console.error('createEventTicket: duplicate check failed:', dupErr.message);
      return Response.json({ success: false, error: `Duplicate check failed: ${dupErr.message}` }, { status: 500 });
    }

    if (existing && existing.length > 0) {
      console.log('createEventTicket: returning existing ticket for', stripe_payment_id);
      const dup = existing[0];
      return Response.json({
        success: true,
        ticket_id: dup.ticket_id,
        purchaser_name: dup.purchaser_name,
        event_name: dup.event_name,
        event_date: dup.event_date
      });
    }

    // Generate unique ticket ID
    const ticket_id = crypto.randomUUID();
    const ticket_price_dollars = ticket_price ? ticket_price / 100 : 90;

    try {
      await base44.asServiceRole.entities.EventTicket.create({
        ticket_id,
        event_name: EVENT_NAME,
        event_date: EVENT_DATE,
        purchaser_name,
        purchaser_email,
        membership_id: membership_id || null,
        stripe_payment_id,
        ticket_price: ticket_price_dollars,
        status: 'active',
        created_at: new Date().toISOString(),
        ...(club.club_id && { club_id: club.club_id })
      });
    } catch (createErr) {
      console.error('createEventTicket: entity create failed:', createErr.message);
      return Response.json({ success: false, error: `Ticket creation failed: ${createErr.message}` }, { status: 500 });
    }

    console.log('createEventTicket: ticket created', ticket_id, 'for', purchaser_email);

    // Send confirmation email (non-fatal)
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: purchaser_email,
        subject: '🎉 Your Ladies Long Lunch Ticket — 1 August 2026',
        body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
  <div style="background: #1a365d; padding: 32px 24px; text-align: center;">
    <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6966ba172da6c09d1e1650bd/6b3832f4a_Butcherboyslogo.jpg" alt="${club.club_name}" style="width: 72px; height: 72px; border-radius: 50%; border: 3px solid white; object-fit: contain; background: white;" />
    <h1 style="color: white; margin: 16px 0 4px; font-size: 24px;">You're in! 🎉</h1>
    <p style="color: #93c5fd; margin: 0; font-size: 14px;">Ladies Long Lunch — Old Butchers Day 2026</p>
  </div>
  <div style="padding: 32px 24px; background: white;">
    <p style="color: #1e293b; font-size: 16px;">Hi ${purchaser_name.split(' ')[0]},</p>
    <p style="color: #475569; font-size: 15px; line-height: 1.6;">Your ticket for the <strong>Ladies Long Lunch</strong> on <strong>Saturday 1 August 2026</strong> at ${club.venue_name} is confirmed!</p>
    <div style="background: #eff6ff; border-left: 4px solid #1a365d; border-radius: 8px; padding: 16px 20px; margin: 24px 0;">
      <p style="color: #1e3a5f; font-weight: bold; font-size: 15px; margin: 0 0 8px;">📱 Your QR ticket</p>
      <p style="color: #475569; font-size: 14px; margin: 0;">Open the app on the day and navigate to <strong>Ladies Long Lunch</strong> to display your QR code at the entry.</p>
      <p style="color: #475569; font-size: 14px; margin: 8px 0 0;">Ticket ID: <strong style="font-family: monospace;">${ticket_id.substring(0, 8).toUpperCase()}</strong></p>
    </div>
    <p style="color: #94a3b8; font-size: 13px;">Questions? Contact the club directly.</p>
  </div>
  <div style="background: #1a365d; padding: 16px 24px; text-align: center;">
    <p style="color: #93c5fd; font-size: 12px; margin: 0;">${club.club_name} · ${club.short_name} · Old Butchers Day 2026</p>
  </div>
</div>`
      });
    } catch (emailErr) {
      console.error('createEventTicket: email send failed (non-fatal):', emailErr.message);
    }

    return Response.json({
      success: true,
      ticket_id,
      purchaser_name,
      event_name: EVENT_NAME,
      event_date: EVENT_DATE
    });

  } catch (error) {
    console.error('createEventTicket: unhandled error:', error.message, error.stack);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});