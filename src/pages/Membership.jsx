import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Users, Calendar, Shield, ChevronRight, RefreshCcw, Plus, Camera, Check, Lock } from 'lucide-react';
import ReferralShare from '../components/membership/ReferralShare';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { format, differenceInDays } from 'date-fns';
import QRModal from '../components/shared/QRModal';
import PhotoUpload from '../components/membership/PhotoUpload';
import { toast } from 'sonner';
import clubConfig from '@/config/club.config';
import GlassCard from '@/components/ui-kit/GlassCard';
import Eyebrow from '@/components/ui-kit/Eyebrow';
import GoldButton from '@/components/ui-kit/GoldButton';

const t = clubConfig.theme;

export default function Membership() {
  const [showQR, setShowQR] = useState(false);
  const [user, setUser] = useState(null);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      setPaymentSuccess(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
      if (!userData.photo_url) {
        setShowPhotoUpload(true);
      }
    };
    loadUser();
  }, []);

  const updatePhotoMutation = useMutation({
    mutationFn: async (photoUrl) => {
      await base44.auth.updateMe({ photo_url: photoUrl });
      if (membership?.id) {
        await base44.entities.Membership.update(membership.id, { photo_url: photoUrl });
      }
    },
    onSuccess: async () => {
      const userData = await base44.auth.me();
      setUser(userData);
      setShowPhotoUpload(false);
      toast.success('Photo updated');
      queryClient.invalidateQueries(['membership']);
    }
  });

  const { data: membership } = useQuery({
    queryKey: ['membership', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const active = await base44.entities.Membership.filter({ user_id: user.id, status: 'active' });
      if (active.length > 0) return active[0];
      const pending = await base44.entities.Membership.filter({ user_id: user.id, status: 'pending' });
      return pending[0] || null;
    },
    enabled: !!user?.id
  });

  const { data: familyMembers = [] } = useQuery({
    queryKey: ['familyMembers', membership?.id],
    queryFn: async () => {
      if (!membership?.id) return [];
      return await base44.entities.Membership.filter({ parent_membership_id: membership.id });
    },
    enabled: !!membership?.id
  });

  const { data: tiers = [] } = useQuery({
    queryKey: ['tiers'],
    queryFn: () => base44.entities.MembershipTier.filter({ is_active: true }, 'sort_order')
  });

  useEffect(() => {
    if (membership?.id && !membership.photo_url && user?.photo_url) {
      base44.entities.Membership.update(membership.id, { photo_url: user.photo_url })
        .then(() => queryClient.invalidateQueries(['membership', user.id]));
    }
  }, [membership?.id, membership?.photo_url, user?.photo_url]);

  const currentTier = tiers.find(tier => tier.id === membership?.tier_id);
  const dayPassTier = tiers.find(tier => tier.name?.toLowerCase().includes('day pass'));
  const expiryDate = membership?.expiry_date ? new Date(membership.expiry_date) : null;
  const daysUntilExpiry = expiryDate ? differenceInDays(expiryDate, new Date()) : null;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0;

  return (
    <>
      {membership?.status === 'active' && !user?.photo_url && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(6,13,31,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '16px' }}>
          <GlassCard className="w-full max-w-md p-6" style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${t.gold}22` }}>
                <Camera className="w-6 h-6" style={{ color: t.gold }} />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg" style={{ fontFamily: t.fontBody }}>Photo ID Required</h3>
                <p className="text-sm text-white/50" style={{ fontFamily: t.fontBody }}>Required before you can access your digital pass</p>
              </div>
            </div>
            <p className="text-sm text-white/60 mb-4" style={{ fontFamily: t.fontBody }}>
              Your membership pass requires a photo for identity verification at the gate. Please upload a clear photo of your face.
            </p>
            <PhotoUpload
              currentPhotoUrl={user?.photo_url}
              onPhotoUploaded={(url) => updatePhotoMutation.mutate(url)}
            />
          </GlassCard>
        </div>
      )}

      <div className="relative flex flex-col pb-24" style={{ minHeight: '100dvh', background: `radial-gradient(ellipse at top, ${t.bg1} 0%, ${t.bg0} 70%)`, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {/* Sponsor bar */}
        <div className="flex items-center justify-center gap-2 px-4 py-1.5" style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-white/40 text-[9px] uppercase tracking-[0.15em] font-semibold" style={{ fontFamily: t.fontBody }}>Proudly brought to you by</span>
          <div className="h-px w-3" style={{ background: 'rgba(255,255,255,0.15)' }} />
          <div className="bg-white rounded px-2 py-0.5">
            <img src="https://media.base44.com/images/public/6966ba172da6c09d1e1650bd/1e9b65742_ZoomEnergy.png" alt="Zoom Energy" className="h-4 w-auto object-contain" />
          </div>
        </div>

        {/* Header */}
        <div className="px-4 pt-4 pb-2 flex items-center gap-3">
          <Link to={createPageUrl('Home')}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.09)' }}>
              <ArrowLeft className="w-5 h-5 text-white" />
            </div>
          </Link>
          <div>
            <h1 className="text-white text-lg" style={{ fontFamily: t.fontDisplay }}>Membership</h1>
            <p className="text-white/50 text-xs" style={{ fontFamily: t.fontBody }}>Manage your membership</p>
          </div>
        </div>

        <div className="px-4 pb-4 space-y-4">
          {/* Payment Success */}
          {paymentSuccess && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <GlassCard className="p-5" style={{ borderColor: `${t.green}44` }}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${t.green}22` }}>
                    <Shield className="w-5 h-5" style={{ color: t.green }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg mb-1" style={{ fontFamily: t.fontBody }}>Welcome to the Club!</h3>
                    <p className="text-sm text-white/60" style={{ fontFamily: t.fontBody }}>Your payment was successful. Your membership is now active — your digital pass is ready below.</p>
                    <p className="text-xs text-white/40 mt-2" style={{ fontFamily: t.fontBody }}>Show your QR code at the gate on game day for entry.</p>
                  </div>
                </div>
                <button onClick={() => setPaymentSuccess(false)} className="mt-3 text-xs underline" style={{ color: t.gold }}>Dismiss</button>
              </GlassCard>
            </motion.div>
          )}

          {/* Photo update inline */}
          {showPhotoUpload && user?.photo_url && (
            <GlassCard className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${t.gold}22` }}>
                  <Camera className="w-5 h-5" style={{ color: t.gold }} />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1" style={{ fontFamily: t.fontBody }}>Update Photo ID</h3>
                  <p className="text-sm text-white/50" style={{ fontFamily: t.fontBody }}>Upload a new photo for gate verification</p>
                </div>
              </div>
              <PhotoUpload
                currentPhotoUrl={user?.photo_url}
                onPhotoUploaded={(url) => updatePhotoMutation.mutate(url)}
              />
            </GlassCard>
          )}

          {membership ? (
            <>
              {/* Current Membership Card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <GlassCard className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center p-1">
                        <img src={clubConfig.identity.logo_url} alt={clubConfig.identity.club_name} className="w-full h-full object-contain" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg" style={{ fontFamily: t.fontBody }}>{clubConfig.identity.club_name.toUpperCase()}</h3>
                        <p className="text-white/60 text-sm" style={{ fontFamily: t.fontBody }}>{currentTier?.name || membership.tier_name}</p>
                      </div>
                    </div>
                    {membership.status === 'active' ? (
                      <div className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5" style={{ background: `${t.green}22`, color: t.green, boxShadow: `0 0 12px ${t.green}44` }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: t.green, boxShadow: `0 0 6px ${t.green}` }} />
                        ACTIVE
                      </div>
                    ) : (
                      <div className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: `${t.gold}22`, color: t.gold }}>
                        {membership.status?.toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 mb-6">
                    <div>
                      <p className="text-white/40 text-xs uppercase tracking-wider" style={{ fontFamily: t.fontBody }}>Member</p>
                      <p className="font-semibold text-white text-lg" style={{ fontFamily: t.fontBody }}>{user?.full_name}</p>
                    </div>
                    <div className="flex gap-6">
                      <div>
                        <p className="text-white/40 text-xs uppercase tracking-wider" style={{ fontFamily: t.fontBody }}>Valid From</p>
                        <p className="font-medium text-white" style={{ fontFamily: t.fontBody }}>{membership.start_date ? format(new Date(membership.start_date), 'MMM d, yyyy') : 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-white/40 text-xs uppercase tracking-wider" style={{ fontFamily: t.fontBody }}>Expires</p>
                        <p className="font-medium text-white" style={{ fontFamily: t.fontBody }}>{expiryDate ? format(expiryDate, 'MMM d, yyyy') : 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Benefits */}
                  {currentTier?.benefits?.length > 0 && (
                    <div className="space-y-2 mb-6">
                      <p className="text-white/40 text-xs uppercase tracking-wider mb-2" style={{ fontFamily: t.fontBody }}>Your Benefits</p>
                      {currentTier.benefits.map((benefit, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm text-white/80" style={{ fontFamily: t.fontBody }}>
                          <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${t.gold}22` }}>
                            <Check className="w-3 h-3" style={{ color: t.gold }} />
                          </div>
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <GoldButton onClick={() => setShowQR(true)} fullWidth>
                    <CreditCard className="w-5 h-5" />
                    View Digital Pass
                  </GoldButton>
                </GlassCard>
              </motion.div>

              {/* Expiry Warning */}
              {isExpiringSoon && (
                <GlassCard className="p-4" style={{ borderColor: `${t.gold}44` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${t.gold}22` }}>
                      <Calendar className="w-5 h-5" style={{ color: t.gold }} />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-white" style={{ fontFamily: t.fontBody }}>Expiring Soon</p>
                      <p className="text-sm text-white/50" style={{ fontFamily: t.fontBody }}>{daysUntilExpiry} days remaining</p>
                    </div>
                    <Button size="sm" style={{ background: t.gold, color: t.bg0 }}>Renew</Button>
                  </div>
                </GlassCard>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <GlassCard className="p-4">
                  <p className="text-white/50 text-sm mb-1" style={{ fontFamily: t.fontBody }}>Total Check-ins</p>
                  <p className="text-2xl font-bold text-white" style={{ fontFamily: t.fontDisplay }}>{membership.total_checkins || 0}</p>
                </GlassCard>
                <GlassCard className="p-4">
                  <p className="text-white/50 text-sm mb-1" style={{ fontFamily: t.fontBody }}>Current Points</p>
                  <p className="text-2xl font-bold" style={{ fontFamily: t.fontDisplay, color: t.gold }}>{membership.points || 0}</p>
                </GlassCard>
              </div>

              {/* Family Members */}
              {familyMembers.length > 0 && (
                <GlassCard className="overflow-hidden">
                  <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-white/40" />
                      <h3 className="font-semibold text-white" style={{ fontFamily: t.fontBody }}>Linked Family Members</h3>
                    </div>
                    <span className="text-sm text-white/50" style={{ fontFamily: t.fontBody }}>{familyMembers.length}</span>
                  </div>
                  {familyMembers.map((member, idx) => (
                    <div key={idx} className="p-4 flex items-center justify-between" style={{ borderBottom: idx < familyMembers.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <div>
                        <p className="font-medium text-white" style={{ fontFamily: t.fontBody }}>{member.user_name}</p>
                        <p className="text-sm text-white/50" style={{ fontFamily: t.fontBody }}>{member.tier_name}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-white/20" />
                    </div>
                  ))}
                </GlassCard>
              )}

              {/* Referral Share */}
              <ReferralShare membership={membership} user={user} />

              {/* Actions */}
              <div className="space-y-3">
                {user?.photo_url && (
                  <Button variant="outline" className="w-full justify-between" size="lg" onClick={() => setShowPhotoUpload(!showPhotoUpload)}>
                    <span className="flex items-center gap-2"><Camera className="w-5 h-5" />Update Photo ID</span>
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                )}
                <Button variant="outline" className="w-full justify-between" size="lg">
                  <span className="flex items-center gap-2"><RefreshCcw className="w-5 h-5" />Renew Membership</span>
                  <ChevronRight className="w-5 h-5" />
                </Button>
                <Button variant="outline" className="w-full justify-between" size="lg">
                  <span className="flex items-center gap-2"><Plus className="w-5 h-5" />Add Family Member</span>
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Hero */}
              <GlassCard className="p-6 text-center relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 30%, ${t.gold}15, transparent 60%)` }} />
                <div className="relative z-10">
                  <p className="text-[10px] uppercase tracking-[0.25em] font-semibold mb-2" style={{ color: t.gold, fontFamily: t.fontBody }}>{clubConfig.season.label}</p>
                  <h1 className="text-white mb-2" style={{ fontFamily: t.fontDisplay, fontSize: '32px', lineHeight: 1.1 }}>{clubConfig.terminology.join_headline}</h1>
                  <p className="text-white/50 text-sm" style={{ fontFamily: t.fontBody }}>Support {clubConfig.identity.club_name} and unlock exclusive member benefits, digital passes, rewards and more.</p>
                </div>
              </GlassCard>

              {/* Player Pass */}
              <Link to={createPageUrl('PlayerPassRegistration')}>
                <GlassCard className="p-5 cursor-pointer" style={{ borderColor: `${t.royal}44` }}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-white text-lg" style={{ fontFamily: t.fontBody }}>{clubConfig.season.year} Player Pass</h3>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: `${t.royal}22`, color: t.cyan }}>FREE</span>
                  </div>
                  <p className="text-sm text-white/50 mb-3" style={{ fontFamily: t.fontBody }}>For all registered {clubConfig.identity.club_name} players</p>
                  <button className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all" style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)' }}>
                    Apply Now
                  </button>
                </GlassCard>
              </Link>

              {/* Tier Cards */}
              <div className="space-y-4">
                {tiers.filter(tier => !tier.is_admin_only && !tier.name?.toLowerCase().includes('day pass')).map((tier) => {
                  const isPremium = tier.name?.toLowerCase().includes('premium');
                  return (
                    <motion.div key={tier.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                      <GlassCard className="relative p-5" style={isPremium ? { border: `1px solid ${t.gold}73`, boxShadow: `0 0 32px ${t.gold}22, 0 8px 32px rgba(0,0,0,0.3)`, transform: 'scale(1.02)' } : {}}>
                        {isPremium && (
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-0.5 rounded-full text-xs font-bold whitespace-nowrap" style={{ background: `linear-gradient(135deg, ${t.gold}, ${t.goldHi})`, color: t.bg0, boxShadow: `0 0 12px ${t.gold}66` }}>
                            MOST POPULAR
                          </div>
                        )}
                        <div className="flex items-start justify-between mb-3 mt-2">
                          <h3 className="text-white" style={{ fontFamily: t.fontDisplay, fontSize: '20px' }}>{tier.name}</h3>
                          <div className="text-right">
                            <p style={{ fontFamily: t.fontDisplay, fontSize: '32px', color: t.gold, lineHeight: 1 }}>${tier.price}</p>
                            <p className="text-white/40 text-xs" style={{ fontFamily: t.fontBody }}>/{tier.price_period}</p>
                          </div>
                        </div>
                        {tier.description && <p className="text-white/50 text-sm mb-3" style={{ fontFamily: t.fontBody }}>{tier.description}</p>}
                        {tier.benefits?.length > 0 && (
                          <div className="space-y-2 mb-4">
                            {tier.benefits.map((benefit, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-sm text-white/80" style={{ fontFamily: t.fontBody }}>
                                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${t.gold}22` }}>
                                  <Check className="w-3 h-3" style={{ color: t.gold }} />
                                </div>
                                <span>{benefit}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <Link to={createPageUrl('JoinMembership')}>
                          <GoldButton fullWidth>
                            Join as {tier.name}
                          </GoldButton>
                        </Link>
                      </GlassCard>
                    </motion.div>
                  );
                })}
              </div>

              {/* Day Pass */}
              <GlassCard className="p-5">
                <div className="mb-2"><Eyebrow color={t.gold}>Just here for one game?</Eyebrow></div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white" style={{ fontFamily: t.fontDisplay, fontSize: '20px' }}>Day Pass</h3>
                  {dayPassTier && (
                    <p style={{ fontFamily: t.fontDisplay, fontSize: '28px', color: t.gold, lineHeight: 1 }}>${dayPassTier.price}</p>
                  )}
                </div>
                <p className="text-white/50 text-sm mb-4" style={{ fontFamily: t.fontBody }}>Single entry to any upcoming home game</p>
                <Link to={createPageUrl('DayPass')}>
                  <GoldButton variant="outline" fullWidth>
                    Get Day Pass
                  </GoldButton>
                </Link>
                <p className="text-white/30 text-xs text-center mt-3" style={{ fontFamily: t.fontBody }}>Day Pass points count toward membership rewards.</p>
              </GlassCard>

              {/* Trust Strip */}
              <div className="flex items-center justify-center gap-4 pt-4 pb-2">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-white/30" />
                  <span className="text-white/30 text-xs" style={{ fontFamily: t.fontBody }}>Secure checkout via Stripe</span>
                </div>
                <div className="h-3 w-px" style={{ background: 'rgba(255,255,255,0.1)' }} />
                <div className="flex items-center gap-1.5">
                  <img src={clubConfig.identity.logo_url} alt={clubConfig.identity.club_name} className="w-5 h-5 object-contain bg-white rounded-full p-0.5" />
                  <span className="text-white/30 text-xs" style={{ fontFamily: t.fontBody }}>Est. {clubConfig.identity.est_year}</span>
                </div>
              </div>
            </>
          )}
        </div>

        <QRModal
          isOpen={showQR}
          onClose={() => setShowQR(false)}
          membership={membership}
          user={user}
          onPhotoUploaded={async (url) => {
            await updatePhotoMutation.mutateAsync(url);
          }}
        />
      </div>
    </>
  );
}