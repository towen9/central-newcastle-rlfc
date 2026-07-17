import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tier_id, price_id, success_url, cancel_url, referral_code, club_id: bodyClubId } = await req.json();

    // Module 0 step 7c: resolve tenant club — explicit request club_id → caller's club_id → ClubSettings legacy fallback
    let clubId = bodyClubId || user.club_id || null;
    let club = null;
    try {
      if (clubId) {
        const clubs = await base44.asServiceRole.entities.Club.filter({ id: clubId });
        club = clubs[0] || null;
        if (!club) clubId = null;
      }
      if (!club) {
        const settings = await base44.entities.ClubSettings.filter({ is_active: true });
        if (settings && settings[0]?.club_id) {
          clubId = settings[0].club_id;
          const clubs = await base44.asServiceRole.entities.Club.filter({ id: clubId });
          club = clubs[0] || null;
        }
      }
    } catch (_) { /* non-fatal */ }

    // Per-club Stripe credentials via secret ref; hard fallback to the platform default key
    const stripe = new Stripe(Deno.env.get(club?.stripe_secret_key_ref || 'STRIPE_SECRET_KEY') || Deno.env.get('STRIPE_SECRET_KEY'));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: price_id,
        quantity: 1,
      }],
      mode: 'payment',
      success_url: success_url,
      cancel_url: cancel_url,
      customer_email: user.email,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        user_id: user.id,
        user_email: user.email,
        user_name: user.full_name,
        tier_id: tier_id,
        product_type: 'membership',
        club_id: clubId || '',
        ...(referral_code && { referral_code })
      }
    });

    return Response.json({ checkout_url: session.url });
  } catch (error) {
    console.error('Checkout creation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});