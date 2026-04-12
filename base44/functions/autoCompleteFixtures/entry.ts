import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all upcoming fixtures
    const fixtures = await base44.asServiceRole.entities.Fixture.filter({ status: 'upcoming' });

    const now = new Date();
    const toComplete = fixtures.filter(f => {
      if (!f.date_time) return false;
      const matchTime = new Date(f.date_time);
      // Mark as completed if the match started more than 3 hours ago
      return (now - matchTime) > 3 * 60 * 60 * 1000;
    });

    console.log(`Found ${toComplete.length} fixtures to mark as completed out of ${fixtures.length} upcoming`);

    let completed = 0;
    for (const fixture of toComplete) {
      await base44.asServiceRole.entities.Fixture.update(fixture.id, { status: 'completed' });
      console.log(`Marked completed: ${fixture.opponent} (${fixture.date_time})`);
      completed++;
    }

    return Response.json({ 
      success: true, 
      checked: fixtures.length,
      completed,
      message: `Marked ${completed} fixture(s) as completed`
    });
  } catch (error) {
    console.error('autoCompleteFixtures error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});