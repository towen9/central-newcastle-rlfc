import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { format, isSameDay, parseISO } from 'npm:date-fns';
import webpush from 'npm:web-push@3.6.7';

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY');
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY');

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  throw new Error('VAPID keys not configured');
}

webpush.setVapidDetails('mailto:admin@centralrlfc.com.au', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const now = new Date();

    // Find upcoming fixtures in the next 7 days
    const upcomingFixtures = await base44.asServiceRole.entities.Fixture.filter({
      status: 'upcoming'
    });

    const nextWeekFixtures = upcomingFixtures.filter(f => {
      const fixtureDate = parseISO(f.date_time);
      const daysUntil = Math.ceil((fixtureDate - now) / (1000 * 60 * 60 * 24));
      return daysUntil >= 0 && daysUntil <= 7;
    });

    if (nextWeekFixtures.length === 0) {
      return Response.json({
        success: true,
        message: 'No upcoming fixtures in the next 7 days'
      });
    }

    // Sort by date
    nextWeekFixtures.sort((a, b) => new Date(a.date_time) - new Date(b.date_time));
    const nextMatch = nextWeekFixtures[0];
    const matchDateUtc = parseISO(nextMatch.date_time);
    // Convert to AEST (UTC+10) for display
    const AEST_OFFSET_MS = 10 * 60 * 60 * 1000;
    const matchDate = new Date(matchDateUtc.getTime() + AEST_OFFSET_MS);
    const daysUntil = Math.ceil((matchDate - now) / (1000 * 60 * 60 * 24));

    let notificationTitle = '';
    let notificationBody = '';
    let shouldSend = false;

    // Monday preview (if match is within 6 days)
    if (now.getDay() === 1 && daysUntil <= 6 && daysUntil > 2) {
      notificationTitle = '🏉 Match Week Preview';
      notificationBody = `${format(matchDate, 'EEEE')} v ${nextMatch.opponent}. ${format(matchDate, 'h:mma')} at ${nextMatch.venue || 'TBA'}`;
      shouldSend = true;
    }

    // Thursday reminder (2 days before match)
    if (now.getDay() === 4 && daysUntil === 2) {
      notificationTitle = '⏰ Match Reminder';
      notificationBody = `This ${format(matchDate, 'EEEE')} v ${nextMatch.opponent}. ${format(matchDate, 'h:mma')} kick-off.`;
      shouldSend = true;
    }

    // Game day alert (match day, 3 hours before kick-off)
    if (isSameDay(now, matchDate)) {
      const hoursUntil = (matchDate - now) / (1000 * 60 * 60);
      if (hoursUntil <= 3 && hoursUntil > 2) {
        notificationTitle = '🔥 Game Day!';
        notificationBody = `Central v ${nextMatch.opponent} kicks off at ${format(matchDate, 'h:mma')}. See you at ${nextMatch.venue || 'the ground'}!`;
        shouldSend = true;
      }
    }

    if (!shouldSend) {
      return Response.json({
        success: true,
        message: 'No notifications scheduled at this time'
      });
    }

    // Read from Membership — the source of truth for push subscriptions
    const memberships = await base44.asServiceRole.entities.Membership.filter({
      push_enabled: true,
      status: 'active'
    });

    const ICON = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6966ba172da6c09d1e1650bd/6b3832f4a_Butcherboyslogo.jpg';
    const payload = JSON.stringify({
      title: notificationTitle,
      body: notificationBody,
      icon: ICON,
      badge: ICON,
      url: '/',
      timestamp: Date.now()
    });

    let successCount = 0;
    let failCount = 0;

    const promises = [];
    for (const member of memberships) {
      if (!member.push_subscription) continue;

      promises.push(
        webpush.sendNotification(member.push_subscription, payload)
          .then(() => {
            console.log(`Sent to ${member.user_name || member.id}`);
            successCount++;
          })
          .catch(err => {
            console.error(`Failed to send to ${member.id}: ${err.statusCode} ${err.message}`);
            failCount++;
            if (err.statusCode === 410 || err.statusCode === 404) {
              base44.asServiceRole.entities.Membership.update(member.id, {
                push_subscription: null,
                push_enabled: false
              });
            }
          })
      );
    }

    await Promise.all(promises);

    console.log(`Match notification sent: "${notificationTitle}" → ${successCount} delivered, ${failCount} failed`);

    return Response.json({
      success: true,
      sent: successCount,
      failed: failCount,
      title: notificationTitle,
      fixture: nextMatch.opponent
    });

  } catch (error) {
    console.error('Match week notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});