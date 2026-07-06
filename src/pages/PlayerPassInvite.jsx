import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Smartphone, Star, Gift, Building2, ShieldCheck, ArrowRight, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import clubConfig from '@/config/club.config';
import { base44 } from '@/api/base44Client';
import GlassCard from '@/components/ui-kit/GlassCard';
import Eyebrow from '@/components/ui-kit/Eyebrow';
import GoldButton from '@/components/ui-kit/GoldButton';

const t = clubConfig.theme;

const steps = [
  {
    icon: Smartphone,
    title: 'Download & Sign Up',
    description: `Open the ${clubConfig.identity.club_name} app and create your free account using your email address.`
  },
  {
    icon: ShieldCheck,
    title: 'Register for Your Player Pass',
    description: 'Tap "Player Pass" and submit your details. Admin will approve your pass within 24 hours.'
  },
  {
    icon: Star,
    title: 'Earn Points at Every Game',
    description: 'Check in at the club to earn points. Head to the Leagues Club after the game for 20 bonus points!'
  },
  {
    icon: Gift,
    title: 'Redeem Rewards',
    description: 'Use your points for free beers, merchandise discounts, prize draws and more.'
  }
];

const perks = [
  'FREE entry to all home games — scan your QR at the gate',
  'Digital QR pass on your phone — no card needed',
  'Earn & redeem rewards points at the bar & more',
  'Exclusive member-only events',
  'All sponsor deals & discounts'
];

export default function PlayerPassInvite() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me()
      .then(u => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-full" style={{ background: `radial-gradient(ellipse at top, ${t.bg1} 0%, ${t.bg0} 70%)` }}>
      {/* Hero */}
      <div className="pt-safe px-5 py-10 text-center">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <img
            src={clubConfig.identity.logo_url}
            alt={clubConfig.identity.club_name}
            className="w-20 h-20 object-contain bg-white rounded-full p-1 mx-auto mb-4"
          />
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-4" style={{ background: `${t.gold}22`, border: `1px solid ${t.gold}44` }}>
            <Star className="w-4 h-4" style={{ color: t.gold }} />
            <span className="text-sm font-semibold" style={{ color: t.goldHi }}>2026 Player Pass</span>
          </div>
          <h1 className="text-white text-3xl font-extrabold mb-3 leading-tight" style={{ fontFamily: t.fontDisplay }}>
            You're Invited,<br />Central Player! 🏉
          </h1>
          <p className="text-base max-w-xs mx-auto" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: t.fontBody }}>
            As a registered player, you get a <strong className="text-white">FREE digital pass</strong> — your ticket into every home game, plus rewards, discounts & exclusive perks.
          </p>
        </motion.div>
      </div>

      <div className="px-5 pb-16 max-w-md mx-auto space-y-5">
        {/* Gate Entry Banner */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="p-4 flex items-center gap-3" style={{ borderColor: `${t.gold}55`, background: `linear-gradient(135deg, ${t.gold}22, rgba(255,255,255,0.03))` }}>
            <span className="text-3xl">🎟️</span>
            <div>
              <p className="font-extrabold text-base" style={{ color: t.goldHi, fontFamily: t.fontBody }}>Your pass = your gate ticket</p>
              <p className="text-sm" style={{ color: t.gold, fontFamily: t.fontBody }}>Show your QR code at the gate every home game. No phone = no entry. Keep it charged!</p>
            </div>
          </GlassCard>
        </motion.div>

        {/* Perks */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <GlassCard className="p-5">
            <h2 className="font-bold text-white mb-3 text-lg" style={{ fontFamily: t.fontBody }}>What's included</h2>
            <div className="space-y-2">
              {perks.map((perk, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: t.green }} />
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: t.fontBody }}>{perk}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Leagues Club highlight */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <GlassCard className="p-5" style={{ borderColor: `${t.cyan}44` }}>
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="w-7 h-7" style={{ color: t.cyan }} />
              <h3 className="font-bold text-lg text-white" style={{ fontFamily: t.fontBody }}>Leagues Club Points</h3>
            </div>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: t.fontBody }}>
              After every home game, scan your QR at the <strong className="text-white">Central Leagues Club</strong> to earn <strong className="text-white">+20 bonus points</strong>. Stack them up for free rewards!
            </p>
          </GlassCard>
        </motion.div>

        {/* Steps */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <GlassCard className="p-5">
            <h2 className="font-bold text-white mb-4 text-lg" style={{ fontFamily: t.fontBody }}>How to get started</h2>
            <div className="space-y-5">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${t.gold}22` }}>
                      <step.icon className="w-5 h-5" style={{ color: t.gold }} />
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm" style={{ fontFamily: t.fontBody }}>{i + 1}. {step.title}</p>
                    <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: t.fontBody }}>{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          {!loading && (
            <>
              {user ? (
                <Link to={createPageUrl('PlayerPassRegistration')}>
                  <GoldButton fullWidth style={{ padding: '16px 20px' }}>
                    Register My Player Pass
                    <ArrowRight className="w-5 h-5" />
                  </GoldButton>
                </Link>
              ) : (
                <>
                  <GoldButton
                    fullWidth
                    onClick={() => base44.auth.redirectToLogin(createPageUrl('PlayerPassRegistration'))}
                    style={{ padding: '16px 20px' }}
                  >
                    <UserPlus className="w-5 h-5" />
                    Create Account & Get My Pass
                  </GoldButton>
                  <GlassCard className="p-3 mt-3 text-center">
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: t.fontBody }}>
                      👆 This will create your free club account, then take you straight to registration.
                    </p>
                  </GlassCard>
                </>
              )}
              <p className="text-center text-xs mt-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Free for all registered {clubConfig.identity.club_name} players • {clubConfig.season.year} Season
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}