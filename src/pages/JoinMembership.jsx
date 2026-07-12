import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Check, Loader2, ArrowLeft, Star, Users, Shield, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

import { toast } from 'sonner';
import { useClub, getClubConfig } from '@/contexts/ClubContext';
import GlassCard from '@/components/ui-kit/GlassCard';
import Eyebrow from '@/components/ui-kit/Eyebrow';
import GoldButton from '@/components/ui-kit/GoldButton';
import { SkeletonCard } from '@/components/ui-kit/Skeleton';

const t = getClubConfig().theme;

const tierConfig = {
  'Supporter Pack': {
    accent: t.royal,
    icon: Shield,
    badgeLabel: '5 GAME PACK',
  },
  'Family Membership': {
    accent: '#7c3aed',
    icon: Users,
    badgeLabel: 'FAMILY PASS',
  },
  'Premium Membership': {
    accent: t.gold,
    icon: Star,
    badgeLabel: 'PREMIUM',
    featured: true,
  },
  'Old Butchers Membership': {
    accent: t.gold,
    icon: Trophy,
    badgeLabel: 'LEGACY',
  },
  'Sponsor Season Pass': {
    accent: t.green,
    icon: Star,
    badgeLabel: 'SPONSOR',
  },
};

export default function JoinMembership() {
  const { club } = useClub();
  const t = club.theme;
  const [selectedTier, setSelectedTier] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [user, setUser] = useState(null);
  const [highlightTier, setHighlightTier] = useState(null);
  const [sponsorSubmitted, setSponsorSubmitted] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();
    // Read ?tier= param to highlight a specific tier
    const urlParams = new URLSearchParams(window.location.search);
    const tierParam = urlParams.get('tier');
    if (tierParam) {
      setHighlightTier(decodeURIComponent(tierParam));
      // Scroll to it after render
      setTimeout(() => {
        const el = document.getElementById(`tier-${decodeURIComponent(tierParam).replace(/\s+/g, '-').toLowerCase()}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  }, []);

  const { data: tiers = [] } = useQuery({
    queryKey: ['membershipTiers', club.id],
    queryFn: () => base44.entities.MembershipTier.filter({ club_id: club.id, is_active: true, is_admin_only: false }, 'sort_order'),
    enabled: !!club?.id
  });

  const handlePurchase = async (tier) => {
    if (!user) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    setSelectedTier(tier);
    setProcessing(true);

    try {
      // Free tier — create pending membership requiring admin approval
      if (tier.price === 0) {
        const qrCodeId = `SPONSOR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await base44.entities.Membership.create({
          user_id: user.id,
          user_email: user.email,
          user_name: user.full_name,
          tier_id: tier.id,
          tier_name: tier.name,
          start_date: new Date().toISOString().split('T')[0],
          expiry_date: new Date('2026-12-31').toISOString().split('T')[0],
          status: 'pending',
          qr_code_id: qrCodeId,
          stamps: 0,
          points: 0,
          total_checkins: 0
        });
        setSponsorSubmitted(true);
        setProcessing(false);
        return;
      }

      const priceId = tier.stripe_price_id;
      if (!priceId) {
        toast.error('This membership tier is not available for online purchase');
        setProcessing(false);
        return;
      }

      if (window.self !== window.top) {
        alert('Checkout is only available from the published app, not the preview.');
        setProcessing(false);
        return;
      }

      // Capture referral code from URL
      const urlParams = new URLSearchParams(window.location.search);
      const refCode = urlParams.get('ref');

      const { data } = await base44.functions.invoke('createCheckout', {
        tier_id: tier.id,
        price_id: priceId,
        referral_code: refCode || null,
        success_url: `${window.location.origin}/Membership?payment=success`,
        cancel_url: `${window.location.origin}/JoinMembership?payment=cancelled`
      });

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (error) {
      toast.error('Failed to start checkout');
      setProcessing(false);
    }
  };

  if (!user) {
    return (
      <div className="px-5 py-6 space-y-4" style={{ minHeight: '100dvh', paddingBottom: '6rem' }}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="min-h-full pb-24" style={{ background: `radial-gradient(ellipse at top, ${t.bg1} 0%, ${t.bg0} 70%)` }}>
      {/* Header */}
      <div className="pt-safe px-5 py-6">
        <Link to="/Membership">
          <button className="flex items-center gap-2 mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm" style={{ fontFamily: t.fontBody }}>Back</span>
          </button>
        </Link>
        <Eyebrow color={t.gold}>{club.season.year} Season</Eyebrow>
        <h1 className="text-white text-2xl mb-1" style={{ fontFamily: t.fontDisplay }}>{club.season.year} Memberships</h1>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: t.fontBody }}>Support {club.identity.club_name} this season</p>
      </div>

      <div className="px-5 py-6">
        <div className="space-y-5">
          {tiers.map((tier, idx) => {
            const config = tierConfig[tier.name] || tierConfig['Supporter Pack'];
            const Icon = config.icon;
            const isFeatured = config.featured;
            const accent = config.accent || t.gold;
            const isHighlighted = highlightTier === tier.name;

            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                id={`tier-${tier.name.replace(/\s+/g, '-').toLowerCase()}`}
              >
                <GlassCard
                  className="overflow-hidden"
                  style={isFeatured || isHighlighted ? { borderColor: accent, boxShadow: `0 8px 32px ${accent}22` } : undefined}
                >
                  {isFeatured && (
                    <div className="px-4 py-1.5 text-xs font-bold flex items-center gap-1" style={{ background: accent, color: t.bg0 }}>
                      ★ BEST VALUE
                    </div>
                  )}

                  {/* Tier Header */}
                  <div className="p-5" style={{ background: `linear-gradient(135deg, ${accent}22, rgba(255,255,255,0.02))` }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${accent}22` }}>
                          <Icon className="w-5 h-5" style={{ color: accent }} />
                        </div>
                        <div>
                          <h3 className="text-white text-lg font-bold" style={{ fontFamily: t.fontBody }}>{tier.name}</h3>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${accent}22`, color: accent }}>
                            {config.badgeLabel}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white text-3xl font-bold" style={{ fontFamily: t.fontDisplay }}>${tier.price}</p>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>per {tier.price_period}</p>
                      </div>
                    </div>
                    <p className="text-sm mt-3" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: t.fontBody }}>{tier.description}</p>
                  </div>

                  {/* Benefits */}
                  <div className="p-5">
                    <div className="space-y-2 mb-5">
                      {tier.benefits?.map((benefit, bidx) => (
                        <div key={bidx} className="flex items-start gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: t.fontBody }}>
                          <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${t.green}22` }}>
                            <Check className="w-3 h-3" style={{ color: t.green }} />
                          </div>
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>

                    {tier.price === 0 && sponsorSubmitted ? (
                      <div className="rounded-xl p-4 text-center" style={{ background: `${t.green}11`, border: `1px solid ${t.green}33` }}>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: `${t.green}22` }}>
                          <Check className="w-5 h-5" style={{ color: t.green }} />
                        </div>
                        <p className="font-semibold text-sm mb-1" style={{ color: t.green, fontFamily: t.fontBody }}>Application Received!</p>
                        <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: t.fontBody }}>Your application has been received. A club administrator will review and approve your account shortly.</p>
                      </div>
                    ) : (
                      <GoldButton
                        fullWidth
                        onClick={() => handlePurchase(tier)}
                        disabled={processing && selectedTier?.id === tier.id}
                        style={{ padding: '14px 20px' }}
                      >
                        {processing && selectedTier?.id === tier.id ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processing...
                          </>
                        ) : tier.price === 0 ? (
                          'Apply for Sponsor Pass →'
                        ) : (
                          `Join for $${tier.price} →`
                        )}
                      </GoldButton>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-8">
          <GlassCard className="p-4">
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: t.fontBody }}>
              💳 Secure payment powered by Stripe. Paid memberships activate immediately. Sponsor passes require admin approval before activation.
            </p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}