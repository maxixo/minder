import { useState } from 'react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/useAuth';
import '@/styles/pages/daily-reflection.css';

const weatherOptions = [
  { key: 'sunny', icon: 'wb_sunny', title: 'Sunny' },
  { key: 'cloudy', icon: 'cloud', title: 'Cloudy' },
  { key: 'rainy', icon: 'umbrella', title: 'Rainy' },
];

const moodOptions = [
  { key: 'sad', label: '😢' },
  { key: 'low', label: '😕' },
  { key: 'neutral', label: 'neutral' },
  { key: 'good', label: '😊' },
  { key: 'great', label: '🤩' },
];

const mealOptions = [
  { key: 'breakfast', icon: 'breakfast_dining', label: 'BREAKFAST' },
  { key: 'lunch', icon: 'lunch_dining', label: 'LUNCH' },
  { key: 'dinner', icon: 'dinner_dining', label: 'DINNER' },
];

export default function DailyReflection() {
  const { user } = useAuth();
  const [gratitude, setGratitude] = useState(['', '', '']);
  const [intention, setIntention] = useState('');
  const [quickWins, setQuickWins] = useState(['', '']);
  const [weather, setWeather] = useState('sunny');
  const [mood, setMood] = useState('neutral');
  const [hydration, setHydration] = useState(5);
  const [sleep, setSleep] = useState(7.5);
  const [meals, setMeals] = useState({ breakfast: true, lunch: false, dinner: false });

  const firstName = user?.name?.split(' ')[0] || 'Sarah';

  const updateGratitude = (index: number, value: string) => {
    setGratitude((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
  };

  const updateQuickWin = (index: number, value: string) => {
    setQuickWins((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
  };

  const handleSave = () => {
    toast.success('Reflection saved');
  };

  return (
    <div className="daily-reflection-scrollbar flex min-h-full flex-col text-[#3a523e]">
      <header className="-mx-4 mb-6 border-b border-[#e8ede8] bg-white/80 px-4 py-4 backdrop-blur-md sm:-mx-6 sm:px-6 lg:sticky lg:top-0 lg:z-20 lg:-mx-8 lg:px-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#638869]">Reflection Space</p>
            <h1 className="mt-1 text-2xl font-black text-[#3a523e] sm:text-3xl">Daily Reflection</h1>
          </div>

          <div className="flex items-center gap-6 rounded-xl border border-[#e8ede8] bg-[#f4f7f4] px-4 py-2">
            <button className="material-symbols-outlined text-[#638869]" type="button">
              chevron_left
            </button>
            <span className="text-sm font-semibold">Today, Oct 24, 2023</span>
            <button className="material-symbols-outlined text-[#638869]" type="button">
              chevron_right
            </button>
            <div className="mx-2 h-4 w-px bg-[#d1dbd2]" />
            <div className="flex gap-3">
              {weatherOptions.map((option) => (
                <button key={option.key} onClick={() => setWeather(option.key)} title={option.title} type="button">
                  <span
                    className={clsx(
                      'material-symbols-outlined transition-colors',
                      weather === option.key ? 'text-[#19e63c]' : 'text-[#638869]/40'
                    )}
                  >
                    {option.icon}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#19e63c] bg-[#19e63c]/20">
            <span className="material-symbols-outlined text-[#3a523e]">person</span>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 space-y-8 py-2">
        <div className="rounded-xl border border-[#e8ede8] bg-white px-6 py-5 shadow-sm">
          <p className="text-sm leading-6 text-[#638869]">
            How are you feeling today, {firstName}? Capture gratitude, intention, and the small signals shaping your energy.
          </p>
        </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              <div className="space-y-8 lg:col-span-7">
                <section className="rounded-xl border border-[#e8ede8] bg-white p-8 shadow-sm">
                  <div className="mb-6 flex items-center gap-3">
                    <span className="material-symbols-outlined text-red-400">favorite</span>
                    <h3 className="text-xl font-bold">1. Gratitude Practice</h3>
                  </div>
                  <p className="mb-6 text-sm italic text-[#638869]">List three things you are grateful for today...</p>

                  <div className="space-y-4">
                    {gratitude.map((item, index) => (
                      <div
                        key={`gratitude-${index + 1}`}
                        className="flex items-center gap-4 rounded-xl border border-[#e8ede8] bg-[#f4f7f4] p-4"
                      >
                        <span className="font-bold text-[#19e63c]">{String(index + 1).padStart(2, '0')}</span>
                        <input
                          className="w-full border-none bg-transparent text-[#3a523e] outline-none placeholder:text-[#638869]"
                          onChange={(event) => updateGratitude(index, event.target.value)}
                          placeholder="I am grateful for..."
                          type="text"
                          value={item}
                        />
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-xl border border-[#e8ede8] bg-white p-8 shadow-sm">
                  <div className="mb-6 flex items-center gap-3">
                    <span className="material-symbols-outlined text-amber-500">target</span>
                    <h3 className="text-xl font-bold">2. Expectations &amp; Goals</h3>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="mb-2 block text-sm font-semibold">What is your main intention for today?</label>
                      <textarea
                        className="w-full rounded-xl border border-[#e8ede8] bg-[#f4f7f4] px-4 py-3 text-[#3a523e] outline-none placeholder:text-[#638869] focus:border-[#19e63c]"
                        onChange={(event) => setIntention(event.target.value)}
                        placeholder="Focus on mindfulness during meetings..."
                        rows={3}
                        value={intention}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold">Quick Wins (Bullet Points)</label>
                      <div className="space-y-2">
                        {quickWins.map((item, index) => (
                          <div key={`quick-win-${index + 1}`} className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-sm text-[#19e63c]">circle</span>
                            <input
                              className="flex-1 border-b border-[#e8ede8] bg-transparent py-1 outline-none placeholder:text-[#638869] focus:border-[#19e63c]"
                              onChange={(event) => updateQuickWin(index, event.target.value)}
                              placeholder={`Task ${index + 1}`}
                              type="text"
                              value={item}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <div className="space-y-8 lg:col-span-5">
                <section className="rounded-xl border border-[#e8ede8] bg-white p-8 shadow-sm">
                  <div className="mb-8 flex items-center gap-3">
                    <span className="material-symbols-outlined text-blue-400">monitoring</span>
                    <h3 className="text-xl font-bold">3. Vitality Trackers</h3>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <p className="mb-4 text-sm font-semibold">Mood Check-in</p>
                      <div className="flex justify-between px-2">
                        {moodOptions.map((option) => {
                          const isActive = mood === option.key;

                          return (
                            <button
                              key={option.key}
                              className={clsx(
                                'text-3xl transition-transform',
                                isActive
                                  ? 'scale-125 rounded-full p-1 ring-2 ring-[#19e63c]/20'
                                  : 'opacity-50 grayscale hover:scale-110 hover:opacity-100 hover:grayscale-0'
                              )}
                              onClick={() => setMood(option.key)}
                              type="button"
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-2 flex justify-between px-1">
                        <span className="material-symbols-outlined text-xl text-slate-400">sentiment_very_dissatisfied</span>
                        <span className="material-symbols-outlined text-xl text-slate-400">sentiment_neutral</span>
                        <span className="material-symbols-outlined text-xl text-slate-400">sentiment_very_satisfied</span>
                      </div>
                    </div>

                    <div>
                      <div className="mb-4 flex items-center justify-between">
                        <p className="text-sm font-semibold">Hydration</p>
                        <span className="text-xs font-bold text-blue-500">{hydration} / 8 Glasses</span>
                      </div>
                      <div className="flex justify-between gap-1">
                        {Array.from({ length: 8 }, (_, index) => {
                          const filled = index < hydration;

                          return (
                            <button key={`water-${index + 1}`} onClick={() => setHydration(index + 1)} type="button">
                              <span className={clsx('material-symbols-outlined', filled ? 'material-fill-1 text-blue-500' : 'text-[#d1dbd2]')}>
                                water_drop
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="mb-4 flex items-center justify-between">
                        <p className="text-sm font-semibold">Sleep</p>
                        <span className="text-xs font-bold text-indigo-500">{sleep} Hours</span>
                      </div>
                      <input
                        className="daily-reflection-slider"
                        max="12"
                        min="0"
                        onChange={(event) => setSleep(Number(event.target.value))}
                        step="0.5"
                        type="range"
                        value={sleep}
                      />
                      <div className="mt-2 flex justify-between text-[10px] font-bold text-slate-400">
                        <span>0h</span>
                        <span>6h</span>
                        <span>12h</span>
                      </div>
                    </div>

                    <div>
                      <p className="mb-4 text-sm font-semibold">Nourishment</p>
                      <div className="grid grid-cols-3 gap-3">
                        {mealOptions.map((option) => (
                          <label
                            key={option.key}
                            className="cursor-pointer rounded-xl border border-[#e8ede8] bg-[#f4f7f4] p-3 transition-colors hover:border-[#19e63c]"
                          >
                            <input
                              checked={meals[option.key as keyof typeof meals]}
                              className="peer hidden"
                              onChange={() =>
                                setMeals((current) => ({
                                  ...current,
                                  [option.key]: !current[option.key as keyof typeof current],
                                }))
                              }
                              type="checkbox"
                            />
                            <span className="flex flex-col items-center gap-2">
                              <span className="material-symbols-outlined text-slate-400 peer-checked:text-[#19e63c]">{option.icon}</span>
                              <span className="text-[10px] font-bold peer-checked:text-[#19e63c]">{option.label}</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            <section className="w-full rounded-xl border border-[#e8ede8] bg-white p-8 shadow-sm">
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#19e63c]">bolt</span>
                  <h3 className="text-xl font-bold">4. Energy Graph</h3>
                </div>
                <div className="flex gap-4 text-xs font-bold text-slate-400">
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-3 rounded-full bg-[#19e63c]" /> Energy Level
                  </div>
                </div>
              </div>

              <div className="relative h-48 w-full border-b border-l border-[#e8ede8]">
                <div className="absolute inset-0 flex items-end">
                  <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 1000 100">
                    <defs>
                      <linearGradient id="energy-gradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#19e63c" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#19e63c" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0 80 C 100 70, 200 20, 300 30 S 500 90, 600 80 S 800 10, 1000 40 V 100 H 0 Z"
                      fill="url(#energy-gradient)"
                      stroke="#19e63c"
                      strokeWidth="2"
                    />
                  </svg>
                </div>

                <div className="absolute -bottom-6 left-0 right-0 flex justify-between px-2 text-[10px] font-bold text-slate-400">
                  <span>6 AM</span>
                  <span>9 AM</span>
                  <span>12 PM</span>
                  <span>3 PM</span>
                  <span>6 PM</span>
                  <span>9 PM</span>
                  <span>12 AM</span>
                </div>

                <div className="absolute -left-10 top-0 bottom-0 flex flex-col justify-between text-[10px] font-bold text-slate-400">
                  <span>High</span>
                  <span>Mid</span>
                  <span>Low</span>
                </div>
              </div>
            </section>
          </main>

          <button
            className="fixed bottom-8 right-8 z-50 flex items-center gap-2 rounded-full bg-[#19e63c] px-8 py-4 font-bold text-[#3a523e] shadow-lg shadow-[#19e63c]/30 transition-transform hover:scale-105 active:scale-95"
            onClick={handleSave}
            type="button"
          >
            <span className="material-symbols-outlined">save</span>
            <span>Save Reflection</span>
          </button>

      <footer className="mt-20 border-t border-[#e8ede8] bg-[#f4f7f4] py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#638869]">spa</span>
            <span className="font-bold">MindfulReflect</span>
          </div>
          <div className="flex gap-8 text-sm font-medium text-[#638869]">
            <a className="hover:text-[#19e63c]" href="#">Guide</a>
            <a className="hover:text-[#19e63c]" href="#">Community</a>
            <a className="hover:text-[#19e63c]" href="#">Privacy</a>
            <a className="hover:text-[#19e63c]" href="#">Support</a>
          </div>
          <p className="text-xs text-slate-400">© 2023 MindfulReflect. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
