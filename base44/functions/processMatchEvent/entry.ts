import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import webpush from 'npm:web-push@3.6.7';

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY');
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY');

webpush.setVapidDetails(
  'mailto:admin@centralrlfc.com.au',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

function applyEventToFixture(event, fixture) {
  const updates = {};
  const isUs = event.team === 'us';
  const isThem = event.team === 'them';

  switch (event.type) {
    case 'kickoff':
      updates.kickoff_at = event.occurred_at || new Date().toISOString();
      updates.match_status = 'live_first_half';
      break;
    case 'try':
      if (isUs) updates.score_us = (fixture.score_us || 0) + 4;
      else if (isThem) updates.score_them = (fixture.score_them || 0) + 4;
      break;
    case 'conversion':
      if (event.payload_text === 'made') {
        if (isUs) updates.score_us = (fixture.score_us || 0) + 2;
        else if (isThem) updates.score_them = (fixture.score_them || 0) + 2;
      }
      break;
    case 'penalty_goal':
      if (isUs) updates.score_us = (fixture.score_us || 0) + 2;
      else if (isThem) updates.score_them = (fixture.score_them || 0) + 2;
      break;
    case 'field_goal':
      if (isUs) updates.score_us = (fixture.score_us || 0) + 1;
      else if (isThem) updates.score_them = (fixture.score_them || 0) + 1;
      break;
    case 'half_time':
      updates.match_status = 'half_time';
      updates.half_time_at = event.occurred_at || new Date().toISOString();
      break;
    case 'second_half':
      updates.match_status = 'live_second_half';
      break;
    case 'full_time':
      updates.match_status = 'full_time';
      updates.full_time_at = event.occurred_at || new Date().toISOString();
      break;
    // sin_bin, send_off, moment: no fixture score/status change
  }
  return updates;
}

function buildMilestoneMessage(event, fixture, score, usAhead) {
  switch (event.type) {
    case 'kickoff':
      return `We're underway at St John. Get loud, Butchers. 🐂`;
    case 'half_time':
      if (usAhead) return `Half time at St John. Boys lead ${score}. Strap in.`;
      if (fixture.score_us === fixture.score_them) return `Half time, all square at ${score}. 40 to go.`;
      return `Half time. ${score}. Plenty in this. Game's wide open.`;
    case 'second_half':
      return `Second half underway. ${score}. Game's not over.`;
    case 'full_time':
      if (usAhead) return `🏆 FULL TIME — Boys win it ${score}. Wear the blue with pride.`;
      if (fixture.score_us === fixture.score_them) return `Full time. ${score}. Even-stevens at St John.`;
      return `Full time. ${score}. Heads up. Next week we go again.`;
  }
  return '';
}

function buildIngameMessage(event, score, opponent) {
  const isUs = event.team === 'us';
  switch (event.type) {
    case 'try':
      return isUs
        ? `TRY! 🏉 ${event.scorer ? event.scorer + ' ' : ''}over the line. ${score} to the Boys.`
        : `Try to ${opponent}. ${score}. Heads up, Boys.`;
    case 'send_off':
      return isUs
        ? `Send off. We're down to 12. Hold the line.`
        : `SEND OFF. ${opponent} down to 12. Press the advantage.`;
    case 'field_goal':
      return isUs ? `One-pointer! ${score}. Cool head.` : `Field goal to ${opponent}. ${score}.`;
  }
  return '';
}

function decidePush(event, fixture) {
  const score = `${fixture.score_us || 0}-${fixture.score_them || 0}`;
  const usAhead = (fixture.score_us || 0) > (fixture.score_them || 0);
  const margin = Math.abs((fixture.score_us || 0) - (fixture.score_them || 0));
  const opponent = fixture.opponent_name || fixture.opponent || 'opponent';

  const MILESTONES = ['kickoff', 'half_time', 'second_half', 'full_time'];
  const ALWAYS_PUSH_INGAME = ['try', 'send_off', 'field_goal'];

  if (event.type === 'sin_bin') {
    if (event.team === 'them' && margin <= 8) {
      return {
        shouldPush: true,
        audience: 'attendees',
        message: `Sin bin — ${opponent} #${event.player_number || ''}. 10 in the bin. Eyes up.`
      };
    }
    return { shouldPush: false, audience: null, message: '', reason: 'sin_bin not pushed (low impact)' };
  }

  if (event.type === 'penalty_goal') {
    if (margin <= 4) {
      return {
        shouldPush: true,
        audience: 'attendees',
        message: event.team === 'us'
          ? `Two from the boot. ${score}.`
          : `Pen goal to ${opponent}. ${score}.`
      };
    }
    return { shouldPush: false, audience: null, message: '', reason: 'penalty_goal not pushed (margin > 4)' };
  }

  if (event.type === 'conversion') {
    return { shouldPush: false, audience: null, message: '', reason: 'conversion bundled into try' };
  }

  if (event.type === 'moment') {
    const audience = event.moment_audience === 'all_members' ? 'all_members' : 'attendees';
    return { shouldPush: true, audience, message: event.payload_text || '' };
  }

  if (MILESTONES.includes(event.type)) {
    return {
      shouldPush: true,
      audience: 'all_members',
      message: buildMilestoneMessage(event, fixture, score, usAhead)
    };
  }

  if (ALWAYS_PUSH_INGAME.includes(event.type)) {
    return {
      shouldPush: true,
      audience: 'attendees',
      message: buildIngameMessage(event, score, opponent)
    };
  }

  return { shouldPush: false, audience: null, message: '', reason: 'unknown event type' };
}

async function sendPushToAudience(sb, audience, message, fixtureId, eventId, club) {
  let targets;

  if (audience === 'all_members') {
    // All push-enabled members regardless of fixture
    targets = await sb.entities.Membership.filter({ push_enabled: true });
  } else {
    // attendees: all push-enabled members (paid + any tier)
    //           PLUS Day Pass holders specifically for this fixture

    const genericTargets = await sb.entities.Membership.filter({ push_enabled: true });

    // Find Day Pass holders who bought a pass for THIS fixture
    const fixtureEntries = await sb.entities.GameDayEntry.filter({ event_id: fixtureId });
    const fixtureUserIds = fixtureEntries.map(e => e.user_id).filter(Boolean);

    let dayPassTargets = [];
    if (fixtureUserIds.length > 0) {
      const allDayPassMembers = await sb.entities.Membership.filter({
        tier_name: 'Day Pass',
        push_enabled: true
      });
      dayPassTargets = allDayPassMembers.filter(m => fixtureUserIds.includes(m.user_id));
    }

    // Merge and dedupe by Membership.id (a user could appear in both arrays)
    const seen = new Set();
    targets = [...genericTargets, ...dayPassTargets].filter(m => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  }

  const valid = targets.filter(m => m.push_subscription);

  const payload = JSON.stringify({
    title: club.club_name,
    body: message,
    icon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6966ba172da6c09d1e1650bd/6b3832f4a_Butcherboyslogo.jpg',
    badge: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6966ba172da6c09d1e1650bd/6b3832f4a_Butcherboyslogo.jpg',
    url: '/',
    timestamp: Date.now()
  });

  let sent = 0;
  let failed = 0;

  await Promise.allSettled(valid.map(async (m) => {
    try {
      await webpush.sendNotification(m.push_subscription, payload);
      sent++;
    } catch (err) {
      failed++;
      console.error(`Failed push to ${m.id}:`, err.message, err.statusCode);
      if (err.statusCode === 410 || err.statusCode === 404) {
        await sb.entities.Membership.update(m.id, { push_subscription: null, push_enabled: false });
      }
    }
  }));

  await sb.entities.PushLog.create({
    fixture: fixtureId,
    match_event: eventId,
    audience,
    message,
    recipients: sent,
    sent_at: new Date().toISOString()
  });

  return { sent, failed, skipped_reason: null };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    // 1. Auth: must be admin
    const userClient = createClientFromRequest(req);
    let user;
    try {
      user = await userClient.auth.me();
    } catch (err) {
      return Response.json({ error: 'Authentication required' }, { status: 401, headers: CORS_HEADERS });
    }

    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401, headers: CORS_HEADERS });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403, headers: CORS_HEADERS });
    }

    // 2. Parse event ID
    const { eventId } = await req.json();
    if (!eventId) {
      return Response.json({ error: 'eventId required' }, { status: 400, headers: CORS_HEADERS });
    }

    // 3. Load event and fixture using service role
    const sb = userClient.asServiceRole;

    let club = { club_name: 'Central Newcastle RLFC', short_name: 'Butcher Boys', club_short_name: 'Central Newcastle', team_short: 'Central', venue_name: 'St John Oval', sport_emoji: '🏉', app_url: '' };
    try {
      const settings = await sb.entities.ClubSettings.filter({ is_active: true });
      if (settings && settings[0]) club = { ...club, ...settings[0] };
    } catch (_) { /* fall back to defaults */ }

    let event, fixture;
    try {
      event = await sb.entities.MatchEvent.get(eventId);
    } catch (e) {
      return Response.json({ error: 'Event not found' }, { status: 404, headers: CORS_HEADERS });
    }
    if (!event) {
      return Response.json({ error: 'Event not found' }, { status: 404, headers: CORS_HEADERS });
    }

    try {
      fixture = await sb.entities.Fixture.get(event.fixture);
    } catch (e) {
      return Response.json({ error: 'Fixture not found' }, { status: 404, headers: CORS_HEADERS });
    }
    if (!fixture) {
      return Response.json({ error: 'Fixture not found' }, { status: 404, headers: CORS_HEADERS });
    }

    // 4. Apply event to fixture
    const fixtureUpdates = applyEventToFixture(event, fixture);
    if (Object.keys(fixtureUpdates).length > 0) {
      await sb.entities.Fixture.update(fixture.id, fixtureUpdates);
    }
    const updatedFixture = { ...fixture, ...fixtureUpdates };

    // 5. Decide on push
    const pushDecision = decidePush(event, updatedFixture);
    let pushResult = { sent: 0, failed: 0, skipped_reason: null };

    if (pushDecision.shouldPush && pushDecision.message) {
      pushResult = await sendPushToAudience(sb, pushDecision.audience, pushDecision.message, fixture.id, event.id, club);
    } else {
      pushResult.skipped_reason = pushDecision.reason || 'no push needed';
    }

    // 6. Mark event as pushed
    await sb.entities.MatchEvent.update(event.id, { pushed: pushDecision.shouldPush });

    console.log(`processMatchEvent: ${event.type} | fixture ${fixture.id} | push=${pushDecision.shouldPush} | sent=${pushResult.sent}`);

    return Response.json({
      success: true,
      fixture_updates: fixtureUpdates,
      push_decision: pushDecision,
      push_result: pushResult
    }, { headers: CORS_HEADERS });

  } catch (err) {
    console.error('processMatchEvent error:', err);
    return Response.json({ error: err.message || 'Internal error' }, { status: 500, headers: CORS_HEADERS });
  }
});