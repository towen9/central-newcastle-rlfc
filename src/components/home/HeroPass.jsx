import React from 'react';
import { motion } from 'framer-motion';
import { QrCode } from 'lucide-react';
import { format } from 'date-fns';
import GlassCard from './GlassCard';
import clubConfig from '@/config/club.config';

const t = clubConfig.theme;

export default function HeroPass({ membership, user, onShowQR }) {
  const isActive = membership?.status === 'active';
  const expiryDate = membership?.expiry_date ? new Date(membership.expiry_date) : null;
  const tierName = membership?.tier_name || '';
  const isPremium = tierName.includes('Premium');
  const isSupporter = tierName.includes('Supporter Pack');
  const gamesRemaining = membership?.games_remaining ?? null;
  const points = membership?.points || 0;
  const gamesAttended = membership?.total_checkins || 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <GlassCard className="relative overflow-hidden p-5">
        {isPremium && isActive && (
          <motion.div
            animate={{ x: ['-100%', '200%'] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'linear', repeatDelay: 2 }}
            className="absolute inset-0 z-10 pointer-events-none"
            style={{ background: `linear-gradient(105deg, transparent 40%, ${t.goldHi}22 50%, transparent 60%)` }}
          />
        )}

        <div className="relative flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-0.5">
              <img src={clubConfig.identity.logo_url} alt="" className="w-full h-full object-contain" loading="lazy" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-semibold" style={{ color: t.gold }}>2026 Season</p>
              <p className="text-white/60 text-xs" style={{ fontFamily: t.fontBody }}>{tierName || 'No Membership'}</p>
            </div>
          </div>
          {isActive ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: `${t.green}22`, boxShadow: `0 0 12px ${t.green}44` }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: t.green }} />
              <span className="text-xs font-bold" style={{ color: t.green }}>ACTIVE</span>
            </div>
          ) : (
            <div className="px-2.5 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <span className="text-xs font-semibold text-white/60">INACTIVE</span>
            </div>
          )}
        </div>

        <div className="relative mb-4">
          <p className="text-white text-2xl leading-tight" style={{ fontFamily: t.fontDisplay }}>{user?.full_name || 'Member'}</p>
          <p className="text-white/50 text-xs mt-1" style={{ fontFamily: t.fontBody }}>
            {expiryDate ? `Valid until ${format(expiryDate, 'MMM yyyy')}` : 'No expiry'}
          </p>
        </div>

        {isActive && (
          <div className="relative flex gap-3 mb-4">
            <div className="flex-1 rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <p className="text-[10px] uppercase tracking-wider text-white/40">Points</p>
              <p className="text-lg text-white" style={{ fontFamily: t.fontDisplay, fontVariantNumeric: 'tabular-nums' }}>{points}</p>
            </div>
            <div className="flex-1 rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <p className="text-[10px] uppercase tracking-wider text-white/40">Games</p>
              <p className="text-lg text-white" style={{ fontFamily: t.fontDisplay, fontVariantNumeric: 'tabular-nums' }}>{gamesAttended}</p>
            </div>
            {isSupporter && gamesRemaining !== null && (
              <div className="flex-1 rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <p className="text-[10px] uppercase tracking-wider text-white/40">Left</p>
                <p className="text-lg" style={{ fontFamily: t.fontDisplay, fontVariantNumeric: 'tabular-nums', color: gamesRemaining <= 1 ? t.gold : '#fff' }}>{gamesRemaining}</p>
              </div>
            )}
          </div>
        )}

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onShowQR}
          disabled={!isActive}
          className="relative w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all"
          style={isActive ? {
            background: `linear-gradient(135deg, ${t.goldHi}, ${t.gold})`,
            color: t.bg0,
            boxShadow: `0 4px 20px ${t.gold}33`
          } : {
            background: 'rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.3)',
            cursor: 'not-allowed'
          }}
        >
          <QrCode className="w-4 h-4" />
          <span>Show Pass</span>
        </motion.button>
      </GlassCard>
    </motion.div>
  );
}