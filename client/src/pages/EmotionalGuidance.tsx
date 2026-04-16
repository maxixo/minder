import { useState } from 'react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/useAuth';

const initialWeek = [
  { day: 'Mon', checked: true },
  { day: 'Tue', checked: true },
  { day: 'Wed', checked: true },
  { day: 'Thu', checked: false },
  { day: 'Fri', checked: false },
  { day: 'Sat', checked: false },
  { day: 'Sun', checked: false },
];

const copingStrategies = [
  { icon: 'air', label: 'Deep Breathing' },
  { icon: 'directions_walk', label: 'Short Walk' },
  { icon: 'music_note', label: 'Listen to Music' },
  { icon: 'self_improvement', label: '5-Min Meditation' },
  { icon: 'local_cafe', label: 'Mindful Tea' },
];

const initialNotes = [
  'Feeling more grounded after the morning sun. Remind myself to step outside at lunch.',
  'The forest sounds playlist really helped with focusing on the report today.',
  'Note: Buy fresh lavender for the bedside table to help with sleep.',
  "Practice saying 'no' to extra tasks this weekend. Protect my peace.",
];

export default function EmotionalGuidance() {
  const { user } = useAuth();
  const [week, setWeek] = useState(initialWeek);
  const [whereYouAre, setWhereYouAre] = useState('');
  const [feelings, setFeelings] = useState('');
  const [thoughts, setThoughts] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState('Deep Breathing');
  const [notes, setNotes] = useState(initialNotes);

  const firstName = user?.name?.split(' ')[0] || 'Friend';
  const completedDays = week.filter((item) => item.checked).length;

  const toggleDay = (index: number) => {
    setWeek((current) => current.map((item, itemIndex) => (
      itemIndex === index ? { ...item, checked: !item.checked } : item
    )));
  };

  const handleSave = () => {
    toast.success('Emotional reflection saved');
  };

  const handleAddNote = () => {
    const note = selectedStrategy
      ? `Support plan for today: lean on ${selectedStrategy.toLowerCase()} when the day feels heavy.`
      : 'Pause, soften your shoulders, and return to one calm breath.';

    setNotes((current) => [note, ...current].slice(0, 6));
    toast.success('Support note added');
  };

  return (
    <div className="-mx-4 min-h-full bg-[#f6f8f7] px-4 text-slate-900 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 py-2 animate-fade-in">
        <section className="overflow-hidden rounded-[2rem] border border-sage-100 bg-gradient-to-br from-white via-sand-50 to-sage-50 shadow-soft">
          <div className="flex flex-col gap-6 px-6 py-8 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-10">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sage-500">Emotional Guidance</p>
              <h1 className="mt-3 font-display text-4xl font-semibold text-sage-900 sm:text-5xl">
                A softer check-in for {firstName}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-sage-600 sm:text-lg">
                A sanctuary for your daily mindfulness and self-reflection. Name what is present, notice what you need,
                and choose one gentle way to support yourself.
              </p>
            </div>

            <div className="flex flex-col gap-3 rounded-[1.5rem] border border-sage-100 bg-white/80 p-5 shadow-sm backdrop-blur sm:min-w-[240px]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sage-500">Weekly Rhythm</p>
              <p className="font-display text-3xl font-semibold text-sage-800">{completedDays}/7 days</p>
              <p className="text-sm text-sage-500">Small, steady moments of awareness count more than perfect streaks.</p>
            </div>
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-sage-100 bg-white p-6 shadow-soft sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-sage-100 text-sage-700">
              <span className="material-symbols-outlined">calendar_month</span>
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold text-sage-900">Weekly Consistency Tracker</h2>
              <p className="text-sm text-sage-500">Mark each day you paused for an honest emotional check-in.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {week.map((item, index) => {
              const isCurrentDay = item.day === 'Thu';

              return (
                <label
                  key={item.day}
                  className={clsx(
                    'flex cursor-pointer flex-col items-center gap-3 rounded-2xl border p-4 transition-all',
                    item.checked ? 'border-sage-200 bg-sage-50' : 'border-sage-100 bg-sand-50/70 hover:border-sage-200',
                    isCurrentDay && 'ring-2 ring-sage-300/60'
                  )}
                >
                  <span className={clsx(
                    'text-xs font-bold uppercase tracking-[0.25em]',
                    isCurrentDay ? 'text-sage-700' : 'text-sage-500'
                  )}>
                    {item.day}
                  </span>
                  <input
                    checked={item.checked}
                    className="h-6 w-6 rounded-full border-sage-300 text-sage-600 focus:ring-sage-500"
                    onChange={() => toggleDay(index)}
                    type="checkbox"
                  />
                </label>
              );
            })}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
          <div className="space-y-8 xl:col-span-2">
            <section className="rounded-[1.75rem] border border-sage-100 bg-white p-6 shadow-soft sm:p-8 lg:p-10">
              <div className="mb-8 flex items-center justify-between gap-4 border-b border-sage-100 pb-4">
                <div>
                  <h2 className="font-display text-3xl font-semibold text-sage-900">Emotional Check-In</h2>
                  <p className="mt-2 text-sm text-sage-500">Move slowly. Let each answer be true rather than polished.</p>
                </div>
                <div className="hidden rounded-full bg-sage-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-sage-500 sm:block">
                  Present Moment
                </div>
              </div>

              <div className="space-y-7">
                <div className="space-y-3">
                  <label className="font-display text-2xl italic text-sage-800" htmlFor="where-you-are">
                    Where are you right now?
                  </label>
                  <textarea
                    className="w-full resize-none rounded-3xl border border-sage-200 bg-sand-50 px-5 py-4 text-base text-slate-800 placeholder:text-sage-400 focus:border-sage-400 focus:ring-sage-200"
                    id="where-you-are"
                    onChange={(event) => setWhereYouAre(event.target.value)}
                    placeholder="Describe your physical surroundings or mental state..."
                    rows={3}
                    value={whereYouAre}
                  />
                </div>

                <div className="space-y-3">
                  <label className="font-display text-2xl italic text-sage-800" htmlFor="feelings">
                    How are you feeling?
                  </label>
                  <textarea
                    className="w-full resize-none rounded-3xl border border-sage-200 bg-sand-50 px-5 py-4 text-base text-slate-800 placeholder:text-sage-400 focus:border-sage-400 focus:ring-sage-200"
                    id="feelings"
                    onChange={(event) => setFeelings(event.target.value)}
                    placeholder="Acknowledge your emotions without judgment..."
                    rows={3}
                    value={feelings}
                  />
                </div>

                <div className="space-y-3">
                  <label className="font-display text-2xl italic text-sage-800" htmlFor="thoughts">
                    What are you thinking?
                  </label>
                  <textarea
                    className="w-full resize-none rounded-3xl border border-sage-200 bg-sand-50 px-5 py-4 text-base text-slate-800 placeholder:text-sage-400 focus:border-sage-400 focus:ring-sage-200"
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
                  className="inline-flex items-center gap-2 rounded-full bg-sage-700 px-6 py-3 font-semibold text-white transition-all hover:bg-sage-800 hover:shadow-lifted"
                  onClick={handleSave}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">save</span>
                  Save Reflection
                </button>
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-sand-200 bg-sand-100/70 p-6 shadow-soft sm:p-8">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-display text-2xl font-semibold text-sage-900">Coping Strategies</h3>
                  <p className="mt-2 text-sm text-sage-600">Pick one supportive action to return to if your emotions start to swell.</p>
                </div>
                <div className="rounded-full bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-sage-500">
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
                          ? 'border-sage-300 bg-white text-sage-800 shadow-sm'
                          : 'border-sand-300 bg-sand-50 text-sage-700 hover:border-sage-200 hover:bg-white'
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

              <div className="mt-6 rounded-[1.5rem] border border-white/70 bg-white/70 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sage-500">Chosen support</p>
                <p className="mt-2 font-display text-2xl font-semibold text-sage-800">{selectedStrategy}</p>
                <p className="mt-2 text-sm leading-6 text-sage-600">
                  Let this be your next kind action, not another task to perform perfectly.
                </p>
              </div>
            </section>
          </div>

          <aside className="space-y-8">
            <section className="rounded-[1.75rem] border border-sage-100 bg-white p-6 shadow-soft sm:p-8">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-display text-2xl font-semibold text-sage-900">Today's Notes</h3>
                  <p className="mt-2 text-sm text-sage-500">Brief reminders to carry the day more gently.</p>
                </div>
                <button className="text-sage-600 transition-colors hover:text-sage-800" onClick={handleAddNote} type="button">
                  <span className="material-symbols-outlined">add_circle</span>
                </button>
              </div>

              <ul className="space-y-4">
                {notes.map((note, index) => (
                  <li key={`${note}-${index}`} className="group flex items-start gap-3">
                    <div className="mt-2 size-2 rounded-full bg-sage-300 transition-colors group-hover:bg-sage-600" />
                    <p className="text-sm leading-7 text-slate-600">{note}</p>
                  </li>
                ))}
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
