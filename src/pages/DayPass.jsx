import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Ticket, Calendar, MapPin, Check, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function DayPass() {
  const [user, setUser] = useState(null);
  const [selectedFixture, setSelectedFixture] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
    };
    loadUser();
  }, []);

  // Get upcoming home fixtures with entry enabled
  const { data: upcomingFixtures = [] } = useQuery({
    queryKey: ['upcomingFixtures'],
    queryFn: async () => {
      const now = new Date();

      const fixtures = await base44.entities.Fixture.filter({
        fixture_type: 'home'
      }, 'date_time');

      return fixtures.filter(f => {
        const fixtureDate = new Date(f.date_time);
        return fixtureDate > now && f.status !== 'cancelled' && f.status !== 'postponed';
      });
    }
  });

  // Check if user already has a pass for today
  const { data: existingPass } = useQuery({
    queryKey: ['myDayPass', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const passes = await base44.entities.GameDayEntry.filter({
        user_id: user.id
      }, '-entry_timestamp');

      return passes.find(p => {
        const passDate = new Date(p.entry_timestamp);
        passDate.setHours(0, 0, 0, 0);
        return passDate.getTime() === today.getTime() && p.status === 'valid';
      });
    },
    enabled: !!user?.id
  });

  const handlePurchase = async (fixture) => {
    setSelectedFixture(fixture);
    setProcessing(true);

    try {
      if (window.self !== window.top) {
        toast.error('Please open this page in a new tab to complete checkout');
        setProcessing(false);
        return;
      }

      const { data } = await base44.functions.invoke('createDayPassCheckout', {
        fixture_id: fixture.id,
        success_url: `${window.location.origin}${createPageUrl('DayPass')}?payment=success&fixture=${fixture.id}`,
        cancel_url: `${window.location.origin}${createPageUrl('DayPass')}?payment=cancelled`
      });

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (error) {
      toast.error('Failed to start checkout');
      setProcessing(false);
    }
  };

  // Handle payment success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      setPaymentSuccess(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-[#1a365d] pt-safe">
          <div className="px-5 py-6">
            <h1 className="text-white text-2xl font-bold">Payment Successful!</h1>
            <p className="text-blue-200">Your Day Pass is being set up</p>
          </div>
        </div>
        <div className="px-5 py-10 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
            <Check className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">You're in! 🎉</h2>
          <p className="text-gray-600 mb-2">Your Day Pass payment was successful.</p>
          <p className="text-gray-500 text-sm mb-8">Your digital QR pass will appear below within a few seconds — refresh if it doesn't show straight away.</p>
          <Button
            onClick={() => { setPaymentSuccess(false); window.location.reload(); }}
            className="w-full bg-[#1a365d] hover:bg-[#2c5282] py-6 text-base"
          >
            View My Pass
          </Button>
          <p className="text-xs text-gray-400 mt-4">Show your QR code at the gate on game day</p>
        </div>
      </div>
    );
  }

  if (existingPass) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-[#1a365d] pt-safe">
          <div className="px-5 py-6">
            <h1 className="text-white text-2xl font-bold mb-2">My Day Pass</h1>
            <p className="text-blue-200">You already have a valid pass for today</p>
          </div>
        </div>

        <div className="px-5 py-6">
          <Button 
            onClick={() => window.location.href = createPageUrl('MyDayPass') + `?passId=${existingPass.id}`}
            className="w-full bg-emerald-600 hover:bg-emerald-700 py-6"
          >
            View My Pass
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-[#1a365d] pt-safe">
        <div className="px-5 py-6">
          <Link to={createPageUrl('Home')}>
            <button className="flex items-center gap-2 text-blue-200 mb-4">
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
          </Link>
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6966ba172da6c09d1e1650bd/6b3832f4a_Butcherboyslogo.jpg"
            alt="Central Newcastle RLFC"
            className="w-16 h-16 mb-4 bg-white rounded-full p-2"
          />
          <h1 className="text-white text-2xl font-bold mb-2">Day Pass – $8</h1>
          <p className="text-blue-200">Single entry to upcoming home games</p>
        </div>
      </div>

      <div className="px-5 py-6">
        {/* Features */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">What's Included</h3>
          <div className="space-y-3">
            {[
              'Digital QR pass with your photo',
              'Entry to the selected home game',
              'Special game-day offers & promotions',
              'Exclusive deals from our partners',
              'Valid on game day only'
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-sm text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Games */}
        {upcomingFixtures.length > 0 ? (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-900">Select Your Game</h3>
            {upcomingFixtures.map((fixture) => (
              <motion.div
                key={fixture.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-[#1a365d] rounded-xl flex items-center justify-center flex-shrink-0">
                      <Ticket className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-lg mb-1">
                        {fixture.opponent}
                      </h4>
                      <p className="text-sm text-gray-600">{fixture.team_grade}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(fixture.date_time), 'EEE, MMM d • h:mm a')}
                    </div>
                    {fixture.venue && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {fixture.venue}
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => handlePurchase(fixture)}
                    disabled={processing}
                    className="w-full bg-[#1a365d] hover:bg-[#2c5282] py-6"
                  >
                    {processing && selectedFixture?.id === fixture.id ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Buy Day Pass - $8`
                    )}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
            <Calendar className="w-12 h-12 text-amber-600 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 mb-2">No Upcoming Games</h3>
            <p className="text-sm text-gray-600">
              Check back later for upcoming fixtures
            </p>
          </div>
        )}

        {/* Info */}
        <div className="mt-6 bg-blue-50 rounded-xl p-4">
          <p className="text-sm text-blue-800 mb-2">
            Purchase your Day Pass, take a quick photo, and scan your digital QR at the gate.
          </p>
          <p className="text-sm text-blue-800">
            You'll also receive special game-day offers, promotions, and exclusive deals from our partners.
          </p>
        </div>

        {/* Upgrade CTA */}
        <div className="mt-6 bg-gradient-to-r from-[#1a365d] to-[#2c5282] rounded-2xl p-6 text-white text-center">
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