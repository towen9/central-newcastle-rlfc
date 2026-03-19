import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { first_name, last_name, email, mobile, tier_id, tier_name } = await req.json();

    if (!email || !tier_id) {
      return Response.json({ error: 'Email and tier_id are required' }, { status: 400 });
    }

    const fullName = `${first_name || ''} ${last_name || ''}`.trim();

    // 1. Invite user to the app
    try {
      await base44.asServiceRole.users.inviteUser(email, 'user');
      console.log(`Invited user: ${email}`);
    } catch (inviteErr) {
      // May already exist — log and continue
      console.log(`Invite note for ${email}: ${inviteErr.message}`);
    }

    // 2. Check if membership already exists for this email + tier
    const existing = await base44.asServiceRole.entities.Membership.filter({
      user_email: email,
      tier_id: tier_id,
    });

    if (existing.length > 0) {
      return Response.json({ message: 'Already exists' });
    }

    // 3. Create pending membership
    const qrCodeId = `PLAYER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await base44.asServiceRole.entities.Membership.create({
      user_email: email,
      user_name: fullName,
      tier_id: tier_id,
      tier_name: tier_name,
      start_date: new Date().toISOString().split('T')[0],
      expiry_date: '2026-12-31',
      status: 'pending',
      qr_code_id: qrCodeId,
      stamps: 0,
      points: 0,
      total_checkins: 0,
    });

    console.log(`Created membership for ${email} — ${tier_name}`);
    return Response.json({ message: 'Invited & membership created' });

  } catch (error) {
    console.error('bulkImportPlayer error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});