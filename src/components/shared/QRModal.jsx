import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Download, WifiOff, Camera } from 'lucide-react';
import { format } from 'date-fns';
import { OfflineCache } from '../offline/OfflineCache';
import PhotoUpload from '../membership/PhotoUpload';
import { base44 } from '@/api/base44Client';
import clubConfig from '@/config/club.config';

export default function QRModal({ isOpen, onClose, membership, user, onPhotoUploaded }) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const needsPhoto = membership && !user?.photo_url;

  useEffect(() => {
    if (isOpen && membership?.qr_code_id && user?.id) {
      // Try to load cached QR first
      const cached = OfflineCache.getCachedMembershipQR(user.id);
      if (cached) {
        setQrDataUrl(cached);
      }
      
      // Generate QR code URL
      const qrData = JSON.stringify({
        type: 'membership',
        id: membership.qr_code_id,
        user_id: membership.user_id
      });
      const encodedData = encodeURIComponent(qrData);
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodedData}`;
      
      if (!cached) {
        setQrDataUrl(qrUrl);
      }
      
      // Cache membership data for offline use
      OfflineCache.cacheMembership(user.id, membership, user);

      // If membership doesn't have photo_url but user does, sync it
      if (!membership.photo_url && user?.photo_url) {
        import('@/api/base44Client').then(({ base44 }) => {
          base44.entities.Membership.update(membership.id, { photo_url: user.photo_url }).catch(() => {});
        });
      }
    }

    // Monitor online/offline status
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOpen, membership, user]);

  if (!isOpen) return null;

  // Gate: photo required before showing the QR
  if (needsPhoto) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white rounded-2xl w-full max-w-md p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Camera className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Photo ID Required</h3>
                  <p className="text-sm text-gray-500">Upload a photo to access your pass</p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              A photo is required for identity verification at the gate. Please upload a clear photo of your face.
            </p>
            <PhotoUpload
              currentPhotoUrl={null}
              onPhotoUploaded={async (url) => {
                await base44.auth.updateMe({ photo_url: url });
                if (membership?.id) {
                  await base44.entities.Membership.update(membership.id, { photo_url: url });
                }
                if (onPhotoUploaded) onPhotoUploaded(url);
              }}
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl border border-gray-200 flex items-center justify-center p-1">
                <img 
                  src={clubConfig.identity.logo_url}
                  alt={clubConfig.identity.club_name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{clubConfig.identity.club_name}</h3>
                <p className="text-xs text-gray-500">Digital Membership Pass</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Member Info */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">{user?.full_name}</h2>
            <p className="text-gray-500">{membership?.tier_name}</p>
            
            {/* Offline Indicator */}
            {isOffline && (
              <div className="mt-2 flex items-center justify-center gap-2 bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-xs">
                <WifiOff className="w-3 h-3" />
                Offline Mode
              </div>
            )}
          </div>

          {/* QR Code */}
          <div className="bg-gray-50 rounded-2xl p-6 flex items-center justify-center mb-6">
            {qrDataUrl ? (
              <img 
                src={qrDataUrl} 
                alt="Membership QR Code"
                className="w-48 h-48"
              />
            ) : (
              <div className="w-48 h-48 bg-gray-200 rounded-xl animate-pulse" />
            )}
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4 text-center mb-6">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">Member ID</p>
              <p className="font-mono text-sm font-medium text-gray-900">
                {membership?.qr_code_id?.slice(0, 8)?.toUpperCase()}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-1">Valid Until</p>
              <p className="font-medium text-gray-900">
                {membership?.expiry_date ? format(new Date(membership.expiry_date), 'MMM yyyy') : 'N/A'}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className={`text-center py-3 rounded-xl ${
            membership?.status === 'active' 
              ? 'bg-emerald-50 text-emerald-700' 
              : 'bg-red-50 text-red-700'
          }`}>
            <p className="font-semibold">
              {membership?.status === 'active' ? '✓ Active Membership' : 'Membership Inactive'}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}