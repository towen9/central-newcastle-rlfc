import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Gift, Lock, Percent, X, Copy, CheckCircle, Clock, Ticket, Utensils, Dumbbell, ShoppingBag, Wrench, Baby, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';

const categoryConfig = {
  food_drink: { icon: Utensils, label: 'Food & Drink', color: 'bg-orange-500' },
  fitness_health: { icon: Dumbbell, label: 'Fitness & Health', color: 'bg-green-500' },
  retail: { icon: ShoppingBag, label: 'Retail', color: 'bg-blue-500' },
  trades_services: { icon: Wrench, label: 'Trades & Services', color: 'bg-purple-500' },
  family_kids: { icon: Baby, label: 'Family & Kids', color: 'bg-pink-500' },
  other: { icon: Tag, label: 'Other', color: 'bg-gray-500' }
};

export default function Benefits() {
  const [activeTab, setActiveTab] = useState('offers');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [selectedReward, setSelectedReward] = useState(null);
  const [showCode, setShowCode] = useState(false);
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

  const { data: offers = [] } = useQuery({
    queryKey: ['offers'],
    queryFn: () => base44.entities.Offer.filter({ is_active: true }, '-is_featured')
  });

  const { data: rewards = [] } = useQuery({
    queryKey: ['rewards'],
    queryFn: () => base44.entities.Reward.filter({ is_active: true }, 'stamps_required')
  });

  const { data: redemptions = [] } = useQuery({
    queryKey: ['myRedemptions', user?.id],
    queryFn: () => base44.entities.RewardRedemption.filter({ user_id: user?.id }, '-created_date'),
    enabled: !!user?.id
  });

  const redeemOfferMutation = useMutation({
    mutationFn: async (offer) => {
      await base44.entities.Offer.update(offer.id, {
        views_count: (offer.views_count || 0) + 1
      });

      await base44.entities.OfferRedemption.create({
        offer_id: offer.id,
        offer_title: offer.title,
        sponsor_id: offer.sponsor_id,
        sponsor_name: offer.sponsor_name,
        user_id: user.id,
        membership_id: membership?.id,
        redemption_code: offer.offer_code,
        timestamp: new Date().toISOString()
      });

      await base44.entities.Offer.update(offer.id, {
        redemptions_count: (offer.redemptions_count || 0) + 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['offers']);
      setShowCode(true);
    }
  });

  const claimRewardMutation = useMutation({
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

      await base44.entities.Membership.update(membership.id, {
        stamps: Math.max(0, (membership.stamps || 0) - reward.stamps_required)
      });

      return code;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['membership']);
      queryClient.invalidateQueries(['myRedemptions']);
      setSelectedReward(null);
    }
  });

  const stamps = membership?.stamps || 0;
  const availableRedemptions = redemptions.filter(r => r.status === 'available');
  const redeemedRedemptions = redemptions.filter(r => r.status === 'redeemed');
  
  const filteredOffers = selectedCategory === 'all'
    ? offers
    : offers.filter(o => o.category === selectedCategory);

  const categories = ['all', ...Object.keys(categoryConfig)];

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-500 pt-safe">
        <div className="px-5 py-4 flex items-center gap-4">
          <Link to={createPageUrl('Home')}>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-white" />
            </div>
          </Link>
          <div className="flex-1">
            <h1 className="text-white text-xl font-bold">Benefits</h1>
            <p className="text-white/80 text-sm">Offers & rewards for members</p>
          </div>
          {activeTab === 'rewards' && (
            <div className="text-right">
              <p className="text-white/80 text-xs">Stamps</p>
              <p className="text-white text-2xl font-bold">{stamps}</p>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 py-6">
        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="w-full bg-white border border-gray-200">
            <TabsTrigger value="offers" className="flex-1">
              <Percent className="w-4 h-4 mr-2" />
              Offers
            </TabsTrigger>
            <TabsTrigger value="rewards" className="flex-1">
              <Gift className="w-4 h-4 mr-2" />
              Rewards
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <AnimatePresence mode="wait">
          {activeTab === 'offers' && (
            <motion.div
              key="offers"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Category Filter */}
              <div className="flex gap-2 overflow-x-auto pb-4 -mx-5 px-5 scrollbar-hide mb-4">
                {categories.map((cat) => {
                  const config = categoryConfig[cat];
                  const isActive = selectedCategory === cat;
                  
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                        isActive 
                          ? 'bg-[#1a365d] text-white' 
                          : 'bg-white text-gray-600 border border-gray-200'
                      }`}
                    >
                      {config ? (
                        <>
                          <config.icon className="w-4 h-4" />
                          <span className="text-sm font-medium">{config.label}</span>
                        </>
                      ) : (
                        <span className="text-sm font-medium">All</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Offers Grid */}
              <div className="grid gap-4">
                {filteredOffers.map((offer, idx) => {
                  const config = categoryConfig[offer.category] || categoryConfig.other;
                  
                  return (
                    <motion.div
                      key={offer.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => setSelectedOffer(offer)}
                      className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <div className="flex">
                        {offer.image_url ? (
                          <img 
                            src={offer.image_url} 
                            alt={offer.title}
                            className="w-24 h-24 object-cover"
                          />
                        ) : (
                          <div className={`w-24 h-24 ${config.color} flex items-center justify-center`}>
                            <config.icon className="w-8 h-8 text-white" />
                          </div>
                        )}
                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between mb-1">
                            <p className="text-xs text-gray-500">{offer.sponsor_name}</p>
                            {offer.is_featured && (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                                Featured
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-1">{offer.title}</h3>
                          <p className="text-sm text-gray-500 line-clamp-1">{offer.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {filteredOffers.length === 0 && (
                <div className="text-center py-12">
                  <Percent className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No offers in this category</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'rewards' && (
            <motion.div
              key="rewards"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Reward Sub-tabs */}
              <Tabs defaultValue="available" className="mb-6">
                <TabsList className="w-full bg-white border border-gray-200">
                  <TabsTrigger value="available" className="flex-1">Earn</TabsTrigger>
                  <TabsTrigger value="unlocked" className="flex-1">
                    Unlocked {availableRedemptions.length > 0 && `(${availableRedemptions.length})`}
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex-1">History</TabsTrigger>
                </TabsList>

                <div className="mt-6">
                  <div data-state="available" className="data-[state=active]:block hidden">
                    <div className="space-y-4">
                      {rewards.map((reward, idx) => {
                        const canClaim = stamps >= reward.stamps_required;
                        const progress = Math.min((stamps / reward.stamps_required) * 100, 100);
                        
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
                                    {reward.stamps_required}
                                  </div>
                                </div>
                                
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
                                    {reward.stamps_required - stamps} more stamps needed
                                  </p>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  <div data-state="unlocked" className="data-[state=active]:block hidden">
                    {availableRedemptions.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                          <Ticket className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">No rewards yet</h3>
                        <p className="text-sm text-gray-500">Earn stamps to unlock rewards</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {availableRedemptions.map((redemption) => (
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
                        ))}
                      </div>
                    )}
                  </div>

                  <div data-state="history" className="data-[state=active]:block hidden">
                    {redeemedRedemptions.length === 0 ? (
                      <div className="text-center py-12">
                        <p className="text-gray-500">No redeemed rewards yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {redeemedRedemptions.map((redemption) => (
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
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Offer Detail Modal */}
      <AnimatePresence>
        {selectedOffer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
            onClick={() => {
              setSelectedOffer(null);
              setShowCode(false);
            }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            >
              {selectedOffer.image_url ? (
                <img 
                  src={selectedOffer.image_url}
                  alt={selectedOffer.title}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className={`w-full h-32 ${categoryConfig[selectedOffer.category]?.color || 'bg-gray-400'} flex items-center justify-center`}>
                  {categoryConfig[selectedOffer.category]?.icon && 
                    React.createElement(categoryConfig[selectedOffer.category].icon, { className: 'w-12 h-12 text-white' })
                  }
                </div>
              )}

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-emerald-600 font-medium mb-1">{selectedOffer.sponsor_name}</p>
                    <h2 className="text-xl font-bold text-gray-900">{selectedOffer.title}</h2>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedOffer(null);
                      setShowCode(false);
                    }}
                    className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>

                <p className="text-gray-600 mb-6">{selectedOffer.description}</p>

                {showCode ? (
                  <div className="bg-emerald-50 rounded-2xl p-6 text-center mb-6">
                    <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                    <p className="text-sm text-emerald-600 mb-2">Your Offer Code</p>
                    <div className="flex items-center justify-center gap-3">
                      <p className="font-mono text-2xl font-bold text-emerald-700">
                        {selectedOffer.offer_code || 'MEMBER10'}
                      </p>
                      <button 
                        onClick={() => copyCode(selectedOffer.offer_code || 'MEMBER10')}
                        className="p-2 hover:bg-emerald-100 rounded-lg transition-colors"
                      >
                        <Copy className="w-5 h-5 text-emerald-600" />
                      </button>
                    </div>
                    <p className="text-xs text-emerald-500 mt-3">Show this code to redeem</p>
                  </div>
                ) : (
                  <Button
                    onClick={() => redeemOfferMutation.mutate(selectedOffer)}
                    disabled={redeemOfferMutation.isPending}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 mb-6"
                    size="lg"
                  >
                    {redeemOfferMutation.isPending ? 'Loading...' : 'Get Offer Code'}
                  </Button>
                )}

                {selectedOffer.terms && (
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-xs text-gray-500 font-medium mb-2">Terms & Conditions</p>
                    <p className="text-xs text-gray-400">{selectedOffer.terms}</p>
                  </div>
                )}

                {selectedOffer.expiry_date && (
                  <p className="text-xs text-gray-400 mt-4">
                    Valid until {format(new Date(selectedOffer.expiry_date), 'MMMM d, yyyy')}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reward Claim Modal */}
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
                  <span className="font-bold text-amber-700">{selectedReward.stamps_required} stamps</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-amber-700">Your stamps after</span>
                  <span className="font-bold text-amber-700">{stamps - selectedReward.stamps_required}</span>
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
                  onClick={() => claimRewardMutation.mutate(selectedReward)}
                  disabled={claimRewardMutation.isPending}
                >
                  {claimRewardMutation.isPending ? 'Claiming...' : 'Confirm'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}