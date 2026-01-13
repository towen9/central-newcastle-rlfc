import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Mail, Phone, MapPin, Bell, LogOut, ChevronRight, Shield, Edit2, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
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
      await base44.auth.updateMe(data);
    },
    onSuccess: async () => {
      const userData = await base44.auth.me();
      setUser(userData);
      setEditing(false);
      toast.success('Profile updated');
    }
  });

  const handleLogout = () => {
    base44.auth.logout();
  };

  const consentSettings = [
    { key: 'marketing_email', label: 'Email updates', description: 'News, events, and announcements' },
    { key: 'marketing_push', label: 'Push notifications', description: 'Match reminders and rewards' },
    { key: 'sponsor_offers', label: 'Sponsor offers', description: 'Exclusive deals from partners' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
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

        {/* Notification Preferences */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center gap-3">
            <Bell className="w-5 h-5 text-gray-400" />
            <h3 className="font-semibold text-gray-900">Notifications</h3>
          </div>
          
          <div className="divide-y divide-gray-50">
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
          className="w-full border-red-200 text-red-600 hover:bg-red-50"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Sign Out
        </Button>

        {/* App Version */}
        <p className="text-center text-xs text-gray-400">
          Charlestown RLC App v1.0.0
        </p>
      </div>
    </div>
  );
}