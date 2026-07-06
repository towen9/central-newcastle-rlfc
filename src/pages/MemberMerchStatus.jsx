import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import clubConfig from '@/config/club.config';
import { ShoppingBag, Tag, AlertTriangle, Star, LogIn } from 'lucide-react';
import GlassCard from '@/components/ui-kit/GlassCard';
import Eyebrow from '@/components/ui-kit/Eyebrow';
import GoldButton from '@/components/ui-kit/GoldButton';
import { SkeletonCard } from '@/components/ui-kit/Skeleton';

const t = clubConfig.theme;
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
      <div className="min-h-full flex items-center justify-center" style={{ background: `radial-gradient(ellipse at top, ${t.bg1} 0%, ${t.bg0} 70%)` }}>
        <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.15)', borderTopColor: t.gold }} />
      </div>
    );
  }

  if (state === 'not_authenticated') {
    return (
      <div className="min-h-full flex flex-col items-center justify-center p-6 text-center" style={{ background: `radial-gradient(ellipse at top, ${t.bg1} 0%, ${t.bg0} 70%)` }}>
        <img src={LOGO} alt="Logo" className="w-20 h-20 rounded-full mb-6 bg-white p-1" />
        <h1 className="text-white text-2xl font-bold mb-2" style={{ fontFamily: t.fontDisplay }}>Members Only</h1>
        <p className="mb-6" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: t.fontBody }}>Log in to check your merch discount &amp; points</p>
        <GoldButton onClick={() => base44.auth.redirectToLogin(window.location.href)}>
          <LogIn className="w-4 h-4" />
          Log In
        </GoldButton>
      </div>
    );
  }

  if (state === 'no_membership') {
    return (
      <div className="min-h-full flex flex-col items-center justify-center p-6 text-center" style={{ background: `radial-gradient(ellipse at top, ${t.bg1} 0%, ${t.bg0} 70%)` }}>
        <img src={LOGO} alt="Logo" className="w-20 h-20 rounded-full mb-6 bg-white p-1" />
        <h1 className="text-white text-2xl font-bold mb-2" style={{ fontFamily: t.fontDisplay }}>No Active Membership</h1>
        <p className="mb-6" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: t.fontBody }}>You need an active membership to receive merch discounts</p>
        <GoldButton onClick={() => window.location.href = '/JoinMembership'}>
          Join Now
        </GoldButton>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-6" style={{ background: `radial-gradient(ellipse at top, ${t.bg1} 0%, ${t.bg0} 70%)` }}>
      <img src={LOGO} alt="Logo" className="w-20 h-20 rounded-full mb-6 bg-white p-1" />
      <h1 className="text-white text-2xl font-bold mb-1" style={{ fontFamily: t.fontDisplay }}>Hi, {member?.user_name?.split(' ')[0]}!</h1>
      <p className="text-sm mb-8" style={{ color: t.gold, fontFamily: t.fontBody }}>{member?.tier_name}</p>

      {/* Discount Card */}
      {discountPct > 0 ? (
        discountUsed ? (
          <GlassCard className="w-full max-w-sm p-6 text-center mb-4" style={{ borderColor: 'rgba(251,146,60,0.4)' }}>
            <AlertTriangle className="w-12 h-12 mx-auto mb-3" style={{ color: '#fb923c' }} />
            <p className="text-xl font-bold" style={{ color: '#fb923c', fontFamily: t.fontBody }}>{discountPct}% Discount</p>
            <p className="font-semibold mt-1" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: t.fontBody }}>Already used this season</p>
            <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: t.fontBody }}>Full price applies today — see you next season!</p>
          </GlassCard>
        ) : (
          <GlassCard className="w-full max-w-sm p-6 text-center mb-4" style={{ borderColor: `${t.green}55` }}>
            <Tag className="w-12 h-12 mx-auto mb-3" style={{ color: t.green }} />
            <p className="text-xl font-bold" style={{ color: t.green, fontFamily: t.fontBody }}>{discountPct}% Discount Available!</p>
            <p className="font-semibold mt-1" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: t.fontBody }}>Show this screen to staff</p>
            <p className="text-sm mt-2" style={{ color: t.green, fontFamily: t.fontBody }}>1 use per season — not yet redeemed ✓</p>
          </GlassCard>
        )
      ) : (
        <GlassCard className="w-full max-w-sm p-6 text-center mb-4">
          <ShoppingBag className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.3)' }} />
          <p className="text-white text-lg font-semibold" style={{ fontFamily: t.fontBody }}>No merch discount on your tier</p>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: t.fontBody }}>Upgrade for member discounts</p>
        </GlassCard>
      )}

      {/* Points */}
      <GlassCard className="w-full max-w-sm p-5 text-center" style={{ borderColor: `${t.gold}33` }}>
        <Star className="w-8 h-8 mx-auto mb-2" style={{ color: t.gold }} />
        <p className="text-3xl font-bold" style={{ color: t.gold, fontFamily: t.fontDisplay }}>{member?.points || 0}</p>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: t.fontBody }}>points balance</p>
        <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: t.fontBody }}>Earn 1 point per $1 spent on merch</p>
      </GlassCard>

      <button onClick={() => window.location.href = '/'} className="mt-6 text-sm" style={{ color: t.cyan, fontFamily: t.fontBody }}>
        Back to App
      </button>
    </div>
  );
}