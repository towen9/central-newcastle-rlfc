import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    const tiersToUpdate = [
      { id: '69a4f39795644d6d6ac9a708', name: 'Family Membership',    newAmount: 6000 },
      { id: '69a4f39795644d6d6ac9a709', name: 'Premium Membership',   newAmount: 7500 },
      { id: '69a8bbdabdd53df7ad8fc78f', name: 'Old Butchers Membership', newAmount: 5000 },
    ];

    const results = [];

    for (const tier of tiersToUpdate) {
      console.log(`Processing: ${tier.name}`);

      // 1. Read existing tier record
      const tiers = await base44.asServiceRole.entities.MembershipTier.filter({ id: tier.id });
      const tierRecord = tiers[0];
      if (!tierRecord) {
        results.push({ name: tier.name, error: 'Tier record not found' });
        continue;
      }

      const oldPriceId = tierRecord.stripe_price_id;
      if (!oldPriceId) {
        results.push({ name: tier.name, error: 'No existing stripe_price_id on tier' });
        continue;
      }

      // 2. Retrieve the old price from Stripe
      const oldPrice = await stripe.prices.retrieve(oldPriceId);
      console.log(`Old price for ${tier.name}: ${oldPriceId}, product: ${oldPrice.product}, currency: ${oldPrice.currency}, type: ${oldPrice.type}`);

      // 3. Create new price on same product
      const newPriceParams = {
        product: oldPrice.product,
        unit_amount: tier.newAmount,
        currency: oldPrice.currency,
      };

      if (oldPrice.type === 'recurring' && oldPrice.recurring) {
        newPriceParams.recurring = {
          interval: oldPrice.recurring.interval,
          interval_count: oldPrice.recurring.interval_count,
        };
      }

      const newPrice = await stripe.prices.create(newPriceParams);
      console.log(`Created new price for ${tier.name}: ${newPrice.id}`);

      // 4. Update the MembershipTier record
      await base44.asServiceRole.entities.MembershipTier.update(tier.id, {
        stripe_price_id: newPrice.id,
      });
      console.log(`Updated tier ${tier.name} stripe_price_id to ${newPrice.id}`);

      // 5. Archive the old price
      await stripe.prices.update(oldPriceId, { active: false });
      console.log(`Archived old price ${oldPriceId}`);

      results.push({
        name: tier.name,
        old_stripe_price_id: oldPriceId,
        new_stripe_price_id: newPrice.id,
        new_amount_cents: tier.newAmount,
        new_amount_display: `AUD $${(tier.newAmount / 100).toFixed(2)}`,
        old_price_archived: true,
      });
    }

    return Response.json({ success: true, results });
  } catch (error) {
    console.error('updateTierPrices error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});