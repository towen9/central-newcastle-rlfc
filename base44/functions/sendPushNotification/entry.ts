import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import webpush from 'npm:web-push@3.6.7';

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

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { title, body, url, targetGroup } = await req.json();

    if (!title || !body) {
      return Response.json({ error: 'Title and body required' }, { status: 400 });
    }

    // Get memberships with push subscriptions saved
    let memberships = await base44.asServiceRole.entities.Membership.filter({ push_enabled: true });

    // Filter by target group
    if (targetGroup === 'members') {
      memberships = memberships.filter(m => m.status === 'active');
    } else if (targetGroup === 'daypass') {
      memberships = memberships.filter(m => m.tier_name?.includes('Day Pass'));
    }

    const promises = [];
    let successCount = 0;
    let failCount = 0;

    for (const member of memberships) {
      if (!member.push_subscription) continue;

      const payload = JSON.stringify({
        title,
        body,
        icon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6966ba172da6c09d1e1650bd/6b3832f4a_Butcherboyslogo.jpg',
        badge: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6966ba172da6c09d1e1650bd/6b3832f4a_Butcherboyslogo.jpg',
        url: url || '/',
        timestamp: Date.now()
      });

      promises.push(
        webpush.sendNotification(member.push_subscription, payload)
          .then(() => successCount++)
          .catch((err) => {
            console.error(`Failed to send to member ${member.id}:`, err);
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

    return Response.json({ 
      success: true,
      sent: successCount,
      failed: failCount,
      total: memberships.length
    });
  } catch (error) {
    console.error('Push notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
