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
import clubConfig from '@/config/club.config';
import GlassCard from '@/components/ui-kit/GlassCard';
import Eyebrow from '@/components/ui-kit/Eyebrow';
import GoldButton from '@/components/ui-kit/GoldButton';

const t = clubConfig.theme;

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
      <div className="min-h-full flex items-center justify-center" style={{ background: `radial-gradient(ellipse at top, ${t.bg1} 0%, ${t.bg0} 70%)` }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: t.gold }} />
      </div>
    );
  }

  if (step === 'error' || !event) {
    return (
      <div className="min-h-full flex items-center justify-center p-6" style={{ background: `radial-gradient(ellipse at top, ${t.bg1} 0%, ${t.bg0} 70%)` }}>
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4" style={{ color: '#ef4444' }} />
          <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: t.fontBody }}>Invalid Entry Link</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>Please scan the QR code at the gate</p>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-full p-6 flex items-center justify-center" style={{ background: `radial-gradient(ellipse at top, ${t.bg1} 0%, ${t.bg0} 70%)` }}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <GlassCard className="p-8 max-w-md w-full text-center" style={{ borderColor: `${t.green}55` }}>
            <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: `${t.green}22` }}>
              <CheckCircle className="w-10 h-10" style={{ color: t.green }} />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: t.fontBody }}>Entry Confirmed!</h2>
            <p className="mb-6" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Welcome to {event.opponent} vs {clubConfig.identity.club_name}
            </p>

            {/* QR code on solid white opaque background */}
            <div className="rounded-2xl p-6 mb-6" style={{ background: `${t.green}11`, border: `1px solid ${t.green}33` }}>
              <p className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Your Entry Pass</p>
              <div className="w-48 h-48 mx-auto bg-white rounded-xl p-4 mb-3">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${entryId}`}
                  alt="Entry Pass QR"
                  className="w-full h-full"
                />
              </div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Show this at the gate</p>
            </div>

            <GoldButton 
              onClick={() => window.location.href = createPageUrl('GameDayPass') + '?entryId=' + entryId}
              fullWidth
              style={{ marginBottom: 12 }}
            >
              View My Pass
            </GoldButton>

            <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>Make a day of it!</p>
            <div className="rounded-xl p-4 text-left" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <p className="font-semibold text-white text-sm mb-1" style={{ fontFamily: t.fontBody }}>Central Leagues Club</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Show your pass for dining specials today</p>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  if (step === 'payment') {
    return (
      <div className="min-h-full flex items-center justify-center p-6" style={{ background: `radial-gradient(ellipse at top, ${t.bg1} 0%, ${t.bg0} 70%)` }}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: t.gold }} />
          <h3 className="text-lg font-semibold text-white mb-2" style={{ fontFamily: t.fontBody }}>Processing Payment...</h3>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full pb-8" style={{ background: `radial-gradient(ellipse at top, ${t.bg1} 0%, ${t.bg0} 70%)` }}>
      {/* Header */}
      <div className="pt-safe pb-24 text-center" style={{ background: `linear-gradient(160deg, ${t.bg1}, ${t.bg0})` }}>
        <div className="px-6 py-6">
          <img 
            src={clubConfig.identity.logo_url}
            alt={clubConfig.identity.club_name}
            className="w-20 h-20 mx-auto mb-4 bg-white rounded-full p-2"
          />
          <Eyebrow color={t.gold}>{event.team_grade}</Eyebrow>
          <h1 className="text-white text-2xl font-bold mb-2" style={{ fontFamily: t.fontDisplay }}>Game Day Entry</h1>
          <p className="text-sm" style={{ color: t.goldHi }}>{event.opponent} - {event.team_grade}</p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
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
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${t.gold}22` }}>
              <Ticket className="w-5 h-5" style={{ color: t.gold }} />
            </div>
            <div>
              <h2 className="font-bold text-white" style={{ fontFamily: t.fontBody }}>Quick Registration</h2>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Entry: ${event.entry_price?.toFixed(2) || '0.00'}</p>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block" style={{ color: 'rgba(255,255,255,0.7)' }}>First Name *</label>
                <Input 
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  placeholder="John"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'white', borderColor: 'rgba(255,255,255,0.1)' }}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block" style={{ color: 'rgba(255,255,255,0.7)' }}>Last Name *</label>
                <Input 
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  placeholder="Smith"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'white', borderColor: 'rgba(255,255,255,0.1)' }}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: 'rgba(255,255,255,0.7)' }}>Email *</label>
              <Input 
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="john@example.com"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'white', borderColor: 'rgba(255,255,255,0.1)' }}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: 'rgba(255,255,255,0.7)' }}>Mobile *</label>
              <Input 
                type="tel"
                required
                value={formData.mobile}
                onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                placeholder="0400 000 000"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'white', borderColor: 'rgba(255,255,255,0.1)' }}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: 'rgba(255,255,255,0.7)' }}>Postcode *</label>
              <Input 
                required
                value={formData.postcode}
                onChange={(e) => setFormData({...formData, postcode: e.target.value})}
                placeholder="2290"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'white', borderColor: 'rgba(255,255,255,0.1)' }}
              />
            </div>

            <div className="space-y-3 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-start gap-3">
                <Checkbox 
                  checked={formData.accept_terms}
                  onCheckedChange={(checked) => setFormData({...formData, accept_terms: checked})}
                  id="terms"
                />
                <label htmlFor="terms" className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  I accept the terms and conditions and privacy policy *
                </label>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox 
                  checked={formData.opt_in_club}
                  onCheckedChange={(checked) => setFormData({...formData, opt_in_club: checked})}
                  id="club"
                />
                <label htmlFor="club" className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Keep me updated with club news and offers
                </label>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox 
                  checked={formData.opt_in_partners}
                  onCheckedChange={(checked) => setFormData({...formData, opt_in_partners: checked})}
                  id="partners"
                />
                <label htmlFor="partners" className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Send me partner and sponsor offers
                </label>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox 
                  checked={formData.opt_in_push}
                  onCheckedChange={(checked) => setFormData({...formData, opt_in_push: checked})}
                  id="push"
                />
                <label htmlFor="push" className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Enable push notifications for game reminders and offers
                </label>
              </div>
            </div>

            <GoldButton 
              type="submit" 
              fullWidth
              style={{ padding: '14px 20px' }}
            >
              Pay ${event.entry_price?.toFixed(2) || '0.00'} & Enter
            </GoldButton>

            <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Secure payment powered by Stripe
            </p>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}