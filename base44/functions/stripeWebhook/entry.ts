import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
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

    const base44 = createClientFromRequest(req);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { user_id, tier_id, user_email, user_name, product_type, fixture_id, referral_code } = session.metadata;

      // Handle Day Pass purchases
      if (product_type === 'day_pass') {
        const qrCode = `DP${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
        await base44.asServiceRole.entities.GameDayEntry.create({
          first_name: user_name?.split(' ')[0] || '',
          last_name: user_name?.split(' ').slice(1).join(' ') || '',
          email: user_email,
          mobile: '',
          postcode: '',
          event_id: fixture_id || 'general',
          event_title: 'Day Pass',
          entry_timestamp: new Date().toISOString(),
          payment_reference: session.payment_intent,
          payment_amount: 8,
          pass_qr_code: qrCode,
          status: 'valid',
          user_id: user_id
        });
        console.log('Day Pass created:', qrCode, '| User:', user_email);
        return Response.json({ received: true });
      }

      // Fetch the tier details
      const tier = await base44.asServiceRole.entities.MembershipTier.filter({ id: tier_id });
      
      if (!tier || tier.length === 0) {
        console.error('Tier not found:', tier_id);
        return Response.json({ error: 'Tier not found' }, { status: 400 });
      }

      const tierData = tier[0];
      
      // Calculate expiry date
      const startDate = new Date();
      let expiryDate = new Date(startDate);
      
      if (tierData.price_period === 'year') {
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      } else if (tierData.price_period === 'season') {
        expiryDate.setMonth(expiryDate.getMonth() + 6);
      } else if (tierData.price_period === 'lifetime') {
        expiryDate.setFullYear(expiryDate.getFullYear() + 100);
      }

      const isSupporter = tierData.name === 'Supporter Pack';
      const gamesIncluded = tierData.games_included || 0;

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
        points: 0,
        total_checkins: 0,
        games_used: 0,
        ...(isSupporter && { games_remaining: gamesIncluded || 5 })
      });

      console.log('Membership created:', membership.id, '| Tier:', tierData.name);

      // Handle referral tracking (only for season memberships, not day passes)
      if (referral_code) {
        try {
          // Find the referrer by matching their referral code pattern (REF-{first8ofQR})
          const allMemberships = await base44.asServiceRole.entities.Membership.filter({ status: 'active' });
          const referrer = allMemberships.find(m => {
            const code = m.qr_code_id ? `REF-${m.qr_code_id.substring(0, 8).toUpperCase()}` : null;
            return code === referral_code;
          });

          if (referrer && referrer.user_id !== user_id) {
            await base44.asServiceRole.entities.Referral.create({
              referrer_user_id: referrer.user_id,
              referrer_name: referrer.user_name,
              referrer_email: referrer.user_email,
              referrer_membership_id: referrer.id,
              referred_user_id: user_id,
              referred_name: user_name,
              referred_email: user_email,
              referred_membership_id: membership.id,
              referred_tier_name: tierData.name,
              referral_code: referral_code,
              status: 'converted',
              converted_at: new Date().toISOString()
            });
            console.log('Referral recorded:', referral_code, '| Referrer:', referrer.user_name);
          }
        } catch (refError) {
          console.error('Failed to record referral (non-fatal):', refError.message);
        }
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});