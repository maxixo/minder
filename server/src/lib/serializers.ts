import { parseEntryDateInput } from './date.js';
import { ensureTodoItemIds, normalizeEntry } from './entry.js';

const asArray = <T>(value: unknown, fallback: T[] = []) => (
  Array.isArray(value) ? value as T[] : fallback
);

const asObject = <T extends Record<string, unknown>>(value: unknown, fallback: T) => (
  value && typeof value === 'object' && !Array.isArray(value) ? value as T : fallback
);

const asString = (value: unknown, fallback = '') => (
  typeof value === 'string' ? value : fallback
);

export const serializeUser = (user: any) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  avatar: user.avatar ?? null,
  avatarUrl: user.avatar ?? null,
  preferences: {
    theme: user.theme || 'light',
    notifications: {
      dailyReminder: user.dailyReminder ?? true,
      reminderTime: user.reminderTime || '20:00',
      weeklyReport: user.weeklyReport ?? true,
      timezone: user.timezone || 'UTC',
      lastReminderSentAt: user.lastReminderSentAt ? new Date(user.lastReminderSentAt).toISOString() : null,
    },
    privacy: {
      shareStats: user.shareStats ?? false,
    },
  },
});

export const serializeEntry = (entry: any) => normalizeEntry({
  id: entry.id,
  userId: entry.userId,
  date: entry.entryDate ? new Date(entry.entryDate).toISOString() : undefined,
  weather: entry.weather ?? null,
  gratitude: asArray<string>(entry.gratitude),
  expectations: entry.expectations ?? '',
  positiveNotes: asArray<string>(entry.positiveNotes),
  whatMakesTodayGreat: entry.whatMakesTodayGreat ?? '',
  goodThingsHappened: asArray<string>(entry.goodThingsHappened),
  selfAssessmentNote: entry.selfAssessmentNote ?? '',
  mood: entry.mood ?? null,
  waterIntake: entry.waterIntake ?? 0,
  sleepHours: entry.sleepHours ?? null,
  sleepQuality: entry.sleepQuality ?? null,
  meals: asObject(entry.meals, {
    breakfast: false,
    lunch: false,
    dinner: false,
    snack: false,
  }),
  nutrition: asObject(entry.nutrition, {
    calories: null,
    protein: null,
    carbs: null,
    fat: null,
  }),
  energyLevels: asArray(entry.energyLevels),
  tomorrowPlan: asObject(entry.tomorrowPlan, {
    howToMakeBetter: '',
    expectations: '',
  }),
  selfLove: entry.selfLove ?? '',
  gratitudeNote: entry.gratitudeNote ?? '',
  feeling: entry.feeling ?? null,
  additionalFeelings: asArray<string>(entry.additionalFeelings),
  activities: asObject(entry.activities, {
    reading: 0,
    music: 0,
    mindfulness: 0,
  }),
  mindThoughts: entry.mindThoughts ?? '',
  nextStep: entry.nextStep ?? '',
  ratings: asObject(entry.ratings, {
    selfTalk: null,
    energyPoint: null,
    overall: null,
  }),
  selfCareChecklist: asObject(entry.selfCareChecklist, {
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
  }),
  emotionalGuidance: asObject(entry.emotionalGuidance, {
    whereAreYou: '',
    howYoureFeeling: '',
    whatYoureThinking: '',
    copingMethod: '',
    feelingBeforeGo: '',
  }),
  selfCarePlanDays: asObject(entry.selfCarePlanDays, {}),
  priorities: asArray<string>(entry.priorities),
  todoList: ensureTodoItemIds(entry.todoList),
  focus: entry.focus ?? '',
  mindfulnessNotes: entry.mindfulnessNotes ?? '',
  todayNotes: asArray<string>(entry.todayNotes),
  completedSections: asArray(entry.completedSections),
  createdAt: entry.createdAt ? new Date(entry.createdAt).toISOString() : undefined,
  updatedAt: entry.updatedAt ? new Date(entry.updatedAt).toISOString() : undefined,
});

export const serializeEntryInsight = (insight: any) => ({
  entryId: insight.entryId,
  summary: insight.summary ?? '',
  sentimentScore: typeof insight.sentimentScore === 'number' ? insight.sentimentScore : null,
  dominantEmotions: asArray<string>(insight.dominantEmotions),
  themes: asArray<string>(insight.themes),
  stressors: asArray<string>(insight.stressors),
  positiveAnchors: asArray<string>(insight.positiveAnchors),
  suggestedActions: asArray<string>(insight.suggestedActions),
  riskFlags: asArray<string>(insight.riskFlags),
  modelVersion: insight.modelVersion ?? 'unknown',
  generatedAt: insight.generatedAt ? new Date(insight.generatedAt).toISOString() : new Date().toISOString(),
});

export const buildEntryPersistenceInput = (entry: Record<string, any>) => {
  const normalized = normalizeEntry(entry);

  return {
    entryDate: parseEntryDateInput(normalized.date),
    weather: normalized.weather,
    gratitude: normalized.gratitude,
    expectations: asString(normalized.expectations),
    positiveNotes: normalized.positiveNotes,
    whatMakesTodayGreat: asString(normalized.whatMakesTodayGreat),
    goodThingsHappened: normalized.goodThingsHappened,
    selfAssessmentNote: asString(normalized.selfAssessmentNote),
    mood: normalized.mood,
    waterIntake: normalized.waterIntake ?? 0,
    sleepHours: normalized.sleepHours,
    sleepQuality: normalized.sleepQuality,
    meals: normalized.meals,
    nutrition: normalized.nutrition,
    energyLevels: normalized.energyLevels,
    tomorrowPlan: normalized.tomorrowPlan,
    selfLove: asString(normalized.selfLove),
    gratitudeNote: asString(normalized.gratitudeNote),
    feeling: normalized.feeling,
    additionalFeelings: normalized.additionalFeelings,
    activities: normalized.activities,
    mindThoughts: asString(normalized.mindThoughts),
    nextStep: asString(normalized.nextStep),
    ratings: normalized.ratings,
    selfCareChecklist: normalized.selfCareChecklist,
    emotionalGuidance: normalized.emotionalGuidance,
    selfCarePlanDays: normalized.selfCarePlanDays,
    priorities: normalized.priorities,
    todoList: ensureTodoItemIds(normalized.todoList),
    focus: asString(normalized.focus),
    mindfulnessNotes: asString(normalized.mindfulnessNotes),
    todayNotes: normalized.todayNotes,
    completedSections: normalized.completedSections,
  };
};
