import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { message, target } = await req.json();

    if (!message) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !fromNumber) {
      return Response.json({ 
        error: 'Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in settings.' 
      }, { status: 500 });
    }

    // Fetch target users
    let users = [];
    if (target === 'all') {
      users = await base44.asServiceRole.entities.User.list();
    } else if (target === 'members') {
      const memberships = await base44.asServiceRole.entities.Membership.filter({ status: 'active' });
      const userIds = [...new Set(memberships.map(m => m.user_id))];
      users = await Promise.all(userIds.map(id => base44.asServiceRole.entities.User.get(id)));
    } else if (target === 'daypass') {
      const dayPasses = await base44.asServiceRole.entities.GameDayEntry.filter({ day_pass_tag: true });
      users = dayPasses.map(dp => ({ id: dp.user_id, mobile: dp.mobile, full_name: dp.first_name + ' ' + dp.last_name }));
    }

    // Filter users with valid mobile numbers
    const validUsers = users.filter(u => u.mobile && u.mobile.trim());

    let sent = 0;
    let failed = 0;
    const errors = [];

    // Send SMS to each user
    for (const targetUser of validUsers) {
      try {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        
        const formData = new URLSearchParams();
        formData.append('To', targetUser.mobile);
        formData.append('From', fromNumber);
        formData.append('Body', message);

        const response = await fetch(twilioUrl, {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: formData
        });

        if (response.ok) {
          sent++;
        } else {
          failed++;
          const errorData = await response.json();
          errors.push({ user: targetUser.full_name, mobile: targetUser.mobile, error: errorData.message });
        }
      } catch (error) {
        failed++;
        errors.push({ user: targetUser.full_name, mobile: targetUser.mobile, error: error.message });
      }
    }

    return Response.json({ 
      success: true,
      sent,
      failed,
      total: validUsers.length,
      errors: errors.slice(0, 10) // Return first 10 errors only
    });

  } catch (error) {
    console.error('SMS send error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});