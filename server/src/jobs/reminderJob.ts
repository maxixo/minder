import prisma from '../lib/prisma.js';
import { isPushConfigured, sendPushNotificationToMany, type PushSubscriptionPayload } from '../services/pushService.js';

const REMINDER_CHECK_INTERVAL_MS = 60_000;

export const toMinutesSinceMidnight = (timeKey: string) => {
  const parts = timeKey.split(':');
  if (parts.length !== 2) return null;

  const [hours, minutes] = parts.map((value) => Number.parseInt(value, 10));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return (hours * 60) + minutes;
};

export const isReminderDue = (currentTimeKey: string, reminderTime: string) => {
  const currentMinutes = toMinutesSinceMidnight(currentTimeKey);
  const reminderMinutes = toMinutesSinceMidnight(reminderTime);

  if (currentMinutes == null || reminderMinutes == null) return false;
  return currentMinutes >= reminderMinutes;
};

export const isValidTimeZone = (timeZone: string) => {
  try {
    Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
};

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
    const reminderTime = user.reminderTime || '20:00';
    const dueSubscriptions = user.pushSubscriptions.filter((subscription) => {
      const timeZone = subscription.timezone || user.timezone || 'UTC';
      if (!isValidTimeZone(timeZone)) {
        console.error(`Daily reminder skipped for subscription ${subscription.id}: invalid timezone "${timeZone}"`);
        return false;
      }

      const { dateKey, timeKey } = getLocalTimeParts(now, timeZone);
      return (
        isReminderDue(timeKey, reminderTime)
        && !wasReminderAlreadySentToday(subscription.lastSentAt || null, timeZone, dateKey)
      );
    });

    if (!dueSubscriptions.length) {
      return;
    }

    try {
      const subscriptions = dueSubscriptions.map(toPushPayload);
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

      const deliveredSubscriptionIds = dueSubscriptions
        .filter((subscription) => !result.invalidEndpoints.includes(subscription.endpoint))
        .map((subscription) => subscription.id);

      if (deliveredSubscriptionIds.length) {
        await prisma.pushSubscription.updateMany({
          where: { id: { in: deliveredSubscriptionIds } },
          data: { lastSentAt: now },
        });
      }
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
