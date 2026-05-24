import type { Request, Response } from 'express';
import User from '../models/User.js';
import Entry from '../models/Entry.js';
import {
  isPushConfigured,
  sendPushNotification,
  sendPushNotificationToMany,
  type PushSubscriptionPayload,
} from '../services/pushService.js';

interface AuthRequest extends Request {
  user: any;
}

const getCleanTimezone = (timezone: unknown) => {
  if (typeof timezone !== 'string') return null;
  const trimmed = timezone.trim();
  return trimmed || null;
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
    const user = await User.findById(req.user._id).select('preferences');
    res.json({ success: true, data: user.preferences });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updatePreferences = async (req: AuthRequest, res: Response) => {
  try {
    const timezone = getCleanTimezone(req.body?.notifications?.timezone);
    const nextPreferences = { ...req.body };

    if (req.body?.notifications) {
      nextPreferences.notifications = {
        ...req.body.notifications,
        timezone: timezone || req.body.notifications.timezone || 'UTC',
      };
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { preferences: nextPreferences } },
      { new: true, runValidators: true }
    );

    res.json({ success: true, data: user.preferences });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getPushSubscriptionStatus = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user._id).select('pushSubscriptions preferences.notifications.timezone');
    const subscriptions = user?.pushSubscriptions || [];

    res.json({
      success: true,
      data: {
        configured: isPushConfigured(),
        subscribed: subscriptions.length > 0,
        subscriptionCount: subscriptions.length,
        timezone: user?.preferences?.notifications?.timezone || 'UTC',
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const savePushSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const subscription = getNormalizedPushSubscription(req.body?.subscription);
    if (!subscription) {
      return res.status(400).json({ success: false, message: 'A valid push subscription is required.' });
    }

    const timezone = getCleanTimezone(req.body?.timezone);
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const existingSubscriptions = Array.from(user.pushSubscriptions as any[]);
    const existingIndex = existingSubscriptions.findIndex((item: any) => item.endpoint === subscription.endpoint);
    const subscriptionRecord = {
      ...subscription,
      userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null,
    };

    if (existingIndex >= 0) {
      existingSubscriptions[existingIndex] = subscriptionRecord;
    } else {
      existingSubscriptions.push(subscriptionRecord);
    }

    user.set('pushSubscriptions', existingSubscriptions);

    if (timezone) {
      user.preferences.notifications.timezone = timezone;
    }

    await user.save();

    res.json({
      success: true,
      data: {
        subscribed: true,
        subscriptionCount: user.pushSubscriptions.length,
        timezone: user.preferences.notifications.timezone,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deletePushSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const endpoint = typeof req.body?.endpoint === 'string' ? req.body.endpoint : null;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const nextSubscriptions = endpoint
      ? Array.from(user.pushSubscriptions as any[]).filter((subscription: any) => subscription.endpoint !== endpoint)
      : [];

    user.set('pushSubscriptions', nextSubscriptions);

    await user.save();

    res.json({
      success: true,
      data: {
        subscribed: user.pushSubscriptions.length > 0,
        subscriptionCount: user.pushSubscriptions.length,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const sendTestPushNotification = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user._id).select('pushSubscriptions');
    if (!user?.pushSubscriptions?.length) {
      return res.status(400).json({ success: false, message: 'No active push subscription found.' });
    }

    if (!isPushConfigured()) {
      return res.status(503).json({ success: false, message: 'Web push is not configured on the server.' });
    }

    const message = typeof req.body?.message === 'string' && req.body.message.trim()
      ? req.body.message.trim()
      : 'This is a test reminder from MindfulLife.';

    if (user.pushSubscriptions.length === 1) {
      await sendPushNotification(user.pushSubscriptions[0] as PushSubscriptionPayload, {
        title: 'MindfulLife test notification',
        body: message,
        url: '/settings',
        tag: 'mindfullife-test',
      });
    } else {
      const result = await sendPushNotificationToMany(user.pushSubscriptions as PushSubscriptionPayload[], {
        title: 'MindfulLife test notification',
        body: message,
        url: '/settings',
        tag: 'mindfullife-test',
      });

      if (result.invalidEndpoints.length) {
        const nextSubscriptions = Array.from(user.pushSubscriptions as any[]).filter((subscription: any) => (
          !result.invalidEndpoints.includes(subscription.endpoint)
        ));
        user.set('pushSubscriptions', nextSubscriptions);
        await user.save();
      }
    }

    res.json({ success: true, message: 'Test notification sent' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const exportData = async (req: AuthRequest, res: Response) => {
  try {
    const entries = await Entry.find({ userId: req.user._id }).lean();
    const user = await User.findById(req.user._id).lean();
    res.setHeader('Content-Disposition', `attachment; filename="mindful-export-${Date.now()}.json"`);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ user: { name: user.name, email: user.email }, entries }, null, 2));
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    await Entry.deleteMany({ userId: req.user._id });
    await User.findByIdAndDelete(req.user._id);
    res.json({ success: true, message: 'Account and all data deleted' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
