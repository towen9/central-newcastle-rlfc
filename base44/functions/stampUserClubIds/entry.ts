import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * stampUserClubIds — Module 0 step 5 enabler.
 * Stamps club_id onto every User record that doesn't have one.
 * Admin-only. Idempotent. Supports { dry_run: true } to preview.
 * Default target club: the Club record with slug 'central-newcastle',
 * override with { club_id: '...' } (validated against Club records).
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    let body = {};
    try { body = await req.json(); } catch (_) { /* empty body ok */ }
    const dryRun = body.dry_run === true;

    // Resolve target club — explicit param validated against Club records, else Central by slug
    let targetClubId = body.club_id || null;
    if (targetClubId) {
      const match = await base44.asServiceRole.entities.Club.filter({ id: targetClubId });
      if (!match || match.length === 0) {
        return Response.json({ error: `club_id ${targetClubId} does not match any Club record` }, { status: 400 });
      }
    } else {
      const central = await base44.asServiceRole.entities.Club.filter({ slug: 'central-newcastle' });
      if (!central || central.length === 0) {
        return Response.json({ error: 'Central Newcastle Club record not found' }, { status: 500 });
      }
      targetClubId = central[0].id;
    }

    const allUsers = await base44.asServiceRole.entities.User.list();
    const missing = allUsers.filter(u => !u.club_id);
    const alreadyStamped = allUsers.length - missing.length;

    if (dryRun) {
      return Response.json({
        dry_run: true,
        target_club_id: targetClubId,
        total_users: allUsers.length,
        already_stamped: alreadyStamped,
        would_stamp: missing.length,
        sample: missing.slice(0, 5).map(u => u.email)
      });
    }

    let stamped = 0;
    const failures = [];
    for (const u of missing) {
      try {
        await base44.asServiceRole.entities.User.update(u.id, { club_id: targetClubId });
        stamped++;
      } catch (err) {
        failures.push({ email: u.email, error: err.message });
      }
    }

    console.log(`stampUserClubIds: stamped ${stamped}/${missing.length} users with club_id ${targetClubId}`);

    return Response.json({
      success: failures.length === 0,
      target_club_id: targetClubId,
      total_users: allUsers.length,
      already_stamped: alreadyStamped,
      stamped,
      failures
    });
  } catch (error) {
    console.error('stampUserClubIds error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
