import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Ticket, Calendar, MapPin, CheckCircle, XCircle, Clock, Percent, WifiOff } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { OfflineCache } from '../components/offline/OfflineCache';
import clubConfig from '@/config/club.config';

export default function GameDayPass() {
  const [entryId, setEntryId] = useState(null);
  const [cachedQR, setCachedQR] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('entryId');
    if (id) setEntryId(id);

    // Monitor online/offline status
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup expired passes
    OfflineCache.clearExpiredPasses();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const { data: entry } = useQuery({
    queryKey: ['gameEntry', entryId],
    queryFn: async () => {
      if (!entryId) return null;
      
      // Try cache first if offline
      if (!navigator.onLine) {
        const cached = OfflineCache.getCachedGameDayPass(entryId);
        if (cached) return cached.entry;
      }
      
      const entries = await base44.entities.GameDayEntry.filter({ id: entryId });
      return entries[0] || null;
    },
    enabled: !!entryId,
    initialData: () => {
      if (entryId) {
        const cached = OfflineCache.getCachedGameDayPass(entryId);
        return cached?.entry || undefined;
      }
    }
  });

  const { data: event } = useQuery({
    queryKey: ['fixture', entry?.event_id],
    queryFn: async () => {
      // Try cache first if offline
      if (!navigator.onLine && entryId) {
        const cached = OfflineCache.getCachedGameDayPass(entryId);
        if (cached) return cached.event;
      }
      
      const fixtures = await base44.entities.Fixture.filter({ id: entry.event_id });
      return fixtures[0] || null;
    },
    enabled: !!entry?.event_id,
    initialData: () => {
      if (entryId) {
        const cached = OfflineCache.getCachedGameDayPass(entryId);
        return cached?.event || undefined;
      }
    }
  });

  // Cache data when loaded
  useEffect(() => {
    if (entry && event && entryId) {
      OfflineCache.cacheGameDayPass(entryId, entry, event);
    }
  }, [entry, event, entryId]);

  // Load cached QR
  useEffect(() => {
    if (entryId) {
      const qr = OfflineCache.getCachedQR(entryId);
      if (qr) setCachedQR(qr);
    }
  }, [entryId]);

  const { data: offers = [] } = useQuery({
    queryKey: ['casualOffers'],
    queryFn: () => base44.entities.Offer.filter({ is_active: true }, '-is_featured', 3)
  });

  if (!entry || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading pass...</p>
      </div>
    );
  }

  const eventDate = new Date(event.date_time);
  const isValid = entry.status === 'valid' && isToday(eventDate);
  const isExpired = entry.status === 'expired' || isPast(eventDate);
  const isUsed = entry.status === 'used';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1a365d] to-[#2c5282] pt-safe pb-8">
        <div className="px-6 py-6 text-center">
          <img 
            src={clubConfig.identity.logo_url}
            alt={clubConfig.identity.club_name}
            className="w-16 h-16 mx-auto mb-4 bg-white rounded-full p-2"
          />
          <h1 className="text-white text-2xl font-bold mb-1">Game Day Entry Pass</h1>
          <p className="text-blue-200 text-sm">{clubConfig.identity.club_name}</p>
          
          {/* Offline Indicator */}
          {isOffline && (
            <div className="mt-3 flex items-center justify-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-2 text-white text-xs">
              <WifiOff className="w-3 h-3" />
              Offline Mode - Pass cached locally
            </div>
          )}
        </div>
      </div>

      <div className="px-6 -mt-4">
        {/* Digital Pass Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-3xl overflow-hidden shadow-2xl mb-6 ${
            isValid ? 'bg-gradient-to-br from-emerald-500 to-teal-500' :
            isUsed ? 'bg-gradient-to-br from-blue-500 to-blue-700' :
            'bg-gradient-to-br from-gray-500 to-gray-700'
          }`}
        >
          {/* Status Badge */}
          <div className="px-6 pt-6 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Ticket className="w-5 h-5" />
              <span className="font-semibold">Entry Pass</span>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              isValid ? 'bg-white/20 text-white' :
              isUsed ? 'bg-blue-900/30 text-blue-200' :
              'bg-red-500/30 text-red-200'
            }`}>
              {isValid ? 'VALID TODAY' : isUsed ? 'USED' : 'EXPIRED'}
            </div>
          </div>

          {/* QR Code */}
          <div className="px-6 pb-6">
            <div className="bg-white rounded-2xl p-6 text-center">
              <img 
                src={cachedQR || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${entry.pass_qr_code}`}
                alt="Entry Pass QR"
                className="w-48 h-48 mx-auto mb-4"
              />
              <p className="font-mono text-lg font-bold text-gray-900 mb-1">
                {entry.pass_qr_code}
              </p>
              <p className="text-xs text-gray-500">Show this code at the gate</p>
            </div>
          </div>

          {/* Attendee Info */}
          <div className="bg-white/10 backdrop-blur px-6 py-4 text-white">
            <p className="text-sm opacity-70 mb-1">Attendee</p>
            <p className="font-semibold">{entry.first_name} {entry.last_name}</p>
          </div>
        </motion.div>

        {/* Event Details */}
        <div className="bg-white rounded-2xl p-5 mb-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            Match Details
          </h3>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Event</p>
              <p className="font-semibold text-gray-900">{entry.event_title}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Date & Time</p>
              <p className="font-semibold text-gray-900">
                {format(eventDate, 'EEEE, MMMM d, yyyy')}
              </p>
              <p className="text-sm text-gray-600">
                {format(eventDate, 'h:mm a')}
              </p>
            </div>

            {event.venue && (
              <div>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Venue
                </p>
                <p className="font-medium text-gray-900">{event.venue}</p>
                {event.venue_address && (
                  <p className="text-sm text-gray-600">{event.venue_address}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Partner Offers */}
        {offers.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Percent className="w-5 h-5 text-emerald-600" />
              Today's Offers
            </h3>
            
            <div className="space-y-3">
              {offers.map((offer) => (
                <div key={offer.id} className="bg-emerald-50 rounded-xl p-4">
                  <p className="font-semibold text-gray-900 text-sm mb-1">{offer.title}</p>
                  <p className="text-xs text-gray-600 mb-2">{offer.sponsor_name}</p>
                  <p className="text-xs text-gray-500 line-clamp-2">{offer.description}</p>
                </div>
              ))}
            </div>

            <Button 
              onClick={() => window.location.href = createPageUrl('Benefits')}
              variant="outline" 
              className="w-full mt-4"
            >
              View All Offers
            </Button>
          </div>
        )}

        {/* Upgrade CTA */}
        {isValid && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 text-white mt-6 text-center">
            <h3 className="font-bold text-xl mb-2">Become a Member</h3>
            <p className="text-white/90 text-sm mb-4">
              Get exclusive rewards, offers, and support your club
            </p>
            <Button 
              onClick={() => window.location.href = createPageUrl('Membership')}
              className="bg-white text-orange-600 hover:bg-gray-100"
            >
              Join Now
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}