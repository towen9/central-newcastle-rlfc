import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe';

const TICKET_PRICE = 90;
const EVENT_NAME = 'Ladies Long Lunch — Old Butchers Day 2026';
const EVENT_DATE = 'Saturday 1 August 2026';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Must be authenticated — any logged-in user can purchase
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ success: false, error: 'Unauthorised' }, { status: 401 });
    }

    const { stripe_payment_id: raw_payment_id, purchaser_name, purchaser_email, ticket_price } = await req.json();

    if (!raw_payment_id || !purchaser_name || !purchaser_email) {
      return Response.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    // Retrieve the checkout session to verify payment
    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(raw_payment_id);
    } catch (stripeErr) {
      console.error('createEventTicket: Stripe session retrieve error:', stripeErr.message);
      return Response.json({ success: false, error: 'Could not verify payment with Stripe' }, { status: 400 });
    }

    if (session.payment_status !== 'paid') {
      console.error('createEventTicket: session not paid, status:', session.payment_status);
      return Response.json({ success: false, error: 'Payment not confirmed' }, { status: 400 });
    }

    const stripe_payment_id = session.payment_intent || raw_payment_id;

    // Prevent duplicate tickets for same payment
    const existing = await base44.asServiceRole.entities.EventTicket.filter({ stripe_payment_id });
    if (existing && existing.length > 0) {
      console.log('createEventTicket: duplicate prevented for payment', stripe_payment_id);
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

    await base44.asServiceRole.entities.EventTicket.create({
      ticket_id,
      event_name: EVENT_NAME,
      event_date: EVENT_DATE,
      purchaser_name,
      purchaser_email,
      membership_id: membership_id || null,
      stripe_payment_id,
      ticket_price: ticket_price ? ticket_price / 100 : TICKET_PRICE,
      status: 'active',
      created_at: new Date().toISOString()
    });

    console.log('createEventTicket: ticket created', ticket_id, 'for', purchaser_email);

    // Send confirmation email
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: purchaser_email,
        subject: '🎉 Your Ladies Long Lunch Ticket — 1 August 2026',
        body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
  <div style="background: #1a365d; padding: 32px 24px; text-align: center;">
    <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6966ba172da6c09d1e1650bd/6b3832f4a_Butcherboyslogo.jpg" alt="Central Newcastle RLFC" style="width: 72px; height: 72px; border-radius: 50%; border: 3px solid white; object-fit: contain; background: white;" />
    <h1 style="color: white; margin: 16px 0 4px; font-size: 24px;">You're in! 🎉</h1>
    <p style="color: #93c5fd; margin: 0; font-size: 14px;">Ladies Long Lunch — Old Butchers Day 2026</p>
  </div>
  <div style="padding: 32px 24px; background: white;">
    <p style="color: #1e293b; font-size: 16px;">Hi ${purchaser_name.split(' ')[0]},</p>
    <p style="color: #475569; font-size: 15px; line-height: 1.6;">Your ticket for the <strong>Ladies Long Lunch</strong> on <strong>Saturday 1 August 2026</strong> at St John Oval is confirmed!</p>
    <div style="background: #eff6ff; border-left: 4px solid #1a365d; border-radius: 8px; padding: 16px 20px; margin: 24px 0;">
      <p style="color: #1e3a5f; font-weight: bold; font-size: 15px; margin: 0 0 8px;">📱 Your QR ticket</p>
      <p style="color: #475569; font-size: 14px; margin: 0;">Open the app on the day and navigate to <strong>Ladies Long Lunch</strong> to display your QR code at the entry.</p>
      <p style="color: #475569; font-size: 14px; margin: 8px 0 0;">Ticket ID: <strong style="font-family: monospace;">${ticket_id.substring(0, 8).toUpperCase()}</strong></p>
    </div>
    <p style="color: #94a3b8; font-size: 13px;">Questions? Contact the club directly.</p>
  </div>
  <div style="background: #1a365d; padding: 16px 24px; text-align: center;">
    <p style="color: #93c5fd; font-size: 12px; margin: 0;">Central Newcastle RLFC · Butcher Boys · Old Butchers Day 2026</p>
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
    console.error('createEventTicket error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});