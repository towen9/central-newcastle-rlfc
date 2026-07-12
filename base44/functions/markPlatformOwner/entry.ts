import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * markPlatformOwner — Module 1 enabler.
 * Sets is_platform_owner=true on the User record(s) matching the given email(s).
 * Admin-only. Idempotent. Body: { emails: ["t.owen@nib.com.au", "tyneowen@live.com"] }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { emails } = await req.json();
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return Response.json({ error: 'Body must include emails: string[]' }, { status: 400 });
    }

    const results = [];
    for (const email of emails) {
      const matches = await base44.asServiceRole.entities.User.filter({ email });
      if (!matches || matches.length === 0) {
        results.push({ email, ok: false, error: 'no user found' });
        continue;
      }
      await base44.asServiceRole.entities.User.update(matches[0].id, { is_platform_owner: true });
      results.push({ email, ok: true, user_id: matches[0].id });
    }

    console.log('markPlatformOwner:', JSON.stringify(results));
    return Response.json({ success: results.every(r => r.ok), results });
  } catch (error) {
    console.error('markPlatformOwner error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
