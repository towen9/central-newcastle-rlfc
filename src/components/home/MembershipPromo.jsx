import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { createPageUrl } from '@/utils';
import GlassCard from './GlassCard';
import clubConfig from '@/config/club.config';

const t = clubConfig.theme;

export default function MembershipPromo() {
  const { data: tiers = [] } = useQuery({
    queryKey: ['membershipTiers', 'promo'],
    queryFn: async () => {
      const all = await base44.entities.MembershipTier.filter({ is_active: true }, 'sort_order');
      return all;
    }
  });

  const lowestPrice = tiers.length > 0 ? Math.min(...tiers.map(tier => tier.price)) : null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <GlassCard className="relative overflow-hidden p-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${t.gold}22` }}>
            <ShieldCheck className="w-4 h-4" style={{ color: t.gold }} />
          </div>
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold" style={{ color: t.gold }}>2026 Season</span>
        </div>
        <h3 className="text-white text-2xl mb-1 leading-tight" style={{ fontFamily: t.fontDisplay }}>Join the Butcher Boys</h3>
        <p className="text-white/60 text-sm mb-4" style={{ fontFamily: t.fontBody }}>
          {lowestPrice !== null ? `From $${lowestPrice} — season entry, rewards & sponsor deals` : 'Season entry, rewards points & exclusive perks'}
        </p>
        {tiers.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {tiers.map(tier => (
              <div key={tier.id} className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)' }}>
                {tier.name} · ${tier.price}
              </div>
            ))}
          </div>
        )}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => window.location.href = createPageUrl('JoinMembership')}
          className="w-full py-3.5 rounded-xl text-sm font-bold transition-all"
          style={{ background: `linear-gradient(135deg, ${t.goldHi}, ${t.gold})`, color: t.bg0, boxShadow: `0 4px 20px ${t.gold}33` }}
        >
          View All Memberships →
        </motion.button>
      </GlassCard>
    </motion.div>
  );
}