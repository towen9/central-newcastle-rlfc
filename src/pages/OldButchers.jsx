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

  const isOldButcher = membership?.tier_name === 'Old Butchers Membership';

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

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0a0a0a' }}>
      {/* Hero */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #451a03 0%, #78350f 40%, #1c1917 100%)' }}>
        <div className="absolute inset-0 select-none pointer-events-none">
          <div className="absolute -top-4 -right-4 text-amber-900/30 text-[180px] font-black leading-none">BB</div>
        </div>
        <div className="relative px-5 pt-safe pb-8">
          <Link to={createPageUrl('Membership')}>
            <button className="flex items-center gap-2 text-amber-400/80 mt-4 mb-6 text-sm">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </Link>

          <div className="flex items-start gap-4 mb-5">
            <div className="w-16 h-16 bg-amber-400/20 border-2 border-amber-500 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Trophy className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <div className="text-amber-500 text-xs font-bold tracking-widest uppercase mb-1">Legacy Membership</div>
              <h1 className="text-white text-3xl font-black leading-tight">Old Butchers</h1>
              <h2 className="text-white text-3xl font-black leading-tight">Membership</h2>
            </div>
          </div>

          <p className="text-amber-300 text-base italic font-semibold mb-1">
            "Once a Butcher, Always a Butcher"
          </p>
          <p className="text-amber-200/60 text-sm">
            For former players, officials & long-term supporters who helped build this club.
          </p>
        </div>
      </div>

      <div className="px-5 py-6 space-y-6">

        {/* Already a member */}
        {isOldButcher && (
          <div className="bg-emerald-900/30 border border-emerald-700 rounded-2xl p-5 text-center">
            <Check className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <h3 className="text-white font-bold text-lg">You're an Old Butcher</h3>
            <p className="text-emerald-300 text-sm mb-4">Welcome back, legend. Your pass is active.</p>
            <Link to={createPageUrl('OldButchersHonourRoll')}>
              <Button className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold w-full">
                View Honour Roll →
              </Button>
            </Link>
          </div>
        )}

        {/* Price card */}
        {!isOldButcher && (
          <div className="bg-gradient-to-br from-amber-900/40 to-gray-900 border border-amber-800/60 rounded-2xl overflow-hidden">
            <div className="p-5">
              <div className="flex items-end gap-2 mb-1">
                <span className="text-white text-5xl font-black">$70</span>
                <span className="text-amber-400/70 text-base mb-2">/ season</span>
              </div>
              <p className="text-amber-200/70 text-sm mb-5">
                Includes season entry worth $64+ · exclusive hat · Old Butchers Day · rewards
              </p>
              <Button
                onClick={handleJoin}
                disabled={processing}
                className="w-full py-6 text-base font-bold bg-amber-500 hover:bg-amber-400 text-gray-950"
              >
                {processing ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
                ) : (
                  'Join the Old Butchers – $70'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Benefits */}
        <div>
          <h3 className="text-amber-400 font-bold text-sm uppercase tracking-widest mb-4">What's Included</h3>
          <div className="space-y-3">
            {benefits.map((b, idx) => {
              const Icon = b.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.07 }}
                  className="flex items-start gap-4 bg-gray-900 border border-gray-800 rounded-xl px-4 py-4"
                >
                  <div className="w-10 h-10 bg-amber-900/40 border border-amber-800/50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm">{b.label}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{b.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Old Butchers Day Marquee Upsell */}
        <div className="bg-gradient-to-r from-amber-950 to-amber-900/50 border border-amber-700/40 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-amber-300 text-xs font-bold uppercase tracking-wide">Optional Upgrade</p>
              <h4 className="text-white font-bold">Old Butchers Day Marquee</h4>
            </div>
          </div>
          <p className="text-amber-200/70 text-sm mb-4">
            Upgrade to the premium marquee experience — reserved seating, premium food & drinks package, exclusive viewing area.
          </p>
          <div className="bg-amber-900/30 rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-amber-300 text-sm font-semibold">Coming soon — stay tuned</span>
            <ChevronRight className="w-4 h-4 text-amber-500" />
          </div>
        </div>

        {/* Honour Roll CTA */}
        <Link to={createPageUrl('OldButchersHonourRoll')}>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-900/40 border border-amber-800 rounded-xl flex items-center justify-center flex-shrink-0">
              <Trophy className="w-6 h-6 text-amber-400" />
            </div>
            <div className="flex-1">
              <h4 className="text-white font-bold">View the Honour Roll</h4>
              <p className="text-gray-400 text-sm">See all 2026 Old Butchers members</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </div>
        </Link>

        {/* Footer note */}
        <p className="text-center text-gray-600 text-xs">
          💳 Secure payment via Stripe · Membership activates immediately
        </p>
      </div>
    </div>
  );
}