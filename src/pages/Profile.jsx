import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Mail, Phone, MapPin, Bell, LogOut, ChevronRight, Shield, Edit2, Check, X, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { subscribePush, unsubscribePush } from '@/lib/pushNotifications';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
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
    enabled: !!user?.id
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      // Optimistic update
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
      // Revert on error
      const userData = await base44.auth.me();
      setUser(userData);
      toast.error('Failed to update profile');
    }
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      // Delete all user's data
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
      // Logout after deletion
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
    // Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
    
    // Clear localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    
    toast.success('Cache cleared! Reloading...');
    
    // Hard reload the page
    setTimeout(() => {
      window.location.reload(true);
    }, 500);
  };

  // Push toggle state: true only if there's a real subscription saved on Membership
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const isPushSupported = typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    typeof Notification !== 'undefined';

  useEffect(() => {
    try {
      // Sync push toggle with actual membership subscription state
      // Guard: Notification may be undefined on iOS Safari or in some PWA contexts
      const permission = typeof Notification !== 'undefined' ? Notification.permission : 'default';
      if (membership) {
        setPushEnabled(!!(membership.push_subscription && permission === 'granted'));
      }
    } catch (e) {
      // Silently leave toggle OFF if any browser API is unavailable
      setPushEnabled(false);
    }
  }, [membership]);

  const handlePushToggle = async (checked) => {
    setPushLoading(true);
    if (checked) {
      try {
        await subscribePush();
        setPushEnabled(true);
        toast.success("Notifications enabled! You'll get game day updates. 🏉");
        queryClient.invalidateQueries({ queryKey: ['membership', user?.id] });
      } catch (e) {
        setPushEnabled(false);
        if (e.message === 'PERMISSION_DENIED') {
          toast.error('Notifications blocked. Enable in your device settings to receive updates.');
        } else {
          toast.error('Could not enable notifications: ' + e.message);
        }
      }
    } else {
      try {
        await unsubscribePush();
        setPushEnabled(false);
        queryClient.invalidateQueries({ queryKey: ['membership', user?.id] });
      } catch (e) {
        toast.error('Could not disable notifications: ' + e.message);
      }
    }
    setPushLoading(false);
  };

  const consentSettings = [
    { key: 'marketing_email', label: 'Email updates', description: 'News, events, and announcements' },
    { key: 'sponsor_offers', label: 'Sponsor offers', description: 'Exclusive deals from partners' }
  ];

  return (
    <div className="bg-gray-50" style={{minHeight: '100dvh', paddingBottom: '6rem'}}>
      {/* Header */}
      <div className="bg-[#1a365d] pt-safe">
        <div className="px-5 py-4 flex items-center gap-4">
          <Link to={createPageUrl('Home')}>
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-white" />
            </div>
          </Link>
          <div>
            <h1 className="text-white text-xl font-bold">Profile</h1>
            <p className="text-blue-200 text-sm">Manage your account</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 space-y-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 border border-gray-100"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-[#1a365d] rounded-2xl flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{user?.full_name}</h2>
              <p className="text-gray-500">{membership?.tier_name || 'No active membership'}</p>
            </div>
            <button 
              onClick={() => setEditing(!editing)}
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"
            >
              {editing ? <X className="w-5 h-5 text-gray-600" /> : <Edit2 className="w-5 h-5 text-gray-600" />}
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-gray-900">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Phone</p>
                {editing ? (
                  <Input
                    value={editData.phone}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    placeholder="Enter phone number"
                    className="mt-1"
                  />
                ) : (
                  <p className="text-gray-900">{user?.phone || 'Not set'}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Postcode</p>
                {editing ? (
                  <Input
                    value={editData.postcode}
                    onChange={(e) => setEditData({ ...editData, postcode: e.target.value })}
                    placeholder="Enter postcode"
                    className="mt-1"
                  />
                ) : (
                  <p className="text-gray-900">{user?.postcode || 'Not set'}</p>
                )}
              </div>
            </div>

            {editing && (
              <Button
                onClick={() => updateMutation.mutate(editData)}
                disabled={updateMutation.isPending}
                className="w-full bg-[#1a365d] hover:bg-[#2c5282]"
              >
                <Check className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            )}
          </div>
        </motion.div>

        {/* Membership Link */}
        <Link to={createPageUrl('Membership')}>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Membership</p>
                <p className="text-sm text-gray-500">View and manage your membership</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </Link>

        {/* Clear Cache */}
        <Button
          variant="outline"
          onClick={handleClearCache}
          className="w-full border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          <RefreshCw className="w-5 h-5 mr-2" />
          Clear Cache & Refresh
        </Button>

        {/* Notification Preferences */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center gap-3">
            <Bell className="w-5 h-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Notifications</h3>
          </div>
          
          <div className="divide-y divide-gray-50">
            {/* Push notifications — uses real browser subscription, not a User boolean */}
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Push notifications</p>
                <p className="text-sm text-gray-500">Match reminders and instant updates</p>
              </div>
              <Switch
                checked={pushEnabled}
                disabled={pushLoading || !isPushSupported}
                onCheckedChange={handlePushToggle}
              />
            </div>

            {/* Email / sponsor toggles — write booleans to User entity */}
            {consentSettings.map((setting) => (
              <div key={setting.key} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{setting.label}</p>
                  <p className="text-sm text-gray-500">{setting.description}</p>
                </div>
                <Switch
                  checked={user?.[setting.key] ?? true}
                  onCheckedChange={(checked) => {
                    updateMutation.mutate({ [setting.key]: checked });
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Logout */}
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Sign Out
        </Button>

        {/* Delete Account */}
        <Button
          variant="outline"
          onClick={() => setShowDeleteDialog(true)}
          className="w-full border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-950"
        >
          <Trash2 className="w-5 h-5 mr-2" />
          Delete Account
        </Button>

        {/* App Version */}
        <p className="text-center text-xs text-gray-400 dark:text-gray-500">
          Central Newcastle RLFC App v1.0.0
        </p>
      </div>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Delete Account?</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              This will permanently delete your account and all associated data including memberships, check-ins, and rewards. This action cannot be undone.
            </p>
            
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 mb-6">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Type <span className="font-bold">DELETE</span> to confirm
              </p>
            </div>
            
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="mb-4 dark:bg-gray-800 dark:text-white"
            />
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteDialog(false);
                  setDeleteConfirmText('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => deleteAccountMutation.mutate()}
                disabled={deleteConfirmText !== 'DELETE' || deleteAccountMutation.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
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