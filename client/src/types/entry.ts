export type EntrySection = 'reflection' | 'selfcare' | 'emotional' | 'review';

export type EntryWeather = 'sunny' | 'partly_cloudy' | 'cloudy' | 'rainy' | 'stormy' | 'snowy' | null;
export type EntrySleepQuality = 'poor' | 'fair' | 'good' | 'great' | 'excellent' | null;
export type EntryFeeling =
  | 'happy'
  | 'peace'
  | 'sad'
  | 'worried'
  | 'excited'
  | 'bored'
  | 'relaxed'
  | 'lonely'
  | 'tired'
  | 'angry'
  | 'overwhelmed'
  | null;

export interface EntryEnergyPoint {
  time: number;
  energy: number;
}

export interface EntryNutrition {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

export interface EntryTodoItem {
  id?: string;
  text: string;
  completed: boolean;
}

export interface DailyEntry {
  id: string;
  userId: string;
  date: string;
  weather: EntryWeather;
  gratitude: string[];
  expectations: string;
  positiveNotes: string[];
  whatMakesTodayGreat: string;
  goodThingsHappened: string[];
  selfAssessmentNote: string;
  mood: number | null;
  waterIntake: number;
  sleepHours: number | null;
  sleepQuality: EntrySleepQuality;
  meals: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
    snack: boolean;
  };
  nutrition: EntryNutrition;
  energyLevels: EntryEnergyPoint[];
  tomorrowPlan: {
    howToMakeBetter: string;
    expectations: string;
  };
  selfLove: string;
  gratitudeNote: string;
  feeling: EntryFeeling;
  additionalFeelings: Exclude<EntryFeeling, null>[];
  activities: {
    reading: number;
    music: number;
    mindfulness: number;
  };
  mindThoughts: string;
  nextStep: string;
  ratings: {
    selfTalk: number | null;
    energyPoint: number | null;
    overall: number | null;
  };
  selfCareChecklist: {
    ateBreakfast: boolean;
    ateLunch: boolean;
    ateDinner: boolean;
    slept7to9Hours: boolean;
    tookNap: boolean;
    watchedMovie: boolean;
    gotFreshAir: boolean;
    exercised: boolean;
    calledFriend: boolean;
    journaled: boolean;
    drankWater: boolean;
  };
  emotionalGuidance: {
    whereAreYou: string;
    howYoureFeeling: string;
    whatYoureThinking: string;
    copingMethod: string;
    feelingBeforeGo: string;
  };
  selfCarePlanDays: Record<string, boolean>;
  priorities: string[];
  todoList: EntryTodoItem[];
  focus: string;
  mindfulnessNotes: string;
  todayNotes: string[];
  completedSections: EntrySection[];
  createdAt: string;
  updatedAt: string;
}

export type DailyEntryRequest = Omit<DailyEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[K] extends Record<string, unknown>
      ? DeepPartial<T[K]>
      : T[K];
};

export type DailyEntryPatch = DeepPartial<DailyEntryRequest>;

export interface EntryQueryParams {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (!value || Array.isArray(value)) return false;
  return Object.prototype.toString.call(value) === '[object Object]';
};

const nowIso = () => new Date().toISOString();
const toDateOnly = (value: string) => value.slice(0, 10);

export const createEmptyDailyEntry = (date = nowIso()): DailyEntry => ({
  id: '',
  userId: '',
  date,
  weather: null,
  gratitude: [],
  expectations: '',
  positiveNotes: [],
  whatMakesTodayGreat: '',
  goodThingsHappened: [],
  selfAssessmentNote: '',
  mood: null,
  waterIntake: 0,
  sleepHours: null,
  sleepQuality: null,
  meals: {
    breakfast: false,
    lunch: false,
    dinner: false,
    snack: false,
  },
  nutrition: {
    calories: null,
    protein: null,
    carbs: null,
    fat: null,
  },
  energyLevels: [],
  tomorrowPlan: {
    howToMakeBetter: '',
    expectations: '',
  },
  selfLove: '',
  gratitudeNote: '',
  feeling: null,
  additionalFeelings: [],
  activities: {
    reading: 0,
    music: 0,
    mindfulness: 0,
  },
  mindThoughts: '',
  nextStep: '',
  ratings: {
    selfTalk: null,
    energyPoint: null,
    overall: null,
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
  },
  emotionalGuidance: {
    whereAreYou: '',
    howYoureFeeling: '',
    whatYoureThinking: '',
    copingMethod: '',
    feelingBeforeGo: '',
  },
  selfCarePlanDays: {},
  priorities: [],
  todoList: [],
  focus: '',
  mindfulnessNotes: '',
  todayNotes: [],
  completedSections: [],
  createdAt: date,
  updatedAt: date,
});

export const mergeEntryPatch = <T>(base: T, patch?: DeepPartial<T>): T => {
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

export const normalizeDailyEntry = (entry?: Partial<DailyEntry> | null): DailyEntry => {
  const date = typeof entry?.date === 'string' && entry.date ? entry.date : nowIso();
  return mergeEntryPatch(createEmptyDailyEntry(date), {
    ...entry,
    selfCarePlanDays: entry?.selfCarePlanDays ? { ...entry.selfCarePlanDays } : {},
  });
};

export const withCompletedSection = (
  sections: EntrySection[] | undefined,
  section?: EntrySection | null
): EntrySection[] => {
  if (!section) return sections || [];
  return Array.from(new Set([...(sections || []), section]));
};

export const toDailyEntryRequest = (entry: DailyEntry): DailyEntryRequest => {
  const { id: _id, userId: _userId, createdAt: _createdAt, updatedAt: _updatedAt, ...request } = entry;
  return {
    ...request,
    date: toDateOnly(request.date),
    selfCarePlanDays: { ...request.selfCarePlanDays },
  };
};
