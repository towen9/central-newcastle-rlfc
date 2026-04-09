import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Smartphone, Star, Gift, Building2, ShieldCheck, ArrowRight, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';

const steps = [
  {
    icon: Smartphone,
    title: 'Download & Sign Up',
    description: 'Open the Central Newcastle RLFC app and create your free account using your email address.'
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
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#1a365d] via-[#1e4a8a] to-[#2b6cb0] pt-safe">
        <div className="px-5 py-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6966ba172da6c09d1e1650bd/6b3832f4a_Butcherboyslogo.jpg"
              alt="Central Newcastle RLFC"
              className="w-20 h-20 object-contain bg-white rounded-full p-1 mx-auto mb-4"
            />
            <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-400/40 rounded-full px-4 py-1.5 mb-4">
              <Star className="w-4 h-4 text-amber-400" />
              <span className="text-amber-300 text-sm font-semibold">2026 Player Pass</span>
            </div>
            <h1 className="text-white text-3xl font-extrabold mb-3 leading-tight">
              You're Invited,<br />Central Player! 🏉
            </h1>
            <p className="text-blue-200 text-base max-w-xs mx-auto">
              As a registered player, you get a <strong className="text-white">FREE digital pass</strong> — your ticket into every home game, plus rewards, discounts & exclusive perks.
            </p>
          </motion.div>
        </div>
        {/* Wave */}
        <svg viewBox="0 0 1440 40" className="w-full" preserveAspectRatio="none">
          <path fill="#f9fafb" d="M0,40 C360,0 1080,0 1440,40 L1440,40 L0,40 Z" />
        </svg>
      </div>

      <div className="px-5 pb-16 max-w-md mx-auto">

        {/* Gate Entry Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-400 rounded-2xl p-4 mb-4 -mt-2 flex items-center gap-3"
        >
          <span className="text-3xl">🎟️</span>
          <div>
            <p className="font-extrabold text-amber-900 text-base">Your pass = your gate ticket</p>
            <p className="text-amber-800 text-sm">Show your QR code at the gate every home game. No phone = no entry. Keep it charged!</p>
          </div>
        </motion.div>

        {/* Perks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-5"
        >
          <h2 className="font-bold text-gray-900 mb-3 text-lg">What's included</h2>
          <div className="space-y-2">
            {perks.map((perk, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700 text-sm">{perk}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Leagues Club highlight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-5 mb-5 text-white"
        >
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-7 h-7 text-blue-200" />
            <h3 className="font-bold text-lg">Leagues Club Points</h3>
          </div>
          <p className="text-blue-100 text-sm">
            After every home game, scan your QR at the <strong className="text-white">Central Leagues Club</strong> to earn <strong className="text-white">+20 bonus points</strong>. Stack them up for free rewards!
          </p>
        </motion.div>

        {/* Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6"
        >
          <h2 className="font-bold text-gray-900 mb-4 text-lg">How to get started</h2>
          <div className="space-y-5">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-[#1a365d] rounded-xl flex items-center justify-center">
                    <step.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{i + 1}. {step.title}</p>
                  <p className="text-gray-500 text-sm mt-0.5">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          {!loading && (
            <>
              {user ? (
                // Already logged in — go straight to registration
                <Link to={createPageUrl('PlayerPassRegistration')}>
                  <Button className="w-full bg-[#1a365d] hover:bg-[#2c5282] py-6 text-base font-bold">
                    Register My Player Pass
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              ) : (
                // Not logged in — create account first, return here after
                <>
                  <Button
                    className="w-full bg-amber-400 hover:bg-amber-300 text-amber-900 py-6 text-base font-bold shadow-lg mb-3"
                    onClick={() => base44.auth.redirectToLogin(createPageUrl('PlayerPassRegistration'))}
                  >
                    <UserPlus className="w-5 h-5 mr-2" />
                    Create Account & Get My Pass
                  </Button>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                    <p className="text-blue-800 text-sm">
                      👆 This will create your free club account, then take you straight to registration.
                    </p>
                  </div>
                </>
              )}
              <p className="text-center text-gray-400 text-xs mt-3">
                Free for all registered Central Newcastle RLFC players • 2026 Season
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}