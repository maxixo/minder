import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { toast } from 'sonner';
import BrandLogo from '@/components/common/BrandLogo';
import { useDailyEntry } from '@/hooks/useDailyEntry';
import ProfileMenu from '@/components/common/ProfileMenu';
import type { CustomSelfCareItem, DailyEntryPatch, EntryFeeling } from '@/types/entry';
import '@/styles/pages/self-care.css';

const moodOptions = [
  { key: 'happy', emoji: '😊', label: 'Happy', feeling: 'happy' },
  { key: 'overwhelmed', emoji: '🤯', label: 'Overwhelmed', feeling: 'overwhelmed' },
  { key: 'peace', emoji: '🕊️', label: 'Peace', feeling: 'peace' },
  { key: 'calm', emoji: '😌', label: 'Calm', feeling: 'relaxed' },
  { key: 'anxious', emoji: '😟', label: 'Anxious', feeling: 'worried' },
  { key: 'grateful', emoji: '🙏', label: 'Grateful', feeling: 'happy' },
  { key: 'tired', emoji: '🥱', label: 'Tired', feeling: 'tired' },
  { key: 'inspired', emoji: '✨', label: 'Inspired', feeling: 'excited' },
  { key: 'stressed', emoji: '😫', label: 'Stressed', feeling: 'angry' },
  { key: 'content', emoji: '🌻', label: 'Content', feeling: 'relaxed' },
  { key: 'sad', emoji: '😢', label: 'Sad', feeling: 'sad' },
  { key: 'energetic', emoji: '⚡', label: 'Energetic', feeling: 'excited' },
] as const;

const activityConfig = [
  { key: 'reading', icon: 'menu_book', label: 'Reading', unit: 'Chapters today', max: 5 },
  { key: 'music', icon: 'headphones', label: 'Music', unit: 'Sessions today', max: 7 },
  { key: 'mindfulness', icon: 'self_improvement', label: 'Mindfulness', unit: 'Sessions today', max: 5 },
] as const;

const ratingConfig = [
  { key: 'selfTalk', label: 'Self-Talk' },
  { key: 'energyLevel', label: 'Energy Level' },
  { key: 'overallDay', label: 'Overall Day' },
] as const;

const checklistConfig = [
  { key: 'ateBreakfast', icon: 'breakfast_dining', label: 'Eat breakfast', detail: 'Start the day with something nourishing.', fields: ['ateBreakfast'] },
  { key: 'ateLunch', icon: 'lunch_dining', label: 'Eat lunch', detail: 'Pause and refuel in the middle of the day.', fields: ['ateLunch'] },
  { key: 'ateDinner', icon: 'dinner_dining', label: 'Eat dinner', detail: 'Close the day with a proper meal.', fields: ['ateDinner'] },
  { key: 'drankWater', icon: 'water_drop', label: 'Drink enough water', detail: 'Aim for steady hydration through the day.', fields: ['drankWater'] },
  { key: 'slept7to9Hours', icon: 'bedtime', label: 'Sleep 7 to 9 hours', detail: 'Protect a full night of recovery.', fields: ['slept7to9Hours'] },
  { key: 'exercised', icon: 'fitness_center', label: 'Move your body', detail: 'Exercise, stretch, or take a purposeful walk.', fields: ['exercised'] },
  { key: 'gotFreshAir', icon: 'nature', label: 'Get fresh air', detail: 'Step outside for a reset, even briefly.', fields: ['gotFreshAir'] },
  { key: 'readBook', icon: 'menu_book', label: 'Read a book', detail: 'Spend a few quiet minutes reading.', fields: ['readBook'] },
  { key: 'listenedToMusic', icon: 'headphones', label: 'Listen to music', detail: 'Play something that helps you reset.', fields: ['listenedToMusic'] },
  { key: 'meditated', icon: 'self_improvement', label: 'Meditate or breathe', detail: 'Take a mindful pause to slow things down.', fields: ['meditated'] },
  { key: 'stretched', icon: 'accessibility_new', label: 'Stretch', detail: 'Loosen tension in your body.', fields: ['stretched'] },
  { key: 'journaled', icon: 'edit_note', label: 'Journal', detail: 'Write down what you are carrying.', fields: ['journaled'] },
  { key: 'calledFriend', icon: 'call', label: 'Call or text a friend', detail: 'Reach out instead of staying isolated.', fields: ['calledFriend'] },
  { key: 'tookNap', icon: 'hotel', label: 'Take a nap', detail: 'Rest if your energy is running low.', fields: ['tookNap'] },
  { key: 'watchedMovie', icon: 'movie', label: 'Watch something comforting', detail: 'Choose a calming, familiar watch.', fields: ['watchedMovie'] },
] as const;

type ActivityKey = (typeof activityConfig)[number]['key'];
type RatingKey = (typeof ratingConfig)[number]['key'];
type MoodKey = (typeof moodOptions)[number]['key'];
type ChecklistKey = (typeof checklistConfig)[number]['key'];
type ChecklistField = (typeof checklistConfig)[number]['fields'][number];
const SELF_CARE_MOOD_PREFIX = 'selfcare:mood:';
const MAX_CUSTOM_CHECKLIST_ITEMS = 20;
const MAX_CUSTOM_CHECKLIST_TEXT_LENGTH = 120;

const feelingByMoodKey: Record<MoodKey, Exclude<EntryFeeling, null>> = moodOptions.reduce((accumulator, option) => {
  accumulator[option.key] = option.feeling;
  return accumulator;
}, {} as Record<MoodKey, Exclude<EntryFeeling, null>>);

const moodKeyByFeeling = moodOptions.reduce((accumulator, option) => {
  if (!(option.feeling in accumulator)) {
    accumulator[option.feeling] = option.key;
  }
  return accumulator;
}, {} as Record<Exclude<EntryFeeling, null>, MoodKey>);

const emptyChecklist = (): Record<ChecklistKey, boolean> => ({
  ateBreakfast: false,
  ateLunch: false,
  ateDinner: false,
  drankWater: false,
  slept7to9Hours: false,
  exercised: false,
  gotFreshAir: false,
  readBook: false,
  listenedToMusic: false,
  meditated: false,
  stretched: false,
  journaled: false,
  calledFriend: false,
  tookNap: false,
  watchedMovie: false,
});

const isMoodKey = (value: string): value is MoodKey => (
  moodOptions.some((option) => option.key === value)
);

const getSavedSelfCareMood = (value?: string | null): MoodKey | null => {
  if (typeof value !== 'string' || !value.startsWith(SELF_CARE_MOOD_PREFIX)) return null;

  const moodKey = value.slice(SELF_CARE_MOOD_PREFIX.length);
  return isMoodKey(moodKey) ? moodKey : null;
};

export default function SelfCare() {
  const { entry, error, loading, saveEntryPatch, saving } = useDailyEntry();
  const [selectedMood, setSelectedMood] = useState<MoodKey | null>(null);
  const [thoughts, setThoughts] = useState('');
  const [activities, setActivities] = useState<Record<ActivityKey, number>>({
    reading: 0,
    music: 0,
    mindfulness: 0,
  });
  const [ratings, setRatings] = useState<Record<RatingKey, number>>({
    selfTalk: 0,
    energyLevel: 0,
    overallDay: 0,
  });
  const [checklist, setChecklist] = useState<Record<ChecklistKey, boolean>>(emptyChecklist);
  const [customChecklist, setCustomChecklist] = useState<CustomSelfCareItem[]>([]);
  const [customChecklistInput, setCustomChecklistInput] = useState('');

  const checkedCount = Object.values(checklist).filter(Boolean).length
    + customChecklist.filter((item) => item.completed).length;
  const totalChecklistItems = checklistConfig.length + customChecklist.length;
  const completionRate = totalChecklistItems
    ? Math.round((checkedCount / totalChecklistItems) * 100)
    : 0;

  useEffect(() => {
    if (!entry) return;

    setSelectedMood(
      getSavedSelfCareMood(entry.selfAssessmentNote)
      || (entry.feeling ? moodKeyByFeeling[entry.feeling] || null : null)
    );
    setThoughts(entry.mindThoughts || '');
    setActivities({
      reading: entry.activities?.reading || 0,
      music: entry.activities?.music || 0,
      mindfulness: entry.activities?.mindfulness || 0,
    });
    setRatings({
      selfTalk: entry.ratings?.selfTalk || 0,
      energyLevel: entry.ratings?.energyPoint || 0,
      overallDay: entry.ratings?.overall || 0,
    });
    setChecklist({
      ateBreakfast: Boolean(entry.selfCareChecklist?.ateBreakfast),
      ateLunch: Boolean(entry.selfCareChecklist?.ateLunch),
      ateDinner: Boolean(entry.selfCareChecklist?.ateDinner),
      drankWater: Boolean(entry.selfCareChecklist?.drankWater),
      slept7to9Hours: Boolean(entry.selfCareChecklist?.slept7to9Hours),
      exercised: Boolean(entry.selfCareChecklist?.exercised),
      gotFreshAir: Boolean(entry.selfCareChecklist?.gotFreshAir),
      readBook: Boolean(entry.selfCareChecklist?.readBook),
      listenedToMusic: Boolean(entry.selfCareChecklist?.listenedToMusic),
      meditated: Boolean(entry.selfCareChecklist?.meditated),
      stretched: Boolean(entry.selfCareChecklist?.stretched),
      journaled: Boolean(entry.selfCareChecklist?.journaled),
      calledFriend: Boolean(entry.selfCareChecklist?.calledFriend),
      tookNap: Boolean(entry.selfCareChecklist?.tookNap),
      watchedMovie: Boolean(entry.selfCareChecklist?.watchedMovie),
    });
    setCustomChecklist(entry.customSelfCareChecklist || []);
    setCustomChecklistInput('');
  }, [entry]);

  const adjustActivity = (key: ActivityKey, delta: number) => {
    const config = activityConfig.find((activity) => activity.key === key);
    const max = config?.max ?? Number.POSITIVE_INFINITY;

    setActivities((current) => ({
      ...current,
      [key]: Math.min(max, Math.max(0, current[key] + delta)),
    }));
  };

  const toggleChecklistItem = (key: ChecklistKey) => {
    setChecklist((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  const handleAddCustomChecklistItem = () => {
    const text = customChecklistInput.trim();
    if (!text) return;

    if (text.length > MAX_CUSTOM_CHECKLIST_TEXT_LENGTH) {
      toast.error(`Custom checklist items must be ${MAX_CUSTOM_CHECKLIST_TEXT_LENGTH} characters or fewer.`);
      return;
    }

    if (customChecklist.length >= MAX_CUSTOM_CHECKLIST_ITEMS) {
      toast.error(`You can add up to ${MAX_CUSTOM_CHECKLIST_ITEMS} custom checklist items.`);
      return;
    }

    if (customChecklist.some((item) => item.text.toLocaleLowerCase() === text.toLocaleLowerCase())) {
      toast.error('That custom checklist item already exists.');
      return;
    }

    setCustomChecklist((current) => [
      ...current,
      {
        id: globalThis.crypto?.randomUUID?.() || `custom-${Date.now()}`,
        text,
        completed: false,
      },
    ]);
    setCustomChecklistInput('');
  };

  const toggleCustomChecklistItem = (id: string) => {
    setCustomChecklist((current) => current.map((item) => (
      item.id === id ? { ...item, completed: !item.completed } : item
    )));
  };

  const removeCustomChecklistItem = (id: string) => {
    setCustomChecklist((current) => current.filter((item) => item.id !== id));
  };

  const handleSave = async () => {
    const checklistPatch = checklistConfig.reduce((accumulator, item) => {
      item.fields.forEach((field) => {
        accumulator[field] = checklist[item.key];
      });
      return accumulator;
    }, {} as Record<ChecklistField, boolean>);

    const patch: DailyEntryPatch = {
      feeling: selectedMood ? feelingByMoodKey[selectedMood] : null,
      selfAssessmentNote: selectedMood ? `${SELF_CARE_MOOD_PREFIX}${selectedMood}` : '',
      activities: {
        reading: activities.reading,
        music: activities.music,
        mindfulness: activities.mindfulness,
      },
      mindThoughts: thoughts.trim(),
      ratings: {
        selfTalk: ratings.selfTalk || null,
        energyPoint: ratings.energyLevel || null,
        overall: ratings.overallDay || null,
      },
      selfCareChecklist: checklistPatch,
      customSelfCareChecklist: customChecklist.map((item) => ({
        ...item,
        text: item.text.trim(),
      })),
    };

    try {
      await saveEntryPatch(patch, 'selfcare');
      toast.success('Self-care check-in saved');
    } catch (saveError: any) {
      toast.error(saveError?.response?.data?.message || 'Unable to save self-care check-in');
    }
  };

  return (
    <div className="animate-fade-in pb-10 transition-colors [&_h1]:font-body [&_h2]:font-body [&_h3]:font-body [&_h4]:font-body [&_h5]:font-body [&_h6]:font-body">
      <div className="relative flex min-h-full w-full flex-col">
        <header className="sticky top-4 z-20 flex items-center justify-between whitespace-nowrap border-b border-solid border-sage-100 bg-white px-6 py-3 shadow-sm sm:px-8 dark:border-white/10 dark:bg-[#15201a]/90">
          <div className="flex items-center gap-4 text-sage-600 dark:text-sage-100">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#13ec25]/20 dark:bg-[#13ec25]/15">
              <span className="material-symbols-outlined text-sage-600 dark:text-sage-100">psychology_alt</span>
            </div>
            <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] text-sage-900 dark:text-sage-50">Self-Care Hub</h2>
          </div>

          <div className="flex flex-1 justify-end gap-8">
            <nav className="hidden items-center gap-9 xl:flex">
                <a className="text-sm font-medium leading-normal text-sage-900 transition-colors hover:text-[#13ec25] dark:text-sage-100" href="#">
                  Activities
                </a>
                <a className="text-sm font-medium leading-normal text-sage-900 transition-colors hover:text-[#13ec25] dark:text-sage-100" href="#">
                  Reflections
                </a>
                <a className="text-sm font-medium leading-normal text-sage-900 transition-colors hover:text-[#13ec25] dark:text-sage-100" href="#">
                  History
                </a>
                <a className="text-sm font-medium leading-normal text-sage-900 transition-colors hover:text-[#13ec25] dark:text-sage-100" href="#">
                  Wellness Guide
                </a>
              </nav>

            <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-50 text-sage-900 dark:bg-white/10 dark:text-sage-100" type="button">
              <span className="material-symbols-outlined">notifications</span>
            </button>

            <ProfileMenu buttonClassName="border-sage-200 bg-white text-sage-900 hover:bg-sage-50 dark:border-white/10 dark:bg-white/5 dark:text-sage-100 dark:hover:bg-white/10" />
          </div>
        </header>

        <main className="flex flex-1 px-0 py-8 sm:px-0">
          <div className="flex w-full flex-1 flex-col">
            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black leading-tight tracking-[-0.033em] text-sage-900 dark:text-sage-50">Daily Activity Hub</h1>
                <p className="text-base font-normal leading-normal text-sage-500 dark:text-sage-300">
                  Rooted in mindfulness. Nourish your mind and spirit today.
                </p>
              </div>

              <button
                className="inline-flex items-center justify-center gap-2 rounded-full bg-sage-900 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-sage-800 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={loading || saving}
                onClick={handleSave}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                {saving ? 'Saving...' : 'Save Check-In'}
              </button>
            </div>

            {loading ? (
              <div className="mb-6 rounded-xl border border-sage-100 bg-white px-5 py-4 text-sm font-medium text-sage-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-sage-200">
                Loading today&apos;s self-care check-in...
              </div>
            ) : null}

            {error ? (
              <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-800 shadow-sm">
                {error}
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="flex flex-col gap-8 lg:col-span-2">
                <section>
                  <h2 className="mb-4 text-[22px] font-bold leading-tight tracking-[-0.015em] text-sage-900 dark:text-sage-50">How are you feeling?</h2>
                  <div className="grid grid-cols-3 gap-3 md:grid-cols-4 lg:grid-cols-6">
                    {moodOptions.map((mood) => {
                      const isSelected = selectedMood === mood.key;

                      return (
                        <button
                          key={mood.key}
                          className={clsx(
                            'group flex cursor-pointer flex-col items-center justify-center rounded-xl border bg-white p-4 shadow-sm transition-all dark:bg-white/5',
                            isSelected
                              ? 'border-[#13ec25] bg-[#13ec25]/10 dark:bg-[#13ec25]/15'
                              : 'border-sage-100 hover:border-[#13ec25] dark:border-white/10'
                          )}
                          onClick={() => setSelectedMood(mood.key)}
                          type="button"
                        >
                          <span className="mb-2 text-3xl">{mood.emoji}</span>
                          <p className="text-sm font-medium text-sage-900 dark:text-sage-100">{mood.label}</p>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section>
                  <h2 className="mb-4 text-[22px] font-bold leading-tight tracking-[-0.015em] text-sage-900 dark:text-sage-50">Activity Progress</h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {activityConfig.map((activity) => (
                      <div
                        key={activity.key}
                        className="flex flex-col items-center gap-3 rounded-xl border border-sage-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5"
                      >
                        <span className="material-symbols-outlined text-4xl text-sage-500">{activity.icon}</span>
                        <span className="text-lg font-bold">{activity.label}</span>
                        <div className="flex items-center gap-4">
                          <button
                            className="flex size-8 items-center justify-center rounded-full bg-sage-50 text-sage-600 dark:bg-white/10 dark:text-sage-100"
                            onClick={() => adjustActivity(activity.key, -1)}
                            type="button"
                          >
                            -
                          </button>
                          <span className="text-2xl font-black">{activities[activity.key]}</span>
                          <button
                            className="flex size-8 items-center justify-center rounded-full bg-[#13ec25]/20 text-sage-600"
                            onClick={() => adjustActivity(activity.key, 1)}
                            type="button"
                          >
                            +
                          </button>
                        </div>
                        <p className="text-xs text-sage-400">{activity.unit}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h2 className="mb-4 text-[22px] font-bold leading-tight tracking-[-0.015em] text-sage-900 dark:text-sage-50">Mind Thoughts</h2>
                  <div className="relative overflow-hidden rounded-xl border border-sage-100 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
                    <div aria-hidden="true" className="self-care-botanical-watermark pointer-events-none absolute inset-0 opacity-5" />
                    <textarea
                      className="h-48 w-full resize-none border-none bg-transparent p-6 text-sage-900 placeholder-sage-300 focus:ring-2 focus:ring-[#13ec25]/50 dark:text-sage-50 dark:placeholder:text-sage-500"
                      onChange={(event) => setThoughts(event.target.value)}
                      placeholder="What's on your mind? Let it flow onto the page..."
                      value={thoughts}
                    />
                  </div>
                </section>

                <section className="mb-10 rounded-xl bg-sage-50 p-6 dark:bg-white/5">
                  <h2 className="mb-6 text-xl font-bold text-sage-900 dark:text-sage-50">Daily Ratings</h2>
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    {ratingConfig.map((rating) => (
                      <div key={rating.key} className="flex flex-col gap-2">
                        <p className="text-sm font-medium text-sage-600 dark:text-sage-300">{rating.label}</p>
                        <div className="flex gap-1">
                          {Array.from({ length: 5 }, (_, index) => {
                            const selected = index < ratings[rating.key];

                            return (
                              <button
                                key={`${rating.key}-${index + 1}`}
                                className="flex items-center justify-center"
                                onClick={() => setRatings((current) => ({ ...current, [rating.key]: index + 1 }))}
                                type="button"
                              >
                                <span
                                  className={clsx(
                                    'material-symbols-outlined text-[22px]',
                                    selected ? 'self-care-filled-icon text-[#13ec25]' : 'text-sage-200'
                                  )}
                                >
                                  star
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <aside className="flex flex-col gap-6">
                <div className="sticky top-24 rounded-xl border border-sage-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-lg font-bold">Self-Care Checklist</h3>
                    <span className="rounded bg-sage-50 px-2 py-1 text-xs font-bold text-sage-500 dark:bg-white/10 dark:text-sage-300">{completionRate}% Done</span>
                  </div>

                  <div className="mb-8 h-2 w-full overflow-hidden rounded-full bg-sage-100">
                    <div className="h-full rounded-full bg-[#13ec25]" style={{ width: `${completionRate}%` }} />
                  </div>

                  <p className="mb-5 text-sm leading-6 text-sage-500 dark:text-sage-300">
                    Track the small restorative actions that make the day feel steadier.
                  </p>

                  <ul className="flex flex-col gap-3">
                    {checklistConfig.map((item) => (
                      <li
                        key={item.key}
                        className="group flex items-start justify-between gap-3 rounded-xl border border-sage-100 bg-sage-50/50 p-3 transition-colors hover:border-[#13ec25]/40 hover:bg-sage-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                      >
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined mt-0.5 text-sage-400 transition-colors group-hover:text-[#13ec25]">
                            {item.icon}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-sage-900 dark:text-sage-100">{item.label}</p>
                            <p className="mt-1 text-xs leading-5 text-sage-500 dark:text-sage-300">{item.detail}</p>
                          </div>
                        </div>
                        <input
                          checked={checklist[item.key]}
                          className="mt-1 h-5 w-5 rounded border-sage-300 text-[#13ec25] focus:ring-[#13ec25]"
                          onChange={() => toggleChecklistItem(item.key)}
                          type="checkbox"
                        />
                      </li>
                    ))}
                  </ul>

                  <div className="mt-7 border-t border-sage-100 pt-6 dark:border-white/10">
                    <div className="mb-4">
                      <p className="text-sm font-bold text-sage-900 dark:text-sage-50">Your own checklist</p>
                      <p className="mt-1 text-xs leading-5 text-sage-500 dark:text-sage-300">
                        Add the specific care actions that matter to you today.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <input
                        className="min-w-0 flex-1 rounded-xl border border-sage-200 bg-sage-50 px-3 py-2.5 text-sm text-sage-900 outline-none placeholder:text-sage-400 focus:border-[#13ec25] focus:ring-2 focus:ring-[#13ec25]/20 dark:border-white/10 dark:bg-[#101915] dark:text-sage-50"
                        maxLength={MAX_CUSTOM_CHECKLIST_TEXT_LENGTH}
                        onChange={(event) => setCustomChecklistInput(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key !== 'Enter') return;
                          event.preventDefault();
                          handleAddCustomChecklistItem();
                        }}
                        placeholder="e.g. Take medication"
                        type="text"
                        value={customChecklistInput}
                      />
                      <button
                        aria-label="Add custom checklist item"
                        className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sage-900 text-white transition-colors hover:bg-sage-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-sage-100 dark:text-sage-900"
                        disabled={!customChecklistInput.trim() || customChecklist.length >= MAX_CUSTOM_CHECKLIST_ITEMS}
                        onClick={handleAddCustomChecklistItem}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[19px]">add</span>
                      </button>
                    </div>

                    {customChecklist.length ? (
                      <ul className="mt-4 flex flex-col gap-3">
                        {customChecklist.map((item) => (
                          <li
                            key={item.id}
                            className="group flex items-center gap-3 rounded-xl border border-sage-100 bg-white p-3 dark:border-white/10 dark:bg-white/5"
                          >
                            <input
                              checked={item.completed}
                              className="h-5 w-5 shrink-0 rounded border-sage-300 text-[#13ec25] focus:ring-[#13ec25]"
                              onChange={() => toggleCustomChecklistItem(item.id)}
                              type="checkbox"
                            />
                            <span className={clsx(
                              'min-w-0 flex-1 text-sm text-sage-900 dark:text-sage-100',
                              item.completed && 'text-sage-500 line-through dark:text-sage-400'
                            )}>
                              {item.text}
                            </span>
                            <button
                              aria-label={`Remove ${item.text}`}
                              className="text-sage-400 transition-colors hover:text-clay-600"
                              onClick={() => removeCustomChecklistItem(item.id)}
                              type="button"
                            >
                              <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-4 text-xs italic text-sage-400">No custom items yet.</p>
                    )}
                  </div>

                  <div className="mt-8 rounded-xl border border-[#13ec25]/20 bg-[#13ec25]/10 p-4 dark:bg-[#13ec25]/12">
                    <p className="mb-1 text-xs font-bold text-sage-600 dark:text-sage-200">PROMPT OF THE DAY</p>
                    <p className="text-sm italic text-sage-700 dark:text-sage-100">
                      &quot;What is one thing you can forgive yourself for today?&quot;
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </main>

        <footer className="border-t border-sage-100 px-10 py-6 text-center text-sm text-sage-400 dark:border-white/10 dark:text-sage-400">
          <div className="flex flex-col items-center gap-3">
            <BrandLogo
              titleClassName="text-lg text-sage-700 dark:text-sage-50"
              iconClassName="h-8 w-8 text-[#44604a] dark:text-sage-50"
            />
            <p>Copyright 2024 MindfulLife. Crafted for mindfulness.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
