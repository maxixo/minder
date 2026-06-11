import { format, parseISO } from 'date-fns';
import type { DailyEntry } from '@/types/entry';

export interface SavedCopingPlan {
  id: string;
  strategies: string[];
  uses: number;
  lastUsed: string;
  averageMood: number | null;
}

export interface PriorCopingRecall {
  date: string;
  feelings: string;
  strategies: string[];
  closingReflection: string;
  mood: number | null;
  matchingThemes: string[];
}

export interface RecurringEmotionalTrigger {
  id: string;
  label: string;
  count: number;
  lastSeen: string;
}

export interface CopingPattern {
  strategy: string;
  uses: number;
  moodSamples: number;
  averageMood: number | null;
  lastUsed: string;
  closingReflections: number;
}

export interface ReassuranceSummary {
  title: string;
  message: string;
}

interface EmotionalContext {
  whereYouAre?: string;
  feelings?: string;
  thoughts?: string;
}

const triggerDefinitions = [
  {
    id: 'work-pressure',
    label: 'Work or deadline pressure',
    keywords: ['work', 'job', 'boss', 'meeting', 'deadline', 'project', 'email', 'office', 'client', 'school', 'exam', 'study'],
  },
  {
    id: 'relationship-tension',
    label: 'Relationship tension',
    keywords: ['partner', 'friend', 'family', 'relationship', 'argument', 'conflict', 'misunderstood', 'conversation'],
  },
  {
    id: 'uncertainty',
    label: 'Uncertainty or change',
    keywords: ['uncertain', 'uncertainty', 'change', 'decision', 'future', 'unknown', 'waiting', 'worried', 'anxious'],
  },
  {
    id: 'low-energy',
    label: 'Low energy or rest',
    keywords: ['tired', 'exhausted', 'sleep', 'rest', 'drained', 'fatigue', 'burnout', 'overworked'],
  },
  {
    id: 'connection',
    label: 'Loneliness or disconnection',
    keywords: ['alone', 'lonely', 'isolated', 'disconnected', 'left out', 'unsupported'],
  },
  {
    id: 'overwhelm',
    label: 'Overwhelm or self-pressure',
    keywords: ['overwhelmed', 'pressure', 'too much', 'behind', 'failure', 'perfect', 'perfection', 'stuck', 'cannot cope'],
  },
  {
    id: 'health',
    label: 'Health concerns',
    keywords: ['health', 'pain', 'sick', 'illness', 'doctor', 'hospital', 'symptom', 'recovery'],
  },
  {
    id: 'finances',
    label: 'Financial pressure',
    keywords: ['money', 'financial', 'finance', 'bill', 'rent', 'debt', 'expense', 'income'],
  },
] as const;

const stopWords = new Set([
  'about', 'after', 'again', 'also', 'and', 'are', 'because', 'been', 'before', 'but', 'can', 'could',
  'feel', 'feeling', 'for', 'from', 'have', 'here', 'into', 'just', 'like', 'more', 'not', 'now', 'really',
  'that', 'the', 'their', 'there', 'they', 'think', 'this', 'today', 'too', 'very', 'want', 'was', 'were',
  'what', 'when', 'where', 'which', 'with', 'would', 'you', 'your',
]);

const clean = (value?: string | null) => value?.trim() || '';
const toDateKey = (value: string) => value.slice(0, 10);
const toTimestamp = (value: string) => Date.parse(value) || 0;
const roundOne = (value: number) => Math.round(value * 10) / 10;
const average = (values: number[]) => (
  values.length ? roundOne(values.reduce((sum, value) => sum + value, 0) / values.length) : null
);

const uniqueCaseInsensitive = (items: string[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.toLocaleLowerCase();
    if (!item || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const parseCopingMethods = (value?: string | null) => (
  uniqueCaseInsensitive(
    clean(value)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  )
);

const emotionalText = (entry: DailyEntry) => [
  entry.emotionalGuidance.whereAreYou,
  entry.emotionalGuidance.howYoureFeeling,
  entry.emotionalGuidance.whatYoureThinking,
].map(clean).filter(Boolean).join(' ');

const contextText = (context: EmotionalContext) => [
  context.whereYouAre,
  context.feelings,
  context.thoughts,
].map(clean).filter(Boolean).join(' ');

const hasEmotionalHistory = (entry: DailyEntry) => (
  entry.completedSections.includes('emotional')
  || Boolean(emotionalText(entry))
  || parseCopingMethods(entry.emotionalGuidance.copingMethod).length > 0
);

const matchesKeyword = (text: string, keyword: string) => (
  new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')}\\b`, 'i').test(text)
);

const detectThemeIds = (text: string) => {
  const normalized = clean(text).toLocaleLowerCase();
  if (!normalized) return [];
  return triggerDefinitions
    .filter((definition) => definition.keywords.some((keyword) => matchesKeyword(normalized, keyword)))
    .map((definition) => definition.id);
};

const extractMeaningfulWords = (text: string) => (
  uniqueCaseInsensitive(
    clean(text)
      .toLocaleLowerCase()
      .match(/[a-z]{4,}/g)
      ?.filter((word) => !stopWords.has(word)) || []
  )
);

const formatEntryDate = (date: string) => format(parseISO(toDateKey(date)), 'MMM d, yyyy');

export const buildSavedCopingPlans = (entries: DailyEntry[]): SavedCopingPlan[] => {
  const plans = new Map<string, {
    strategies: string[];
    uses: number;
    lastUsed: string;
    moods: number[];
  }>();

  [...entries]
    .filter(hasEmotionalHistory)
    .sort((left, right) => toTimestamp(right.date) - toTimestamp(left.date))
    .forEach((entry) => {
      const strategies = parseCopingMethods(entry.emotionalGuidance.copingMethod);
      if (!strategies.length) return;

      const id = strategies.map((strategy) => strategy.toLocaleLowerCase()).sort().join('|');
      const current = plans.get(id);

      if (!current) {
        plans.set(id, {
          strategies,
          uses: 1,
          lastUsed: entry.date,
          moods: entry.mood == null ? [] : [entry.mood],
        });
        return;
      }

      current.uses += 1;
      if (entry.mood != null) current.moods.push(entry.mood);
    });

  return [...plans.entries()]
    .map(([id, plan]) => ({
      id,
      strategies: plan.strategies,
      uses: plan.uses,
      lastUsed: plan.lastUsed,
      averageMood: average(plan.moods),
    }))
    .sort((left, right) => (
      right.uses - left.uses || toTimestamp(right.lastUsed) - toTimestamp(left.lastUsed)
    ));
};

export const findPriorCopingRecall = (
  entries: DailyEntry[],
  currentDate: string,
  context: EmotionalContext,
): PriorCopingRecall | null => {
  const currentContextText = contextText(context);
  const hasCurrentContext = Boolean(currentContextText);
  const currentThemes = detectThemeIds(currentContextText);
  const currentWords = new Set(extractMeaningfulWords(currentContextText));

  const candidates = entries
    .filter(hasEmotionalHistory)
    .filter((entry) => toDateKey(entry.date) !== toDateKey(currentDate))
    .map((entry) => {
      const strategies = parseCopingMethods(entry.emotionalGuidance.copingMethod);
      if (!strategies.length) return null;

      const candidateText = emotionalText(entry);
      const candidateThemes = detectThemeIds(candidateText);
      const sharedThemes = candidateThemes.filter((theme) => currentThemes.includes(theme));
      const sharedWords = extractMeaningfulWords(candidateText).filter((word) => currentWords.has(word));
      const closingReflection = clean(entry.emotionalGuidance.feelingBeforeGo);
      const score = (sharedThemes.length * 4)
        + Math.min(sharedWords.length, 3)
        + (hasCurrentContext && closingReflection ? 1 : 0);

      return {
        entry,
        strategies,
        closingReflection,
        sharedThemes,
        score,
      };
    })
    .filter((candidate): candidate is NonNullable<typeof candidate> => Boolean(candidate))
    .sort((left, right) => (
      right.score - left.score || toTimestamp(right.entry.date) - toTimestamp(left.entry.date)
    ));

  const match = candidates[0];
  if (!match) return null;

  return {
    date: match.entry.date,
    feelings: clean(match.entry.emotionalGuidance.howYoureFeeling),
    strategies: match.strategies,
    closingReflection: match.closingReflection,
    mood: match.entry.mood,
    matchingThemes: triggerDefinitions
      .filter((definition) => match.sharedThemes.includes(definition.id))
      .map((definition) => definition.label),
  };
};

export const buildRecurringTriggers = (entries: DailyEntry[]): RecurringEmotionalTrigger[] => {
  const triggerHistory = new Map<string, { count: number; lastSeen: string }>();

  [...entries]
    .filter(hasEmotionalHistory)
    .sort((left, right) => toTimestamp(right.date) - toTimestamp(left.date))
    .forEach((entry) => {
      detectThemeIds(emotionalText(entry)).forEach((id) => {
        const current = triggerHistory.get(id);
        triggerHistory.set(id, {
          count: (current?.count || 0) + 1,
          lastSeen: current?.lastSeen || entry.date,
        });
      });
    });

  return triggerDefinitions
    .map((definition) => {
      const history = triggerHistory.get(definition.id);
      if (!history || history.count < 2) return null;
      return {
        id: definition.id,
        label: definition.label,
        count: history.count,
        lastSeen: history.lastSeen,
      };
    })
    .filter((trigger) => trigger !== null)
    .sort((left, right) => (
      right.count - left.count || toTimestamp(right.lastSeen) - toTimestamp(left.lastSeen)
    ))
    .slice(0, 4);
};

export const buildCopingPatterns = (entries: DailyEntry[]): CopingPattern[] => {
  const patterns = new Map<string, {
    strategy: string;
    uses: number;
    moods: number[];
    lastUsed: string;
    closingReflections: number;
  }>();

  [...entries]
    .filter(hasEmotionalHistory)
    .sort((left, right) => toTimestamp(right.date) - toTimestamp(left.date))
    .forEach((entry) => {
      parseCopingMethods(entry.emotionalGuidance.copingMethod).forEach((strategy) => {
        const key = strategy.toLocaleLowerCase();
        const current = patterns.get(key) || {
          strategy,
          uses: 0,
          moods: [],
          lastUsed: entry.date,
          closingReflections: 0,
        };
        current.uses += 1;
        if (entry.mood != null) current.moods.push(entry.mood);
        if (clean(entry.emotionalGuidance.feelingBeforeGo)) current.closingReflections += 1;
        patterns.set(key, current);
      });
    });

  return [...patterns.values()]
    .map((pattern) => ({
      strategy: pattern.strategy,
      uses: pattern.uses,
      moodSamples: pattern.moods.length,
      averageMood: average(pattern.moods),
      lastUsed: pattern.lastUsed,
      closingReflections: pattern.closingReflections,
    }))
    .sort((left, right) => (
      right.uses - left.uses
      || (right.averageMood || 0) - (left.averageMood || 0)
      || toTimestamp(right.lastUsed) - toTimestamp(left.lastUsed)
    ))
    .slice(0, 6);
};

export const buildReassuranceSummary = (
  entry: DailyEntry,
  historyEntries: DailyEntry[],
): ReassuranceSummary => {
  const strategies = parseCopingMethods(entry.emotionalGuidance.copingMethod);
  const closingReflection = clean(entry.emotionalGuidance.feelingBeforeGo);
  const priorStrategyUses = historyEntries
    .filter((historyEntry) => toDateKey(historyEntry.date) !== toDateKey(entry.date))
    .filter((historyEntry) => {
      const priorStrategies = parseCopingMethods(historyEntry.emotionalGuidance.copingMethod);
      return strategies.some((strategy) => (
        priorStrategies.some((priorStrategy) => priorStrategy.toLocaleLowerCase() === strategy.toLocaleLowerCase())
      ));
    }).length;

  if (closingReflection) {
    const supportLabel = strategies.length ? strategies.join(', ') : 'a supportive next step';
    return {
      title: 'You gave this moment a closing note.',
      message: `You chose ${supportLabel} and noticed: "${closingReflection.slice(0, 140)}${closingReflection.length > 140 ? '...' : ''}"`,
    };
  }

  if (strategies.length) {
    return {
      title: 'You have a plan to return to.',
      message: priorStrategyUses
        ? `You chose ${strategies.join(', ')}. Parts of this plan also appeared in ${priorStrategyUses} earlier check-in${priorStrategyUses === 1 ? '' : 's'}.`
        : `You chose ${strategies.join(', ')}. This coping plan is now saved with today's check-in for future recall.`,
    };
  }

  return {
    title: 'Naming the moment still counts.',
    message: 'You paused long enough to notice what is present. You can return later to add a coping plan when one feels useful.',
  };
};

export const formatEmotionalHistoryDate = formatEntryDate;
