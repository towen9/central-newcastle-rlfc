import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { format } from 'npm:date-fns';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { fixtureId, type } = await req.json();

    if (!fixtureId) {
      return Response.json({ error: 'Fixture ID required' }, { status: 400 });
    }

    const fixture = await base44.asServiceRole.entities.Fixture.get(fixtureId);

    if (!fixture) {
      return Response.json({ error: 'Fixture not found' }, { status: 404 });
    }

    let socialCopy = '';

    if (type === 'preview' || !type) {
      // Generate match preview copy
      const matchDay = format(new Date(fixture.date_time), 'EEEE');
      const matchTime = format(new Date(fixture.date_time), 'h:mma');
      const matchDate = format(new Date(fixture.date_time), 'MMM d');
      
      const roundText = fixture.round_number ? `Round ${fixture.round_number}` : 'Match Day';
      const sponsorText = fixture.sponsor_of_round ? `\n\nProudly supported by ${fixture.sponsor_of_round}` : '';
      const gradeText = fixture.team_grade ? `\n${fixture.team_grade}` : '\nAll grades in action';
      
      socialCopy = `🏉 ${roundText} – Central v ${fixture.opponent}
${matchDay} ${matchTime} | ${fixture.venue || 'TBA'}${gradeText}

See you there!${sponsorText}`;

      // Save to fixture
      await base44.asServiceRole.entities.Fixture.update(fixtureId, {
        social_copy_preview: socialCopy
      });
    } 
    else if (type === 'postgame') {
      // Generate post-game summary
      if (!fixture.result_home || !fixture.result_away) {
        return Response.json({ 
          error: 'Match result required. Please enter scores first.' 
        }, { status: 400 });
      }

      const isWin = fixture.fixture_type === 'home' 
        ? fixture.result_home > fixture.result_away
        : fixture.result_away > fixture.result_home;

      const ourScore = fixture.fixture_type === 'home' ? fixture.result_home : fixture.result_away;
      const theirScore = fixture.fixture_type === 'home' ? fixture.result_away : fixture.result_home;

      const resultText = isWin 
        ? `⚡ Full Time: Central ${ourScore} def ${fixture.opponent} ${theirScore}`
        : `Full Time: ${fixture.opponent} ${theirScore} def Central ${ourScore}`;

      const performanceText = isWin 
        ? 'Strong performance from the Butcher Boys.'
        : 'Tough contest today.';

      const sponsorText = fixture.sponsor_of_round 
        ? `\n\nThanks to ${fixture.sponsor_of_round} for their support.` 
        : '';

      socialCopy = `${resultText}

${performanceText}${sponsorText}

#CentralNewcastle #ButcherBoys`;

      // Save to fixture
      await base44.asServiceRole.entities.Fixture.update(fixtureId, {
        social_copy_postgame: socialCopy
      });
    }

    return Response.json({ 
      success: true, 
      copy: socialCopy,
      fixture: fixture
    });

  } catch (error) {
    console.error('Social copy generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});