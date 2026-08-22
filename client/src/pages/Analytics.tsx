import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { toast } from 'sonner';
import {
  eachDayOfInterval,
  format,
  parseISO,
  subDays,
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
import { buildAnalyticsReport, downloadAnalyticsReport } from '@/lib/analyticsReport';
import analyticsService from '@/services/analyticsService';
import entryService from '@/services/entryService';
import type { AiSummaryResponse, ThemeTrendResponse } from '@/types/ai';
import type { AnalyticsPatternInsights } from '@/types/analytics';
import type { DailyEntry } from '@/types/entry';

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

interface MoodChartPoint {
  date: string;
  label: string;
  fullDate: string;
  mood: number | null;
  moodLabel: string;
  hasEntry: boolean;
  entryCreatedTimeLabel: string | null;
}

interface EnergyPatternPoint {
  hour: number;
  averageEnergy: number;
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
const periodDayMap: Record<Period, number> = {
  '7days': 7,
  '30days': 30,
  '90days': 90,
  year: 365,
};
const MIN_MOOD_WINDOW_DAYS = 3;
const MAX_MOOD_WINDOW_DAYS = 365;

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

const emptyAiSummary: AiSummaryResponse = {
  period: '30days',
  narrative: 'There are not enough analyzed reflections in this period yet to build an AI summary.',
  recurringThemes: [],
  commonStressors: [],
  positiveAnchors: [],
  suggestedFocusAreas: [],
  languageShift: {
    direction: 'insufficient_data',
    explanation: 'There is not enough scored text yet to estimate a language shift.',
  },
};

const emptyThemeTrends: ThemeTrendResponse = {
  period: '30days',
  recurringThemes: [],
  commonStressors: [],
  positiveAnchors: [],
};

const createEmptyPatternInsights = (period: Period): AnalyticsPatternInsights => ({
  period,
  ranges: {
    currentStart: '',
    previousStart: '',
    currentDays: periodDayMap[period],
  },
  comparisons: [],
  behaviorInsights: [],
  dataQuality: {
    currentEntries: 0,
    previousEntries: 0,
    moodDays: 0,
    hasComparison: false,
    hasBehaviorInsights: false,
  },
});

const unwrapEnvelope = <T,>(response: ApiEnvelope<T>) => response.data;

const toEntryDateKey = (value?: string | null) => (typeof value === 'string' ? value.slice(0, 10) : '');

const clampMoodWindowDays = (value: number) => (
  Math.min(MAX_MOOD_WINDOW_DAYS, Math.max(MIN_MOOD_WINDOW_DAYS, Math.round(value)))
);

const formatMoodLabel = (score: number | null | undefined) => {
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

const formatComparisonValue = (value: number | null, unit: string) => {
  if (value == null) return 'Not enough data';
  if (unit === '%') return `${value}%`;
  if (unit === '/ 5') return `${value} / 5`;
  return `${value} ${unit}`;
};

const comparisonPeriodLabel = (period: Period) => {
  if (period === '7days') return 'previous 7 days';
  if (period === '30days') return 'previous 30 days';
  if (period === '90days') return 'previous 90 days';
  return 'previous year';
};

const formatMoodChartTick = (date: Date, days: number) => {
  if (days <= 10) return format(date, 'EEE');
  if (days <= 45) return format(date, 'MMM d');
  return format(date, 'MMM');
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

export default function Analytics() {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const firstName = user?.name?.split(' ')[0] || 'there';

  const [period, setPeriod] = useState<Period>('30days');
  const [customMoodWindowDays, setCustomMoodWindowDays] = useState(30);
  const [isCustomMoodWindowActive, setIsCustomMoodWindowActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMoodLoading, setIsMoodLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<SummaryData>(emptySummary);
  const [moodEntries, setMoodEntries] = useState<DailyEntry[]>([]);
  const [energyPatterns, setEnergyPatterns] = useState<EnergyPatternPoint[]>([]);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReportData>(emptyWeeklyReport);
  const [aiSummary, setAiSummary] = useState<AiSummaryResponse>(emptyAiSummary);
  const [themeTrends, setThemeTrends] = useState<ThemeTrendResponse>(emptyThemeTrends);
  const [patternInsights, setPatternInsights] = useState<AnalyticsPatternInsights>(
    createEmptyPatternInsights('30days')
  );
  const [downloadingReport, setDownloadingReport] = useState<Period | null>(null);
  const moodWindowDays = isCustomMoodWindowActive ? customMoodWindowDays : periodDayMap[period];

  useEffect(() => {
    let cancelled = false;

    const loadAnalytics = async () => {
      setIsLoading(true);
      setError('');

      const [
        summaryResult,
        aiSummaryResult,
        themeTrendResult,
        patternResult,
        energyResult,
        weeklyResult,
      ] = await Promise.allSettled([
        analyticsService.getSummary(period),
        analyticsService.getAiSummary(period),
        analyticsService.getThemeTrends(period),
        analyticsService.getPatternInsights(period),
        analyticsService.getEnergyPatterns(),
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

      if (aiSummaryResult.status === 'fulfilled') {
        setAiSummary(unwrapEnvelope(aiSummaryResult.value));
      } else {
        requestFailed = true;
        setAiSummary({ ...emptyAiSummary, period });
      }

      if (themeTrendResult.status === 'fulfilled') {
        setThemeTrends(unwrapEnvelope(themeTrendResult.value));
      } else {
        requestFailed = true;
        setThemeTrends({ ...emptyThemeTrends, period });
      }

      if (patternResult.status === 'fulfilled') {
        setPatternInsights(unwrapEnvelope(patternResult.value));
      } else {
        requestFailed = true;
        setPatternInsights(createEmptyPatternInsights(period));
      }

      if (energyResult.status === 'fulfilled') {
        setEnergyPatterns(unwrapEnvelope(energyResult.value));
      } else {
        requestFailed = true;
        setEnergyPatterns([]);
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
  }, [period]);

  useEffect(() => {
    let cancelled = false;

    const loadMoodEntries = async () => {
      setIsMoodLoading(true);

      try {
        const response = await entryService.getRecentEntries(moodWindowDays);
        if (!cancelled) {
          setMoodEntries(unwrapEnvelope(response));
        }
      } catch {
        if (!cancelled) {
          setMoodEntries([]);
          setError((current) => current || 'Some insights could not be loaded. The page is showing any data that was available.');
        }
      } finally {
        if (!cancelled) {
          setIsMoodLoading(false);
        }
      }
    };

    void loadMoodEntries();

    return () => {
      cancelled = true;
    };
  }, [moodWindowDays]);

  const moodChartData = useMemo<MoodChartPoint[]>(() => {
    const end = new Date();
    const start = subDays(end, moodWindowDays - 1);
    const entriesByDate = new Map(moodEntries.map((entry) => [toEntryDateKey(entry.date), entry]));

    return eachDayOfInterval({ start, end }).map((day) => {
      const date = format(day, 'yyyy-MM-dd');
      const entry = entriesByDate.get(date);

      return {
        date,
        label: formatMoodChartTick(day, moodWindowDays),
        fullDate: format(day, 'MMM d, yyyy'),
        mood: entry?.mood ?? null,
        moodLabel: formatMoodLabel(entry?.mood),
        hasEntry: Boolean(entry),
        entryCreatedTimeLabel: entry?.createdAt ? format(parseISO(entry.createdAt), 'p') : null,
      };
    });
  }, [moodEntries, moodWindowDays]);

  const energyChartData = useMemo(
    () => energyPatterns.map((item) => ({
      ...item,
      label: formatHourLabel(item.hour),
    })),
    [energyPatterns]
  );

  const topEnergyWindow = useMemo(() => {
    if (!energyPatterns.length) return null;
    return energyPatterns.reduce((best, current) => (current.averageEnergy > best.averageEnergy ? current : best));
  }, [energyPatterns]);

  const moodLoggedEntryCount = useMemo(() => moodChartData.filter((point) => point.hasEntry).length, [moodChartData]);
  const moodChartHasEntries = useMemo(() => moodChartData.some((point) => point.hasEntry), [moodChartData]);
  const moodChartHasRatings = useMemo(() => moodChartData.some((point) => point.mood != null), [moodChartData]);

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
  const comparisonLabel = comparisonPeriodLabel(period);

  const handleDownloadReport = async (reportPeriod: Extract<Period, '30days' | '90days'>) => {
    setDownloadingReport(reportPeriod);

    try {
      const reportData = reportPeriod === period
        ? {
            summary,
            aiSummary,
            themeTrends,
            patternInsights,
          }
        : await Promise.all([
            analyticsService.getSummary(reportPeriod),
            analyticsService.getAiSummary(reportPeriod),
            analyticsService.getThemeTrends(reportPeriod),
            analyticsService.getPatternInsights(reportPeriod),
          ]).then(([summaryResponse, aiResponse, themeResponse, patternResponse]) => ({
            summary: unwrapEnvelope<SummaryData>(summaryResponse),
            aiSummary: unwrapEnvelope(aiResponse),
            themeTrends: unwrapEnvelope(themeResponse),
            patternInsights: unwrapEnvelope(patternResponse),
          }));
      const generatedAt = new Date();
      const report = buildAnalyticsReport({
        name: user?.name || 'MindfulLife member',
        period: reportPeriod,
        summary: reportData.summary,
        aiSummary: reportData.aiSummary,
        themeTrends: reportData.themeTrends,
        patternInsights: reportData.patternInsights,
        generatedAt,
      });

      downloadAnalyticsReport(report, reportPeriod, generatedAt);
      toast.success(`${reportPeriod === '30days' ? 'Monthly' : 'Quarterly'} report downloaded`);
    } catch (downloadError: any) {
      toast.error(downloadError?.response?.data?.message || 'Unable to prepare the report');
    } finally {
      setDownloadingReport(null);
    }
  };

  return (
    <div className="editorial-page animate-fade-in">
      <section className="hero-shell section-reveal-soft">
        <div className="flex flex-col gap-6 px-6 py-8 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-10">
          <div className="max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-[0.32em] text-sage-500 dark:text-sage-300">Analytics</p>
            <h1 className="compact-hero-title mt-3 font-display text-sage-900 dark:text-sage-50">
              Your wellness patterns, {firstName}.
            </h1>
            <p className="compact-lead mt-4 max-w-2xl text-sage-600 dark:text-sage-200">
              See how mood, energy, sleep, and consistency move together across your recent practice so your next small step can be more intentional.
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-[1.5rem] border border-sage-100 bg-white/80 p-5 shadow-sm backdrop-blur sm:min-w-[280px] dark:border-white/10 dark:bg-white/5">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-sage-500 dark:text-sage-300">Current Read</p>
            <p className="compact-display-value font-display text-sage-800 dark:text-sage-50">{summary.completionRate}% complete</p>
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
                      'rounded-full px-4 py-2 text-sm font-medium transition-all',
                      isActive
                        ? 'bg-sage-700 text-white shadow-soft dark:bg-sage-500 dark:text-slate-950'
                        : 'border border-sage-200 bg-white text-sage-700 hover:bg-sage-50 dark:border-white/10 dark:bg-white/5 dark:text-sage-100 dark:hover:bg-white/10'
                    )}
                    onClick={() => {
                      setPeriod(option.value);
                      setIsCustomMoodWindowActive(false);
                    }}
                    type="button"
                  >
                    {option.label}
                  </button>
                );
              })}

              {isCustomMoodWindowActive ? (
                <label className="inline-flex items-center gap-2 rounded-full bg-sage-700 px-4 py-2 text-sm font-medium text-white shadow-soft dark:bg-sage-500 dark:text-slate-950">
                  <span>Days</span>
                  <input
                    autoFocus
                    className="w-20 rounded-full border border-white/30 bg-white px-3 py-1 text-center text-sm font-medium text-slate-900 outline-none focus:border-white dark:border-slate-900/10 dark:bg-[#101915] dark:text-sage-50"
                    max={MAX_MOOD_WINDOW_DAYS}
                    min={MIN_MOOD_WINDOW_DAYS}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      if (Number.isFinite(value)) {
                        setCustomMoodWindowDays(clampMoodWindowDays(value));
                      }
                    }}
                    type="number"
                    value={customMoodWindowDays}
                  />
                </label>
              ) : (
                <button
                  className="rounded-full border border-sage-200 bg-white px-4 py-2 text-sm font-medium text-sage-700 transition-all hover:bg-sage-50 dark:border-white/10 dark:bg-white/5 dark:text-sage-100 dark:hover:bg-white/10"
                  onClick={() => setIsCustomMoodWindowActive(true)}
                  type="button"
                >
                  Custom
                </button>
              )}
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-sage-700 shadow-sm dark:bg-white/5 dark:text-sage-100">
              <span className="material-symbols-outlined text-base">insights</span>
              {summary.totalEntries ? `${summary.totalEntries} total reflections logged` : 'Waiting for your first reflections'}
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <div className="section-reveal mt-6 rounded-[1.5rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-800 shadow-sm" style={{ animationDelay: '80ms' }}>
          {error}
        </div>
      ) : null}

      <section className="section-reveal mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-5" style={{ animationDelay: '110ms' }}>
        {isLoading
          ? Array.from({ length: 5 }, (_, index) => (
              <div key={`analytics-skeleton-${index + 1}`} className="skeleton h-36 rounded-[1.75rem]" />
            ))
          : summaryCards.map((card) => (
              <article key={card.title} className="panel-shell surface-lift p-6">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-medium uppercase tracking-[0.24em] text-sage-500 dark:text-sage-300">{card.title}</p>
                  <span className={clsx('material-symbols-outlined text-2xl', card.iconClassName)}>{card.icon}</span>
                </div>
                <p className="compact-display-value mt-4 text-slate-900 dark:text-sage-50">{card.value}</p>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-sage-200">{card.detail}</p>
              </article>
            ))}
      </section>

      <section className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,1fr)]">
        <article className="section-reveal rounded-[1.75rem] border border-sage-100 bg-gradient-to-br from-[#f8fbf8] via-white to-sand-50 p-6 shadow-soft sm:p-8 dark:border-white/10 dark:bg-gradient-to-br dark:from-[#18231d] dark:via-[#101915] dark:to-[#1b241f]" style={{ animationDelay: '160ms' }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-sage-500 dark:text-sage-300">AI Summary</p>
              <h2 className="compact-section-title mt-2 font-display text-sage-900 dark:text-sage-50">Narrative interpretation</h2>
            </div>
            <div className="rounded-full bg-white/80 px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-sage-600 shadow-sm dark:bg-white/10 dark:text-sage-200">
              {aiSummary.languageShift.direction.replace(/_/g, ' ')}
            </div>
          </div>

          {isLoading ? (
            <div className="mt-6 skeleton h-36 rounded-[1.5rem]" />
          ) : (
            <>
              <p className="mt-6 text-base leading-8 text-sage-700 dark:text-sage-200">{aiSummary.narrative}</p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.5rem] border border-sage-100 bg-white/90 p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-sage-500 dark:text-sage-300">Suggested Focus</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {aiSummary.suggestedFocusAreas.length ? aiSummary.suggestedFocusAreas.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-sage-200 bg-sage-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-sage-700 dark:border-white/10 dark:bg-white/10 dark:text-sage-100"
                      >
                        {item}
                      </span>
                    )) : (
                      <p className="text-sm leading-6 text-sage-600 dark:text-sage-200">More reflection text will make these focus areas more specific.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-sage-100 bg-white/90 p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-sage-500 dark:text-sage-300">Language Shift</p>
                  <p className="mt-4 text-sm leading-7 text-sage-700 dark:text-sage-200">{aiSummary.languageShift.explanation}</p>
                </div>
              </div>
            </>
          )}
        </article>

        <article className="panel-shell section-reveal" style={{ animationDelay: '220ms' }}>
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-sage-500 dark:text-sage-300">Theme Trends</p>
          <h2 className="compact-section-title mt-2 font-display text-sage-900 dark:text-sage-50">What keeps repeating</h2>

          {isLoading ? (
            <div className="mt-6 space-y-4">
              <div className="skeleton h-24 rounded-[1.5rem]" />
              <div className="skeleton h-24 rounded-[1.5rem]" />
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="rounded-[1.5rem] border border-sage-100 bg-sage-50/70 p-5 dark:border-white/10 dark:bg-[#101915]">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-sage-500 dark:text-sage-300">Recurring Themes</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {themeTrends.recurringThemes.length ? themeTrends.recurringThemes.map((item) => (
                    <span
                      key={item.theme}
                      className="inline-flex items-center gap-2 rounded-full border border-sage-200 bg-white px-3 py-1 text-sm font-medium text-sage-700 dark:border-white/10 dark:bg-white/10 dark:text-sage-100"
                    >
                      <span>{item.theme}</span>
                      <span className="rounded-full bg-sage-100 px-2 py-0.5 text-xs font-medium text-sage-700 dark:bg-white/10 dark:text-sage-100">{item.count}</span>
                    </span>
                  )) : (
                    <p className="text-sm leading-6 text-sage-600 dark:text-sage-200">No recurring themes yet.</p>
                  )}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-sage-100 bg-sand-100/50 p-5 dark:border-white/10 dark:bg-[#101915]">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-sage-500 dark:text-sage-300">Common Stressors</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {themeTrends.commonStressors.length ? themeTrends.commonStressors.map((item) => (
                    <span
                      key={item.label}
                      className="inline-flex items-center gap-2 rounded-full border border-sand-200 bg-white px-3 py-1 text-sm font-medium text-sage-700 dark:border-white/10 dark:bg-white/10 dark:text-sage-100"
                    >
                      <span>{item.label}</span>
                      <span className="rounded-full bg-sand-100 px-2 py-0.5 text-xs font-medium text-sage-700 dark:bg-white/10 dark:text-sage-100">{item.count}</span>
                    </span>
                  )) : (
                    <p className="text-sm leading-6 text-sage-600 dark:text-sage-200">No common stressors surfaced yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </article>
      </section>

      <section className="panel-shell section-reveal mt-8" style={{ animationDelay: '260ms' }}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-sage-500 dark:text-sage-300">Longitudinal Comparison</p>
            <h2 className="compact-section-title mt-2 font-display text-sage-900 dark:text-sage-50">What changed from the last period</h2>
            <p className="mt-3 text-sm leading-6 text-sage-600 dark:text-sage-200">
              Compare the selected window with the {comparisonLabel}. Direction matters less than whether the shift helps you ask a better question.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-sage-50 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-sage-600 dark:bg-white/10 dark:text-sage-200">
            <span className="material-symbols-outlined text-[17px]">compare_arrows</span>
            {patternInsights.dataQuality.currentEntries} current / {patternInsights.dataQuality.previousEntries} previous
          </div>
        </div>

        {isLoading ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={`comparison-skeleton-${index + 1}`} className="skeleton h-40 rounded-[1.5rem]" />
            ))}
          </div>
        ) : patternInsights.dataQuality.hasComparison ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {patternInsights.comparisons.map((comparison) => {
              const hasDelta = comparison.delta != null;
              const isUp = comparison.direction === 'up';

              return (
                <article key={comparison.key} className="rounded-[1.5rem] border border-sage-100 bg-sage-50/60 p-5 dark:border-white/10 dark:bg-[#101915]">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-sage-500 dark:text-sage-300">{comparison.label}</p>
                    <span className={clsx(
                      'material-symbols-outlined rounded-full p-1 text-[18px]',
                      !hasDelta && 'bg-sage-100 text-sage-500 dark:bg-white/10 dark:text-sage-300',
                      hasDelta && isUp && 'bg-sage-100 text-sage-700 dark:bg-sage-500/20 dark:text-sage-200',
                      hasDelta && !isUp && comparison.direction === 'down' && 'bg-sand-100 text-sand-700 dark:bg-sand-500/20 dark:text-sand-200',
                      comparison.direction === 'steady' && 'bg-sage-100 text-sage-500 dark:bg-white/10 dark:text-sage-300'
                    )}>
                      {comparison.direction === 'up' ? 'trending_up' : comparison.direction === 'down' ? 'trending_down' : 'trending_flat'}
                    </span>
                  </div>
                  <p className="compact-display-value mt-5 text-slate-900 dark:text-sage-50">
                    {formatComparisonValue(comparison.current, comparison.unit)}
                  </p>
                  <p className="mt-2 text-sm text-sage-600 dark:text-sage-200">
                    Previous: {formatComparisonValue(comparison.previous, comparison.unit)}
                  </p>
                  <p className="mt-4 text-xs font-medium uppercase tracking-[0.14em] text-sage-500 dark:text-sage-300">
                    {comparison.delta == null
                      ? 'More history needed'
                      : `${comparison.delta > 0 ? '+' : ''}${comparison.delta} ${comparison.unit} change`}
                  </p>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-6 rounded-[1.5rem] border border-dashed border-sage-200 bg-sage-50/70 px-6 py-10 text-center dark:border-white/10 dark:bg-[#101915]">
            <span className="material-symbols-outlined text-4xl text-sage-400 dark:text-sage-300">timeline</span>
              <p className="mt-3 text-xl font-medium text-sage-800 dark:text-sage-50">The comparison needs an earlier period</p>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-sage-600 dark:text-sage-200">
              Keep checking in. Once both adjacent windows contain entries, this section will show how mood, sleep, hydration, and completion are moving.
            </p>
          </div>
        )}
      </section>

      <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
        <section className="panel-shell section-reveal" style={{ animationDelay: '320ms' }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-sage-500 dark:text-sage-300">Pattern Relationships</p>
              <h2 className="compact-section-title mt-2 font-display text-sage-900 dark:text-sage-50">What tends to support better days</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-sage-600 dark:text-sage-200">
                These are associations in your own entries, not proof that one action caused a mood change.
              </p>
            </div>
            <div className="hidden size-12 shrink-0 items-center justify-center rounded-2xl bg-sage-100 text-sage-700 sm:flex dark:bg-white/10 dark:text-sage-100">
              <span className="material-symbols-outlined">hub</span>
            </div>
          </div>

          {isLoading ? (
            <div className="mt-6 grid grid-cols-1 gap-4">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={`relationship-skeleton-${index + 1}`} className="skeleton h-56 rounded-[1.5rem]" />
              ))}
            </div>
          ) : patternInsights.behaviorInsights.length ? (
            <div className="mt-6 grid grid-cols-1 gap-4">
              {patternInsights.behaviorInsights.map((insight) => (
                <article key={insight.id} className="rounded-[1.5rem] border border-sage-100 bg-gradient-to-b from-sage-50/80 to-white p-5 dark:border-white/10 dark:bg-gradient-to-b dark:from-[#18231d] dark:to-[#101915]">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-white text-sage-700 shadow-sm dark:bg-white/10 dark:text-sage-100">
                    <span className="material-symbols-outlined">{insight.icon}</span>
                  </div>
                  <p className="mt-5 text-xs font-medium uppercase tracking-[0.18em] text-sage-500 dark:text-sage-300">{insight.shortLabel}</p>
                  <p className="mt-2 font-display text-2xl font-medium leading-8 text-sage-900 dark:text-sage-50">
                    Mood was {Math.abs(insight.delta).toFixed(1)} points {insight.direction}.
                  </p>
                  <p className="mt-3 text-sm leading-6 text-sage-600 dark:text-sage-200">
                    {insight.withAverage.toFixed(1)} / 5 on {insight.label}, compared with {insight.withoutAverage.toFixed(1)} / 5 otherwise.
                  </p>
                  <p className="mt-5 text-xs font-medium uppercase tracking-[0.14em] text-sage-500 dark:text-sage-300">
                    {insight.supportingDays} supporting days / {insight.sampleSize} mood-rated days
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-[1.5rem] border border-dashed border-sage-200 bg-sage-50/70 px-6 py-10 text-center dark:border-white/10 dark:bg-[#101915]">
              <span className="material-symbols-outlined text-4xl text-sage-400 dark:text-sage-300">query_stats</span>
              <p className="mt-3 text-xl font-medium text-sage-800 dark:text-sage-50">More paired check-ins are needed</p>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-sage-600 dark:text-sage-200">
                Add mood ratings alongside sleep, hydration, movement, mindfulness, fresh air, or connection. Each comparison needs at least two days with and two days without the behavior.
              </p>
            </div>
          )}
        </section>

        <aside className="analytics-premium-panel section-reveal overflow-hidden rounded-[1.75rem] border border-slate-900 bg-gradient-to-br from-slate-950 via-[#1b2b22] to-sage-800 p-6 text-white shadow-soft sm:p-8 xl:sticky xl:top-6 xl:self-start" style={{ animationDelay: '380ms' }}>
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/60">Premium Report Preview</p>
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white/80">Preview access</span>
          </div>
          <h2 className="compact-section-title mt-4 font-display">Package the pattern, not just the numbers.</h2>
          <p className="mt-4 text-sm leading-7 text-white/75">
            Download a plain-text preview for personal review, coaching, or therapy preparation. The report includes comparisons, behavior associations, themes, and the AI narrative.
          </p>

          <div className="mt-6 space-y-3">
            {[
              'Adjacent-period trend comparisons',
              'Behavior and mood relationship notes',
              'Recurring themes and suggested focus',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span className="material-symbols-outlined text-[18px] text-sage-200">check_circle</span>
                <span className="text-sm text-white/85">{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={downloadingReport != null}
              onClick={() => void handleDownloadReport('30days')}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              {downloadingReport === '30days' ? 'Preparing...' : 'Monthly report'}
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={downloadingReport != null}
              onClick={() => void handleDownloadReport('90days')}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">calendar_view_month</span>
              {downloadingReport === '90days' ? 'Preparing...' : 'Quarterly report'}
            </button>
          </div>
        </aside>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
        <section className="panel-shell section-reveal" style={{ animationDelay: '430ms' }}>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-sage-500 dark:text-sage-300">Mood Trends</p>
              <h2 className="compact-section-title mt-2 font-display text-sage-900 dark:text-sage-50">Emotional tone over time</h2>
            </div>
            <div className="rounded-full bg-sage-50 px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-sage-600 dark:bg-white/10 dark:text-sage-200">
              Last {moodWindowDays} days
            </div>
          </div>

          {isMoodLoading ? (
            <div className="skeleton h-80 rounded-[1.5rem]" />
          ) : moodChartHasEntries && moodChartHasRatings ? (
            <div>
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
                      minTickGap={moodWindowDays <= 10 ? 0 : moodWindowDays <= 45 ? 18 : 28}
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
                      content={({ active, payload }) => {
                        const point = payload?.[0]?.payload as MoodChartPoint | undefined;

                        if (!active || !point) return null;

                        return (
                          <div className={clsx('rounded-2xl border px-4 py-3 shadow-soft', isDarkMode ? 'border-white/10 bg-[#101915]' : 'border-sage-100 bg-white')}>
                            <p className={clsx('text-xs font-medium uppercase tracking-[0.2em]', isDarkMode ? 'text-sage-300' : 'text-sage-500')}>{point.fullDate}</p>
                            <p className={clsx('mt-2 text-lg font-medium', isDarkMode ? 'text-sage-50' : 'text-slate-900')}>
                              {point.mood != null ? `Mood: ${point.mood} / 5` : 'No mood rating'}
                            </p>
                            <p className={clsx('mt-1 text-sm', isDarkMode ? 'text-sage-200' : 'text-sage-600')}>{point.moodLabel}</p>
                            <p className={clsx('mt-1 text-xs', isDarkMode ? 'text-sage-400' : 'text-slate-400')}>
                              {point.hasEntry && point.entryCreatedTimeLabel
                                ? `Entry saved at ${point.entryCreatedTimeLabel}`
                                : 'No entry logged'}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Area
                      activeDot={{ fill: '#5f7861', r: 5, stroke: '#ffffff', strokeWidth: 2 }}
                      connectNulls={false}
                      dataKey="mood"
                      dot={({ cx, cy, payload }) => {
                        if (
                          payload.mood == null
                          || typeof cx !== 'number'
                          || typeof cy !== 'number'
                        ) {
                          return null;
                        }

                        return (
                          <circle
                            cx={cx}
                            cy={cy}
                            fill="#5f7861"
                            opacity={payload.hasEntry ? 1 : 0.55}
                            r={4}
                            stroke="#ffffff"
                            strokeWidth={2}
                          />
                        );
                      }}
                      fill="url(#analytics-mood-fill)"
                      stroke="#5f7861"
                      strokeWidth={3}
                      type="monotone"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-4 text-sm text-sage-600 dark:text-sage-200">
                {moodLoggedEntryCount} {moodLoggedEntryCount === 1 ? 'entry' : 'entries'} logged in the last {moodWindowDays} days. Hover over the chart to see the day and the time each entry was saved.
              </p>
            </div>
          ) : moodChartHasEntries ? (
            <div className="flex h-80 flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-sage-200 bg-sage-50/70 px-6 text-center dark:border-white/10 dark:bg-[#101915]">
              <span className="material-symbols-outlined text-4xl text-sage-400 dark:text-sage-300">edit_calendar</span>
              <p className="mt-4 font-display text-2xl font-medium text-sage-800 dark:text-sage-50">Entries logged, but no mood ratings yet</p>
              <p className="mt-2 max-w-md text-sm leading-6 text-sage-600 dark:text-sage-200">
                {moodLoggedEntryCount} {moodLoggedEntryCount === 1 ? 'entry was' : 'entries were'} saved in the last {moodWindowDays} days. Add a mood to your reflections and the graph will start tracing the pattern.
              </p>
            </div>
          ) : (
            <div className="flex h-80 flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-sage-200 bg-sage-50/70 px-6 text-center dark:border-white/10 dark:bg-[#101915]">
              <span className="material-symbols-outlined text-4xl text-sage-400 dark:text-sage-300">sentiment_neutral</span>
              <p className="mt-4 font-display text-2xl font-medium text-sage-800 dark:text-sage-50">No mood trend yet</p>
              <p className="mt-2 max-w-md text-sm leading-6 text-sage-600 dark:text-sage-200">
                Log a few daily reflections and this chart will begin tracing how your emotional weather shifts over time.
              </p>
            </div>
          )}
        </section>

        <aside className="section-reveal rounded-[1.75rem] border border-sage-100 bg-gradient-to-b from-white to-sage-50/60 p-6 shadow-soft sm:p-8 dark:border-white/10 dark:bg-gradient-to-b dark:from-[#18231d] dark:to-[#101915] xl:sticky xl:top-6 xl:self-start" style={{ animationDelay: '490ms' }}>
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-sage-500 dark:text-sage-300">Weekly Report</p>
              <h2 className="compact-section-title mt-2 font-display text-sage-900 dark:text-sage-50">A softer summary</h2>
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
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-sage-500 dark:text-sage-300">This Week</p>
                <p className="compact-display-value mt-2 font-display text-sage-800 dark:text-sage-50">{weeklyReport.daysLogged}/7 days logged</p>
                <p className="mt-3 text-sm leading-6 text-sage-600 dark:text-sage-200">{weeklyNarrative}</p>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3 xl:grid-cols-1">
                <div className="rounded-[1.5rem] border border-sage-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-sage-500 dark:text-sage-300">Mood</p>
                  <p className="mt-2 text-2xl font-medium text-slate-900 dark:text-sage-50">{weeklyReport.averageMood ? weeklyReport.averageMood.toFixed(1) : '0.0'} / 5</p>
                  <p className="mt-1 text-sm text-sage-600 dark:text-sage-200">{formatMoodLabel(weeklyReport.averageMood)}</p>
                </div>
                <div className="rounded-[1.5rem] border border-sage-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-sage-500 dark:text-sage-300">Hydration</p>
                  <p className="mt-2 text-2xl font-medium text-slate-900 dark:text-sage-50">{weeklyReport.averageWaterIntake.toFixed(1)}</p>
                  <p className="mt-1 text-sm text-sage-600 dark:text-sage-200">glasses per day</p>
                </div>
                <div className="rounded-[1.5rem] border border-sage-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-sage-500 dark:text-sage-300">Sleep</p>
                  <p className="mt-2 text-2xl font-medium text-slate-900 dark:text-sage-50">{weeklyReport.averageSleepHours.toFixed(1)}</p>
                  <p className="mt-1 text-sm text-sage-600 dark:text-sage-200">hours per night</p>
                </div>
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-sand-200 bg-sand-100/60 p-5 dark:border-white/10 dark:bg-[#101915]">
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-sage-500 dark:text-sage-300">Top Feelings</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {weeklyReport.topFeelings.length ? (
                    weeklyReport.topFeelings.map((item) => (
                      <span
                        key={item.feeling}
                        className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-4 py-2 text-sm font-medium text-sage-700 dark:border-white/10 dark:bg-white/10 dark:text-sage-100"
                      >
                        <span>{formatFeelingLabel(item.feeling)}</span>
                        <span className="rounded-full bg-sage-100 px-2 py-0.5 text-xs font-medium text-sage-700 dark:bg-white/10 dark:text-sage-100">{item.count}</span>
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

      <section className="panel-shell section-reveal mt-8" style={{ animationDelay: '540ms' }}>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-sage-500 dark:text-sage-300">Energy Pattern</p>
              <h2 className="compact-section-title mt-2 font-display text-sage-900 dark:text-sage-50">When your energy rises</h2>
            </div>
            <div className="rounded-full bg-sage-50 px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-sage-600 dark:bg-white/10 dark:text-sage-200">
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
                          <p className={clsx('text-xs font-medium uppercase tracking-[0.2em]', isDarkMode ? 'text-sage-300' : 'text-sage-500')}>{label}</p>
                          <p className={clsx('mt-2 text-lg font-medium', isDarkMode ? 'text-sage-50' : 'text-slate-900')}>Energy: {payload[0].value} / 10</p>
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
              <p className="mt-4 font-display text-2xl font-medium text-sage-800 dark:text-sage-50">No energy pattern yet</p>
              <p className="mt-2 max-w-md text-sm leading-6 text-sage-600 dark:text-sage-200">
                Once energy checkpoints are logged in your reflections, this chart will highlight where your most restorative hours tend to land.
              </p>
            </div>
          )}
      </section>

      <section className="section-reveal mt-8 rounded-[1.75rem] border border-sand-200 bg-sand-100/70 p-6 shadow-soft sm:p-8 dark:border-white/10 dark:bg-[#18231d]" style={{ animationDelay: '600ms' }}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-sage-500 dark:text-sage-300">Gentle Read</p>
            <h2 className="compact-section-title mt-2 font-display text-sage-900 dark:text-sage-50">What your data is quietly saying</h2>
            <p className="mt-3 text-sm leading-7 text-sage-700 dark:text-sage-200">
              {summary.totalEntries
                ? `${heroMessage} ${topEnergyWindow ? `Your strongest energy shows up near ${formatHourLabel(topEnergyWindow.hour)}.` : ''}`
                : 'This page is ready. A few reflections, self-care entries, and review check-ins will turn it into a clear picture of your habits.'}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex items-center justify-center gap-2 rounded-full bg-sage-700 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-sage-800 hover:shadow-lifted dark:bg-sage-500 dark:text-slate-950 dark:hover:bg-sage-400"
              to="/reflection"
            >
              <span className="material-symbols-outlined text-[18px]">edit_note</span>
              Add Reflection
            </Link>
            <Link
              className="inline-flex items-center justify-center gap-2 rounded-full border border-sage-200 bg-white px-6 py-3 text-sm font-medium text-sage-700 transition-all hover:bg-sage-50 dark:border-white/10 dark:bg-white/5 dark:text-sage-100 dark:hover:bg-white/10"
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
