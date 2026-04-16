import { useState } from 'react';
import clsx from 'clsx';
import '@/styles/pages/self-care.css';

const moodOptions = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '🤯', label: 'Overwhelmed' },
  { emoji: '🕊️', label: 'Peace' },
  { emoji: '😌', label: 'Calm' },
  { emoji: '😟', label: 'Anxious' },
  { emoji: '🙏', label: 'Grateful' },
  { emoji: '🥱', label: 'Tired' },
  { emoji: '✨', label: 'Inspired' },
  { emoji: '😫', label: 'Stressed' },
  { emoji: '🌻', label: 'Content' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '⚡', label: 'Energetic' },
];

const activityConfig = [
  { key: 'reading', icon: 'menu_book', label: 'Reading', unit: 'Chapters today' },
  { key: 'music', icon: 'headphones', label: 'Music', unit: 'Minutes listened' },
  { key: 'mindfulness', icon: 'self_improvement', label: 'Mindfulness', unit: 'Minutes practiced' },
] as const;

const ratingConfig = [
  { key: 'selfTalk', label: 'Self-Talk' },
  { key: 'energyLevel', label: 'Energy Level' },
  { key: 'overallDay', label: 'Overall Day' },
] as const;

type ActivityKey = (typeof activityConfig)[number]['key'];
type RatingKey = (typeof ratingConfig)[number]['key'];

export default function SelfCare() {
  const [selectedMood, setSelectedMood] = useState('Happy');
  const [thoughts, setThoughts] = useState('');
  const [activities, setActivities] = useState<Record<ActivityKey, number>>({
    reading: 2,
    music: 45,
    mindfulness: 15,
  });
  const [ratings, setRatings] = useState<Record<RatingKey, number>>({
    selfTalk: 4,
    energyLevel: 3,
    overallDay: 5,
  });
  const [checklist, setChecklist] = useState([
    { icon: 'restaurant', label: 'Nutritious Meals', checked: true },
    { icon: 'fitness_center', label: 'Daily Exercise', checked: true },
    { icon: 'water_drop', label: 'Hydration (8 glasses)', checked: false },
    { icon: 'bedtime', label: '8 Hours Sleep', checked: true },
    { icon: 'nature', label: 'Outdoor Walk', checked: false },
  ]);

  const adjustActivity = (key: ActivityKey, delta: number) => {
    setActivities((current) => ({
      ...current,
      [key]: Math.max(0, current[key] + delta),
    }));
  };

  const toggleChecklistItem = (index: number) => {
    setChecklist((current) => current.map((item, itemIndex) => (
      itemIndex === index ? { ...item, checked: !item.checked } : item
    )));
  };

  return (
    <div className="-mx-4 min-h-full bg-[#f6f8f6] px-4 font-sans text-slate-900 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="relative mx-auto flex min-h-full w-full max-w-[1200px] flex-col animate-fade-in">
        <header className="sticky top-4 z-20 flex items-center justify-between whitespace-nowrap border-b border-solid border-sage-100 bg-white px-6 py-3 shadow-sm sm:px-8">
          <div className="flex items-center gap-4 text-sage-600">
            <div className="flex size-8 items-center justify-center rounded-lg bg-[#13ec25]/20">
              <span className="material-symbols-outlined text-sage-600">psychology_alt</span>
            </div>
            <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] text-sage-900">Self-Care Hub</h2>
          </div>

          <div className="flex flex-1 justify-end gap-8">
            <nav className="hidden items-center gap-9 xl:flex">
              <a className="text-sm font-medium leading-normal text-sage-900 transition-colors hover:text-[#13ec25]" href="#">
                Activities
              </a>
              <a className="text-sm font-medium leading-normal text-sage-900 transition-colors hover:text-[#13ec25]" href="#">
                Reflections
              </a>
              <a className="text-sm font-medium leading-normal text-sage-900 transition-colors hover:text-[#13ec25]" href="#">
                History
              </a>
              <a className="text-sm font-medium leading-normal text-sage-900 transition-colors hover:text-[#13ec25]" href="#">
                Wellness Guide
              </a>
            </nav>

            <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-50 text-sage-900" type="button">
              <span className="material-symbols-outlined">notifications</span>
            </button>

            <div
              aria-label="Profile picture of a smiling person"
              className="size-10 rounded-full border-2 border-[#13ec25] bg-cover bg-center bg-no-repeat"
              role="img"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBOn39ziADgp9bCn_I0o0FTVA8tZ6IefeMXBdkuA1f0knBaAQwqBVEbI4_mCQpdO3BlLy0ZI52JOV2qQIRqBCxQvqwDBLhgCNN92SG8AfdMVtVJuaJ2Hka42noTVq06kERS3WuezXRQGWE-ScdyJUucO1mXzgx7D2WL_Zbg_kFs7HUDsfo0TcxLcU7iJ4mraDPg9kLHWGNusNu3eBIU2BPtqQdvlUsXMAmbmr7K_4wCCX_ibPwq1Nl5w3vUTyg-vJOWBp0Z3COkv0ab")',
              }}
            />
          </div>
        </header>

        <main className="flex flex-1 justify-center px-0 py-8 sm:px-0">
          <div className="flex w-full max-w-[1200px] flex-1 flex-col">
            <div className="mb-8 flex flex-col gap-2">
              <h1 className="text-4xl font-black leading-tight tracking-[-0.033em] text-sage-900">Daily Activity Hub</h1>
              <p className="text-base font-normal leading-normal text-sage-500">
                Rooted in mindfulness. Nourish your mind and spirit today.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="flex flex-col gap-8 lg:col-span-2">
                <section>
                  <h2 className="mb-4 text-[22px] font-bold leading-tight tracking-[-0.015em] text-sage-900">How are you feeling?</h2>
                  <div className="grid grid-cols-3 gap-3 md:grid-cols-4 lg:grid-cols-6">
                    {moodOptions.map((mood) => {
                      const isSelected = selectedMood === mood.label;

                      return (
                        <button
                          key={mood.label}
                          className={clsx(
                            'group flex cursor-pointer flex-col items-center justify-center rounded-xl border bg-white p-4 shadow-sm transition-all',
                            isSelected
                              ? 'border-[#13ec25] bg-[#13ec25]/10'
                              : 'border-sage-100 hover:border-[#13ec25]'
                          )}
                          onClick={() => setSelectedMood(mood.label)}
                          type="button"
                        >
                          <span className="mb-2 text-3xl">{mood.emoji}</span>
                          <p className="text-sm font-medium text-sage-900">{mood.label}</p>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section>
                  <h2 className="mb-4 text-[22px] font-bold leading-tight tracking-[-0.015em] text-sage-900">Activity Progress</h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {activityConfig.map((activity) => (
                      <div
                        key={activity.key}
                        className="flex flex-col items-center gap-3 rounded-xl border border-sage-100 bg-white p-6 shadow-sm"
                      >
                        <span className="material-symbols-outlined text-4xl text-sage-500">{activity.icon}</span>
                        <span className="text-lg font-bold">{activity.label}</span>
                        <div className="flex items-center gap-4">
                          <button
                            className="flex size-8 items-center justify-center rounded-full bg-sage-50 text-sage-600"
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
                  <h2 className="mb-4 text-[22px] font-bold leading-tight tracking-[-0.015em] text-sage-900">Mind Thoughts</h2>
                  <div className="relative overflow-hidden rounded-xl border border-sage-100 bg-white shadow-sm">
                    <div aria-hidden="true" className="self-care-botanical-watermark pointer-events-none absolute inset-0 opacity-5" />
                    <textarea
                      className="h-48 w-full resize-none border-none bg-transparent p-6 text-sage-900 placeholder-sage-300 focus:ring-2 focus:ring-[#13ec25]/50"
                      onChange={(event) => setThoughts(event.target.value)}
                      placeholder="What's on your mind? Let it flow onto the page..."
                      value={thoughts}
                    />
                  </div>
                </section>

                <section className="mb-10 rounded-xl bg-sage-50 p-6">
                  <h2 className="mb-6 text-xl font-bold text-sage-900">Daily Ratings</h2>
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                    {ratingConfig.map((rating) => (
                      <div key={rating.key} className="flex flex-col gap-2">
                        <p className="text-sm font-medium text-sage-600">{rating.label}</p>
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
                <div className="sticky top-24 rounded-xl border border-sage-100 bg-white p-6 shadow-sm">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-lg font-bold">Self-Care Checklist</h3>
                    <span className="rounded bg-sage-50 px-2 py-1 text-xs font-bold text-sage-500">65% Done</span>
                  </div>

                  <div className="mb-8 h-2 w-full overflow-hidden rounded-full bg-sage-100">
                    <div className="h-full rounded-full bg-[#13ec25]" style={{ width: '65%' }} />
                  </div>

                  <ul className="flex flex-col gap-4">
                    {checklist.map((item, index) => (
                      <li
                        key={item.label}
                        className="group flex items-center justify-between rounded-lg bg-sage-50/50 p-3 transition-colors hover:bg-sage-50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-sage-400 transition-colors group-hover:text-[#13ec25]">
                            {item.icon}
                          </span>
                          <span className="text-sm font-medium">{item.label}</span>
                        </div>
                        <input
                          checked={item.checked}
                          className="h-5 w-5 rounded border-sage-300 text-[#13ec25] focus:ring-[#13ec25]"
                          onChange={() => toggleChecklistItem(index)}
                          type="checkbox"
                        />
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 rounded-xl border border-[#13ec25]/20 bg-[#13ec25]/10 p-4">
                    <p className="mb-1 text-xs font-bold text-sage-600">PROMPT OF THE DAY</p>
                    <p className="text-sm italic text-sage-700">
                      &quot;What is one thing you can forgive yourself for today?&quot;
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </main>

        <footer className="border-t border-sage-100 px-10 py-6 text-center text-sm text-sage-400">
          <p>© 2024 Self-Care Hub • Crafted for Mindfulness</p>
        </footer>
      </div>
    </div>
  );
}
