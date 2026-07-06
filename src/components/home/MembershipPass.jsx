import React from 'react';
import { motion } from 'framer-motion';
import { QrCode, Star, Users, Shield } from 'lucide-react';
import { format } from 'date-fns';
import clubConfig from '@/config/club.config';

function TierBadge({ tierName, tierType }) {
  const isPremium = tierType ? tierType === 'premium' : tierName?.includes('Premium');
  const isFamily = tierType ? tierType === 'family' : tierName?.includes('Family');
  const isLegacy = tierType ? tierType === 'legacy' : tierName?.includes('Old Butchers');
  if (isPremium) {
    return (
      <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-400/20 rounded-full">
        <Star className="w-3 h-3 text-amber-300" fill="currentColor" />
        <span className="text-amber-300 text-xs font-semibold">PREMIUM</span>
      </div>
    );
  }
  if (isFamily) {
    return (
      <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-400/20 rounded-full">
        <Users className="w-3 h-3 text-purple-300" />
        <span className="text-purple-300 text-xs font-semibold">FAMILY</span>
      </div>
    );
  }
  if (isLegacy) {
    return (
      <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-400/20 rounded-full">
        <Star className="w-3 h-3 text-amber-300" fill="currentColor" />
        <span className="text-amber-300 text-xs font-semibold">OLD BUTCHERS</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-400/20 rounded-full">
      <Shield className="w-3 h-3 text-blue-300" />
      <span className="text-blue-300 text-xs font-semibold">SUPPORTER</span>
    </div>
  );
}

function getTierGradient(tierName, tierType) {
  const isPremium = tierType ? tierType === 'premium' : tierName?.includes('Premium');
  const isFamily = tierType ? tierType === 'family' : tierName?.includes('Family');
  const isLegacy = tierType ? tierType === 'legacy' : tierName?.includes('Old Butchers');
  if (isPremium) {
    return 'bg-gradient-to-br from-[#78350f] via-[#92400e] to-[#b45309]';
  }
  if (isFamily) {
    return 'bg-gradient-to-br from-[#4c1d95] via-[#5b21b6] to-[#7c3aed]';
  }
  if (isLegacy) {
    return 'bg-gradient-to-br from-[#451a03] via-[#78350f] to-[#b45309]';
  }
  return 'bg-gradient-to-br from-[#1a365d] via-[#2c5282] to-[#2b6cb0]';
}

export default function MembershipPass({ membership, user, onShowQR }) {
  const isActive = membership?.status === 'active';
  const expiryDate = membership?.expiry_date ? new Date(membership.expiry_date) : null;
  const tierName = membership?.tier_name || '';
  const tierType = membership?.tier_type;
  const isPremium = tierType ? tierType === 'premium' : tierName.includes('Premium');
  const isSupporter = tierType ? tierType === 'supporter' : tierName.includes('Supporter Pack');
  const gamesRemaining = membership?.games_remaining ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden"
    >
      {/* Premium shimmer effect */}
      {isPremium && isActive && (
        <motion.div
          animate={{ x: ['−100%', '200%'] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'linear', repeatDelay: 2 }}
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(105deg, transparent 40%, rgba(255,215,0,0.15) 50%, transparent 60%)',
          }}
        />
      )}

      <div className={`relative rounded-2xl p-4 ${
        isActive ? getTierGradient(tierName, tierType) : 'bg-gradient-to-br from-gray-600 to-gray-800'
      } shadow-xl`}>

        {/* Club Logo & Tier */}
        <div className="relative flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-0.5">
              <img
                loading="lazy"
                src={clubConfig.identity.logo_url}
                alt={clubConfig.identity.club_name}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm tracking-wide">{clubConfig.identity.club_short_name.toUpperCase()}</h3>
              <p className="text-white/70 text-xs">{tierName || 'No Membership'}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {isActive ? (
              <TierBadge tierName={tierName} tierType={tierType} />
            ) : (
              <div className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.85)' }}>
                Not a member yet
              </div>
            )}
            <div className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              isActive ? 'bg-emerald-400/20 text-emerald-300' : 'bg-gray-400/20 text-gray-300'
            }`}>
              {isActive ? 'ACTIVE' : 'INACTIVE'}
            </div>
          </div>
        </div>

        {/* Member Info */}
        <div className="relative mb-3">
          <p className="text-white text-lg font-semibold">{user?.full_name || 'Member'}</p>
          <p className="text-white/60 text-xs">
            Valid until: {expiryDate ? format(expiryDate, 'MMM yyyy') : 'N/A'}
          </p>
        </div>

        {/* Supporter Pack: Games Remaining Counter */}
        {isSupporter && isActive && gamesRemaining !== null && (
          <div className="relative mb-3 bg-white/10 rounded-xl px-4 py-2 flex items-center justify-between">
            <span className="text-white/80 text-sm">Games Remaining</span>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full border-2 ${
                    i < gamesRemaining
                      ? 'bg-white border-white'
                      : 'bg-transparent border-white/30'
                  }`}
                />
              ))}
              <span className="text-white font-bold text-sm ml-2">{gamesRemaining}/5</span>
            </div>
          </div>
        )}

        {/* QR Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onShowQR}
          disabled={!isActive}
          className={`relative w-full py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
            isActive
              ? isPremium
                ? 'bg-amber-400 text-amber-900 hover:bg-amber-300'
                : 'bg-white text-[#1a365d] hover:bg-white/95'
              : 'bg-white/20 text-white/50 cursor-not-allowed'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Show Pass</span>
        </motion.button>

        {/* Sponsor */}
        <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-white/10">
          <span className="text-white/40 text-[9px] uppercase tracking-widest">Brought to you by</span>
          <div className="bg-white rounded px-1.5 py-0.5">
            <img loading="lazy" src="https://media.base44.com/images/public/6966ba172da6c09d1e1650bd/1e9b65742_ZoomEnergy.png" alt="Zoom Energy" className="h-3 w-auto object-contain" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}