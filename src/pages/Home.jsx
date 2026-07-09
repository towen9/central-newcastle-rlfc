import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ticket } from 'lucide-react';
import { createPageUrl } from '@/utils';
import clubConfig from '@/config/club.config';

import HeroPass from '../components/home/HeroPass';
import MembershipPromo from '../components/home/MembershipPromo';
import NextMatchDark from '../components/home/NextMatchDark';
import DayPassGlass from '../components/home/DayPassGlass';
import GlassCard from '@/components/ui-kit/GlassCard';

import StampProgress from '../components/home/StampProgress';
import QuickActions from '../components/home/QuickActions';
import QRModal from '../components/shared/QRModal';
import PullToRefresh from '../components/shared/PullToRefresh';
import PushPromptBanner from '../components/shared/PushPromptBanner';
import LadiesLunchBanner from '../components/home/LadiesLunchBanner';
import PushOptInCard from '../components/home/PushOptInCard';
import SupporterPackAlert from '../components/home/SupporterPackAlert';

const t = clubConfig.theme;

export default function Home() {
  const { user, checkAppState } = useAuth();
  const [showQR, setShowQR] = useState(false);
  const [dismissedLunch, setDismissedLunch] = useState(false);
  const queryClient = useQueryClient();

  const { data: membership } = useQuery({
    queryKey: ['membership', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const memberships = await base44.entities.Membership.filter({ user_id: user.id, status: 'active' });
      return memberships[0] || null;
    },
    enabled: !!user?.id
  });

  // Defer rewards until after membership loads
  const { data: rewards = [] } = useQuery({
    queryKey: ['rewards'],
    queryFn: () => base44.entities.Reward.filter({ is_active: true }, 'points_required'),
    enabled: membership !== undefined
  });

  // Fetch valid day pass for non-members
  const { data: dayPass } = useQuery({
    queryKey: ['homeDayPass', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const passes = await base44.entities.GameDayEntry.filter({ user_id: user.id }, '-entry_timestamp');
      return passes.find((p) => p.status === 'valid') || null;
    },
    enabled: !!user?.id && !membership
  });

  const { data: dayPassFixture } = useQuery({
    queryKey: ['dayPassFixture', dayPass?.event_id],
    queryFn: async () => {
      const fixtures = await base44.entities.Fixture.filter({ id: dayPass.event_id });
      return fixtures[0] || null;
    },
    enabled: !!dayPass?.event_id
  });

  const membershipLoading = !!user?.id && membership === undefined;

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries(['membership']),
      queryClient.invalidateQueries(['rewards']),
      queryClient.invalidateQueries(['homeDayPass']),
      queryClient.invalidateQueries(['dayPassFixture'])]
    );
  };

  if (!user) {
    return (
      <div className="flex flex-col" style={{ minHeight: '60dvh' }}>
        <div className="px-4 pt-6 space-y-3">
          <div className="h-44 rounded-[22px] animate-pulse" style={{ background: 'linear-gradient(160deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))' }} />
          <div className="h-28 rounded-[22px] animate-pulse" style={{ background: 'linear-gradient(160deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))' }} />
          <div className="h-20 rounded-[22px] animate-pulse" style={{ background: 'linear-gradient(160deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col" style={{ minHeight: '100dvh' }}>
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute top-[-10%] left-[-5%] rounded-full" style={{ width: '60vw', height: '60vw', background: `radial-gradient(circle, ${t.royal}, transparent 70%)`, opacity: 0.12, filter: 'blur(80px)' }} />
        <div className="absolute top-[20%] right-[-10%] rounded-full" style={{ width: '50vw', height: '50vw', background: `radial-gradient(circle, ${t.gold}, transparent 70%)`, opacity: 0.08, filter: 'blur(90px)' }} />
      </div>

      {/* Push banner */}
      <PushPromptBanner />

      {/* Content */}
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="relative z-10 px-4 pt-4 pb-4 space-y-4">
          {/* Ladies Long Lunch Banner */}
          {!dismissedLunch && new Date() < new Date('2026-08-01') && (
            <LadiesLunchBanner onDismiss={() => setDismissedLunch(true)} />
          )}

          {/* Non-member CTAs */}
          {!membership && !dayPass && user &&
            <div className="space-y-3">
              <MembershipPromo />

              {/* Day Pass secondary CTA */}
              <GlassCard className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${t.royal}22` }}>
                    <Ticket className="w-5 h-5" style={{ color: t.cyan }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white" style={{ fontFamily: t.fontBody }}>Just here for one game?</p>
                    <p className="text-xs text-white/50" style={{ fontFamily: t.fontBody }}>Single-game digital entry — $8</p>
                  </div>
                </div>
                <button
                  onClick={() => window.location.href = createPageUrl('DayPass')}
                  className="rounded-xl px-4 py-2 text-sm font-semibold flex-shrink-0 transition-all"
                  style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}
                >
                  Day Pass
                </button>
              </GlassCard>
            </div>
          }

          {/* Membership Pass or Day Pass */}
          <div className="relative z-10">
            {membershipLoading ?
              <div className="h-44 rounded-[22px] animate-pulse" style={{ background: 'linear-gradient(160deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))' }} /> :
              !membership && dayPass ?
              <DayPassGlass pass={dayPass} fixture={dayPassFixture} user={user} /> :
              <HeroPass
                membership={membership}
                user={user}
                onShowQR={() => setShowQR(true)} />
            }
          </div>

          {/* Supporter Pack alert */}
          {membership && <SupporterPackAlert membership={membership} />}

          {/* Push Opt-In */}
          <PushOptInCard />

          {/* Next Match */}
          <NextMatchDark />

          {/* Quick Actions */}
          <QuickActions />

          {/* Points Progress */}
          {membership &&
            <StampProgress
              stamps={membership?.stamps || 0}
              points={membership?.points || 0}
              rewards={rewards} />
          }
        </div>
      </PullToRefresh>

      {/* QR Modal */}
      <QRModal
        isOpen={showQR}
        onClose={() => setShowQR(false)}
        membership={membership}
        user={user}
        onPhotoUploaded={() => checkAppState()} />
    </div>
  );
}