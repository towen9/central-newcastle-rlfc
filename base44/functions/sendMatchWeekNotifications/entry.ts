import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { format, addDays, isSameDay, parseISO } from 'npm:date-fns';

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

    // Send push notification
    await base44.asServiceRole.functions.invoke('sendPushNotification', {
      title: notificationTitle,
      message: notificationBody,
      targetGroup: 'members'
    });

    return Response.json({ 
      success: true,
      sent: true,
      title: notificationTitle,
      fixture: nextMatch.opponent
    });

  } catch (error) {
    console.error('Match week notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});