import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Ticket, Calendar, MapPin, CheckCircle, User, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading pass...</p>
      </div>
    );
  }

  const fixtureDate = new Date(fixture.date_time);
  const isValid = pass.status === 'valid' && fixtureDate >= new Date(new Date().setHours(0,0,0,0));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1a365d] to-[#2c5282] pt-safe pb-8">
        <div className="px-6 py-6 text-center">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6966ba172da6c09d1e1650bd/6b3832f4a_Butcherboyslogo.jpg"
            alt="Central Newcastle RLFC"
            className="w-16 h-16 mx-auto mb-4 bg-white rounded-full p-2"
          />
          <h1 className="text-white text-2xl font-bold mb-1">Day Pass</h1>
          <p className="text-blue-200 text-sm">Central Newcastle RLFC</p>
        </div>
      </div>

      <div className="px-6 -mt-4">
        {/* Digital Pass Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-3xl overflow-hidden shadow-2xl mb-6 ${
            isValid ? 'bg-gradient-to-br from-emerald-500 to-teal-500' :
            pass.status === 'used' ? 'bg-gradient-to-br from-blue-500 to-blue-700' :
            'bg-gradient-to-br from-gray-500 to-gray-700'
          }`}
        >
          {/* Status Badge */}
          <div className="px-6 pt-6 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Ticket className="w-5 h-5" />
              <span className="font-semibold">Day Pass</span>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              isValid ? 'bg-white/20 text-white' :
              pass.status === 'used' ? 'bg-blue-900/30 text-blue-200' :
              'bg-red-500/30 text-red-200'
            }`}>
              {isValid ? 'VALID TODAY ONLY' : pass.status === 'used' ? 'USED' : 'EXPIRED'}
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

          {/* QR Code */}
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
          <div className="bg-white/10 backdrop-blur px-6 py-4 text-white">
            <p className="text-sm opacity-70 mb-1">Pass Holder</p>
            <p className="font-semibold text-lg">{pass.first_name} {pass.last_name}</p>
            <div className="flex items-center gap-2 mt-2 text-sm opacity-90">
              <Clock className="w-4 h-4" />
              <span>Purchased {format(new Date(pass.entry_timestamp), 'h:mm a')}</span>
            </div>
          </div>
        </motion.div>

        {/* Match Details */}
        <div className="bg-white rounded-2xl p-5 mb-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            Match Details
          </h3>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Match</p>
              <p className="font-semibold text-gray-900">{pass.event_title}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Date & Time</p>
              <p className="font-semibold text-gray-900">
                {format(fixtureDate, 'EEEE, MMMM d, yyyy')}
              </p>
              <p className="text-sm text-gray-600">
                {format(fixtureDate, 'h:mm a')}
              </p>
            </div>

            {fixture.venue && (
              <div>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Venue
                </p>
                <p className="font-medium text-gray-900">{fixture.venue}</p>
                {fixture.venue_address && (
                  <p className="text-sm text-gray-600">{fixture.venue_address}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Expiry Notice */}
        {isValid && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
            <p className="text-sm text-amber-800 text-center">
              ⏰ This pass expires at midnight tonight
            </p>
          </div>
        )}

        {/* Game Day Offers CTA */}
        {isValid && (
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white text-center mb-6">
            <h3 className="font-bold text-xl mb-2">Game Day Offers</h3>
            <p className="text-white/90 text-sm mb-4">
              Check out exclusive deals available today
            </p>
            <Button 
              onClick={() => window.location.href = createPageUrl('Benefits')}
              className="bg-white text-emerald-600 hover:bg-gray-100"
            >
              View Offers
            </Button>
          </div>
        )}

        {/* Upgrade CTA */}
        <div className="bg-gradient-to-r from-[#1a365d] to-[#2c5282] rounded-2xl p-6 text-white text-center">
          <h3 className="font-bold text-xl mb-2">Become a Member</h3>
          <p className="text-blue-200 text-sm mb-4">
            Unlimited home game entry + exclusive rewards
          </p>
          <Button 
            onClick={() => window.location.href = createPageUrl('Membership')}
            className="bg-white text-[#1a365d] hover:bg-gray-100"
          >
            View Memberships
          </Button>
        </div>
      </div>
    </div>
  );
}