import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fixture_id, success_url, cancel_url } = await req.json();

    // Get fixture details
    const fixtures = await base44.entities.Fixture.filter({ id: fixture_id });
    const fixture = fixtures[0];

    if (!fixture) {
      return Response.json({ error: 'Fixture not found' }, { status: 404 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: 'price_1SzmZiLgCWdDbHyl1uWi28OK', // Day Pass price
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
        fixture_id: fixture_id,
        product_type: 'day_pass'
      }
    });

    return Response.json({ checkout_url: session.url });
  } catch (error) {
    console.error('Day Pass checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});