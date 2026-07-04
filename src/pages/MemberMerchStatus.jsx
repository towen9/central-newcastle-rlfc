import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import clubConfig from '@/config/club.config';
import { ShoppingBag, Tag, AlertTriangle, Star, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LOGO = clubConfig.identity.logo_url;

export default function MemberMerchStatus() {
  const [state, setState] = useState('loading'); // loading | not_authenticated | no_membership | ready
  const [member, setMember] = useState(null);
  const [discountUsed, setDiscountUsed] = useState(false);
  const [discountPct, setDiscountPct] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const authed = await base44.auth.isAuthenticated();
        if (!authed) { setState('not_authenticated'); return; }

        const user = await base44.auth.me();
        const memberships = await base44.entities.Membership.filter({ user_id: user.id, status: 'active' });
        if (!memberships || memberships.length === 0) { setState('no_membership'); return; }

        const m = memberships[0];
        const tiers = await base44.entities.MembershipTier.filter({ name: m.tier_name });
        const tier = tiers[0] || null;
        const pct = tier?.merchandise_discount || 0;

        const membershipStart = m.start_date ? new Date(m.start_date) : new Date(new Date().getFullYear(), 0, 1);
        const transactions = await base44.entities.Transaction.filter({
          membership_id: m.id,
          transaction_type: 'merchandise'
        });
        const used = transactions.some(t => t.discount_amount > 0 && new Date(t.timestamp) >= membershipStart);

        setMember({ ...m, user_name: user.full_name });
        setDiscountPct(pct);
        setDiscountUsed(used);
        setState('ready');
      } catch {
        setState('not_authenticated');
      }
    };
    load();
  }, []);

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-[#1a365d] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (state === 'not_authenticated') {
    return (
      <div className="min-h-screen bg-[#1a365d] flex flex-col items-center justify-center p-6 text-center">
        <img src={LOGO} alt="Logo" className="w-20 h-20 rounded-full mb-6 bg-white p-1" />
        <h1 className="text-white text-2xl font-bold mb-2">Members Only</h1>
        <p className="text-blue-200 mb-6">Log in to check your merch discount &amp; points</p>
        <Button onClick={() => base44.auth.redirectToLogin(window.location.href)} className="bg-amber-400 hover:bg-amber-500 text-amber-900 font-bold">
          <LogIn className="w-4 h-4 mr-2" /> Log In
        </Button>
      </div>
    );
  }

  if (state === 'no_membership') {
    return (
      <div className="min-h-screen bg-[#1a365d] flex flex-col items-center justify-center p-6 text-center">
        <img src={LOGO} alt="Logo" className="w-20 h-20 rounded-full mb-6 bg-white p-1" />
        <h1 className="text-white text-2xl font-bold mb-2">No Active Membership</h1>
        <p className="text-blue-200 mb-6">You need an active membership to receive merch discounts</p>
        <Button onClick={() => window.location.href = '/JoinMembership'} className="bg-amber-400 hover:bg-amber-500 text-amber-900 font-bold">
          Join Now
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a365d] flex flex-col items-center justify-center p-6">
      <img src={LOGO} alt="Logo" className="w-20 h-20 rounded-full mb-6 bg-white p-1" />
      <h1 className="text-white text-2xl font-bold mb-1">Hi, {member?.user_name?.split(' ')[0]}!</h1>
      <p className="text-blue-200 text-sm mb-8">{member?.tier_name}</p>

      {/* Discount Card */}
      {discountPct > 0 ? (
        discountUsed ? (
          <div className="w-full max-w-sm bg-orange-900/60 border border-orange-500 rounded-2xl p-6 text-center mb-4">
            <AlertTriangle className="w-12 h-12 text-orange-400 mx-auto mb-3" />
            <p className="text-orange-200 text-xl font-bold">{discountPct}% Discount</p>
            <p className="text-orange-300 font-semibold mt-1">Already used this season</p>
            <p className="text-orange-400 text-sm mt-2">Full price applies today — see you next season!</p>
          </div>
        ) : (
          <div className="w-full max-w-sm bg-green-900/60 border border-green-500 rounded-2xl p-6 text-center mb-4">
            <Tag className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-green-200 text-xl font-bold">{discountPct}% Discount Available!</p>
            <p className="text-green-300 font-semibold mt-1">Show this screen to staff</p>
            <p className="text-green-400 text-sm mt-2">1 use per season — not yet redeemed ✓</p>
          </div>
        )
      ) : (
        <div className="w-full max-w-sm bg-white/10 border border-white/20 rounded-2xl p-6 text-center mb-4">
          <ShoppingBag className="w-12 h-12 text-blue-300 mx-auto mb-3" />
          <p className="text-white text-lg font-semibold">No merch discount on your tier</p>
          <p className="text-blue-300 text-sm mt-1">Upgrade for member discounts</p>
        </div>
      )}

      {/* Points */}
      <div className="w-full max-w-sm bg-white/10 border border-white/20 rounded-2xl p-5 text-center">
        <Star className="w-8 h-8 text-amber-400 mx-auto mb-2" />
        <p className="text-amber-300 text-3xl font-bold">{member?.points || 0}</p>
        <p className="text-blue-200 text-sm">points balance</p>
        <p className="text-blue-300 text-xs mt-2">Earn 1 point per $1 spent on merch</p>
      </div>

      <Button onClick={() => window.location.href = '/'} variant="ghost" className="mt-6 text-blue-300 hover:text-white">
        Back to App
      </Button>
    </div>
  );
}