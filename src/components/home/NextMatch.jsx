import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Calendar, MapPin, Trophy } from 'lucide-react';
import { format, differenceInDays, startOfToday } from 'date-fns';
import { motion } from 'framer-motion';

export default function NextMatch() {
  const { data: fixtures = [] } = useQuery({
    queryKey: ['upcomingFixtures'],
    queryFn: async () => {
      const all = await base44.entities.Fixture.filter({ match_status: 'scheduled', division: 'mens', team_grade: 'DEC' });
      return all.sort((a, b) => new Date(a.date_time) - new Date(b.date_time));
    },
    staleTime: 0,
    gcTime: 0
  });

  const nextMatch = fixtures[0];

  if (!nextMatch) return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
      <Card className="bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-700 dark:to-blue-900 text-white overflow-hidden relative">
        <div className="relative p-4 flex items-center gap-3">
          <Trophy className="w-5 h-5 opacity-60" />
          <p className="text-sm opacity-80">No upcoming fixtures scheduled</p>
        </div>
      </Card>
    </motion.div>
  );

  const matchDate = new Date(nextMatch.date_time);
  const daysUntil = differenceInDays(matchDate, startOfToday());

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <Card className="bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-700 dark:to-blue-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16" />
        
        <div className="relative p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              <span className="text-xs font-medium opacity-90">Next Match</span>
            </div>
            {daysUntil <= 3 && (
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                {daysUntil === 0 ? 'Today!' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
              </span>
            )}
          </div>

          <div>
            <h3 className="text-xl font-bold mb-1">
              Central v {nextMatch.opponent}
            </h3>
            {nextMatch.team_grade && (
              <p className="text-sm opacity-80">{nextMatch.team_grade}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5 text-sm opacity-90">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{format(matchDate, 'EEEE, MMM d')} • {format(matchDate, 'h:mma')}</span>
            </div>
            {nextMatch.venue && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{nextMatch.venue}</span>
              </div>
            )}
          </div>

          {nextMatch.sponsor_of_round && (
            <div className="pt-2 border-t border-white/20">
              <p className="text-xs opacity-75">Proudly supported by</p>
              <p className="text-sm font-semibold">{nextMatch.sponsor_of_round}</p>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}