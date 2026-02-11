import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();
    
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        Deno.env.get('STRIPE_WEBHOOK_SECRET')
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { user_id, tier_id, user_email, user_name } = session.metadata;

      // Initialize SDK with service role
      const base44 = createClientFromRequest(req);
      
      // Fetch the tier details
      const tier = await base44.asServiceRole.entities.MembershipTier.filter({ id: tier_id });
      
      if (!tier || tier.length === 0) {
        console.error('Tier not found:', tier_id);
        return Response.json({ error: 'Tier not found' }, { status: 400 });
      }

      const tierData = tier[0];
      
      // Calculate expiry date based on price_period
      const startDate = new Date();
      let expiryDate = new Date(startDate);
      
      if (tierData.price_period === 'year') {
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      } else if (tierData.price_period === 'season') {
        expiryDate.setMonth(expiryDate.getMonth() + 6);
      } else if (tierData.price_period === 'lifetime') {
        expiryDate.setFullYear(expiryDate.getFullYear() + 100);
      }

      // Create membership
      const membership = await base44.asServiceRole.entities.Membership.create({
        user_id: user_id,
        user_email: user_email,
        user_name: user_name,
        tier_id: tier_id,
        tier_name: tierData.name,
        start_date: startDate.toISOString().split('T')[0],
        expiry_date: expiryDate.toISOString().split('T')[0],
        status: 'active',
        qr_code_id: `M${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
        payment_id: session.payment_intent,
        stamps: 0,
        total_checkins: 0
      });

      console.log('Membership created:', membership.id);
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});