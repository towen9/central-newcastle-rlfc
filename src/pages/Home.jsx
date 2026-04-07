import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Settings, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import MembershipPass from '../components/home/MembershipPass';
import StampProgress from '../components/home/StampProgress';
import QuickActions from '../components/home/QuickActions';
import NextMatch from '../components/home/NextMatch';
import { Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';

import QRModal from '../components/shared/QRModal';
import PullToRefresh from '../components/shared/PullToRefresh';
import DayPassCard from '../components/home/DayPassCard';

export default function Home() {
  const [showQR, setShowQR] = useState(false);
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  const { data: membership } = useQuery({
    queryKey: ['membership', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const memberships = await base44.entities.Membership.filter({ user_id: user.id, status: 'active' });
      return memberships[0] || null;
    },
    enabled: !!user?.id
  });

  const { data: rewards = [] } = useQuery({
    queryKey: ['rewards'],
    queryFn: () => base44.entities.Reward.filter({ is_active: true }, 'points_required')
  });

  // Fetch valid day pass for non-members
  const { data: dayPass } = useQuery({
    queryKey: ['homeDayPass', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const passes = await base44.entities.GameDayEntry.filter({ user_id: user.id }, '-entry_timestamp');
      return passes.find(p => p.status === 'valid') || null;
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



  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries(['membership']),
      queryClient.invalidateQueries(['rewards']),
      queryClient.invalidateQueries(['homeDayPass']),
      queryClient.invalidateQueries(['dayPassFixture'])
    ]);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Compact Header */}
      <div className="bg-[#1a365d] dark:bg-gray-800 pt-safe sticky top-0 z-30">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6966ba172da6c09d1e1650bd/6b3832f4a_Butcherboyslogo.jpg"
              alt="Central Newcastle RLFC"
              className="w-10 h-10 object-contain bg-white rounded-full p-0.5"
            />
            <div>
              <p className="text-blue-200 dark:text-gray-400 text-xs">Welcome back</p>
              <h1 className="text-white text-sm font-bold">{user?.full_name || 'Member'}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user?.role === 'admin' && (
              <Link to={createPageUrl('AdminDashboard')}>
                <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
              </Link>
            )}
            <button className="w-8 h-8 bg-white/10 dark:bg-white/5 rounded-full flex items-center justify-center">
              <Bell className="w-4 h-4 text-white" />
            </button>
            <Link to={createPageUrl('Profile')}>
              <div className="w-8 h-8 bg-white/20 dark:bg-white/10 rounded-full flex items-center justify-center">
                <Settings className="w-4 h-4 text-white" />
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="px-4 pt-4 pb-32 space-y-3">
        {/* Non-member CTAs */}
        {!membership && !dayPass && user && (
          <div className="space-y-3">
            {/* Join Membership - Primary CTA */}
            <div className="relative rounded-2xl overflow-hidden shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-[#1a365d] via-[#1e4a8a] to-[#2b6cb0]" />
              <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 80% 20%, #ffffff 0%, transparent 60%)'}} />
              <div className="relative p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-amber-400 rounded-lg flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-amber-900" />
                  </div>
                  <span className="text-amber-400 text-xs font-bold uppercase tracking-widest">2026 Season Memberships</span>
                </div>
                <h3 className="text-white text-2xl font-extrabold mb-1 leading-tight">Join the Butcher Boys</h3>
                <p className="text-blue-200 text-sm mb-5">From $40 — season entry, rewards points, exclusive member perks & sponsor deals</p>
                <div className="flex gap-2 mb-5">
                  {['$40 Supporter', '$100 Family', '$120 Premium'].map(t => (
                    <span key={t} className="bg-white/15 text-white text-xs px-2.5 py-1 rounded-full font-medium">{t}</span>
                  ))}
                </div>
                <Button 
                  onClick={() => window.location.href = createPageUrl('JoinMembership')}
                  className="w-full bg-amber-400 hover:bg-amber-300 text-amber-900 py-6 text-base font-bold shadow-lg"
                >
                  View All Memberships →
                </Button>
              </div>
            </div>

            {/* Day Pass - Secondary CTA */}
            <div className="relative rounded-2xl overflow-hidden shadow-md">
              <div className="absolute inset-0 bg-gradient-to-r from-[#0f2340] to-[#1a365d]" />
              <div className="relative p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Ticket className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Just here for one game?</p>
                    <p className="text-xs text-blue-300">Single-game digital entry — $8</p>
                  </div>
                </div>
                <Button 
                  onClick={() => window.location.href = createPageUrl('DayPass')}
                  className="bg-white/20 hover:bg-white/30 text-white border border-white/30 text-sm font-semibold flex-shrink-0"
                >
                  Day Pass
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Membership Pass or Day Pass */}
        <div className="relative z-10">
          {!membership && dayPass ? (
            <DayPassCard pass={dayPass} fixture={dayPassFixture} user={user} />
          ) : (
            <MembershipPass 
              membership={membership} 
              user={user}
              onShowQR={() => setShowQR(true)}
            />
          )}
        </div>

        {/* Next Match */}
        <div>
          <NextMatch />
        </div>

        {/* Quick Actions */}
        <div>
          <QuickActions />
        </div>

        {/* Points Progress */}
        <div>
          <StampProgress 
            stamps={membership?.stamps || 0} 
            points={membership?.points || 0}
            rewards={rewards} 
          />
        </div>


        </div>
      </PullToRefresh>

      {/* QR Modal */}
      <QRModal 
        isOpen={showQR}
        onClose={() => setShowQR(false)}
        membership={membership}
        user={user}
      />
    </div>
  );
}