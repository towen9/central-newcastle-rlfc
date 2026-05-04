import { base44 } from '@/api/base44Client';

const VAPID_PUBLIC_KEY = 'BC02Y6zwim7MDGS6zSWDcibtuPhE7a2hA3mv4BfQVVi4FeFxM30701hOBN7IpHAVDMSvjV7XgkEO4exj5FcCo2Q';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

async function getRegistration() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || typeof Notification === 'undefined') {
    throw new Error('Push notifications are not supported in this browser.');
  }
  // Use getRegistration() to avoid re-registering; fall back to register() if none exists.
  // Do NOT await navigator.serviceWorker.ready — it can hang indefinitely on iOS Safari.
  let registration = await navigator.serviceWorker.getRegistration('/sw.js');
  if (!registration) {
    registration = await navigator.serviceWorker.register('/sw.js');
  }
  if (!registration || !registration.pushManager) {
    throw new Error('Push notifications are not supported in this browser.');
  }
  return registration;
}

/**
 * Request permission, subscribe to push, and save subscription to the user's active Membership.
 * Throws if permission is denied or subscription fails.
 */
export async function subscribePush() {
  const registration = await getRegistration();

  const permissionResult = await Notification.requestPermission();
  if (permissionResult !== 'granted') {
    throw new Error('PERMISSION_DENIED');
  }

  // Unsubscribe any existing subscription first (handles VAPID key rotation)
  const existing = await registration.pushManager.getSubscription();
  if (existing) await existing.unsubscribe();

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  });

  const subJson = subscription.toJSON();

  const user = await base44.auth.me();
  if (!user) throw new Error('Not authenticated');

  const memberships = await base44.entities.Membership.filter({ user_id: user.id, status: 'active' });
  if (!memberships || memberships.length === 0) {
    throw new Error('No active membership found');
  }

  for (const m of memberships) {
    await base44.entities.Membership.update(m.id, {
      push_subscription: subJson,
      push_enabled: true
    });
  }

  return subJson;
}

/**
 * Unsubscribe from push and clear subscription from the user's active Membership.
 */
export async function unsubscribePush() {
  try {
    const registration = await getRegistration();
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) await subscription.unsubscribe();
  } catch (e) {
    // Best effort — still clear from DB
    console.warn('Browser unsubscribe failed:', e);
  }

  const user = await base44.auth.me();
  if (!user) return;

  const memberships = await base44.entities.Membership.filter({ user_id: user.id, status: 'active' });
  for (const m of memberships) {
    await base44.entities.Membership.update(m.id, {
      push_subscription: null,
      push_enabled: false
    });
  }
}