import { useEffect, useMemo, useState } from 'react';
import { endOfWeek, format, parseISO, startOfWeek } from 'date-fns';
import clsx from 'clsx';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import { useDailyEntry } from '@/hooks/useDailyEntry';
import {
  buildCopingPatterns,
  buildRecurringTriggers,
  buildReassuranceSummary,
  buildSavedCopingPlans,
  findPriorCopingRecall,
  formatEmotionalHistoryDate,
  parseCopingMethods,
  type ReassuranceSummary,
} from '@/lib/emotionalGuidanceInsights';
import entryService from '@/services/entryService';
import type { DailyEntry, DailyEntryPatch } from '@/types/entry';

const weekConfig = [
  { key: 'mon', day: 'Mon' },
  { key: 'tue', day: 'Tue' },
  { key: 'wed', day: 'Wed' },
  { key: 'thu', day: 'Thu' },
  { key: 'fri', day: 'Fri' },
  { key: 'sat', day: 'Sat' },
  { key: 'sun', day: 'Sun' },
] as const;

const copingStrategies = [
  { icon: 'air', label: 'Deep Breathing' },
  { icon: 'directions_walk', label: 'Short Walk' },
  { icon: 'music_note', label: 'Listen to Music' },
  { icon: 'self_improvement', label: '5-Min Meditation' },
  { icon: 'local_cafe', label: 'Mindful Tea' },
  { icon: 'call', label: 'Call or Text a Friend' },
  { icon: 'menu_book', label: 'Journaling' },
  { icon: 'bedtime', label: 'Short Rest' },
  { icon: 'spa', label: 'Stretching' },
  { icon: 'wb_sunny', label: 'Step Outside for Sunlight' },
  { icon: 'headphones', label: 'Noise-Canceling Break' },
];
const MAX_COPING_METHOD_LENGTH = 280;
const MAX_CUSTOM_STRATEGY_LENGTH = 60;
const defaultCopingStrategyLabels = new Set(copingStrategies.map((strategy) => strategy.label.toLocaleLowerCase()));

type WeekKey = (typeof weekConfig)[number]['key'];

const emptyWeek = (): Record<WeekKey, boolean> => ({
  mon: false,
  tue: false,
  wed: false,
  thu: false,
  fri: false,
  sat: false,
  sun: false,
});

const weekdayKeyByIndex: Record<number, WeekKey> = {
  0: 'sun',
  1: 'mon',
  2: 'tue',
  3: 'wed',
  4: 'thu',
  5: 'fri',
  6: 'sat',
};

const toDateParam = (date: Date) => format(date, 'yyyy-MM-dd');

export default function EmotionalGuidance() {
  const { user } = useAuth();
  const { entry, error, loading, saveEntryPatch, saving } = useDailyEntry();
  const [historyEntries, setHistoryEntries] = useState<DailyEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const [whereYouAre, setWhereYouAre] = useState('');
  const [feelings, setFeelings] = useState('');
  const [thoughts, setThoughts] = useState('');
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  const [customStrategies, setCustomStrategies] = useState<string[]>([]);
  const [customStrategyInput, setCustomStrategyInput] = useState('');
  const [feelingBeforeGo, setFeelingBeforeGo] = useState('');
  const [reassuranceSummary, setReassuranceSummary] = useState<ReassuranceSummary | null>(null);

  const firstName = user?.name?.split(' ')[0] || 'Friend';
  const weekRange = useMemo(() => {
    const now = new Date();
    return {
      start: startOfWeek(now, { weekStartsOn: 1 }),
      end: endOfWeek(now, { weekStartsOn: 1 }),
    };
  }, []);
  const week = useMemo(() => {
    const checkedDays = emptyWeek();
    const startDate = toDateParam(weekRange.start);
    const endDate = toDateParam(weekRange.end);

    historyEntries.forEach((historyEntry) => {
      const dateKey = historyEntry.date.slice(0, 10);
      if (dateKey < startDate || dateKey > endDate || !historyEntry.completedSections.includes('emotional')) return;
      const date = parseISO(dateKey);
      checkedDays[weekdayKeyByIndex[date.getDay()]] = true;
    });

    return checkedDays;
  }, [historyEntries, weekRange]);
  const completedDays = Object.values(week).filter(Boolean).length;
  const currentDayKey = weekdayKeyByIndex[new Date().getDay()];
  const savedCopingPlans = useMemo(() => buildSavedCopingPlans(historyEntries), [historyEntries]);
  const recurringTriggers = useMemo(() => buildRecurringTriggers(historyEntries), [historyEntries]);
  const copingPatterns = useMemo(() => buildCopingPatterns(historyEntries), [historyEntries]);
  const priorCopingRecall = useMemo(() => findPriorCopingRecall(
    historyEntries,
    entry?.date || new Date().toISOString(),
    { whereYouAre, feelings, thoughts }
  ), [entry?.date, feelings, historyEntries, thoughts, whereYouAre]);
  const sharePath = useMemo(() => {
    const params = new URLSearchParams({
      date: toDateParam(new Date()),
      from: 'emotional',
    });
    selectedStrategies.forEach((strategy) => params.append('ritual', strategy));
    return `/share?${params.toString()}`;
  }, [selectedStrategies]);

  useEffect(() => {
    let cancelled = false;

    const loadEmotionalHistory = async () => {
      setHistoryLoading(true);
      setHistoryError('');

      try {
        const response = await entryService.getEntries({
          limit: 60,
        });
        if (!cancelled) setHistoryEntries(response.data);
      } catch (loadError: any) {
        if (!cancelled) {
          setHistoryEntries([]);
          setHistoryError(loadError?.response?.data?.message || 'Emotional check-in history could not be loaded.');
        }
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    };

    void loadEmotionalHistory();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!entry) return;

    setWhereYouAre(entry.emotionalGuidance?.whereAreYou || '');
    setFeelings(entry.emotionalGuidance?.howYoureFeeling || '');
    setThoughts(entry.emotionalGuidance?.whatYoureThinking || '');
    const savedStrategies = parseCopingMethods(entry.emotionalGuidance?.copingMethod);
    setSelectedStrategies(savedStrategies);
    setCustomStrategies(savedStrategies.filter(
      (strategy) => !defaultCopingStrategyLabels.has(strategy.toLocaleLowerCase())
    ));
    setCustomStrategyInput('');
    setFeelingBeforeGo(entry.emotionalGuidance?.feelingBeforeGo || '');
  }, [entry]);

  const toggleStrategy = (label: string) => {
    setSelectedStrategies((current) => (
      current.includes(label)
        ? current.filter((item) => item !== label)
        : [...current, label]
    ));
  };

  const handleAddCustomStrategy = () => {
    const strategy = customStrategyInput.trim().replace(/,+/g, ' ');
    if (!strategy) return;

    if (strategy.length > MAX_CUSTOM_STRATEGY_LENGTH) {
      toast.error(`Custom strategies must be ${MAX_CUSTOM_STRATEGY_LENGTH} characters or fewer.`);
      return;
    }

    const existingStrategies = [...copingStrategies.map((item) => item.label), ...customStrategies];
    const existingStrategy = existingStrategies.find(
      (item) => item.toLocaleLowerCase() === strategy.toLocaleLowerCase()
    );
    const strategyToSelect = existingStrategy || strategy;
    const nextSelected = selectedStrategies.some(
      (item) => item.toLocaleLowerCase() === strategyToSelect.toLocaleLowerCase()
    )
      ? selectedStrategies
      : [...selectedStrategies, strategyToSelect];

    if (nextSelected.join(', ').length > MAX_COPING_METHOD_LENGTH) {
      toast.error('Remove another strategy before adding this one.');
      return;
    }

    if (!existingStrategy) {
      setCustomStrategies((current) => [...current, strategy]);
    }
    setSelectedStrategies(nextSelected);
    setCustomStrategyInput('');
  };

  const applyCopingPlan = (strategies: string[]) => {
    if (strategies.join(', ').length > MAX_COPING_METHOD_LENGTH) {
      toast.error('This saved plan is too long to use as one coping plan.');
      return;
    }

    const customPlanStrategies = strategies.filter(
      (strategy) => !defaultCopingStrategyLabels.has(strategy.toLocaleLowerCase())
    );
    setSelectedStrategies(strategies);
    setCustomStrategies((current) => Array.from(new Set([...current, ...customPlanStrategies])));
    toast.success('Saved coping plan is ready');
  };

  const handleSave = async () => {
    const copingMethod = selectedStrategies.join(', ');
    if (copingMethod.length > MAX_COPING_METHOD_LENGTH) {
      toast.error('Selected coping strategies are too long. Remove one before saving.');
      return;
    }

    const patch: DailyEntryPatch = {
      emotionalGuidance: {
        whereAreYou: whereYouAre.trim(),
        howYoureFeeling: feelings.trim(),
        whatYoureThinking: thoughts.trim(),
        copingMethod,
        feelingBeforeGo: feelingBeforeGo.trim(),
      },
    };

    try {
      const savedEntry = await saveEntryPatch(patch, 'emotional');
      setHistoryEntries((current) => [
        savedEntry,
        ...current.filter((historyEntry) => historyEntry.date.slice(0, 10) !== savedEntry.date.slice(0, 10)),
      ]);
      setReassuranceSummary(buildReassuranceSummary(savedEntry, historyEntries));
      toast.success('Emotional reflection saved');
    } catch (saveError: any) {
      toast.error(saveError?.response?.data?.message || 'Unable to save emotional reflection');
    }
  };

  return (
    <div className="-mx-4 min-h-full bg-[#f6f8f7] px-4 text-slate-900 [&_.font-display]:font-body [&_h1]:font-body [&_h2]:font-body [&_h3]:font-body [&_h4]:font-body [&_h5]:font-body [&_h6]:font-body sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 dark:bg-[#0f1712] dark:text-sage-50">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 py-2 animate-fade-in">
        <section className="overflow-hidden rounded-[2rem] border border-sage-100 bg-gradient-to-br from-white via-sand-50 to-sage-50 shadow-soft dark:border-white/10 dark:bg-gradient-to-br dark:from-[#18231d] dark:via-[#121b16] dark:to-[#0f1712]">
          <div className="flex flex-col gap-6 px-6 py-8 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-10">
            <div className="max-w-3xl">
              <p className="text-xs font-medium uppercase tracking-[0.32em] text-sage-500 dark:text-sage-300">Emotional Guidance</p>
              <h1 className="compact-hero-title mt-3 font-display text-sage-900 dark:text-sage-50">
                A softer check-in for {firstName}
              </h1>
              <p className="compact-lead mt-4 max-w-2xl text-sage-600 dark:text-sage-200">
                A sanctuary for your daily mindfulness and self-reflection. Name what is present, notice what you need,
                and choose one gentle way to support yourself.
              </p>
            </div>

            <div className="flex flex-col gap-3 rounded-[1.5rem] border border-sage-100 bg-white/80 p-5 shadow-sm backdrop-blur sm:min-w-[240px] dark:border-white/10 dark:bg-white/5">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-sage-500 dark:text-sage-300">Weekly Rhythm</p>
              <p className="compact-display-value font-display text-sage-800 dark:text-sage-50">{completedDays}/7 days</p>
              <p className="text-sm text-sage-500 dark:text-sage-300">Small, steady moments of awareness count more than perfect streaks.</p>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="rounded-[1.5rem] border border-sage-100 bg-white px-5 py-4 text-sm font-medium text-sage-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-sage-200">
            Loading today&apos;s emotional guidance check-in...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-800 shadow-sm">
            {error}
          </div>
        ) : null}

        {reassuranceSummary ? (
          <section
            aria-live="polite"
            className="rounded-[1.75rem] border border-sage-200 bg-gradient-to-r from-sage-800 to-sage-700 px-6 py-6 text-white shadow-soft sm:px-8"
          >
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                <span className="material-symbols-outlined">favorite</span>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-sage-100/70">Check-in saved</p>
                <h2 className="compact-section-title mt-2">{reassuranceSummary.title}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-sage-50/85">{reassuranceSummary.message}</p>
              </div>
            </div>
          </section>
        ) : null}

        <section className="rounded-[1.75rem] border border-sage-100 bg-white p-6 shadow-soft sm:p-8 dark:border-white/10 dark:bg-white/5">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-sage-100 text-sage-700 dark:bg-white/10 dark:text-sage-100">
              <span className="material-symbols-outlined">calendar_month</span>
            </div>
            <div>
              <h2 className="font-display text-2xl font-medium text-sage-900 dark:text-sage-50">Weekly Consistency Tracker</h2>
              <p className="text-sm text-sage-500 dark:text-sage-300">
                Days are marked automatically when you save an emotional check-in.
              </p>
            </div>
          </div>

          {historyError ? (
            <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {historyError}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {weekConfig.map((item) => {
              const isCurrentDay = item.key === currentDayKey;
              const isChecked = week[item.key];

              return (
                <div
                  key={item.key}
                  className={clsx(
                    'flex flex-col items-center gap-3 rounded-2xl border p-4 transition-all',
                    isChecked ? 'border-sage-200 bg-sage-50 dark:border-sage-400/30 dark:bg-white/10' : 'border-sage-100 bg-sand-50/70 dark:border-white/10 dark:bg-[#101915]',
                    isCurrentDay && 'ring-2 ring-sage-300/60'
                  )}
                >
                  <span className={clsx(
                    'text-xs font-semibold uppercase tracking-[0.25em]',
                    isCurrentDay ? 'text-sage-700 dark:text-sage-100' : 'text-sage-500 dark:text-sage-400'
                  )}>
                    {item.day}
                  </span>
                  <span
                    aria-label={`${item.day} ${isChecked ? 'check-in completed' : 'check-in not completed'}`}
                    className={clsx(
                      'flex size-7 items-center justify-center rounded-full border-2',
                      isChecked
                        ? 'border-sage-600 bg-sage-600 text-white dark:border-sage-300 dark:bg-sage-300 dark:text-sage-900'
                        : 'border-sage-300 bg-white text-transparent dark:border-white/20 dark:bg-white/5'
                    )}
                    role="img"
                  >
                    <span className="material-symbols-outlined text-[18px]">check</span>
                  </span>
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-xs leading-5 text-sage-500 dark:text-sage-400">
            {historyLoading
              ? 'Syncing this week...'
              : `${completedDays} emotional check-in${completedDays === 1 ? '' : 's'} saved from ${format(weekRange.start, 'MMM d')} to ${format(weekRange.end, 'MMM d')}.`}
          </p>
        </section>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
          <div className="space-y-8 xl:col-span-2">
            <section className="rounded-[1.75rem] border border-sage-100 bg-white p-6 shadow-soft sm:p-8 lg:p-10 dark:border-white/10 dark:bg-white/5">
              <div className="mb-8 flex items-center justify-between gap-4 border-b border-sage-100 pb-4 dark:border-white/10">
                <div>
                  <h2 className="compact-section-title font-display text-sage-900 dark:text-sage-50">Emotional Check-In</h2>
                  <p className="mt-2 text-sm text-sage-500 dark:text-sage-300">Move slowly. Let each answer be true rather than polished.</p>
                </div>
                <div className="hidden rounded-full bg-sage-50 px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-sage-500 sm:block dark:bg-white/10 dark:text-sage-300">
                  Present Moment
                </div>
              </div>

              <div className="space-y-7">
                <div className="space-y-3">
                  <label className="font-display text-2xl italic text-sage-800 dark:text-sage-100" htmlFor="where-you-are">
                    Where are you right now?
                  </label>
                  <textarea
                    className="w-full resize-none rounded-3xl border border-sage-200 bg-sand-50 px-5 py-4 text-base text-slate-800 placeholder:text-sage-400 focus:border-sage-400 focus:ring-sage-200 dark:border-white/10 dark:bg-[#101915] dark:text-sage-50 dark:placeholder:text-sage-500"
                    id="where-you-are"
                    onChange={(event) => setWhereYouAre(event.target.value)}
                    placeholder="Describe your physical surroundings or mental state..."
                    rows={3}
                    value={whereYouAre}
                  />
                </div>

                <div className="space-y-3">
                  <label className="font-display text-2xl italic text-sage-800 dark:text-sage-100" htmlFor="feelings">
                    How are you feeling?
                  </label>
                  <textarea
                    className="w-full resize-none rounded-3xl border border-sage-200 bg-sand-50 px-5 py-4 text-base text-slate-800 placeholder:text-sage-400 focus:border-sage-400 focus:ring-sage-200 dark:border-white/10 dark:bg-[#101915] dark:text-sage-50 dark:placeholder:text-sage-500"
                    id="feelings"
                    onChange={(event) => setFeelings(event.target.value)}
                    placeholder="Acknowledge your emotions without judgment..."
                    rows={3}
                    value={feelings}
                  />
                </div>

                <div className="space-y-3">
                  <label className="font-display text-2xl italic text-sage-800 dark:text-sage-100" htmlFor="thoughts">
                    What are you thinking?
                  </label>
                  <textarea
                    className="w-full resize-none rounded-3xl border border-sage-200 bg-sand-50 px-5 py-4 text-base text-slate-800 placeholder:text-sage-400 focus:border-sage-400 focus:ring-sage-200 dark:border-white/10 dark:bg-[#101915] dark:text-sage-50 dark:placeholder:text-sage-500"
                    id="thoughts"
                    onChange={(event) => setThoughts(event.target.value)}
                    placeholder="The flow of thoughts currently passing through..."
                    rows={3}
                    value={thoughts}
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  className="inline-flex items-center gap-2 rounded-full bg-sage-700 px-6 py-3 font-semibold text-white transition-all hover:bg-sage-800 hover:shadow-lifted disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={loading || saving}
                  onClick={handleSave}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">save</span>
                  {saving ? 'Saving...' : 'Save Reflection'}
                </button>
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-sand-200 bg-sand-100/70 p-6 shadow-soft sm:p-8 dark:border-white/10 dark:bg-[#18231d]">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h3 className="compact-section-title font-display font-semibold text-sage-900 dark:text-sage-50">Coping Strategies</h3>
                  <p className="mt-2 text-sm text-sage-600 dark:text-sage-200">Pick as many supportive actions as you want to return to if your emotions start to swell.</p>
                </div>
                <div className="rounded-full bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-sage-500 dark:bg-white/10 dark:text-sage-300">
                  Grounding Tools
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {copingStrategies.map((strategy) => {
                  const isSelected = selectedStrategies.includes(strategy.label);

                  return (
                    <button
                      aria-pressed={isSelected}
                      key={strategy.label}
                      className={clsx(
                        'inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-all',
                        isSelected
                          ? 'border-sage-300 bg-white text-sage-800 shadow-sm dark:border-sage-400/30 dark:bg-white/10 dark:text-sage-50'
                          : 'border-sand-300 bg-sand-50 text-sage-700 hover:border-sage-200 hover:bg-white dark:border-white/10 dark:bg-[#101915] dark:text-sage-200 dark:hover:bg-white/10'
                      )}
                      onClick={() => toggleStrategy(strategy.label)}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">{strategy.icon}</span>
                      {strategy.label}
                    </button>
                  );
                })}
                {customStrategies.map((strategy) => {
                  const isSelected = selectedStrategies.includes(strategy);

                  return (
                    <button
                      aria-pressed={isSelected}
                      key={strategy}
                      className={clsx(
                        'inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-all',
                        isSelected
                          ? 'border-sage-300 bg-white text-sage-800 shadow-sm dark:border-sage-400/30 dark:bg-white/10 dark:text-sage-50'
                          : 'border-sand-300 bg-sand-50 text-sage-700 hover:border-sage-200 hover:bg-white dark:border-white/10 dark:bg-[#101915] dark:text-sage-200 dark:hover:bg-white/10'
                      )}
                      onClick={() => toggleStrategy(strategy)}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                      {strategy}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <input
                  className="min-w-0 flex-1 rounded-full border border-sand-300 bg-white px-5 py-3 text-sm text-sage-900 outline-none placeholder:text-sage-400 focus:border-sage-400 focus:ring-4 focus:ring-sage-400/10 dark:border-white/10 dark:bg-[#101915] dark:text-sage-50"
                  maxLength={MAX_CUSTOM_STRATEGY_LENGTH}
                  onChange={(event) => setCustomStrategyInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter') return;
                    event.preventDefault();
                    handleAddCustomStrategy();
                  }}
                  placeholder="Type your own coping strategy"
                  type="text"
                  value={customStrategyInput}
                />
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-sage-700 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-sage-800 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!customStrategyInput.trim()}
                  onClick={handleAddCustomStrategy}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Add strategy
                </button>
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-white/70 bg-white/70 p-5 dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-sage-500 dark:text-sage-300">Chosen support</p>
                <p className="compact-display-value mt-2 font-display text-sage-800 dark:text-sage-50">
                  {selectedStrategies.length ? selectedStrategies.join(', ') : 'Choose one or more grounding tools'}
                </p>
                <p className="mt-2 text-sm leading-6 text-sage-600 dark:text-sage-200">
                  Let this be your next kind action, not another task to perform perfectly.
                </p>
                {selectedStrategies.length ? (
                  <Link
                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-sage-200 bg-white px-4 py-2 text-xs font-medium text-sage-700 transition-colors hover:bg-sage-50 dark:border-white/10 dark:bg-white/10 dark:text-sage-100"
                    to={sharePath}
                  >
                    <span className="material-symbols-outlined text-[17px]">ios_share</span>
                    Open export card
                  </Link>
                ) : null}

                <div className="mt-6 border-t border-sage-100 pt-5 dark:border-white/10">
                  <label className="text-sm font-medium text-sage-800 dark:text-sage-100" htmlFor="feeling-before-go">
                    Before you go, what feels different?
                  </label>
                  <p className="mt-1 text-xs leading-5 text-sage-500 dark:text-sage-300">
                    A short closing note helps MindfulLife remember what actually felt useful.
                  </p>
                  <textarea
                    className="mt-3 min-h-28 w-full resize-y rounded-2xl border border-sage-200 bg-white px-4 py-3 text-sm leading-6 text-sage-900 outline-none placeholder:text-sage-400 focus:border-sage-400 focus:ring-4 focus:ring-sage-400/10 dark:border-white/10 dark:bg-[#101915] dark:text-sage-50"
                    id="feeling-before-go"
                    maxLength={2000}
                    onChange={(event) => setFeelingBeforeGo(event.target.value)}
                    placeholder="I feel a little steadier because..."
                    value={feelingBeforeGo}
                  />
                </div>

                <button
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-sage-700 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-sage-800 hover:shadow-lifted disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={loading || saving}
                  onClick={handleSave}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[19px]">bookmark_added</span>
                  {saving ? 'Saving support plan...' : 'Save check-in and coping plan'}
                </button>
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-sage-100 bg-white p-6 shadow-soft sm:p-8 dark:border-white/10 dark:bg-white/5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.24em] text-sage-500 dark:text-sage-300">Saved Coping Plans</p>
                  <h2 className="compact-section-title mt-2 text-sage-900 dark:text-sage-50">Support you can reuse</h2>
                  <p className="mt-2 text-sm leading-6 text-sage-600 dark:text-sage-200">
                    Plans are saved automatically with emotional check-ins, so useful combinations remain easy to find.
                  </p>
                </div>
                <span className="material-symbols-outlined rounded-2xl bg-sage-100 p-3 text-sage-700 dark:bg-white/10 dark:text-sage-100">bookmark</span>
              </div>

              {historyLoading ? (
                <div className="mt-6 space-y-3">
                  {Array.from({ length: 2 }, (_, index) => (
                    <div key={`coping-plan-skeleton-${index + 1}`} className="skeleton h-28 rounded-[1.5rem]" />
                  ))}
                </div>
              ) : savedCopingPlans.length ? (
                <div className="mt-6 space-y-3">
                  {savedCopingPlans.slice(0, 4).map((plan) => (
                    <article key={plan.id} className="rounded-[1.5rem] border border-sage-100 bg-sage-50/70 p-5 dark:border-white/10 dark:bg-[#101915]">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex flex-wrap gap-2">
                            {plan.strategies.map((strategy) => (
                              <span key={strategy} className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-sage-700 shadow-sm dark:bg-white/10 dark:text-sage-100">
                                {strategy}
                              </span>
                            ))}
                          </div>
                          <p className="mt-3 text-xs leading-5 text-sage-500 dark:text-sage-300">
                            Used {plan.uses} time{plan.uses === 1 ? '' : 's'} | Last used {formatEmotionalHistoryDate(plan.lastUsed)}
                            {plan.averageMood != null ? ` | Average mood ${plan.averageMood}/5` : ''}
                          </p>
                        </div>
                        <button
                          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-sage-200 bg-white px-4 py-2 text-xs font-medium text-sage-700 transition-colors hover:bg-sage-100 dark:border-white/10 dark:bg-white/5 dark:text-sage-100 dark:hover:bg-white/10"
                          onClick={() => applyCopingPlan(plan.strategies)}
                          type="button"
                        >
                          <span className="material-symbols-outlined text-[17px]">restart_alt</span>
                          Use this plan
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-[1.5rem] border border-dashed border-sage-200 bg-sage-50/70 px-6 py-8 text-center dark:border-white/10 dark:bg-[#101915]">
                  <span className="material-symbols-outlined text-3xl text-sage-400">bookmark_add</span>
                  <p className="mt-3 text-sm font-medium text-sage-800 dark:text-sage-100">Your first saved plan will appear here.</p>
                  <p className="mt-1 text-xs leading-5 text-sage-500 dark:text-sage-300">Choose a coping strategy and save today&apos;s check-in.</p>
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-8">
            <section className="rounded-[1.75rem] border border-sage-100 bg-white p-6 shadow-soft sm:p-8 dark:border-white/10 dark:bg-white/5">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-sage-500 dark:text-sage-300">What Helped Last Time</p>
              {historyLoading ? (
                <div className="mt-5 skeleton h-64 rounded-[1.5rem]" />
              ) : priorCopingRecall ? (
                <div className="mt-4">
                  <p className="text-sm text-sage-500 dark:text-sage-300">{formatEmotionalHistoryDate(priorCopingRecall.date)}</p>
                  <h3 className="compact-section-title mt-2 text-sage-900 dark:text-sage-50">
                    You reached for {priorCopingRecall.strategies.join(' and ')}.
                  </h3>
                  {priorCopingRecall.matchingThemes.length ? (
                    <p className="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-sage-500 dark:text-sage-300">
                      Similar theme: {priorCopingRecall.matchingThemes.join(', ')}
                    </p>
                  ) : null}
                  {priorCopingRecall.closingReflection ? (
                    <div className="mt-5 rounded-2xl bg-sage-50 p-4 dark:bg-white/5">
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-sage-500 dark:text-sage-300">What shifted</p>
                      <p className="mt-2 text-sm leading-6 text-sage-700 dark:text-sage-100">{priorCopingRecall.closingReflection}</p>
                    </div>
                  ) : priorCopingRecall.mood != null ? (
                    <p className="mt-4 text-sm leading-6 text-sage-600 dark:text-sage-200">
                      That day&apos;s mood was recorded as {priorCopingRecall.mood}/5.
                    </p>
                  ) : (
                    <p className="mt-4 text-sm leading-6 text-sage-600 dark:text-sage-200">
                      No closing note was recorded, but the coping plan is available to try again.
                    </p>
                  )}
                  <button
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-sage-700 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-sage-800"
                    onClick={() => applyCopingPlan(priorCopingRecall.strategies)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">history</span>
                    Use what helped last time
                  </button>
                </div>
              ) : (
                <div className="mt-5 rounded-[1.5rem] border border-dashed border-sage-200 bg-sage-50/70 p-5 text-sm leading-6 text-sage-600 dark:border-white/10 dark:bg-[#101915] dark:text-sage-200">
                  Save a coping plan today. On a future check-in, this space will bring back a relevant plan from your history.
                </div>
              )}
            </section>

            <section className="rounded-[1.75rem] border border-sage-100 bg-sage-900 p-6 text-sage-50 shadow-soft sm:p-8">
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-sage-200/80">Repeated Themes</p>
              <h3 className="compact-section-title mt-3">What has been showing up</h3>
              <p className="mt-3 text-sm leading-7 text-sage-100/75">
                These are simple recurring themes in your own words, not a diagnosis or proof of cause.
              </p>
              {historyLoading ? (
                <div className="mt-5 space-y-3">
                  <div className="h-16 animate-pulse rounded-2xl bg-white/10" />
                  <div className="h-16 animate-pulse rounded-2xl bg-white/10" />
                </div>
              ) : recurringTriggers.length ? (
                <div className="mt-5 space-y-3">
                  {recurringTriggers.map((trigger) => (
                    <div key={trigger.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <p className="text-sm font-medium text-white">{trigger.label}</p>
                      <p className="mt-1 text-xs leading-5 text-sage-200">
                        Appeared in {trigger.count} check-ins | Last seen {formatEmotionalHistoryDate(trigger.lastSeen)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-5 rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 text-sm leading-6 text-sage-200">
                  No theme has repeated enough yet. Patterns appear after the same theme is noticed on at least two check-ins.
                </p>
              )}
            </section>
          </aside>
        </div>

        <section className="rounded-[1.75rem] border border-sage-100 bg-white p-6 shadow-soft sm:p-8 lg:p-10 dark:border-white/10 dark:bg-white/5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-sage-500 dark:text-sage-300">Mood and Coping History</p>
              <h2 className="compact-section-title mt-2 text-sage-900 dark:text-sage-50">How your support choices show up over time</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-sage-600 dark:text-sage-200">
                These are associations from your saved check-ins. They do not prove that a coping strategy caused a mood change.
              </p>
            </div>
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-sage-100 text-sage-700 dark:bg-white/10 dark:text-sage-100">
              <span className="material-symbols-outlined">insights</span>
            </div>
          </div>

          {historyLoading ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={`coping-pattern-skeleton-${index + 1}`} className="skeleton h-44 rounded-[1.5rem]" />
              ))}
            </div>
          ) : copingPatterns.length ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {copingPatterns.map((pattern) => (
                <article key={pattern.strategy} className="rounded-[1.5rem] border border-sage-100 bg-gradient-to-b from-sage-50/80 to-white p-5 dark:border-white/10 dark:bg-gradient-to-b dark:from-[#18231d] dark:to-[#101915]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-white text-sage-700 shadow-sm dark:bg-white/10 dark:text-sage-100">
                      <span className="material-symbols-outlined">self_improvement</span>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-sage-600 shadow-sm dark:bg-white/10 dark:text-sage-200">
                      {pattern.uses} use{pattern.uses === 1 ? '' : 's'}
                    </span>
                  </div>
                  <h3 className="mt-5 text-xl font-medium text-sage-900 dark:text-sage-50">{pattern.strategy}</h3>
                  <p className="mt-2 text-sm leading-6 text-sage-600 dark:text-sage-200">
                    {pattern.averageMood != null
                      ? `Mood averaged ${pattern.averageMood}/5 across ${pattern.moodSamples} rated check-in${pattern.moodSamples === 1 ? '' : 's'}.`
                      : 'Add mood ratings on the same days to see more context here.'}
                  </p>
                  <p className="mt-4 text-xs leading-5 text-sage-500 dark:text-sage-300">
                    {pattern.closingReflections} closing reflection{pattern.closingReflections === 1 ? '' : 's'} recorded
                    {' | '}Last used {formatEmotionalHistoryDate(pattern.lastUsed)}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-sage-200 bg-sage-50/70 px-6 py-9 text-center dark:border-white/10 dark:bg-[#101915]">
              <span className="material-symbols-outlined text-4xl text-sage-400">query_stats</span>
              <p className="mt-3 text-lg font-medium text-sage-800 dark:text-sage-100">Your coping history starts with one saved plan.</p>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-sage-500 dark:text-sage-300">
                Save emotional check-ins with coping strategies and mood ratings to build a more useful personal history.
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-4 rounded-[1.5rem] border border-slate-900 bg-slate-950 px-5 py-5 text-white sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sage-200/70">Premium pattern summary</p>
              <p className="mt-2 text-sm leading-6 text-white/80">
                Deeper emotional summaries can connect longer history, recurring themes, and coping responses in one report.
              </p>
            </div>
            <Link
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900"
              to="/settings#billing"
            >
              <span className="material-symbols-outlined text-[18px]">lock</span>
              View Premium
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
