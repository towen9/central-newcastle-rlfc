import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Download } from 'lucide-react';
import { format } from 'date-fns';

export default function QRModal({ isOpen, onClose, membership, user }) {
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    if (isOpen && membership?.qr_code_id) {
      // Generate QR code URL using a QR code API
      const qrData = JSON.stringify({
        type: 'membership',
        id: membership.qr_code_id,
        user_id: membership.user_id
      });
      const encodedData = encodeURIComponent(qrData);
      setQrDataUrl(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodedData}`);
    }
  }, [isOpen, membership]);

  if (!isOpen) return null;

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
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6966ba172da6c09d1e1650bd/6b3832f4a_Butcherboyslogo.jpg"
                  alt="Central Newcastle RLFC"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Central Newcastle RLFC</h3>
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