import type { InsightPeriod } from './ai';

export interface AnalyticsComparison {
  key: 'mood' | 'sleep' | 'hydration' | 'completion';
  label: string;
  unit: string;
  current: number | null;
  previous: number | null;
  delta: number | null;
  direction: 'up' | 'down' | 'steady' | 'insufficient_data';
}

export interface BehaviorInsight {
  id: string;
  label: string;
  shortLabel: string;
  icon: string;
  withAverage: number;
  withoutAverage: number;
  delta: number;
  sampleSize: number;
  supportingDays: number;
  direction: 'higher' | 'lower' | 'steady';
}

export interface AnalyticsPatternInsights {
  period: InsightPeriod;
  ranges: {
    currentStart: string;
    previousStart: string;
    currentDays: number;
  };
  comparisons: AnalyticsComparison[];
  behaviorInsights: BehaviorInsight[];
  dataQuality: {
    currentEntries: number;
    previousEntries: number;
    moodDays: number;
    hasComparison: boolean;
    hasBehaviorInsights: boolean;
  };
}
