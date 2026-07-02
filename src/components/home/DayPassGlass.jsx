import React from 'react';
import { motion } from 'framer-motion';
import { Ticket, QrCode, Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { createPageUrl } from '@/utils';
import GlassCard from './GlassCard';
import clubConfig from '@/config/club.config';

const t = clubConfig.theme;

export default function DayPassGlass({ pass, fixture, user }) {
  const fixtureDate = fixture ? new Date(fixture.date_time) : null;
  const isUsed = pass.status === 'used';

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <GlassCard className="relative overflow-hidden p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-0.5">
              <img src={clubConfig.identity.logo_url} alt="" className="w-full h-full object-contain" loading="lazy" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-semibold" style={{ color: t.gold }}>2026 Season</p>
              <p className="text-white/60 text-xs" style={{ fontFamily: t.fontBody }}>Day Pass</p>
            </div>
          </div>
          <div className="px-2.5 py-1 rounded-full" style={{ background: isUsed ? 'rgba(255,255,255,0.08)' : `${t.green}22` }}>
            <span className="text-xs font-bold" style={{ color: isUsed ? 'rgba(255,255,255,0.4)' : t.green }}>{isUsed ? 'USED' : 'VALID'}</span>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-white text-xl" style={{ fontFamily: t.fontDisplay }}>{user?.full_name || `${pass.first_name} ${pass.last_name}`}</p>
        </div>

        {fixture && (
          <div className="rounded-xl px-3 py-2.5 mb-4 space-y-1.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="flex items-center gap-2 text-white/90 text-sm">
              <Ticket className="w-3.5 h-3.5 flex-shrink-0" style={{ color: t.gold }} />
              <span className="font-semibold truncate" style={{ fontFamily: t.fontBody }}>vs {fixture.opponent}</span>
            </div>
            {fixtureDate && (
              <div className="flex items-center gap-2 text-white/50 text-xs">
                <Calendar className="w-3 h-3 flex-shrink-0" style={{ color: t.gold }} />
                <span style={{ fontFamily: t.fontBody }}>{format(fixtureDate, 'EEE d MMM • h:mm a')}</span>
              </div>
            )}
            {fixture.venue && (
              <div className="flex items-center gap-2 text-white/50 text-xs">
                <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: t.gold }} />
                <span style={{ fontFamily: t.fontBody }}>{fixture.venue}</span>
              </div>
            )}
          </div>
        )}

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => window.location.href = createPageUrl('MyDayPass') + `?passId=${pass.id}`}
          disabled={isUsed}
          className="w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all"
          style={isUsed ? {
            background: 'rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.3)',
            cursor: 'not-allowed'
          } : {
            background: `linear-gradient(135deg, ${t.goldHi}, ${t.gold})`,
            color: t.bg0,
            boxShadow: `0 4px 20px ${t.gold}33`
          }}
        >
          <QrCode className="w-4 h-4" />
          <span>Show Day Pass QR</span>
        </motion.button>
      </GlassCard>
    </motion.div>
  );
}