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

    // Best-effort: create/update a "Day Pass" tier Membership for comms reach.
    // Failure here must NOT block the payment success response.
    try {
      const existingMemberships = await base44.asServiceRole.entities.Membership.filter({ user_id: user.id });

      const PAID_TIERS = ['Premium Membership', 'Family Membership', 'Supporter Pack', 'Old Butchers Membership', 'Sponsor Season Pass'];
      const PAID_TIER_TYPES = ['premium', 'family', 'supporter', 'legacy', 'sponsor'];
      const hasPaidMembership = existingMemberships.some(m =>
        m.tier_type ? PAID_TIER_TYPES.includes(m.tier_type) : PAID_TIERS.some(tier => m.tier_name?.includes(tier))
      );

      if (hasPaidMembership) {
        // Paid tier already exists — don't touch it
        console.log('Day Pass comms: user has paid membership, skipping Day Pass tier creation');
      } else {
        const existingDayPass = existingMemberships.find(m => m.tier_type === 'day_pass' || m.tier_name === 'Day Pass');
        if (existingDayPass) {
          // Already has a Day Pass membership — just bump updated_date, preserve push fields
          await base44.asServiceRole.entities.Membership.update(existingDayPass.id, {
            status: 'active'
          });
          console.log('Day Pass comms: updated existing Day Pass membership', existingDayPass.id);
        } else {
          // No membership at all — create a new Day Pass one
          // Resolve the real Day Pass tier record; fall back to legacy string if lookup fails (non-fatal path)
          let dayPassTierId = 'day_pass';
          try {
            const dpTiers = await base44.asServiceRole.entities.MembershipTier.filter({ tier_type: 'day_pass' });
            if (dpTiers && dpTiers[0]) dayPassTierId = dpTiers[0].id;
          } catch (_) { /* keep string fallback */ }
          const nameParts2 = (user.full_name || '').split(' ');
          await base44.asServiceRole.entities.Membership.create({
            user_id: user.id,
            user_email: user.email,
            user_name: user.full_name || user.email,
            tier_id: dayPassTierId,
            tier_name: 'Day Pass',
            tier_type: 'day_pass',
            status: 'active',
            push_enabled: false,
            push_subscription: null,
            start_date: new Date().toISOString().split('T')[0],
            stamps: 0,
            points: 0,
            total_checkins: 0,
            games_used: 0
          });
          console.log('Day Pass comms: created new Day Pass membership for', user.email);
        }
      }
    } catch (membershipErr) {
      console.error('Day Pass comms: Membership create/update failed (non-fatal):', membershipErr.message);
    }

    return Response.json({ pass });

  } catch (error) {
    console.error('verifyDayPassPayment error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});