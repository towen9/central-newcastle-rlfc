import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import webpush from 'npm:web-push@3.6.7';

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY');
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY');

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  throw new Error('VAPID keys not configured');
}

webpush.setVapidDetails('mailto:admin@centralrlfc.com.au', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const ICON = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6966ba172da6c09d1e1650bd/6b3832f4a_Butcherboyslogo.jpg';

// Returns local Sydney time parts for any UTC Date — handles AEST/AEDT automatically.
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

// Format a UTC date as a readable Sydney-local time string, e.g. "3:00pm"
function formatSydneyTime(date) {
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Sydney',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date).replace(':00', '').toLowerCase();
}

// Get the Sydney-local weekday name of a UTC date
function getSydneyWeekday(date) {
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Sydney',
    weekday: 'long',
  }).format(date); // e.g. "Sunday", "Saturday"
}

async function sendPushToAll(sb, title, body) {
  const memberships = await sb.entities.Membership.filter({
    push_enabled: true,
    status: 'active'
  });

  const payload = JSON.stringify({
    title,
    body,
    icon: ICON,
    badge: ICON,
    url: '/',
    timestamp: Date.now()
  });

  let successCount = 0;
  let failCount = 0;

  await Promise.all(memberships.map(async (member) => {
    if (!member.push_subscription) return;
    try {
      await webpush.sendNotification(member.push_subscription, payload);
      successCount++;
    } catch (err) {
      console.error(`Failed to send to ${member.id}: ${err.statusCode} ${err.message}`);
      failCount++;
      if (err.statusCode === 410 || err.statusCode === 404) {
        await sb.entities.Membership.update(member.id, {
          push_subscription: null,
          push_enabled: false
        });
      }
    }
  }));

  return { successCount, failCount };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const sb = base44.asServiceRole;

    const now = new Date();
    const sydNow = getSydneyTime(now);

    console.log(`sendMatchWeekNotifications: now=${now.toISOString()} Sydney=${sydNow.weekday} ${sydNow.hour}:${String(sydNow.minute).padStart(2,'0')}`);

    // Load all upcoming fixtures
    const upcomingFixtures = await sb.entities.Fixture.filter({ status: 'upcoming' });

    if (upcomingFixtures.length === 0) {
      return Response.json({ success: true, message: 'No upcoming fixtures' });
    }

    // Sort ascending, pick the soonest
    upcomingFixtures.sort((a, b) => new Date(a.date_time) - new Date(b.date_time));
    const nextMatch = upcomingFixtures[0];
    const kickoff = new Date(nextMatch.date_time);
    const hoursUntilKickoff = (kickoff - now) / (1000 * 60 * 60);
    const daysUntilKickoff = hoursUntilKickoff / 24;

    const opponent = nextMatch.opponent_name || nextMatch.opponent || 'the opposition';
    const kickoffTimeStr = formatSydneyTime(kickoff);
    const kickoffDay = getSydneyWeekday(kickoff); // e.g. "Sunday"

    let fired = null;

    // --- WEDNESDAY PREVIEW ---
    // Sydney weekday Wed, hour 18-18:59, fixture in 2–6 days, not already sent
    if (
      sydNow.weekday === 'Wed' &&
      sydNow.hour === 18 &&
      daysUntilKickoff >= 2 && daysUntilKickoff <= 6 &&
      !nextMatch.wednesday_preview_sent_at
    ) {
      const title = `Game day this ${kickoffDay}`;
      const body = `Central v ${opponent} at St John, ${kickoffTimeStr}. Loaded into your app. 🐂`;
      const result = await sendPushToAll(sb, title, body);
      await sb.entities.Fixture.update(nextMatch.id, { wednesday_preview_sent_at: now.toISOString() });
      console.log(`Wednesday preview sent: "${title}" → ${result.successCount} delivered, ${result.failCount} failed`);
      fired = { type: 'wednesday_preview', ...result, title, fixture: opponent };
    }

    // --- FRIDAY REMINDER ---
    // Sydney weekday Fri, hour 19-19:59, fixture in 0–3 days, not already sent
    else if (
      sydNow.weekday === 'Fri' &&
      sydNow.hour === 19 &&
      daysUntilKickoff >= 0 && daysUntilKickoff <= 3 &&
      !nextMatch.friday_reminder_sent_at
    ) {
      const title = '48 hours to game day';
      const body = `Boys take on ${opponent} this ${kickoffDay} at St John. Members get in free with their digital pass. See you there. 🐂`;
      const result = await sendPushToAll(sb, title, body);
      await sb.entities.Fixture.update(nextMatch.id, { friday_reminder_sent_at: now.toISOString() });
      console.log(`Friday reminder sent: "${title}" → ${result.successCount} delivered, ${result.failCount} failed`);
      fired = { type: 'friday_reminder', ...result, title, fixture: opponent };
    }

    // --- MATCHDAY 2HR ALERT ---
    // Kickoff is 1.5–2.5 hours away (tolerant window for 6h cron), not already sent
    else if (
      hoursUntilKickoff >= 1.5 && hoursUntilKickoff <= 2.5 &&
      !nextMatch.matchday_alert_sent_at
    ) {
      const title = 'Game day at St John';
      const body = `Kick-off in 2 hours. Central v ${opponent}. Digital pass ready in your app. Get loud. 🐂`;
      const result = await sendPushToAll(sb, title, body);
      await sb.entities.Fixture.update(nextMatch.id, { matchday_alert_sent_at: now.toISOString() });
      console.log(`Matchday alert sent: "${title}" → ${result.successCount} delivered, ${result.failCount} failed`);
      fired = { type: 'matchday_alert', ...result, title, fixture: opponent };
    }

    if (!fired) {
      console.log('sendMatchWeekNotifications: no window matched, nothing sent');
      return Response.json({ success: true, message: 'No notifications scheduled at this time', sydney: sydNow, hoursUntilKickoff: Math.round(hoursUntilKickoff * 10) / 10 });
    }

    return Response.json({ success: true, ...fired });

  } catch (error) {
    console.error('Match week notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});