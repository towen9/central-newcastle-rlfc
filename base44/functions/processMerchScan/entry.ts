import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const DISCOUNT_TIERS = ['Premium Membership', 'Old Butchers', 'Sponsor Season Pass'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.role !== 'canteen_staff' && user.role !== 'gate_staff')) {
      return Response.json({ type: 'error', message: 'Unauthorised' }, { status: 403 });
    }

    const body = await req.json();
    const { qrCode, purchaseAmount, applyDiscount } = body;

    if (!qrCode) return Response.json({ type: 'error', message: 'No QR code provided' }, { status: 400 });

    // --- LOOKUP PHASE (no purchaseAmount) ---
    if (purchaseAmount === undefined) {
      const memberships = await base44.asServiceRole.entities.Membership.filter({ qr_code_id: qrCode, status: 'active' });
      if (!memberships || memberships.length === 0) {
        return Response.json({ type: 'error', message: 'Invalid or inactive membership QR code' });
      }
      const m = memberships[0];

      // Load tier for discount %
      const tiers = await base44.asServiceRole.entities.MembershipTier.filter({ name: m.tier_name });
      const tier = tiers[0] || null;
      const discountPct = tier?.merchandise_discount || 0;

      // Tiers that get no discount at all
      const hasDiscount = discountPct > 0 && DISCOUNT_TIERS.some(t => m.tier_name?.includes(t.split(' ')[0]));

      if (!hasDiscount && discountPct === 0) {
        return Response.json({
          type: 'no_discount',
          memberName: m.user_name,
          tierName: m.tier_name,
          message: `${m.tier_name} members do not receive a merchandise discount.`
        });
      }

      // Check if discount used this season
      const seasonStart = m.start_date ? new Date(m.start_date) : new Date(new Date().getFullYear(), 0, 1);
      const transactions = await base44.asServiceRole.entities.Transaction.filter({
        membership_id: m.id,
        transaction_type: 'merchandise'
      });
      const discountUsed = transactions.some(t => t.discount_amount > 0 && new Date(t.timestamp) >= seasonStart);

      return Response.json({
        type: 'member_found',
        memberId: m.id,
        memberName: m.user_name,
        tierName: m.tier_name,
        discountPct,
        discountUsed,
        points: m.points || 0
      });
    }

    // --- PROCESS PHASE (purchaseAmount provided) ---
    // Re-fetch membership by id (qrCode is now the membership id)
    const memberships = await base44.asServiceRole.entities.Membership.filter({ id: qrCode, status: 'active' });
    if (!memberships || memberships.length === 0) {
      return Response.json({ type: 'error', message: 'Membership not found' });
    }
    const m = memberships[0];

    const tiers = await base44.asServiceRole.entities.MembershipTier.filter({ name: m.tier_name });
    const tier = tiers[0] || null;
    const discountPct = tier?.merchandise_discount || 0;

    // Server-side guard: prevent second discounted transaction even if UI is bypassed
    if (applyDiscount) {
      const seasonStart = m.start_date ? new Date(m.start_date) : new Date(new Date().getFullYear(), 0, 1);
      const transactions = await base44.asServiceRole.entities.Transaction.filter({
        membership_id: m.id,
        transaction_type: 'merchandise'
      });
      const discountAlreadyUsed = transactions.some(t => t.discount_amount > 0 && new Date(t.timestamp) >= seasonStart);
      if (discountAlreadyUsed) {
        return Response.json({ type: 'error', message: 'Merchandise discount already used this season' }, { status: 400 });
      }
    }

    const original = parseFloat(parseFloat(purchaseAmount).toFixed(2));
    const discountAmt = applyDiscount ? parseFloat((original * discountPct / 100).toFixed(2)) : 0;
    const finalAmt = parseFloat((original - discountAmt).toFixed(2));
    const pointsEarned = Math.floor(finalAmt);

    const now = new Date();
    await base44.asServiceRole.entities.Transaction.create({
      user_id: m.user_id,
      membership_id: m.id,
      member_name: m.user_name,
      location: 'Merchandise',
      item_description: 'Merchandise purchase',
      original_amount: original,
      discount_amount: discountAmt,
      final_amount: finalAmt,
      discount_reason: applyDiscount ? `${discountPct}% member discount` : '',
      transaction_type: 'merchandise',
      timestamp: now.toISOString(),
      hour_of_day: now.getHours(),
      day_of_week: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][now.getDay()]
    });

    const newPoints = (m.points || 0) + pointsEarned;
    if (pointsEarned > 0) {
      await base44.asServiceRole.entities.Membership.update(m.id, { points: newPoints });
      await base44.asServiceRole.entities.PointsTransaction.create({
        user_id: m.user_id,
        membership_id: m.id,
        points: pointsEarned,
        transaction_type: 'attendance',
        description: `Merchandise purchase ($${finalAmt})`,
        location: 'Merchandise',
        timestamp: now.toISOString()
      });
    }

    return Response.json({
      type: 'success',
      memberName: m.user_name,
      tierName: m.tier_name,
      original,
      discountAmt,
      discountPct,
      finalAmt,
      discountApplied: applyDiscount,
      pointsEarned,
      newBalance: newPoints
    });

  } catch (error) {
    console.error('processMerchScan error:', error);
    return Response.json({ type: 'error', message: error.message }, { status: 500 });
  }
});