import User from '../models/User.js';
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

const sendDueReminders = async () => {
  if (!isPushConfigured()) return;

  const users = await User.find({
    'preferences.notifications.dailyReminder': true,
    'pushSubscriptions.0': { $exists: true },
  }).select('preferences pushSubscriptions');

  const now = new Date();

  await Promise.all(users.map(async (user: any) => {
    const timeZone = user.preferences?.notifications?.timezone || 'UTC';
    const reminderTime = user.preferences?.notifications?.reminderTime || '20:00';
    const lastReminderSentAt = user.preferences?.notifications?.lastReminderSentAt || null;
    const { dateKey, timeKey } = getLocalTimeParts(now, timeZone);

    if (timeKey !== reminderTime || wasReminderAlreadySentToday(lastReminderSentAt, timeZone, dateKey)) {
      return;
    }

    try {
      const result = await sendPushNotificationToMany(user.pushSubscriptions as PushSubscriptionPayload[], {
        title: 'Time for your daily reflection',
        body: 'Take one minute to check in and log today\'s entry.',
        url: '/reflection',
        tag: 'daily-reflection-reminder',
      });

      if (result.invalidEndpoints.length) {
        user.pushSubscriptions = user.pushSubscriptions.filter((subscription: PushSubscriptionPayload) => (
          !result.invalidEndpoints.includes(subscription.endpoint)
        ));
      }

      user.preferences.notifications.lastReminderSentAt = now;
      await user.save();
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
