import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trophy, Beer, Gift, Ticket, ArrowRight, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, Navigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import clubConfig from '@/config/club.config';
import GlassCard from '@/components/ui-kit/GlassCard';
import Eyebrow from '@/components/ui-kit/Eyebrow';
import GoldButton from '@/components/ui-kit/GoldButton';
import { SkeletonCard } from '@/components/ui-kit/Skeleton';

const t = clubConfig.theme;

export default function PointsRewards() {
  const [user, setUser] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
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
      const memberships = await base44.entities.Membership.filter({ 
        user_id: user.id, 
        status: 'active' 
      });
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
    queryFn: () => base44.entities.PointsTransaction.filter(
      { membership_id: membership.id },
      '-timestamp',
      20
    ),
    enabled: !!membership?.id
  });

  const redeemMutation = useMutation({
    mutationFn: async (reward) => {
      const newBalance = (membership.points || 0) - reward.points_required;
      
      await base44.entities.Membership.update(membership.id, {
        points: newBalance
      });

      await base44.entities.PointsTransaction.create({
        user_id: membership.user_id,
        membership_id: membership.id,
        points: -reward.points_required,
        transaction_type: 'redemption',
        description: `Redeemed: ${reward.title}`,
        related_id: reward.id,
        timestamp: new Date().toISOString()
      });

      await base44.entities.RewardRedemption.create({
        user_id: membership.user_id,
        membership_id: membership.id,
        reward_id: reward.id,
        reward_title: reward.title,
        status: 'available',
        unlocked_at: new Date().toISOString(),
        redemption_code: Math.random().toString(36).substring(2, 10).toUpperCase()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['membership']);
      queryClient.invalidateQueries(['pointsTransactions']);
      alert('Reward redeemed! Check your Benefits tab to view your code.');
    }
  });

  const pointsBalance = membership?.points || 0;
  const isRewardsEnabled = membership?.tier_name !== 'Supporter Pack' && membership?.tier_name !== 'Day Pass';

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

  const getTransactionColor = (type) => {
    switch(type) {
      case 'attendance': return t.cyan;
      case 'bar_purchase': return t.gold;
      case 'leagues_club': return '#a78bfa';
      case 'redemption': return '#ef4444';
      default: return 'rgba(255,255,255,0.6)';
    }
  };

  if (!clubConfig.features?.points_rewards) {
    return <Navigate to={createPageUrl('Home')} replace />;
  }

  if (!user) {
    return (
      <div className="px-5 py-6 space-y-4" style={{ minHeight: '100dvh', paddingBottom: '6rem' }}>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="min-h-full pb-24">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <Link to={createPageUrl('Home')}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.09)' }}>
            <ArrowRight className="w-5 h-5 text-white rotate-180" />
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
        {/* Hero Balance Card */}
        <GlassCard className="relative overflow-hidden p-6 text-center">
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 40%, ${t.gold}22, transparent 60%)` }} />
          <div className="relative z-10">
            <Eyebrow color={t.gold}>Season Balance</Eyebrow>
            <motion.p
              key={pointsBalance}
              initial={{ scale: 1.1, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              style={{ fontFamily: t.fontDisplay, fontSize: '64px', color: t.gold, textShadow: `0 0 30px ${t.gold}66`, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}
            >
              {pointsBalance}
            </motion.p>
            <p className="text-white/50 text-xs mt-1" style={{ fontFamily: t.fontBody }}>points</p>
            <Link to={createPageUrl('HowPointsWork')} className="inline-block mt-3">
              <span className="text-xs font-semibold" style={{ color: t.cyan, fontFamily: t.fontBody }}>How it works →</span>
            </Link>
          </div>
        </GlassCard>

        {/* Content */}
        {!isRewardsEnabled ? (
          <GlassCard className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: `${t.gold}22` }}>
              <Trophy className="w-8 h-8" style={{ color: t.gold }} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: t.fontBody }}>Rewards Not Included</h2>
            <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: t.fontBody }}>
              The Supporter Pack doesn't include access to the rewards system. Upgrade to a Premium or Old Butchers membership to start earning and redeeming points.
            </p>
            <Link to="/JoinMembership">
              <GoldButton fullWidth>
                Upgrade Membership
                <ArrowRight className="w-4 h-4" />
              </GoldButton>
            </Link>
          </GlassCard>
        ) : (
          <AnimatePresence mode="wait">
            {showHistory ? (
              <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <GlassCard className="divide-y divide-white/5 overflow-hidden">
                  <div className="px-4 py-3">
                    <Eyebrow color={t.gold}>Recent Activity</Eyebrow>
                  </div>
                  {transactions.length === 0 && (
                    <p className="text-center text-white/40 py-10" style={{ fontFamily: t.fontBody }}>No activity yet</p>
                  )}
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate" style={{ fontFamily: t.fontBody }}>{tx.description}</p>
                        <p className="text-xs text-white/40" style={{ fontFamily: t.fontBody }}>
                          {new Date(tx.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-base font-bold" style={{ color: getTransactionColor(tx.transaction_type), fontFamily: t.fontDisplay }}>
                        {tx.points > 0 ? '+' : ''}{tx.points}
                      </p>
                    </div>
                  ))}
                </GlassCard>
              </motion.div>
            ) : (
              <motion.div key="rewards" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-white text-base font-bold" style={{ fontFamily: t.fontBody }}>Available Rewards</h2>
                </div>

                {rewards.map((reward) => {
                  const canAfford = pointsBalance >= reward.points_required;

                  return (
                    <motion.div
                      key={reward.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: canAfford ? 1 : 0.6, y: 0 }}
                    >
                      <GlassCard className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: canAfford ? `${t.gold}22` : 'rgba(255,255,255,0.05)' }}>
                            <span style={{ color: canAfford ? t.gold : 'rgba(255,255,255,0.3)' }}>{getRewardIcon(reward.reward_type)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white text-sm" style={{ fontFamily: t.fontBody }}>{reward.title}</p>
                            <p className="text-xs" style={{ color: canAfford ? t.gold : 'rgba(255,255,255,0.4)', fontFamily: t.fontDisplay }}>
                              {reward.points_required} pts
                            </p>
                          </div>
                          {canAfford ? (
                            <GoldButton
                              onClick={() => {
                                if (confirm(`Redeem ${reward.title} for ${reward.points_required} points?`)) {
                                  redeemMutation.mutate(reward);
                                }
                              }}
                              style={{ flexShrink: 0 }}
                            >
                              Redeem
                            </GoldButton>
                          ) : (
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span className="text-xs text-white/40" style={{ fontFamily: t.fontBody }}>{reward.points_required - pointsBalance} more</span>
                            </div>
                          )}
                        </div>
                      </GlassCard>
                    </motion.div>
                  );
                })}

                {rewards.length === 0 && (
                  <GlassCard className="p-8 text-center">
                    <Trophy className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
                    <p className="text-white/60 text-sm" style={{ fontFamily: t.fontBody }}>No rewards available yet</p>
                  </GlassCard>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}