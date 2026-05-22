import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
        return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const toAEST = (utcStr) => {
        const dt = new Date(utcStr);
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

    const fixtures = [
        {
            round_number: 11,
            opponent: 'Northern Hawks DEC',
            opponent_name: 'Northern Hawks DEC',
            fixture_type: 'home',
            venue: 'St John Oval',
            date_time: '2026-06-28T05:00:00Z',
            match_status: 'scheduled'
        },
        {
            round_number: 12,
            opponent: 'Macquarie Scorpions DEC',
            opponent_name: 'Macquarie Scorpions DEC',
            fixture_type: 'away',
            venue: 'Lyall Peacock Field',
            date_time: '2026-07-04T05:00:00Z',
            match_status: 'scheduled'
        },
        {
            round_number: 13,
            opponent: 'South Newcastle Lions DEC',
            opponent_name: 'South Newcastle Lions DEC',
            fixture_type: 'away',
            venue: 'Townson Oval',
            date_time: '2026-07-12T05:00:00Z',
            match_status: 'scheduled'
        },
        {
            round_number: 14,
            opponent: 'Western Suburbs Rosellas DEC',
            opponent_name: 'Western Suburbs Rosellas DEC',
            fixture_type: 'home',
            venue: 'St John Oval',
            date_time: '2026-07-19T05:00:00Z',
            match_status: 'scheduled'
        },
        {
            round_number: 15,
            opponent: 'Lakes United Seagulls DEC',
            opponent_name: 'Lakes United Seagulls DEC',
            fixture_type: 'home',
            venue: 'St John Oval',
            date_time: '2026-08-01T06:30:00Z',
            match_status: 'scheduled'
        },
        {
            round_number: 16,
            opponent: 'Cessnock Goannas DEC',
            opponent_name: 'Cessnock Goannas DEC',
            fixture_type: 'away',
            venue: 'Baddeley Park, Cessnock Sports Ground',
            date_time: '2026-08-08T05:00:00Z',
            match_status: 'scheduled'
        }
    ];

    const results = [];

    for (const f of fixtures) {
        const created = await base44.asServiceRole.entities.Fixture.create({
            ...f,
            division: 'mens',
            team_grade: 'DEC',
            competition: '2026 Denton Engineering Cup',
            status: 'upcoming',
            score_us: 0,
            score_them: 0,
            entry_enabled: false,
            entry_price: 0
        });

        results.push({
            round: f.round_number,
            id: created.id,
            opponent: created.opponent,
            opponent_name: created.opponent_name,
            fixture_type: created.fixture_type,
            venue: created.venue,
            date_time_utc: created.date_time,
            date_time_aest: toAEST(created.date_time),
            match_status: created.match_status
        });
    }

    return Response.json({ success: true, created: results.length, results });
});