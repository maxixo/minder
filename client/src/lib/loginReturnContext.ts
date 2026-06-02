import type { DailyEntry } from '@/types/entry';

const RETURN_CONTEXT_KEY = 'mindfullife-login-return-context';
const RETURN_CONTEXT_ENABLED_KEY = 'mindfullife-login-return-context-enabled';

export interface LoginReturnContext {
  email: string;
  firstName: string;
  lastEntryDate: string | null;
  lastEntryTitle: string | null;
  lastEntryExcerpt: string | null;
  currentStreak: number | null;
  completionRate: number | null;
  updatedAt: string;
}

type LoginReturnContextPatch = Partial<Omit<LoginReturnContext, 'updatedAt'>>;

const canUseStorage = () => typeof window !== 'undefined';
const toDateKey = (value?: string | null) => (typeof value === 'string' ? value.slice(0, 10) : null);

const getEntryTitle = (entry: DailyEntry) => {
  if (entry.focus) return entry.focus;
  if (entry.expectations) return entry.expectations;
  if (entry.emotionalGuidance?.howYoureFeeling) return 'Emotional Check-In';
  if (entry.gratitude?.[0]) return `Gratitude: ${entry.gratitude[0]}`;
  return 'Daily Reflection';
};

const getEntryExcerpt = (entry: DailyEntry) => {
  const source = entry.positiveNotes?.[0]
    || entry.mindThoughts
    || entry.emotionalGuidance?.whatYoureThinking
    || entry.mindfulnessNotes
    || entry.gratitude?.[0]
    || 'A quiet moment was captured in this entry.';

  return source.length > 88 ? `${source.slice(0, 85)}...` : source;
};

const readStoredReturnContext = (): LoginReturnContext | null => {
  if (!canUseStorage()) return null;

  try {
    const rawValue = window.localStorage.getItem(RETURN_CONTEXT_KEY);
    if (!rawValue) return null;

    const parsedValue = JSON.parse(rawValue) as Partial<LoginReturnContext>;
    if (!parsedValue || typeof parsedValue !== 'object') return null;

    return {
      email: typeof parsedValue.email === 'string' ? parsedValue.email : '',
      firstName: typeof parsedValue.firstName === 'string' ? parsedValue.firstName : '',
      lastEntryDate: toDateKey(parsedValue.lastEntryDate),
      lastEntryTitle: typeof parsedValue.lastEntryTitle === 'string' ? parsedValue.lastEntryTitle : null,
      lastEntryExcerpt: typeof parsedValue.lastEntryExcerpt === 'string' ? parsedValue.lastEntryExcerpt : null,
      currentStreak: typeof parsedValue.currentStreak === 'number' ? parsedValue.currentStreak : null,
      completionRate: typeof parsedValue.completionRate === 'number' ? parsedValue.completionRate : null,
      updatedAt: typeof parsedValue.updatedAt === 'string' ? parsedValue.updatedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
};

export const isLoginReturnContextEnabled = () => {
  if (!canUseStorage()) return false;
  return window.localStorage.getItem(RETURN_CONTEXT_ENABLED_KEY) === 'true';
};

export const setLoginReturnContextEnabled = (enabled: boolean) => {
  if (!canUseStorage()) return;

  window.localStorage.setItem(RETURN_CONTEXT_ENABLED_KEY, enabled ? 'true' : 'false');

  if (!enabled) {
    window.localStorage.removeItem(RETURN_CONTEXT_KEY);
  }
};

export const readLoginReturnContext = () => {
  if (!isLoginReturnContextEnabled()) return null;
  return readStoredReturnContext();
};

export const updateLoginReturnContext = (patch: LoginReturnContextPatch) => {
  if (!isLoginReturnContextEnabled() || !canUseStorage()) return null;

  const currentValue = readStoredReturnContext();
  const nextLastEntryDate = toDateKey(patch.lastEntryDate ?? currentValue?.lastEntryDate);
  const nextValue: LoginReturnContext = {
    email: '',
    firstName: '',
    lastEntryTitle: null,
    lastEntryExcerpt: null,
    currentStreak: null,
    completionRate: null,
    ...(currentValue || {}),
    ...patch,
    lastEntryDate: nextLastEntryDate,
    updatedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(RETURN_CONTEXT_KEY, JSON.stringify(nextValue));
  return nextValue;
};

export const buildLoginReturnEntrySnapshot = (entry?: DailyEntry | null): LoginReturnContextPatch => {
  if (!entry?.id) {
    return {
      lastEntryDate: null,
      lastEntryTitle: null,
      lastEntryExcerpt: null,
    };
  }

  return {
    lastEntryDate: toDateKey(entry.date),
    lastEntryTitle: getEntryTitle(entry),
    lastEntryExcerpt: getEntryExcerpt(entry),
  };
};

export const getLoginResumePath = (lastEntryDate?: string | null) => {
  const dateKey = toDateKey(lastEntryDate);
  return dateKey ? `/reflection?date=${dateKey}` : '/dashboard';
};
