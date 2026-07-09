import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import clubConfig from '@/config/club.config';

import HeroPass from '../components/home/HeroPass';
import NextMatchDark from '../components/home/NextMatchDark';
import DayPassGlass from '../components/home/DayPassGlass';
import EntryDecisionCard from '../components/home/EntryDecisionCard';
import ValueStrip from '../components/home/ValueStrip';
import SponsorStrip from '../components/home/SponsorStrip';

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

          {/* === NON-MEMBER STATE === */}
          {!membership && !dayPass && user && !membershipLoading && (
            <>
              {/* Next Match — first */}
              <NextMatchDark />

              {/* Entry Decision Card — hero */}
              <EntryDecisionCard />

              {/* Compact membership value strip */}
              <ValueStrip />

              {/* Push Opt-In */}
              <PushOptInCard />

              {/* Quick Actions — filtered (Fixtures + Share App only) */}
              <QuickActions isNonMember />

              {/* Sponsor strip — slim, bottom */}
              <SponsorStrip />
            </>
          )}

          {/* === DAY-PASS HOLDER STATE (unchanged) === */}
          {!membership && dayPass && (
            <>
              <DayPassGlass pass={dayPass} fixture={dayPassFixture} user={user} />
              <PushOptInCard />
              <NextMatchDark />
              <QuickActions />
            </>
          )}

          {/* === MEMBER STATE (unchanged) === */}
          {membership && (
            <>
              <HeroPass
                membership={membership}
                user={user}
                onShowQR={() => setShowQR(true)} />
              <SupporterPackAlert membership={membership} />
              <PushOptInCard />
              <NextMatchDark />
              <QuickActions />
              <StampProgress
                stamps={membership?.stamps || 0}
                points={membership?.points || 0}
                rewards={rewards} />
            </>
          )}

          {/* Loading skeleton */}
          {membershipLoading && (
            <div className="h-44 rounded-[22px] animate-pulse" style={{ background: 'linear-gradient(160deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))' }} />
          )}
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