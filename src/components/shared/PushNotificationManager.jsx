import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function PushNotificationManager() {
  const [user, setUser] = useState(null);
  const [hasAsked, setHasAsked] = useState(false);

  useEffect(() => {
    const initPush = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);

        // First, enable push for the user if not already enabled
        if (!userData?.push_enabled) {
          await base44.auth.updateMe({ push_enabled: true });
        }

        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
          console.log('Push notifications not supported');
          return;
        }

        // Register service worker first
        const registration = await navigator.serviceWorker.register('/sw.js').catch(() => null);
        if (!registration) {
          console.error('Service worker registration failed');
          return;
        }

        await navigator.serviceWorker.ready;

        const permission = Notification.permission;
        const alreadyAsked = localStorage.getItem('push_asked');

        // If already granted, register push
        if (permission === 'granted') {
          await registerPushSubscription(userData);
          return;
        }

        // Ask after 3 seconds if not asked before and not denied
        if (!alreadyAsked && permission !== 'denied') {
          setTimeout(() => {
            if (!hasAsked) {
              requestNotificationPermission(userData);
            }
          }, 3000);
        }
      } catch (error) {
        console.error('Push init error:', error);
      }
    };

    initPush();
  }, []);

  const requestNotificationPermission = async (userData) => {
    setHasAsked(true);
    localStorage.setItem('push_asked', 'true');

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
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