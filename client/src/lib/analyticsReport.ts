import { format } from 'date-fns';
import type { AiSummaryResponse, InsightPeriod, ThemeTrendResponse } from '@/types/ai';
import type { AnalyticsPatternInsights } from '@/types/analytics';

interface ReportSummary {
  totalEntries: number;
  currentStreak: number;
  averageMood: number;
  averageWaterIntake: number;
  averageSleepHours: number;
  completionRate: number;
}

interface AnalyticsReportInput {
  name: string;
  period: InsightPeriod;
  summary: ReportSummary;
  patternInsights: AnalyticsPatternInsights;
  aiSummary: AiSummaryResponse;
  themeTrends: ThemeTrendResponse;
  generatedAt?: Date;
}

const periodLabel: Record<InsightPeriod, string> = {
  '7days': '7-Day',
  '30days': 'Monthly',
  '90days': 'Quarterly',
  year: 'Annual',
};

const formatMetric = (value: number | null, unit: string) => {
  if (value == null) return 'Not enough data';
  if (unit === '%') return `${value}%`;
  return `${value} ${unit}`;
};

export const buildAnalyticsReport = ({
  name,
  period,
  summary,
  patternInsights,
  aiSummary,
  themeTrends,
  generatedAt = new Date(),
}: AnalyticsReportInput) => {
  const comparisonLines = patternInsights.comparisons.map((item) => {
    const delta = item.delta == null
      ? 'comparison unavailable'
      : `${item.delta > 0 ? '+' : ''}${item.delta} ${item.unit} vs previous period`;
    return `- ${item.label}: ${formatMetric(item.current, item.unit)} (${delta})`;
  });
  const behaviorLines = patternInsights.behaviorInsights.length
    ? patternInsights.behaviorInsights.map((item) => (
        `- ${item.shortLabel}: mood was ${Math.abs(item.delta).toFixed(1)} points ${item.direction} on ${item.label} (${item.supportingDays} supporting days).`
      ))
    : ['- More mood-rated entries are needed to compare behavior patterns.'];
  const themeLines = themeTrends.recurringThemes.length
    ? themeTrends.recurringThemes.map((item) => `- ${item.theme} (${item.count})`)
    : ['- No recurring themes surfaced in this period.'];

  return [
    `MindfulLife ${periodLabel[period]} Wellness Report`,
    `Prepared for ${name}`,
    `Generated ${format(generatedAt, 'MMMM d, yyyy, h:mm a')}`,
    '',
    'Snapshot',
    `- Reflections logged: ${summary.totalEntries}`,
    `- Current streak: ${summary.currentStreak} day${summary.currentStreak === 1 ? '' : 's'}`,
    `- Average mood: ${summary.averageMood ? `${summary.averageMood.toFixed(1)} / 5` : 'Not enough data'}`,
    `- Average sleep: ${summary.averageSleepHours ? `${summary.averageSleepHours.toFixed(1)} hours` : 'Not enough data'}`,
    `- Average hydration: ${summary.averageWaterIntake ? `${summary.averageWaterIntake.toFixed(1)} glasses` : 'Not enough data'}`,
    `- Completion rate: ${summary.completionRate}%`,
    '',
    'Period Comparison',
    ...comparisonLines,
    '',
    'Behavior Associations',
    ...behaviorLines,
    '',
    'Recurring Themes',
    ...themeLines,
    '',
    'Narrative Summary',
    aiSummary.narrative,
    '',
    'Suggested Focus',
    ...(aiSummary.suggestedFocusAreas.length
      ? aiSummary.suggestedFocusAreas.map((item) => `- ${item}`)
      : ['- Continue logging reflections to make suggestions more specific.']),
    '',
    'Note: behavior associations describe patterns in your entries, not proof that one behavior caused a mood change.',
  ].join('\n');
};

export const downloadAnalyticsReport = (content: string, period: InsightPeriod, generatedAt = new Date()) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `mindfullife-${periodLabel[period].toLowerCase()}-report-${format(generatedAt, 'yyyy-MM-dd')}.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
