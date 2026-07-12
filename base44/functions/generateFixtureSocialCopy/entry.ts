import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { format } from 'npm:date-fns';

// Module 0 step 7b: Club record is the tenant source of truth; ClubSettings is legacy fallback.
async function resolveClub(sb, clubId) {
  let club = { club_name: 'Central Newcastle RLFC', short_name: 'Butcher Boys', club_short_name: 'Central Newcastle', team_short: 'Central', venue_name: 'St John Oval', sport_emoji: '🏉', app_url: '', contact_email: '' };
  try {
    let rec = null;
    if (clubId) {
      const byId = await sb.entities.Club.filter({ id: clubId });
      rec = byId && byId[0];
    }
    if (!rec) {
      const live = await sb.entities.Club.filter({ status: 'live', is_active: true });
      if (live && live.length === 1) rec = live[0];
    }
    if (rec) {
      return {
        ...club,
        club_name: rec.name || club.club_name,
        short_name: rec.short_name || club.short_name,
        club_short_name: rec.club_short_name || club.club_short_name,
        team_short: rec.team_short || club.team_short,
        venue_name: rec.venue_name || club.venue_name,
        sport_emoji: rec.sport_emoji || club.sport_emoji,
        app_url: rec.app_url || club.app_url,
        contact_email: rec.contact_email || club.contact_email
      };
    }
    const settings = await sb.entities.ClubSettings.filter({ is_active: true });
    if (settings && settings[0]) club = { ...club, ...settings[0] };
  } catch (_) { /* fall back to defaults */ }
  return club;
}

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

    // Resolve club identity from the fixture's tenant
    const club = await resolveClub(base44.asServiceRole, fixture.club_id);

    let socialCopy = '';

    if (type === 'preview' || !type) {
      // Generate match preview copy
      const matchDay = format(new Date(fixture.date_time), 'EEEE');
      const matchTime = format(new Date(fixture.date_time), 'h:mma');
      const matchDate = format(new Date(fixture.date_time), 'MMM d');
      
      const roundText = fixture.round_number ? `Round ${fixture.round_number}` : 'Match Day';
      const sponsorText = fixture.sponsor_of_round ? `\n\nProudly supported by ${fixture.sponsor_of_round}` : '';
      const gradeText = fixture.team_grade ? `\n${fixture.team_grade}` : '\nAll grades in action';
      
      socialCopy = `${club.sport_emoji} ${roundText} – ${club.team_short} v ${fixture.opponent}
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
        ? `⚡ Full Time: ${club.team_short} ${ourScore} def ${fixture.opponent} ${theirScore}`
        : `Full Time: ${fixture.opponent} ${theirScore} def ${club.team_short} ${ourScore}`;

      const performanceText = isWin 
        ? `Strong performance from the ${club.short_name}.`
        : 'Tough contest today.';

      const sponsorText = fixture.sponsor_of_round 
        ? `\n\nThanks to ${fixture.sponsor_of_round} for their support.` 
        : '';

      socialCopy = `${resultText}

${performanceText}${sponsorText}

#${club.club_short_name.replace(/\s/g, '')} #${club.short_name.replace(/\s/g, '')}`;

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