import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Stripe from 'npm:stripe';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

const FN_VERSION = 'stripeWebhook m0-tenancy 2026-07-13';

Deno.serve(async (req) => {
  try {
    console.log(FN_VERSION);
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
      const { user_id, tier_id, user_email, user_name, product_type, fixture_id, referral_code, club_id: metaClubId } = session.metadata;

      // Resolve tenant club_id: prefer checkout metadata, fall back to ClubSettings singleton (Module 0 multi-tenancy)
      let clubId = metaClubId || null;
      if (!clubId) {
        try {
          const settings = await base44.asServiceRole.entities.ClubSettings.filter({ is_active: true });
          if (settings && settings[0]?.club_id) clubId = settings[0].club_id;
        } catch (_) { /* non-fatal */ }
      }

      // Handle Day Pass purchases
      if (product_type === 'day_pass') {
        // Idempotency: Stripe can retry/resend events — never mint a duplicate pass
        const existingPass = await base44.asServiceRole.entities.GameDayEntry.filter({ payment_reference: session.payment_intent });
        if (existingPass && existingPass.length > 0) {
          console.log('Day Pass already exists for payment:', session.payment_intent, '— skipping duplicate');
          return Response.json({ received: true, duplicate: true });
        }
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
          user_id: user_id,
          ...(clubId && { club_id: clubId })
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
        tier_type: tierData.tier_type || null,
        start_date: startDate.toISOString().split('T')[0],
        expiry_date: expiryDate.toISOString().split('T')[0],
        status: 'active',
        qr_code_id: `M${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
        payment_id: session.payment_intent,
        stamps: 0,
        points: 0,
        total_checkins: 0,
        games_used: 0,
        ...(isSupporter && { games_remaining: gamesIncluded || 5 }),
        ...((tierData.club_id || clubId) && { club_id: tierData.club_id || clubId })
      });

      console.log('Membership created:', membership.id, '| Tier:', tierData.name);

      // Mark any existing Day Pass membership as converted so the cadence stops
      try {
        const existingMemberships = await base44.asServiceRole.entities.Membership.filter({ user_id: user_id });
        const dayPassMembership = existingMemberships.find(m => (m.tier_type === 'day_pass' || m.tier_name === 'Day Pass') && m.id !== membership.id);
        if (dayPassMembership) {
          await base44.asServiceRole.entities.Membership.update(dayPassMembership.id, {
            conversion_sequence_stage: 'converted'
          });
          console.log('Day Pass conversion stage set to converted for membership:', dayPassMembership.id);
        }
      } catch (convErr) {
        console.error('Failed to mark Day Pass as converted (non-fatal):', convErr.message);
      }

      // Send welcome email prompting photo upload
      try {
        // White-label: club identity from the Club record (tenant source of truth), ClubSettings then hardcoded fallback
        let club = { club_name: 'Central Newcastle RLFC', short_name: 'Butcher Boys', app_url: 'https://charlestown-rl-community-app-1e1650bd.base44.app', logo_url: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6966ba172da6c09d1e1650bd/6b3832f4a_Butcherboyslogo.jpg' };
        try {
          const clubs = clubId ? await base44.asServiceRole.entities.Club.filter({ id: clubId }) : [];
          if (clubs && clubs[0]) {
            const c = clubs[0];
            club = { ...club, club_name: c.name || club.club_name, short_name: c.short_name || club.short_name, app_url: c.app_url || club.app_url, logo_url: c.logo_url || club.logo_url };
          } else {
            const settings = await base44.asServiceRole.entities.ClubSettings.filter({ is_active: true });
            if (settings && settings[0]) club = { ...club, ...settings[0], app_url: settings[0].app_url || club.app_url };
          }
        } catch (_) { /* fall back to defaults */ }
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: user_email,
          subject: `Welcome to ${club.club_name}, ${user_name?.split(' ')[0]}! 🏉 Action Required`,
          body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">

  <!-- Header -->
  <div style="background: #1a365d; padding: 32px 24px; text-align: center;">
    <img src="${club.logo_url}" alt="${club.club_name}" style="width: 72px; height: 72px; border-radius: 50%; border: 3px solid white; object-fit: contain; background: white;" />
    <h1 style="color: white; margin: 16px 0 4px; font-size: 24px;">Welcome to ${club.club_name}!</h1>
    <p style="color: #93c5fd; margin: 0; font-size: 14px;">${tierData.name} · Season 2026</p>
  </div>

  <!-- Body -->
  <div style="padding: 32px 24px; background: white;">
    <p style="color: #1e293b; font-size: 16px; margin: 0 0 12px;">Hi ${user_name?.split(' ')[0]},</p>
    <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
      Your <strong>${tierData.name}</strong> is confirmed — welcome to the ${club.short_name} family! 🎉<br/>
      To use your digital pass at the gate on game day, you'll need to complete your setup in the app on your phone.
    </p>

    <!-- Step 1 -->
    <div style="background: #eff6ff; border-left: 4px solid #1a365d; border-radius: 8px; padding: 16px 20px; margin-bottom: 16px;">
      <p style="color: #1e3a5f; font-weight: bold; font-size: 15px; margin: 0 0 6px;">📱 Step 1 — Open on your phone</p>
      <p style="color: #475569; font-size: 14px; margin: 0; line-height: 1.6;">
        Open this link on your phone using <strong>Safari (iPhone)</strong> or <strong>Chrome (Android)</strong>:
      </p>
      <div style="text-align: center; margin-top: 12px;">
        <a href="${club.app_url}" style="display: inline-block; background: #1a365d; color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 15px; font-weight: bold;">
          Open the App →
        </a>
      </div>
    </div>

    <!-- Step 2 -->
    <div style="background: #eff6ff; border-left: 4px solid #1a365d; border-radius: 8px; padding: 16px 20px; margin-bottom: 16px;">
      <p style="color: #1e3a5f; font-weight: bold; font-size: 15px; margin: 0 0 6px;">🔑 Step 2 — Log in with this email</p>
      <p style="color: #475569; font-size: 14px; margin: 0; line-height: 1.6;">
        Make sure you log in using <strong>${user_email}</strong> — the same email you used to purchase your membership.
      </p>
    </div>

    <!-- Step 3 -->
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px 20px; margin-bottom: 16px;">
      <p style="color: #92400e; font-weight: bold; font-size: 15px; margin: 0 0 6px;">📸 Step 3 — Upload your photo</p>
      <p style="color: #78350f; font-size: 14px; margin: 0; line-height: 1.6;">
        You'll be prompted to upload a photo of yourself. This is required for identity verification at the gate. It only takes 30 seconds!
      </p>
    </div>

    <!-- Step 4 - Save to Home Screen -->
    <div style="background: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 8px; padding: 16px 20px; margin-bottom: 28px;">
      <p style="color: #14532d; font-weight: bold; font-size: 15px; margin: 0 0 8px;">🏠 Step 4 — Save to your Home Screen (recommended)</p>
      <p style="color: #166534; font-size: 14px; margin: 0 0 10px; line-height: 1.6;">
        Save the app to your phone's home screen so it's easy to find on game day — just like a regular app!
      </p>
      <p style="color: #166534; font-size: 13px; font-weight: bold; margin: 0 0 4px;">On iPhone (Safari):</p>
      <ol style="color: #166534; font-size: 13px; margin: 0 0 12px; padding-left: 20px; line-height: 1.8;">
        <li>Open the app in <strong>Safari</strong></li>
        <li>Tap the <strong>Share button</strong> (the box with an arrow at the bottom of the screen)</li>
        <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
        <li>Tap <strong>"Add"</strong> — done!</li>
      </ol>
      <p style="color: #166534; font-size: 13px; font-weight: bold; margin: 0 0 4px;">On Android (Chrome):</p>
      <ol style="color: #166534; font-size: 13px; margin: 0; padding-left: 20px; line-height: 1.8;">
        <li>Open the app in <strong>Chrome</strong></li>
        <li>Tap the <strong>three dots menu</strong> (top right)</li>
        <li>Tap <strong>"Add to Home Screen"</strong></li>
        <li>Tap <strong>"Add"</strong> — done!</li>
      </ol>
    </div>

    <p style="color: #94a3b8; font-size: 13px; text-align: center; margin: 0;">
      Questions? Reply to this email or contact the club directly.
    </p>
  </div>

  <!-- Footer -->
  <div style="background: #1a365d; padding: 16px 24px; text-align: center;">
    <p style="color: #93c5fd; font-size: 12px; margin: 0;">${club.club_name} · ${club.short_name} · Season 2026</p>
  </div>

</div>
          `
        });
        console.log('Welcome email sent to:', user_email);
      } catch (emailError) {
        console.error('Failed to send welcome email (non-fatal):', emailError.message);
      }

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
              converted_at: new Date().toISOString(),
              ...(clubId && { club_id: clubId })
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