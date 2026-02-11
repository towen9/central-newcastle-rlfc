import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import MembershipPass from '../components/home/MembershipPass';
import StampProgress from '../components/home/StampProgress';
import QuickActions from '../components/home/QuickActions';
import FeaturedOffer from '../components/home/FeaturedOffer';
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
    queryFn: () => base44.entities.Reward.filter({ is_active: true }, 'stamps_required')
  });

  const { data: featuredOffer } = useQuery({
    queryKey: ['featuredOffer'],
    queryFn: async () => {
      const offers = await base44.entities.Offer.filter({ is_featured: true, is_active: true });
      return offers[0] || null;
    }
  });

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries(['membership']),
      queryClient.invalidateQueries(['rewards']),
      queryClient.invalidateQueries(['featuredOffer'])
    ]);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      {/* Header */}
      <div className="bg-[#1a365d] dark:bg-gray-800 pt-safe">
        <div className="px-5 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6966ba172da6c09d1e1650bd/6b3832f4a_Butcherboyslogo.jpg"
              alt="Central Newcastle RLFC"
              className="w-14 h-14 object-contain bg-white rounded-full p-1"
            />
            <div>
              <p className="text-blue-200 dark:text-gray-400 text-sm">Welcome back</p>
              <h1 className="text-white text-xl font-bold">{user?.full_name || 'Member'}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 bg-white/10 dark:bg-white/5 rounded-full flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </button>
            <Link to={createPageUrl('Profile')}>
              <div className="w-10 h-10 bg-white/20 dark:bg-white/10 rounded-full flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Content with Pull to Refresh */}
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="px-5 -mt-2">
        {/* Membership Pass */}
        <div className="relative z-10 mb-6">
          <MembershipPass 
            membership={membership} 
            user={user}
            onShowQR={() => setShowQR(true)}
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <QuickActions />
        </div>

        {/* Stamp Progress */}
        <div className="mb-6">
          <StampProgress stamps={membership?.stamps || 0} rewards={rewards} />
        </div>

        {/* Featured Offer */}
        {featuredOffer && (
          <div className="mb-6">
            <FeaturedOffer offer={featuredOffer} />
          </div>
        )}
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