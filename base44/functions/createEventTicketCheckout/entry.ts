import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe';

// Live price ID for Ladies Long Lunch ticket ($55 AUD)
const EVENT_TICKET_PRICE_ID = 'price_1TjqWvLsW4v58VGV1gMsa1hN';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const { success_url, cancel_url, purchaser_name, purchaser_email, membership_id } = await req.json();

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: EVENT_TICKET_PRICE_ID, quantity: 1 }],
      mode: 'payment',
      success_url,
      cancel_url,
      customer_email: purchaser_email || user.email,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        user_id: user.id,
        purchaser_name,
        purchaser_email: purchaser_email || user.email,
        membership_id: membership_id || '',
        product_type: 'event_ticket'
      }
    });

    return Response.json({ checkout_url: session.url, session_id: session.id });
  } catch (error) {
    console.error('createEventTicketCheckout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});