import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { session_id } = await req.json();

    if (!session_id) {
      return Response.json({ error: 'Missing session_id' }, { status: 400 });
    }

    // Verify the session with Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== 'paid') {
      return Response.json({ error: 'Payment not completed' }, { status: 402 });
    }

    const { user_id, fixture_id, product_type } = session.metadata;

    // Make sure this session belongs to the current user
    if (user_id !== user.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (product_type !== 'day_pass') {
      return Response.json({ error: 'Not a day pass session' }, { status: 400 });
    }

    // Check if a pass was already created for this session (idempotency)
    const existing = await base44.asServiceRole.entities.GameDayEntry.filter({
      payment_reference: session.payment_intent
    });

    if (existing && existing.length > 0) {
      console.log('Pass already exists for session:', session_id);
      return Response.json({ pass: existing[0] });
    }

    // Get fixture details
    let eventTitle = 'Home Game';
    if (fixture_id && fixture_id !== 'general') {
      const fixtures = await base44.asServiceRole.entities.Fixture.filter({ id: fixture_id });
      if (fixtures && fixtures[0]) {
        eventTitle = `vs ${fixtures[0].opponent}`;
      }
    }

    // Create the GameDayEntry
    const qrCode = `DP${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    const nameParts = (user.full_name || '').split(' ');

    const pass = await base44.asServiceRole.entities.GameDayEntry.create({
      first_name: nameParts[0] || '',
      last_name: nameParts.slice(1).join(' ') || '',
      email: user.email,
      mobile: '',
      postcode: '',
      event_id: fixture_id || 'general',
      event_title: eventTitle,
      entry_timestamp: new Date().toISOString(),
      payment_reference: session.payment_intent,
      payment_amount: 8,
      pass_qr_code: qrCode,
      status: 'valid',
      user_id: user.id
    });

    console.log('Day Pass created via verify:', qrCode, '| User:', user.email);
    return Response.json({ pass });

  } catch (error) {
    console.error('verifyDayPassPayment error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});