import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { subscribePush } from '@/lib/pushNotifications';
import { toast } from 'sonner';

export default function PushPromptBanner() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const u = await base44.auth.me();
        if (!u || cancelled) return;

        // Don't show to admins
        if (u.role === 'admin') return;

        // Check membership
        const memberships = await base44.entities.Membership.filter({ user_id: u.id, status: 'active' });
        if (!memberships || memberships.length === 0) return;

        const membership = memberships[0];

        // Already subscribed — don't show
        if (membership.push_enabled && membership.push_subscription) return;

        // Only show banner if they've dismissed the modal at least once
        if (!u.push_prompt_last_dismissed) return;

        if (!cancelled) setShow(true);
      } catch (e) {
        // Silently fail
      }
    }

    check();
    return () => { cancelled = true; };
  }, []);

  const handleEnable = async () => {
    setLoading(true);
    try {
      await subscribePush();
      setShow(false);
      toast.success("Notifications on. You won't miss a thing.");
    } catch (err) {
      if (err.message === 'PERMISSION_DENIED') {
        setShow(false);
        toast.error('Notifications blocked. Enable in your device settings to receive updates.');
      } else {
        toast.error(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-3" style={{ backgroundColor: '#1B3A6B' }}>
      <Bell className="w-4 h-4 text-white flex-shrink-0" />
      <p className="flex-1 text-white text-sm font-medium leading-tight">
        Notifications are off. Tap to turn on and never miss a moment.
      </p>
      <button
        onClick={handleEnable}
        disabled={loading}
        className="text-white text-sm font-bold underline underline-offset-2 flex-shrink-0 disabled:opacity-50"
      >
        {loading ? '...' : 'Turn on'}
      </button>
      <button
        onClick={() => setShow(false)}
        className="text-white/70 flex-shrink-0 ml-1"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}