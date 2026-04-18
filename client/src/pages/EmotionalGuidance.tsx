import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/useAuth';
import { useDailyEntry } from '@/hooks/useDailyEntry';
import type { DailyEntryPatch } from '@/types/entry';

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
];

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

const sanitizeNotes = (notes: string[]) => notes.map((note) => note.trim()).filter(Boolean).slice(0, 6);

export default function EmotionalGuidance() {
  const { user } = useAuth();
  const { entry, error, loading, saveEntryPatch, saving } = useDailyEntry();
  const [week, setWeek] = useState<Record<WeekKey, boolean>>(emptyWeek);
  const [whereYouAre, setWhereYouAre] = useState('');
  const [feelings, setFeelings] = useState('');
  const [thoughts, setThoughts] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState('');
  const [notes, setNotes] = useState<string[]>([]);

  const firstName = user?.name?.split(' ')[0] || 'Friend';
  const completedDays = Object.values(week).filter(Boolean).length;
  const currentDayKey = weekdayKeyByIndex[new Date().getDay()];
  const hasNotes = notes.length > 0;

  useEffect(() => {
    if (!entry) return;

    setWeek({
      mon: Boolean(entry.selfCarePlanDays?.mon),
      tue: Boolean(entry.selfCarePlanDays?.tue),
      wed: Boolean(entry.selfCarePlanDays?.wed),
      thu: Boolean(entry.selfCarePlanDays?.thu),
      fri: Boolean(entry.selfCarePlanDays?.fri),
      sat: Boolean(entry.selfCarePlanDays?.sat),
      sun: Boolean(entry.selfCarePlanDays?.sun),
    });
    setWhereYouAre(entry.emotionalGuidance?.whereAreYou || '');
    setFeelings(entry.emotionalGuidance?.howYoureFeeling || '');
    setThoughts(entry.emotionalGuidance?.whatYoureThinking || '');
    setSelectedStrategy(entry.emotionalGuidance?.copingMethod || '');
    setNotes(entry.todayNotes || []);
  }, [entry]);

  const toggleDay = (key: WeekKey) => {
    setWeek((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const handleSave = async () => {
    const patch: DailyEntryPatch = {
      emotionalGuidance: {
        whereAreYou: whereYouAre.trim(),
        howYoureFeeling: feelings.trim(),
        whatYoureThinking: thoughts.trim(),
        copingMethod: selectedStrategy.trim(),
      },
      selfCarePlanDays: week,
      todayNotes: sanitizeNotes(notes),
    };

    try {
      await saveEntryPatch(patch, 'emotional');
      toast.success('Emotional reflection saved');
    } catch (saveError: any) {
      toast.error(saveError?.response?.data?.message || 'Unable to save emotional reflection');
    }
  };

  const handleAddNote = () => {
    const note = selectedStrategy
      ? `Support plan for today: lean on ${selectedStrategy.toLowerCase()} when the day feels heavy.`
      : 'Pause, soften your shoulders, and return to one calm breath.';

    setNotes((current) => [note, ...current].slice(0, 6));
    toast.success('Support note added');
  };

  return (
    <div className="-mx-4 min-h-full bg-[#f6f8f7] px-4 text-slate-900 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 dark:bg-[#0f1712] dark:text-sage-50">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 py-2 animate-fade-in">
        <section className="overflow-hidden rounded-[2rem] border border-sage-100 bg-gradient-to-br from-white via-sand-50 to-sage-50 shadow-soft dark:border-white/10 dark:bg-gradient-to-br dark:from-[#18231d] dark:via-[#121b16] dark:to-[#0f1712]">
          <div className="flex flex-col gap-6 px-6 py-8 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-10">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sage-500 dark:text-sage-300">Emotional Guidance</p>
              <h1 className="mt-3 font-display text-4xl font-semibold text-sage-900 sm:text-5xl dark:text-sage-50">
                A softer check-in for {firstName}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-sage-600 sm:text-lg dark:text-sage-200">
                A sanctuary for your daily mindfulness and self-reflection. Name what is present, notice what you need,
                and choose one gentle way to support yourself.
              </p>
            </div>

            <div className="flex flex-col gap-3 rounded-[1.5rem] border border-sage-100 bg-white/80 p-5 shadow-sm backdrop-blur sm:min-w-[240px] dark:border-white/10 dark:bg-white/5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sage-500 dark:text-sage-300">Weekly Rhythm</p>
              <p className="font-display text-3xl font-semibold text-sage-800 dark:text-sage-50">{completedDays}/7 days</p>
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

        <section className="rounded-[1.75rem] border border-sage-100 bg-white p-6 shadow-soft sm:p-8 dark:border-white/10 dark:bg-white/5">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-sage-100 text-sage-700 dark:bg-white/10 dark:text-sage-100">
              <span className="material-symbols-outlined">calendar_month</span>
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold text-sage-900 dark:text-sage-50">Weekly Consistency Tracker</h2>
              <p className="text-sm text-sage-500 dark:text-sage-300">Mark each day you paused for an honest emotional check-in.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {weekConfig.map((item) => {
              const isCurrentDay = item.key === currentDayKey;

              return (
                <label
                  key={item.key}
                  className={clsx(
                    'flex cursor-pointer flex-col items-center gap-3 rounded-2xl border p-4 transition-all',
                    week[item.key] ? 'border-sage-200 bg-sage-50 dark:border-sage-400/30 dark:bg-white/10' : 'border-sage-100 bg-sand-50/70 hover:border-sage-200 dark:border-white/10 dark:bg-[#101915]',
                    isCurrentDay && 'ring-2 ring-sage-300/60'
                  )}
                >
                  <span className={clsx(
                    'text-xs font-bold uppercase tracking-[0.25em]',
                    isCurrentDay ? 'text-sage-700 dark:text-sage-100' : 'text-sage-500 dark:text-sage-400'
                  )}>
                    {item.day}
                  </span>
                  <input
                    checked={week[item.key]}
                    className="h-6 w-6 rounded-full border-sage-300 text-sage-600 focus:ring-sage-500"
                    onChange={() => toggleDay(item.key)}
                    type="checkbox"
                  />
                </label>
              );
            })}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
          <div className="space-y-8 xl:col-span-2">
            <section className="rounded-[1.75rem] border border-sage-100 bg-white p-6 shadow-soft sm:p-8 lg:p-10 dark:border-white/10 dark:bg-white/5">
              <div className="mb-8 flex items-center justify-between gap-4 border-b border-sage-100 pb-4 dark:border-white/10">
                <div>
                  <h2 className="font-display text-3xl font-semibold text-sage-900 dark:text-sage-50">Emotional Check-In</h2>
                  <p className="mt-2 text-sm text-sage-500 dark:text-sage-300">Move slowly. Let each answer be true rather than polished.</p>
                </div>
                <div className="hidden rounded-full bg-sage-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-sage-500 sm:block dark:bg-white/10 dark:text-sage-300">
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
                  <h3 className="font-display text-2xl font-semibold text-sage-900 dark:text-sage-50">Coping Strategies</h3>
                  <p className="mt-2 text-sm text-sage-600 dark:text-sage-200">Pick one supportive action to return to if your emotions start to swell.</p>
                </div>
                <div className="rounded-full bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-sage-500 dark:bg-white/10 dark:text-sage-300">
                  Grounding Tools
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {copingStrategies.map((strategy) => {
                  const isSelected = strategy.label === selectedStrategy;

                  return (
                    <button
                      key={strategy.label}
                      className={clsx(
                        'inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-all',
                        isSelected
                          ? 'border-sage-300 bg-white text-sage-800 shadow-sm dark:border-sage-400/30 dark:bg-white/10 dark:text-sage-50'
                          : 'border-sand-300 bg-sand-50 text-sage-700 hover:border-sage-200 hover:bg-white dark:border-white/10 dark:bg-[#101915] dark:text-sage-200 dark:hover:bg-white/10'
                      )}
                      onClick={() => setSelectedStrategy(strategy.label)}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">{strategy.icon}</span>
                      {strategy.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-white/70 bg-white/70 p-5 dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sage-500 dark:text-sage-300">Chosen support</p>
                <p className="mt-2 font-display text-2xl font-semibold text-sage-800 dark:text-sage-50">{selectedStrategy || 'Choose a grounding tool'}</p>
                <p className="mt-2 text-sm leading-6 text-sage-600 dark:text-sage-200">
                  Let this be your next kind action, not another task to perform perfectly.
                </p>
              </div>
            </section>
          </div>

          <aside className="space-y-8">
            <section className="rounded-[1.75rem] border border-sage-100 bg-white p-6 shadow-soft sm:p-8 dark:border-white/10 dark:bg-white/5">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-display text-2xl font-semibold text-sage-900 dark:text-sage-50">Today's Notes</h3>
                  <p className="mt-2 text-sm text-sage-500 dark:text-sage-300">Brief reminders to carry the day more gently.</p>
                </div>
                <button className="text-sage-600 transition-colors hover:text-sage-800 dark:text-sage-300 dark:hover:text-white" onClick={handleAddNote} type="button">
                  <span className="material-symbols-outlined">add_circle</span>
                </button>
              </div>

              <ul className="space-y-4">
                {hasNotes ? notes.map((note, index) => (
                  <li key={`${note}-${index}`} className="group flex items-start gap-3">
                    <div className="mt-2 size-2 rounded-full bg-sage-300 transition-colors group-hover:bg-sage-600" />
                    <p className="text-sm leading-7 text-slate-600 dark:text-sage-200">{note}</p>
                  </li>
                )) : (
                  <li className="text-sm leading-7 text-sage-500 dark:text-sage-300">
                    Add a support note to save a gentle reminder for later in the day.
                  </li>
                )}
              </ul>
            </section>

            <section className="overflow-hidden rounded-[1.75rem] border border-sage-100 bg-white shadow-soft">
              <div className="relative h-72">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage:
                      'url("https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80")',
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-sage-900 via-sage-900/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">Daily Wisdom</p>
                  <p className="mt-3 font-display text-2xl font-semibold italic leading-tight">
                    In every walk with nature, one receives far more than he seeks.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-sage-100 bg-sage-900 p-6 text-sage-50 shadow-soft sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sage-200/80">Reflection Cue</p>
              <h3 className="mt-3 font-display text-3xl font-semibold">What would feel most comforting right now?</h3>
              <p className="mt-4 text-sm leading-7 text-sage-100/80">
                Start with a truthful answer. Your next step can be small, quiet, and enough.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
