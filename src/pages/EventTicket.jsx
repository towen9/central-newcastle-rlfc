import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Ticket, Calendar, MapPin, Check, Loader2, ArrowLeft, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const TICKET_PRICE = 90;
const EVENT_NAME = 'Ladies Long Lunch — Old Butchers Day 2026';
const EVENT_DATE = 'Saturday 1 August 2026';
const LOGO = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6966ba172da6c09d1e1650bd/6b3832f4a_Butcherboyslogo.jpg';

export default function EventTicket() {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState('info'); // info | verifying | confirmed
  const [ticket, setTicket] = useState(null);
  const [processing, setProcessing] = useState(false);

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

      if (sessionId) {
        setStep('verifying');
        base44.functions.invoke('createEventTicket', {
          session_id: sessionId,
          purchaser_name: pName,
          purchaser_email: pEmail,
          membership_id: membershipId
        }).then(res => {
          if (res?.data?.success) {
            setTicket(res.data);
            setStep('confirmed');
            // Prevent back navigation to payment
            window.history.pushState(null, '', window.location.href);
          } else {
            toast.error(res?.data?.error || 'Could not confirm ticket. Contact club staff.');
            setStep('info');
          }
        }).catch(() => {
          toast.error('Network error — please contact club staff with your payment confirmation.');
          setStep('info');
        });
      }
    }
  }, []);

  const handlePurchase = async () => {
    if (!firstName.trim() || !lastName.trim()) { toast.error('Please enter your full name'); return; }
    if (!email.trim()) { toast.error('Please enter your email'); return; }
    if (email.toLowerCase() !== emailConfirm.toLowerCase()) { toast.error('Emails do not match'); return; }

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
        throw new Error(data.error || 'No checkout URL');
      }
    } catch (err) {
      toast.error('Failed to start checkout. Please try again.');
      setProcessing(false);
    }
  };

  // ── Confirmed: show ticket with QR ──
  if (step === 'confirmed' && ticket) {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(ticket.ticket_id)}`;
    return (
      <div style={{ minHeight: '100dvh', overflowY: 'auto', background: '#f0fdf4' }}>
        <div className="bg-[#1a365d] text-white text-center" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          <div className="px-5 py-8">
            <img src={LOGO} alt="CNRLFC" className="w-16 h-16 mx-auto mb-4 rounded-full bg-white p-2" />
            <div className="w-16 h-16 bg-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold mb-1">You're in! 🎉</h1>
            <p className="text-blue-200 text-sm">{EVENT_NAME}</p>
          </div>
        </div>

        <div className="px-5 py-6 space-y-4 pb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-br from-[#1a365d] to-[#2c5282] px-6 py-5 text-white">
              <div className="flex items-center gap-3 mb-1">
                <Ticket className="w-5 h-5 text-blue-300" />
                <span className="font-semibold text-sm uppercase tracking-wide">Event Ticket</span>
              </div>
              <p className="text-2xl font-bold">{ticket.purchaser_name}</p>
              <p className="text-blue-200 text-sm mt-1">{ticket.event_name}</p>
            </div>

            <div className="px-6 py-5 flex flex-col items-center">
              <div className="bg-white border-4 border-gray-100 rounded-2xl p-3 mb-3">
                <img src={qrUrl} alt="Ticket QR" className="w-48 h-48" />
              </div>
              <p className="font-mono text-xs text-gray-400 mb-1">{ticket.ticket_id.substring(0, 8).toUpperCase()}</p>
              <p className="text-xs text-gray-500">Show this QR at the Ladies Long Lunch entry</p>
            </div>

            <div className="bg-gray-50 px-6 py-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>{EVENT_DATE}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>St John Oval, Newcastle</span>
              </div>
            </div>
          </motion.div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-sm font-semibold text-amber-900 mb-1">📱 Save this ticket</p>
            <p className="text-sm text-amber-800">Screenshot this page or bookmark it — show the QR code at the Ladies Long Lunch entry on the day.</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <p className="text-sm text-blue-800">A confirmation email has been sent to your email address. The ticket is also accessible anytime via the Ladies Long Lunch page in the app.</p>
          </div>

          <div className="bg-[#1a365d] rounded-2xl p-4 text-center">
            <p className="text-white font-semibold text-sm mb-1">📲 Add to Home Screen</p>
            <p className="text-blue-200 text-xs">Save this app to your home screen for easy access on the day.</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Verifying ──
  if (step === 'verifying') {
    return (
      <div style={{ minHeight: '100dvh', overflowY: 'auto', background: '#f9fafb' }}>
        <div className="bg-[#1a365d]" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          <div className="px-5 py-8 text-center">
            <img src={LOGO} alt="CNRLFC" className="w-16 h-16 mx-auto mb-4 rounded-full bg-white p-2" />
            <h1 className="text-white text-2xl font-bold">Confirming your ticket...</h1>
            <p className="text-blue-200 text-sm mt-1">Please wait a moment</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-16 px-5">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600 text-center">Verifying your payment and issuing your ticket...</p>
        </div>
      </div>
    );
  }

  // ── Info / Purchase form ──
  return (
    <div style={{ minHeight: '100dvh', overflowY: 'auto', background: '#f9fafb' }}>
      {/* Header */}
      <div className="bg-[#1a365d] text-white" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="px-5 py-6">
          <button onClick={() => window.history.back()} className="flex items-center gap-2 text-blue-200 mb-4">
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <img src={LOGO} alt="CNRLFC" className="w-16 h-16 mb-4 rounded-full bg-white p-2" />
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-extrabold mb-1">Ladies Long Lunch</h1>
              <p className="text-blue-200 text-sm">Old Butchers Day 2026</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-extrabold text-white">${TICKET_PRICE}</p>
              <p className="text-blue-300 text-xs">per ticket</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 space-y-4 pb-12">
        {/* Event info card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-3 text-gray-700">
              <Calendar className="w-5 h-5 text-blue-500 shrink-0" />
              <span className="font-medium">{EVENT_DATE}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <MapPin className="w-5 h-5 text-blue-500 shrink-0" />
              <span>St John Oval, Newcastle</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <Users className="w-5 h-5 text-blue-500 shrink-0" />
              <span>Ladies only event — Old Butchers Day celebration</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            Join us for a fully catered long lunch with free drinks, as part of Old Butchers Day at St John Oval. Ticket includes entry to the exclusive Ladies Long Lunch area.
          </p>
          <div className="mt-4 space-y-2">
            {['Fully catered lunch', 'Complimentary drinks on arrival', 'Exclusive Ladies Long Lunch area', 'Part of Old Butchers Day celebrations', 'Digital QR ticket — show at entry'].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-emerald-600" />
                </div>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Purchase form */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-bold text-gray-900">Your Details</h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">First Name *</label>
              <Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jane" className="h-12" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Last Name *</label>
              <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Smith" className="h-12" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Email Address *</label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" className="h-12" />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Confirm Email *</label>
            <Input type="email" value={emailConfirm} onChange={e => setEmailConfirm(e.target.value)} placeholder="Confirm your email" className="h-12" />
          </div>

          {/* Member toggle */}
          <div className="flex items-center justify-between py-3 border-t border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-900">Are you a club member?</p>
              <p className="text-xs text-gray-500">Optional — helps us link your ticket</p>
            </div>
            <button
              onClick={() => setIsMember(!isMember)}
              className={`w-12 h-6 rounded-full transition-colors ${isMember ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${isMember ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          {isMember && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Member Name (as registered)</label>
              <Input value={memberName} onChange={e => setMemberName(e.target.value)} placeholder="Your name on your membership" className="h-12" />
            </div>
          )}
        </div>

        {/* Price summary */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Ladies Long Lunch ticket × 1</span>
            <span>${TICKET_PRICE}.00</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2">
            <span>Total</span>
            <span>${TICKET_PRICE}.00 AUD</span>
          </div>
        </div>

        <Button
          onClick={handlePurchase}
          disabled={processing}
          className="w-full h-14 bg-[#1a365d] hover:bg-[#2c5282] text-base font-semibold"
        >
          {processing ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Processing...</>
          ) : (
            `Buy Ticket — $${TICKET_PRICE} →`
          )}
        </Button>

        <p className="text-xs text-gray-400 text-center">💳 Secure payment via Stripe · Ticket issued immediately after payment</p>
      </div>
    </div>
  );
}