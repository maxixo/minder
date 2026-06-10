import type { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  avatarUrl: string | null;
  goal: string | null;
  cadence: string | null;
  createdAt: string | null;
  hasSeenDashboardWelcome: boolean;
  billing: {
    plan: string;
    status: string;
    billingProvider: string | null;
    billingInterval: string | null;
    currentPeriodEnd: string | null;
    trialEndsAt: string | null;
    cancelAtPeriodEnd: boolean;
  };
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
