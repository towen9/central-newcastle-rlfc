import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, CreditCard, Users, Calendar, Shield, ChevronRight, RefreshCcw, Plus, Camera } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { format, differenceInDays } from 'date-fns';
import QRModal from '../components/shared/QRModal';
import PhotoUpload from '../components/membership/PhotoUpload';
import { toast } from 'sonner';

export default function Membership() {
  const [showQR, setShowQR] = useState(false);
  const [user, setUser] = useState(null);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const queryClient = useQueryClient();

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
      const memberships = await base44.entities.Membership.filter({ user_id: user.id });
      return memberships[0] || null;
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

  const currentTier = tiers.find(t => t.id === membership?.tier_id);
  const expiryDate = membership?.expiry_date ? new Date(membership.expiry_date) : null;
  const daysUntilExpiry = expiryDate ? differenceInDays(expiryDate, new Date()) : null;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0;

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
            <h1 className="text-white text-xl font-bold">Membership</h1>
            <p className="text-blue-200 text-sm">Manage your membership</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-6">
        {/* Photo Upload Required */}
        {showPhotoUpload && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 mb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Camera className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-900 mb-1">Photo ID Required</h3>
                <p className="text-sm text-amber-700">
                  Upload your photo for gate verification at matches
                </p>
              </div>
            </div>
            <PhotoUpload 
              currentPhotoUrl={user?.photo_url}
              onPhotoUploaded={(url) => updatePhotoMutation.mutate(url)}
            />
          </div>
        )}

        {membership ? (
          <>
            {/* Current Membership Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-3xl p-6 mb-6 ${
                membership.status === 'active'
                  ? 'bg-gradient-to-br from-[#1a365d] via-[#2c5282] to-[#2b6cb0]'
                  : 'bg-gradient-to-br from-gray-500 to-gray-700'
              } text-white`}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center p-1">
                    <img 
                      src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6966ba172da6c09d1e1650bd/6b3832f4a_Butcherboyslogo.jpg"
                      alt="Central Newcastle RLFC"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">CENTRAL NEWCASTLE RLFC</h3>
                    <p className="text-white/70 text-sm">{currentTier?.name || membership.tier_name}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  membership.status === 'active' ? 'bg-emerald-400/20 text-emerald-300' : 'bg-red-400/20 text-red-300'
                }`}>
                  {membership.status?.toUpperCase()}
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-white/60 text-xs uppercase tracking-wider">Member</p>
                  <p className="font-semibold text-lg">{user?.full_name}</p>
                </div>
                <div className="flex gap-6">
                  <div>
                    <p className="text-white/60 text-xs uppercase tracking-wider">Valid From</p>
                    <p className="font-medium">
                      {membership.start_date ? format(new Date(membership.start_date), 'MMM d, yyyy') : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-white/60 text-xs uppercase tracking-wider">Expires</p>
                    <p className="font-medium">
                      {expiryDate ? format(expiryDate, 'MMM d, yyyy') : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowQR(true)}
                className="w-full py-3 bg-white text-[#1a365d] rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                View Digital Pass
              </button>
            </motion.div>

            {/* Expiry Warning */}
            {isExpiringSoon && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-amber-800">Expiring Soon</p>
                    <p className="text-sm text-amber-600">{daysUntilExpiry} days remaining</p>
                  </div>
                  <Button size="sm" className="bg-amber-500 hover:bg-amber-600">
                    Renew
                  </Button>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <p className="text-gray-500 text-sm mb-1">Total Check-ins</p>
                <p className="text-2xl font-bold text-gray-900">{membership.total_checkins || 0}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <p className="text-gray-500 text-sm mb-1">Current Stamps</p>
                <p className="text-2xl font-bold text-amber-500">{membership.stamps || 0}</p>
              </div>
            </div>

            {/* Family Members */}
            {familyMembers.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-6">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-gray-400" />
                    <h3 className="font-semibold text-gray-900">Linked Family Members</h3>
                  </div>
                  <span className="text-sm text-gray-500">{familyMembers.length}</span>
                </div>
                {familyMembers.map((member, idx) => (
                  <div key={idx} className="p-4 border-b border-gray-50 last:border-0 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{member.user_name}</p>
                      <p className="text-sm text-gray-500">{member.tier_name}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300" />
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              {user?.photo_url && (
                <Button 
                  variant="outline" 
                  className="w-full justify-between" 
                  size="lg"
                  onClick={() => setShowPhotoUpload(!showPhotoUpload)}
                >
                  <span className="flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Update Photo ID
                  </span>
                  <ChevronRight className="w-5 h-5" />
                </Button>
              )}
              <Button variant="outline" className="w-full justify-between" size="lg">
                <span className="flex items-center gap-2">
                  <RefreshCcw className="w-5 h-5" />
                  Renew Membership
                </span>
                <ChevronRight className="w-5 h-5" />
              </Button>
              <Button variant="outline" className="w-full justify-between" size="lg">
                <span className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add Family Member
                </span>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </>
        ) : (
          /* No Membership */
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <CreditCard className="w-10 h-10 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Active Membership</h2>
            <p className="text-gray-500 mb-6">Join Central Newcastle RLFC to access exclusive benefits</p>
            
            <div className="space-y-4">
              <Link to={createPageUrl('PlayerPassRegistration')}>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 border-2 border-blue-700 text-white mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg">🏉 2026 Player Pass</h3>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold">FREE</span>
                  </div>
                  <p className="text-sm text-blue-100 mb-3">For Central Newcastle RLFC players (Men's & Women's)</p>
                  <Button className="w-full bg-white text-blue-600 hover:bg-blue-50">
                    Apply Now
                  </Button>
                </div>
              </Link>

              <Link to={createPageUrl('DayPass')}>
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 border-2 border-emerald-700 text-white mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg">🎟️ Game Day Pass</h3>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold">$8</span>
                  </div>
                  <p className="text-sm text-emerald-100 mb-3">Single entry pass for today's match</p>
                  <Button className="w-full bg-white text-emerald-600 hover:bg-emerald-50">
                    Buy Day Pass
                  </Button>
                </div>
              </Link>
              
              {tiers.filter(t => !t.is_admin_only).map((tier) => (
                <div key={tier.id} className="bg-white rounded-xl p-4 border border-gray-200 text-left">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{tier.name}</h3>
                    <p className="font-bold text-[#1a365d]">
                      ${tier.price}<span className="text-sm font-normal text-gray-500">/{tier.price_period}</span>
                    </p>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">{tier.description}</p>
                  <Link to={createPageUrl('JoinMembership')}>
                    <Button className="w-full bg-[#1a365d] hover:bg-[#2c5282]">
                      Join Now
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <QRModal
        isOpen={showQR}
        onClose={() => setShowQR(false)}
        membership={membership}
        user={user}
      />
    </div>
  );
}