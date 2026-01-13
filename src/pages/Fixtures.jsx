import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, MapPin, Clock, Trophy, Ticket, Users, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { format, isAfter, isBefore, isToday } from 'date-fns';

export default function Fixtures() {
  const [activeTab, setActiveTab] = useState('fixtures');

  const { data: fixtures = [] } = useQuery({
    queryKey: ['fixtures'],
    queryFn: () => base44.entities.Fixture.list('date_time')
  });

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.Event.filter({ is_active: true }, 'date_time')
  });

  const upcomingFixtures = fixtures.filter(f => 
    f.status === 'upcoming' || f.status === 'live' || isAfter(new Date(f.date_time), new Date())
  );

  const pastFixtures = fixtures.filter(f => 
    f.status === 'completed' && isBefore(new Date(f.date_time), new Date())
  ).reverse();

  const upcomingEvents = events.filter(e => isAfter(new Date(e.date_time), new Date()));

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-[#1a365d] pt-safe">
        <div className="px-5 py-4 flex items-center gap-4">
          <Link to={createPageUrl('Home')}>
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-white" />
            </div>
          </Link>
          <div>
            <h1 className="text-white text-xl font-bold">Fixtures & Events</h1>
            <p className="text-blue-200 text-sm">Upcoming matches and club events</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-6">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="w-full bg-white border border-gray-200">
            <TabsTrigger value="fixtures" className="flex-1">
              <Trophy className="w-4 h-4 mr-2" />
              Fixtures
            </TabsTrigger>
            <TabsTrigger value="events" className="flex-1">
              <Calendar className="w-4 h-4 mr-2" />
              Events
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab === 'fixtures' && (
          <div className="space-y-6">
            {/* Upcoming Fixtures */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Upcoming Matches
              </h3>
              <div className="space-y-3">
                {upcomingFixtures.length === 0 ? (
                  <div className="text-center py-8 bg-white rounded-xl border border-gray-100">
                    <Calendar className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500">No upcoming fixtures</p>
                  </div>
                ) : (
                  upcomingFixtures.map((fixture, idx) => {
                    const fixtureDate = new Date(fixture.date_time);
                    const isLive = fixture.status === 'live';
                    const isGameDay = isToday(fixtureDate);

                    return (
                      <motion.div
                        key={fixture.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`bg-white rounded-2xl p-4 border ${
                          isLive ? 'border-red-200 bg-red-50' : isGameDay ? 'border-amber-200 bg-amber-50' : 'border-gray-100'
                        }`}
                      >
                        {(isLive || isGameDay) && (
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold mb-3 ${
                            isLive ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
                          }`}>
                            {isLive ? (
                              <>
                                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                LIVE
                              </>
                            ) : (
                              'GAME DAY'
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">{fixture.competition}</p>
                            <p className="text-sm font-medium text-gray-600">{fixture.team_grade}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">{format(fixtureDate, 'MMM d')}</p>
                            <p className="text-sm text-gray-500">{format(fixtureDate, 'h:mm a')}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-center gap-4 py-3">
                          <div className="text-center flex-1">
                            <p className="font-bold text-lg text-gray-900">Central Newcastle</p>
                            <p className="text-xs text-gray-500 uppercase">{fixture.fixture_type === 'home' ? 'Home' : ''}</p>
                          </div>
                          <div className="text-center">
                            <span className="text-gray-400 font-medium">vs</span>
                          </div>
                          <div className="text-center flex-1">
                            <p className="font-bold text-lg text-gray-900">{fixture.opponent}</p>
                            <p className="text-xs text-gray-500 uppercase">{fixture.fixture_type === 'away' ? 'Away' : ''}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <MapPin className="w-4 h-4" />
                            {fixture.venue}
                          </div>
                          {fixture.ticket_url && (
                            <a 
                              href={fixture.ticket_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-sm text-blue-600 font-medium"
                            >
                              <Ticket className="w-4 h-4" />
                              Tickets
                            </a>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Past Results */}
            {pastFixtures.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Recent Results
                </h3>
                <div className="space-y-2">
                  {pastFixtures.slice(0, 5).map((fixture) => {
                    const won = fixture.result_home > fixture.result_away;
                    const lost = fixture.result_home < fixture.result_away;
                    const draw = fixture.result_home === fixture.result_away;

                    return (
                      <div 
                        key={fixture.id}
                        className="bg-white rounded-xl p-4 border border-gray-100 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium text-gray-900">vs {fixture.opponent}</p>
                          <p className="text-xs text-gray-500">{format(new Date(fixture.date_time), 'MMM d')}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-lg">
                            {fixture.result_home} - {fixture.result_away}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            won ? 'bg-emerald-100 text-emerald-700' :
                            lost ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {won ? 'W' : lost ? 'L' : 'D'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-4">
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">No upcoming events</h3>
                <p className="text-sm text-gray-500">Check back soon for club events</p>
              </div>
            ) : (
              upcomingEvents.map((event, idx) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100"
                >
                  {event.image_url && (
                    <img 
                      src={event.image_url}
                      alt={event.title}
                      className="w-full h-40 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full mb-2">
                          {event.event_type?.replace('_', ' ')}
                        </span>
                        <h3 className="font-semibold text-gray-900">{event.title}</h3>
                      </div>
                      {event.is_members_only && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                          Members Only
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{event.description}</p>

                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
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
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                        <MapPin className="w-4 h-4" />
                        {event.venue}
                      </div>
                    )}

                    {event.registration_url && (
                      <a href={event.registration_url} target="_blank" rel="noopener noreferrer">
                        <Button className="w-full bg-[#1a365d] hover:bg-[#2c5282]">
                          Register Now
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </a>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}