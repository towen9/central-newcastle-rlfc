import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import GlassCard from './GlassCard';
import clubConfig from '@/config/club.config';

const t = clubConfig.theme;

function useCountdown(targetDate) {
  const [timeLeft, setTimeLeft] = useState(null);
  useEffect(() => {
    if (!targetDate) return;
    const update = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft(null); return; }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ days, hours, mins, secs });
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);
  return timeLeft;
}

export default function NextMatchDark() {
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
  const matchDate = nextMatch ? new Date(nextMatch.date_time) : null;
  const countdown = useCountdown(matchDate);

  if (!nextMatch) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <GlassCard className="p-4 flex items-center gap-3">
          <p className="text-sm text-white/50" style={{ fontFamily: t.fontBody }}>No upcoming fixtures scheduled</p>
        </GlassCard>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold" style={{ color: t.gold }}>Next Match</span>
          {countdown && countdown.days <= 3 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: `${t.royal}33`, color: t.cyan }}>
              {countdown.days === 0 ? 'Today!' : countdown.days === 1 ? 'Tomorrow' : `${countdown.days} days`}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col items-center gap-1.5 flex-1">
            <div className="w-12 h-12 bg-white rounded-full p-1 flex items-center justify-center">
              <img src={clubConfig.identity.logo_url} alt="" className="w-full h-full object-contain" loading="lazy" />
            </div>
            <span className="text-[10px] font-semibold text-white/70" style={{ fontFamily: t.fontBody }}>Central</span>
          </div>
          <div className="flex flex-col items-center px-4">
            <span className="text-[10px] uppercase tracking-wider text-white/30">vs</span>
            <span className="text-white text-lg font-bold" style={{ fontFamily: t.fontDisplay }}>{nextMatch.opponent}</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 flex-1">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <span className="text-white/40 text-lg font-bold" style={{ fontFamily: t.fontDisplay }}>{nextMatch.opponent?.charAt(0) || '?'}</span>
            </div>
            <span className="text-[10px] font-semibold text-white/70" style={{ fontFamily: t.fontBody }}>Opponent</span>
          </div>
        </div>

        {countdown && (
          <div className="flex items-center justify-center gap-2 mb-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="text-center">
              <p className="text-xl text-white" style={{ fontFamily: t.fontDisplay, fontVariantNumeric: 'tabular-nums' }}>{String(countdown.days).padStart(2, '0')}</p>
              <p className="text-[9px] uppercase tracking-wider text-white/40">Days</p>
            </div>
            <span className="text-white/20 text-lg" style={{ fontFamily: t.fontDisplay }}>:</span>
            <div className="text-center">
              <p className="text-xl text-white" style={{ fontFamily: t.fontDisplay, fontVariantNumeric: 'tabular-nums' }}>{String(countdown.hours).padStart(2, '0')}</p>
              <p className="text-[9px] uppercase tracking-wider text-white/40">Hrs</p>
            </div>
            <span className="text-white/20 text-lg" style={{ fontFamily: t.fontDisplay }}>:</span>
            <div className="text-center">
              <p className="text-xl text-white" style={{ fontFamily: t.fontDisplay, fontVariantNumeric: 'tabular-nums' }}>{String(countdown.mins).padStart(2, '0')}</p>
              <p className="text-[9px] uppercase tracking-wider text-white/40">Min</p>
            </div>
            <span className="text-white/20 text-lg" style={{ fontFamily: t.fontDisplay }}>:</span>
            <div className="text-center">
              <p className="text-xl" style={{ fontFamily: t.fontDisplay, fontVariantNumeric: 'tabular-nums', color: t.cyan }}>{String(countdown.secs).padStart(2, '0')}</p>
              <p className="text-[9px] uppercase tracking-wider text-white/40">Sec</p>
            </div>
          </div>
        )}

        <div className="space-y-1.5 text-sm">
          <div className="flex items-center gap-2 text-white/70">
            <Calendar className="w-3.5 h-3.5" style={{ color: t.gold }} />
            <span style={{ fontFamily: t.fontBody }}>{format(matchDate, 'EEEE, MMM d')} • {format(matchDate, 'h:mma')}</span>
          </div>
          <div className="flex items-center gap-2 text-white/70">
            <MapPin className="w-3.5 h-3.5" style={{ color: t.gold }} />
            <span style={{ fontFamily: t.fontBody }}>{nextMatch.venue || clubConfig.identity.venue_name}</span>
          </div>
        </div>

        {nextMatch.sponsor_of_round && (
          <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="text-[9px] uppercase tracking-wider" style={{ color: t.gold }}>Round Sponsor</p>
            <p className="text-sm font-semibold text-white/80" style={{ fontFamily: t.fontBody }}>{nextMatch.sponsor_of_round}</p>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}