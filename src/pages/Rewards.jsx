import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Gift, Lock, Star, Zap, History, CheckCircle, Clock, X, Beer, Ticket, Trophy, Flame, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { format, addDays } from 'date-fns';
import clubConfig from '@/config/club.config';
import GlassCard from '../components/home/GlassCard';

const t = clubConfig.theme;

export default function Rewards() {
  const [selectedReward, setSelectedReward] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
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

  const { data: transactions = [] } = useQuery({
    queryKey: ['pointsTransactions', membership?.id],
    queryFn: () => base44.entities.PointsTransaction.filter({ membership_id: membership.id }, '-timestamp', 30),
    enabled: !!membership?.id
  });

  const { data: redemptions = [] } = useQuery({
    queryKey: ['myRedemptions', user?.id],
    queryFn: () => base44.entities.RewardRedemption.filter({ user_id: user?.id }, '-created_date'),
    enabled: !!user?.id
  });

  const claimMutation = useMutation({
    mutationFn: async (reward) => {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      const expiresAt = reward.expiry_days ? addDays(new Date(), reward.expiry_days).toISOString() : null;

      await base44.entities.RewardRedemption.create({
        user_id: user.id,
        membership_id: membership.id,
        reward_id: reward.id,
        reward_title: reward.title,
        status: 'available',
        unlocked_at: new Date().toISOString(),
        expires_at: expiresAt,
        redemption_code: code
      });

      await base44.entities.Membership.update(membership.id, {
        points: Math.max(0, (membership.points || 0) - reward.points_required)
      });

      await base44.entities.PointsTransaction.create({
        user_id: user.id,
        membership_id: membership.id,
        points: -reward.points_required,
        transaction_type: 'redemption',
        description: `Redeemed: ${reward.title}`,
        related_id: reward.id,
        timestamp: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['membership']);
      queryClient.invalidateQueries(['myRedemptions']);
      queryClient.invalidateQueries(['pointsTransactions']);
      setSelectedReward(null);
    }
  });

  const points = membership?.points || 0;
  const availableRedemptions = redemptions.filter(r => r.status === 'available');

  const nextReward = rewards.find(r => r.points_required > points) || rewards[rewards.length - 1] || null;
  const claimableRewards = rewards.filter(r => points >= r.points_required);
  const canRedeem = claimableRewards.length > 0;

  const getRewardIcon = (type) => {
    switch(type) {
      case 'beer_mid':
      case 'beer_full':
        return <Beer className="w-5 h-5" />;
      case 'merchandise':
        return <Gift className="w-5 h-5" />;
      case 'prize_draw':
        return <Ticket className="w-5 h-5" />;
      default:
        return <Trophy className="w-5 h-5" />;
    }
  };

  const getTransactionIcon = (type, pts) => {
    if (pts < 0) return <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}><Gift className="w-4 h-4" style={{ color: t.gold }} /></div>;
    switch(type) {
      case 'attendance': return <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}><Zap className="w-4 h-4" style={{ color: t.cyan }} /></div>;
      case 'bar_purchase': return <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}><Beer className="w-4 h-4" style={{ color: t.gold }} /></div>;
      default: return <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}><Star className="w-4 h-4 text-white/50" /></div>;
    }
  };

  // Non-member gate (must be after all hooks)
  if (user && !membership) {
    return (
      <div className="relative flex flex-col min-h-screen pb-24" style={{ background: `radial-gradient(ellipse at top, ${t.bg1} 0%, ${t.bg0} 70%)` }}>
        <div className="px-4 pt-4 pb-2 flex items-center gap-3">
          <Link to={createPageUrl('Home')}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.09)' }}>
              <ArrowLeft className="w-5 h-5 text-white" />
            </div>
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-center px-5">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}>
              <Lock className="w-8 h-8 text-white/40" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: t.fontBody }}>Members Only</h2>
            <p className="text-white/50 mb-6" style={{ fontFamily: t.fontBody }}>The rewards system is exclusive to membership holders.</p>
            <Link to={createPageUrl('Membership')}>
              <Button style={{ background: t.gold, color: t.bg0 }}>View Memberships</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col min-h-screen" style={{ background: `radial-gradient(ellipse at top, ${t.bg1} 0%, ${t.bg0} 70%)` }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <Link to={createPageUrl('Home')}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.09)' }}>
            <ArrowLeft className="w-5 h-5 text-white" />
          </div>
        </Link>
        <h1 className="text-white text-lg" style={{ fontFamily: t.fontDisplay }}>Points & Rewards</h1>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: showHistory ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.09)' }}
        >
          <History className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="px-4 pb-4 space-y-4">
        {/* Hero Card */}
        <GlassCard className="relative overflow-hidden p-6 text-center">
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 40%, ${t.gold}22, transparent 60%)` }} />
          <div className="relative z-10">
            <p className="text-[10px] uppercase tracking-[0.25em] font-semibold mb-2" style={{ color: t.gold }}>Season Balance</p>
            <motion.p
              key={points}
              initial={{ scale: 1.1, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              style={{ fontFamily: t.fontDisplay, fontSize: '72px', color: t.gold, textShadow: `0 0 30px ${t.gold}66`, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}
            >
              {points}
            </motion.p>
            <p className="text-white/50 text-xs mt-1" style={{ fontFamily: t.fontBody }}>points</p>

            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-1.5">
                <Flame className="w-4 h-4" style={{ color: t.gold }} />
                <span className="text-white/80 text-sm" style={{ fontFamily: t.fontBody }}>{membership?.total_checkins || 0} check-ins</span>
              </div>
              {availableRedemptions.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4" style={{ color: t.gold }} />
                  <span className="text-white/80 text-sm" style={{ fontFamily: t.fontBody }}>{availableRedemptions.length} badge{availableRedemptions.length > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Reward Progress */}
        {nextReward && (
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] font-semibold" style={{ color: t.gold }}>Next Reward</p>
                <p className="text-white text-sm font-bold mt-0.5" style={{ fontFamily: t.fontBody }}>{nextReward.title}</p>
              </div>
              <p className="text-white/60 text-xs" style={{ fontFamily: t.fontBody }}>{points} / {nextReward.points_required}</p>
            </div>
            <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((points / nextReward.points_required) * 100, 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${t.gold}, ${t.goldHi})`, boxShadow: `0 0 12px ${t.gold}88` }}
              />
            </div>
            <p className="text-white/40 text-xs mt-2" style={{ fontFamily: t.fontBody }}>
              {points >= nextReward.points_required ? 'Ready to redeem!' : `${nextReward.points_required - points} points to go`}
            </p>
          </GlassCard>
        )}

        <AnimatePresence mode="wait">
          {showHistory ? (
            /* Activity History */
            <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
              <h2 className="text-white text-base font-bold px-1" style={{ fontFamily: t.fontBody }}>Points Activity</h2>
              <GlassCard className="divide-y divide-white/5 overflow-hidden">
                {transactions.length === 0 && (
                  <p className="text-center text-white/40 py-10" style={{ fontFamily: t.fontBody }}>No activity yet</p>
                )}
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                    {getTransactionIcon(tx.transaction_type, tx.points)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate" style={{ fontFamily: t.fontBody }}>{tx.description}</p>
                      <p className="text-xs text-white/40" style={{ fontFamily: t.fontBody }}>{tx.timestamp ? format(new Date(tx.timestamp), 'dd MMM yyyy, h:mm a') : ''}</p>
                    </div>
                    <p className="text-base font-bold" style={{ color: tx.points >= 0 ? t.green : '#ef4444', fontFamily: t.fontDisplay }}>
                      {tx.points >= 0 ? '+' : ''}{tx.points}
                    </p>
                  </div>
                ))}
              </GlassCard>
            </motion.div>
          ) : (
            <motion.div key="rewards" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Available Redemptions */}
              {availableRedemptions.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-white text-base font-bold px-1 flex items-center gap-2" style={{ fontFamily: t.fontBody }}>
                    <CheckCircle className="w-4 h-4" style={{ color: t.green }} />
                    Ready to Use
                  </h2>
                  <div className="space-y-3">
                    {availableRedemptions.map((redemption) => (
                      <GlassCard key={redemption.id} className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${t.green}22` }}>
                            <CheckCircle className="w-5 h-5" style={{ color: t.green }} />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-white text-sm" style={{ fontFamily: t.fontBody }}>{redemption.reward_title}</p>
                            {redemption.expires_at && (
                              <p className="text-xs text-white/40 flex items-center gap-1" style={{ fontFamily: t.fontBody }}>
                                <Clock className="w-3 h-3" />
                                Expires {format(new Date(redemption.expires_at), 'MMM d, yyyy')}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
                          <p className="text-xs text-white/40 mb-1" style={{ fontFamily: t.fontBody }}>Redemption Code</p>
                          <p className="font-mono text-2xl font-bold text-white tracking-widest">{redemption.redemption_code}</p>
                        </div>
                        <p className="text-xs text-white/40 text-center mt-2" style={{ fontFamily: t.fontBody }}>Show this to staff at the club</p>
                      </GlassCard>
                    ))}
                  </div>
                </div>
              )}

              {/* Full Rewards List */}
              {rewards.length > 0 && (
                <div className="space-y-3">
                  <h2 className="text-white text-base font-bold px-1" style={{ fontFamily: t.fontBody }}>All Rewards</h2>
                  <div className="space-y-3">
                    {rewards.map((reward) => {
                      const affordable = points >= reward.points_required;
                      return (
                        <GlassCard key={reward.id} className={`p-4 ${affordable ? '' : 'opacity-60'}`}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: affordable ? `${t.gold}22` : 'rgba(255,255,255,0.05)' }}>
                              <span style={{ color: affordable ? t.gold : 'rgba(255,255,255,0.3)' }}>{getRewardIcon(reward.reward_type)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-white text-sm" style={{ fontFamily: t.fontBody }}>{reward.title}</p>
                              <p className="text-xs" style={{ color: affordable ? t.gold : 'rgba(255,255,255,0.4)', fontFamily: t.fontDisplay }}>
                                {reward.points_required} pts
                              </p>
                            </div>
                            {affordable ? (
                              <button
                                onClick={() => setSelectedReward(reward)}
                                className="rounded-xl px-4 py-2 text-sm font-bold flex-shrink-0 transition-all"
                                style={{
                                  background: `linear-gradient(135deg, ${t.gold}, ${t.goldHi})`,
                                  color: t.bg0,
                                  boxShadow: `0 0 16px ${t.gold}55`
                                }}
                              >
                                Redeem
                              </button>
                            ) : (
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <Lock className="w-4 h-4 text-white/30" />
                                <span className="text-xs text-white/40" style={{ fontFamily: t.fontBody }}>{reward.points_required - points} pts</span>
                              </div>
                            )}
                          </div>
                        </GlassCard>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* How Rewards Work link */}
              <div className="text-center pt-2 pb-4">
                <Link to={createPageUrl('HowPointsWork')}>
                  <GlassCard className="inline-block px-8 py-4">
                    <span className="text-white font-semibold text-sm" style={{ fontFamily: t.fontBody }}>How rewards work →</span>
                  </GlassCard>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Claim Confirmation Modal */}
      <AnimatePresence>
        {selectedReward && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{ background: 'rgba(6,13,31,0.8)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
            onClick={() => setSelectedReward(null)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-md w-full p-6 rounded-3xl"
              style={{
                background: `linear-gradient(160deg, ${t.bg1}, ${t.bg0})`,
                border: '1px solid rgba(255,255,255,0.09)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.5)'
              }}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold text-white" style={{ fontFamily: t.fontBody }}>Are you sure?</h3>
                <button onClick={() => setSelectedReward(null)}>
                  <X className="w-6 h-6 text-white/40" />
                </button>
              </div>

              <div className="text-center mb-5">
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl flex items-center justify-center" style={{ background: `${t.gold}22` }}>
                  <Gift className="w-8 h-8" style={{ color: t.gold }} />
                </div>
                <p className="text-white/60 text-sm mb-1" style={{ fontFamily: t.fontBody }}>Are you sure you want to redeem your points?</p>
                <h4 className="text-lg font-bold text-white" style={{ fontFamily: t.fontBody }}>{selectedReward.title}</h4>
              </div>

              <div className="rounded-xl p-4 mb-5 space-y-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="flex justify-between text-sm" style={{ fontFamily: t.fontBody }}>
                  <span className="text-white/60">Cost</span>
                  <span className="font-bold text-white">{selectedReward.points_required} pts</span>
                </div>
                <div className="flex justify-between text-sm" style={{ fontFamily: t.fontBody }}>
                  <span className="text-white/60">Balance after</span>
                  <span className="font-bold text-white">{points - selectedReward.points_required} pts</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedReward(null)}>Cancel</Button>
                <Button
                  className="flex-1"
                  style={{ background: `linear-gradient(135deg, ${t.gold}, ${t.goldHi})`, color: t.bg0 }}
                  onClick={() => claimMutation.mutate(selectedReward)}
                  disabled={claimMutation.isPending}
                >
                  {claimMutation.isPending ? 'Redeeming...' : 'Confirm'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}