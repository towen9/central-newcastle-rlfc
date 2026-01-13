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
      {/* Main Card */}
      <div className={`relative rounded-3xl p-6 ${
        isActive 
          ? 'bg-gradient-to-br from-[#1a365d] via-[#2c5282] to-[#2b6cb0]' 
          : 'bg-gradient-to-br from-gray-600 to-gray-800'
      } shadow-2xl`}>
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>
        
        {/* Club Logo/Name */}
        <div className="relative flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg tracking-wide">CHARLESTOWN</h3>
              <p className="text-white/70 text-xs tracking-widest">RUGBY LEAGUE CLUB</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
            isActive ? 'bg-emerald-400/20 text-emerald-300' : 'bg-red-400/20 text-red-300'
          }`}>
            {isActive ? 'ACTIVE' : membership?.status?.toUpperCase() || 'NO MEMBERSHIP'}
          </div>
        </div>

        {/* Member Info */}
        <div className="relative space-y-4 mb-6">
          <div>
            <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Member Name</p>
            <p className="text-white text-xl font-semibold">{user?.full_name || 'Member'}</p>
          </div>
          
          <div className="flex gap-6">
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Membership</p>
              <p className="text-white font-medium">{membership?.tier_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Valid Until</p>
              <p className="text-white font-medium">
                {expiryDate ? format(expiryDate, 'MMM yyyy') : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* QR Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onShowQR}
          disabled={!isActive}
          className={`relative w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-semibold transition-all ${
            isActive 
              ? 'bg-white text-[#1a365d] hover:bg-white/95' 
              : 'bg-white/20 text-white/50 cursor-not-allowed'
          }`}
        >
          <QrCode className="w-5 h-5" />
          <span>Show Membership Pass</span>
        </motion.button>

        {/* Member ID */}
        <p className="text-center text-white/40 text-xs mt-4 font-mono tracking-wider">
          ID: {membership?.qr_code_id?.slice(0, 12)?.toUpperCase() || '---'}
        </p>
      </div>
    </motion.div>
  );
}