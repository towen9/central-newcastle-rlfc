import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// One-off admin utility: fix fixture dates and statuses.
// Kept for audit trail — safe to run again (idempotent).
Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const results = {};

    // 1. Ensure Round 6 men's DEC fixture has the correct date
    const mensDEC = await base44.asServiceRole.entities.Fixture.filter({
        round_number: 6, division: 'mens', team_grade: 'DEC'
    });
    const r6 = mensDEC.find(f => f.opponent && f.opponent.includes('Entrance Tigers'));
    if (r6) {
        await base44.asServiceRole.entities.Fixture.update(r6.id, {
            date_time: '2026-05-23T04:00:00Z'
        });
        results.round6_date = '2026-05-23T04:00:00Z';
        results.round6_id = r6.id;
    }

    // 2. Mark this week's women's Wests WT fixture as postponed
    const womensFixture = await base44.asServiceRole.entities.Fixture.filter({
        division: 'womens', status: 'upcoming'
    });
    // The fixture with wednesday_preview_sent_at set and date ~23 May
    const westsWT = womensFixture.find(f => f.opponent === 'Wests WT' && f.wednesday_preview_sent_at);
    if (westsWT) {
        await base44.asServiceRole.entities.Fixture.update(westsWT.id, {
            match_status: 'postponed'
        });
        results.womens_postponed = {
            id: westsWT.id,
            opponent: westsWT.opponent,
            date_time: westsWT.date_time,
            match_status: 'postponed',
            wednesday_preview_sent_at: westsWT.wednesday_preview_sent_at,
            friday_reminder_sent_at: westsWT.friday_reminder_sent_at ?? null,
            matchday_alert_sent_at: westsWT.matchday_alert_sent_at ?? null
        };
    }

    return Response.json({ success: true, results });
});