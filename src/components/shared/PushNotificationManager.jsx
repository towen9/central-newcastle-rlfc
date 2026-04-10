import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function PushNotificationManager() {
  const [user, setUser] = useState(null);
  const [hasAsked, setHasAsked] = useState(false);

  useEffect(() => {
    const initPush = async () => {
      try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

        const permission = Notification.permission;
        const alreadyAsked = localStorage.getItem('push_asked');

        // Don't do anything heavy if already denied
        if (permission === 'denied') return;

        // Register service worker
        const registration = await navigator.serviceWorker.register('/sw.js').catch(() => null);
        if (!registration) return;

        await navigator.serviceWorker.ready;

        // If already granted, just register push subscription
        if (permission === 'granted') {
          const userData = await base44.auth.me();
          await registerPushSubscription(userData);
          return;
        }

        // Ask after 3 seconds if not asked before
        if (!alreadyAsked) {
          setTimeout(() => {
            requestNotificationPermission();
          }, 3000);
        }
      } catch (error) {
        // Silent fail — push is non-critical
      }
    };

    initPush();
  }, []);

  const requestNotificationPermission = async () => {
    setHasAsked(true);
    localStorage.setItem('push_asked', 'true');

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      const userData = await base44.auth.me();
      await registerPushSubscription(userData);
      toast.success('Push notifications enabled!');
    }
  };

  const registerPushSubscription = async (userData) => {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
        )
      });

      console.log('Push subscription created:', subscription);

      // Store subscription in user record
      await base44.auth.updateMe({
        push_subscription: subscription.toJSON(),
        push_enabled: true
      });

      console.log('Push subscription saved to user record');
    } catch (error) {
      console.error('Failed to subscribe to push:', error);
      toast.error('Failed to enable push notifications');
    }
  };

  return null; // This is a background component
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}