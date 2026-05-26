const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from(rawData, (character) => character.charCodeAt(0));
};

const SERVICE_WORKER_READY_TIMEOUT_MS = 10_000;

const getServiceWorkerRegistration = async () => {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers are not supported in this browser.');
  }

  const existingRegistration = await navigator.serviceWorker.getRegistration();
  if (existingRegistration?.active) {
    return existingRegistration;
  }

  const readyRegistration = await Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) => {
      window.setTimeout(() => {
        reject(new Error('Service worker did not become ready. Refresh the page and try again.'));
      }, SERVICE_WORKER_READY_TIMEOUT_MS);
    }),
  ]);

  if (!readyRegistration?.active) {
    throw new Error('Service worker is registered but not active yet. Refresh the page and try again.');
  }

  return readyRegistration;
};

export type NotificationPermissionStatus = NotificationPermission | 'unsupported';

export const getNotificationPermissionStatus = (): NotificationPermissionStatus => {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return window.Notification.permission;
};

export const isPushSupported = () => (
  typeof window !== 'undefined'
  && 'serviceWorker' in navigator
  && 'PushManager' in window
  && 'Notification' in window
);

export const getBrowserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return 'unsupported' as const;
  return window.Notification.requestPermission();
};

export const subscribeToPush = async () => {
  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) {
    throw new Error('VITE_VAPID_PUBLIC_KEY is missing.');
  }

  const registration = await getServiceWorkerRegistration();
  const existingSubscription = await registration.pushManager.getSubscription();
  if (existingSubscription) return existingSubscription.toJSON();

  const subscription = await registration.pushManager.subscribe({
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    userVisibleOnly: true,
  });

  return subscription.toJSON();
};

export const getExistingPushSubscription = async () => {
  if (!isPushSupported()) return null;
  const registration = await getServiceWorkerRegistration();
  return registration.pushManager.getSubscription();
};

export const unsubscribeFromPush = async () => {
  if (!isPushSupported()) return false;
  const registration = await getServiceWorkerRegistration();
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return false;
  return subscription.unsubscribe();
};
