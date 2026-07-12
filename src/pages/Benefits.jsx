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
import PullToRefresh from '../components/shared/PullToRefresh';
import { useClub } from '@/contexts/ClubContext';
import GlassCard from '@/components/ui-kit/GlassCard';
import Eyebrow from '@/components/ui-kit/Eyebrow';
import SectionHead from '@/components/ui-kit/SectionHead';
import GoldButton from '@/components/ui-kit/GoldButton';
import { SkeletonCard } from '@/components/ui-kit/Skeleton';

const categoryConfig = {
  food_drink: { icon: Utensils, label: 'Food & Drink' },
  fitness_health: { icon: Dumbbell, label: 'Fitness & Health' },
  retail: { icon: ShoppingBag, label: 'Retail' },
  trades_services: { icon: Wrench, label: 'Trades & Services' },
  family_kids: { icon: Baby, label: 'Family & Kids' },
  other: { icon: Tag, label: 'Other' }
};

export default function Benefits() {
  const { club } = useClub();
  const t = club.theme;
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
    queryKey: ['offers', club.id],
    queryFn: () => base44.entities.Offer.filter({ club_id: club.id, is_active: true }, '-is_featured'),
    enabled: !!club?.id
  });

  const { data: rewards = [] } = useQuery({
    queryKey: ['rewards', club.id],
    queryFn: () => base44.entities.Reward.filter({ club_id: club.id, is_active: true }, 'stamps_required'),
    enabled: !!club?.id
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

      // Optimistic update for stamps
      queryClient.setQueryData(['membership', user.id], (old) => {
        if (!old || !old[0]) return old;
        return [{
          ...old[0],
          stamps: Math.max(0, (old[0].stamps || 0) - reward.stamps_required)
        }];
      });

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
      toast.success('Reward claimed!');
    },
    onError: () => {
      queryClient.invalidateQueries(['membership']);
      toast.error('Failed to claim reward');
    }
  });

  const handleRefresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries(['offers']),
      queryClient.invalidateQueries(['rewards']),
      queryClient.invalidateQueries(['myRedemptions']),
      queryClient.invalidateQueries(['membership'])
    ]);
  };

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
    <div className="min-h-full pb-24">
      {/* Header */}
      <div className="pt-safe px-5 py-4 flex items-center gap-4">
        <Link to={createPageUrl('Home')}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.09)' }}>
            <ArrowLeft className="w-5 h-5 text-white" />
          </div>
        </Link>
        <div className="flex-1">
          <Eyebrow color={t.gold}>Members</Eyebrow>
          <h1 className="text-white text-xl" style={{ fontFamily: t.fontDisplay }}>Benefits</h1>
        </div>
        {activeTab === 'rewards' && (
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>Stamps</p>
            <p className="text-2xl" style={{ fontFamily: t.fontDisplay, color: t.gold }}>{stamps}</p>
          </div>
        )}
      </div>

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="px-5 pt-2 pb-32">
        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="w-full" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <TabsTrigger value="offers" className="flex-1 text-white data-[state=active]:text-white">
              <Percent className="w-4 h-4 mr-2" />
              Offers
            </TabsTrigger>
            <TabsTrigger value="rewards" className="flex-1 text-white data-[state=active]:text-white">
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
              <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-4">
                {categories.map((cat) => {
                  const config = categoryConfig[cat];
                  const isActive = selectedCategory === cat;
                  
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className="flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all flex-shrink-0 text-xs font-semibold"
                      style={isActive
                        ? { background: `${t.gold}22`, color: t.goldHi, border: `1px solid ${t.gold}66`, fontFamily: t.fontBody }
                        : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)', fontFamily: t.fontBody }
                      }
                    >
                      {config ? (
                        <>
                          <config.icon className="w-4 h-4" />
                          <span>{config.label}</span>
                        </>
                      ) : (
                        <span>All</span>
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
                    >
                      <GlassCard className="overflow-hidden cursor-pointer">
                        <div className="flex">
                          {offer.image_url ? (
                            <img 
                              src={offer.image_url} 
                              alt={offer.title}
                              className="w-24 h-24 object-cover"
                            />
                          ) : (
                            <div className="w-24 h-24 flex items-center justify-center" style={{ background: `${t.gold}1a` }}>
                              <config.icon className="w-8 h-8" style={{ color: t.gold }} />
                            </div>
                          )}
                          <div className="flex-1 p-4">
                            <div className="flex items-start justify-between mb-1">
                              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{offer.sponsor_name}</p>
                              {offer.is_featured && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: `${t.gold}22`, color: t.gold }}>
                                  Featured
                                </span>
                              )}
                            </div>
                            <h3 className="font-semibold text-white text-sm" style={{ fontFamily: t.fontBody }}>{offer.title}</h3>
                            <p className="text-xs line-clamp-1 mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{offer.description}</p>
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  );
                })}
              </div>

              {filteredOffers.length === 0 && (
                <GlassCard className="p-8 text-center">
                  <Percent className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
                  <p className="text-white/60 text-sm" style={{ fontFamily: t.fontBody }}>No offers in this category</p>
                </GlassCard>
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
                <TabsList className="w-full" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <TabsTrigger value="available" className="flex-1 text-white data-[state=active]:text-white">Earn</TabsTrigger>
                  <TabsTrigger value="unlocked" className="flex-1 text-white data-[state=active]:text-white">
                    Unlocked {availableRedemptions.length > 0 && `(${availableRedemptions.length})`}
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex-1 text-white data-[state=active]:text-white">History</TabsTrigger>
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
                          >
                            <GlassCard className="p-4" style={canClaim ? { borderColor: `${t.gold}55`, boxShadow: `0 0 24px ${t.gold}1a, 0 8px 32px rgba(0,0,0,0.3)` } : {}}>
                              <div className="flex gap-4">
                                <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: canClaim ? `${t.gold}22` : 'rgba(255,255,255,0.05)' }}>
                                  {canClaim ? (
                                    <Gift className="w-7 h-7" style={{ color: t.gold }} />
                                  ) : (
                                    <Lock className="w-6 h-6" style={{ color: 'rgba(255,255,255,0.3)' }} />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <h3 className="font-semibold text-white text-sm" style={{ fontFamily: t.fontBody }}>{reward.title}</h3>
                                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: t.fontBody }}>{reward.description}</p>
                                    </div>
                                    <div className="px-2 py-1 rounded-lg text-xs font-bold" style={canClaim ? { background: `${t.gold}22`, color: t.gold } : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
                                      {reward.stamps_required}
                                    </div>
                                  </div>
                                  
                                  <div className="h-2 rounded-full overflow-hidden mb-3" style={{ background: 'rgba(0,0,0,0.3)' }}>
                                    <div 
                                      className="h-full rounded-full transition-all"
                                      style={{ width: `${progress}%`, background: canClaim ? `linear-gradient(90deg, ${t.gold}, ${t.goldHi})` : 'rgba(255,255,255,0.2)' }}
                                    />
                                  </div>

                                  {canClaim ? (
                                    <GoldButton size="sm" onClick={() => setSelectedReward(reward)}>
                                      Claim Reward
                                    </GoldButton>
                                  ) : (
                                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: t.fontBody }}>
                                      {reward.stamps_required - stamps} more stamps needed
                                    </p>
                                  )}
                                </div>
                              </div>
                            </GlassCard>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  <div data-state="unlocked" className="data-[state=active]:block hidden">
                    {availableRedemptions.length === 0 ? (
                      <GlassCard className="p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                          <Ticket className="w-8 h-8" style={{ color: 'rgba(255,255,255,0.3)' }} />
                        </div>
                        <h3 className="font-semibold text-white mb-1" style={{ fontFamily: t.fontBody }}>No rewards yet</h3>
                        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: t.fontBody }}>Earn stamps to unlock rewards</p>
                      </GlassCard>
                    ) : (
                      <div className="space-y-4">
                        {availableRedemptions.map((redemption) => (
                          <GlassCard key={redemption.id} className="p-4" style={{ borderColor: `${t.gold}44` }}>
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${t.gold}22` }}>
                                  <Gift className="w-6 h-6" style={{ color: t.gold }} />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-white text-sm" style={{ fontFamily: t.fontBody }}>{redemption.reward_title}</h3>
                                  {redemption.expires_at && (
                                    <p className="text-xs flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: t.fontBody }}>
                                      <Clock className="w-3 h-3" />
                                      Expires {format(new Date(redemption.expires_at), 'MMM d, yyyy')}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="rounded-xl p-4 text-center mb-3" style={{ background: 'rgba(0,0,0,0.3)' }}>
                              <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: t.fontBody }}>Redemption Code</p>
                              <p className="font-mono text-2xl font-bold tracking-wider" style={{ color: t.gold }}>
                                {redemption.redemption_code}
                              </p>
                            </div>
                            
                            <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: t.fontBody }}>
                              Show this code to redeem at the club
                            </p>
                          </GlassCard>
                        ))}
                      </div>
                    )}
                  </div>

                  <div data-state="history" className="data-[state=active]:block hidden">
                    {redeemedRedemptions.length === 0 ? (
                      <GlassCard className="p-8 text-center">
                        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: t.fontBody }}>No redeemed rewards yet</p>
                      </GlassCard>
                    ) : (
                      <div className="space-y-3">
                        {redeemedRedemptions.map((redemption) => (
                          <GlassCard key={redemption.id} className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                <CheckCircle className="w-5 h-5" style={{ color: t.gold }} />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-white text-sm" style={{ fontFamily: t.fontBody }}>{redemption.reward_title}</p>
                                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: t.fontBody }}>
                                  Redeemed {redemption.redeemed_at ? format(new Date(redemption.redeemed_at), 'MMM d, yyyy') : ''}
                                </p>
                              </div>
                            </div>
                          </GlassCard>
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
      </PullToRefresh>

      {/* Offer Detail Modal */}
      <AnimatePresence>
        {selectedOffer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            style={{ background: 'rgba(6,13,31,0.8)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
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
              className="max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl"
              style={{
                background: `linear-gradient(160deg, ${t.bg1}, ${t.bg0})`,
                border: '1px solid rgba(255,255,255,0.09)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.5)'
              }}
            >
              {selectedOffer.image_url ? (
                <img 
                  src={selectedOffer.image_url}
                  alt={selectedOffer.title}
                  className="w-full h-48 object-cover rounded-t-3xl"
                />
              ) : (
                <div className="w-full h-32 flex items-center justify-center rounded-t-3xl" style={{ background: `${t.gold}1a` }}>
                  {categoryConfig[selectedOffer.category]?.icon && 
                    React.createElement(categoryConfig[selectedOffer.category].icon, { className: 'w-12 h-12', style: { color: t.gold } })
                  }
                </div>
              )}

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium mb-1" style={{ color: t.gold, fontFamily: t.fontBody }}>{selectedOffer.sponsor_name}</p>
                    <h2 className="text-xl font-bold text-white" style={{ fontFamily: t.fontBody }}>{selectedOffer.title}</h2>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedOffer(null);
                      setShowCode(false);
                    }}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    <X className="w-4 h-4 text-white/60" />
                  </button>
                </div>

                <p className="mb-6" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: t.fontBody }}>{selectedOffer.description}</p>

                {showCode ? (
                  <div className="rounded-2xl p-6 text-center mb-6" style={{ background: `${t.gold}1a`, border: `1px solid ${t.gold}33` }}>
                    <CheckCircle className="w-10 h-10 mx-auto mb-3" style={{ color: t.gold }} />
                    <p className="text-sm mb-2" style={{ color: t.gold, fontFamily: t.fontBody }}>Your Offer Code</p>
                    <div className="flex items-center justify-center gap-3">
                      <p className="font-mono text-2xl font-bold" style={{ color: t.goldHi }}>
                        {selectedOffer.offer_code || 'MEMBER10'}
                      </p>
                      <button 
                        onClick={() => copyCode(selectedOffer.offer_code || 'MEMBER10')}
                        className="p-2 rounded-lg transition-colors"
                        style={{ background: 'rgba(255,255,255,0.06)' }}
                      >
                        <Copy className="w-5 h-5" style={{ color: t.gold }} />
                      </button>
                    </div>
                    <p className="text-xs mt-3" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: t.fontBody }}>Show this code to redeem</p>
                  </div>
                ) : (
                  <GoldButton
                    fullWidth
                    onClick={() => redeemOfferMutation.mutate(selectedOffer)}
                    disabled={redeemOfferMutation.isPending}
                    className="mb-6"
                  >
                    {redeemOfferMutation.isPending ? 'Loading...' : 'Get Offer Code'}
                  </GoldButton>
                )}

                {selectedOffer.terms && (
                  <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: t.fontBody }}>Terms & Conditions</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: t.fontBody }}>{selectedOffer.terms}</p>
                  </div>
                )}

                {selectedOffer.expiry_date && (
                  <p className="text-xs mt-4" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: t.fontBody }}>
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
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white" style={{ fontFamily: t.fontBody }}>Claim Reward</h3>
                <button onClick={() => setSelectedReward(null)}>
                  <X className="w-6 h-6 text-white/40" />
                </button>
              </div>

              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: `${t.gold}22` }}>
                  <Gift className="w-8 h-8" style={{ color: t.gold }} />
                </div>
                <h4 className="text-lg font-semibold text-white mb-1" style={{ fontFamily: t.fontBody }}>{selectedReward.title}</h4>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: t.fontBody }}>{selectedReward.description}</p>
              </div>

              <div className="rounded-xl p-4 mb-6" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="flex items-center justify-between text-sm" style={{ fontFamily: t.fontBody }}>
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>Cost</span>
                  <span className="font-bold" style={{ color: t.gold }}>{selectedReward.stamps_required} stamps</span>
                </div>
                <div className="flex items-center justify-between mt-2 text-sm" style={{ fontFamily: t.fontBody }}>
                  <span style={{ color: 'rgba(255,255,255,0.6)' }}>Your stamps after</span>
                  <span className="font-bold text-white">{stamps - selectedReward.stamps_required}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'white', background: 'transparent' }}
                  onClick={() => setSelectedReward(null)}
                >
                  Cancel
                </Button>
                <GoldButton 
                  className="flex-1"
                  onClick={() => claimRewardMutation.mutate(selectedReward)}
                  disabled={claimRewardMutation.isPending}
                >
                  {claimRewardMutation.isPending ? 'Claiming...' : 'Confirm'}
                </GoldButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}