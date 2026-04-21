import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { format, isSameDay, parseISO } from 'npm:date-fns';
import webpush from 'npm:web-push@3.6.7';

const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
const VAPID_PRIVATE_KEY = 'UUxhKMK7-T1N8WO9Jn5mDT5RqL9UB-s7D5qxGHxOWdg';

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
    const matchDate = parseISO(nextMatch.date_time);
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

    // Get active members with push enabled — no auth required, service role
    const [usersWithPush, activeMemberships] = await Promise.all([
      base44.asServiceRole.entities.User.filter({ push_enabled: true }),
      base44.asServiceRole.entities.Membership.filter({ status: 'active' })
    ]);
    const memberUserIds = new Set(activeMemberships.map(m => m.user_id));
    const targetUsers = usersWithPush.filter(u => memberUserIds.has(u.id) && u.push_subscription);

    const ICON = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6966ba172da6c09d1e1650bd/6b3832f4a_Butcherboyslogo.jpg';
    const payload = JSON.stringify({ title: notificationTitle, body: notificationBody, icon: ICON, badge: ICON, url: '/', timestamp: Date.now() });

    let successCount = 0;
    let failCount = 0;

    await Promise.all(targetUsers.map(u => {
      // push_subscription may be stored as a JSON string — parse it if so
      let subscription = u.push_subscription;
      if (typeof subscription === 'string') {
        try { subscription = JSON.parse(subscription); } catch { return; }
      }
      if (!subscription || !subscription.endpoint) return;

      return webpush.sendNotification(subscription, payload)
        .then(() => successCount++)
        .catch(err => {
          failCount++;
          console.error(`Push failed for user ${u.id}: ${err.statusCode} ${err.message}`);
          if (err.statusCode === 410 || err.statusCode === 404) {
            base44.asServiceRole.entities.User.update(u.id, { push_subscription: null });
          }
        });
    }));

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