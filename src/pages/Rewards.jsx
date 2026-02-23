import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Gift, Lock, CheckCircle, Star, Clock, Ticket, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, addDays } from 'date-fns';

export default function Rewards() {
  const [activeTab, setActiveTab] = useState('available');
  const [selectedReward, setSelectedReward] = useState(null);
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

  // Block day pass holders from accessing rewards
  if (user && !membership) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 pt-safe">
          <div className="px-5 py-4 flex items-center gap-4">
            <Link to={createPageUrl('Home')}>
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <ArrowLeft className="w-5 h-5 text-white" />
              </div>
            </Link>
          </div>
        </div>
        <div className="px-5 py-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Members Only</h2>
          <p className="text-gray-600 mb-6">The rewards system is exclusive to membership holders.</p>
          <Link to={createPageUrl('Membership')}>
            <Button className="bg-amber-500 hover:bg-amber-600">
              View Memberships
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { data: rewards = [] } = useQuery({
    queryKey: ['rewards'],
    queryFn: () => base44.entities.Reward.filter({ is_active: true }, 'points_required')
  });

  const { data: redemptions = [] } = useQuery({
    queryKey: ['myRedemptions', user?.id],
    queryFn: () => base44.entities.RewardRedemption.filter({ user_id: user?.id }, '-created_date'),
    enabled: !!user?.id
  });

  const claimMutation = useMutation({
    mutationFn: async (reward) => {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      const expiresAt = reward.expiry_days 
        ? addDays(new Date(), reward.expiry_days).toISOString() 
        : null;

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

      // Deduct points
      await base44.entities.Membership.update(membership.id, {
        points: Math.max(0, (membership.points || 0) - reward.points_required)
      });

      // Create points transaction
      await base44.entities.PointsTransaction.create({
        user_id: user.id,
        membership_id: membership.id,
        points: -reward.points_required,
        transaction_type: 'redemption',
        description: `Redeemed: ${reward.title}`,
        related_id: reward.id,
        timestamp: new Date().toISOString()
      });

      return code;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['membership']);
      queryClient.invalidateQueries(['myRedemptions']);
      setSelectedReward(null);
    }
  });

  const points = membership?.points || 0;
  
  const availableRedemptions = redemptions.filter(r => r.status === 'available');
  const redeemedRedemptions = redemptions.filter(r => r.status === 'redeemed');

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-amber-500 to-orange-500 pt-safe">
        <div className="px-5 py-4 flex items-center gap-4">
          <Link to={createPageUrl('Home')}>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-white" />
            </div>
          </Link>
          <div className="flex-1">
            <h1 className="text-white text-xl font-bold">Rewards</h1>
            <p className="text-white/80 text-sm">Earn points, unlock rewards</p>
          </div>
          <div className="text-right">
            <p className="text-white/80 text-xs">Your Points</p>
            <p className="text-white text-2xl font-bold">{points}</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-6">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="w-full bg-white border border-gray-200">
            <TabsTrigger value="available" className="flex-1">Earn</TabsTrigger>
            <TabsTrigger value="unlocked" className="flex-1">
              Unlocked {availableRedemptions.length > 0 && `(${availableRedemptions.length})`}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1">History</TabsTrigger>
          </TabsList>
        </Tabs>

        <AnimatePresence mode="wait">
          {activeTab === 'available' && (
            <motion.div
              key="available"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {rewards.map((reward, idx) => {
                const canClaim = points >= reward.points_required;
                const progress = Math.min((points / reward.points_required) * 100, 100);
                
                return (
                  <motion.div
                    key={reward.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`bg-white rounded-2xl p-4 border ${
                      canClaim ? 'border-amber-200 shadow-lg shadow-amber-100' : 'border-gray-100'
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        canClaim ? 'bg-amber-100' : 'bg-gray-100'
                      }`}>
                        {canClaim ? (
                          <Gift className="w-7 h-7 text-amber-500" />
                        ) : (
                          <Lock className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">{reward.title}</h3>
                            <p className="text-sm text-gray-500">{reward.description}</p>
                          </div>
                          <div className={`px-2 py-1 rounded-lg text-xs font-bold ${
                            canClaim ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {reward.points_required} pts
                          </div>
                        </div>
                        
                        {/* Progress bar */}
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              canClaim ? 'bg-amber-500' : 'bg-gray-300'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>

                        {canClaim ? (
                          <Button 
                            size="sm"
                            className="bg-amber-500 hover:bg-amber-600"
                            onClick={() => setSelectedReward(reward)}
                          >
                            Claim Reward
                          </Button>
                        ) : (
                          <p className="text-sm text-gray-500">
                            {reward.points_required - points} more points needed
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {activeTab === 'unlocked' && (
            <motion.div
              key="unlocked"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {availableRedemptions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Ticket className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">No rewards yet</h3>
                  <p className="text-sm text-gray-500">Earn points to unlock rewards</p>
                </div>
              ) : (
                availableRedemptions.map((redemption) => (
                  <div 
                    key={redemption.id}
                    className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-lg shadow-emerald-50"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                          <Gift className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{redemption.reward_title}</h3>
                          {redemption.expires_at && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Expires {format(new Date(redemption.expires_at), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-xl p-4 text-center mb-3">
                      <p className="text-xs text-gray-500 mb-1">Redemption Code</p>
                      <p className="font-mono text-2xl font-bold text-gray-900 tracking-wider">
                        {redemption.redemption_code}
                      </p>
                    </div>
                    
                    <p className="text-xs text-gray-500 text-center">
                      Show this code to redeem at the club
                    </p>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {redeemedRedemptions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No redeemed rewards yet</p>
                </div>
              ) : (
                redeemedRedemptions.map((redemption) => (
                  <div key={redemption.id} className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{redemption.reward_title}</p>
                        <p className="text-sm text-gray-500">
                          Redeemed {redemption.redeemed_at ? format(new Date(redemption.redeemed_at), 'MMM d, yyyy') : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Claim Modal */}
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
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Claim Reward</h3>
                <button onClick={() => setSelectedReward(null)}>
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-2xl flex items-center justify-center">
                  <Gift className="w-8 h-8 text-amber-500" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-1">{selectedReward.title}</h4>
                <p className="text-gray-500">{selectedReward.description}</p>
              </div>

              <div className="bg-amber-50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-amber-700">Cost</span>
                  <span className="font-bold text-amber-700">{selectedReward.points_required} points</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-amber-700">Your points after</span>
                  <span className="font-bold text-amber-700">{points - selectedReward.points_required}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setSelectedReward(null)}
                >
                  Cancel
                </Button>
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