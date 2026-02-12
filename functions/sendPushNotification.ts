import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import webpush from 'npm:web-push@3.6.7';

// VAPID keys for web push (same public key used in frontend)
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
const VAPID_PRIVATE_KEY = 'UUxhKMK7-T1N8WO9Jn5mDT5RqL9UB-s7D5qxGHxOWdg';

webpush.setVapidDetails(
  'mailto:admin@centralrlfc.com.au',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin only
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { title, body, url, targetGroup } = await req.json();

    if (!title || !body) {
      return Response.json({ error: 'Title and body required' }, { status: 400 });
    }

    // Get all users with push enabled
    const users = await base44.asServiceRole.entities.User.filter({ push_enabled: true });
    
    let targetUsers = users;

    // Filter by target group if specified
    if (targetGroup === 'members') {
      const memberships = await base44.asServiceRole.entities.Membership.filter({ status: 'active' });
      const memberUserIds = memberships.map(m => m.user_id);
      targetUsers = users.filter(u => memberUserIds.includes(u.id));
    } else if (targetGroup === 'daypass') {
      const dayPassEntries = await base44.asServiceRole.entities.GameDayEntry.filter({ day_pass_tag: true });
      const dayPassEmails = dayPassEntries.map(e => e.email);
      targetUsers = users.filter(u => dayPassEmails.includes(u.email));
    }

    const promises = [];
    let successCount = 0;
    let failCount = 0;

    for (const targetUser of targetUsers) {
      if (!targetUser.push_subscription) continue;

      const payload = JSON.stringify({
        title,
        body,
        icon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6966ba172da6c09d1e1650bd/6b3832f4a_Butcherboyslogo.jpg',
        badge: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6966ba172da6c09d1e1650bd/6b3832f4a_Butcherboyslogo.jpg',
        url: url || '/',
        timestamp: Date.now()
      });

      promises.push(
        webpush.sendNotification(targetUser.push_subscription, payload)
          .then(() => successCount++)
          .catch((err) => {
            console.error(`Failed to send to user ${targetUser.id}:`, err);
            failCount++;
            
            // If subscription is invalid, remove it
            if (err.statusCode === 410 || err.statusCode === 404) {
              base44.asServiceRole.entities.User.update(targetUser.id, {
                push_subscription: null
              });
            }
          })
      );
    }

    await Promise.all(promises);

    return Response.json({ 
      success: true,
      sent: successCount,
      failed: failCount,
      total: targetUsers.length
    });
  } catch (error) {
    console.error('Push notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});