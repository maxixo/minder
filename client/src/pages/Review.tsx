import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import clsx from 'clsx';
import { toast } from 'sonner';
import ProfileMenu from '@/components/common/ProfileMenu';
import { useDailyEntry } from '@/hooks/useDailyEntry';
import {
  buildCarryForwardSuggestions,
  buildDailyScorecard,
  buildWeeklyReview,
  buildWhatChangedToday,
  extractCarryForwardItems,
  replaceCarryForwardBlock,
} from '@/lib/reviewInsights';
import entryService from '@/services/entryService';
import {
  normalizeDailyEntry,
  type DailyEntry,
  type DailyEntryPatch,
  type EntryTodoItem,
} from '@/types/entry';
import '@/styles/pages/review.css';

const createEmptyTask = (): EntryTodoItem => ({ text: '', completed: false });
const sanitizePriorities = (priorities: string[]) => priorities.map((item) => item.trim()).filter(Boolean);
const sanitizeTasks = (tasks: EntryTodoItem[]) => tasks
  .map((task) => ({ ...task, text: task.text.trim() }))
  .filter((task) => task.text);

const moodLabel = (value: number | null) => {
  if (value == null) return 'Not checked';
  if (value >= 5) return 'Bright';
  if (value >= 4) return 'Good';
  if (value >= 3) return 'Steady';
  if (value >= 2) return 'Tender';
  return 'Heavy';
};

const sourceIcon = {
  task: 'task_alt',
  priority: 'flag',
  pattern: 'history',
} as const;

export default function Review() {
  const { entry, error, loading, saveEntryPatch, saving } = useDailyEntry();
  const [focus, setFocus] = useState('');
  const [priorities, setPriorities] = useState<string[]>(['']);
  const [tasks, setTasks] = useState<EntryTodoItem[]>([createEmptyTask()]);
  const [closureReflection, setClosureReflection] = useState('');
  const [selectedCarryForward, setSelectedCarryForward] = useState<string[]>([]);
  const [recentEntries, setRecentEntries] = useState<DailyEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const [weeklyReviewVisible, setWeeklyReviewVisible] = useState(false);

  useEffect(() => {
    if (!entry) return;

    setFocus(entry.focus || '');
    setPriorities(entry.priorities?.length ? entry.priorities : ['']);
    setTasks(entry.todoList?.length ? entry.todoList : [createEmptyTask()]);
    setClosureReflection(entry.mindfulnessNotes || '');
    setSelectedCarryForward(extractCarryForwardItems(entry.tomorrowPlan?.expectations));
  }, [entry]);

  useEffect(() => {
    let cancelled = false;

    const loadHistory = async () => {
      setHistoryLoading(true);
      setHistoryError('');

      try {
        const response = await entryService.getRecentEntries(7);
        if (!cancelled) setRecentEntries(response.data);
      } catch (loadError: any) {
        if (!cancelled) {
          setRecentEntries([]);
          setHistoryError(loadError?.response?.data?.message || 'Weekly history could not be loaded.');
        }
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    };

    void loadHistory();
    return () => {
      cancelled = true;
    };
  }, [entry?.updatedAt]);

  const draftEntry = useMemo(() => normalizeDailyEntry({
    ...(entry || {}),
    focus,
    priorities: sanitizePriorities(priorities),
    todoList: sanitizeTasks(tasks),
    mindfulnessNotes: closureReflection,
  }), [closureReflection, entry, focus, priorities, tasks]);

  const reviewDateLabel = useMemo(
    () => format(new Date(entry?.date || new Date()), 'EEEE, MMMM d'),
    [entry?.date]
  );
  const scorecard = useMemo(() => buildDailyScorecard(draftEntry), [draftEntry]);
  const dailyChanges = useMemo(() => buildWhatChangedToday(draftEntry), [draftEntry]);
  const carryForwardSuggestions = useMemo(
    () => buildCarryForwardSuggestions(draftEntry, recentEntries),
    [draftEntry, recentEntries]
  );
  const weeklyReview = useMemo(() => buildWeeklyReview(recentEntries), [recentEntries]);

  const updatePriority = (index: number, value: string) => {
    setPriorities((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
  };

  const addPriority = () => setPriorities((current) => [...current, '']);

  const removePriority = (index: number) => {
    setPriorities((current) => {
      const next = current.filter((_, itemIndex) => itemIndex !== index);
      return next.length ? next : [''];
    });
  };

  const updateTask = (index: number, patch: Partial<EntryTodoItem>) => {
    setTasks((current) => current.map((task, taskIndex) => (
      taskIndex === index ? { ...task, ...patch } : task
    )));
  };

  const addTask = () => setTasks((current) => [...current, createEmptyTask()]);

  const removeTask = (index: number) => {
    setTasks((current) => {
      const next = current.filter((_, taskIndex) => taskIndex !== index);
      return next.length ? next : [createEmptyTask()];
    });
  };

  const toggleCarryForward = (text: string) => {
    setSelectedCarryForward((current) => (
      current.includes(text)
        ? current.filter((item) => item !== text)
        : [...current, text]
    ));
  };

  const handleGenerateWeeklyReview = () => {
    setWeeklyReviewVisible(true);
    window.setTimeout(() => {
      document.getElementById('weekly-review')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleSave = async () => {
    const patch: DailyEntryPatch = {
      focus: focus.trim(),
      priorities: sanitizePriorities(priorities),
      todoList: sanitizeTasks(tasks),
      mindfulnessNotes: closureReflection.trim(),
      tomorrowPlan: {
        expectations: replaceCarryForwardBlock(
          entry?.tomorrowPlan?.expectations,
          selectedCarryForward
        ),
      },
    };

    try {
      await saveEntryPatch(patch, 'review');
      toast.success('Day closed and carry-forward plan saved');
    } catch (saveError: any) {
      toast.error(saveError?.response?.data?.message || 'Unable to save daily closure');
    }
  };

  return (
    <div className="review-page animate-fade-in pb-12 text-sage-900 [&_.font-display]:font-body [&_h1]:font-body [&_h2]:font-body [&_h3]:font-body [&_h4]:font-body [&_h5]:font-body [&_h6]:font-body dark:text-sage-50">
      <section className="review-hero relative overflow-hidden rounded-[2rem] border border-sand-200 px-6 py-7 shadow-soft sm:px-8 sm:py-9 lg:px-10 dark:border-white/10">
        <div className="review-orbit review-orbit-one" />
        <div className="review-orbit review-orbit-two" />

        <div className="relative z-10 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="eyebrow text-sand-700 dark:text-sand-200">Daily closure ritual</p>
            <h1 className="mt-3 font-display text-4xl font-medium leading-none tracking-[-0.03em] text-sage-900 sm:text-5xl lg:text-6xl dark:text-white">
              Set the day down.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-sage-700 sm:text-lg dark:text-sage-100">
              Notice what moved, name what remains, and choose what deserves to follow you into tomorrow.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
            <div className="rounded-full border border-white/70 bg-white/70 px-5 py-2.5 font-mono text-xs uppercase tracking-[0.12em] text-sage-700 backdrop-blur dark:border-white/10 dark:bg-white/10 dark:text-sage-100">
              {reviewDateLabel}
            </div>
            <div className="flex items-center gap-3">
              <button
                className="inline-flex items-center justify-center gap-2 rounded-full bg-sage-900 px-6 py-3 text-sm font-semibold text-white shadow-lifted transition-all hover:-translate-y-0.5 hover:bg-sage-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-sage-100 dark:text-sage-900"
                disabled={loading || saving}
                onClick={handleSave}
                type="button"
              >
                <span className="material-symbols-outlined text-[19px]">bedtime</span>
                {saving ? 'Closing...' : 'Close the day'}
              </button>
              <ProfileMenu buttonClassName="border-white/70 bg-white/70 text-sage-800 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-sage-100 dark:hover:bg-white/15" />
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="mt-6 rounded-3xl border border-sage-200 bg-white/80 px-6 py-4 text-sm font-medium text-sage-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-sage-200">
          Gathering today&apos;s check-ins...
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 px-6 py-4 text-sm leading-6 text-amber-800 shadow-sm">
          {error}
        </div>
      ) : null}

      <section className="review-reveal mt-8" style={{ animationDelay: '80ms' }}>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">End-of-day scorecard</p>
            <h2 className="mt-2 font-display text-3xl font-medium text-sage-900 dark:text-sage-50">A clear read, not a verdict</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-sage-600 dark:text-sage-300">
            The score reflects task progress, completed check-ins, self-care, and whether you paused to reflect.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <div className="col-span-2 flex min-h-44 items-center gap-6 rounded-[1.75rem] border border-sage-200 bg-sage-900 p-6 text-white shadow-soft lg:col-span-1 lg:flex-col lg:justify-center dark:border-white/10 dark:bg-sage-100 dark:text-sage-900">
            <div
              className="review-score-ring flex size-24 shrink-0 items-center justify-center rounded-full"
              style={{ '--review-score': `${scorecard.closureScore * 3.6}deg` } as React.CSSProperties}
            >
              <div className="flex size-[74px] items-center justify-center rounded-full bg-sage-900 text-2xl font-bold dark:bg-sage-100">
                {scorecard.closureScore}
              </div>
            </div>
            <div className="lg:text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-sage-200 dark:text-sage-600">Closure score</p>
              <p className="mt-2 text-sm leading-5 text-sage-50 dark:text-sage-800">
                {scorecard.closureScore >= 70 ? 'The day has a strong sense of completion.' : 'A few honest details will sharpen the picture.'}
              </p>
            </div>
          </div>

          {[
            {
              label: 'Tasks',
              value: scorecard.totalTasks ? `${scorecard.completedTasks}/${scorecard.totalTasks}` : 'None',
              detail: scorecard.totalTasks ? `${scorecard.taskCompletion}% completed` : 'Add what you meant to do',
              icon: 'checklist',
            },
            {
              label: 'Practices',
              value: `${scorecard.completedPractices}/${scorecard.totalPractices}`,
              detail: 'Reflection, care, guidance',
              icon: 'routine',
            },
            {
              label: 'Self-care',
              value: `${scorecard.selfCareActions}`,
              detail: scorecard.selfCareActions === 1 ? 'restorative action' : 'restorative actions',
              icon: 'spa',
            },
            {
              label: 'Mood',
              value: scorecard.mood != null ? `${scorecard.mood}/5` : 'Not set',
              detail: moodLabel(scorecard.mood),
              icon: 'sentiment_satisfied',
            },
          ].map((item) => (
            <div key={item.label} className="rounded-[1.75rem] border border-sage-200 bg-white/85 p-5 shadow-soft backdrop-blur dark:border-white/10 dark:bg-white/5">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-sand-100 text-sand-700 dark:bg-white/10 dark:text-sand-200">
                <span className="material-symbols-outlined">{item.icon}</span>
              </div>
              <p className="mt-7 font-mono text-[10px] uppercase tracking-[0.18em] text-sage-500 dark:text-sage-300">{item.label}</p>
              <p className="mt-1 font-display text-3xl font-semibold text-sage-900 dark:text-sage-50">{item.value}</p>
              <p className="mt-1 text-xs text-sage-600 dark:text-sage-300">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="review-reveal mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]" style={{ animationDelay: '150ms' }}>
        <section className="rounded-[1.75rem] border border-sage-200 bg-white/90 p-6 shadow-soft sm:p-8 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">What changed today</p>
              <h2 className="mt-2 font-display text-3xl font-medium">The arc of the day</h2>
            </div>
            <span className="material-symbols-outlined rounded-2xl bg-sage-100 p-3 text-sage-700 dark:bg-white/10 dark:text-sage-100">timeline</span>
          </div>

          <div className="relative mt-7 space-y-3 before:absolute before:bottom-6 before:left-5 before:top-6 before:w-px before:bg-sage-200 dark:before:bg-white/10">
            {dailyChanges.map((change) => (
              <div key={`${change.label}-${change.text}`} className="relative flex gap-4 rounded-2xl border border-transparent p-3 transition-colors hover:border-sage-100 hover:bg-sage-50/70 dark:hover:border-white/10 dark:hover:bg-white/5">
                <div className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-4 border-white bg-sage-700 text-white dark:border-[#18201b] dark:bg-sage-300 dark:text-sage-900">
                  <span className="material-symbols-outlined text-[18px]">{change.icon}</span>
                </div>
                <div className="pt-1">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-sage-500 dark:text-sage-300">{change.label}</p>
                  <p className="mt-1 text-sm leading-6 text-sage-700 dark:text-sage-100">{change.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-sand-200 bg-gradient-to-br from-sand-100 via-white to-sage-50 p-6 shadow-soft sm:p-8 dark:border-white/10 dark:bg-gradient-to-br dark:from-[#241f1a] dark:via-[#18201b] dark:to-[#142019]">
          <p className="eyebrow text-sand-700 dark:text-sand-200">Closure reflection</p>
          <h2 className="mt-2 font-display text-3xl font-medium">Completed is not the only kind of progress.</h2>
          <p className="mt-3 text-sm leading-6 text-sage-600 dark:text-sage-300">
            What did finishing teach you? What made the unfinished work difficult, and what would make tomorrow gentler?
          </p>
          <textarea
            className="mt-6 min-h-52 w-full resize-y rounded-3xl border border-white/80 bg-white/75 px-5 py-4 text-base leading-7 text-sage-900 outline-none shadow-inner-soft placeholder:text-sage-400 focus:border-sage-500 focus:ring-4 focus:ring-sage-500/10 dark:border-white/10 dark:bg-black/10 dark:text-sage-50 dark:placeholder:text-sage-500"
            onChange={(event) => setClosureReflection(event.target.value)}
            placeholder="Today I completed... I left... The difference was..."
            value={closureReflection}
          />
          <p className="mt-3 text-xs leading-5 text-sage-500 dark:text-sage-400">
            This note becomes part of today&apos;s journal and strengthens the weekly review.
          </p>
        </section>
      </div>

      <div className="review-reveal mt-8 grid grid-cols-1 gap-8 xl:grid-cols-2" style={{ animationDelay: '220ms' }}>
        <section className="rounded-[1.75rem] border border-sage-200 bg-white/90 p-6 shadow-soft sm:p-8 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Plan versus reality</p>
              <h2 className="mt-2 font-display text-3xl font-medium">Name what was finished</h2>
            </div>
            <button
              className="inline-flex size-11 items-center justify-center rounded-full border border-sage-200 text-sage-700 transition-colors hover:bg-sage-50 dark:border-white/10 dark:text-sage-100 dark:hover:bg-white/10"
              onClick={addTask}
              title="Add task"
              type="button"
            >
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>

          <div className="mt-6 space-y-3">
            {tasks.map((task, index) => (
              <div
                key={task.id || `task-${index + 1}`}
                className={clsx(
                  'group flex items-center gap-3 rounded-2xl border p-3 transition-all',
                  task.completed
                    ? 'border-sage-200 bg-sage-50/80 dark:border-sage-700 dark:bg-sage-900/30'
                    : 'border-sand-200 bg-sand-50 dark:border-white/10 dark:bg-white/5'
                )}
              >
                <button
                  aria-label={task.completed ? 'Mark task unfinished' : 'Mark task complete'}
                  className={clsx(
                    'flex size-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                    task.completed
                      ? 'border-sage-700 bg-sage-700 text-white dark:border-sage-300 dark:bg-sage-300 dark:text-sage-900'
                      : 'border-sand-400 text-transparent hover:border-sage-600'
                  )}
                  onClick={() => updateTask(index, { completed: !task.completed })}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[17px]">check</span>
                </button>
                <input
                  className={clsx(
                    'min-w-0 flex-1 border-none bg-transparent text-sm outline-none placeholder:text-sage-400',
                    task.completed ? 'text-sage-500 line-through' : 'text-sage-900 dark:text-sage-50'
                  )}
                  onChange={(event) => updateTask(index, { text: event.target.value })}
                  placeholder={`Task ${index + 1}`}
                  value={task.text}
                />
                <button
                  className="text-sage-400 opacity-100 transition-all hover:text-clay-600 sm:opacity-0 sm:group-hover:opacity-100"
                  onClick={() => removeTask(index)}
                  title="Remove task"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[19px]">close</span>
                </button>
              </div>
            ))}
          </div>

          <div className="mt-8 border-t border-sage-100 pt-6 dark:border-white/10">
            <label className="font-mono text-[10px] uppercase tracking-[0.18em] text-sage-500 dark:text-sage-300" htmlFor="review-focus">
              Today&apos;s core intention
            </label>
            <input
              id="review-focus"
              className="mt-3 w-full border-0 border-b border-sage-200 bg-transparent px-0 pb-3 font-display text-2xl text-sage-900 outline-none placeholder:text-sage-300 focus:border-sage-600 focus:ring-0 dark:border-white/10 dark:text-sage-50 dark:placeholder:text-sage-600"
              onChange={(event) => setFocus(event.target.value)}
              placeholder="What mattered most?"
              value={focus}
            />
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-sage-200 bg-sage-900 p-6 text-white shadow-soft sm:p-8 dark:border-white/10 dark:bg-[#1d2a21]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-sage-300">Carry forward</p>
              <h2 className="mt-2 font-display text-3xl font-medium">Tomorrow does not need everything.</h2>
            </div>
            <span className="material-symbols-outlined rounded-2xl bg-white/10 p-3 text-sand-200">forward</span>
          </div>
          <p className="mt-3 max-w-xl text-sm leading-6 text-sage-200">
            Select only the unfinished work that still matters. The rest can be released, delegated, or rewritten.
          </p>

          <div className="mt-6 space-y-3">
            {carryForwardSuggestions.length ? carryForwardSuggestions.map((suggestion) => {
              const selected = selectedCarryForward.includes(suggestion.text);

              return (
                <button
                  key={suggestion.id}
                  className={clsx(
                    'flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-all',
                    selected
                      ? 'border-sand-300 bg-sand-100 text-sage-900'
                      : 'border-white/10 bg-white/5 text-white hover:border-white/25 hover:bg-white/10'
                  )}
                  onClick={() => toggleCarryForward(suggestion.text)}
                  type="button"
                >
                  <span className={clsx(
                    'material-symbols-outlined flex size-9 shrink-0 items-center justify-center rounded-xl',
                    selected ? 'bg-sage-900 text-white' : 'bg-white/10 text-sand-200'
                  )}>
                    {selected ? 'check' : sourceIcon[suggestion.source]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{suggestion.text}</span>
                    <span className={clsx('mt-1 block text-xs', selected ? 'text-sage-600' : 'text-sage-300')}>
                      {suggestion.detail}
                    </span>
                  </span>
                </button>
              );
            }) : (
              <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-6 text-center">
                <span className="material-symbols-outlined text-3xl text-sage-300">done_all</span>
                <p className="mt-3 text-sm font-semibold">Nothing needs to be carried forward.</p>
                <p className="mt-1 text-xs leading-5 text-sage-300">Unfinished tasks and open priorities will appear here.</p>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
            <p className="text-xs text-sage-300">{selectedCarryForward.length} selected for tomorrow</p>
            {selectedCarryForward.length ? (
              <button
                className="text-xs font-semibold text-sand-200 hover:text-white"
                onClick={() => setSelectedCarryForward([])}
                type="button"
              >
                Release all
              </button>
            ) : null}
          </div>
        </section>
      </div>

      <section className="review-reveal mt-8 rounded-[2rem] border border-sage-200 bg-white/90 p-6 shadow-soft sm:p-8 lg:p-10 dark:border-white/10 dark:bg-white/5" style={{ animationDelay: '290ms' }}>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
          <div>
            <p className="eyebrow">Weekly self-review</p>
            <h2 className="mt-3 font-display text-4xl font-medium leading-tight">Turn seven days into one useful lesson.</h2>
            <p className="mt-4 max-w-lg text-sm leading-7 text-sage-600 dark:text-sage-300">
              Generate a review from your saved check-ins, completed work, moods, and repeated unfinished tasks. No new writing is required.
            </p>
            <button
              className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-sand-600 px-6 py-3 text-sm font-semibold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:bg-sand-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={historyLoading}
              onClick={handleGenerateWeeklyReview}
              type="button"
            >
              <span className="material-symbols-outlined text-[19px]">auto_awesome</span>
              {historyLoading ? 'Gathering the week...' : weeklyReviewVisible ? 'Refresh weekly review' : 'Generate weekly review'}
            </button>
            {historyError ? <p className="mt-3 text-sm text-clay-600">{historyError}</p> : null}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Days logged', value: `${weeklyReview.daysLogged}/7` },
              { label: 'Days closed', value: `${weeklyReview.closureDays}` },
              { label: 'Tasks finished', value: `${weeklyReview.taskCompletion}%` },
              { label: 'Average mood', value: weeklyReview.averageMood != null ? `${weeklyReview.averageMood}/5` : 'Not set' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-sage-100 bg-sage-50/70 p-4 dark:border-white/10 dark:bg-white/5">
                <p className="font-display text-2xl font-semibold">{item.value}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-sage-500 dark:text-sage-300">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {weeklyReviewVisible ? (
          <div id="weekly-review" className="review-weekly-result mt-8 scroll-mt-8 border-t border-sage-100 pt-8 dark:border-white/10">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
              <div className="rounded-[1.5rem] border border-sage-100 bg-sage-50/70 p-6 dark:border-white/10 dark:bg-white/5">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-sage-500 dark:text-sage-300">
                  Generated {format(new Date(), 'MMM d, h:mm a')}
                </p>
                <p className="mt-4 font-display text-2xl leading-9 text-sage-900 dark:text-sage-50">{weeklyReview.narrative}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {weeklyReview.strongestDay ? (
                    <span className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-sage-700 shadow-sm dark:bg-white/10 dark:text-sage-100">
                      Strongest day: {weeklyReview.strongestDay}
                    </span>
                  ) : null}
                  {weeklyReview.averageEnergy != null ? (
                    <span className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-sage-700 shadow-sm dark:bg-white/10 dark:text-sage-100">
                      Average energy: {weeklyReview.averageEnergy}/5
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[1.5rem] border border-sand-200 bg-sand-100/70 p-5 dark:border-white/10 dark:bg-[#241f1a]">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-sand-700 dark:text-sand-200">Notice next week</p>
                  {weeklyReview.recurringUnfinished.length ? (
                    <ul className="mt-3 space-y-2">
                      {weeklyReview.recurringUnfinished.map((item) => (
                        <li key={item} className="flex gap-2 text-sm leading-6 text-sage-700 dark:text-sage-100">
                          <span className="material-symbols-outlined mt-0.5 text-[17px] text-sand-600 dark:text-sand-300">arrow_forward</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-sage-600 dark:text-sage-300">No repeated unfinished task stood out.</p>
                  )}
                </div>

                <div className="rounded-[1.5rem] border border-sage-100 bg-white p-5 dark:border-white/10 dark:bg-white/5">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-sage-500 dark:text-sage-300">Remember</p>
                  {weeklyReview.highlights.length ? (
                    <p className="mt-3 text-sm leading-6 text-sage-700 dark:text-sage-100">{weeklyReview.highlights.join(' / ')}</p>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-sage-600 dark:text-sage-300">Capture a positive note during the week and it will return here.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <section className="review-reveal mt-8 rounded-[1.75rem] border border-sage-200 bg-white/90 p-6 shadow-soft sm:p-8 dark:border-white/10 dark:bg-white/5" style={{ animationDelay: '360ms' }}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Open priorities</p>
            <h2 className="mt-2 font-display text-3xl font-medium">Keep the list honest</h2>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-full border border-sage-200 px-4 py-2 text-xs font-semibold text-sage-700 hover:bg-sage-50 dark:border-white/10 dark:text-sage-100 dark:hover:bg-white/10"
            onClick={addPriority}
            type="button"
          >
            <span className="material-symbols-outlined text-[17px]">add</span>
            Add priority
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {priorities.map((priority, index) => (
            <div key={`priority-${index + 1}`} className="group flex items-center gap-3 rounded-2xl border border-sage-100 bg-sage-50/60 p-4 dark:border-white/10 dark:bg-white/5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-sand-200 font-mono text-xs font-bold text-sand-800 dark:bg-sand-800 dark:text-sand-100">
                {index + 1}
              </span>
              <input
                className="min-w-0 flex-1 border-none bg-transparent text-sm text-sage-900 outline-none placeholder:text-sage-400 dark:text-sage-50"
                onChange={(event) => updatePriority(index, event.target.value)}
                placeholder={`Priority ${index + 1}`}
                value={priority}
              />
              <button
                className="text-sage-400 opacity-100 transition-all hover:text-clay-600 sm:opacity-0 sm:group-hover:opacity-100"
                onClick={() => removePriority(index)}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-[1.75rem] border border-sage-200 bg-sage-50/80 px-6 py-5 sm:flex-row dark:border-white/10 dark:bg-white/5">
        <p className="text-sm leading-6 text-sage-600 dark:text-sage-300">
          {selectedCarryForward.length
            ? `${selectedCarryForward.length} item${selectedCarryForward.length === 1 ? '' : 's'} will meet you in tomorrow's plan.`
            : 'Nothing is automatically carried forward. You choose what remains important.'}
        </p>
        <button
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-sage-900 px-7 py-3 text-sm font-semibold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:bg-sage-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto dark:bg-sage-100 dark:text-sage-900"
          disabled={loading || saving}
          onClick={handleSave}
          type="button"
        >
          <span className="material-symbols-outlined text-[19px]">bedtime</span>
          {saving ? 'Saving closure...' : 'Save and close the day'}
        </button>
      </div>
    </div>
  );
}
