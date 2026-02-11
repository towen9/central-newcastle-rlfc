import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Check, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

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

  // Stripe price IDs (from setup)
  const stripePriceMap = {
    'Junior Player': 'price_1SzTLGLgCWdDbHylLsK4GBqn',
    'Senior Player': 'price_1SzTLGLgCWdDbHylxb9IjKYw',
    'Adult Supporter': 'price_1SzTLGLgCWdDbHyljJy4zwQK',
    'Family Membership': 'price_1SzTLGLgCWdDbHylVwULN89v'
  };

  const handlePurchase = async (tier) => {
    if (!user?.photo_url) {
      toast.error('Please upload your photo ID first in the Membership page');
      return;
    }

    setSelectedTier(tier);
    setProcessing(true);

    try {
      // Check if running in iframe
      if (window.self !== window.top) {
        toast.error('Please open this page in a new tab to complete checkout');
        setProcessing(false);
        return;
      }

      const priceId = stripePriceMap[tier.name];
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
          <h1 className="text-white text-2xl font-bold mb-2">Join as a Member</h1>
          <p className="text-blue-200">Choose your membership tier</p>
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

        <div className="space-y-4">
          {tiers.map((tier) => (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden hover:border-blue-400 transition-colors"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">{tier.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-[#1a365d]">${tier.price}</p>
                    <p className="text-xs text-gray-500">per {tier.price_period}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  {tier.benefits?.map((benefit, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-emerald-600" />
                      </div>
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => handlePurchase(tier)}
                  disabled={processing || !user?.photo_url}
                  className="w-full bg-[#1a365d] hover:bg-[#2c5282] py-6"
                >
                  {processing && selectedTier?.id === tier.id ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Join for $${tier.price}`
                  )}
                </Button>
              </div>
            </motion.div>
          ))}
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