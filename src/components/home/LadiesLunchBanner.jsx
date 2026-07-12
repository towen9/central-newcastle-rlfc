import React from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useClub } from '@/contexts/ClubContext';

export default function LadiesLunchBanner({ onDismiss }) {
  const { club } = useClub();

  // Central-only event promo — never render for another tenant.
  // When per-club event promos become a feature, this moves to club-scoped Event data.
  if (club?.slug !== 'central-newcastle') return null;

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-lg border-2 border-pink-400">
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a365d] to-[#0f2340]" />
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 z-10 w-7 h-7 bg-white/15 hover:bg-white/25 rounded-full flex items-center justify-center"
      >
        <X className="w-4 h-4 text-white/80" />
      </button>
      <div className="relative p-5">
        <span className="inline-block bg-pink-500 text-white text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3">
          Ladies Long Lunch
        </span>
        <p className="text-blue-200 text-sm mb-1">Saturday 1 August · Part of Old Butchers Day</p>
        <p className="text-white/60 text-xs mb-4">Fully catered · Free drinks · Limited tickets · A$90</p>
        <Link to="/EventTicket">
          <button className="w-full bg-pink-500 hover:bg-pink-400 text-white py-3.5 rounded-lg text-sm font-bold shadow-lg transition-colors">
            Buy Tickets →
          </button>
        </Link>
      </div>
    </div>
  );
}