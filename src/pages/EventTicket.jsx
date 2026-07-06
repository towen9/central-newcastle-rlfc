import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Ticket, Calendar, MapPin, Check, Loader2, ArrowLeft, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import clubConfig from '@/config/club.config';
import GlassCard from '@/components/ui-kit/GlassCard';
import Eyebrow from '@/components/ui-kit/Eyebrow';
import GoldButton from '@/components/ui-kit/GoldButton';
import { SkeletonCard } from '@/components/ui-kit/Skeleton';

const t = clubConfig.theme;
const TICKET_PRICE_ID = 'price_1TjqdoLsW4v58VGVk0YiI9PK';
const TICKET_PRICE_DISPLAY = 'A$90';
const TICKET_PRICE_AMOUNT = 9000;
const TICKET_PRICE = 90;
const EVENT_NAME = 'Ladies Long Lunch — Old Butchers Day 2026';
const EVENT_DATE = 'Saturday 1 August 2026';
const LOGO = clubConfig.identity.logo_url;

export default function EventTicket() {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState('info'); // info | verifying | confirmed
  const [ticket, setTicket] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [emailConfirm, setEmailConfirm] = useState('');
  const [isMember, setIsMember] = useState(false);
  const [memberName, setMemberName] = useState('');

  useEffect(() => {
    base44.auth.me().then(u => {
      if (u) {
        setUser(u);
        // Pre-fill name/email from user account
        if (u.full_name) {
          const parts = u.full_name.split(' ');
          setFirstName(parts[0] || '');
          setLastName(parts.slice(1).join(' ') || '');
        }
        if (u.email) {
          setEmail(u.email);
          setEmailConfirm(u.email);
        }
      }
    }).catch(() => {});
  }, []);

  // Handle return from Stripe payment
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      const sessionId = params.get('session_id');
      const pName = decodeURIComponent(params.get('pname') || '');
      const pEmail = decodeURIComponent(params.get('pemail') || '');
      const membershipId = params.get('mid') || null;

      window.history.replaceState({}, '', window.location.pathname);

      console.log('EventTicket: payment=success, sessionId=', sessionId, 'pName=', pName, 'pEmail=', pEmail);

      if (sessionId) {
        setStep('verifying');
        base44.functions.invoke('createEventTicket', {
          stripe_payment_id: sessionId,
          purchaser_name: pName,
          purchaser_email: pEmail,
          ticket_price: TICKET_PRICE_AMOUNT
        }).then(res => {
          console.log('EventTicket: createEventTicket response', res?.data);
          if (res?.data?.success) {
            setTicket(res.data);
            setStep('confirmed');
            window.history.pushState(null, '', window.location.href);
          } else {
            const errDetail = res?.data?.error || 'No error detail returned';
            console.error('EventTicket: ticket creation failed:', errDetail);
            setErrorMsg(`Ticket error: ${errDetail}`);
            setStep('info');
          }
        }).catch((err) => {
          console.error('EventTicket: network/invoke error:', err);
          setErrorMsg(`Network error: ${err?.message || 'unknown'}. Please contact club staff with your payment confirmation.`);
          setStep('info');
        });
      }
    }
  }, []);

  const handlePurchase = async () => {
    setErrorMsg('');
    if (!firstName.trim() || !lastName.trim()) { setErrorMsg('Please enter your full name'); return; }
    if (!email.trim()) { setErrorMsg('Please enter your email'); return; }
    if (email.toLowerCase() !== emailConfirm.toLowerCase()) { setErrorMsg('Emails do not match'); return; }

    if (!user) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }

    if (window.self !== window.top) {
      alert('Checkout is only available from the published app, not the preview.');
      return;
    }

    setProcessing(true);
    const purchaserName = `${firstName.trim()} ${lastName.trim()}`;

    try {
      const successUrl = `${window.location.origin}/EventTicket?payment=success&session_id={CHECKOUT_SESSION_ID}&pname=${encodeURIComponent(purchaserName)}&pemail=${encodeURIComponent(email)}&mid=${encodeURIComponent(memberName || '')}`;
      const cancelUrl = `${window.location.origin}/EventTicket?payment=cancelled`;

      const { data } = await base44.functions.invoke('createEventTicketCheckout', {
        success_url: successUrl,
        cancel_url: cancelUrl,
        purchaser_name: purchaserName,
        purchaser_email: email,
        membership_id: isMember ? memberName : null
      });

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        setErrorMsg(data.error || 'Could not start checkout. Please try again.');
        setProcessing(false);
      }
    } catch (err) {
      setErrorMsg('Failed to start checkout. Please try again.');
      setProcessing(false);
    }
  };

  // ── Confirmed: show ticket with QR ──
  if (step === 'confirmed' && ticket) {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(ticket.ticket_id)}`;
    return (
      <div style={{ minHeight: '100dvh', overflowY: 'auto' }}>
        <div className="text-center pt-safe px-5 py-8">
          <img src={LOGO} alt="CNRLFC" className="w-16 h-16 mx-auto mb-4 rounded-full bg-white p-2" />
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: `${t.green}22` }}>
            <Check className="w-8 h-8" style={{ color: t.green }} />
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-1" style={{ fontFamily: t.fontDisplay }}>You're in! 🎉</h1>
          <p className="text-white/50 text-sm" style={{ fontFamily: t.fontBody }}>{EVENT_NAME}</p>
        </div>

        <div className="px-5 py-6 space-y-4 pb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <GlassCard className="overflow-hidden" style={{ borderColor: `${t.gold}55` }}>
              <div className="px-6 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-3 mb-1">
                  <Ticket className="w-5 h-5" style={{ color: t.gold }} />
                  <Eyebrow color={t.gold}>Event Ticket</Eyebrow>
                </div>
                <p className="text-2xl font-bold text-white" style={{ fontFamily: t.fontBody }}>{ticket.purchaser_name}</p>
                <p className="text-white/50 text-sm mt-1" style={{ fontFamily: t.fontBody }}>{ticket.event_name}</p>
              </div>

              <div className="px-6 py-5 flex flex-col items-center">
                {/* QR — solid white background */}
                <div className="bg-white border-4 border-gray-100 rounded-2xl p-3 mb-3">
                  <img src={qrUrl} alt="Ticket QR" className="w-48 h-48" />
                </div>
                <p className="font-mono text-xs text-white/40 mb-1">{ticket.ticket_id.substring(0, 8).toUpperCase()}</p>
                <p className="text-xs text-white/50" style={{ fontFamily: t.fontBody }}>Show this QR at the Ladies Long Lunch entry</p>
              </div>

              <div className="px-6 py-4 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: t.fontBody }}>
                  <Calendar className="w-4 h-4" style={{ color: t.gold }} />
                  <span>{EVENT_DATE}</span>
                </div>
                <div className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: t.fontBody }}>
                  <MapPin className="w-4 h-4" style={{ color: t.gold }} />
                  <span>{clubConfig.identity.venue_name}, Newcastle</span>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          <GlassCard className="p-4" style={{ borderColor: `${t.gold}44` }}>
            <p className="text-sm font-semibold mb-1" style={{ color: t.goldHi, fontFamily: t.fontBody }}>📱 Save this ticket</p>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: t.fontBody }}>Screenshot this page or bookmark it — show the QR code at the Ladies Long Lunch entry on the day.</p>
          </GlassCard>

          <GlassCard className="p-4">
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: t.fontBody }}>A confirmation email has been sent to your email address. The ticket is also accessible anytime via the Ladies Long Lunch page in the app.</p>
          </GlassCard>

          <GlassCard className="p-4 text-center">
            <p className="text-white font-semibold text-sm mb-1" style={{ fontFamily: t.fontBody }}>📲 Add to Home Screen</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: t.fontBody }}>Save this app to your home screen for easy access on the day.</p>
          </GlassCard>
        </div>
      </div>
    );
  }

  // ── Verifying ──
  if (step === 'verifying') {
    return (
      <div style={{ minHeight: '100dvh', overflowY: 'auto' }}>
        <div className="pt-safe px-5 py-8 text-center">
          <img src={LOGO} alt="CNRLFC" className="w-16 h-16 mx-auto mb-4 rounded-full bg-white p-2" />
          <h1 className="text-white text-2xl font-bold" style={{ fontFamily: t.fontDisplay }}>Confirming your ticket...</h1>
          <p className="text-white/50 text-sm mt-1" style={{ fontFamily: t.fontBody }}>Please wait a moment</p>
        </div>
        <div className="flex flex-col items-center justify-center py-16 px-5">
          <Loader2 className="w-12 h-12 animate-spin mb-4" style={{ color: t.gold }} />
          <p className="text-center" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: t.fontBody }}>Verifying your payment and issuing your ticket...</p>
        </div>
      </div>
    );
  }

  // ── Info / Purchase form ──
  return (
    <div style={{ minHeight: '100dvh', overflowY: 'auto' }}>
      {/* Header */}
      <div className="pt-safe px-5 py-6">
        <button onClick={() => window.history.back()} className="flex items-center gap-2 mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm" style={{ fontFamily: t.fontBody }}>Back</span>
        </button>
        <img src={LOGO} alt="CNRLFC" className="w-16 h-16 mb-4 rounded-full bg-white p-2" />
        <div className="flex items-start justify-between">
          <div>
            <Eyebrow color={t.gold}>Old Butchers Day 2026</Eyebrow>
            <h1 className="text-2xl font-extrabold text-white mb-1" style={{ fontFamily: t.fontDisplay }}>Ladies Long Lunch</h1>
          </div>
          <div className="text-right">
            <p className="text-3xl font-extrabold" style={{ color: t.gold, fontFamily: t.fontDisplay }}>${TICKET_PRICE}</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: t.fontBody }}>per ticket</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 space-y-4 pb-12">
        {/* Event info card */}
        <GlassCard className="p-5">
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-3" style={{ color: 'rgba(255,255,255,0.7)' }}>
              <Calendar className="w-5 h-5 shrink-0" style={{ color: t.gold }} />
              <span className="font-medium text-sm" style={{ fontFamily: t.fontBody }}>{EVENT_DATE}</span>
            </div>
            <div className="flex items-center gap-3" style={{ color: 'rgba(255,255,255,0.7)' }}>
              <MapPin className="w-5 h-5 shrink-0" style={{ color: t.gold }} />
              <span className="text-sm" style={{ fontFamily: t.fontBody }}>{clubConfig.identity.venue_name}, Newcastle</span>
            </div>
            <div className="flex items-center gap-3" style={{ color: 'rgba(255,255,255,0.7)' }}>
              <Users className="w-5 h-5 shrink-0" style={{ color: t.gold }} />
              <span className="text-sm" style={{ fontFamily: t.fontBody }}>Ladies only event — Old Butchers Day celebration</span>
            </div>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: t.fontBody }}>
            Join us for a fully catered long lunch with free drinks, as part of Old Butchers Day at {clubConfig.identity.venue_name}. Ticket includes entry to the exclusive Ladies Long Lunch area.
          </p>
          <div className="mt-4 space-y-2">
            {['Fully catered lunch', 'Complimentary drinks on arrival', 'Exclusive Ladies Long Lunch area', 'Part of Old Butchers Day celebrations', 'Digital QR ticket — show at entry'].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.7)', fontFamily: t.fontBody }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: `${t.green}22` }}>
                  <Check className="w-3 h-3" style={{ color: t.green }} />
                </div>
                {item}
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Purchase form */}
        <GlassCard className="p-5 space-y-4">
          <h3 className="font-bold text-white" style={{ fontFamily: t.fontBody }}>Your Details</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'rgba(255,255,255,0.5)' }}>First Name *</label>
              <Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jane" className="h-12" style={{ background: 'rgba(255,255,255,0.05)', color: 'white', borderColor: 'rgba(255,255,255,0.1)' }} />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Last Name *</label>
              <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Smith" className="h-12" style={{ background: 'rgba(255,255,255,0.05)', color: 'white', borderColor: 'rgba(255,255,255,0.1)' }} />
            </div>
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Email Address *</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" className="h-12" style={{ background: 'rgba(255,255,255,0.05)', color: 'white', borderColor: 'rgba(255,255,255,0.1)' }} />
          </div>

          <div>
            <label className="text-xs mb-1 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Confirm Email *</label>
            <Input type="email" value={emailConfirm} onChange={e => setEmailConfirm(e.target.value)} placeholder="Confirm your email" className="h-12" style={{ background: 'rgba(255,255,255,0.05)', color: 'white', borderColor: 'rgba(255,255,255,0.1)' }} />
          </div>

          {/* Member toggle */}
          <div className="flex items-center justify-between py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <p className="text-sm font-medium text-white" style={{ fontFamily: t.fontBody }}>Are you a club member?</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: t.fontBody }}>Optional — helps us link your ticket</p>
            </div>
            <button
              onClick={() => setIsMember(!isMember)}
              className="w-12 h-6 rounded-full transition-colors"
              style={{ background: isMember ? t.gold : 'rgba(255,255,255,0.15)' }}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${isMember ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          {isMember && (
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'rgba(255,255,255,0.5)' }}>Member Name (as registered)</label>
              <Input value={memberName} onChange={e => setMemberName(e.target.value)} placeholder="Your name on your membership" className="h-12" style={{ background: 'rgba(255,255,255,0.05)', color: 'white', borderColor: 'rgba(255,255,255,0.1)' }} />
            </div>
          )}
        </GlassCard>

        {/* Price summary */}
        <GlassCard className="p-4">
          <div className="flex justify-between text-sm mb-2" style={{ color: 'rgba(255,255,255,0.6)', fontFamily: t.fontBody }}>
            <span>Ladies Long Lunch ticket × 1</span>
            <span>${TICKET_PRICE}.00</span>
          </div>
          <div className="flex justify-between font-bold text-white pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontFamily: t.fontBody }}>Total</span>
            <span style={{ fontFamily: t.fontDisplay }}>${TICKET_PRICE}.00 AUD</span>
          </div>
        </GlassCard>

        {errorMsg && (
          <div className="rounded-xl px-4 py-3 text-sm text-center" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444' }}>
            {errorMsg}
          </div>
        )}

        <GoldButton
          onClick={handlePurchase}
          disabled={processing}
          fullWidth
          style={{ padding: '16px 20px' }}
        >
          {processing ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Processing...</>
          ) : (
            `Buy Ticket — ${TICKET_PRICE_DISPLAY} →`
          )}
        </GoldButton>

        <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: t.fontBody }}>💳 Secure payment via Stripe · Ticket issued immediately after payment</p>
      </div>
    </div>
  );
}