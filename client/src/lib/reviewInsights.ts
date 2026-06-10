import { format, isAfter, isBefore, parseISO, startOfDay, subDays } from 'date-fns';
import type { DailyEntry, EntryTodoItem } from '@/types/entry';

export interface DailyScorecard {
  closureScore: number;
  completedTasks: number;
  totalTasks: number;
  taskCompletion: number;
  completedPractices: number;
  totalPractices: number;
  selfCareActions: number;
  mood: number | null;
  energy: number | null;
}

export interface DailyChange {
  label: string;
  text: string;
  icon: string;
}

export interface CarryForwardSuggestion {
  id: string;
  text: string;
  source: 'task' | 'priority' | 'pattern';
  detail: string;
}

export interface WeeklyReview {
  daysLogged: number;
  closureDays: number;
  completedTasks: number;
  totalTasks: number;
  taskCompletion: number;
  averageMood: number | null;
  averageEnergy: number | null;
  strongestDay: string | null;
  recurringUnfinished: string[];
  highlights: string[];
  narrative: string;
}

const CARRY_FORWARD_MARKER = '--- Carry forward ---';
const CARRY_FORWARD_END_MARKER = '--- End carry forward ---';

const clean = (value?: string | null) => value?.trim() || '';
const cleanTasks = (tasks: EntryTodoItem[] = []) => tasks.filter((task) => clean(task.text));
const average = (values: Array<number | null | undefined>) => {
  const available = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  if (!available.length) return null;
  return Math.round((available.reduce((sum, value) => sum + value, 0) / available.length) * 10) / 10;
};

const pluralize = (count: number, singular: string, plural = `${singular}s`) => (
  `${count} ${count === 1 ? singular : plural}`
);

const includesSimilarText = (items: string[], candidate: string) => {
  const normalizedCandidate = clean(candidate).toLocaleLowerCase();
  return items.some((item) => {
    const normalizedItem = clean(item).toLocaleLowerCase();
    return normalizedItem === normalizedCandidate
      || normalizedItem.includes(normalizedCandidate)
      || normalizedCandidate.includes(normalizedItem);
  });
};

export const buildDailyScorecard = (entry: DailyEntry): DailyScorecard => {
  const tasks = cleanTasks(entry.todoList);
  const completedTasks = tasks.filter((task) => task.completed).length;
  const taskCompletion = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const completedPractices = new Set(entry.completedSections.filter((section) => section !== 'review')).size;
  const totalPractices = 3;
  const selfCareActions = Object.values(entry.selfCareChecklist).filter(Boolean).length
    + entry.customSelfCareChecklist.filter((item) => item.completed).length;

  const taskScore = tasks.length ? taskCompletion : 0;
  const practiceScore = Math.round((completedPractices / totalPractices) * 100);
  const careScore = Math.min(100, selfCareActions * 20);
  const reflectionScore = clean(entry.mindfulnessNotes) || clean(entry.mindThoughts) ? 100 : 0;
  const closureScore = Math.round(
    (taskScore * 0.4)
    + (practiceScore * 0.25)
    + (careScore * 0.2)
    + (reflectionScore * 0.15)
  );

  return {
    closureScore,
    completedTasks,
    totalTasks: tasks.length,
    taskCompletion,
    completedPractices,
    totalPractices,
    selfCareActions,
    mood: entry.mood,
    energy: entry.ratings.energyPoint,
  };
};

export const buildWhatChangedToday = (entry: DailyEntry): DailyChange[] => {
  const tasks = cleanTasks(entry.todoList);
  const completedTaskNames = tasks.filter((task) => task.completed).map((task) => clean(task.text));
  const startingPoint = clean(entry.focus) || clean(entry.expectations) || clean(entry.priorities[0]);
  const wins = [
    ...completedTaskNames,
    ...entry.goodThingsHappened.map(clean),
    ...entry.positiveNotes.map(clean),
  ].filter(Boolean);
  const changes: DailyChange[] = [];

  if (startingPoint) {
    changes.push({
      label: 'Intention',
      text: completedTaskNames.length
        ? `You began with "${startingPoint}" and moved ${pluralize(completedTaskNames.length, 'task')} across the finish line.`
        : `You began with "${startingPoint}". The intention is captured even if the day moved differently.`,
      icon: 'near_me',
    });
  }

  if (wins.length) {
    changes.push({
      label: 'Progress',
      text: wins.length === 1
        ? `One clear win stood out: ${wins[0]}.`
        : `${pluralize(wins.length, 'win')} were captured, including ${wins.slice(0, 2).join(' and ')}.`,
      icon: 'trending_up',
    });
  }

  if (entry.feeling || entry.mood != null || entry.ratings.overall != null) {
    const feeling = clean(entry.feeling)?.replace(/_/g, ' ');
    const rating = entry.ratings.overall ?? entry.mood;
    changes.push({
      label: 'Inner weather',
      text: feeling
        ? `You closed the day feeling ${feeling}${rating != null ? `, with a ${rating}/5 overall read` : ''}.`
        : `Your closing read was ${rating}/5. That gives this day a useful emotional marker.`,
      icon: 'partly_cloudy_day',
    });
  }

  const careActions = Object.values(entry.selfCareChecklist).filter(Boolean).length
    + entry.customSelfCareChecklist.filter((item) => item.completed).length;
  if (careActions) {
    changes.push({
      label: 'Care',
      text: `You recorded ${pluralize(careActions, 'restorative action')}. Small acts of care changed the shape of the day.`,
      icon: 'spa',
    });
  }

  if (!changes.length) {
    changes.push({
      label: 'First signal',
      text: 'There is not enough detail to compare the start and end of today yet. Add an intention, a task, or a mood check-in to create the first signal.',
      icon: 'edit_note',
    });
  }

  return changes.slice(0, 4);
};

export const buildCarryForwardSuggestions = (
  entry: DailyEntry,
  recentEntries: DailyEntry[] = [],
): CarryForwardSuggestion[] => {
  const currentTasks = cleanTasks(entry.todoList);
  const unfinishedTasks = currentTasks.filter((task) => !task.completed).map((task) => clean(task.text));
  const completedTasks = currentTasks.filter((task) => task.completed).map((task) => clean(task.text));
  const suggestions: CarryForwardSuggestion[] = unfinishedTasks.map((text, index) => ({
    id: `task-${entry.todoList.find((task) => clean(task.text) === text)?.id || index}`,
    text,
    source: 'task',
    detail: 'Unfinished today',
  }));

  entry.priorities
    .map(clean)
    .filter(Boolean)
    .filter((priority) => !includesSimilarText(completedTasks, priority))
    .filter((priority) => !includesSimilarText(unfinishedTasks, priority))
    .forEach((priority, index) => {
      suggestions.push({
        id: `priority-${index}-${priority.toLocaleLowerCase()}`,
        text: priority,
        source: 'priority',
        detail: 'Priority without a completed task',
      });
    });

  const unfinishedCounts = new Map<string, { text: string; count: number }>();
  recentEntries.forEach((recentEntry) => {
    cleanTasks(recentEntry.todoList)
      .filter((task) => !task.completed)
      .forEach((task) => {
        const text = clean(task.text);
        const key = text.toLocaleLowerCase();
        const current = unfinishedCounts.get(key) || { text, count: 0 };
        unfinishedCounts.set(key, { text: current.text, count: current.count + 1 });
      });
  });

  [...unfinishedCounts.values()]
    .filter((item) => item.count >= 2)
    .filter((item) => !includesSimilarText(suggestions.map((suggestion) => suggestion.text), item.text))
    .sort((left, right) => right.count - left.count)
    .slice(0, 2)
    .forEach((item, index) => {
      suggestions.push({
        id: `pattern-${index}-${item.text.toLocaleLowerCase()}`,
        text: item.text,
        source: 'pattern',
        detail: `Unfinished on ${item.count} recent days`,
      });
    });

  return suggestions.slice(0, 8);
};

export const extractCarryForwardItems = (value?: string | null): string[] => {
  const text = value || '';
  const startIndex = text.indexOf(CARRY_FORWARD_MARKER);
  const endIndex = text.indexOf(CARRY_FORWARD_END_MARKER);
  if (startIndex < 0 || endIndex <= startIndex) return [];

  return text
    .slice(startIndex + CARRY_FORWARD_MARKER.length, endIndex)
    .split('\n')
    .map((line) => line.replace(/^\s*-\s*/, '').trim())
    .filter(Boolean);
};

export const replaceCarryForwardBlock = (value: string | undefined, items: string[]) => {
  const text = value || '';
  const blockPattern = new RegExp(
    `${CARRY_FORWARD_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${CARRY_FORWARD_END_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
    'g'
  );
  const preserved = text.replace(blockPattern, '').trim();
  const cleanedItems = items.map(clean).filter(Boolean);
  if (!cleanedItems.length) return preserved;

  const block = [
    CARRY_FORWARD_MARKER,
    ...cleanedItems.map((item) => `- ${item}`),
    CARRY_FORWARD_END_MARKER,
  ].join('\n');

  return [preserved, block].filter(Boolean).join('\n\n');
};

export const buildWeeklyReview = (
  entries: DailyEntry[],
  now = new Date(),
): WeeklyReview => {
  const windowStart = startOfDay(subDays(now, 6));
  const windowEnd = startOfDay(now);
  const weekEntries = entries
    .filter((entry) => {
      const date = startOfDay(parseISO(entry.date.slice(0, 10)));
      return !isBefore(date, windowStart) && !isAfter(date, windowEnd);
    })
    .sort((left, right) => left.date.localeCompare(right.date));

  const allTasks = weekEntries.flatMap((entry) => cleanTasks(entry.todoList));
  const completedTasks = allTasks.filter((task) => task.completed).length;
  const taskCompletion = allTasks.length ? Math.round((completedTasks / allTasks.length) * 100) : 0;
  const closureDays = weekEntries.filter((entry) => entry.completedSections.includes('review')).length;
  const averageMood = average(weekEntries.map((entry) => entry.mood));
  const averageEnergy = average(weekEntries.map((entry) => entry.ratings.energyPoint));

  const unfinishedCounts = new Map<string, { text: string; count: number }>();
  weekEntries.forEach((entry) => {
    cleanTasks(entry.todoList)
      .filter((task) => !task.completed)
      .forEach((task) => {
        const text = clean(task.text);
        const key = text.toLocaleLowerCase();
        const current = unfinishedCounts.get(key) || { text, count: 0 };
        unfinishedCounts.set(key, { text: current.text, count: current.count + 1 });
      });
  });

  const recurringUnfinished = [...unfinishedCounts.values()]
    .sort((left, right) => right.count - left.count)
    .slice(0, 3)
    .map((item) => item.text);

  const highlights = weekEntries
    .flatMap((entry) => [
      ...entry.goodThingsHappened.map(clean),
      ...entry.positiveNotes.map(clean),
    ])
    .filter(Boolean)
    .slice(0, 3);

  const strongestEntry = weekEntries.reduce<DailyEntry | null>((best, entry) => {
    const entryScore = cleanTasks(entry.todoList).filter((task) => task.completed).length * 2
      + Object.values(entry.selfCareChecklist).filter(Boolean).length
      + entry.customSelfCareChecklist.filter((item) => item.completed).length
      + (entry.ratings.overall || entry.mood || 0);
    if (!best) return entry;
    const bestScore = cleanTasks(best.todoList).filter((task) => task.completed).length * 2
      + Object.values(best.selfCareChecklist).filter(Boolean).length
      + best.customSelfCareChecklist.filter((item) => item.completed).length
      + (best.ratings.overall || best.mood || 0);
    return entryScore > bestScore ? entry : best;
  }, null);

  let narrative = 'Your weekly review will take shape after the first saved check-in.';
  if (weekEntries.length) {
    const completionRead = allTasks.length
      ? `You completed ${completedTasks} of ${allTasks.length} planned tasks`
      : 'You focused more on reflection than task tracking';
    const closureRead = closureDays
      ? `and closed ${pluralize(closureDays, 'day')} intentionally`
      : 'and have an opportunity to add a first end-of-day closure';
    narrative = `${completionRead} ${closureRead}. ${
      recurringUnfinished.length
        ? `The clearest carry-forward theme is "${recurringUnfinished[0]}".`
        : 'No repeated unfinished task dominated the week.'
    }`;
  }

  return {
    daysLogged: new Set(weekEntries.map((entry) => entry.date.slice(0, 10))).size,
    closureDays,
    completedTasks,
    totalTasks: allTasks.length,
    taskCompletion,
    averageMood,
    averageEnergy,
    strongestDay: strongestEntry ? format(parseISO(strongestEntry.date.slice(0, 10)), 'EEEE') : null,
    recurringUnfinished,
    highlights,
    narrative,
  };
};
