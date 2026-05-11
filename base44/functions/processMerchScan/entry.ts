import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// TODO: extract to shared util when Deno supports local imports across functions.
// Returns decomposed Sydney local time for any UTC Date — handles AEST/AEDT automatically.
function getSydneyTime(date = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Sydney',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const obj = {};
  for (const p of parts) obj[p.type] = p.value;
  return {
    year: parseInt(obj.year),
    month: parseInt(obj.month),
    day: parseInt(obj.day),
    hour: parseInt(obj.hour),
    minute: parseInt(obj.minute),
    weekday: obj.weekday, // "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"
  };
}

// Tier discount rules:
// FLAT_TIERS:    10% always (no first-purchase bonus)
// PREMIUM_TIERS: 20% on first MerchTransaction, 10% thereafter
// Everything else: 0%
const FLAT_TIERS = ['Supporter Pack', 'Family', 'Day Pass'];
const PREMIUM_TIERS = ['Premium', 'Old Butchers', 'Sponsor Season Pass'];

async function resolveDiscount(base44, membership) {
  const tierName = membership.tier_name || '';

  if (FLAT_TIERS.some(t => tierName.includes(t))) {
    return 10;
  }

  if (PREMIUM_TIERS.some(t => tierName.includes(t))) {
    const prevPurchases = await base44.asServiceRole.entities.MerchTransaction.filter({ user_id: membership.user_id });
    const isFirstPurchase = prevPurchases.length === 0;
    return isFirstPurchase ? 20 : 10;
  }

  // No matching tier
  console.warn(`processMerchScan: unrecognised tier "${tierName}" for user ${membership.user_id} — applying 0% discount`);
  return 0;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || (user.role !== 'admin' && user.role !== 'canteen_staff' && user.role !== 'gate_staff')) {
      return Response.json({ type: 'error', message: 'Unauthorised' }, { status: 403 });
    }

    const body = await req.json();
    const { qrCode, purchaseAmount } = body;

    if (!qrCode) return Response.json({ type: 'error', message: 'No QR code provided' }, { status: 400 });

    // --- LOOKUP PHASE (no purchaseAmount) ---
    if (purchaseAmount === undefined) {
      const memberships = await base44.asServiceRole.entities.Membership.filter({ qr_code_id: qrCode, status: 'active' });

      // No active membership — return 0% so the UI can proceed without discount
      if (!memberships || memberships.length === 0) {
        console.warn(`processMerchScan lookup: no active membership for QR ${qrCode} — 0% discount`);
        return Response.json({
          type: 'no_membership',
          memberName: null,
          tierName: null,
          discountPct: 0,
          message: 'No active membership found. Full price applies.'
        });
      }

      const m = memberships[0];
      const discountPct = await resolveDiscount(base44, m);

      return Response.json({
        type: 'member_found',
        memberId: m.id,
        userId: m.user_id,
        memberName: m.user_name,
        tierName: m.tier_name,
        discountPct,
        points: m.points || 0
      });
    }

    // --- PROCESS PHASE (purchaseAmount provided) ---
    // At this point qrCode is the membership id (passed back from lookup response)
    const memberships = await base44.asServiceRole.entities.Membership.filter({ id: qrCode, status: 'active' });

    const now = new Date();
    const syd = getSydneyTime(now);

    let m = null;
    let discountPct = 0;

    if (!memberships || memberships.length === 0) {
      // No membership — proceed at 0%, no points
      console.warn(`processMerchScan process: no active membership id ${qrCode} — 0% discount`);
    } else {
      m = memberships[0];
      discountPct = await resolveDiscount(base44, m);
    }

    const original = parseFloat(parseFloat(purchaseAmount).toFixed(2));
    const discountAmt = parseFloat((original * discountPct / 100).toFixed(2));
    const finalAmt = parseFloat((original - discountAmt).toFixed(2));
    const pointsEarned = m ? Math.floor(finalAmt) : 0;

    // Record in dedicated MerchTransaction entity
    await base44.asServiceRole.entities.MerchTransaction.create({
      user_id: m?.user_id || 'unknown',
      membership_id: m?.id || null,
      member_name: m?.user_name || 'Guest',
      tier_name: m?.tier_name || null,
      original_amount: original,
      discount_pct: discountPct,
      discount_amount: discountAmt,
      final_amount: finalAmt,
      points_earned: pointsEarned,
      timestamp: now.toISOString(),
      hour_of_day: syd.hour,          // Sydney local hour
      day_of_week: syd.weekday        // Sydney local weekday e.g. "Wed"
    });

    // Also record in general Transaction ledger for revenue reporting
    if (m) {
      await base44.asServiceRole.entities.Transaction.create({
        user_id: m.user_id,
        membership_id: m.id,
        member_name: m.user_name,
        location: 'Merchandise',
        item_description: 'Merchandise purchase',
        original_amount: original,
        discount_amount: discountAmt,
        final_amount: finalAmt,
        discount_reason: discountPct > 0 ? `${discountPct}% member discount` : '',
        transaction_type: 'merchandise',
        timestamp: now.toISOString(),
        hour_of_day: syd.hour,
        day_of_week: syd.weekday
      });

      // Award points
      if (pointsEarned > 0) {
        const newPoints = (m.points || 0) + pointsEarned;
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
    }

    return Response.json({
      type: 'success',
      memberName: m?.user_name || 'Guest',
      tierName: m?.tier_name || null,
      original,
      discountAmt,
      discountPct,
      finalAmt,
      pointsEarned,
      newBalance: m ? (m.points || 0) + pointsEarned : 0
    });

  } catch (error) {
    console.error('processMerchScan error:', error);
    return Response.json({ type: 'error', message: error.message }, { status: 500 });
  }
});