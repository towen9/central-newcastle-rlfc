import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all fixtures with match_status: scheduled
    const fixtures = await base44.asServiceRole.entities.Fixture.filter({ match_status: 'scheduled' });

    const now = new Date();
    const toComplete = fixtures.filter(f => {
      if (!f.date_time) return false;
      const matchTime = new Date(f.date_time);
      // Mark as full_time if the match started more than 3 hours ago
      return (now - matchTime) > 3 * 60 * 60 * 1000;
    });

    console.log(`Found ${toComplete.length} fixtures to mark as full_time out of ${fixtures.length} scheduled`);

    let completed = 0;
    for (const fixture of toComplete) {
      const kickoffTime = new Date(fixture.date_time);
      const fullTimeAt = new Date(kickoffTime.getTime() + 3 * 60 * 60 * 1000).toISOString();
      await base44.asServiceRole.entities.Fixture.update(fixture.id, {
        match_status: 'full_time',
        full_time_at: fullTimeAt
      });
      console.log(`Marked full_time: ${fixture.opponent} (${fixture.date_time})`);
      completed++;
    }

    return Response.json({
      success: true,
      checked: fixtures.length,
      completed,
      message: `Marked ${completed} fixture(s) as full_time`
    });
  } catch (error) {
    console.error('autoCompleteFixtures error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});