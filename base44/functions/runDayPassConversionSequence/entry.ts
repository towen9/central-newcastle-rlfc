import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import webpush from 'npm:web-push@3.6.7';

webpush.setVapidDetails(
  'mailto:admin@centralrlfc.com.au',
  Deno.env.get('VAPID_PUBLIC_KEY'),
  Deno.env.get('VAPID_PRIVATE_KEY')
);

const DEFAULT_APP_URL = 'https://charlestown-rl-community-app-1e1650bd.base44.app';
const CLUB_LOGO = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6966ba172da6c09d1e1650bd/6b3832f4a_Butcherboyslogo.jpg';

function buildMessages(club) {
  const APP_URL = club.app_url || DEFAULT_APP_URL;
  return {
    t24: {
      pushTitle: 'Yesterday at St John',
      pushBody: 'Yesterday at St John → all season at St John. Code DAYPASS24 at checkout for $8 credit on a full membership. Tap to upgrade.',
      emailSubject: (firstName) => `${firstName}, see you back at St John?`,
      emailBody: (firstName) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
  <div style="background: #1a365d; padding: 32px 24px; text-align: center;">
    <img src="${CLUB_LOGO}" alt="${club.club_name}" style="width: 72px; height: 72px; border-radius: 50%; border: 3px solid white; object-fit: contain; background: white;" />
    <h1 style="color: white; margin: 16px 0 4px; font-size: 24px;">${club.club_name}</h1>
  </div>
  <div style="padding: 32px 24px; background: white;">
    <p style="color: #1e293b; font-size: 16px; margin: 0 0 16px;">Hey ${firstName}, thanks for coming to St John yesterday — hope you enjoyed the game.</p>
    <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">A few of our regulars said the best $8 they've ever spent was the Day Pass that turned into a full season. Here's the deal: code <strong>DAYPASS24</strong> at checkout takes the $8 you already paid off any full membership tier.</p>
    <div style="text-align: center; margin: 28px 0;">
      <a href="${APP_URL}/Membership" style="display: inline-block; background: #1a365d; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: bold;">Become a Butcher Boy →</a>
    </div>
    <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 8px;">See you at St John,</p>
    <p style="color: #1e293b; font-size: 15px; font-weight: bold; margin: 0;">The ${club.short_name}</p>
  </div>
  <div style="background: #1a365d; padding: 16px 24px; text-align: center;">
    <p style="color: #93c5fd; font-size: 12px; margin: 0;">${club.club_name} · ${club.short_name} · Season 2026</p>
  </div>
</div>`.trim()
    },
    t72: {
      pushTitle: "The pack's growing",
      pushBody: "Members who upgraded after their first Day Pass average 8 home games a season. The pack's growing — come with us. 🐂",
      emailSubject: () => 'What our members have to say',
      emailBody: (firstName) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
  <div style="background: #1a365d; padding: 32px 24px; text-align: center;">
    <img src="${CLUB_LOGO}" alt="${club.club_name}" style="width: 72px; height: 72px; border-radius: 50%; border: 3px solid white; object-fit: contain; background: white;" />
    <h1 style="color: white; margin: 16px 0 4px; font-size: 24px;">${club.club_name}</h1>
  </div>
  <div style="padding: 32px 24px; background: white;">
    <p style="color: #1e293b; font-size: 16px; margin: 0 0 16px;">Hey ${firstName}, three members joined this week — all bought a Day Pass first. Here's why they upgraded...</p>
    <div style="background: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 8px; padding: 16px 20px; margin-bottom: 12px;">
      <p style="color: #166534; font-size: 14px; font-style: italic; margin: 0;">"Best decision I made all year."</p>
    </div>
    <div style="background: #eff6ff; border-left: 4px solid #1a365d; border-radius: 8px; padding: 16px 20px; margin-bottom: 12px;">
      <p style="color: #1e3a5f; font-size: 14px; font-style: italic; margin: 0;">"The kids love it."</p>
    </div>
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px 20px; margin-bottom: 28px;">
      <p style="color: #92400e; font-size: 14px; font-style: italic; margin: 0;">"Game-day pushes alone are worth it."</p>
    </div>
    <div style="text-align: center; margin: 0 0 24px;">
      <a href="${APP_URL}/Membership" style="display: inline-block; background: #1a365d; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: bold;">Become a Butcher Boy →</a>
    </div>
  </div>
  <div style="background: #1a365d; padding: 16px 24px; text-align: center;">
    <p style="color: #93c5fd; font-size: 12px; margin: 0;">${club.club_name} · ${club.short_name} · Season 2026</p>
  </div>
</div>`.trim()
    },
    t7d: {
      pushTitle: 'Code DAYPASS24 expires soon',
      pushBody: 'Last chance — your $8 credit expires Sunday. Lock in your season at St John. Tap to upgrade.',
      emailSubject: () => 'Last call: your $8 credit expires Sunday',
      emailBody: (firstName) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
  <div style="background: #1a365d; padding: 32px 24px; text-align: center;">
    <img src="${CLUB_LOGO}" alt="${club.club_name}" style="width: 72px; height: 72px; border-radius: 50%; border: 3px solid white; object-fit: contain; background: white;" />
    <h1 style="color: white; margin: 16px 0 4px; font-size: 24px;">Last Call, ${firstName}</h1>
  </div>
  <div style="padding: 32px 24px; background: white;">
    <p style="color: #1e293b; font-size: 16px; margin: 0 0 16px;">Hey ${firstName} — this is the last reminder.</p>
    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px 20px; margin-bottom: 20px; text-align: center;">
      <p style="color: #991b1b; font-size: 15px; font-weight: bold; margin: 0;">⏰ Your DAYPASS24 credit expires Sunday</p>
    </div>
    <p style="color: #475569; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">Use code <strong>DAYPASS24</strong> at checkout to take $8 off any full membership. After Sunday, the code's gone.</p>
    <div style="text-align: center; margin: 0 0 24px;">
      <a href="${APP_URL}/Membership" style="display: inline-block; background: #dc2626; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: bold;">Lock In My Membership →</a>
    </div>
    <p style="color: #94a3b8; font-size: 13px; text-align: center; margin: 0;">The ${club.short_name}</p>
  </div>
  <div style="background: #1a365d; padding: 16px 24px; text-align: center;">
    <p style="color: #93c5fd; font-size: 12px; margin: 0;">${club.club_name} · ${club.short_name} · Season 2026</p>
  </div>
</div>`.trim()
    }
  };
}

async function sendSinglePush(sb, membership, title, body, stage) {
  if (!membership.push_subscription) return { ok: false, reason: 'no_subscription' };

  const payload = JSON.stringify({
    title,
    body,
    icon: CLUB_LOGO,
    badge: CLUB_LOGO,
    url: '/Membership',
    timestamp: Date.now()
  });

  try {
    await webpush.sendNotification(membership.push_subscription, payload);

    // Log to PushLog
    await sb.entities.PushLog.create({
      fixture: null,
      match_event: null,
      audience: 'segment',
      segment_tag: `conversion_${stage}`,
      message: body,
      recipients: 1,
      sent_at: new Date().toISOString()
    });

    return { ok: true };
  } catch (err) {
    console.error(`Push failed for membership ${membership.id}:`, err.message, err.statusCode);
    if (err.statusCode === 410 || err.statusCode === 404) {
      await sb.entities.Membership.update(membership.id, { push_subscription: null, push_enabled: false });
    }
    return { ok: false, reason: err.message };
  }
}

async function sendSingleEmail(sb, membership, subject, body, club) {
  if (!membership.user_email) return { ok: false, reason: 'no_email' };

  try {
    await sb.integrations.Core.SendEmail({
      to: membership.user_email,
      from_name: club.club_name,
      subject,
      body
    });
    return { ok: true };
  } catch (err) {
    console.error(`Email failed for membership ${membership.id}:`, err.message);
    return { ok: false, reason: err.message };
  }
}

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
    const sb = base44.asServiceRole;

    // Single-tenant cron today: resolve the one live club. When a second live club
    // ships, this cron must batch Day Pass members per club_id and resolve per batch.
    const club = await resolveClub(sb, null);
    if (!club.app_url) club.app_url = 'https://charlestown-rl-community-app-1e1650bd.base44.app';

    const MESSAGES = buildMessages(club);

    const now = new Date();
    const H24 = 24 * 60 * 60 * 1000;
    const H72 = 72 * 60 * 60 * 1000;
    const H168 = 168 * 60 * 60 * 1000;

    // Find all Day Pass memberships not yet converted or unsubscribed
    const candidates = await sb.entities.Membership.filter({
      tier_name: 'Day Pass',
      push_enabled: true
    });

    const eligible = candidates.filter(m => {
      const stage = m.conversion_sequence_stage || 'none';
      return stage !== 'converted' && stage !== 'unsubscribed' && stage !== 't7d_sent';
    });

    const summary = { processed: 0, t24_sent: 0, t72_sent: 0, t7d_sent: 0, skipped: 0, errors: [] };

    for (const membership of eligible) {
      const stage = membership.conversion_sequence_stage || 'none';
      const createdAt = new Date(membership.created_date);
      const hoursSince = now - createdAt;
      const firstName = membership.user_name?.split(' ')[0] || 'mate';

      let targetStage = null;
      let msgs = null;

      if (stage === 'none' && hoursSince >= H24 && hoursSince < H72) {
        targetStage = 't24_sent';
        msgs = MESSAGES.t24;
      } else if (stage === 't24_sent' && hoursSince >= H72 && hoursSince < H168) {
        targetStage = 't72_sent';
        msgs = MESSAGES.t72;
      } else if (stage === 't72_sent' && hoursSince >= H168) {
        targetStage = 't7d_sent';
        msgs = MESSAGES.t7d;
      } else if (stage === 'none' && hoursSince >= H168) {
        // Missed entire window — skip, don't backfill
        console.log(`Missed cadence: membership ${membership.id} created ${Math.round(hoursSince / 3600000)}h ago, stage=none. Skipping.`);
        summary.skipped++;
        continue;
      } else {
        // Not in the right window for this stage yet
        summary.skipped++;
        continue;
      }

      summary.processed++;

      const [pushResult, emailResult] = await Promise.allSettled([
        sendSinglePush(sb, membership, msgs.pushTitle, msgs.pushBody, targetStage),
        sendSingleEmail(sb, membership, msgs.emailSubject(firstName), msgs.emailBody(firstName), club)
      ]);

      const pushOk = pushResult.status === 'fulfilled' && pushResult.value?.ok;
      const emailOk = emailResult.status === 'fulfilled' && emailResult.value?.ok;

      if (pushOk || emailOk) {
        // Bump stage if at least one channel succeeded
        await sb.entities.Membership.update(membership.id, {
          conversion_sequence_stage: targetStage,
          conversion_sequence_last_sent_at: now.toISOString()
        });

        if (targetStage === 't24_sent') summary.t24_sent++;
        else if (targetStage === 't72_sent') summary.t72_sent++;
        else if (targetStage === 't7d_sent') summary.t7d_sent++;

        console.log(`Conversion ${targetStage}: membership ${membership.id} | push=${pushOk} email=${emailOk}`);
      } else {
        const errMsg = `Both push and email failed for membership ${membership.id}`;
        console.error(errMsg);
        summary.errors.push(errMsg);
      }
    }

    console.log('runDayPassConversionSequence complete:', JSON.stringify(summary));
    return Response.json({ success: true, ...summary });

  } catch (error) {
    console.error('runDayPassConversionSequence error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});