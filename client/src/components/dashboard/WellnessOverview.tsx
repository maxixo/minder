import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { format, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '@/contexts/useAuth';
import { useTheme } from '@/contexts/useTheme';
import analyticsService from '@/services/analyticsService';
import entryService from '@/services/entryService';
import type { DailyEntry } from '@/types/entry';

type DashboardPeriod = '7days' | '30days';

interface SummaryData {
  totalEntries: number;
  currentStreak: number;
  averageMood: number;
  averageWaterIntake: number;
  averageSleepHours: number;
  completionRate: number;
}

interface MoodTrendPoint {
  date: string;
  mood: number;
}

const emptySummary: SummaryData = {
  totalEntries: 0,
  currentStreak: 0,
  averageMood: 0,
  averageWaterIntake: 0,
  averageSleepHours: 0,
  completionRate: 0,
};

const quickActions = [
  {
    label: "Today's Reflection",
    icon: 'edit_note',
    to: '/reflection',
    className: 'bg-sage-600 text-white shadow-lg shadow-sage-600/20 hover:bg-sage-700 hover:shadow-sage-600/30 dark:bg-sage-500 dark:text-slate-950 dark:hover:bg-sage-400 dark:hover:shadow-sage-500/30',
  },
  {
    label: 'Self-Care Check',
    icon: 'self_care',
    to: '/selfcare',
    className: 'border border-sage-200 bg-white text-sage-700 hover:bg-sage-50 dark:border-white/10 dark:bg-white/5 dark:text-sage-100 dark:hover:bg-white/10',
  },
];

const periodOptions: Array<{ value: DashboardPeriod; label: string }> = [
  { value: '7days', label: 'This Week' },
  { value: '30days', label: 'Last 30 Days' },
];

const unwrapEnvelope = <T,>(response: { data: T }) => response.data;

const formatMoodLabel = (score: number) => {
  if (score >= 4.5) return 'Bright';
  if (score >= 3.5) return 'Good';
  if (score >= 2.5) return 'Steady';
  if (score >= 1.5) return 'Tender';
  if (score > 0) return 'Heavy';
  return 'No mood data';
};

const getCompletionMessage = (summary: SummaryData) => {
  if (summary.currentStreak >= 7) return `${summary.currentStreak}-day streak and building.`;
  if (summary.completionRate >= 80) return 'Your recent check-ins have stayed remarkably consistent.';
  if (summary.completionRate > 0) return 'Steady progress is making your patterns easier to read.';
  return 'Your first few reflections will start shaping this card.';
};

const getEntryTitle = (entry: DailyEntry) => {
  if (entry.focus) return entry.focus;
  if (entry.expectations) return entry.expectations;
  if (entry.emotionalGuidance?.howYoureFeeling) return 'Emotional Check-In';
  if (entry.gratitude?.[0]) return `Gratitude: ${entry.gratitude[0]}`;
  return 'Daily Reflection';
};

const getEntryExcerpt = (entry: DailyEntry) => {
  const source = entry.positiveNotes?.[0]
    || entry.mindThoughts
    || entry.emotionalGuidance?.whatYoureThinking
    || entry.mindfulnessNotes
    || entry.gratitude?.[0]
    || 'A quiet moment was captured in this entry.';

  return source.length > 88 ? `${source.slice(0, 85)}...` : source;
};

const getEntryVisual = (entry: DailyEntry) => {
  if (entry.weather === 'sunny') return { icon: 'wb_sunny', accentClassName: 'bg-amber-50 text-amber-600' };
  if (entry.weather === 'rainy') return { icon: 'rainy', accentClassName: 'bg-blue-50 text-blue-600' };
  if (entry.emotionalGuidance?.howYoureFeeling) return { icon: 'favorite', accentClassName: 'bg-rose-50 text-rose-600' };
  return { icon: 'menu_book', accentClassName: 'bg-sage-50 text-sage-700' };
};

export default function WellnessOverview() {
  const { user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const firstName = user?.name?.split(' ')[0] || 'there';

  const [period, setPeriod] = useState<DashboardPeriod>('7days');
  const [summary, setSummary] = useState<SummaryData>(emptySummary);
  const [moodTrends, setMoodTrends] = useState<MoodTrendPoint[]>([]);
  const [recentEntries, setRecentEntries] = useState<DailyEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      setIsLoading(true);
      setError('');

      const recentDays = period === '7days' ? 7 : 30;
      const [summaryResult, moodResult, entriesResult] = await Promise.allSettled([
        analyticsService.getSummary(period),
        analyticsService.getMoodTrends(period),
        entryService.getRecentEntries(recentDays),
      ]);

      if (cancelled) return;

      let requestFailed = false;

      if (summaryResult.status === 'fulfilled') {
        setSummary(unwrapEnvelope(summaryResult.value));
      } else {
        setSummary(emptySummary);
        requestFailed = true;
      }

      if (moodResult.status === 'fulfilled') {
        setMoodTrends(unwrapEnvelope(moodResult.value));
      } else {
        setMoodTrends([]);
        requestFailed = true;
      }

      if (entriesResult.status === 'fulfilled') {
        setRecentEntries(unwrapEnvelope(entriesResult.value).slice(0, 4));
      } else {
        setRecentEntries([]);
        requestFailed = true;
      }

      if (requestFailed) {
        setError('Some dashboard insights could not be loaded. Available data is still being shown.');
      }

      setIsLoading(false);
    };

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [period]);

  const statCards = useMemo(() => [
    {
      title: 'Current Streak',
      value: `${summary.currentStreak} ${summary.currentStreak === 1 ? 'Day' : 'Days'}`,
      icon: 'local_fire_department',
      iconClassName: 'text-orange-500',
      detail: getCompletionMessage(summary),
      trendIcon: summary.currentStreak > 0 ? 'trending_up' : null,
      trendClassName: summary.currentStreak > 0 ? 'text-emerald-600' : 'text-slate-400',
    },
    {
      title: 'Mood Average',
      value: formatMoodLabel(summary.averageMood),
      icon: 'sentiment_satisfied',
      iconClassName: 'text-blue-400',
      detail: summary.averageMood ? `${summary.averageMood.toFixed(1)} out of 5 across ${summary.totalEntries} entries.` : 'Log a few reflections to reveal your overall tone.',
      trendIcon: null,
      trendClassName: 'text-slate-400',
    },
    {
      title: 'Completion',
      value: `${summary.completionRate}%`,
      icon: 'task_alt',
      iconClassName: 'text-sage-600',
      detail: summary.totalEntries ? `${summary.totalEntries} reflection${summary.totalEntries === 1 ? '' : 's'} recorded in this window.` : 'No entries have been completed yet.',
      trendIcon: summary.completionRate >= 60 ? 'trending_up' : null,
      trendClassName: summary.completionRate >= 60 ? 'text-emerald-600' : 'text-slate-400',
    },
  ], [summary]);

  const chartData = useMemo(() => moodTrends.map((point) => ({
    date: point.date,
    label: format(parseISO(point.date), 'EEE'),
    mood: point.mood,
    fullDate: format(parseISO(point.date), 'MMM d'),
  })), [moodTrends]);

  return (
    <div className={clsx('animate-fade-in pb-10 transition-colors', isDarkMode && 'dark')}>
      <div className="mb-8 flex flex-col gap-3 rounded-[2rem] border border-sage-200/80 bg-white/80 px-6 py-5 shadow-soft backdrop-blur-sm transition-colors sm:px-8 dark:border-white/10 dark:bg-[#15201a]/90">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sage-500 dark:text-sage-300">Wellness Dashboard</p>
          <button
            aria-label={`Switch dashboard to ${isDarkMode ? 'light' : 'dark'} mode`}
            className="inline-flex items-center gap-3 rounded-full border border-sage-200 bg-sage-50 px-3 py-2 text-sm font-semibold text-sage-700 transition-all hover:border-sage-300 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-sage-100 dark:hover:bg-white/10"
            onClick={toggleTheme}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
            <span>{isDarkMode ? 'Light mode' : 'Dark mode'}</span>
            <span className={clsx(
              'relative inline-flex h-6 w-11 rounded-full transition-colors',
              isDarkMode ? 'bg-sage-500' : 'bg-sage-300'
            )}>
              <span className={clsx(
                'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all',
                isDarkMode ? 'left-5' : 'left-0.5'
              )} />
            </span>
          </button>
        </div>
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-4xl font-semibold text-sage-800 sm:text-5xl dark:text-sage-50">Welcome back, {firstName}.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-sage-700 sm:text-base dark:text-sage-200">
              Your emotional wellness snapshot brings together reflection, streaks, and the small rituals keeping you grounded this week.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-sage-100 px-4 py-2 text-sm font-medium text-sage-700 dark:bg-white/5 dark:text-sage-100">
            <span className="material-symbols-outlined text-base">air</span>
            Breathe. Notice. Begin again.
          </div>
        </div>
      </div>

      <section className="mb-10 overflow-hidden rounded-[2rem] border border-sage-200 bg-gradient-to-br from-sage-100 via-sage-50 to-white p-6 shadow-soft transition-colors sm:p-8 lg:p-10 dark:border-white/10 dark:bg-gradient-to-br dark:from-[#1a261f] dark:via-[#121b16] dark:to-[#0e1511]">
        <div className="relative overflow-hidden rounded-[1.75rem] border border-sage-200/80 bg-sage-600/10 px-6 py-12 text-center sm:px-10 dark:border-white/10 dark:bg-white/5">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(94, 120, 96, 0.95) 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />

          <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center">
            <span className="material-symbols-outlined mb-4 text-4xl text-sage-600/70 dark:text-sage-200/70">format_quote</span>
            <h2 className="font-display text-3xl italic leading-tight text-sage-900 sm:text-4xl lg:text-5xl dark:text-sage-50">
              &quot;Nature does not hurry, yet everything is accomplished.&quot;
            </h2>
            <p className="mt-5 text-base font-semibold tracking-[0.24em] text-sage-700 dark:text-sage-200">LAO TZU</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                className="inline-flex items-center justify-center gap-2 rounded-full bg-sage-600 px-6 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-sage-700 hover:shadow-lifted"
                type="button"
              >
                <span className="material-symbols-outlined text-lg">favorite</span>
                Save to Favorites
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-full border border-sage-200 bg-white px-6 py-3 text-sm font-bold text-sage-700 transition-all hover:bg-sage-50"
                type="button"
              >
                <span className="material-symbols-outlined text-lg">share</span>
                Share
              </button>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <div className="mb-8 rounded-[1.5rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-800 shadow-sm">
          {error}
        </div>
      ) : null}

      <section className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }, (_, index) => <div key={`dashboard-stat-skeleton-${index + 1}`} className="skeleton h-44 rounded-[1.75rem]" />)
          : statCards.map((card) => (
              <article
                key={card.title}
                className="rounded-[1.75rem] border border-sage-100 bg-white p-7 shadow-soft transition-shadow hover:shadow-lifted dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex items-start justify-between">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sage-500 dark:text-sage-300">{card.title}</p>
                  <span className={`material-symbols-outlined text-2xl ${card.iconClassName}`}>{card.icon}</span>
                </div>
                <p className="mt-4 text-4xl font-semibold text-slate-900 dark:text-sage-50">{card.value}</p>
                {card.trendIcon ? (
                  <div className={`mt-3 flex items-center gap-1 text-sm font-bold ${card.trendClassName}`}>
                    <span className="material-symbols-outlined text-base">{card.trendIcon}</span>
                    <span>{card.detail}</span>
                  </div>
                ) : (
                  <p className={`mt-3 text-sm font-medium ${card.trendClassName}`}>{card.detail}</p>
                )}
              </article>
            ))}
      </section>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="space-y-8">
          <section>
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-sage-50">Weekly Emotional Wellness</h2>
                <p className="mt-1 text-sm text-sage-600 dark:text-sage-300">A soft snapshot of the rhythms shaping your week.</p>
              </div>
              <select
                className="rounded-full border border-sage-200 bg-white px-4 py-2 text-sm text-sage-700 focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-100 dark:border-white/10 dark:bg-white/5 dark:text-sage-100 dark:focus:ring-white/10"
                onChange={(event) => setPeriod(event.target.value as DashboardPeriod)}
                value={period}
              >
                {periodOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-[1.75rem] border border-sage-100 bg-white p-6 shadow-soft sm:p-7 dark:border-white/10 dark:bg-white/5">
              {isLoading ? (
                <div className="skeleton h-72 rounded-[1.5rem]" />
              ) : chartData.length ? (
                <div className="h-72">
                  <ResponsiveContainer>
                    <AreaChart data={chartData} margin={{ top: 12, right: 12, bottom: 6, left: -18 }}>
                      <defs>
                        <linearGradient id="dashboard-mood-fill" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#5e7860" stopOpacity="0.28" />
                          <stop offset="100%" stopColor="#5e7860" stopOpacity="0.04" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke={isDarkMode ? '#314238' : '#e3e8e3'} strokeDasharray="4 4" vertical={false} />
                      <XAxis axisLine={false} dataKey="label" tick={{ fill: isDarkMode ? '#b7c6b8' : '#7d937f', fontSize: 12, fontWeight: 700 }} tickLine={false} />
                      <YAxis axisLine={false} domain={[1, 5]} tick={{ fill: isDarkMode ? '#b7c6b8' : '#7d937f', fontSize: 12, fontWeight: 700 }} tickLine={false} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          return (
                            <div className={clsx(
                              'rounded-2xl border px-4 py-3 shadow-soft',
                              isDarkMode ? 'border-white/10 bg-[#101915] text-sage-50' : 'border-sage-100 bg-white text-slate-900'
                            )}>
                              <p className={clsx('text-xs font-semibold uppercase tracking-[0.2em]', isDarkMode ? 'text-sage-300' : 'text-sage-500')}>
                                {payload[0].payload.fullDate}
                              </p>
                              <p className="mt-2 text-lg font-semibold">Mood: {payload[0].value} / 5</p>
                            </div>
                          );
                        }}
                      />
                      <Area
                        activeDot={{ fill: '#5e7860', r: 5, stroke: '#ffffff', strokeWidth: 2 }}
                        dataKey="mood"
                        fill="url(#dashboard-mood-fill)"
                        stroke="#5e7860"
                        strokeWidth={3}
                        type="monotone"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-72 flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-sage-200 bg-sage-50/70 px-6 text-center dark:border-white/10 dark:bg-[#101915]">
                  <span className="material-symbols-outlined text-4xl text-sage-400 dark:text-sage-300">sentiment_neutral</span>
                  <p className="mt-4 font-display text-2xl font-semibold text-sage-800 dark:text-sage-50">No weekly mood trend yet</p>
                  <p className="mt-2 max-w-md text-sm leading-6 text-sage-600 dark:text-sage-300">
                    A few saved reflections will turn this space into a clearer picture of your emotional rhythm.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-sage-50">Recent Journal Entries</h2>
                <p className="mt-1 text-sm text-sage-600 dark:text-sage-300">Return to the moments that shaped your recent reflections.</p>
              </div>
              <Link className="text-sm font-semibold text-sage-700 transition-colors hover:text-sage-900 dark:text-sage-200 dark:hover:text-white" to="/review">
                View all
              </Link>
            </div>

            <div className="space-y-4">
              {isLoading
                ? Array.from({ length: 2 }, (_, index) => <div key={`dashboard-entry-skeleton-${index + 1}`} className="skeleton h-28 rounded-[1.75rem]" />)
                : recentEntries.length
                  ? recentEntries.map((entry) => {
                      const visual = getEntryVisual(entry);

                      return (
                        <article
                          key={entry._id}
                          className="group flex flex-col justify-between gap-4 rounded-[1.75rem] border border-sage-100 bg-white p-5 shadow-soft transition-all hover:border-sage-300 hover:shadow-lifted sm:flex-row sm:items-center dark:border-white/10 dark:bg-white/5 dark:hover:border-sage-400/40"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${visual.accentClassName}`}>
                              <span className="material-symbols-outlined">{visual.icon}</span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-800 dark:text-sage-50">{getEntryTitle(entry)}</h3>
                              <p className="text-sm text-slate-500 dark:text-sage-300">{getEntryExcerpt(entry)}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-3 sm:text-right">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-sage-400">{format(parseISO(entry.date), 'MMM d')}</p>
                            <span className="material-symbols-outlined text-slate-300 transition-colors group-hover:text-sage-600 dark:text-sage-400 dark:group-hover:text-sage-200">chevron_right</span>
                          </div>
                        </article>
                      );
                    })
                  : (
                    <div className="rounded-[1.75rem] border border-dashed border-sage-200 bg-sage-50/70 px-6 py-8 text-center dark:border-white/10 dark:bg-[#101915]">
                      <p className="font-semibold text-sage-800 dark:text-sage-50">No recent entries yet</p>
                      <p className="mt-2 text-sm leading-6 text-sage-600 dark:text-sage-300">Your saved reflections, self-care check-ins, and reviews will appear here.</p>
                    </div>
                  )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[1.75rem] border border-sage-200/80 bg-gradient-to-b from-sage-100/80 to-white p-8 text-center shadow-soft dark:border-white/10 dark:bg-gradient-to-b dark:from-[#18241d] dark:to-[#101915]">
            <h2 className="font-display text-3xl font-semibold text-sage-700 dark:text-sage-50">How are you truly?</h2>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-slate-600 dark:text-sage-200">
              Taking a moment to check in with yourself is the first step toward steadiness and balance.
            </p>

            <div className="mt-8 space-y-4">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  className={`flex w-full items-center justify-center gap-3 rounded-2xl px-5 py-4 text-base font-bold transition-all ${action.className}`}
                  to={action.to}
                >
                  <span className="material-symbols-outlined">{action.icon}</span>
                  {action.label}
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-sage-100 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-white/5">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-sage-50">Daily Mindful Tip</h2>
            <div className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sage-100 text-sage-700 dark:bg-white/10 dark:text-sage-100">
                <span className="material-symbols-outlined text-xl">air</span>
              </div>
              <p className="text-sm italic leading-7 text-slate-700 dark:text-sage-200">
                &quot;Try the 4-7-8 breathing technique before starting your next task to reset your nervous system.&quot;
              </p>
            </div>
          </section>

          <section className="group relative aspect-[4/3] overflow-hidden rounded-[1.75rem] bg-slate-200 shadow-soft">
            <img
              alt="Sunlight streaming through a dense green forest"
              className="absolute inset-0 h-full w-full scale-105 object-cover transition-transform duration-700 group-hover:scale-100"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBItI64Ljuqq5JnU3kiSCpUF0IV-eva6CMFskI_cQx5KYA_2S3KLM1LmsI4_YKSEwjOykN0gejCOUA7dA2ReO3psRI-ZBhhg7Q92EmpgEMxC6uHjcADzP_DItbGPvtGpxIFMT4Xl_4RVGLb-w6gsHMAxW2RKShGfy7SosiMWi1cO7OnusJDUX9y-o44sdRa0aDdxg2GS5xiqmmD9iZxscYq8TwrBXcXUINVCLemEFATy8ZbKGmwP3deMwOoeDNd3NreKdP_Be3VqCXY"
            />
            <div className="absolute inset-0 z-10 flex flex-col justify-end bg-gradient-to-t from-black/70 via-black/20 to-transparent p-6 text-white">
              <p className="text-lg font-bold leading-tight">Guided Meditation: Forest Path</p>
              <p className="mt-1 text-xs uppercase tracking-[0.22em] text-white/80">12 min - Sage Greenwood</p>
            </div>
          </section>
        </div>
      </div>

      <footer className="mt-12 rounded-[1.75rem] border border-sage-200/80 bg-white/80 px-6 py-8 shadow-soft backdrop-blur-sm sm:px-8 dark:border-white/10 dark:bg-[#15201a]/90">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3 text-sage-600 dark:text-sage-100">
            <span className="material-symbols-outlined text-2xl">eco</span>
            <p className="font-display text-xl font-semibold">MindfulLife</p>
          </div>
          <p className="text-sm text-slate-500 dark:text-sage-300">© 2024 MindfulLife App. Cultivating peace, one breath at a time.</p>
          <div className="flex gap-4 text-slate-400 dark:text-sage-300">
            <button className="rounded-full p-2 transition-colors hover:bg-sage-50 hover:text-sage-700 dark:hover:bg-white/10 dark:hover:text-white" type="button">
              <span className="material-symbols-outlined">language</span>
            </button>
            <button className="rounded-full p-2 transition-colors hover:bg-sage-50 hover:text-sage-700 dark:hover:bg-white/10 dark:hover:text-white" type="button">
              <span className="material-symbols-outlined">share</span>
            </button>
            <Link className="rounded-full p-2 transition-colors hover:bg-sage-50 hover:text-sage-700 dark:hover:bg-white/10 dark:hover:text-white" to="/settings">
              <span className="material-symbols-outlined">settings</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
