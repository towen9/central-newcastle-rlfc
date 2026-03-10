import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Check, Loader2, ArrowLeft, Star, Users, Shield, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

const tierConfig = {
  'Supporter Pack': {
    gradient: 'from-[#1a365d] to-[#2b6cb0]',
    icon: Shield,
    iconColor: 'text-blue-300',
    badge: 'bg-blue-100 text-blue-800',
    badgeLabel: '5 GAME PACK',
    buttonClass: 'bg-[#1a365d] hover:bg-[#2c5282]',
  },
  'Family Membership': {
    gradient: 'from-[#4c1d95] to-[#7c3aed]',
    icon: Users,
    iconColor: 'text-purple-300',
    badge: 'bg-purple-100 text-purple-800',
    badgeLabel: 'FAMILY PASS',
    buttonClass: 'bg-[#5b21b6] hover:bg-[#4c1d95]',
  },
  'Premium Membership': {
    gradient: 'from-[#78350f] to-[#b45309]',
    icon: Star,
    iconColor: 'text-amber-300',
    badge: 'bg-amber-100 text-amber-800',
    badgeLabel: 'PREMIUM',
    buttonClass: 'bg-[#92400e] hover:bg-[#78350f]',
    featured: true,
  },
  'Old Butchers Membership': {
    gradient: 'from-[#1a1a2e] to-[#16213e]',
    icon: Trophy,
    iconColor: 'text-yellow-400',
    badge: 'bg-yellow-400/20 text-yellow-400',
    badgeLabel: 'LEGACY',
    buttonClass: 'bg-yellow-500 hover:bg-yellow-400 text-gray-950',
  },
  'Sponsor Season Pass': {
    gradient: 'from-[#065f46] to-[#059669]',
    icon: Star,
    iconColor: 'text-emerald-300',
    badge: 'bg-emerald-100 text-emerald-800',
    badgeLabel: 'SPONSOR',
    buttonClass: 'bg-emerald-700 hover:bg-emerald-600',
  },
};

export default function JoinMembership() {
  const [selectedTier, setSelectedTier] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  const { data: tiers = [] } = useQuery({
    queryKey: ['membershipTiers'],
    queryFn: () => base44.entities.MembershipTier.filter({ is_active: true, is_admin_only: false }, 'sort_order')
  });

  const handlePurchase = async (tier) => {
    if (!user?.photo_url) {
      toast.error('Please upload your photo ID first in the Membership page');
      return;
    }

    setSelectedTier(tier);
    setProcessing(true);

    try {
      const priceId = tier.stripe_price_id;
      if (!priceId) {
        toast.error('This membership tier is not available for online purchase');
        setProcessing(false);
        return;
      }

      const { data } = await base44.functions.invoke('createCheckout', {
        tier_id: tier.id,
        price_id: priceId,
        success_url: `${window.location.origin}${createPageUrl('Membership')}?payment=success`,
        cancel_url: `${window.location.origin}${createPageUrl('JoinMembership')}?payment=cancelled`
      });

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (error) {
      toast.error('Failed to start checkout');
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-[#1a365d] pt-safe">
        <div className="px-5 py-6">
          <Link to={createPageUrl('Membership')}>
            <button className="flex items-center gap-2 text-blue-200 mb-4">
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
          </Link>
          <h1 className="text-white text-2xl font-bold mb-1">2026 Memberships</h1>
          <p className="text-blue-200 text-sm">Support Central Newcastle RLFC this season</p>
        </div>
      </div>

      <div className="px-5 py-6">
        {!user?.photo_url && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-amber-800">
              ⚠️ Photo ID required before purchase. Go to{' '}
              <Link to={createPageUrl('Membership')} className="font-semibold underline">
                Membership page
              </Link>{' '}
              to upload.
            </p>
          </div>
        )}

        <div className="space-y-5">
          {tiers.map((tier, idx) => {
            const config = tierConfig[tier.name] || tierConfig['Supporter Pack'];
            const Icon = config.icon;
            const isFeatured = config.featured;

            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`relative rounded-2xl overflow-hidden shadow-lg ${isFeatured ? 'ring-2 ring-amber-400' : 'border border-gray-100'}`}
              >
                {isFeatured && (
                  <div className="absolute top-0 right-0 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-bl-xl z-10">
                    ★ BEST VALUE
                  </div>
                )}

                {/* Tier Header */}
                <div className={`bg-gradient-to-r ${config.gradient} p-5`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                        <Icon className={`w-5 h-5 ${config.iconColor}`} />
                      </div>
                      <div>
                        <h3 className="text-white text-lg font-bold">{tier.name}</h3>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.badge}`}>
                          {config.badgeLabel}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white text-3xl font-bold">${tier.price}</p>
                      <p className="text-white/60 text-xs">per {tier.price_period}</p>
                    </div>
                  </div>
                  <p className="text-white/80 text-sm mt-3">{tier.description}</p>
                </div>

                {/* Benefits */}
                <div className="bg-white p-5">
                  <div className="space-y-2 mb-5">
                    {tier.benefits?.map((benefit, bidx) => (
                      <div key={bidx} className="flex items-start gap-2 text-sm text-gray-700">
                        <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-emerald-600" />
                        </div>
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => handlePurchase(tier)}
                    disabled={processing || !user?.photo_url}
                    className={`w-full py-6 text-base font-semibold ${config.buttonClass} text-white`}
                  >
                    {processing && selectedTier?.id === tier.id ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Join for $${tier.price} →`
                    )}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-8 bg-blue-50 rounded-xl p-4">
          <p className="text-sm text-blue-800">
            💳 Secure payment powered by Stripe. Your membership activates immediately after purchase.
          </p>
        </div>
      </div>
    </div>
  );
}