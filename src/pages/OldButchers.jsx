import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Trophy, Beer, HardHat, Star, Shield, Users, Ticket,
  Check, Loader2, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import clubConfig from '@/config/club.config';
import GlassCard from '@/components/ui-kit/GlassCard';
import Eyebrow from '@/components/ui-kit/Eyebrow';
import GoldButton from '@/components/ui-kit/GoldButton';
import { SkeletonCard } from '@/components/ui-kit/Skeleton';

const t = clubConfig.theme;

export default function OldButchers() {
  const [user, setUser] = useState(null);
  const [membership, setMembership] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const load = async () => {
      const u = await base44.auth.me();
      setUser(u);
      if (u) {
        const memberships = await base44.entities.Membership.filter({ user_id: u.id, status: 'active' });
        setMembership(memberships[0] || null);
      }
    };
    load();
  }, []);

  const { data: tier } = useQuery({
    queryKey: ['oldButchersTier'],
    queryFn: async () => {
      const tiers = await base44.entities.MembershipTier.filter({ name: 'Old Butchers Membership', is_active: true });
      return tiers[0] || null;
    }
  });

  const isOldButcher = membership?.tier_type ? membership.tier_type === 'legacy' : membership?.tier_name === 'Old Butchers Membership';

  const handleJoin = async () => {
    if (!user?.photo_url) {
      toast.error('Please upload your photo in the Membership page first');
      return;
    }
    if (!tier?.stripe_price_id) {
      toast.error('Membership not available for online purchase yet');
      return;
    }
    setProcessing(true);
    try {
      if (window.self !== window.top) {
        toast.error('Open in a new tab to complete checkout');
        setProcessing(false);
        return;
      }
      const { data } = await base44.functions.invoke('createCheckout', {
        tier_id: tier.id,
        price_id: tier.stripe_price_id,
        success_url: `${window.location.origin}${createPageUrl('Membership')}?payment=success`,
        cancel_url: `${window.location.origin}${createPageUrl('OldButchers')}?payment=cancelled`
      });
      if (data.checkout_url) window.location.href = data.checkout_url;
    } catch {
      toast.error('Failed to start checkout');
      setProcessing(false);
    }
  };

  const benefits = [
    { icon: Ticket, label: 'Season Entry', desc: 'Free entry to all 8 home games via digital QR pass' },
    { icon: Beer, label: 'Old Butchers Day', desc: '4 complimentary beer tokens + exclusive reunion area access' },
    { icon: HardHat, label: 'Exclusive Legacy Hat', desc: 'Limited edition Old Butchers hat – not sold publicly' },
    { icon: Star, label: 'Rewards Boost', desc: 'Extra points per game scan, redeemable for drinks, food & merch' },
    { icon: Trophy, label: 'Honour Roll', desc: 'Your name on the digital Old Butchers Honour Roll' },
    { icon: Shield, label: 'Club Legacy Status', desc: 'Recognition as a former player, official or long-term supporter' },
  ];

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
    <div className="min-h-full pb-24">
      {/* Hero */}
      <div className="relative overflow-hidden pt-safe px-5 pb-8" style={{ background: `linear-gradient(160deg, ${t.bg1}, ${t.bg0})` }}>
        <div className="absolute -top-4 -right-4 select-none pointer-events-none" style={{ fontSize: 180, fontWeight: 900, lineHeight: 'none', color: `${t.gold}11` }}>BB</div>
        <div className="relative">
          <Link to={createPageUrl('Membership')}>
            <button className="flex items-center gap-2 mt-4 mb-6 text-sm" style={{ color: `${t.gold}99` }}>
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </Link>

          <div className="flex items-start gap-4 mb-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${t.gold}22`, border: `2px solid ${t.gold}` }}>
              <Trophy className="w-8 h-8" style={{ color: t.gold }} />
            </div>
            <div>
              <Eyebrow color={t.gold}>Legacy Membership</Eyebrow>
              <h1 className="text-white text-3xl leading-tight" style={{ fontFamily: t.fontDisplay }}>Old Butchers</h1>
              <h2 className="text-white text-3xl leading-tight" style={{ fontFamily: t.fontDisplay }}>Membership</h2>
            </div>
          </div>

          <p className="text-base italic font-semibold mb-1" style={{ color: t.goldHi, fontFamily: t.fontBody }}>
            "Once a Butcher, Always a Butcher"
          </p>
          <p className="text-sm" style={{ color: `${t.gold}99`, fontFamily: t.fontBody }}>
            For former players, officials & long-term supporters who helped build this club.
          </p>
        </div>
      </div>

      <div className="px-5 py-6 space-y-6">
        {/* Already a member */}
        {isOldButcher && (
          <GlassCard className="p-5 text-center" style={{ borderColor: `${t.green}55` }}>
            <Check className="w-10 h-10 mx-auto mb-2" style={{ color: t.green }} />
            <h3 className="text-white font-bold text-lg" style={{ fontFamily: t.fontBody }}>You're an Old Butcher</h3>
            <p className="text-sm mb-4" style={{ color: t.green, fontFamily: t.fontBody }}>Welcome back, legend. Your pass is active.</p>
            <Link to={createPageUrl('OldButchersHonourRoll')}>
              <GoldButton fullWidth>
                View Honour Roll →
              </GoldButton>
            </Link>
          </GlassCard>
        )}

        {/* Price card */}
        {!isOldButcher && (
          <GlassCard className="overflow-hidden" style={{ borderColor: `${t.gold}55` }}>
            <div className="p-5">
              <div className="flex items-end gap-2 mb-1">
                <span className="text-white text-5xl" style={{ fontFamily: t.fontDisplay }}>$70</span>
                <span className="text-base mb-2" style={{ color: `${t.gold}99`, fontFamily: t.fontBody }}>/ season</span>
              </div>
              <p className="text-sm mb-5" style={{ color: `${t.gold}99`, fontFamily: t.fontBody }}>
                Includes season entry worth $64+ · exclusive hat · Old Butchers Day · rewards
              </p>
              <GoldButton
                fullWidth
                onClick={handleJoin}
                disabled={processing}
                style={{ padding: '16px 20px' }}
              >
                {processing ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                ) : (
                  'Join the Old Butchers – $70'
                )}
              </GoldButton>
            </div>
          </GlassCard>
        )}

        {/* Benefits */}
        <div>
          <Eyebrow color={t.gold}>What's Included</Eyebrow>
          <div className="space-y-3 mt-3">
            {benefits.map((b, idx) => {
              const Icon = b.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.07 }}
                >
                  <GlassCard className="px-4 py-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${t.gold}1a`, border: `1px solid ${t.gold}33` }}>
                        <Icon className="w-5 h-5" style={{ color: t.gold }} />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-semibold text-sm" style={{ fontFamily: t.fontBody }}>{b.label}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: t.fontBody }}>{b.desc}</p>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Old Butchers Day Marquee Upsell */}
        <GlassCard className="p-5" style={{ borderColor: `${t.gold}33` }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${t.gold}22` }}>
              <Users className="w-5 h-5" style={{ color: t.gold }} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: t.goldHi, fontFamily: t.fontBody }}>Optional Upgrade</p>
              <h4 className="text-white font-bold" style={{ fontFamily: t.fontBody }}>Old Butchers Day Marquee</h4>
            </div>
          </div>
          <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: t.fontBody }}>
            Upgrade to the premium marquee experience — reserved seating, premium food & drinks package, exclusive viewing area.
          </p>
          <div className="rounded-xl px-4 py-3 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <span className="text-sm font-semibold" style={{ color: t.goldHi, fontFamily: t.fontBody }}>Coming soon — stay tuned</span>
            <ChevronRight className="w-4 h-4" style={{ color: t.gold }} />
          </div>
        </GlassCard>

        {/* Honour Roll CTA */}
        <Link to={createPageUrl('OldButchersHonourRoll')}>
          <GlassCard className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${t.gold}1a`, border: `1px solid ${t.gold}33` }}>
              <Trophy className="w-6 h-6" style={{ color: t.gold }} />
            </div>
            <div className="flex-1">
              <h4 className="text-white font-bold" style={{ fontFamily: t.fontBody }}>View the Honour Roll</h4>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: t.fontBody }}>See all 2026 Old Butchers members</p>
            </div>
            <ChevronRight className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.3)' }} />
          </GlassCard>
        </Link>

        {/* Footer note */}
        <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
          💳 Secure payment via Stripe · Membership activates immediately
        </p>
      </div>
    </div>
  );
}