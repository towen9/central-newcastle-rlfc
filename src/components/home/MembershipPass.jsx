import React from 'react';
import { motion } from 'framer-motion';
import { QrCode, Calendar, Shield, User } from 'lucide-react';
import { format } from 'date-fns';

export default function MembershipPass({ membership, user, onShowQR }) {
  const isActive = membership?.status === 'active';
  const expiryDate = membership?.expiry_date ? new Date(membership.expiry_date) : null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden"
    >
      {/* Main Card - Compact */}
      <div className={`relative rounded-2xl p-4 ${
        isActive 
          ? 'bg-gradient-to-br from-[#1a365d] via-[#2c5282] to-[#2b6cb0]' 
          : 'bg-gradient-to-br from-gray-600 to-gray-800'
      } shadow-xl`}>
        
        {/* Club Logo/Name & Status */}
        <div className="relative flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-0.5">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6966ba172da6c09d1e1650bd/6b3832f4a_Butcherboyslogo.jpg"
                alt="Central Newcastle RLFC"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm tracking-wide">CENTRAL NEWCASTLE</h3>
              <p className="text-white/70 text-xs">{membership?.tier_name || 'N/A'}</p>
            </div>
          </div>
          <div className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
            isActive ? 'bg-emerald-400/20 text-emerald-300' : 'bg-red-400/20 text-red-300'
          }`}>
            {isActive ? 'ACTIVE' : membership?.status?.toUpperCase() || 'NO MEMBERSHIP'}
          </div>
        </div>

        {/* Member Info - Compact */}
        <div className="relative mb-3">
          <p className="text-white text-lg font-semibold">{user?.full_name || 'Member'}</p>
          <p className="text-white/60 text-xs">
            Valid until: {expiryDate ? format(expiryDate, 'MMM yyyy') : 'N/A'}
          </p>
        </div>

        {/* QR Button - Compact */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onShowQR}
          disabled={!isActive}
          className={`relative w-full py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
            isActive 
              ? 'bg-white text-[#1a365d] hover:bg-white/95' 
              : 'bg-white/20 text-white/50 cursor-not-allowed'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Show Pass</span>
        </motion.button>
      </div>
    </motion.div>
  );
}