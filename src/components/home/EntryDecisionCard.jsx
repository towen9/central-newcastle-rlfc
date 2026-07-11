import React from 'react';
import { motion } from 'framer-motion';
import { Ticket, ShieldCheck } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { GlassCard, Eyebrow } from '@/components/ui-kit';
import { useClub } from '@/contexts/ClubContext';

export default function EntryDecisionCard() {
  const { club } = useClub();
  const t = club.theme;
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <GlassCard className="p-4 space-y-3">
        <Eyebrow color={t.gold}>Get In</Eyebrow>

        {/* Day Pass — first */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => window.location.href = createPageUrl('DayPass')}
          className="w-full flex items-center gap-3 rounded-2xl p-4 text-left transition-all"
          style={{ minHeight: 56, background: `${t.royal}1a`, border: `1px solid ${t.royal}40` }}
        >
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${t.royal}33` }}>
            <Ticket className="w-5 h-5" style={{ color: t.cyan }} />
          </div>
          <div className="flex-1">
            <p className="text-white font-bold text-base" style={{ fontFamily: t.fontBody }}>Day Pass — $8</p>
            <p className="text-white/50 text-xs" style={{ fontFamily: t.fontBody }}>Single game entry, on your phone</p>
          </div>
        </motion.button>

        {/* Join the Club — second */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => window.location.href = createPageUrl('Membership')}
          className="w-full flex items-center gap-3 rounded-2xl p-4 text-left transition-all"
          style={{ minHeight: 56, background: `${t.gold}1a`, border: `1px solid ${t.gold}40` }}
        >
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${t.gold}33` }}>
            <ShieldCheck className="w-5 h-5" style={{ color: t.gold }} />
          </div>
          <div className="flex-1">
            <p className="text-white font-bold text-base" style={{ fontFamily: t.fontBody }}>Join the Club — from $40</p>
            <p className="text-white/50 text-xs" style={{ fontFamily: t.fontBody }}>Full season, rewards, member perks</p>
          </div>
        </motion.button>
      </GlassCard>
    </motion.div>
  );
}