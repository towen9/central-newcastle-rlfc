import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all men's DEC fixtures rounds 10-16
    const all = await base44.asServiceRole.entities.Fixture.filter({
        division: 'mens',
        team_grade: 'DEC'
    });

    const byRound = {};
    for (const f of all) {
        if (f.round_number >= 10 && f.round_number <= 16) {
            byRound[f.round_number] = f;
        }
    }

    // Authoritative data per round
    const updates = {
        10: {
            date_time: '2026-06-21T05:00:00Z'
            // Only date correction — leave everything else untouched
        },
        11: {
            opponent_name: 'Northern Hawks DEC',
            fixture_type: 'home',
            venue: 'St John Oval',
            date_time: '2026-06-28T05:00:00Z',
            match_status: 'scheduled'
        },
        12: {
            opponent_name: 'Macquarie Scorpions DEC',
            fixture_type: 'away',
            venue: 'Lyall Peacock Field',
            date_time: '2026-07-04T05:00:00Z',
            match_status: 'scheduled'
        },
        13: {
            opponent_name: 'South Newcastle Lions DEC',
            fixture_type: 'away',
            venue: 'Townson Oval',
            date_time: '2026-07-12T05:00:00Z',
            match_status: 'scheduled'
        },
        14: {
            opponent_name: 'Western Suburbs Rosellas DEC',
            fixture_type: 'home',
            venue: 'St John Oval',
            date_time: '2026-07-19T05:00:00Z',
            match_status: 'scheduled'
        },
        15: {
            opponent_name: 'Lakes United Seagulls DEC',
            fixture_type: 'home',
            venue: 'St John Oval',
            date_time: '2026-08-01T06:30:00Z',
            match_status: 'scheduled'
        },
        16: {
            opponent_name: 'Cessnock Goannas DEC',
            fixture_type: 'away',
            venue: 'Baddeley Park, Cessnock Sports Ground',
            date_time: '2026-08-08T05:00:00Z',
            match_status: 'scheduled'
        }
    };

    const results = [];

    for (const [roundStr, updateData] of Object.entries(updates)) {
        const round = parseInt(roundStr);
        const fixture = byRound[round];

        if (!fixture) {
            results.push({ round, status: 'NOT_FOUND' });
            continue;
        }

        // Snapshot before
        const before = {
            id: fixture.id,
            round_number: fixture.round_number,
            opponent: fixture.opponent,
            opponent_name: fixture.opponent_name,
            fixture_type: fixture.fixture_type,
            venue: fixture.venue,
            date_time: fixture.date_time,
            match_status: fixture.match_status
        };

        await base44.asServiceRole.entities.Fixture.update(fixture.id, updateData);

        // Read back to confirm stored values
        const all2 = await base44.asServiceRole.entities.Fixture.filter({ division: 'mens', team_grade: 'DEC' });
        const updated = all2.find(f => f.id === fixture.id);

        // Convert UTC to AEST (UTC+10, no DST in winter)
        const toAEST = (utcStr) => {
            if (!utcStr) return null;
            const dt = new Date(utcStr);
            // Add 10 hours
            const aest = new Date(dt.getTime() + 10 * 60 * 60 * 1000);
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const day = days[aest.getUTCDay()];
            const date = aest.getUTCDate();
            const month = months[aest.getUTCMonth()];
            const h = aest.getUTCHours();
            const m = aest.getUTCMinutes();
            const hh = h % 12 === 0 ? 12 : h % 12;
            const ampm = h >= 12 ? 'pm' : 'am';
            const mm = m === 0 ? '' : `:${String(m).padStart(2, '0')}`;
            return `${day} ${date} ${month} ${hh}${mm}${ampm} AEST`;
        };

        results.push({
            round,
            status: 'UPDATED',
            before,
            after: {
                id: updated?.id,
                round_number: updated?.round_number,
                opponent: updated?.opponent,
                opponent_name: updated?.opponent_name,
                fixture_type: updated?.fixture_type,
                venue: updated?.venue,
                date_time_utc: updated?.date_time,
                date_time_aest: toAEST(updated?.date_time),
                match_status: updated?.match_status
            }
        });
    }

    // Final check: any men's DEC fixtures with missing or non-scheduled match_status (excluding full_time)
    const finalAll = await base44.asServiceRole.entities.Fixture.filter({ division: 'mens', team_grade: 'DEC' });
    const anomalies = finalAll.filter(f =>
        f.match_status !== 'scheduled' && f.match_status !== 'full_time' && f.match_status !== 'postponed'
    ).map(f => ({
        round_number: f.round_number,
        opponent: f.opponent,
        match_status: f.match_status,
        date_time: f.date_time
    }));

    return Response.json({ success: true, results, anomalies });
});