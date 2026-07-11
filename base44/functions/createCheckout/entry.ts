import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tier_id, price_id, success_url, cancel_url, referral_code } = await req.json();

    // Resolve tenant club_id from ClubSettings singleton (Module 0 multi-tenancy)
    let clubId = null;
    try {
      const settings = await base44.entities.ClubSettings.filter({ is_active: true });
      if (settings && settings[0]?.club_id) clubId = settings[0].club_id;
    } catch (_) { /* non-fatal */ }

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