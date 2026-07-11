import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useClub } from '@/contexts/ClubContext';
import { Button } from '@/components/ui/button';
import { Loader2, Phone, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

function validateAustralianMobile(raw) {
  const stripped = raw.replace(/\s+/g, '').replace(/^\+61/, '0');
  // Accept 04XXXXXXXX (10 digits) or 4XXXXXXXX (9 digits starting with 4)
  return /^04\d{8}$/.test(stripped) || /^4\d{8}$/.test(stripped);
}

export default function DayPassDetailsForm({ pass, user, onComplete }) {
  const { club } = useClub();
  const nameParts = (user?.full_name || '').split(' ');
  const [firstName, setFirstName] = useState(nameParts[0] || '');
  const [lastName, setLastName] = useState(nameParts.slice(1).join(' ') || '');
  const [mobile, setMobile] = useState('');
  const [optInClub, setOptInClub] = useState(true);
  const [optInPartners, setOptInPartners] = useState(false);
  const [mobileError, setMobileError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    // Validate names
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('Please enter your first and last name');
      return;
    }

    // Validate mobile only if entered
    if (mobile.trim()) {
      if (!validateAustralianMobile(mobile)) {
        setMobileError('Please enter a valid Australian mobile number');
        return;
      }
    }
    setMobileError('');

    setSaving(true);
    try {
      await base44.entities.GameDayEntry.update(pass.id, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        mobile: mobile.trim(),
        opt_in_club: optInClub,
        opt_in_partners: optInPartners,
      });
      onComplete();
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    try {
      await base44.entities.GameDayEntry.update(pass.id, { completion_skipped: true });
    } catch {
      // Non-blocking — proceed regardless
    }
    onComplete();
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-[#1a365d] pt-safe">
        <div className="px-5 py-6">
          <h1 className="text-white text-2xl font-bold">Almost There! 🎉</h1>
          <p className="text-blue-200 text-sm mt-1">Just a couple of details to complete your pass</p>
        </div>
      </div>

      <div className="px-5 py-6 space-y-5">

        {/* Name fields */}
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-900">Your Details</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#1a365d]"
              placeholder="First name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#1a365d]"
              placeholder="Last name"
            />
          </div>
        </div>

        {/* Phone */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Phone className="w-4 h-4 text-[#1a365d]" />
            <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            Add your mobile to get score updates and game-day deals straight to your phone.
          </p>
          <input
            type="tel"
            value={mobile}
            onChange={e => { setMobile(e.target.value); setMobileError(''); }}
            className={`w-full border rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#1a365d] ${mobileError ? 'border-red-400' : 'border-gray-300'}`}
            placeholder="04XX XXX XXX"
          />
          {mobileError && (
            <p className="text-sm text-red-500 mt-1">{mobileError}</p>
          )}
          <p className="text-xs text-gray-400 mt-2">Optional — we'll only message you about the Boys.</p>
        </div>

        {/* Opt-ins */}
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="optInClub"
              checked={optInClub}
              onChange={e => setOptInClub(e.target.checked)}
              className="mt-1 w-5 h-5 rounded accent-[#1a365d] flex-shrink-0 cursor-pointer"
            />
            <label htmlFor="optInClub" className="text-sm text-gray-700 cursor-pointer leading-snug">
              I'd like to hear about {club.identity.club_name} news, fixtures, and offers.
            </label>
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="optInPartners"
              checked={optInPartners}
              onChange={e => setOptInPartners(e.target.checked)}
              className="mt-1 w-5 h-5 rounded accent-[#1a365d] flex-shrink-0 cursor-pointer"
            />
            <label htmlFor="optInPartners" className="text-sm text-gray-700 cursor-pointer leading-snug">
              I'd like to receive exclusive offers from our club sponsors and partners.
            </label>
          </div>
        </div>

        {/* Actions */}
        <Button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full bg-[#1a365d] hover:bg-[#2c5282] py-6 text-base font-semibold"
        >
          {saving ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Saving...</> : 'Get my pass →'}
        </Button>

        <Button
          onClick={handleSkip}
          variant="ghost"
          className="w-full py-6 text-gray-500"
        >
          Skip for now
        </Button>

      </div>
    </div>
  );
}