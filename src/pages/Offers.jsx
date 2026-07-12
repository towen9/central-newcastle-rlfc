import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Percent, Utensils, Dumbbell, ShoppingBag, Wrench, Baby, Tag, X, Copy, CheckCircle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useClub, getClubConfig } from '@/contexts/ClubContext';
import GlassCard from '@/components/ui-kit/GlassCard';
import Eyebrow from '@/components/ui-kit/Eyebrow';
import GoldButton from '@/components/ui-kit/GoldButton';
import { SkeletonCard } from '@/components/ui-kit/Skeleton';

const t = getClubConfig().theme;

const categoryConfig = {
  food_drink: { icon: Utensils, label: 'Food & Drink', color: '#f97316' },
  fitness_health: { icon: Dumbbell, label: 'Fitness & Health', color: t.green },
  retail: { icon: ShoppingBag, label: 'Retail', color: t.royal },
  trades_services: { icon: Wrench, label: 'Trades & Services', color: '#7c3aed' },
  family_kids: { icon: Baby, label: 'Family & Kids', color: '#ec4899' },
  other: { icon: Tag, label: 'Other', color: 'rgba(255,255,255,0.4)' }
};

export default function Offers() {
  const { club } = useClub();
  const t = club.theme;
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedOffer, setSelectedOffer] = useState(null);
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

  // Check URL for offerId
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const offerId = params.get('offerId');
    if (offerId && offers.length > 0) {
      const offer = offers.find(o => o.id === offerId);
      if (offer) setSelectedOffer(offer);
    }
  }, []);

  const { data: offers = [] } = useQuery({
    queryKey: ['offers', club.id],
    queryFn: () => base44.entities.Offer.filter({ club_id: club.id, is_active: true }, '-is_featured'),
    enabled: !!club?.id
  });

  const { data: membership } = useQuery({
    queryKey: ['membership', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const memberships = await base44.entities.Membership.filter({ user_id: user.id, status: 'active' });
      return memberships[0] || null;
    },
    enabled: !!user?.id
  });

  const redeemMutation = useMutation({
    mutationFn: async (offer) => {
      // Track view
      await base44.entities.Offer.update(offer.id, {
        views_count: (offer.views_count || 0) + 1
      });

      // Create redemption record
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

      // Update offer redemption count
      await base44.entities.Offer.update(offer.id, {
        redemptions_count: (offer.redemptions_count || 0) + 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['offers']);
      setShowCode(true);
    }
  });

  const filteredOffers = selectedCategory === 'all'
    ? offers
    : offers.filter(o => o.category === selectedCategory);

  const categories = ['all', ...Object.keys(categoryConfig)];

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  return (
    <div className="min-h-full pb-24" style={{ background: `radial-gradient(ellipse at top, ${t.bg1} 0%, ${t.bg0} 70%)` }}>
      {/* Header */}
      <div className="pt-safe px-5 py-4 flex items-center gap-4">
        <Link to={createPageUrl('Home')}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <ArrowLeft className="w-5 h-5 text-white" />
          </div>
        </Link>
        <div>
          <Eyebrow color={t.gold}>Member Discounts</Eyebrow>
          <h1 className="text-white text-xl font-bold" style={{ fontFamily: t.fontDisplay }}>Sponsor Offers</h1>
        </div>
      </div>

      <div className="px-5 py-4">
        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-4 -mx-5 px-5 scrollbar-hide">
          {categories.map((cat) => {
            const config = categoryConfig[cat];
            const isActive = selectedCategory === cat;
            
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className="flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all"
                style={isActive
                  ? { background: t.gold, color: t.bg0 }
                  : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.08)' }
                }
              >
                {config ? (
                  <>
                    <config.icon className="w-4 h-4" />
                    <span className="text-sm font-medium" style={{ fontFamily: t.fontBody }}>{config.label}</span>
                  </>
                ) : (
                  <span className="text-sm font-medium" style={{ fontFamily: t.fontBody }}>All Offers</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Offers Grid */}
        <div className="grid gap-4 mt-2">
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
                      <div className="w-24 h-24 flex items-center justify-center" style={{ background: `${config.color}22` }}>
                        <config.icon className="w-8 h-8" style={{ color: config.color }} />
                      </div>
                    )}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{offer.sponsor_name}</p>
                        {offer.is_featured && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full" style={{ background: `${t.gold}22`, color: t.gold }}>
                            Featured
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-white mb-1 text-sm" style={{ fontFamily: t.fontBody }}>{offer.title}</h3>
                      <p className="text-sm line-clamp-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{offer.description}</p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>

        {filteredOffers.length === 0 && (
          <div className="text-center py-12">
            <Percent className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
            <p style={{ color: 'rgba(255,255,255,0.4)' }}>No offers in this category</p>
          </div>
        )}
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
              className="max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl"
              style={{ background: `linear-gradient(180deg, ${t.bg1}, ${t.bg0})`, border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {/* Header Image */}
              {selectedOffer.image_url ? (
                <img 
                  src={selectedOffer.image_url}
                  alt={selectedOffer.title}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-32 flex items-center justify-center" style={{ background: `${categoryConfig[selectedOffer.category]?.color || 'rgba(255,255,255,0.1)'}22` }}>
                  {categoryConfig[selectedOffer.category]?.icon && 
                    React.createElement(categoryConfig[selectedOffer.category].icon, { className: 'w-12 h-12', style: { color: categoryConfig[selectedOffer.category].color } })
                  }
                </div>
              )}

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium mb-1" style={{ color: t.green }}>{selectedOffer.sponsor_name}</p>
                    <h2 className="text-xl font-bold text-white" style={{ fontFamily: t.fontBody }}>{selectedOffer.title}</h2>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedOffer(null);
                      setShowCode(false);
                    }}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                  >
                    <X className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.5)' }} />
                  </button>
                </div>

                <p className="mb-6" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: t.fontBody }}>{selectedOffer.description}</p>

                {/* Offer Code Section */}
                {showCode ? (
                  <div className="rounded-2xl p-6 text-center mb-6" style={{ background: `${t.green}11`, border: `1px solid ${t.green}33` }}>
                    <CheckCircle className="w-10 h-10 mx-auto mb-3" style={{ color: t.green }} />
                    <p className="text-sm mb-2" style={{ color: t.green }}>Your Offer Code</p>
                    <div className="flex items-center justify-center gap-3">
                      <p className="font-mono text-2xl font-bold" style={{ color: t.green }}>
                        {selectedOffer.offer_code || 'MEMBER10'}
                      </p>
                      <button 
                        onClick={() => copyCode(selectedOffer.offer_code || 'MEMBER10')}
                        className="p-2 rounded-lg transition-colors"
                        style={{ background: 'rgba(255,255,255,0.05)' }}
                      >
                        <Copy className="w-5 h-5" style={{ color: t.green }} />
                      </button>
                    </div>
                    <p className="text-xs mt-3" style={{ color: 'rgba(255,255,255,0.4)' }}>Show this code to redeem</p>
                  </div>
                ) : (
                  <GoldButton
                    fullWidth
                    onClick={() => redeemMutation.mutate(selectedOffer)}
                    disabled={redeemMutation.isPending}
                    style={{ marginBottom: 24, padding: '14px 20px' }}
                  >
                    {redeemMutation.isPending ? 'Loading...' : 'Get Offer Code'}
                  </GoldButton>
                )}

                {/* Terms */}
                {selectedOffer.terms && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
                    <p className="text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Terms & Conditions</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{selectedOffer.terms}</p>
                  </div>
                )}

                {/* Expiry */}
                {selectedOffer.expiry_date && (
                  <p className="text-xs mt-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Valid until {format(new Date(selectedOffer.expiry_date), 'MMMM d, yyyy')}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}