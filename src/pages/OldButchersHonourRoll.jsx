import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Shield, Star, Trophy, Edit3, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import clubConfig from '@/config/club.config';
import GlassCard from '@/components/ui-kit/GlassCard';
import Eyebrow from '@/components/ui-kit/Eyebrow';
import GoldButton from '@/components/ui-kit/GoldButton';
import { SkeletonCard } from '@/components/ui-kit/Skeleton';

const t = clubConfig.theme;

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

  if (!user) {
    return (
      <div className="px-5 py-6 space-y-4" style={{ minHeight: '100dvh', paddingBottom: '6rem' }}>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="min-h-full pb-24">
      {/* Header */}
      <div className="relative pt-safe px-5 py-8 overflow-hidden" style={{ background: `linear-gradient(160deg, ${t.bg1}, ${t.bg0})` }}>
        <div className="absolute inset-0 opacity-10 select-none pointer-events-none">
          <div className="absolute top-4 left-4 select-none" style={{ fontSize: 96, fontWeight: 900, color: t.gold }}>1908</div>
          <div className="absolute bottom-4 right-4 select-none rotate-12" style={{ fontSize: 64, fontWeight: 900, color: t.gold }}>BB</div>
        </div>
        <div className="relative">
          <Link to={createPageUrl('Membership')}>
            <button className="flex items-center gap-2 mb-6" style={{ color: t.goldHi }}>
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm" style={{ fontFamily: t.fontBody }}>Back</span>
            </button>
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: `${t.gold}22`, border: `2px solid ${t.gold}` }}>
              <Trophy className="w-8 h-8" style={{ color: t.gold }} />
            </div>
            <div>
              <Eyebrow color={t.gold}>Legacy Members</Eyebrow>
              <h1 className="text-white text-2xl" style={{ fontFamily: t.fontDisplay }}>Old Butchers</h1>
              <h2 className="text-white text-2xl" style={{ fontFamily: t.fontDisplay }}>Honour Roll</h2>
            </div>
          </div>
          <p className="text-sm italic font-medium" style={{ color: t.goldHi, fontFamily: t.fontBody }}>
            "Once a Butcher, Always a Butcher"
          </p>
        </div>
      </div>

      <div className="px-5 py-6 space-y-6">
        {/* Your entry (if Old Butcher member) */}
        {isOldButcher && (
          <GlassCard className="p-5" style={{ borderColor: `${t.gold}44` }}>
            <div className="flex items-center justify-between mb-3">
              <Eyebrow color={t.gold}>Your Entry</Eyebrow>
              {!editing ? (
                <button onClick={() => setEditing(true)} className="text-xs flex items-center gap-1" style={{ color: t.gold }}>
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => updateMutation.mutate()} style={{ color: t.green }}>
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditing(false)} style={{ color: '#ef4444' }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: t.goldHi, fontFamily: t.fontBody }}>Years Played (e.g. 2010–2015)</label>
                  <input
                    value={yearsPlayed}
                    onChange={e => setYearsPlayed(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-white text-sm"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    placeholder="e.g. 2008–2013"
                  />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: t.goldHi, fontFamily: t.fontBody }}>Grade (e.g. First Grade, Reserve Grade)</label>
                  <input
                    value={teamGrade}
                    onChange={e => setTeamGrade(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-white text-sm"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    placeholder="e.g. First Grade"
                  />
                </div>
              </div>
            ) : (
              <div>
                <p className="text-white font-bold text-lg" style={{ fontFamily: t.fontBody }}>{user?.full_name}</p>
                {yearsPlayed && <p className="text-sm" style={{ color: t.goldHi, fontFamily: t.fontBody }}>{yearsPlayed} · {teamGrade || 'Member'}</p>}
                {!yearsPlayed && <p className="text-sm italic" style={{ color: t.gold, fontFamily: t.fontBody }}>Add your years played and grade above</p>}
              </div>
            )}
          </GlassCard>
        )}

        {/* Stats bar */}
        <div className="grid grid-cols-2 gap-3">
          <GlassCard className="p-4 text-center">
            <p className="text-2xl" style={{ color: t.gold, fontFamily: t.fontDisplay }}>{honourRoll.length}</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: t.fontBody }}>Legacy Members</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <p className="text-2xl" style={{ color: t.gold, fontFamily: t.fontDisplay }}>1908</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: t.fontBody }}>Est. Season</p>
          </GlassCard>
        </div>

        {/* The roll — clean, dignified, highly legible */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5" style={{ color: t.gold }} />
            <h3 className="text-white font-bold text-sm" style={{ fontFamily: t.fontBody }}>2026 Roll of Honour</h3>
          </div>
          <div className="space-y-3">
            {honourRoll.length === 0 && (
              <GlassCard className="py-12 text-center">
                <Trophy className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: t.fontBody }}>The honour roll will grow as members join</p>
              </GlassCard>
            )}
            {honourRoll.map((member, idx) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <GlassCard className="px-5 py-4 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${t.gold}1a`, border: `1px solid ${t.gold}33` }}>
                    <span className="text-xs font-bold" style={{ color: t.gold }}>{idx + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm" style={{ fontFamily: t.fontBody }}>{member.user_name || 'Member'}</p>
                    {(member.years_played || member.team_grade_played) && (
                      <p className="text-xs" style={{ color: t.goldHi, fontFamily: t.fontBody }}>
                        {[member.years_played, member.team_grade_played].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                  <Star className="w-4 h-4 flex-shrink-0" style={{ color: t.gold }} />
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA for non-members */}
        {!isOldButcher && (
          <GlassCard className="p-6 text-center" style={{ borderColor: `${t.gold}44` }}>
            <Trophy className="w-10 h-10 mx-auto mb-3" style={{ color: t.gold }} />
            <h3 className="text-white font-bold text-lg mb-1" style={{ fontFamily: t.fontBody }}>Join the Old Butchers</h3>
            <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: t.fontBody }}>Get your name on the honour roll and become part of club history</p>
            <GoldButton onClick={() => window.location.href = createPageUrl('JoinMembership')}>
              Join for $70
            </GoldButton>
          </GlassCard>
        )}
      </div>
    </div>
  );
}