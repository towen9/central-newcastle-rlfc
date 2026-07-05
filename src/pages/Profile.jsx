import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Phone, MapPin, Bell, LogOut, ChevronRight, Shield, Edit2, Check, X, Trash2, AlertTriangle, RefreshCw, Share2, Copy, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { subscribePush, unsubscribePush } from '@/lib/pushNotifications';
import clubConfig from '@/config/club.config';
import GlassCard from '@/components/ui-kit/GlassCard';
import GoldButton from '@/components/ui-kit/GoldButton';
import Eyebrow from '@/components/ui-kit/Eyebrow';
import { SkeletonCard } from '@/components/ui-kit/Skeleton';
import { format } from 'date-fns';

const t = clubConfig.theme;

export default function Profile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [referralCopied, setReferralCopied] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
      setEditData({
        phone: userData.phone || '',
        postcode: userData.postcode || ''
      });
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
    enabled: !!user?.id,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: rewardsCount } = useQuery({
    queryKey: ['profile-rewards', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const redemptions = await base44.entities.RewardRedemption.filter({ user_id: user.id });
      return redemptions.length;
    },
    enabled: !!user?.id,
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      setUser(prev => ({ ...prev, ...data }));
      await base44.auth.updateMe(data);
    },
    onSuccess: async () => {
      const userData = await base44.auth.me();
      setUser(userData);
      setEditing(false);
      toast.success('Profile updated');
    },
    onError: async () => {
      const userData = await base44.auth.me();
      setUser(userData);
      toast.error('Failed to update profile');
    }
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      const memberships = await base44.entities.Membership.filter({ user_id: user.id });
      for (const m of memberships) {
        await base44.entities.Membership.delete(m.id);
      }
      const checkIns = await base44.entities.CheckIn.filter({ user_id: user.id });
      for (const c of checkIns) {
        await base44.entities.CheckIn.delete(c.id);
      }
      const redemptions = await base44.entities.RewardRedemption.filter({ user_id: user.id });
      for (const r of redemptions) {
        await base44.entities.RewardRedemption.delete(r.id);
      }
      base44.auth.logout();
    },
    onSuccess: () => {
      toast.success('Account deleted successfully');
    }
  });

  const handleLogout = () => {
    base44.auth.logout();
  };

  const handleClearCache = async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
    localStorage.clear();
    sessionStorage.clear();
    toast.success('Cache cleared! Reloading...');
    setTimeout(() => {
      window.location.reload(true);
    }, 500);
  };

  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const isPushSupported = typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    typeof Notification !== 'undefined';

  useEffect(() => {
    try {
      const permission = typeof Notification !== 'undefined' ? Notification.permission : 'default';
      if (membership) {
        setPushEnabled(!!(membership.push_subscription && permission === 'granted'));
      }
    } catch (e) {
      setPushEnabled(false);
    }
  }, [membership]);

  const handlePushToggle = async (newValue) => {
    const previousValue = pushEnabled;
    setPushEnabled(newValue);
    setPushLoading(true);
    try {
      if (newValue) {
        await subscribePush();
        toast.success("Notifications enabled! You'll get game day updates. \u{1F3C9}");
      } else {
        await unsubscribePush();
      }
      await queryClient.invalidateQueries({ queryKey: ['membership', user?.id] });
    } catch (err) {
      setPushEnabled(previousValue);
      if (err.message === 'PERMISSION_DENIED') {
        toast.error('Notifications blocked. Enable in your device settings to receive updates.');
      } else {
        toast.error(err.message || 'Failed to update notifications');
      }
    } finally {
      setPushLoading(false);
    }
  };

  const consentSettings = [
    { key: 'marketing_email', label: 'Email updates', description: 'News, events, and announcements' },
    { key: 'sponsor_offers', label: 'Sponsor offers', description: 'Exclusive deals from partners' }
  ];

  const referralCode = membership?.qr_code_id ?
    `REF-${membership.qr_code_id.substring(0, 8).toUpperCase()}` :
    `REF-${user?.id?.substring(0, 8).toUpperCase()}`;
  const referralUrl = `${window.location.origin}/JoinMembership?ref=${referralCode}`;

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(referralUrl);
    setReferralCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setReferralCopied(false), 3000);
  };

  const handleShareReferral = async () => {
    if (navigator.share) {
      await navigator.share({
        title: `Join ${clubConfig.identity.club_name}`,
        text: `Join me as a member at ${clubConfig.identity.club_name}!`,
        url: referralUrl,
      });
    } else {
      handleCopyReferral();
    }
  };

  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  if (!user) {
    return (
      <div style={{ minHeight: '100dvh', paddingBottom: '6rem' }} className="px-5 py-6 space-y-4">
        <SkeletonCard />
        <div className="grid grid-cols-3 gap-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', paddingBottom: '6rem' }}>
      {/* Header */}
      <div className="pt-safe px-5 py-4 flex items-center gap-4">
        <Link to={createPageUrl('Home')}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.09)' }}>
            <ArrowLeft className="w-5 h-5 text-white" />
          </div>
        </Link>
        <div>
          <Eyebrow color={t.gold}>Profile</Eyebrow>
          <h1 className="text-white text-xl" style={{ fontFamily: t.fontDisplay }}>Account</h1>
        </div>
      </div>

      <div className="px-5 py-2 space-y-5">
        {/* (a) Identity Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="p-6">
            <div className="flex items-center gap-4 mb-5">
              {membership?.photo_url ? (
                <div className="w-16 h-16 rounded-full overflow-hidden shrink-0" style={{ border: `2px solid ${t.gold}` }}>
                  <img src={membership.photo_url} alt={user?.full_name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0" style={{ border: `2px solid ${t.gold}`, background: 'rgba(255,255,255,0.06)' }}>
                  <span className="text-white text-xl" style={{ fontFamily: t.fontDisplay }}>{initials}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-white text-xl truncate" style={{ fontFamily: t.fontDisplay }}>{user?.full_name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{membership?.tier_name || 'No active membership'}</span>
                  {membership?.status === 'active' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: `${t.green}22`, color: t.green }}>ACTIVE</span>
                  )}
                </div>
              </div>
              <button onClick={() => setEditing(!editing)} className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }}>
                {editing ? <X className="w-4 h-4 text-white" /> : <Edit2 className="w-4 h-4 text-white" />}
              </button>
            </div>

            {user?.created_date && (
              <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>Joined {format(new Date(user.created_date), 'MMMM yyyy')}</p>
            )}

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>Email</p>
                  <p className="text-white text-sm truncate">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }} />
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>Phone</p>
                  {editing ? (
                    <Input value={editData.phone} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} placeholder="Enter phone number" className="mt-1" />
                  ) : (
                    <p className="text-white text-sm">{user?.phone || 'Not set'}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }} />
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>Postcode</p>
                  {editing ? (
                    <Input value={editData.postcode} onChange={(e) => setEditData({ ...editData, postcode: e.target.value })} placeholder="Enter postcode" className="mt-1" />
                  ) : (
                    <p className="text-white text-sm">{user?.postcode || 'Not set'}</p>
                  )}
                </div>
              </div>
              {editing && (
                <GoldButton fullWidth onClick={() => updateMutation.mutate(editData)} disabled={updateMutation.isPending}>
                  <Check className="w-4 h-4" />
                  Save Changes
                </GoldButton>
              )}
            </div>
          </GlassCard>
        </motion.div>

        {/* (b) Season Stats */}
        <div className="grid grid-cols-3 gap-3">
          <GlassCard className="p-4 text-center">
            <Eyebrow color="rgba(255,255,255,0.4)">Points</Eyebrow>
            <p className="text-2xl mt-1" style={{ fontFamily: t.fontDisplay, color: t.gold }}>{membership?.points ?? 0}</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <Eyebrow color="rgba(255,255,255,0.4)">Check-ins</Eyebrow>
            <p className="text-2xl mt-1" style={{ fontFamily: t.fontDisplay, color: t.gold }}>{membership?.total_checkins ?? 0}</p>
          </GlassCard>
          <GlassCard className="p-4 text-center">
            <Eyebrow color="rgba(255,255,255,0.4)">Rewards</Eyebrow>
            <p className="text-2xl mt-1" style={{ fontFamily: t.fontDisplay, color: t.gold }}>{rewardsCount ?? 0}</p>
          </GlassCard>
        </div>

        {/* (c) Referral Card */}
        {membership?.status === 'active' && (
          <GlassCard className="p-5">
            <Eyebrow color={t.gold}>Bring a mate</Eyebrow>
            <h3 className="text-white text-base mt-1 mb-3" style={{ fontFamily: t.fontDisplay }}>Share your referral link</h3>
            <button onClick={handleCopyReferral} className="w-full text-left mb-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>Tap to copy</p>
                  <p className="font-mono text-white text-sm mt-0.5">{referralCode}</p>
                </div>
                {referralCopied ? <CheckCircle2 className="w-5 h-5" style={{ color: t.green }} /> : <Copy className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.4)' }} />}
              </div>
            </button>
            <GoldButton fullWidth onClick={handleShareReferral}>
              <Share2 className="w-4 h-4" />
              Share Link
            </GoldButton>
          </GlassCard>
        )}

        {/* (d) Actions List */}
        <div className="space-y-3">
          <Link to={createPageUrl('Membership')}>
            <GlassCard className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <Shield className="w-5 h-5" style={{ color: t.gold }} />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Membership</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>View and manage</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.3)' }} />
            </GlassCard>
          </Link>

          {/* Notifications */}
          <GlassCard className="overflow-hidden">
            <div className="p-4 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <Bell className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.4)' }} />
              <h3 className="text-white text-sm font-semibold">Notifications</h3>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">Push notifications</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Match reminders and instant updates</p>
              </div>
              <Switch checked={pushEnabled} disabled={pushLoading || !isPushSupported} onCheckedChange={handlePushToggle} />
            </div>
            {consentSettings.map((setting) => (
              <div key={setting.key} className="p-4 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <div>
                  <p className="text-white text-sm font-medium">{setting.label}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{setting.description}</p>
                </div>
                <Switch checked={user?.[setting.key] ?? true} onCheckedChange={(checked) => updateMutation.mutate({ [setting.key]: checked })} />
              </div>
            ))}
          </GlassCard>

          {/* Clear Cache */}
          <button onClick={handleClearCache} className="w-full text-left">
            <GlassCard className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <RefreshCw className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.5)' }} />
                </div>
                <p className="text-white text-sm font-medium">Clear Cache & Refresh</p>
              </div>
              <ChevronRight className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.3)' }} />
            </GlassCard>
          </button>

          {/* Sign Out */}
          <button onClick={handleLogout} className="w-full text-left">
            <GlassCard className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.1)' }}>
                  <LogOut className="w-5 h-5" style={{ color: '#ef4444' }} />
                </div>
                <p className="text-sm font-medium" style={{ color: '#ef4444' }}>Sign Out</p>
              </div>
            </GlassCard>
          </button>

          {/* Delete Account */}
          <button onClick={() => setShowDeleteDialog(true)} className="w-full text-left">
            <GlassCard className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,68,68,0.08)' }}>
                  <Trash2 className="w-5 h-5" style={{ color: '#dc2626' }} />
                </div>
                <p className="text-sm font-medium" style={{ color: '#dc2626' }}>Delete Account</p>
              </div>
            </GlassCard>
          </button>
        </div>

        {/* (f) Footer */}
        <p className="text-center text-xs pt-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
          {clubConfig.identity.club_name} App v1.0.0
        </p>
      </div>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md" style={{ background: t.bg1, border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(239,68,68,0.15)' }}>
              <AlertTriangle className="w-6 h-6" style={{ color: '#ef4444' }} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Delete Account?</h2>
            <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.6)' }}>
              This will permanently delete your account and all associated data including memberships, check-ins, and rewards. This action cannot be undone.
            </p>
            <div className="rounded-lg p-3 mb-6" style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.2)' }}>
              <p className="text-sm" style={{ color: t.goldHi }}>
                Type <span className="font-bold">DELETE</span> to confirm
              </p>
            </div>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="mb-4"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'white', borderColor: 'rgba(255,255,255,0.1)' }}
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeleteConfirmText('');
                }}
                className="flex-1"
                style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'white', background: 'transparent' }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => deleteAccountMutation.mutate()}
                disabled={deleteConfirmText !== 'DELETE' || deleteAccountMutation.isPending}
                className="flex-1"
                style={{ background: '#dc2626', color: 'white' }}
              >
                {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete Account'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}