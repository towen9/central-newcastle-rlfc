import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import clubConfig from '@/config/club.config';
import GlassCard from '@/components/ui-kit/GlassCard';
import Eyebrow from '@/components/ui-kit/Eyebrow';
import { SkeletonCard } from '@/components/ui-kit/Skeleton';
import GoldButton from '@/components/ui-kit/GoldButton';
import SponsorRedemptionOverlay from '@/components/sponsors/SponsorRedemptionOverlay';

const t = clubConfig.theme;

function LogoChip({ sponsor, size = 56 }) {
  if (sponsor.logo_url) {
    return (
      <div
        className="flex-shrink-0 flex items-center justify-center"
        style={{
          width: size, height: size, borderRadius: 14,
          background: '#fff', padding: size * 0.12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}
      >
        <img src={sponsor.logo_url} alt={sponsor.name} className="w-full h-full object-contain" loading="lazy" />
      </div>
    );
  }
  return (
    <div
      className="flex-shrink-0 flex items-center justify-center"
      style={{
        width: size, height: size, borderRadius: 14,
        background: 'rgba(255,255,255,0.08)',
        color: t.gold
      }}
    >
      <span style={{ fontFamily: t.fontDisplay, fontSize: size * 0.4 }}>
        {sponsor.name?.charAt(0) || '?'}
      </span>
    </div>
  );
}

export default function Sponsors() {
  const [redeemSponsor, setRedeemSponsor] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: sponsors = [], isLoading } = useQuery({
    queryKey: ['sponsors'],
    queryFn: async () => {
      const allSponsors = await base44.entities.Sponsor.filter({ is_active: true });
      return allSponsors.sort((a, b) => {
        const orderA = a.sort_order ?? 999;
        const orderB = b.sort_order ?? 999;
        if (orderA !== orderB) return orderA - orderB;
        return a.name.localeCompare(b.name);
      });
    }
  });

  const { data: offers = [] } = useQuery({
    queryKey: ['offers'],
    queryFn: () => base44.entities.Offer.filter({ is_active: true })
  });

  const { data: membership } = useQuery({
    queryKey: ['membership', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const m = await base44.entities.Membership.filter({ user_id: user.id, status: 'active' });
      return m[0] || null;
    },
    enabled: !!user?.id
  });

  const getOfferForSponsor = (sponsorId) => {
    return offers.find(o => o.sponsor_id === sponsorId && o.is_active !== false);
  };

  // No tier field on Sponsor entity — feature the first sponsor (lowest sort_order)
  const featuredSponsor = sponsors[0];
  const featuredOffer = featuredSponsor ? getOfferForSponsor(featuredSponsor.id) : null;
  const remainingSponsors = sponsors.slice(1);

  // Log redemption to OfferRedemption entity when overlay opens — dedup within 24h
  const handleRedeem = async (sponsor, offer) => {
    setRedeemSponsor({ sponsor, offer });
    if (!offer || !user?.id) return;
    try {
      const existing = await base44.entities.OfferRedemption.filter({ user_id: user.id, offer_id: offer.id });
      const cutoff = Date.now() - 24 * 60 * 60 * 1000;
      const alreadyLogged = existing.some(r => new Date(r.timestamp).getTime() >= cutoff);
      if (alreadyLogged) return;
      await base44.entities.OfferRedemption.create({
        offer_id: offer.id,
        offer_title: offer.title,
        sponsor_id: sponsor.id,
        sponsor_name: sponsor.name,
        user_id: user.id,
        membership_id: membership?.id || null,
        redemption_code: offer.offer_code || null,
        timestamp: new Date().toISOString()
      });
    } catch {}
  };

  if (!clubConfig.features?.sponsor_portal) {
    return <Navigate to={createPageUrl('Home')} replace />;
  }

  return (
    <div className="min-h-full pb-24">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <Eyebrow color={t.gold}>Our Partners</Eyebrow>
        <h1 className="text-white text-2xl mt-1" style={{ fontFamily: t.fontDisplay }}>Sponsor Offers</h1>
        <p className="text-white/50 text-sm mt-1" style={{ fontFamily: t.fontBody }}>Every redemption supports the club.</p>
      </div>

      <div className="px-5">
        {isLoading ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : sponsors.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <p className="text-white/60 text-sm font-semibold" style={{ fontFamily: t.fontBody }}>Partner offers coming soon.</p>
            <p className="text-white/40 text-xs mt-1" style={{ fontFamily: t.fontBody }}>Check back for exclusive member deals.</p>
          </GlassCard>
        ) : (
          <>
            {/* Featured / Principal partner spotlight */}
            {featuredSponsor && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-5"
              >
                <GlassCard
                  className="p-6"
                  style={{ borderColor: `${t.gold}55`, boxShadow: `0 0 24px ${t.gold}1a, 0 8px 32px rgba(0,0,0,0.3)` }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Eyebrow color={t.gold}>Principal Partner</Eyebrow>
                  </div>

                  <div className="flex items-start gap-4 mb-4">
                    <LogoChip sponsor={featuredSponsor} size={72} />
                    <div className="flex-1 min-w-0">
                      <h2 className="text-white text-xl leading-tight" style={{ fontFamily: t.fontDisplay }}>
                        {featuredSponsor.name}
                      </h2>
                      {featuredSponsor.description && (
                        <p className="text-white/50 text-sm mt-1" style={{ fontFamily: t.fontBody }}>
                          {featuredSponsor.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {featuredOffer ? (
                    <>
                      <div className="rounded-xl p-3 mb-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <p className="text-white text-sm font-semibold" style={{ fontFamily: t.fontBody }}>
                          {featuredOffer.title}
                        </p>
                        {featuredOffer.description && (
                          <p className="text-white/50 text-xs mt-1" style={{ fontFamily: t.fontBody }}>
                            {featuredOffer.description}
                          </p>
                        )}
                      </div>
                      <GoldButton fullWidth onClick={() => handleRedeem(featuredSponsor, featuredOffer)}>
                        Redeem Offer
                      </GoldButton>
                    </>
                  ) : (
                    featuredSponsor.website && (
                      <GoldButton
                        variant="outline"
                        fullWidth
                        onClick={() => window.open(featuredSponsor.website, '_blank')}
                      >
                        Visit Website
                        <ExternalLink className="w-4 h-4" />
                      </GoldButton>
                    )
                  )}
                </GlassCard>
              </motion.div>
            )}

            {/* Offers wall */}
            {remainingSponsors.length > 0 && (
              <div className="space-y-3">
                {remainingSponsors.map((sponsor, idx) => {
                  const offer = getOfferForSponsor(sponsor.id);
                  return (
                    <motion.div
                      key={sponsor.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                    >
                      <GlassCard className="p-4">
                        <div className="flex items-start gap-3">
                          <LogoChip sponsor={sponsor} size={48} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h3 className="text-white text-sm font-semibold truncate" style={{ fontFamily: t.fontBody }}>
                                {sponsor.name}
                              </h3>
                            </div>
                            {sponsor.description && (
                              <p className="text-white/40 text-xs line-clamp-1 mb-1" style={{ fontFamily: t.fontBody }}>
                                {sponsor.description}
                              </p>
                            )}
                            {offer ? (
                              <p className="text-white/70 text-xs" style={{ fontFamily: t.fontBody }}>
                                {offer.title}
                              </p>
                            ) : (
                              sponsor.website && (
                                <p className="text-white/30 text-xs truncate" style={{ fontFamily: t.fontBody }}>
                                  {sponsor.website.replace(/^https?:\/\//, '')}
                                </p>
                              )
                            )}
                          </div>
                        </div>

                        <div className="mt-3">
                          {offer ? (
                            <GoldButton variant="outline" fullWidth onClick={() => handleRedeem(sponsor, offer)}>
                              Redeem
                            </GoldButton>
                          ) : (
                            sponsor.website && (
                              <GoldButton
                                variant="outline"
                                fullWidth
                                onClick={() => window.open(sponsor.website, '_blank')}
                              >
                                Visit Website
                                <ExternalLink className="w-4 h-4" />
                              </GoldButton>
                            )
                          )}
                        </div>
                      </GlassCard>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Redemption overlay */}
      {redeemSponsor && (
        <SponsorRedemptionOverlay
          sponsor={redeemSponsor.sponsor}
          offer={redeemSponsor.offer}
          onDismiss={() => setRedeemSponsor(null)}
        />
      )}
    </div>
  );
}