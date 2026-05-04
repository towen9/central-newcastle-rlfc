import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { subscribePush } from '@/lib/pushNotifications';

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

        const user = await waitForUser();
        if (!user) return;

        if (permission === 'granted') {
          // Already granted — just ensure subscription is saved
          setTimeout(async () => {
            try {
              await subscribePush();
            } catch (e) {
              console.warn('Push auto-subscribe error:', e.message);
            }
          }, 2000);
        } else {
          // Not yet asked — prompt once
          const alreadyAsked = localStorage.getItem('push_asked');
          if (!alreadyAsked) {
            setTimeout(async () => {
              localStorage.setItem('push_asked', 'true');
              try {
                await subscribePush();
                toast.success("Notifications enabled! You'll get game day updates. 🏉");
              } catch (e) {
                if (e.message !== 'PERMISSION_DENIED') {
                  console.warn('Push auto-subscribe error:', e.message);
                }
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