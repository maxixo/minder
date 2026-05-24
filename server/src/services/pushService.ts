import webpush from 'web-push';

export interface PushSubscriptionPayload {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  url: string;
  tag?: string;
}

let isConfigured = false;

const configureWebPush = () => {
  if (isConfigured) return true;

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    return false;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  isConfigured = true;
  return true;
};

export const isPushConfigured = () => configureWebPush();

export const sendPushNotification = async (
  subscription: PushSubscriptionPayload,
  payload: PushNotificationPayload
) => {
  if (!configureWebPush()) {
    throw new Error('Web push is not configured.');
  }

  return webpush.sendNotification(subscription as webpush.PushSubscription, JSON.stringify(payload));
};

export const sendPushNotificationToMany = async (
  subscriptions: PushSubscriptionPayload[],
  payload: PushNotificationPayload
) => {
  const invalidEndpoints: string[] = [];

  await Promise.all(subscriptions.map(async (subscription) => {
    try {
      await sendPushNotification(subscription, payload);
    } catch (error: any) {
      const statusCode = error?.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        invalidEndpoints.push(subscription.endpoint);
        return;
      }
      throw error;
    }
  }));

  return { invalidEndpoints };
};
