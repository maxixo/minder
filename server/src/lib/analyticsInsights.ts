import { subDays } from 'date-fns';
import { getCompletionPercentage } from './entry.js';

export type AnalyticsInsightPeriod = '7days' | '30days' | '90days' | 'year';

interface AnalyticsEntry {
  date: string;
  mood: number | null;
  waterIntake: number;
  sleepHours: number | null;
  activities: {
    mindfulness: number;
  };
  selfCareChecklist: {
    slept7to9Hours: boolean;
    drankWater: boolean;
    exercised: boolean;
    gotFreshAir: boolean;
    calledFriend: boolean;
    meditated: boolean;
  };
  [key: string]: unknown;
}

interface BehaviorDefinition {
  id: string;
  label: string;
  shortLabel: string;
  icon: string;
  matches: (entry: AnalyticsEntry) => boolean;
}

const periodDays: Record<AnalyticsInsightPeriod, number> = {
  '7days': 7,
  '30days': 30,
  '90days': 90,
  year: 365,
};

const behaviorDefinitions: BehaviorDefinition[] = [
  {
    id: 'rest',
    label: 'days with 7-9 hours of sleep',
    shortLabel: 'Restful sleep',
    icon: 'bedtime',
    matches: (entry) => entry.selfCareChecklist.slept7to9Hours
      || (entry.sleepHours != null && entry.sleepHours >= 7 && entry.sleepHours <= 9),
  },
  {
    id: 'hydration',
    label: 'days with stronger hydration',
    shortLabel: 'Hydration',
    icon: 'water_drop',
    matches: (entry) => entry.selfCareChecklist.drankWater || entry.waterIntake >= 6,
  },
  {
    id: 'movement',
    label: 'days that included exercise',
    shortLabel: 'Movement',
    icon: 'directions_walk',
    matches: (entry) => entry.selfCareChecklist.exercised,
  },
  {
    id: 'mindfulness',
    label: 'days that included mindfulness',
    shortLabel: 'Mindfulness',
    icon: 'self_improvement',
    matches: (entry) => entry.selfCareChecklist.meditated || entry.activities.mindfulness > 0,
  },
  {
    id: 'fresh-air',
    label: 'days with time outside',
    shortLabel: 'Fresh air',
    icon: 'air',
    matches: (entry) => entry.selfCareChecklist.gotFreshAir,
  },
  {
    id: 'connection',
    label: 'days with social connection',
    shortLabel: 'Connection',
    icon: 'diversity_1',
    matches: (entry) => entry.selfCareChecklist.calledFriend,
  },
];

const round = (value: number, precision = 1) => {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
};

const average = (values: Array<number | null | undefined>, precision = 1) => {
  const available = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  if (!available.length) return null;
  return round(available.reduce((sum, value) => sum + value, 0) / available.length, precision);
};

const dateValue = (entry: AnalyticsEntry) => new Date(entry.date).getTime();

const buildComparison = (
  key: string,
  label: string,
  unit: string,
  current: number | null,
  previous: number | null,
) => {
  const delta = current == null || previous == null ? null : round(current - previous, key === 'completion' ? 0 : 1);

  return {
    key,
    label,
    unit,
    current,
    previous,
    delta,
    direction: delta == null ? 'insufficient_data' : delta > 0 ? 'up' : delta < 0 ? 'down' : 'steady',
  };
};

export const buildAnalyticsPatternInsights = (
  entries: AnalyticsEntry[],
  period: AnalyticsInsightPeriod,
  now = new Date(),
) => {
  const days = periodDays[period];
  const currentStart = subDays(now, days - 1).setHours(0, 0, 0, 0);
  const previousStart = subDays(now, (days * 2) - 1).setHours(0, 0, 0, 0);
  const currentEntries = entries.filter((entry) => dateValue(entry) >= currentStart);
  const previousEntries = entries.filter((entry) => {
    const value = dateValue(entry);
    return value >= previousStart && value < currentStart;
  });

  const currentMood = average(currentEntries.map((entry) => entry.mood));
  const previousMood = average(previousEntries.map((entry) => entry.mood));
  const currentSleep = average(currentEntries.map((entry) => entry.sleepHours));
  const previousSleep = average(previousEntries.map((entry) => entry.sleepHours));
  const currentHydration = average(currentEntries.map((entry) => entry.waterIntake));
  const previousHydration = average(previousEntries.map((entry) => entry.waterIntake));
  const currentCompletion = average(currentEntries.map((entry) => getCompletionPercentage(entry)), 0);
  const previousCompletion = average(previousEntries.map((entry) => getCompletionPercentage(entry)), 0);
  const moodEntries = currentEntries.filter((entry) => entry.mood != null);

  const behaviorInsights = behaviorDefinitions
    .map((definition) => {
      const withBehavior = moodEntries.filter(definition.matches);
      const withoutBehavior = moodEntries.filter((entry) => !definition.matches(entry));
      const withAverage = average(withBehavior.map((entry) => entry.mood));
      const withoutAverage = average(withoutBehavior.map((entry) => entry.mood));

      if (
        withBehavior.length < 2
        || withoutBehavior.length < 2
        || withAverage == null
        || withoutAverage == null
      ) {
        return null;
      }

      const delta = round(withAverage - withoutAverage);

      return {
        id: definition.id,
        label: definition.label,
        shortLabel: definition.shortLabel,
        icon: definition.icon,
        withAverage,
        withoutAverage,
        delta,
        sampleSize: withBehavior.length + withoutBehavior.length,
        supportingDays: withBehavior.length,
        direction: delta > 0 ? 'higher' : delta < 0 ? 'lower' : 'steady',
      };
    })
    .filter((insight): insight is NonNullable<typeof insight> => insight != null)
    .sort((left, right) => Math.abs(right.delta) - Math.abs(left.delta))
    .slice(0, 3);

  return {
    period,
    ranges: {
      currentStart: new Date(currentStart).toISOString(),
      previousStart: new Date(previousStart).toISOString(),
      currentDays: days,
    },
    comparisons: [
      buildComparison('mood', 'Average mood', '/ 5', currentMood, previousMood),
      buildComparison('sleep', 'Sleep average', 'hours', currentSleep, previousSleep),
      buildComparison('hydration', 'Hydration', 'glasses', currentHydration, previousHydration),
      buildComparison('completion', 'Completion rate', '%', currentCompletion, previousCompletion),
    ],
    behaviorInsights,
    dataQuality: {
      currentEntries: currentEntries.length,
      previousEntries: previousEntries.length,
      moodDays: moodEntries.length,
      hasComparison: currentEntries.length > 0 && previousEntries.length > 0,
      hasBehaviorInsights: behaviorInsights.length > 0,
    },
  };
};
