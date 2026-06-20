import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow gate_staff and admin
    const user = await base44.auth.me();
    if (!user || (user.role !== 'gate_staff' && user.role !== 'admin')) {
      return Response.json({ type: 'error', detail: 'Access denied' }, { status: 403 });
    }

    const { qrCode } = await req.json();
    if (!qrCode) {
      return Response.json({ type: 'error', detail: 'No QR code provided' }, { status: 400 });
    }

    // --- Day Pass ---
    if (qrCode.startsWith('DP')) {
      const matches = await base44.asServiceRole.entities.GameDayEntry.filter({ pass_qr_code: qrCode });
      const dayPass = matches[0] || null;

      if (!dayPass) return Response.json({ type: 'error', detail: 'Day Pass not found' });
      if (dayPass.status === 'used') return Response.json({ type: 'already_used', name: `${dayPass.first_name} ${dayPass.last_name}`, detail: 'Already used today' });
      if (dayPass.status === 'expired') return Response.json({ type: 'error', detail: 'Day Pass has expired' });

      await base44.asServiceRole.entities.GameDayEntry.update(dayPass.id, {
        status: 'used',
        scanned_at: new Date().toISOString()
      });

      return Response.json({
        type: 'success',
        name: `${dayPass.first_name} ${dayPass.last_name}`.trim(),
        passType: 'Day Pass',
        photo: dayPass.photo_url || null,
        detail: 'Day pass admitted'
      });
    }

    // --- Membership ---
    const memberships = await base44.asServiceRole.entities.Membership.filter({ qr_code_id: qrCode });
    const membership = memberships[0];

    if (!membership) return Response.json({ type: 'error', detail: 'Invalid QR code' });
    if (membership.status !== 'active') return Response.json({ type: 'error', detail: 'Membership not active', name: membership.user_name });

    // Check already checked in today (AEST = UTC+10/11)
    const nowAEST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Australia/Sydney' }));
    const todayStart = new Date(nowAEST);
    todayStart.setHours(0, 0, 0, 0);
    const todayCheckins = await base44.asServiceRole.entities.CheckIn.filter({ membership_id: membership.id });
    const todayCheckinsCount = todayCheckins.filter(c => {
      if (!c.timestamp) return false;
      const checkinAEST = new Date(new Date(c.timestamp).toLocaleString('en-US', { timeZone: 'Australia/Sydney' }));
      return checkinAEST >= todayStart;
    }).length;

    // Family memberships allow 2 entries per game day (2 adults), all others allow 1
    const isFamily = membership.tier_name?.includes('Family');
    const maxEntries = isFamily ? 2 : 1;

    if (todayCheckinsCount >= maxEntries) {
      const detail = isFamily
        ? 'Both family entries already used today'
        : 'Already checked in today';
      return Response.json({ type: 'already_used', name: membership.user_name || 'Member', detail });
    }

    const isSupporter = membership.tier_name?.includes('Supporter Pack');
    // Award points to Family, Premium, and Old Butchers members
    const isFamilyOrPremium = membership.tier_name?.includes('Family') || membership.tier_name?.includes('Premium') || membership.tier_name?.includes('Old Butchers');

    // Block Supporter Pack if no games remaining
    if (isSupporter) {
      const remaining = membership.games_remaining ?? 5;
      if (remaining <= 0) {
        return Response.json({ type: 'supporter_exhausted', name: membership.user_name || 'Member', detail: 'No entries remaining — Supporter Pack has been used. Please see a club volunteer to purchase a Day Pass ($8) or upgrade your membership.' });
      }
    }

    // Create check-in record
    const checkIn = await base44.asServiceRole.entities.CheckIn.create({
      user_id: membership.user_id,
      membership_id: membership.id,
      location: 'Main Gate',
      timestamp: new Date().toISOString()
    });

    // Build update
    const updateData = {
      total_checkins: (membership.total_checkins || 0) + 1,
      games_used: (membership.games_used || 0) + 1
    };

    if (isSupporter) {
      updateData.games_remaining = Math.max(0, (membership.games_remaining ?? 5) - 1);
    }

    let pointsEarned = 0;
    if (isFamilyOrPremium) {
      pointsEarned = 10;
      updateData.points = (membership.points || 0) + 10;
    }

    await base44.asServiceRole.entities.Membership.update(membership.id, updateData);

    if (pointsEarned > 0) {
      await base44.asServiceRole.entities.PointsTransaction.create({
        user_id: membership.user_id,
        membership_id: membership.id,
        points: pointsEarned,
        transaction_type: 'attendance',
        description: 'Game attendance',
        location: 'Gate',
        related_id: checkIn.id,
        timestamp: new Date().toISOString()
      });
    }

    const newGamesRemaining = isSupporter ? Math.max(0, (membership.games_remaining ?? 5) - 1) : null;
    const wasLastEntry = isSupporter && (membership.games_remaining ?? 5) === 1;

    let detail = '';
    if (isSupporter) detail = `${newGamesRemaining} entries remaining`;
    else if (pointsEarned > 0) detail = `+${pointsEarned} points earned`;

    if (wasLastEntry) {
      return Response.json({
        type: 'supporter_last_entry',
        name: membership.user_name || 'Member',
        passType: membership.tier_name,
        photo: membership.photo_url || null,
        detail: 'This is their final included game. Upgrade to a Premium membership to keep coming all season.'
      });
    }

    return Response.json({
      type: 'success',
      name: membership.user_name || 'Member',
      passType: membership.tier_name,
      photo: membership.photo_url || null,
      detail
    });

  } catch (error) {
    console.error('processScan error:', error);
    return Response.json({ type: 'error', detail: error.message }, { status: 500 });
  }
});