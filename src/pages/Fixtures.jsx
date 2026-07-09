import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, Trophy, Users, ChevronRight } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, isAfter, isBefore } from 'date-fns';
import clubConfig from '@/config/club.config';
import GlassCard from '@/components/ui-kit/GlassCard';
import Eyebrow from '@/components/ui-kit/Eyebrow';
import SectionHead from '@/components/ui-kit/SectionHead';
import GoldButton from '@/components/ui-kit/GoldButton';
import { SkeletonCard } from '@/components/ui-kit/Skeleton';
import MatchDayBadge from '@/components/ui-kit/MatchDayBadge';

const t = clubConfig.theme;

const teamLogos = {
  'Kurri Kurri Bulldogs': 'https://mysideline-prod.s3.amazonaws.com/logos/full-size/251954.jpg?1576033278946',
  'Maitland Pickers': 'https://mysideline-prod.s3.amazonaws.com/logos/full-size/251957.png?1643870767120',
  'Macquarie Scorpions': 'https://mysideline-prod.s3.amazonaws.com/logos/full-size/251956.png?1734484082186',
  'Western Suburbs Rosellas': 'https://mysideline-prod.s3.amazonaws.com/logos/full-size/251959.jpg?1576112582264',
  'Cessnock Goannas': 'https://mysideline-prod.s3.amazonaws.com/logos/full-size/251953.png?1576112376038',
  'The Entrance Tigers': 'https://mysideline-prod.s3.amazonaws.com/logos/resize/12224.png?1572589619112',
  'Northern Hawks': 'https://mysideline-prod.s3.amazonaws.com/logos/full-size/344002.JPG?1646219499038',
  'South Newcastle Lions': 'https://mysideline-prod.s3.amazonaws.com/logos/full-size/251958.png?1576112564731',
  'Lakes United Seagulls': 'https://mysideline-prod.s3.amazonaws.com/logos/full-size/251955.png'
};

function gradeChipLabel(fixture) {
  const grade = fixture.team_grade || '';
  const division = fixture.division;
  if (division === 'womens') return grade || "Women's";
  if (grade === 'DEC') return 'First Grade';
  if (grade === 'WT') return "Women's Tackle";
  if (grade === 'RES') return 'Reserves';
  return grade || 'First Grade';
}

export default function Fixtures() {
  const [activeTab, setActiveTab] = useState('fixtures');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: fixtures = [], isLoading: fixturesLoading } = useQuery({
    queryKey: ['fixtures'],
    queryFn: () => base44.entities.Fixture.list('date_time')
  });

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.Event.filter({ is_active: true }, 'date_time')
  });

  // Membership query — same pattern as Home
  const { data: membership } = useQuery({
    queryKey: ['membership', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const memberships = await base44.entities.Membership.filter({ user_id: user.id, status: 'active' });
      return memberships[0] || null;
    },
    enabled: !!user?.id
  });

  // Deduplicate defensively by id (known Macquarie Scorpions DEC duplicate)
  const dedupedFixtures = React.useMemo(() => {
    const seen = new Set();
    return fixtures.filter(f => {
      if (seen.has(f.id)) return false;
      seen.add(f.id);
      return true;
    });
  }, [fixtures]);

  // Build distinct grade chips from data
  const gradeChips = React.useMemo(() => {
    const grades = [];
    const seen = new Set();
    dedupedFixtures.forEach(f => {
      const label = gradeChipLabel(f);
      if (!seen.has(label)) {
        seen.add(label);
        grades.push(label);
      }
    });
    return grades.sort();
  }, [dedupedFixtures]);

  const filteredFixtures = selectedGrade === 'all'
    ? dedupedFixtures
    : dedupedFixtures.filter(f => gradeChipLabel(f) === selectedGrade);

  const upcomingFixtures = filteredFixtures
    .filter(f => f.status === 'live' || isAfter(new Date(f.date_time), new Date()))
    .sort((a, b) => new Date(a.date_time) - new Date(b.date_time));

  const pastFixtures = filteredFixtures
    .filter(f => f.status !== 'live' && isBefore(new Date(f.date_time), new Date()))
    .sort((a, b) => new Date(b.date_time) - new Date(a.date_time));

  const nextMatch = upcomingFixtures[0];

  // Group fixtures by month
  const upcomingByMonth = React.useMemo(() => {
    const groups = {};
    upcomingFixtures.forEach(f => {
      const monthKey = format(new Date(f.date_time), 'yyyy-MM');
      const monthLabel = format(new Date(f.date_time), 'MMMM yyyy');
      if (!groups[monthKey]) groups[monthKey] = { label: monthLabel, fixtures: [] };
      groups[monthKey].fixtures.push(f);
    });
    return Object.values(groups);
  }, [upcomingFixtures]);

  const upcomingEvents = events.filter(e => isAfter(new Date(e.date_time), new Date()));

  const hasScore = (f) => typeof f.score_us === 'number' && typeof f.score_them === 'number';

  if (!clubConfig.features?.fixtures) {
    return <Navigate to={createPageUrl('Home')} replace />;
  }

  return (
    <div className="min-h-full pb-24">
      {/* Header */}
      <div className="px-5 pt-6 pb-2">
        <Eyebrow color={t.gold}>{clubConfig.season.label}</Eyebrow>
        <h1 className="text-white text-2xl mt-1" style={{ fontFamily: t.fontDisplay }}>Fixtures</h1>
      </div>

      {/* Grade filter chips */}
      {gradeChips.length > 0 && (
        <div className="px-5 mb-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
            <FilterChip
              label="All"
              active={selectedGrade === 'all'}
              onClick={() => setSelectedGrade('all')}
            />
            {gradeChips.map(grade => (
              <FilterChip
                key={grade}
                label={grade}
                active={selectedGrade === grade}
                onClick={() => setSelectedGrade(grade)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="px-5">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-5">
          <TabsList className="w-full" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <TabsTrigger value="fixtures" className="flex-1 text-white data-[state=active]:text-white">
              <Trophy className="w-4 h-4 mr-2" />
              Fixtures
            </TabsTrigger>
            <TabsTrigger value="events" className="flex-1 text-white data-[state=active]:text-white">
              <Calendar className="w-4 h-4 mr-2" />
              Events
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab === 'fixtures' && (
          <div className="space-y-6">
            {fixturesLoading ? (
              <div className="space-y-3">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : (
              <>
                {/* Next match spotlight */}
                {nextMatch && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <GlassCard
                      className="p-5"
                      style={{ borderColor: `${t.gold}55`, boxShadow: `0 0 24px ${t.gold}1a, 0 8px 32px rgba(0,0,0,0.3)` }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <Eyebrow color={t.gold}>Next Match</Eyebrow>
                        <MatchDayBadge date={nextMatch.date_time} />
                      </div>

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex flex-col items-center gap-1.5 flex-1">
                          <div className="w-12 h-12 bg-white rounded-full p-1 flex items-center justify-center">
                            <img src={clubConfig.identity.logo_url} alt="" className="w-full h-full object-contain" loading="lazy" />
                          </div>
                          <span className="text-[10px] font-semibold text-white/70" style={{ fontFamily: t.fontBody }}>{clubConfig.identity.team_short}</span>
                        </div>
                        <div className="flex flex-col items-center px-4">
                          <span className="text-[10px] uppercase tracking-wider text-white/30 mb-1">vs</span>
                          <span className="text-white text-lg text-center" style={{ fontFamily: t.fontDisplay }}>{nextMatch.opponent}</span>
                          <span className="text-[10px] text-white/40 mt-1" style={{ fontFamily: t.fontBody }}>{gradeChipLabel(nextMatch)}</span>
                        </div>
                        <div className="flex flex-col items-center gap-1.5 flex-1">
                          {teamLogos[nextMatch.opponent] ? (
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center overflow-hidden">
                              <img src={teamLogos[nextMatch.opponent]} alt="" className="w-full h-full object-contain" loading="lazy" />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                              <span className="text-white/40 text-lg" style={{ fontFamily: t.fontDisplay }}>{nextMatch.opponent?.charAt(0) || '?'}</span>
                            </div>
                          )}
                          <span className="text-[10px] font-semibold text-white/70" style={{ fontFamily: t.fontBody }}>Opponent</span>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-sm">
                        <div className="flex items-center gap-2 text-white/70">
                          <Calendar className="w-3.5 h-3.5" style={{ color: t.gold }} />
                          <span style={{ fontFamily: t.fontBody }}>{format(new Date(nextMatch.date_time), 'EEEE, MMM d')} • {format(new Date(nextMatch.date_time), 'h:mma')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/70">
                          <MapPin className="w-3.5 h-3.5" style={{ color: t.gold }} />
                          <span style={{ fontFamily: t.fontBody }}>{nextMatch.venue || clubConfig.identity.venue_name}</span>
                        </div>
                      </div>

                      {nextMatch.fixture_type === 'home' && (
                        <div className="mt-4">
                          {membership ? (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: `${t.green}1a`, color: t.green }}>
                              <span className="w-2 h-2 rounded-full" style={{ background: t.green }} />
                              <span className="text-xs font-semibold" style={{ fontFamily: t.fontBody }}>You're in — pass ready</span>
                            </div>
                          ) : (
                            <GoldButton
                              variant="outline"
                              fullWidth
                              onClick={() => window.location.href = createPageUrl('DayPass') + `?fixtureId=${nextMatch.id}`}
                            >
                              Get Day Pass
                            </GoldButton>
                          )}
                        </div>
                      )}
                    </GlassCard>
                  </motion.div>
                )}

                {/* Fixture list grouped by month */}
                {upcomingByMonth.length === 0 && !nextMatch ? (
                  <EmptyState />
                ) : (
                  upcomingByMonth.map(monthGroup => (
                    <div key={monthGroup.label}>
                      <SectionHead title={monthGroup.label} />
                      <div className="space-y-2.5">
                        {monthGroup.fixtures.map((fixture, idx) => (
                          <FixtureRow
                            key={fixture.id}
                            fixture={fixture}
                            hasMembership={!!membership}
                            index={idx}
                          />
                        ))}
                      </div>
                    </div>
                  ))
                )}

                {/* Past results */}
                {pastFixtures.length > 0 && (
                  <div>
                    <SectionHead title="Recent Results" />
                    <div className="space-y-2.5">
                      {pastFixtures.slice(0, 5).map((fixture, idx) => (
                        <FixtureRow key={fixture.id} fixture={fixture} hasMembership={!!membership} index={idx} isPast />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-4">
            {upcomingEvents.length === 0 ? (
              <GlassCard className="p-8 text-center">
                <Users className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
                <p className="text-white/60 text-sm" style={{ fontFamily: t.fontBody }}>No upcoming events</p>
                <p className="text-white/40 text-xs mt-1" style={{ fontFamily: t.fontBody }}>Check back soon for club events</p>
              </GlassCard>
            ) : (
              upcomingEvents.map((event, idx) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <GlassCard className="overflow-hidden">
                    {event.image_url && (
                      <img src={event.image_url} alt={event.title} className="w-full h-40 object-cover" />
                    )}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span
                            className="inline-block px-2 py-1 rounded-full text-xs font-medium mb-2"
                            style={{ background: `${t.royal}22`, color: t.cyan }}
                          >
                            {event.event_type?.replace('_', ' ')}
                          </span>
                          <h3 className="text-white font-semibold" style={{ fontFamily: t.fontBody }}>{event.title}</h3>
                        </div>
                        {event.is_members_only && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ background: `${t.gold}22`, color: t.gold }}>
                            Members Only
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-white/50 mb-4 line-clamp-2" style={{ fontFamily: t.fontBody }}>{event.description}</p>

                      <div className="flex items-center gap-4 text-sm text-white/50 mb-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(event.date_time), 'MMM d, yyyy')}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {format(new Date(event.date_time), 'h:mm a')}
                        </div>
                      </div>

                      {event.venue && (
                        <div className="flex items-center gap-2 text-sm text-white/50 mb-4">
                          <MapPin className="w-4 h-4" />
                          {event.venue}
                        </div>
                      )}

                      {event.registration_url && (
                        <a href={event.registration_url} target="_blank" rel="noopener noreferrer">
                          <GoldButton fullWidth>
                            Register Now
                            <ChevronRight className="w-4 h-4" />
                          </GoldButton>
                        </a>
                      )}
                    </div>
                  </GlassCard>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all"
      style={active
        ? { background: `${t.gold}22`, color: t.goldHi, border: `1px solid ${t.gold}66`, fontFamily: t.fontBody }
        : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: t.fontBody }
      }
    >
      {label}
    </button>
  );
}

function FixtureRow({ fixture, hasMembership, index, isPast }) {
  const fixtureDate = new Date(fixture.date_time);
  const isHome = fixture.fixture_type === 'home';
  const scoreExists = typeof fixture.score_us === 'number' && typeof fixture.score_them === 'number';
  const won = scoreExists && fixture.score_us > fixture.score_them;
  const lost = scoreExists && fixture.score_us < fixture.score_them;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: isPast ? 0.5 : 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <GlassCard className="overflow-hidden" style={{ position: 'relative' }}>
        {/* Home gold left-edge accent */}
        {isHome && (
          <div
            style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: t.gold, borderRadius: '4px 0 0 4px' }}
          />
        )}

        <div className="flex items-center gap-3 p-3.5" style={{ paddingLeft: isHome ? 18 : 14 }}>
          {/* Date block */}
          <div className="flex-shrink-0 w-12 text-center">
            <p className="text-white text-xl leading-none" style={{ fontFamily: t.fontDisplay }}>
              {format(fixtureDate, 'd')}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-white/40 mt-1" style={{ fontFamily: t.fontBody }}>
              {format(fixtureDate, 'EEE')}
            </p>
          </div>

          {/* Divider */}
          <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(255,255,255,0.06)' }} />

          {/* Opponent + grade */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {isHome && (
                <Eyebrow color={t.gold}>{clubConfig.identity.venue_name}</Eyebrow>
              )}
              {!isHome && fixture.venue && (
                <span className="text-[9px] text-white/30 uppercase tracking-wider truncate" style={{ fontFamily: t.fontBody }}>
                  {fixture.venue}
                </span>
              )}
            </div>
            <p className="text-white text-sm font-semibold truncate mt-0.5" style={{ fontFamily: t.fontBody }}>
              {fixture.opponent}
            </p>
            <p className="text-[10px] text-white/40" style={{ fontFamily: t.fontBody }}>
              {gradeChipLabel(fixture)} • {isHome ? 'Home' : 'Away'}
            </p>
            {(fixture.status === 'cancelled' || fixture.status === 'postponed') && (
              <span
                className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
                style={{
                  background: fixture.status === 'cancelled' ? 'rgba(220,38,38,0.15)' : 'rgba(245,158,11,0.15)',
                  color: fixture.status === 'cancelled' ? '#f87171' : '#fbbf24',
                }}
              >
                {fixture.status === 'cancelled' ? 'Cancelled' : 'Postponed'}
              </span>
            )}
          </div>

          {/* Right: time, score, or day pass */}
          <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
            {isPast && scoreExists ? (
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-sm" style={{ fontFamily: t.fontDisplay }}>
                  {fixture.score_us} - {fixture.score_them}
                </span>
                {won && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: `${t.green}22`, color: t.green }}>W</span>}
                {lost && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>L</span>}
                {!won && !lost && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>D</span>}
              </div>
            ) : (
              <>
                <span className="text-white/60 text-xs" style={{ fontFamily: t.fontBody }}>
                  {format(fixtureDate, 'h:mma')}
                </span>
                {isHome && (
                  hasMembership ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: `${t.green}1a`, color: t.green }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: t.green }} />
                      <span className="text-[9px] font-semibold" style={{ fontFamily: t.fontBody }}>In</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => window.location.href = createPageUrl('DayPass') + `?fixtureId=${fixture.id}`}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
                      style={{ border: `1px solid ${t.gold}`, color: t.gold, fontFamily: t.fontBody }}
                    >
                      Day Pass
                    </button>
                  )
                )}
              </>
            )}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <GlassCard className="p-8 text-center">
      <Calendar className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
      <p className="text-white/60 text-sm font-semibold" style={{ fontFamily: t.fontBody }}>Season draw coming soon.</p>
      <p className="text-white/40 text-xs mt-1" style={{ fontFamily: t.fontBody }}>Check back for the full {clubConfig.season.year} fixture list.</p>
    </GlassCard>
  );
}