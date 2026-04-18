import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import {
  addDays,
  differenceInCalendarWeeks,
  eachMonthOfInterval,
  endOfWeek,
  format,
  parseISO,
  startOfWeek,
} from 'date-fns';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '@/contexts/useAuth';
import { useTheme } from '@/contexts/useTheme';
import analyticsService from '@/services/analyticsService';
import '@/styles/pages/analytics.css';

type Period = '7days' | '30days' | '90days' | 'year';

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

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

interface EnergyPatternPoint {
  hour: number;
  averageEnergy: number;
}

interface HeatmapDay {
  date: string;
  completionRate: number;
}

interface FeelingCount {
  feeling: string;
  count: number;
}

interface WeeklyReportData {
  daysLogged: number;
  averageMood: number;
  averageWaterIntake: number;
  averageSleepHours: number;
  topFeelings: FeelingCount[];
}

const periodOptions: Array<{ value: Period; label: string }> = [
  { value: '7days', label: '7 Days' },
  { value: '30days', label: '30 Days' },
  { value: '90days', label: '90 Days' },
  { value: 'year', label: 'Year' },
];

const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const emptySummary: SummaryData = {
  totalEntries: 0,
  currentStreak: 0,
  averageMood: 0,
  averageWaterIntake: 0,
  averageSleepHours: 0,
  completionRate: 0,
};

const emptyWeeklyReport: WeeklyReportData = {
  daysLogged: 0,
  averageMood: 0,
  averageWaterIntake: 0,
  averageSleepHours: 0,
  topFeelings: [],
};

const unwrapEnvelope = <T,>(response: ApiEnvelope<T>) => response.data;

const formatMoodLabel = (score: number) => {
  if (score >= 4.5) return 'Bright';
  if (score >= 3.5) return 'Good';
  if (score >= 2.5) return 'Steady';
  if (score >= 1.5) return 'Tender';
  if (score > 0) return 'Heavy';
  return 'No mood data';
};

const formatHourLabel = (hour: number) => {
  if (hour === 24) return '12 AM';

  const suffix = hour >= 12 ? 'PM' : 'AM';
  const normalizedHour = hour % 12 || 12;
  return `${normalizedHour} ${suffix}`;
};

const formatFeelingLabel = (feeling: string) => {
  if (!feeling) return '';
  return feeling.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const getCompletionMessage = (completionRate: number, streak: number) => {
  if (streak >= 7) return `A ${streak}-day streak is giving your patterns real shape.`;
  if (completionRate >= 80) return 'Your recent check-ins have been remarkably steady and complete.';
  if (completionRate >= 60) return 'Your rhythm is forming. Small, regular entries are building useful insight.';
  if (completionRate > 0) return 'Even a few honest check-ins are enough to start noticing meaningful patterns.';
  return 'The more you reflect, the more this page will reveal your emotional and energy rhythms.';
};

const getWeeklyNarrative = (report: WeeklyReportData, summary: SummaryData, topEnergyHour: number | null) => {
  if (report.daysLogged === 0 && summary.totalEntries === 0) {
    return 'Once you log a few reflections, this space will start surfacing the themes, moods, and energy windows shaping your days.';
  }

  const energySentence = topEnergyHour == null
    ? 'Your entries are beginning to outline how your days move.'
    : `Your strongest energy tends to appear around ${formatHourLabel(topEnergyHour)}.`;

  return `${energySentence} Over the last week, ${report.daysLogged} day${report.daysLogged === 1 ? '' : 's'} of reflection helped capture a ${formatMoodLabel(report.averageMood).toLowerCase()} overall tone.`;
};

const getHeatmapLevelClassName = (completionRate: number | null) => {
  if (completionRate == null) return 'bg-transparent border-transparent';
  if (completionRate === 0) return 'border border-sage-100 bg-sage-50';
  if (completionRate <= 25) return 'bg-sage-100';
  if (completionRate <= 50) return 'bg-sage-200';
  if (completionRate <= 75) return 'bg-sage-300';
  return 'bg-sage-500';
};

const buildHeatmapColumns = (days: HeatmapDay[]) => {
  if (!days.length) {
    return { weeks: [] as Array<Array<HeatmapDay | null>>, monthLabels: {} as Record<number, string> };
  }

  const firstDay = parseISO(days[0].date);
  const lastDay = parseISO(days[days.length - 1].date);
  const gridStart = startOfWeek(firstDay, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(lastDay, { weekStartsOn: 1 });
  const daysByDate = new Map(days.map((day) => [day.date, day]));
  const weeks: Array<Array<HeatmapDay | null>> = [];
  const monthLabels: Record<number, string> = {};

  eachMonthOfInterval({ start: firstDay, end: lastDay }).forEach((monthDate) => {
    const weekIndex = differenceInCalendarWeeks(monthDate, gridStart, { weekStartsOn: 1 });
    monthLabels[weekIndex] = format(monthDate, 'MMM');
  });

  let cursor = gridStart;

  while (cursor <= gridEnd) {
    const week: Array<HeatmapDay | null> = [];

    for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
      const key = format(cursor, 'yyyy-MM-dd');
      week.push(daysByDate.get(key) || null);
      cursor = addDays(cursor, 1);
    }

    weeks.push(week);
  }

  return { weeks, monthLabels };
};

export default function Analytics() {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const firstName = user?.name?.split(' ')[0] || 'there';
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 4 }, (_, index) => currentYear - index);

  const [period, setPeriod] = useState<Period>('30days');
  const [year, setYear] = useState(currentYear);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<SummaryData>(emptySummary);
  const [moodTrends, setMoodTrends] = useState<MoodTrendPoint[]>([]);
  const [energyPatterns, setEnergyPatterns] = useState<EnergyPatternPoint[]>([]);
  const [activityHeatmap, setActivityHeatmap] = useState<HeatmapDay[]>([]);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReportData>(emptyWeeklyReport);

  useEffect(() => {
    let cancelled = false;

    const loadAnalytics = async () => {
      setIsLoading(true);
      setError('');

      const [summaryResult, moodResult, energyResult, heatmapResult, weeklyResult] = await Promise.allSettled([
        analyticsService.getSummary(period),
        analyticsService.getMoodTrends(period),
        analyticsService.getEnergyPatterns(),
        analyticsService.getActivityHeatmap(year),
        analyticsService.getWeeklyReport(),
      ]);

      if (cancelled) return;

      let requestFailed = false;

      if (summaryResult.status === 'fulfilled') {
        setSummary(unwrapEnvelope(summaryResult.value));
      } else {
        requestFailed = true;
        setSummary(emptySummary);
      }

      if (moodResult.status === 'fulfilled') {
        setMoodTrends(unwrapEnvelope(moodResult.value));
      } else {
        requestFailed = true;
        setMoodTrends([]);
      }

      if (energyResult.status === 'fulfilled') {
        setEnergyPatterns(unwrapEnvelope(energyResult.value));
      } else {
        requestFailed = true;
        setEnergyPatterns([]);
      }

      if (heatmapResult.status === 'fulfilled') {
        setActivityHeatmap(unwrapEnvelope(heatmapResult.value));
      } else {
        requestFailed = true;
        setActivityHeatmap([]);
      }

      if (weeklyResult.status === 'fulfilled') {
        setWeeklyReport(unwrapEnvelope(weeklyResult.value));
      } else {
        requestFailed = true;
        setWeeklyReport(emptyWeeklyReport);
      }

      if (requestFailed) {
        setError('Some insights could not be loaded. The page is showing any data that was available.');
      }

      setIsLoading(false);
    };

    loadAnalytics();

    return () => {
      cancelled = true;
    };
  }, [period, year]);

  const moodChartData = useMemo(
    () => moodTrends.map((item) => ({
      ...item,
      label: format(parseISO(item.date), period === '7days' ? 'EEE' : period === 'year' ? 'MMM' : 'MMM d'),
      fullDate: format(parseISO(item.date), 'MMM d, yyyy'),
      moodLabel: formatMoodLabel(item.mood),
    })),
    [moodTrends, period]
  );

  const energyChartData = useMemo(
    () => energyPatterns.map((item) => ({
      ...item,
      label: formatHourLabel(item.hour),
    })),
    [energyPatterns]
  );

  const heatmap = useMemo(() => buildHeatmapColumns(activityHeatmap), [activityHeatmap]);

  const topEnergyWindow = useMemo(() => {
    if (!energyPatterns.length) return null;
    return energyPatterns.reduce((best, current) => (current.averageEnergy > best.averageEnergy ? current : best));
  }, [energyPatterns]);

  const summaryCards = useMemo(
    () => [
      {
        title: 'Current Streak',
        value: `${summary.currentStreak} day${summary.currentStreak === 1 ? '' : 's'}`,
        detail: summary.totalEntries ? `${summary.totalEntries} entries captured overall` : 'Start reflecting to build your first streak',
        icon: 'local_fire_department',
        iconClassName: 'text-orange-500',
      },
      {
        title: 'Average Mood',
        value: summary.averageMood ? `${summary.averageMood.toFixed(1)} / 5` : '0 / 5',
        detail: formatMoodLabel(summary.averageMood),
        icon: 'sentiment_satisfied',
        iconClassName: 'text-sky-500',
      },
      {
        title: 'Water Intake',
        value: `${summary.averageWaterIntake.toFixed(1)} glasses`,
        detail: 'Average daily hydration in selected period',
        icon: 'water_drop',
        iconClassName: 'text-blue-500',
      },
      {
        title: 'Sleep Average',
        value: `${summary.averageSleepHours.toFixed(1)} hrs`,
        detail: 'Average reported sleep duration',
        icon: 'bedtime',
        iconClassName: 'text-violet-500',
      },
      {
        title: 'Completion Rate',
        value: `${summary.completionRate}%`,
        detail: getCompletionMessage(summary.completionRate, summary.currentStreak),
        icon: 'task_alt',
        iconClassName: 'text-sage-600',
      },
    ],
    [summary]
  );

  const heroMessage = getCompletionMessage(summary.completionRate, summary.currentStreak);
  const weeklyNarrative = getWeeklyNarrative(weeklyReport, summary, topEnergyWindow?.hour ?? null);

  return (
    <div className="animate-fade-in pb-10 text-slate-900 dark:text-sage-50">
      <section className="overflow-hidden rounded-[2rem] border border-sage-200 bg-gradient-to-br from-white via-sage-50 to-sand-50 shadow-soft dark:border-white/10 dark:bg-gradient-to-br dark:from-[#18231d] dark:via-[#121b16] dark:to-[#0f1712]">
        <div className="flex flex-col gap-6 px-6 py-8 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-10">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sage-500 dark:text-sage-300">Analytics</p>
            <h1 className="mt-3 font-display text-4xl font-semibold text-sage-900 sm:text-5xl dark:text-sage-50">
              Your wellness patterns, {firstName}.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-sage-600 sm:text-lg dark:text-sage-200">
              See how mood, energy, sleep, and consistency move together across your recent practice so your next small step can be more intentional.
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-[1.5rem] border border-sage-100 bg-white/80 p-5 shadow-sm backdrop-blur sm:min-w-[280px] dark:border-white/10 dark:bg-white/5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sage-500 dark:text-sage-300">Current Read</p>
            <p className="font-display text-3xl font-semibold text-sage-800 dark:text-sage-50">{summary.completionRate}% complete</p>
            <p className="text-sm leading-6 text-sage-600 dark:text-sage-200">{heroMessage}</p>
          </div>
        </div>

        <div className="border-t border-sage-100/80 px-6 py-4 sm:px-8 lg:px-10 dark:border-white/10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-3">
              {periodOptions.map((option) => {
                const isActive = period === option.value;

                return (
                  <button
                    key={option.value}
                    className={clsx(
                      'rounded-full px-4 py-2 text-sm font-semibold transition-all',
                      isActive
                        ? 'bg-sage-700 text-white shadow-soft dark:bg-sage-500 dark:text-slate-950'
                        : 'border border-sage-200 bg-white text-sage-700 hover:bg-sage-50 dark:border-white/10 dark:bg-white/5 dark:text-sage-100 dark:hover:bg-white/10'
                    )}
                    onClick={() => setPeriod(option.value)}
                    type="button"
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-sage-700 shadow-sm dark:bg-white/5 dark:text-sage-100">
              <span className="material-symbols-outlined text-base">insights</span>
              {summary.totalEntries ? `${summary.totalEntries} total reflections logged` : 'Waiting for your first reflections'}
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <div className="mt-6 rounded-[1.5rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-800 shadow-sm">
          {error}
        </div>
      ) : null}

      <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-5">
        {isLoading
          ? Array.from({ length: 5 }, (_, index) => (
              <div key={`analytics-skeleton-${index + 1}`} className="skeleton h-36 rounded-[1.75rem]" />
            ))
          : summaryCards.map((card) => (
              <article key={card.title} className="rounded-[1.75rem] border border-sage-100 bg-white p-6 shadow-soft transition-shadow hover:shadow-lifted dark:border-white/10 dark:bg-white/5">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sage-500 dark:text-sage-300">{card.title}</p>
                  <span className={clsx('material-symbols-outlined text-2xl', card.iconClassName)}>{card.icon}</span>
                </div>
                <p className="mt-4 text-3xl font-semibold text-slate-900 dark:text-sage-50">{card.value}</p>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-sage-200">{card.detail}</p>
              </article>
            ))}
      </section>

      <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
        <section className="rounded-[1.75rem] border border-sage-100 bg-white p-6 shadow-soft sm:p-8 dark:border-white/10 dark:bg-white/5">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sage-500 dark:text-sage-300">Mood Trends</p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-sage-900 dark:text-sage-50">Emotional tone over time</h2>
            </div>
            <div className="rounded-full bg-sage-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-sage-600 dark:bg-white/10 dark:text-sage-200">
              {periodOptions.find((option) => option.value === period)?.label}
            </div>
          </div>

          {isLoading ? (
            <div className="skeleton h-80 rounded-[1.5rem]" />
          ) : moodChartData.length ? (
            <div className="h-80 w-full">
              <ResponsiveContainer>
                <AreaChart data={moodChartData} margin={{ top: 16, right: 16, bottom: 8, left: -16 }}>
                  <defs>
                    <linearGradient id="analytics-mood-fill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#5f7861" stopOpacity="0.28" />
                      <stop offset="100%" stopColor="#5f7861" stopOpacity="0.03" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={isDarkMode ? '#314238' : '#e3e8e3'} strokeDasharray="4 4" vertical={false} />
                  <XAxis
                    axisLine={false}
                    dataKey="label"
                    tick={{ fill: isDarkMode ? '#b7c6b8' : '#7d937f', fontSize: 12, fontWeight: 600 }}
                    tickLine={false}
                  />
                  <YAxis
                    axisLine={false}
                    domain={[1, 5]}
                    tick={{ fill: isDarkMode ? '#b7c6b8' : '#7d937f', fontSize: 12, fontWeight: 600 }}
                    tickFormatter={(value) => `${value}`}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;

                      return (
                        <div className={clsx('rounded-2xl border px-4 py-3 shadow-soft', isDarkMode ? 'border-white/10 bg-[#101915]' : 'border-sage-100 bg-white')}>
                          <p className={clsx('text-xs font-semibold uppercase tracking-[0.2em]', isDarkMode ? 'text-sage-300' : 'text-sage-500')}>{label}</p>
                          <p className={clsx('mt-2 text-lg font-semibold', isDarkMode ? 'text-sage-50' : 'text-slate-900')}>Mood: {payload[0].value} / 5</p>
                          <p className={clsx('mt-1 text-sm', isDarkMode ? 'text-sage-200' : 'text-sage-600')}>{payload[0].payload.moodLabel}</p>
                          <p className={clsx('mt-1 text-xs', isDarkMode ? 'text-sage-400' : 'text-slate-400')}>{payload[0].payload.fullDate}</p>
                        </div>
                      );
                    }}
                  />
                  <Area
                    activeDot={{ fill: '#5f7861', r: 5, stroke: '#ffffff', strokeWidth: 2 }}
                    dataKey="mood"
                    fill="url(#analytics-mood-fill)"
                    stroke="#5f7861"
                    strokeWidth={3}
                    type="monotone"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-80 flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-sage-200 bg-sage-50/70 px-6 text-center dark:border-white/10 dark:bg-[#101915]">
              <span className="material-symbols-outlined text-4xl text-sage-400 dark:text-sage-300">sentiment_neutral</span>
              <p className="mt-4 font-display text-2xl font-semibold text-sage-800 dark:text-sage-50">No mood trend yet</p>
              <p className="mt-2 max-w-md text-sm leading-6 text-sage-600 dark:text-sage-200">
                Log a few daily reflections and this chart will begin tracing how your emotional weather shifts over time.
              </p>
            </div>
          )}
        </section>

        <aside className="rounded-[1.75rem] border border-sage-100 bg-gradient-to-b from-white to-sage-50/60 p-6 shadow-soft sm:p-8 dark:border-white/10 dark:bg-gradient-to-b dark:from-[#18231d] dark:to-[#101915]">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sage-500 dark:text-sage-300">Weekly Report</p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-sage-900 dark:text-sage-50">A softer summary</h2>
            </div>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-sage-100 text-sage-700 dark:bg-white/10 dark:text-sage-100">
              <span className="material-symbols-outlined">auto_graph</span>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <div className="skeleton h-24 rounded-[1.5rem]" />
              <div className="skeleton h-40 rounded-[1.5rem]" />
            </div>
          ) : (
            <>
              <div className="rounded-[1.5rem] border border-sage-100 bg-white/80 p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sage-500 dark:text-sage-300">This Week</p>
                <p className="mt-2 font-display text-3xl font-semibold text-sage-800 dark:text-sage-50">{weeklyReport.daysLogged}/7 days logged</p>
                <p className="mt-3 text-sm leading-6 text-sage-600 dark:text-sage-200">{weeklyNarrative}</p>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3 xl:grid-cols-1">
                <div className="rounded-[1.5rem] border border-sage-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sage-500 dark:text-sage-300">Mood</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-sage-50">{weeklyReport.averageMood ? weeklyReport.averageMood.toFixed(1) : '0.0'} / 5</p>
                  <p className="mt-1 text-sm text-sage-600 dark:text-sage-200">{formatMoodLabel(weeklyReport.averageMood)}</p>
                </div>
                <div className="rounded-[1.5rem] border border-sage-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sage-500 dark:text-sage-300">Hydration</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-sage-50">{weeklyReport.averageWaterIntake.toFixed(1)}</p>
                  <p className="mt-1 text-sm text-sage-600 dark:text-sage-200">glasses per day</p>
                </div>
                <div className="rounded-[1.5rem] border border-sage-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sage-500 dark:text-sage-300">Sleep</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-sage-50">{weeklyReport.averageSleepHours.toFixed(1)}</p>
                  <p className="mt-1 text-sm text-sage-600 dark:text-sage-200">hours per night</p>
                </div>
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-sand-200 bg-sand-100/60 p-5 dark:border-white/10 dark:bg-[#101915]">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sage-500 dark:text-sage-300">Top Feelings</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {weeklyReport.topFeelings.length ? (
                    weeklyReport.topFeelings.map((item) => (
                      <span
                        key={item.feeling}
                        className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-4 py-2 text-sm font-medium text-sage-700 dark:border-white/10 dark:bg-white/10 dark:text-sage-100"
                      >
                        <span>{formatFeelingLabel(item.feeling)}</span>
                        <span className="rounded-full bg-sage-100 px-2 py-0.5 text-xs font-semibold text-sage-700 dark:bg-white/10 dark:text-sage-100">{item.count}</span>
                      </span>
                    ))
                  ) : (
                    <p className="text-sm leading-6 text-sage-600 dark:text-sage-200">As you complete more check-ins, the feelings you return to most often will appear here.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </aside>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(320px,1fr)_minmax(0,1.6fr)]">
        <section className="rounded-[1.75rem] border border-sage-100 bg-white p-6 shadow-soft sm:p-8 dark:border-white/10 dark:bg-white/5">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sage-500 dark:text-sage-300">Energy Pattern</p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-sage-900 dark:text-sage-50">When your energy rises</h2>
            </div>
            <div className="rounded-full bg-sage-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-sage-600 dark:bg-white/10 dark:text-sage-200">
              {topEnergyWindow ? `Peak around ${formatHourLabel(topEnergyWindow.hour)}` : 'Awaiting energy data'}
            </div>
          </div>

          {isLoading ? (
            <div className="skeleton h-72 rounded-[1.5rem]" />
          ) : energyChartData.length ? (
            <div className="h-72 w-full">
              <ResponsiveContainer>
                <LineChart data={energyChartData} margin={{ top: 12, right: 16, bottom: 4, left: -16 }}>
                  <CartesianGrid stroke={isDarkMode ? '#314238' : '#e3e8e3'} strokeDasharray="4 4" vertical={false} />
                  <XAxis
                    axisLine={false}
                    dataKey="label"
                    tick={{ fill: isDarkMode ? '#b7c6b8' : '#7d937f', fontSize: 12, fontWeight: 600 }}
                    tickLine={false}
                  />
                  <YAxis
                    axisLine={false}
                    domain={[0, 10]}
                    tick={{ fill: isDarkMode ? '#b7c6b8' : '#7d937f', fontSize: 12, fontWeight: 600 }}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;

                      return (
                        <div className={clsx('rounded-2xl border px-4 py-3 shadow-soft', isDarkMode ? 'border-white/10 bg-[#101915]' : 'border-sage-100 bg-white')}>
                          <p className={clsx('text-xs font-semibold uppercase tracking-[0.2em]', isDarkMode ? 'text-sage-300' : 'text-sage-500')}>{label}</p>
                          <p className={clsx('mt-2 text-lg font-semibold', isDarkMode ? 'text-sage-50' : 'text-slate-900')}>Energy: {payload[0].value} / 10</p>
                          <p className={clsx('mt-1 text-sm', isDarkMode ? 'text-sage-200' : 'text-sage-600')}>Average reported energy at this time</p>
                        </div>
                      );
                    }}
                  />
                  <Line
                    activeDot={{ fill: '#7c3aed', r: 5, stroke: '#ffffff', strokeWidth: 2 }}
                    dataKey="averageEnergy"
                    dot={{ fill: '#7c3aed', r: 3, strokeWidth: 0 }}
                    stroke="#7c3aed"
                    strokeLinecap="round"
                    strokeWidth={3}
                    type="monotone"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-72 flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-sage-200 bg-sage-50/70 px-6 text-center dark:border-white/10 dark:bg-[#101915]">
              <span className="material-symbols-outlined text-4xl text-sage-400 dark:text-sage-300">battery_horiz_075</span>
              <p className="mt-4 font-display text-2xl font-semibold text-sage-800 dark:text-sage-50">No energy pattern yet</p>
              <p className="mt-2 max-w-md text-sm leading-6 text-sage-600 dark:text-sage-200">
                Once energy checkpoints are logged in your reflections, this chart will highlight where your most restorative hours tend to land.
              </p>
            </div>
          )}
        </section>

        <section className="rounded-[1.75rem] border border-sage-100 bg-white p-6 shadow-soft sm:p-8 dark:border-white/10 dark:bg-white/5">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sage-500 dark:text-sage-300">Activity Heatmap</p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-sage-900 dark:text-sage-50">Consistency across {year}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-sage-600 dark:text-sage-200">
                Each square reflects how complete that day&apos;s reflection was, so dense clusters show where your routine felt easiest to sustain.
              </p>
            </div>

            <label className="flex items-center gap-3 rounded-full border border-sage-200 bg-sage-50 px-4 py-2 text-sm font-medium text-sage-700 dark:border-white/10 dark:bg-white/10 dark:text-sage-100">
              <span>Year</span>
              <select
                className="bg-transparent font-semibold outline-none"
                onChange={(event) => setYear(Number(event.target.value))}
                value={year}
              >
                {yearOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {isLoading ? (
            <div className="skeleton h-64 rounded-[1.5rem]" />
          ) : heatmap.weeks.length ? (
            <div className="overflow-hidden rounded-[1.5rem] border border-sage-100 bg-sage-50/60 p-4 dark:border-white/10 dark:bg-[#101915]">
              <div className="flex gap-3">
                <div className="mt-8 grid grid-rows-7 gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-sage-500 dark:text-sage-300">
                  {weekdayLabels.map((label) => (
                    <span key={label} className="analytics-heatmap-label">
                      {label.slice(0, 1)}
                    </span>
                  ))}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="analytics-heatmap-scroll overflow-x-auto pb-3">
                    <div className="inline-flex min-w-full flex-col gap-2">
                      <div className="flex gap-1.5 pl-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-sage-500 dark:text-sage-300">
                        {heatmap.weeks.map((_, index) => (
                          <div key={`month-${index}`} className="analytics-heatmap-week justify-start overflow-visible text-left">
                            {heatmap.monthLabels[index] || ''}
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-1.5">
                        {heatmap.weeks.map((week, weekIndex) => (
                          <div key={`week-${weekIndex + 1}`} className="analytics-heatmap-week grid grid-rows-7 gap-1.5">
                            {week.map((day, dayIndex) => (
                              <div
                                key={day ? day.date : `empty-${weekIndex + 1}-${dayIndex + 1}`}
                                className={clsx('analytics-heatmap-cell', getHeatmapLevelClassName(day?.completionRate ?? null))}
                                title={day ? `${format(parseISO(day.date), 'MMM d, yyyy')}: ${day.completionRate}% complete` : ''}
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-sage-600 dark:text-sage-200">
                    <span className="font-semibold uppercase tracking-[0.18em] text-sage-500 dark:text-sage-300">Less</span>
                    {[0, 25, 50, 75, 100].map((level) => (
                      <span
                        key={level}
                        className={clsx('analytics-heatmap-cell', getHeatmapLevelClassName(level))}
                        title={`${level}% completion level`}
                      />
                    ))}
                    <span className="font-semibold uppercase tracking-[0.18em] text-sage-500 dark:text-sage-300">More</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-sage-200 bg-sage-50/70 px-6 text-center dark:border-white/10 dark:bg-[#101915]">
              <span className="material-symbols-outlined text-4xl text-sage-400 dark:text-sage-300">calendar_month</span>
              <p className="mt-4 font-display text-2xl font-semibold text-sage-800 dark:text-sage-50">No activity map yet</p>
              <p className="mt-2 max-w-md text-sm leading-6 text-sage-600 dark:text-sage-200">
                Daily completion blocks will appear here once reflections are saved through the year.
              </p>
            </div>
          )}
        </section>
      </div>

      <section className="mt-8 rounded-[1.75rem] border border-sand-200 bg-sand-100/70 p-6 shadow-soft sm:p-8 dark:border-white/10 dark:bg-[#18231d]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sage-500 dark:text-sage-300">Gentle Read</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-sage-900 dark:text-sage-50">What your data is quietly saying</h2>
            <p className="mt-3 text-sm leading-7 text-sage-700 dark:text-sage-200">
              {summary.totalEntries
                ? `${heroMessage} ${topEnergyWindow ? `Your strongest energy shows up near ${formatHourLabel(topEnergyWindow.hour)}.` : ''}`
                : 'This page is ready. A few reflections, self-care entries, and review check-ins will turn it into a clear picture of your habits.'}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex items-center justify-center gap-2 rounded-full bg-sage-700 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-sage-800 hover:shadow-lifted dark:bg-sage-500 dark:text-slate-950 dark:hover:bg-sage-400"
              to="/reflection"
            >
              <span className="material-symbols-outlined text-[18px]">edit_note</span>
              Add Reflection
            </Link>
            <Link
              className="inline-flex items-center justify-center gap-2 rounded-full border border-sage-200 bg-white px-6 py-3 text-sm font-semibold text-sage-700 transition-all hover:bg-sage-50 dark:border-white/10 dark:bg-white/5 dark:text-sage-100 dark:hover:bg-white/10"
              to="/review"
            >
              <span className="material-symbols-outlined text-[18px]">menu_book</span>
              Open Review
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
