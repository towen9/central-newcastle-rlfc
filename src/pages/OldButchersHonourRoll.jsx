import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Shield, Star, Trophy, Users, Edit3, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function OldButchersHonourRoll() {
  const [user, setUser] = useState(null);
  const [membership, setMembership] = useState(null);
  const [editing, setEditing] = useState(false);
  const [yearsPlayed, setYearsPlayed] = useState('');
  const [teamGrade, setTeamGrade] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    const load = async () => {
      const u = await base44.auth.me();
      setUser(u);
      if (u) {
        const memberships = await base44.entities.Membership.filter({ user_id: u.id, status: 'active' });
        const m = memberships[0];
        setMembership(m || null);
        if (m) {
          setYearsPlayed(m.years_played || '');
          setTeamGrade(m.team_grade_played || '');
        }
      }
    };
    load();
  }, []);

  // Fetch all Old Butchers members
  const { data: honourRoll = [] } = useQuery({
    queryKey: ['oldButchersHonourRoll'],
    queryFn: async () => {
      const all = await base44.entities.Membership.filter({ tier_name: 'Old Butchers Membership', status: 'active' }, 'user_name');
      return all;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Membership.update(membership.id, {
        years_played: yearsPlayed,
        team_grade_played: teamGrade
      });
    },
    onSuccess: () => {
      toast.success('Your details updated!');
      setEditing(false);
      queryClient.invalidateQueries(['oldButchersHonourRoll']);
    }
  });

  const isOldButcher = membership?.tier_name === 'Old Butchers Membership';

  return (
    <div className="min-h-screen bg-gray-950 pb-24">
      {/* Header */}
      <div className="relative bg-gradient-to-b from-amber-950 via-amber-900 to-gray-900 pt-safe overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-4 text-amber-400 text-8xl font-black select-none">1908</div>
          <div className="absolute bottom-4 right-4 text-amber-400 text-6xl font-black select-none rotate-12">BB</div>
        </div>
        <div className="relative px-5 py-8">
          <Link to={createPageUrl('Membership')}>
            <button className="flex items-center gap-2 text-amber-300 mb-6">
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-amber-400/20 border-2 border-amber-400 rounded-2xl flex items-center justify-center">
              <Trophy className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <div className="text-amber-400 text-xs font-bold tracking-widest uppercase mb-1">Legacy Members</div>
              <h1 className="text-white text-2xl font-black">Old Butchers</h1>
              <h2 className="text-white text-2xl font-black">Honour Roll</h2>
            </div>
          </div>
          <p className="text-amber-200/80 text-sm italic font-medium">
            "Once a Butcher, Always a Butcher"
          </p>
        </div>
      </div>

      <div className="px-5 py-6 space-y-6">
        {/* Your entry (if Old Butcher member) */}
        {isOldButcher && (
          <div className="bg-amber-900/30 border border-amber-700/50 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-amber-300 font-bold text-sm uppercase tracking-wide">Your Entry</h3>
              {!editing ? (
                <button onClick={() => setEditing(true)} className="text-amber-400 text-xs flex items-center gap-1">
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => updateMutation.mutate()} className="text-emerald-400">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditing(false)} className="text-red-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="text-amber-200 text-xs mb-1 block">Years Played (e.g. 2010–2015)</label>
                  <input
                    value={yearsPlayed}
                    onChange={e => setYearsPlayed(e.target.value)}
                    className="w-full bg-gray-900 border border-amber-700 rounded-lg px-3 py-2 text-white text-sm"
                    placeholder="e.g. 2008–2013"
                  />
                </div>
                <div>
                  <label className="text-amber-200 text-xs mb-1 block">Grade (e.g. First Grade, Reserve Grade)</label>
                  <input
                    value={teamGrade}
                    onChange={e => setTeamGrade(e.target.value)}
                    className="w-full bg-gray-900 border border-amber-700 rounded-lg px-3 py-2 text-white text-sm"
                    placeholder="e.g. First Grade"
                  />
                </div>
              </div>
            ) : (
              <div>
                <p className="text-white font-bold text-lg">{user?.full_name}</p>
                {yearsPlayed && <p className="text-amber-300 text-sm">{yearsPlayed} · {teamGrade || 'Member'}</p>}
                {!yearsPlayed && <p className="text-amber-500 text-sm italic">Add your years played and grade above</p>}
              </div>
            )}
          </div>
        )}

        {/* Stats bar */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-amber-400 text-2xl font-black">{honourRoll.length}</p>
            <p className="text-gray-400 text-xs mt-1">Legacy Members</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-amber-400 text-2xl font-black">1908</p>
            <p className="text-gray-400 text-xs mt-1">Est. Season</p>
          </div>
        </div>

        {/* The roll */}
        <div>
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            2026 Roll of Honour
          </h3>
          <div className="space-y-3">
            {honourRoll.length === 0 && (
              <div className="text-center py-12 text-gray-600">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">The honour roll will grow as members join</p>
              </div>
            )}
            {honourRoll.map((member, idx) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex items-center gap-4"
              >
                <div className="w-8 h-8 bg-amber-900/50 border border-amber-700 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-400 text-xs font-bold">{idx + 1}</span>
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold">{member.user_name || 'Member'}</p>
                  {(member.years_played || member.team_grade_played) && (
                    <p className="text-amber-400 text-xs">
                      {[member.years_played, member.team_grade_played].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
                <Star className="w-4 h-4 text-amber-500" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA for non-members */}
        {!isOldButcher && (
          <div className="bg-gradient-to-br from-amber-950 to-gray-900 border border-amber-800/50 rounded-2xl p-6 text-center">
            <Trophy className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <h3 className="text-white font-bold text-lg mb-1">Join the Old Butchers</h3>
            <p className="text-amber-200/70 text-sm mb-4">Get your name on the honour roll and become part of club history</p>
            <Button
              onClick={() => window.location.href = createPageUrl('JoinMembership')}
              className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold px-6"
            >
              Join for $70
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}