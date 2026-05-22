import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Find the Round 6 DEC fixture
    const fixtures = await base44.asServiceRole.entities.Fixture.filter({
        round_number: 6,
        division: 'mens',
        team_grade: 'DEC'
    });

    const fixture = fixtures.find(f => f.opponent && f.opponent.includes('Entrance Tigers'));

    if (!fixture) {
        return Response.json({ error: 'Fixture not found' }, { status: 404 });
    }

    // Update ONLY date_time — nothing else
    await base44.asServiceRole.entities.Fixture.update(fixture.id, {
        date_time: '2026-05-23T04:00:00Z'
    });

    // Re-fetch to confirm final state
    const updated = await base44.asServiceRole.entities.Fixture.filter({
        round_number: 6,
        division: 'mens',
        team_grade: 'DEC'
    });
    const final = updated.find(f => f.opponent && f.opponent.includes('Entrance Tigers'));

    // Current Sydney time
    const nowSydney = new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney', hour12: false });

    return Response.json({
        confirmed_date_time: final.date_time,
        wednesday_preview_sent_at: final.wednesday_preview_sent_at ?? null,
        friday_reminder_sent_at: final.friday_reminder_sent_at ?? null,
        matchday_alert_sent_at: final.matchday_alert_sent_at ?? null,
        match_status: final.match_status,
        current_sydney_time: nowSydney
    });
});