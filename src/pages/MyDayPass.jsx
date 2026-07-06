import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Ticket, Calendar, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import clubConfig from '@/config/club.config';
import GlassCard from '@/components/ui-kit/GlassCard';
import Eyebrow from '@/components/ui-kit/Eyebrow';
import GoldButton from '@/components/ui-kit/GoldButton';
import { SkeletonCard } from '@/components/ui-kit/Skeleton';

const t = clubConfig.theme;

export default function MyDayPass() {
  const [passId, setPassId] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('passId');
    if (id) setPassId(id);
  }, []);

  const { data: pass } = useQuery({
    queryKey: ['dayPass', passId],
    queryFn: async () => {
      if (!passId) return null;
      const passes = await base44.entities.GameDayEntry.filter({ id: passId });
      return passes[0] || null;
    },
    enabled: !!passId
  });

  const { data: fixture } = useQuery({
    queryKey: ['fixture', pass?.event_id],
    queryFn: async () => {
      const fixtures = await base44.entities.Fixture.filter({ id: pass.event_id });
      return fixtures[0] || null;
    },
    enabled: !!pass?.event_id
  });

  if (!pass || !fixture) {
    return (
      <div className="px-5 py-6 space-y-4" style={{ minHeight: '100dvh', paddingBottom: '6rem' }}>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const fixtureDate = new Date(fixture.date_time);

  // TODO: extract to shared util — compare dates in Sydney time, not UTC.
  // Using en-CA locale because it reliably returns YYYY-MM-DD, which string-compares correctly as dates.
  function getSydneyDateString(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Australia/Sydney',
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(date);
    const obj = {};
    for (const p of parts) obj[p.type] = p.value;
    return `${obj.year}-${obj.month}-${obj.day}`;
  }
  const todaySydney = getSydneyDateString();
  const fixtureSydney = getSydneyDateString(fixtureDate);
  const isValid = pass.status === 'valid' && todaySydney <= fixtureSydney;

  return (
    <div className="min-h-full pb-24">
      {/* Header */}
      <div className="pt-safe px-5 py-4 text-center">
        <img 
          src={clubConfig.identity.logo_url}
          alt={clubConfig.identity.club_name}
          className="w-16 h-16 mx-auto mb-3 bg-white rounded-full p-2"
        />
        <Eyebrow color={t.gold}>Digital Pass</Eyebrow>
        <h1 className="text-white text-2xl" style={{ fontFamily: t.fontDisplay }}>Day Pass</h1>
        <p className="text-white/50 text-sm" style={{ fontFamily: t.fontBody }}>{clubConfig.identity.club_name}</p>
      </div>

      <div className="px-5 space-y-5">
        {/* Digital Pass Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard className="overflow-hidden" style={isValid ? { borderColor: `${t.green}55`, boxShadow: `0 0 24px ${t.green}1a, 0 8px 32px rgba(0,0,0,0.3)` } : { borderColor: 'rgba(255,255,255,0.09)' }}>
            {/* Status Badge */}
            <div className="px-6 pt-6 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5" style={{ color: t.gold }} />
                <span className="text-white font-semibold text-sm" style={{ fontFamily: t.fontBody }}>Day Pass</span>
              </div>
              <div className="px-3 py-1 rounded-full text-xs font-bold" style={isValid ? { background: `${t.green}22`, color: t.green } : pass.status === 'used' ? { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' } : { background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                {isValid ? `VALID · ${fixture ? format(fixtureDate, 'd MMM') : 'UPCOMING'}` : pass.status === 'used' ? 'USED' : 'EXPIRED'}
              </div>
            </div>

            {/* Member Photo */}
            {pass.photo_url && (
              <div className="px-6 pb-4">
                <div className="bg-white rounded-2xl p-2">
                  <img 
                    src={pass.photo_url}
                    alt={pass.first_name}
                    className="w-full aspect-square object-cover rounded-xl"
                  />
                </div>
              </div>
            )}

            {/* QR Code — solid white background, no glass */}
            <div className="px-6 pb-6">
              <div className="bg-white rounded-2xl p-6 text-center">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${pass.pass_qr_code}`}
                  alt="Day Pass QR"
                  className="w-48 h-48 mx-auto mb-4"
                />
                <p className="font-mono text-lg font-bold text-gray-900 mb-1">
                  {pass.pass_qr_code}
                </p>
                <p className="text-xs text-gray-500">Show this code at the gate</p>
              </div>
            </div>

            {/* Pass Holder Info */}
            <div className="px-6 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Pass Holder</p>
              <p className="font-semibold text-white text-lg" style={{ fontFamily: t.fontBody }}>{pass.first_name} {pass.last_name}</p>
              <div className="flex items-center gap-2 mt-2">
                <Clock className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: t.fontBody }}>Purchased {format(new Date(pass.entry_timestamp), 'h:mm a')}</span>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Match Details */}
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5" style={{ color: t.gold }} />
            <h3 className="text-white font-bold text-sm" style={{ fontFamily: t.fontBody }}>Match Details</h3>
          </div>
          
          <div className="space-y-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>Match</p>
              <p className="font-semibold text-white text-sm" style={{ fontFamily: t.fontBody }}>{pass.event_title}</p>
            </div>
            
            <div>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>Date & Time</p>
              <p className="font-semibold text-white text-sm" style={{ fontFamily: t.fontBody }}>
                {format(fixtureDate, 'EEEE, MMMM d, yyyy')}
              </p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: t.fontBody }}>
                {format(fixtureDate, 'h:mm a')}
              </p>
            </div>

            {fixture.venue && (
              <div>
                <p className="text-[10px] uppercase tracking-wider flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  <MapPin className="w-3 h-3" />
                  Venue
                </p>
                <p className="font-medium text-white text-sm" style={{ fontFamily: t.fontBody }}>{fixture.venue}</p>
                {fixture.venue_address && (
                  <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: t.fontBody }}>{fixture.venue_address}</p>
                )}
              </div>
            )}
          </div>
        </GlassCard>

        {/* Expiry Notice */}
        {isValid && (
          <GlassCard className="p-4" style={{ borderColor: `${t.gold}44` }}>
            <p className="text-sm text-center" style={{ color: t.goldHi, fontFamily: t.fontBody }}>
              ⏰ Show this QR code at the gate on match day
            </p>
          </GlassCard>
        )}

        {/* Game Day Offers CTA */}
        {isValid && (
          <GlassCard className="p-6 text-center" style={{ borderColor: `${t.gold}33` }}>
            <h3 className="font-bold text-white text-lg mb-2" style={{ fontFamily: t.fontBody }}>Game Day Offers</h3>
            <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: t.fontBody }}>
              Check out exclusive deals available today
            </p>
            <GoldButton onClick={() => window.location.href = createPageUrl('Benefits')}>
              View Offers
            </GoldButton>
          </GlassCard>
        )}

        {/* Upgrade CTA */}
        <GlassCard className="p-6 text-center">
          <h3 className="font-bold text-white text-lg mb-2" style={{ fontFamily: t.fontBody }}>Become a Member</h3>
          <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: t.fontBody }}>
            Unlimited home game entry + exclusive rewards
          </p>
          <GoldButton onClick={() => window.location.href = createPageUrl('Membership')}>
            View Memberships
          </GoldButton>
        </GlassCard>
      </div>
    </div>
  );
}