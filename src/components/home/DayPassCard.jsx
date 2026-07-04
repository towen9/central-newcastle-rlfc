import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Ticket, QrCode, Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { createPageUrl } from '@/utils';
import clubConfig from '@/config/club.config';

export default function DayPassCard({ pass, fixture, user }) {
  const fixtureDate = fixture ? new Date(fixture.date_time) : null;
  const isUsed = pass.status === 'used';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden"
    >
      <div className={`relative rounded-2xl p-4 shadow-xl ${
        isUsed
          ? 'bg-gradient-to-br from-gray-500 to-gray-700'
          : 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700'
      }`}>

        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-0.5">
              <img
                src={clubConfig.identity.logo_url}
                alt={clubConfig.identity.club_name}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm tracking-wide">{clubConfig.identity.club_short_name.toUpperCase()}</h3>
              <p className="text-white/70 text-xs">Day Pass</p>
            </div>
          </div>
          <div className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            isUsed ? 'bg-gray-400/20 text-gray-300' : 'bg-white/20 text-white'
          }`}>
            {isUsed ? 'USED' : 'VALID'}
          </div>
        </div>

        {/* Member Name */}
        <div className="mb-3">
          <p className="text-white text-lg font-semibold">{user?.full_name || `${pass.first_name} ${pass.last_name}`}</p>
        </div>

        {/* Fixture Info */}
        {fixture && (
          <div className="bg-white/10 rounded-xl px-3 py-2 mb-3 space-y-1">
            <div className="flex items-center gap-2 text-white/90 text-sm">
              <Ticket className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="font-semibold truncate">vs {fixture.opponent}</span>
            </div>
            {fixtureDate && (
              <div className="flex items-center gap-2 text-white/70 text-xs">
                <Calendar className="w-3 h-3 flex-shrink-0" />
                <span>{format(fixtureDate, 'EEE d MMM • h:mm a')}</span>
              </div>
            )}
            {fixture.venue && (
              <div className="flex items-center gap-2 text-white/70 text-xs">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span>{fixture.venue}</span>
              </div>
            )}
          </div>
        )}

        {/* Show Pass Button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => window.location.href = createPageUrl('MyDayPass') + `?passId=${pass.id}`}
          disabled={isUsed}
          className={`w-full py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all ${
            isUsed
              ? 'bg-white/20 text-white/50 cursor-not-allowed'
              : 'bg-white text-emerald-700 hover:bg-white/95'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Show Day Pass QR</span>
        </motion.button>

        {/* Sponsor */}
        <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-white/10">
          <span className="text-white/40 text-[9px] uppercase tracking-widest">Brought to you by</span>
          <div className="bg-white rounded px-1.5 py-0.5">
            <img src="https://media.base44.com/images/public/6966ba172da6c09d1e1650bd/1e9b65742_ZoomEnergy.png" alt="Zoom Energy" className="h-3 w-auto object-contain" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}