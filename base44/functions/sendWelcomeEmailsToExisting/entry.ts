import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Module 0 step 7b: Club record is the tenant source of truth; ClubSettings is legacy fallback.
async function resolveClub(sb, clubId) {
  let club = { club_name: 'Central Newcastle RLFC', short_name: 'Butcher Boys', club_short_name: 'Central Newcastle', team_short: 'Central', venue_name: 'St John Oval', sport_emoji: '🏉', app_url: '', contact_email: '' };
  try {
    let rec = null;
    if (clubId) {
      const byId = await sb.entities.Club.filter({ id: clubId });
      rec = byId && byId[0];
    }
    if (!rec) {
      const live = await sb.entities.Club.filter({ status: 'live', is_active: true });
      if (live && live.length === 1) rec = live[0];
    }
    if (rec) {
      return {
        ...club,
        club_name: rec.name || club.club_name,
        short_name: rec.short_name || club.short_name,
        club_short_name: rec.club_short_name || club.club_short_name,
        team_short: rec.team_short || club.team_short,
        venue_name: rec.venue_name || club.venue_name,
        sport_emoji: rec.sport_emoji || club.sport_emoji,
        app_url: rec.app_url || club.app_url,
        contact_email: rec.contact_email || club.contact_email
      };
    }
    const settings = await sb.entities.ClubSettings.filter({ is_active: true });
    if (settings && settings[0]) club = { ...club, ...settings[0] };
  } catch (_) { /* fall back to defaults */ }
  return club;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin only' }, { status: 403 });
    }

    const club = await resolveClub(base44.asServiceRole, null);
    if (!club.app_url) club.app_url = 'https://charlestown-rl-community-app-1e1650bd.base44.app';

    const memberships = await base44.asServiceRole.entities.Membership.filter({ status: 'active' });

    let sent = 0;
    let skipped = 0;
    const errors = [];

    for (const membership of memberships) {
      if (!membership.user_email) { skipped++; continue; }

      try {
        const firstName = membership.user_name?.split(' ')[0] || 'Member';
        const tierName = membership.tier_name || 'Membership';

        await base44.asServiceRole.integrations.Core.SendEmail({
          to: membership.user_email,
          subject: `Welcome to ${club.club_name}, ${firstName}! ${club.sport_emoji} Action Required`,
          body: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">

  <!-- Header -->
  <div style="background: #1a365d; padding: 32px 24px; text-align: center;">
    <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6966ba172da6c09d1e1650bd/6b3832f4a_Butcherboyslogo.jpg" alt="${club.club_name}" style="width: 72px; height: 72px; border-radius: 50%; border: 3px solid white; object-fit: contain; background: white;" />
    <h1 style="color: white; margin: 16px 0 4px; font-size: 24px;">Welcome to ${club.club_name}!</h1>
    <p style="color: #93c5fd; margin: 0; font-size: 14px;">${tierName} · Season 2026</p>
  </div>

  <!-- Body -->
  <div style="padding: 32px 24px; background: white;">
    <p style="color: #1e293b; font-size: 16px; margin: 0 0 12px;">Hi ${firstName},</p>
    <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
      Your <strong>${tierName}</strong> is confirmed — welcome to the ${club.short_name} family! 🎉<br/>
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
        Make sure you log in using <strong>${membership.user_email}</strong> — the same email you used to purchase your membership.
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
        sent++;
        console.log(`Email sent to: ${membership.user_email}`);
      } catch (err) {
        errors.push(membership.user_email);
        console.error(`Failed for ${membership.user_email}:`, err.message);
      }
    }

    return Response.json({ success: true, sent, skipped, failed: errors.length, errors });
  } catch (error) {
    console.error('Error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});