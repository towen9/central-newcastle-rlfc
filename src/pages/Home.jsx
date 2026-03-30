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



  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries(['membership']),
      queryClient.invalidateQueries(['rewards'])
    ]);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
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
        <div className="px-4 pt-2 pb-32 space-y-3">
        {/* Non-member CTAs */}
        {!membership && user && (
          <div className="space-y-3">
            {/* Join Membership - Primary CTA */}
            <div className="bg-gradient-to-br from-[#78350f] to-[#b45309] rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-amber-200 text-xs font-semibold uppercase tracking-wide mb-0.5">2026 Season</p>
                  <h3 className="text-xl font-bold mb-1">Become a Member</h3>
                  <p className="text-amber-100 text-sm">From $40 — season entry, rewards, exclusive perks & more</p>
                </div>
              </div>
              <Button 
                onClick={() => window.location.href = createPageUrl('JoinMembership')}
                className="w-full bg-white text-[#78350f] hover:bg-amber-50 py-6 text-lg font-semibold"
              >
                View Membership Options →
              </Button>
            </div>

            {/* Day Pass - Secondary CTA */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Ticket className="w-5 h-5 text-[#1a365d]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Just here for one game?</p>
                  <p className="text-xs text-gray-500">Buy a Day Pass — $8 single entry</p>
                </div>
              </div>
              <Button 
                onClick={() => window.location.href = createPageUrl('DayPass')}
                variant="outline"
                className="text-[#1a365d] border-[#1a365d] text-sm font-semibold flex-shrink-0"
              >
                Day Pass
              </Button>
            </div>
          </div>
        )}

        {/* Membership Pass */}
        <div className="relative z-10">
          <MembershipPass 
            membership={membership} 
            user={user}
            onShowQR={() => setShowQR(true)}
          />
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