import prisma from '../lib/prisma.js';
import { getTodayInspirationQuote, type InspirationQuote } from '../services/inspirationService.js';
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

export const buildDailyInspirationNotification = (quote: InspirationQuote) => {
  const maxQuoteLength = 150;
  const quoteText = quote.text.length > maxQuoteLength
    ? `${quote.text.slice(0, maxQuoteLength - 3).trimEnd()}...`
    : quote.text;

  return {
    title: 'Your daily inspiration',
    body: `"${quoteText}" - ${quote.author}`,
    url: '/inspiration',
    tag: 'daily-inspiration-reminder',
  };
};

export const buildDailyReflectionNotification = () => ({
  title: 'Time for your daily reflection',
  body: 'Take one minute to check in and log today\'s entry.',
  url: '/reflection',
  tag: 'daily-reflection-reminder',
});

export const runDailyReminders = async () => {
  if (!isPushConfigured()) return;

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { dailyReminder: true },
        { inspirationReminder: true },
      ],
      pushSubscriptions: { some: {} },
    },
    include: { pushSubscriptions: true },
  });

  if (!users.length) return;

  const now = new Date();
  const quote = users.some((user) => user.inspirationReminder)
    ? await getTodayInspirationQuote()
    : null;

  await Promise.all(users.map(async (user) => {
    const reflectionReminderTime = user.reminderTime || '20:00';
    const inspirationReminderTime = user.inspirationReminderTime || '08:30';
    const scheduledSubscriptions = user.pushSubscriptions.flatMap((subscription) => {
      const timeZone = subscription.timezone || user.timezone || 'UTC';
      if (!isValidTimeZone(timeZone)) {
        console.error(`Daily reminder skipped for subscription ${subscription.id}: invalid timezone "${timeZone}"`);
        return [];
      }

      const { dateKey, timeKey } = getLocalTimeParts(now, timeZone);
      return [{
        subscription,
        reflectionDue: (
          user.dailyReminder
          && isReminderDue(timeKey, reflectionReminderTime)
          && !wasReminderAlreadySentToday(subscription.lastSentAt || null, timeZone, dateKey)
        ),
        inspirationDue: (
          user.inspirationReminder
          && isReminderDue(timeKey, inspirationReminderTime)
          && !wasReminderAlreadySentToday(subscription.lastInspirationSentAt || null, timeZone, dateKey)
        ),
      }];
    });

    const sendScheduledNotification = async (
      dueSubscriptions: any[],
      payload: ReturnType<typeof buildDailyReflectionNotification>,
      timestampField: 'lastSentAt' | 'lastInspirationSentAt',
      errorLabel: string,
    ) => {
      if (!dueSubscriptions.length) return;

      try {
        const result = await sendPushNotificationToMany(dueSubscriptions.map(toPushPayload), payload);

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
            data: { [timestampField]: now },
          });
        }
      } catch (error) {
        console.error(`${errorLabel} send failed:`, error);
      }
    };

    const reflectionSubscriptions = scheduledSubscriptions
      .filter((item) => item.reflectionDue)
      .map((item) => item.subscription);
    const inspirationSubscriptions = scheduledSubscriptions
      .filter((item) => item.inspirationDue)
      .map((item) => item.subscription);

    await Promise.all([
      sendScheduledNotification(
        reflectionSubscriptions,
        buildDailyReflectionNotification(),
        'lastSentAt',
        'Daily reflection reminder'
      ),
      quote
        ? sendScheduledNotification(
          inspirationSubscriptions,
          buildDailyInspirationNotification(quote),
          'lastInspirationSentAt',
          'Daily inspiration reminder'
        )
        : Promise.resolve(),
    ]);
  }));
};

let reminderInterval: NodeJS.Timeout | null = null;

export const shouldStartDailyReminderJob = (flag = process.env.RUN_DAILY_REMINDER_JOB) => (
  flag == null || flag.trim().toLowerCase() !== 'false'
);

export const startDailyReminderJob = () => {
  if (reminderInterval || !shouldStartDailyReminderJob()) return;

  reminderInterval = setInterval(() => {
    void runDailyReminders();
  }, REMINDER_CHECK_INTERVAL_MS);

  void runDailyReminders();
};
