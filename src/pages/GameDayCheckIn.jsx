import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Ticket, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function GameDayCheckIn() {
  const [step, setStep] = useState('loading'); // loading, register, payment, success
  const [eventId, setEventId] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    mobile: '',
    postcode: '',
    opt_in_club: true,
    opt_in_partners: true,
    opt_in_push: true,
    accept_terms: false
  });
  const [entryId, setEntryId] = useState(null);

  // Get event ID from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('eventId');
    if (id) {
      setEventId(id);
      setStep('register');
    } else {
      setStep('error');
    }
  }, []);

  const { data: event } = useQuery({
    queryKey: ['fixture', eventId],
    queryFn: async () => {
      const fixtures = await base44.entities.Fixture.filter({ id: eventId });
      return fixtures[0] || null;
    },
    enabled: !!eventId
  });

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!formData.accept_terms) {
      toast.error('Please accept terms and conditions');
      return;
    }

    setStep('payment');

    // Create entry record
    const passCode = Math.random().toString(36).substring(2, 15).toUpperCase();
    
    const entry = await base44.entities.GameDayEntry.create({
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      mobile: formData.mobile,
      postcode: formData.postcode,
      event_id: eventId,
      event_title: event?.title || `${event?.opponent} - ${event?.team_grade}`,
      entry_timestamp: new Date().toISOString(),
      pass_qr_code: passCode,
      opt_in_club: formData.opt_in_club,
      opt_in_partners: formData.opt_in_partners,
      status: 'valid'
    });

    setEntryId(entry.id);
    
    // Simulate payment (in real app, integrate Stripe)
    setTimeout(() => {
      handlePaymentSuccess(entry.id, 'STRIPE_' + Math.random().toString(36).substring(7));
    }, 2000);
  };

  const handlePaymentSuccess = async (id, reference) => {
    await base44.entities.GameDayEntry.update(id, {
      payment_reference: reference,
      payment_amount: event?.entry_price || 0
    });
    
    setStep('success');
  };

  if (step === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (step === 'error' || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Entry Link</h2>
          <p className="text-gray-500">Please scan the QR code at the gate</p>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-500 to-teal-500 p-6 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl p-8 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-emerald-100 rounded-full mx-auto mb-6 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Entry Confirmed!</h2>
          <p className="text-gray-600 mb-6">
            Welcome to {event.opponent} vs Central Newcastle RLFC
          </p>

          <div className="bg-gray-50 rounded-2xl p-6 mb-6">
            <p className="text-sm text-gray-500 mb-2">Your Entry Pass</p>
            <div className="w-48 h-48 mx-auto bg-white rounded-xl p-4 mb-3">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${entryId}`}
                alt="Entry Pass QR"
                className="w-full h-full"
              />
            </div>
            <p className="text-xs text-gray-500">Show this at the gate</p>
          </div>

          <Button 
            onClick={() => window.location.href = createPageUrl('GameDayPass') + '?entryId=' + entryId}
            className="w-full bg-emerald-600 hover:bg-emerald-700 mb-3"
            size="lg"
          >
            View My Pass
          </Button>

          <p className="text-xs text-gray-500 mb-4">Make a day of it!</p>
          <div className="bg-blue-50 rounded-xl p-4 text-left">
            <p className="font-semibold text-gray-900 text-sm mb-1">Central Leagues Club</p>
            <p className="text-xs text-gray-600">Show your pass for dining specials today</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (step === 'payment') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Payment...</h3>
          <p className="text-sm text-gray-500">Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1a365d] to-[#2c5282] pt-safe pb-24">
        <div className="px-6 py-6 text-center">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6966ba172da6c09d1e1650bd/6b3832f4a_Butcherboyslogo.jpg"
            alt="Central Newcastle RLFC"
            className="w-20 h-20 mx-auto mb-4 bg-white rounded-full p-2"
          />
          <h1 className="text-white text-2xl font-bold mb-2">Game Day Entry</h1>
          <p className="text-blue-200 text-sm">{event.opponent} - {event.team_grade}</p>
          <p className="text-blue-200 text-xs mt-1">
            {new Date(event.date_time).toLocaleDateString('en-AU', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="px-6 -mt-16">
        <div className="bg-white rounded-3xl shadow-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Ticket className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Quick Registration</h2>
              <p className="text-sm text-gray-500">Entry: ${event.entry_price?.toFixed(2) || '0.00'}</p>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">First Name *</label>
                <Input 
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  placeholder="John"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Last Name *</label>
                <Input 
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  placeholder="Smith"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Email *</label>
              <Input 
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Mobile *</label>
              <Input 
                type="tel"
                required
                value={formData.mobile}
                onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                placeholder="0400 000 000"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Postcode *</label>
              <Input 
                required
                value={formData.postcode}
                onChange={(e) => setFormData({...formData, postcode: e.target.value})}
                placeholder="2290"
              />
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-3">
              <div className="flex items-start gap-3">
                <Checkbox 
                  checked={formData.accept_terms}
                  onCheckedChange={(checked) => setFormData({...formData, accept_terms: checked})}
                  id="terms"
                />
                <label htmlFor="terms" className="text-xs text-gray-600 leading-relaxed">
                  I accept the terms and conditions and privacy policy *
                </label>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox 
                  checked={formData.opt_in_club}
                  onCheckedChange={(checked) => setFormData({...formData, opt_in_club: checked})}
                  id="club"
                />
                <label htmlFor="club" className="text-xs text-gray-600 leading-relaxed">
                  Keep me updated with club news and offers
                </label>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox 
                  checked={formData.opt_in_partners}
                  onCheckedChange={(checked) => setFormData({...formData, opt_in_partners: checked})}
                  id="partners"
                />
                <label htmlFor="partners" className="text-xs text-gray-600 leading-relaxed">
                  Send me partner and sponsor offers
                </label>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox 
                  checked={formData.opt_in_push}
                  onCheckedChange={(checked) => setFormData({...formData, opt_in_push: checked})}
                  id="push"
                />
                <label htmlFor="push" className="text-xs text-gray-600 leading-relaxed">
                  Enable push notifications for game reminders and offers
                </label>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-[#1a365d] hover:bg-[#2c5282]"
              size="lg"
            >
              Pay ${event.entry_price?.toFixed(2) || '0.00'} & Enter
            </Button>

            <p className="text-xs text-gray-400 text-center">
              Secure payment powered by Stripe
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}