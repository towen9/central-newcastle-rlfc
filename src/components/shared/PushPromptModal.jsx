import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { subscribePush } from '@/lib/pushNotifications';
import { toast } from 'sonner';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export default function PushPromptModal() {
  const [show, setShow] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const u = await base44.auth.me();
        if (!u || cancelled) return;
        setUser(u);

        // Don't show to admins
        if (u.role === 'admin') return;

        // Check membership
        const memberships = await base44.entities.Membership.filter({ user_id: u.id, status: 'active' });
        if (!memberships || memberships.length === 0) return;

        const membership = memberships[0];

        // Already subscribed — don't show
        if (membership.push_enabled && membership.push_subscription) return;

        // Check 7-day cooldown
        const lastDismissed = u.push_prompt_last_dismissed;
        if (lastDismissed) {
          const elapsed = Date.now() - new Date(lastDismissed).getTime();
          if (elapsed < SEVEN_DAYS_MS) return;
        }

        if (!cancelled) setShow(true);
      } catch (e) {
        // Silently fail — don't block the app
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

  const handleDismiss = async () => {
    setShow(false);
    try {
      if (user) {
        await base44.auth.updateMe({ push_prompt_last_dismissed: new Date().toISOString() });
      }
    } catch (e) {
      // Best effort
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Sheet */}
      <div className="relative w-full sm:max-w-sm mx-4 sm:mx-auto bg-white rounded-t-3xl sm:rounded-2xl p-6 pb-10 sm:pb-6 shadow-2xl">
        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#1B3A6B' }}>
            <Bell className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Copy */}
        <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
          Don't miss a moment.
        </h2>
        <p className="text-gray-500 text-sm text-center leading-relaxed mb-7">
          Get notified when the Boys are playing, scoring, or winning. Match reminders, live updates, half-time deals — all in your pocket.
        </p>

        {/* Buttons */}
        <Button
          className="w-full py-5 text-base font-semibold rounded-xl mb-3"
          style={{ backgroundColor: '#1B3A6B' }}
          onClick={handleEnable}
          disabled={loading}
        >
          {loading ? 'Setting up...' : 'Turn on notifications'}
        </Button>
        <Button
          variant="ghost"
          className="w-full py-5 text-base text-gray-500"
          onClick={handleDismiss}
          disabled={loading}
        >
          Maybe later
        </Button>
      </div>
    </div>
  );
}