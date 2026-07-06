import React from 'react';
import { ArrowLeft, Ticket, Beer, Building2, Trophy, Zap } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import clubConfig from '@/config/club.config';
import GlassCard from '@/components/ui-kit/GlassCard';
import Eyebrow from '@/components/ui-kit/Eyebrow';
import SectionHead from '@/components/ui-kit/SectionHead';
import GoldButton from '@/components/ui-kit/GoldButton';

const t = clubConfig.theme;

export default function HowPointsWork() {
  if (!clubConfig.features?.points_rewards) {
    return <Navigate to={createPageUrl('Home')} replace />;
  }
  return (
    <div className="min-h-full pb-24">
      {/* Header */}
      <div className="pt-safe px-5 py-4 flex items-center gap-4">
        <Link to={createPageUrl('Home')}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.09)' }}>
            <ArrowLeft className="w-5 h-5 text-white" />
          </div>
        </Link>
        <div>
          <Eyebrow color={t.gold}>Guide</Eyebrow>
          <h1 className="text-white text-xl" style={{ fontFamily: t.fontDisplay }}>How Points Work</h1>
        </div>
      </div>

      <div className="px-5 space-y-4">
        {/* Hero intro */}
        <GlassCard className="relative overflow-hidden p-6 text-center">
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 40%, ${t.gold}22, transparent 60%)` }} />
          <div className="relative z-10">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center" style={{ background: `${t.gold}22` }}>
              <Zap className="w-7 h-7" style={{ color: t.gold }} fill={t.gold} />
            </div>
            <h2 className="text-white text-lg" style={{ fontFamily: t.fontDisplay }}>Earn rewards for supporting the club</h2>
          </div>
        </GlassCard>

        {/* Earn Points Section */}
        <div>
          <SectionHead kicker="Earn" title="How to Earn Points" />
          <div className="space-y-3">
            {/* Attendance */}
            <GlassCard className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${t.cyan}22` }}>
                  <Ticket className="w-5 h-5" style={{ color: t.cyan }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-white text-sm" style={{ fontFamily: t.fontBody }}>Game Attendance</h3>
                    <span className="text-xl font-bold" style={{ color: t.cyan, fontFamily: t.fontDisplay }}>+10</span>
                  </div>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: t.fontBody }}>
                    Show your membership QR at the gate when you arrive. Get checked in and earn 10 points every home game.
                  </p>
                </div>
              </div>
            </GlassCard>

            {/* Bar Purchase */}
            <GlassCard className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${t.gold}22` }}>
                  <Beer className="w-5 h-5" style={{ color: t.gold }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-white text-sm" style={{ fontFamily: t.fontBody }}>Bar Purchase</h3>
                    <span className="text-xl font-bold" style={{ color: t.gold, fontFamily: t.fontDisplay }}>+5</span>
                  </div>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: t.fontBody }}>
                    Show your membership QR when ordering drinks at the bar. Earn 5 points per transaction.
                  </p>
                </div>
              </div>
            </GlassCard>

            {/* Leagues Club */}
            <GlassCard className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#a78bfa22' }}>
                  <Building2 className="w-5 h-5" style={{ color: '#a78bfa' }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-white text-sm" style={{ fontFamily: t.fontBody }}>Leagues Club Bonus</h3>
                    <span className="text-xl font-bold" style={{ color: '#a78bfa', fontFamily: t.fontDisplay }}>+20</span>
                  </div>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: t.fontBody }}>
                    Head to Central Leagues Club after the game. Show your QR for a massive 20 bonus points (once per day).
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Example Calculation */}
        <div>
          <SectionHead kicker="Example" title="One Game Day" />
          <GlassCard className="relative overflow-hidden p-5" style={{ borderColor: `${t.gold}44` }}>
            <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 0%, ${t.gold}1a, transparent 70%)` }} />
            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-white/70 text-sm" style={{ fontFamily: t.fontBody }}>Scan in at gate</span>
                <span className="font-bold text-white" style={{ fontFamily: t.fontDisplay }}>+10 pts</span>
              </div>
              <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-white/70 text-sm" style={{ fontFamily: t.fontBody }}>Buy 2 beers at bar</span>
                <span className="font-bold text-white" style={{ fontFamily: t.fontDisplay }}>+10 pts</span>
              </div>
              <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-white/70 text-sm" style={{ fontFamily: t.fontBody }}>Visit Leagues Club after</span>
                <span className="font-bold text-white" style={{ fontFamily: t.fontDisplay }}>+20 pts</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="font-bold text-white" style={{ fontFamily: t.fontBody }}>Total for the day:</span>
                <span className="text-2xl font-bold" style={{ color: t.gold, fontFamily: t.fontDisplay }}>40 pts</span>
              </div>
            </div>
            <div className="relative z-10 mt-4 flex items-center gap-2">
              <Trophy className="w-4 h-4" style={{ color: t.gold }} />
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: t.fontBody }}>
                After just 3 games like this, you'll have enough for a free beer! (100 points)
              </p>
            </div>
          </GlassCard>
        </div>

        {/* Rewards Section */}
        <div>
          <SectionHead kicker="Redeem" title="What You Can Get" />
          <div className="space-y-3">
            <GlassCard className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-white text-sm" style={{ fontFamily: t.fontBody }}>Free Mid Strength Beer</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: t.fontBody }}>Perfect for a match day drink</p>
                </div>
                <span className="text-lg font-bold" style={{ color: t.gold, fontFamily: t.fontDisplay }}>100 pts</span>
              </div>
            </GlassCard>

            <GlassCard className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-white text-sm" style={{ fontFamily: t.fontBody }}>Free Full Strength Beer</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: t.fontBody }}>Your favourite full strength</p>
                </div>
                <span className="text-lg font-bold" style={{ color: t.gold, fontFamily: t.fontDisplay }}>150 pts</span>
              </div>
            </GlassCard>

            <GlassCard className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-white text-sm" style={{ fontFamily: t.fontBody }}>$20 Merchandise Voucher</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: t.fontBody }}>Get some {clubConfig.identity.club_short_name} gear</p>
                </div>
                <span className="text-lg font-bold" style={{ color: t.gold, fontFamily: t.fontDisplay }}>250 pts</span>
              </div>
            </GlassCard>

            <GlassCard className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-white text-sm" style={{ fontFamily: t.fontBody }}>Prize Draw Entry</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: t.fontBody }}>Chance to win big prizes</p>
                </div>
                <span className="text-lg font-bold" style={{ color: t.gold, fontFamily: t.fontDisplay }}>300 pts</span>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* CTA */}
        <Link to={createPageUrl('PointsRewards')} className="block pt-2">
          <GoldButton fullWidth>
            View My Points & Rewards
          </GoldButton>
        </Link>
      </div>
    </div>
  );
}