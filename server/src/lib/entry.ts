import crypto from 'node:crypto';

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (!value || Array.isArray(value)) return false;
  return Object.prototype.toString.call(value) === '[object Object]';
};

export type EntrySection = 'reflection' | 'selfcare' | 'emotional' | 'review';

export interface EntryTodoItem {
  id?: string;
  text: string;
  completed: boolean;
}

export interface CustomSelfCareItem {
  id: string;
  text: string;
  completed: boolean;
}

const nowIso = () => new Date().toISOString();

export const createEmptyEntry = (date = nowIso()) => ({
  id: '',
  userId: '',
  date,
  weather: null,
  gratitude: [] as string[],
  expectations: '',
  positiveNotes: [] as string[],
  whatMakesTodayGreat: '',
  goodThingsHappened: [] as string[],
  selfAssessmentNote: '',
  mood: null as number | null,
  waterIntake: 0,
  sleepHours: null as number | null,
  sleepQuality: null as string | null,
  meals: {
    breakfast: false,
    lunch: false,
    dinner: false,
    snack: false,
  },
  nutrition: {
    calories: null as number | null,
    protein: null as number | null,
    carbs: null as number | null,
    fat: null as number | null,
  },
  energyLevels: [] as Array<{ time: number; energy: number }>,
  tomorrowPlan: {
    howToMakeBetter: '',
    expectations: '',
  },
  selfLove: '',
  gratitudeNote: '',
  feeling: null as string | null,
  additionalFeelings: [] as string[],
  activities: {
    reading: 0,
    music: 0,
    mindfulness: 0,
  },
  mindThoughts: '',
  nextStep: '',
  ratings: {
    selfTalk: null as number | null,
    energyPoint: null as number | null,
    overall: null as number | null,
  },
  selfCareChecklist: {
    ateBreakfast: false,
    ateLunch: false,
    ateDinner: false,
    slept7to9Hours: false,
    tookNap: false,
    watchedMovie: false,
    gotFreshAir: false,
    exercised: false,
    calledFriend: false,
    journaled: false,
    drankWater: false,
    readBook: false,
    listenedToMusic: false,
    meditated: false,
    stretched: false,
  },
  customSelfCareChecklist: [] as CustomSelfCareItem[],
  emotionalGuidance: {
    whereAreYou: '',
    howYoureFeeling: '',
    whatYoureThinking: '',
    copingMethod: '',
    feelingBeforeGo: '',
  },
  selfCarePlanDays: {} as Record<string, boolean>,
  priorities: [] as string[],
  todoList: [] as EntryTodoItem[],
  focus: '',
  mindfulnessNotes: '',
  todayNotes: [] as string[],
  completedSections: [] as EntrySection[],
  createdAt: date,
  updatedAt: date,
});

export const mergeEntryPatch = <T>(base: T, patch?: Partial<T>): T => {
  if (patch == null) return base;
  if (Array.isArray(patch)) return patch as T;
  if (!isPlainObject(base) || !isPlainObject(patch)) return patch as T;

  const nextValue = { ...base } as Record<string, unknown>;

  Object.entries(patch).forEach(([key, value]) => {
    if (value === undefined) return;

    const current = nextValue[key];
    nextValue[key] = isPlainObject(current) && isPlainObject(value)
      ? mergeEntryPatch(current, value)
      : value;
  });

  return nextValue as T;
};

export const ensureTodoItemIds = (todoList: unknown) => {
  if (!Array.isArray(todoList)) return [];

  return todoList
    .filter((item) => isPlainObject(item))
    .map((item) => ({
      id: typeof item.id === 'string' && item.id.trim() ? item.id : crypto.randomUUID(),
      text: typeof item.text === 'string' ? item.text : '',
      completed: Boolean(item.completed),
    }));
};

export const ensureCustomSelfCareItemIds = (items: unknown) => {
  if (!Array.isArray(items)) return [];

  return items
    .filter((item) => isPlainObject(item))
    .map((item) => ({
      id: typeof item.id === 'string' && item.id.trim() ? item.id : crypto.randomUUID(),
      text: typeof item.text === 'string' ? item.text : '',
      completed: Boolean(item.completed),
    }))
    .filter((item) => item.text.trim());
};

export const normalizeEntry = (entry?: Record<string, unknown> | null) => {
  const date = typeof entry?.date === 'string' && entry.date ? entry.date : nowIso();

  const selfCarePlanDays = isPlainObject(entry?.selfCarePlanDays)
    ? Object.fromEntries(
        Object.entries(entry.selfCarePlanDays).map(([key, value]) => [key, Boolean(value)])
      ) as Record<string, boolean>
    : {};

  return mergeEntryPatch(createEmptyEntry(date), {
    ...(entry || {}),
    selfCarePlanDays,
    todoList: ensureTodoItemIds(entry?.todoList),
    customSelfCareChecklist: ensureCustomSelfCareItemIds(entry?.customSelfCareChecklist),
  });
};

export const getCompletionPercentage = (entryLike: Record<string, any>) => {
  const checks = [
    entryLike.gratitude?.length > 0,
    entryLike.mood != null,
    entryLike.waterIntake > 0,
    !!entryLike.selfLove,
    entryLike.feeling != null,
    entryLike.ratings?.overall != null,
    !!entryLike.emotionalGuidance?.whereAreYou,
    entryLike.priorities?.length > 0,
  ];

  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
};
