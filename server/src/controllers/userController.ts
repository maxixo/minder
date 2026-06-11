import type { Response } from 'express';
import prisma from '../lib/prisma.js';
import { sendInternalServerError } from '../lib/http.js';
import { serializeEntry, serializeUser } from '../lib/serializers.js';
import {
  isPushConfigured,
  sendPushNotification,
  sendPushNotificationToMany,
  type PushSubscriptionPayload,
} from '../services/pushService.js';
import type { AuthRequest } from '../types/auth.js';

const getCleanTimezone = (timezone: unknown) => {
  if (typeof timezone !== 'string') return null;
  const trimmed = timezone.trim();
  return trimmed || null;
};

const isValidTimeZone = (timeZone: string) => {
  try {
    Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
};

const getNormalizedPushSubscription = (subscription: any): PushSubscriptionPayload | null => {
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return null;
  }

  return {
    endpoint: subscription.endpoint,
    expirationTime: subscription.expirationTime ?? null,
    keys: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  };
};

export const getPreferences = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: serializeUser(user).preferences });
  } catch (err: any) {
    return sendInternalServerError(res, err, 'Get preferences failed');
  }
};

export const updatePreferences = async (req: AuthRequest, res: Response) => {
  try {
    const timezone = getCleanTimezone(req.body?.notifications?.timezone);
    const currentUser = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (timezone && !isValidTimeZone(timezone)) {
      return res.status(400).json({ success: false, message: 'A valid IANA timezone is required.' });
    }

    const nextDailyReminder = req.body?.notifications?.dailyReminder ?? currentUser.dailyReminder;
    const nextReminderTime = req.body?.notifications?.reminderTime ?? currentUser.reminderTime;
    const nextInspirationReminder = req.body?.notifications?.inspirationReminder ?? currentUser.inspirationReminder;
    const nextInspirationReminderTime = req.body?.notifications?.inspirationReminderTime ?? currentUser.inspirationReminderTime;
    const shouldResetReflectionHistory = (
      nextReminderTime !== currentUser.reminderTime
      || (currentUser.dailyReminder === false && nextDailyReminder === true)
    );
    const shouldResetInspirationHistory = (
      nextInspirationReminderTime !== currentUser.inspirationReminderTime
      || (currentUser.inspirationReminder === false && nextInspirationReminder === true)
    );

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        theme: req.body?.theme ?? currentUser.theme,
        dailyReminder: nextDailyReminder,
        reminderTime: nextReminderTime,
        inspirationReminder: nextInspirationReminder,
        inspirationReminderTime: nextInspirationReminderTime,
        weeklyReport: req.body?.notifications?.weeklyReport ?? currentUser.weeklyReport,
        timezone: timezone || req.body?.notifications?.timezone || currentUser.timezone || 'UTC',
        shareStats: req.body?.privacy?.shareStats ?? currentUser.shareStats,
      },
    });

    await Promise.all([
      shouldResetReflectionHistory
        ? prisma.pushSubscription.updateMany({
          where: { userId: req.user.id },
          data: { lastSentAt: null },
        })
        : Promise.resolve(),
      shouldResetInspirationHistory
        ? prisma.pushSubscription.updateMany({
          where: { userId: req.user.id },
          data: { lastInspirationSentAt: null },
        })
        : Promise.resolve(),
    ]);

    res.json({ success: true, data: serializeUser(user).preferences });
  } catch (err: any) {
    return sendInternalServerError(res, err, 'Update preferences failed');
  }
};

export const getPushSubscriptionStatus = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { pushSubscriptions: true },
    });

    const subscriptions = user?.pushSubscriptions || [];

    res.json({
      success: true,
      data: {
        configured: isPushConfigured(),
        subscribed: subscriptions.length > 0,
        subscriptionCount: subscriptions.length,
        timezone: user?.timezone || 'UTC',
      },
    });
  } catch (err: any) {
    return sendInternalServerError(res, err, 'Get push subscription status failed');
  }
};

export const savePushSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const subscription = getNormalizedPushSubscription(req.body?.subscription);
    if (!subscription) {
      return res.status(400).json({ success: false, message: 'A valid push subscription is required.' });
    }

    const timezone = getCleanTimezone(req.body?.timezone);
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (timezone && !isValidTimeZone(timezone)) {
      return res.status(400).json({ success: false, message: 'A valid IANA timezone is required.' });
    }

    await prisma.pushSubscription.upsert({
      where: {
        userId_endpoint: {
          userId: req.user.id,
          endpoint: subscription.endpoint,
        },
      },
      update: {
        expirationTime: subscription.expirationTime != null ? BigInt(Math.trunc(subscription.expirationTime)) : null,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        timezone: timezone || user.timezone || 'UTC',
        userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null,
      },
      create: {
        userId: req.user.id,
        endpoint: subscription.endpoint,
        expirationTime: subscription.expirationTime != null ? BigInt(Math.trunc(subscription.expirationTime)) : null,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        timezone: timezone || user.timezone || 'UTC',
        userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null,
      },
    });

    if (timezone) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { timezone },
      });
    }

    const subscriptions = await prisma.pushSubscription.count({ where: { userId: req.user.id } });

    res.json({
      success: true,
      data: {
        subscribed: true,
        subscriptionCount: subscriptions,
        timezone: timezone || user.timezone,
      },
    });
  } catch (err: any) {
    return sendInternalServerError(res, err, 'Save push subscription failed');
  }
};

export const deletePushSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const endpoint = typeof req.body?.endpoint === 'string' ? req.body.endpoint.trim() : '';

    if (!endpoint) {
      return res.status(400).json({
        success: false,
        message: 'A push subscription endpoint is required to disable notifications for this device.',
      });
    }

    await prisma.pushSubscription.deleteMany({
      where: { userId: req.user.id, endpoint },
    });

    const subscriptionCount = await prisma.pushSubscription.count({ where: { userId: req.user.id } });

    res.json({
      success: true,
      data: {
        subscribed: subscriptionCount > 0,
        subscriptionCount,
      },
    });
  } catch (err: any) {
    return sendInternalServerError(res, err, 'Delete push subscription failed');
  }
};

export const sendTestPushNotification = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { pushSubscriptions: true },
    });

    if (!user?.pushSubscriptions?.length) {
      return res.status(400).json({ success: false, message: 'No active push subscription found.' });
    }

    if (!isPushConfigured()) {
      return res.status(503).json({ success: false, message: 'Web push is not configured on the server.' });
    }

    const message = typeof req.body?.message === 'string' && req.body.message.trim()
      ? req.body.message.trim()
      : 'This is a test reminder from MindfulLife.';

    const subscriptions = user.pushSubscriptions.map((subscription) => ({
      endpoint: subscription.endpoint,
      expirationTime: subscription.expirationTime != null ? Number(subscription.expirationTime) : null,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    }));

    if (subscriptions.length === 1) {
      await sendPushNotification(subscriptions[0], {
        title: 'MindfulLife test notification',
        body: message,
        url: '/settings',
        tag: 'mindfullife-test',
      });
    } else {
      const result = await sendPushNotificationToMany(subscriptions, {
        title: 'MindfulLife test notification',
        body: message,
        url: '/settings',
        tag: 'mindfullife-test',
      });

      if (result.invalidEndpoints.length) {
        await prisma.pushSubscription.deleteMany({
          where: {
            userId: req.user.id,
            endpoint: { in: result.invalidEndpoints },
          },
        });
      }
    }

    res.json({ success: true, message: 'Test notification sent' });
  } catch (err: any) {
    return sendInternalServerError(res, err, 'Send test push notification failed');
  }
};

export const exportData = async (req: AuthRequest, res: Response) => {
  try {
    const [entries, user] = await Promise.all([
      prisma.entry.findMany({ where: { userId: req.user.id }, orderBy: { entryDate: 'asc' } }),
      prisma.user.findUnique({ where: { id: req.user.id } }),
    ]);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="mindful-export-${Date.now()}.json"`);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({
      user: { id: user.id, name: user.name, email: user.email },
      entries: entries.map(serializeEntry),
    }, null, 2));
  } catch (err: any) {
    return sendInternalServerError(res, err, 'Export data failed');
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    await prisma.user.delete({ where: { id: req.user.id } });
    res.json({ success: true, message: 'Account and all data deleted' });
  } catch (err: any) {
    return sendInternalServerError(res, err, 'Delete account failed');
  }
};
