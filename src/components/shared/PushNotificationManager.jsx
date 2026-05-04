import { useEffect } from 'react';
import { Membership } from '@/api/entities';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const VAPID_PUBLIC_KEY = 'BC02Y6zwim7MDGS6zSWDcibtuPhE7a2hA3mv4BfQVVi4FeFxM30701hOBN7IpHAVDMSvjV7XgkEO4exj5FcCo2Q';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

async function waitForUser(retries = 10, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const user = await base44.auth.me();
      if (user && user.id) return user;
    } catch (e) {}
    await new Promise(res => setTimeout(res, delay));
  }
  return null;
}

export default function PushNotificationManager() {
  useEffect(() => {
    const initPush = async () => {
      try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

        const permission = Notification.permission;
        if (permission === 'denied') return;

        const registration = await navigator.serviceWorker.register('/sw.js').catch(() => null);
        if (!registration) return;

        await navigator.serviceWorker.ready;

        const subscribePush = async () => {
          try {
            // Wait for user to be logged in
            const user = await waitForUser();
            if (!user) {
              console.warn('Push: no authenticated user, skipping');
              return;
            }

            // Get or create push subscription
            let subscription = await registration.pushManager.getSubscription();
            if (!subscription) {
              subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
              });
            }

            const subJson = subscription.toJSON();

            // Save to Membership record
            const memberships = await Membership.filter({ user_id: user.id });
            if (memberships && memberships.length > 0) {
              for (const m of memberships) {
                await Membership.update(m.id, {
                  push_subscription: subJson,
                  push_enabled: true
                });
              }
              console.log('Push subscription saved to', memberships.length, 'membership(s) for', user.email);
            } else {
              console.warn('Push: no membership found for user', user.email);
            }
          } catch (err) {
            console.error('Push subscription error:', err);
          }
        };

        if (permission === 'granted') {
          setTimeout(subscribePush, 2000);
        } else {
          const alreadyAsked = localStorage.getItem('push_asked');
          if (!alreadyAsked) {
            setTimeout(async () => {
              localStorage.setItem('push_asked', 'true');
              const result = await Notification.requestPermission();
              if (result === 'granted') {
                await subscribePush();
                toast.success('Notifications enabled! You\'ll get game day updates. 🏉');
              }
            }, 4000);
          }
        }
      } catch (error) {
        console.error('Push init error:', error);
      }
    };

    initPush();
  }, []);

  return null;
}