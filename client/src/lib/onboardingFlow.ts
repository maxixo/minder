const ONBOARDING_FLOW_KEY = 'mindfullife-onboarding-flow';

export interface OnboardingFlowState {
  profileName: string;
  profileAvatar: string | null;
  focusAreas: string[];
  goal?: string;
  cadence?: string;
  dailyReminder?: boolean;
  reminderTime?: string;
  createdAt: string;
}

const canUseSessionStorage = () => typeof window !== 'undefined';

const isStringArray = (value: unknown): value is string[] => (
  Array.isArray(value) && value.every((item) => typeof item === 'string')
);

const normalizeOnboardingFlowState = (value: unknown): OnboardingFlowState | null => {
  if (!value || typeof value !== 'object') return null;

  const parsedValue = value as Partial<OnboardingFlowState> & {
    goal?: unknown;
    cadence?: unknown;
    dailyReminder?: unknown;
    reminderTime?: unknown;
  };

  const profileName = typeof parsedValue.profileName === 'string' ? parsedValue.profileName : '';
  const profileAvatar = typeof parsedValue.profileAvatar === 'string'
    ? parsedValue.profileAvatar
    : parsedValue.profileAvatar === null
      ? null
      : null;
  const goal = typeof parsedValue.goal === 'string' ? parsedValue.goal : undefined;
  const cadence = typeof parsedValue.cadence === 'string' ? parsedValue.cadence : undefined;
  const dailyReminder = typeof parsedValue.dailyReminder === 'boolean' ? parsedValue.dailyReminder : undefined;
  const reminderTime = typeof parsedValue.reminderTime === 'string' ? parsedValue.reminderTime : undefined;
  const focusAreas = isStringArray(parsedValue.focusAreas)
    ? parsedValue.focusAreas.filter((item) => item.trim().length > 0)
    : goal
      ? [goal]
      : [];

  if (
    !profileName
    && !profileAvatar
    && !focusAreas.length
    && !goal
    && !cadence
    && dailyReminder === undefined
    && !reminderTime
  ) {
    return null;
  }

  return {
    profileName,
    profileAvatar,
    focusAreas,
    goal,
    cadence,
    dailyReminder,
    reminderTime,
    createdAt: typeof parsedValue.createdAt === 'string' ? parsedValue.createdAt : new Date().toISOString(),
  };
};

export const readOnboardingFlowState = (): OnboardingFlowState | null => {
  if (!canUseSessionStorage()) return null;

  try {
    const rawValue = window.sessionStorage.getItem(ONBOARDING_FLOW_KEY);
    if (!rawValue) return null;

    return normalizeOnboardingFlowState(JSON.parse(rawValue));
  } catch {
    return null;
  }
};

export const writeOnboardingFlowState = (value: Omit<OnboardingFlowState, 'createdAt'>) => {
  if (!canUseSessionStorage()) return;

  const nextValue: OnboardingFlowState = {
    ...value,
    createdAt: new Date().toISOString(),
  };

  window.sessionStorage.setItem(ONBOARDING_FLOW_KEY, JSON.stringify(nextValue));
};

export const updateOnboardingFlowState = (patch: Partial<Omit<OnboardingFlowState, 'createdAt'>>) => {
  const currentValue = readOnboardingFlowState();

  const nextValue: Omit<OnboardingFlowState, 'createdAt'> = {
    profileName: patch.profileName ?? currentValue?.profileName ?? '',
    profileAvatar: patch.profileAvatar ?? currentValue?.profileAvatar ?? null,
    focusAreas: patch.focusAreas ?? currentValue?.focusAreas ?? [],
    goal: patch.goal ?? currentValue?.goal,
    cadence: patch.cadence ?? currentValue?.cadence,
    dailyReminder: patch.dailyReminder ?? currentValue?.dailyReminder,
    reminderTime: patch.reminderTime ?? currentValue?.reminderTime,
  };

  writeOnboardingFlowState(nextValue);
  return readOnboardingFlowState();
};

export const clearOnboardingFlowState = () => {
  if (!canUseSessionStorage()) return;
  window.sessionStorage.removeItem(ONBOARDING_FLOW_KEY);
};
