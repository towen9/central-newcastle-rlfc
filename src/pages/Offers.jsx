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

const categoryConfig = {
  food_drink: { icon: Utensils, label: 'Food & Drink', color: 'bg-orange-500' },
  fitness_health: { icon: Dumbbell, label: 'Fitness & Health', color: 'bg-green-500' },
  retail: { icon: ShoppingBag, label: 'Retail', color: 'bg-blue-500' },
  trades_services: { icon: Wrench, label: 'Trades & Services', color: 'bg-purple-500' },
  family_kids: { icon: Baby, label: 'Family & Kids', color: 'bg-pink-500' },
  other: { icon: Tag, label: 'Other', color: 'bg-gray-500' }
};

export default function Offers() {
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
    queryKey: ['offers'],
    queryFn: () => base44.entities.Offer.filter({ is_active: true }, '-is_featured')
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
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-500 pt-safe">
        <div className="px-5 py-4 flex items-center gap-4">
          <Link to={createPageUrl('Home')}>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-white" />
            </div>
          </Link>
          <div>
            <h1 className="text-white text-xl font-bold">Sponsor Offers</h1>
            <p className="text-white/80 text-sm">Exclusive member discounts</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-6">
        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-4 -mx-5 px-5 scrollbar-hide">
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
                  <span className="text-sm font-medium">All Offers</span>
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
              {/* Header Image */}
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

                {/* Offer Code Section */}
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
                    onClick={() => redeemMutation.mutate(selectedOffer)}
                    disabled={redeemMutation.isPending}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 mb-6"
                    size="lg"
                  >
                    {redeemMutation.isPending ? 'Loading...' : 'Get Offer Code'}
                  </Button>
                )}

                {/* Terms */}
                {selectedOffer.terms && (
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-xs text-gray-500 font-medium mb-2">Terms & Conditions</p>
                    <p className="text-xs text-gray-400">{selectedOffer.terms}</p>
                  </div>
                )}

                {/* Expiry */}
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
    </div>
  );
}