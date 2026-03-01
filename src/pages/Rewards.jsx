import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Gift, Lock, Star, Zap, History, CheckCircle, Clock, X, Beer, Ticket, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { format, addDays } from 'date-fns';

// SVG circular progress ring
function ProgressRing({ points, target, size = 220 }) {
  const radius = (size / 2) - 18;
  const circumference = 2 * Math.PI * radius;
  const progress = target > 0 ? Math.min(points / target, 1) : 0;
  const offset = circumference - progress * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute top-0 left-0 -rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="12"
        />
        {/* Progress */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={progress >= 1 ? '#22c55e' : '#f59e0b'}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      {/* Centre content */}
      <div className="relative z-10 text-center">
        <motion.p
          key={points}
          initial={{ scale: 1.2, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="text-5xl font-bold text-white leading-none"
        >
          {points}
        </motion.p>
        <p className="text-blue-200 text-sm mt-1">points</p>
        {target > 0 && (
          <p className="text-blue-300 text-xs mt-1">/ {target} for next</p>
        )}
      </div>
    </div>
  );
}

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

  // Find the next reward the user is working toward
  const nextReward = rewards.find(r => r.points_required > points) || rewards[rewards.length - 1] || null;
  // Find rewards the user can currently claim
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
    if (pts < 0) return <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center"><Gift className="w-4 h-4 text-red-500" /></div>;
    switch(type) {
      case 'attendance': return <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center"><Zap className="w-4 h-4 text-blue-500" /></div>;
      case 'bar_purchase': return <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center"><Beer className="w-4 h-4 text-amber-500" /></div>;
      default: return <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"><Star className="w-4 h-4 text-gray-500" /></div>;
    }
  };

  // Non-member gate (must be after all hooks)
  if (user && !membership) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-[#1a365d] pt-safe">
          <div className="px-5 py-4 flex items-center gap-4">
            <Link to={createPageUrl('Home')}>
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <ArrowLeft className="w-5 h-5 text-white" />
              </div>
            </Link>
          </div>
        </div>
        <div className="px-5 py-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Members Only</h2>
          <p className="text-gray-600 mb-6">The rewards system is exclusive to membership holders.</p>
          <Link to={createPageUrl('Membership')}>
            <Button className="bg-[#1a365d] hover:bg-[#2c5282]">View Memberships</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header + Circle */}
      <div className="bg-[#1a365d] pt-safe pb-10">
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Home')}>
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <ArrowLeft className="w-5 h-5 text-white" />
              </div>
            </Link>
            <div>
              <h1 className="text-white text-xl font-bold">Points & Rewards</h1>
              <p className="text-blue-200 text-xs">Your progress toward rewards</p>
            </div>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${showHistory ? 'bg-white/30' : 'bg-white/10'}`}
          >
            <History className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Progress Circle */}
        <div className="flex flex-col items-center pt-2 pb-2">
          <ProgressRing
            points={points}
            target={nextReward?.points_required || 100}
            size={220}
          />
          {nextReward && points < nextReward.points_required && (
            <p className="text-blue-200 text-sm mt-3">
              {nextReward.points_required - points} more points for <span className="text-white font-semibold">{nextReward.title}</span>
            </p>
          )}
          {canRedeem && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-green-300 text-sm mt-3 font-semibold"
            >
              🎉 You have rewards ready to claim!
            </motion.p>
          )}
        </div>
      </div>

      {/* Redeem Button */}
      <div className="px-5 -mt-5">
        <AnimatePresence mode="wait">
          {canRedeem ? (
            <motion.div
              key="active"
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* If multiple claimable, show a selector; otherwise direct claim */}
              {claimableRewards.length === 1 ? (
                <button
                  onClick={() => setSelectedReward(claimableRewards[0])}
                  className="w-full py-4 rounded-2xl font-bold text-lg text-white shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                    boxShadow: '0 0 24px rgba(34,197,94,0.4)'
                  }}
                >
                  Redeem — {claimableRewards[0].title}
                </button>
              ) : (
                <div className="bg-white rounded-2xl shadow-lg border border-green-200 overflow-hidden">
                  <div className="bg-green-500 px-4 py-3 text-center" style={{ boxShadow: '0 0 20px rgba(34,197,94,0.3)' }}>
                    <p className="text-white font-bold text-base">Redeem a Reward</p>
                    <p className="text-green-100 text-xs">Choose one below</p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {claimableRewards.map(reward => (
                      <button
                        key={reward.id}
                        onClick={() => setSelectedReward(reward)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-green-50 transition-colors text-left"
                      >
                        <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center text-green-600">
                          {getRewardIcon(reward.reward_type)}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-sm">{reward.title}</p>
                          <p className="text-xs text-gray-400">{reward.points_required} pts</p>
                        </div>
                        <span className="text-green-500 text-sm font-bold">Claim →</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="locked" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <button
                disabled
                className="w-full py-4 rounded-2xl font-bold text-lg text-gray-400 bg-gray-200 cursor-not-allowed"
              >
                <Lock className="w-5 h-5 inline mr-2 opacity-60" />
                Not enough points to redeem
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-4 py-5 space-y-4">
        <AnimatePresence mode="wait">
          {showHistory ? (
            /* Activity History */
            <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <h2 className="text-lg font-bold text-gray-900 mb-3">Points Activity</h2>
              <div className="bg-white rounded-2xl divide-y divide-gray-50 shadow-sm">
                {transactions.length === 0 && (
                  <p className="text-center text-gray-500 py-10">No activity yet</p>
                )}
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                    {getTransactionIcon(tx.transaction_type, tx.points)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{tx.description}</p>
                      <p className="text-xs text-gray-400">{tx.timestamp ? format(new Date(tx.timestamp), 'dd MMM yyyy, h:mm a') : ''}</p>
                    </div>
                    <p className={`text-base font-bold ${tx.points >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {tx.points >= 0 ? '+' : ''}{tx.points}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key="rewards" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

              {/* Unlocked / pending codes */}
              {availableRedemptions.length > 0 && (
                <div>
                  <h2 className="text-base font-bold text-gray-900 mb-3">🎉 Ready to Use</h2>
                  <div className="space-y-3">
                    {availableRedemptions.map((redemption) => (
                      <div key={redemption.id} className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 text-sm">{redemption.reward_title}</p>
                            {redemption.expires_at && (
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Expires {format(new Date(redemption.expires_at), 'MMM d, yyyy')}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="bg-white rounded-xl p-3 text-center">
                          <p className="text-xs text-gray-400 mb-1">Redemption Code</p>
                          <p className="font-mono text-2xl font-bold text-gray-900 tracking-widest">{redemption.redemption_code}</p>
                        </div>
                        <p className="text-xs text-gray-400 text-center mt-2">Show this to staff at the club</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* How Rewards Work link */}
              <div className="text-center pt-2 pb-4">
                <Link to={createPageUrl('HowPointsWork')} className="inline-block bg-white border border-blue-200 text-blue-600 font-semibold text-base px-8 py-4 rounded-2xl shadow-sm">
                  How rewards work →
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setSelectedReward(null)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold text-gray-900">Are you sure?</h3>
                <button onClick={() => setSelectedReward(null)}>
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="text-center mb-5">
                <div className="w-16 h-16 mx-auto mb-3 bg-green-100 rounded-2xl flex items-center justify-center">
                  <Gift className="w-8 h-8 text-green-500" />
                </div>
                <p className="text-gray-600 text-sm mb-1">Are you sure you want to redeem your points?</p>
                <h4 className="text-lg font-bold text-gray-900">{selectedReward.title}</h4>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Cost</span>
                  <span className="font-bold text-gray-800">{selectedReward.points_required} pts</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Balance after</span>
                  <span className="font-bold text-gray-800">{points - selectedReward.points_required} pts</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedReward(null)}>Cancel</Button>
                <Button
                  className="flex-1 bg-green-500 hover:bg-green-600"
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