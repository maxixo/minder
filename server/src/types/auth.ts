import type { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  avatarUrl: string | null;
  preferences: {
    theme: string;
    notifications: {
      dailyReminder: boolean;
      reminderTime: string;
      weeklyReport: boolean;
      timezone: string;
      lastReminderSentAt: string | null;
    };
    privacy: {
      shareStats: boolean;
    };
  };
}

export interface AuthRequest extends Request {
  user: AuthenticatedUser;
}
