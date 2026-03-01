import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Gift, Lock, Star, Zap, History, CheckCircle, Clock, X, Beer, Ticket, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { format, addDays } from 'date-fns';

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

  const getRewardIcon = (type) => {
    switch(type) {
      case 'beer_mid':
      case 'beer_full':
        return <Beer className="w-6 h-6" />;
      case 'merchandise':
        return <Gift className="w-6 h-6" />;
      case 'prize_draw':
        return <Ticket className="w-6 h-6" />;
      default:
        return <Trophy className="w-6 h-6" />;
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

  // Non-member gate (after all hooks)
  if (user && !membership) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-gradient-to-br from-[#1a365d] to-[#2c5282] pt-safe">
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
      {/* Header */}
      <div className="bg-[#1a365d] pt-safe">
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Home')}>
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <ArrowLeft className="w-5 h-5 text-white" />
              </div>
            </Link>
            <div>
              <h1 className="text-white text-xl font-bold">Points & Rewards</h1>
              <p className="text-blue-200 text-xs">Track your points balance</p>
            </div>
          </div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${showHistory ? 'bg-white/30' : 'bg-white/10'}`}
          >
            <History className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Big Points Display */}
        <div className="px-5 pb-8 pt-2 text-center">
          <p className="text-blue-200 text-sm mb-1">Your Balance</p>
          <motion.p
            key={points}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            className="text-6xl font-bold text-white"
          >
            {points}
          </motion.p>
          <p className="text-blue-300 text-base mt-1">Points</p>
        </div>
      </div>

      <div className="px-4 py-5 space-y-4">
        <AnimatePresence mode="wait">
          {showHistory ? (
            /* ---- ACTIVITY HISTORY ---- */
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

              {/* Unlocked Rewards */}
              {availableRedemptions.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-3">🎉 Ready to Redeem</h2>
                  <div className="space-y-3">
                    {availableRedemptions.map((redemption) => (
                      <div key={redemption.id} className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{redemption.reward_title}</p>
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

              {/* Rewards Progress */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3">Rewards Progress</h2>
                <div className="space-y-3">
                  {rewards.map((reward) => {
                    const canClaim = points >= reward.points_required;
                    const progress = Math.min((points / reward.points_required) * 100, 100);
                    const pointsNeeded = Math.max(0, reward.points_required - points);

                    return (
                      <div
                        key={reward.id}
                        className={`bg-white rounded-2xl p-4 border shadow-sm ${canClaim ? 'border-amber-200' : 'border-gray-100'}`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${canClaim ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400'}`}>
                            {getRewardIcon(reward.reward_type)}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{reward.title}</p>
                            <p className="text-xs text-gray-500">{reward.description}</p>
                          </div>
                          <div className={`text-sm font-bold px-2 py-1 rounded-lg ${canClaim ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                            {reward.points_required} pts
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-2">
                          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              className={`h-full rounded-full ${canClaim ? 'bg-amber-400' : 'bg-blue-400'}`}
                            />
                          </div>
                          <div className="flex justify-between mt-1">
                            <p className="text-xs text-gray-400">{points} pts</p>
                            <p className="text-xs text-gray-400">{reward.points_required} pts</p>
                          </div>
                        </div>

                        {canClaim ? (
                          <Button
                            size="sm"
                            className="w-full bg-amber-500 hover:bg-amber-600 mt-1"
                            onClick={() => setSelectedReward(reward)}
                          >
                            <Gift className="w-4 h-4 mr-2" /> Claim Reward
                          </Button>
                        ) : (
                          <p className="text-xs text-center text-gray-400 mt-1">
                            {pointsNeeded} more points needed
                          </p>
                        )}
                      </div>
                    );
                  })}

                  {rewards.length === 0 && (
                    <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
                      <Trophy className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-400">No rewards configured yet</p>
                    </div>
                  )}
                </div>
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
                <h3 className="text-xl font-bold text-gray-900">Claim Reward</h3>
                <button onClick={() => setSelectedReward(null)}>
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="text-center mb-5">
                <div className="w-16 h-16 mx-auto mb-3 bg-amber-100 rounded-2xl flex items-center justify-center">
                  <Gift className="w-8 h-8 text-amber-500" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-1">{selectedReward.title}</h4>
                <p className="text-gray-500 text-sm">{selectedReward.description}</p>
              </div>

              <div className="bg-amber-50 rounded-xl p-4 mb-5 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-amber-700">Cost</span>
                  <span className="font-bold text-amber-700">{selectedReward.points_required} pts</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-amber-700">Balance after</span>
                  <span className="font-bold text-amber-700">{points - selectedReward.points_required} pts</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedReward(null)}>Cancel</Button>
                <Button
                  className="flex-1 bg-amber-500 hover:bg-amber-600"
                  onClick={() => claimMutation.mutate(selectedReward)}
                  disabled={claimMutation.isPending}
                >
                  {claimMutation.isPending ? 'Claiming...' : 'Confirm'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}