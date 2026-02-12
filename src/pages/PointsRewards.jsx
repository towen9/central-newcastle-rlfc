import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trophy, Beer, Gift, Ticket, ArrowRight, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

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

  const getRewardIcon = (type) => {
    switch(type) {
      case 'beer_mid':
      case 'beer_full':
        return <Beer className="w-8 h-8" />;
      case 'merchandise':
        return <Gift className="w-8 h-8" />;
      case 'prize_draw':
        return <Ticket className="w-8 h-8" />;
      default:
        return <Trophy className="w-8 h-8" />;
    }
  };

  const getTransactionColor = (type) => {
    switch(type) {
      case 'attendance': return 'text-blue-600';
      case 'bar_purchase': return 'text-amber-600';
      case 'leagues_club': return 'text-purple-600';
      case 'redemption': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-[#1a365d] pt-safe pb-8">
        <div className="px-5 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Points & Rewards</h1>
              <Link to={createPageUrl('HowPointsWork')}>
                <p className="text-blue-200 text-sm">How it works →</p>
              </Link>
            </div>
            <Button
              onClick={() => setShowHistory(!showHistory)}
              variant="ghost"
              className="text-white"
            >
              <History className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center">
            <p className="text-blue-200 text-sm mb-2">Your Balance</p>
            <p className="text-5xl font-bold text-white">{pointsBalance}</p>
            <p className="text-blue-200 text-lg mt-1">Points</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 -mt-4">
        {showHistory ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-6 shadow-lg"
          >
            <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium">{tx.description}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(tx.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <p className={`text-lg font-bold ${getTransactionColor(tx.transaction_type)}`}>
                    {tx.points > 0 ? '+' : ''}{tx.points}
                  </p>
                </div>
              ))}
              {transactions.length === 0 && (
                <p className="text-center text-gray-500 py-8">No activity yet</p>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6 pt-4">
            <h2 className="text-2xl font-bold text-black px-1">Available Rewards</h2>
            
            {rewards.map((reward) => {
              const canAfford = pointsBalance >= reward.points_required;
              
              return (
                <motion.div
                  key={reward.id}
                  whileHover={{ scale: canAfford ? 1.02 : 1 }}
                  className={`bg-white rounded-2xl p-6 shadow-md ${
                    !canAfford && 'opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${
                      canAfford ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {getRewardIcon(reward.reward_type)}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-bold">{reward.title}</h3>
                      <p className="text-gray-600 text-sm mt-1">{reward.description}</p>
                      
                      <div className="flex items-center justify-between mt-4">
                        <div>
                          <p className="text-2xl font-bold text-amber-600">
                            {reward.points_required}
                          </p>
                          <p className="text-xs text-gray-500">points required</p>
                        </div>
                        
                        {canAfford && (
                          <Button
                            onClick={() => {
                              if (confirm(`Redeem ${reward.title} for ${reward.points_required} points?`)) {
                                redeemMutation.mutate(reward);
                              }
                            }}
                            className="bg-amber-500 hover:bg-amber-600"
                          >
                            Redeem
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        )}
                        
                        {!canAfford && (
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Need</p>
                            <p className="font-bold text-gray-700">
                              {reward.points_required - pointsBalance} more
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            
            {rewards.length === 0 && (
              <div className="bg-white rounded-2xl p-12 text-center">
                <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No rewards available yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}