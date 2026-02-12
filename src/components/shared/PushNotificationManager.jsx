import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function PushNotificationManager() {
  const [user, setUser] = useState(null);
  const [hasAsked, setHasAsked] = useState(false);

  useEffect(() => {
    const initPush = async () => {
      const userData = await base44.auth.me();
      setUser(userData);

      if (!userData?.push_enabled) return;
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

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

      // Store subscription in user record
      await base44.auth.updateMe({
        push_subscription: subscription.toJSON()
      });
    } catch (error) {
      console.error('Failed to subscribe to push:', error);
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