import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { createPageUrl } from '@/utils';
import GlassCard from '@/components/ui-kit/GlassCard';
import Eyebrow from '@/components/ui-kit/Eyebrow';
import GoldButton from '@/components/ui-kit/GoldButton';
import { useClub } from '@/contexts/ClubContext';

export default function MembershipPromo() {
  const { club } = useClub();
  const t = club.theme;
  const { data: tiers = [] } = useQuery({
    queryKey: ['membershipTiers', 'promo', club.id],
    queryFn: async () => {
      const all = await base44.entities.MembershipTier.filter({ club_id: club.id, is_active: true }, 'sort_order');
      return all;
    },
    enabled: !!club?.id
  });

  const lowestPrice = tiers.length > 0 ? Math.min(...tiers.map(tier => tier.price)) : null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <GlassCard className="relative overflow-hidden p-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${t.gold}22` }}>
            <ShieldCheck className="w-4 h-4" style={{ color: t.gold }} />
          </div>
          <Eyebrow color={t.gold}>{club.season.label}</Eyebrow>
        </div>
        <h3 className="text-white text-2xl mb-1 leading-tight" style={{ fontFamily: t.fontDisplay }}>Join the {club.identity.short_name}</h3>
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
        <GoldButton
          onClick={() => window.location.href = createPageUrl('JoinMembership')}
          fullWidth
        >
          View All Memberships →
        </GoldButton>
      </GlassCard>
    </motion.div>
  );
}