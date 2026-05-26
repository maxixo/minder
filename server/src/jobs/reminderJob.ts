import prisma from '../lib/prisma.js';
import { isPushConfigured, sendPushNotificationToMany, type PushSubscriptionPayload } from '../services/pushService.js';

const REMINDER_CHECK_INTERVAL_MS = 60_000;

const getLocalTimeParts = (date: Date, timeZone: string) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date).reduce<Record<string, string>>((accumulator, part) => {
    if (part.type !== 'literal') {
      accumulator[part.type] = part.value;
    }
    return accumulator;
  }, {});

  return {
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
    timeKey: `${parts.hour}:${parts.minute}`,
  };
};

const wasReminderAlreadySentToday = (lastReminderSentAt: Date | null | undefined, timeZone: string, todayKey: string) => {
  if (!lastReminderSentAt) return false;
  return getLocalTimeParts(new Date(lastReminderSentAt), timeZone).dateKey === todayKey;
};

const toPushPayload = (subscription: any): PushSubscriptionPayload => ({
  endpoint: subscription.endpoint,
  expirationTime: subscription.expirationTime != null ? Number(subscription.expirationTime) : null,
  keys: {
    p256dh: subscription.p256dh,
    auth: subscription.auth,
  },
});

const sendDueReminders = async () => {
  if (!isPushConfigured()) return;

  const users = await prisma.user.findMany({
    where: {
      dailyReminder: true,
      pushSubscriptions: { some: {} },
    },
    include: { pushSubscriptions: true },
  });

  const now = new Date();

  await Promise.all(users.map(async (user) => {
    const timeZone = user.timezone || 'UTC';
    const reminderTime = user.reminderTime || '20:00';
    const lastReminderSentAt = user.lastReminderSentAt || null;
    const { dateKey, timeKey } = getLocalTimeParts(now, timeZone);

    if (timeKey !== reminderTime || wasReminderAlreadySentToday(lastReminderSentAt, timeZone, dateKey)) {
      return;
    }

    try {
      const subscriptions = user.pushSubscriptions.map(toPushPayload);
      const result = await sendPushNotificationToMany(subscriptions, {
        title: 'Time for your daily reflection',
        body: 'Take one minute to check in and log today\'s entry.',
        url: '/reflection',
        tag: 'daily-reflection-reminder',
      });

      if (result.invalidEndpoints.length) {
        await prisma.pushSubscription.deleteMany({
          where: {
            userId: user.id,
            endpoint: { in: result.invalidEndpoints },
          },
        });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { lastReminderSentAt: now },
      });
    } catch (error) {
      console.error('Daily reminder send failed:', error);
    }
  }));
};

let reminderInterval: NodeJS.Timeout | null = null;

export const startDailyReminderJob = () => {
  if (reminderInterval || process.env.DISABLE_DAILY_REMINDER_JOB === 'true') return;

  reminderInterval = setInterval(() => {
    void sendDueReminders();
  }, REMINDER_CHECK_INTERVAL_MS);

  void sendDueReminders();
};
