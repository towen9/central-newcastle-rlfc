import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useClub } from '@/contexts/ClubContext';
import ClubTable from '@/components/owner/ClubTable';
import NewClubWizard from '@/components/owner/NewClubWizard';
import { Plus, Building2, RefreshCw } from 'lucide-react';

function computeStats(clubs, memberships, users) {
  const userClubMap = {};
  if (users) {
    for (const u of users) {
      if (u.club_id) userClubMap[u.id] = u.club_id;
    }
  }

  const stats = {};
  for (const club of clubs) {
    const clubMems = (memberships || []).filter(m =>
      m.club_id === club.id || userClubMap[m.user_id] === club.id
    );
    const pushEnabled = clubMems.filter(m => m.push_enabled).length;
    const lastActive = clubMems.length > 0
      ? clubMems.reduce((latest, m) =>
          new Date(m.created_date) > new Date(latest.created_date) ? m : latest
        ).created_date
      : null;
    stats[club.id] = {
      memberCount: clubMems.length,
      pushOptInRate: clubMems.length > 0 ? Math.round(pushEnabled / clubMems.length * 100) : 0,
      lastActive,
    };
  }
  return stats;
}

export default function OwnerDashboard() {
  const { exitActingAs } = useClub();
  const queryClient = useQueryClient();
  const [showWizard, setShowWizard] = useState(false);

  const { data: clubs, isLoading: clubsLoading } = useQuery({
    queryKey: ['owner-clubs'],
    queryFn: () => base44.entities.Club.list('-created_date', 200),
  });

  const { data: memberships } = useQuery({
    queryKey: ['owner-memberships'],
    queryFn: () => base44.entities.Membership.filter({}, '-created_date', 1000),
  });

  const { data: users } = useQuery({
    queryKey: ['owner-users'],
    queryFn: () => base44.entities.User.list(1000),
  });

  const stats = clubs ? computeStats(clubs, memberships, users) : {};

  const handleActAs = (club) => {
    sessionStorage.setItem('owner_acting_club_slug', club.slug);
    window.location.href = '/';
  };

  const handleWizardComplete = () => {
    setShowWizard(false);
    queryClient.invalidateQueries({ queryKey: ['owner-clubs'] });
  };

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['owner-clubs'] });
    queryClient.invalidateQueries({ queryKey: ['owner-memberships'] });
    queryClient.invalidateQueries({ queryKey: ['owner-users'] });
  };

  const totalClubs = clubs?.length || 0;
  const liveClubs = clubs?.filter(c => c.status === 'active' && (c.onboarding_progress || 0) >= 100).length || 0;
  const totalMembers = clubs ? clubs.reduce((sum, c) => sum + (stats[c.id]?.memberCount || 0), 0) : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Platform Owner</h1>
              <p className="text-xs text-white/40">Multi-tenant club management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowWizard(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold bg-amber-500 text-black hover:bg-amber-400"
            >
              <Plus className="w-4 h-4" /> Set up new club
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <p className="text-2xl font-bold">{totalClubs}</p>
            <p className="text-xs text-white/40 mt-0.5">Total clubs</p>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <p className="text-2xl font-bold text-green-400">{liveClubs}</p>
            <p className="text-xs text-white/40 mt-0.5">Live & onboarded</p>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <p className="text-2xl font-bold">{totalMembers}</p>
            <p className="text-xs text-white/40 mt-0.5">Total members</p>
          </div>
        </div>

        {/* Club table */}
        {clubsLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-white/10 border-t-white/30 rounded-full animate-spin" />
          </div>
        ) : clubs && clubs.length > 0 ? (
          <div className="rounded-xl bg-white/[0.02] border border-white/10 overflow-hidden">
            <ClubTable clubs={clubs} stats={stats} onActAs={handleActAs} />
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-white/40 text-sm">No clubs yet. Click "Set up new club" to get started.</p>
          </div>
        )}
      </div>

      {showWizard && (
        <NewClubWizard
          onClose={() => setShowWizard(false)}
          onComplete={handleWizardComplete}
        />
      )}
    </div>
  );
}