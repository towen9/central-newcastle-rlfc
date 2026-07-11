import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Ticket, Calendar, MapPin, Percent, WifiOff } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { OfflineCache } from '../components/offline/OfflineCache';
import { useClub } from '@/contexts/ClubContext';
import GlassCard from '@/components/ui-kit/GlassCard';
import Eyebrow from '@/components/ui-kit/Eyebrow';
import GoldButton from '@/components/ui-kit/GoldButton';
import { SkeletonCard } from '@/components/ui-kit/Skeleton';

export default function GameDayPass() {
  const { club } = useClub();
  const t = club.theme;
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
      <div className="px-5 py-6 space-y-4" style={{ minHeight: '100dvh', paddingBottom: '6rem' }}>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const eventDate = new Date(event.date_time);
  const isValid = entry.status === 'valid' && isToday(eventDate);
  const isExpired = entry.status === 'expired' || isPast(eventDate);
  const isUsed = entry.status === 'used';

  return (
    <div className="min-h-full pb-8">
      {/* Header */}
      <div className="pt-safe px-6 py-6 text-center">
        <img 
          src={club.identity.logo_url}
          alt={club.identity.club_name}
          className="w-16 h-16 mx-auto mb-4 bg-white rounded-full p-2"
        />
        <Eyebrow color={t.gold}>Digital Pass</Eyebrow>
        <h1 className="text-white text-2xl" style={{ fontFamily: t.fontDisplay }}>Game Day Entry Pass</h1>
        <p className="text-white/50 text-sm" style={{ fontFamily: t.fontBody }}>{club.identity.club_name}</p>
        
        {/* Offline Indicator */}
        {isOffline && (
          <div className="mt-3 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-white text-xs" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.09)' }}>
            <WifiOff className="w-3 h-3" />
            Offline Mode - Pass cached locally
          </div>
        )}
      </div>

      <div className="px-5 space-y-5">
        {/* Digital Pass Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="overflow-hidden" style={isValid ? { borderColor: `${t.green}55`, boxShadow: `0 0 24px ${t.green}1a, 0 8px 32px rgba(0,0,0,0.3)` } : { borderColor: 'rgba(255,255,255,0.09)' }}>
            {/* Status Badge */}
            <div className="px-6 pt-6 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5" style={{ color: t.gold }} />
                <span className="text-white font-semibold text-sm" style={{ fontFamily: t.fontBody }}>Entry Pass</span>
              </div>
              <div className="px-3 py-1 rounded-full text-xs font-bold" style={isValid ? { background: `${t.green}22`, color: t.green } : isUsed ? { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' } : { background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                {isValid ? 'VALID TODAY' : isUsed ? 'USED' : 'EXPIRED'}
              </div>
            </div>

            {/* QR Code — solid white background, no glass */}
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
            <div className="px-6 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Attendee</p>
              <p className="font-semibold text-white" style={{ fontFamily: t.fontBody }}>{entry.first_name} {entry.last_name}</p>
            </div>
          </GlassCard>
        </motion.div>

        {/* Event Details */}
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5" style={{ color: t.gold }} />
            <h3 className="text-white font-bold text-sm" style={{ fontFamily: t.fontBody }}>Match Details</h3>
          </div>
          
          <div className="space-y-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>Event</p>
              <p className="font-semibold text-white text-sm" style={{ fontFamily: t.fontBody }}>{entry.event_title}</p>
            </div>
            
            <div>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>Date & Time</p>
              <p className="font-semibold text-white text-sm" style={{ fontFamily: t.fontBody }}>
                {format(eventDate, 'EEEE, MMMM d, yyyy')}
              </p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: t.fontBody }}>
                {format(eventDate, 'h:mm a')}
              </p>
            </div>

            {event.venue && (
              <div>
                <p className="text-[10px] uppercase tracking-wider flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  <MapPin className="w-3 h-3" />
                  Venue
                </p>
                <p className="font-medium text-white text-sm" style={{ fontFamily: t.fontBody }}>{event.venue}</p>
                {event.venue_address && (
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: t.fontBody }}>{event.venue_address}</p>
                )}
              </div>
            )}
          </div>
        </GlassCard>

        {/* Partner Offers */}
        {offers.length > 0 && (
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Percent className="w-5 h-5" style={{ color: t.gold }} />
              <h3 className="text-white font-bold text-sm" style={{ fontFamily: t.fontBody }}>Today's Offers</h3>
            </div>
            
            <div className="space-y-3">
              {offers.map((offer) => (
                <div key={offer.id} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <p className="font-semibold text-white text-sm mb-1" style={{ fontFamily: t.fontBody }}>{offer.title}</p>
                  <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: t.fontBody }}>{offer.sponsor_name}</p>
                  <p className="text-xs line-clamp-2" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: t.fontBody }}>{offer.description}</p>
                </div>
              ))}
            </div>

            <Button 
              onClick={() => window.location.href = createPageUrl('Benefits')}
              variant="outline" 
              className="w-full mt-4"
              style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'white', background: 'transparent' }}
            >
              View All Offers
            </Button>
          </GlassCard>
        )}

        {/* Upgrade CTA */}
        {isValid && (
          <GlassCard className="p-6 text-center" style={{ borderColor: `${t.gold}33` }}>
            <h3 className="font-bold text-white text-lg mb-2" style={{ fontFamily: t.fontBody }}>Become a Member</h3>
            <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: t.fontBody }}>
              Get exclusive rewards, offers, and support your club
            </p>
            <GoldButton onClick={() => window.location.href = createPageUrl('Membership')}>
              Join Now
            </GoldButton>
          </GlassCard>
        )}
      </div>
    </div>
  );
}