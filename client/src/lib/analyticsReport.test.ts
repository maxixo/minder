import { describe, expect, it } from 'vitest';
import { buildAnalyticsReport } from './analyticsReport';

describe('analytics report', () => {
  it('formats comparisons and behavior associations', () => {
    const report = buildAnalyticsReport({
      name: 'Mina',
      period: '30days',
      generatedAt: new Date('2026-06-10T12:00:00.000Z'),
      summary: {
        totalEntries: 12,
        currentStreak: 4,
        averageMood: 4.1,
        averageWaterIntake: 6.2,
        averageSleepHours: 7.4,
        completionRate: 78,
      },
      patternInsights: {
        period: '30days',
        ranges: {
          currentStart: '2026-05-12T00:00:00.000Z',
          previousStart: '2026-04-12T00:00:00.000Z',
          currentDays: 30,
        },
        comparisons: [{
          key: 'mood',
          label: 'Average mood',
          unit: '/ 5',
          current: 4.1,
          previous: 3.6,
          delta: 0.5,
          direction: 'up',
        }],
        behaviorInsights: [{
          id: 'fresh-air',
          label: 'days with time outside',
          shortLabel: 'Fresh air',
          icon: 'air',
          withAverage: 4.4,
          withoutAverage: 3.5,
          delta: 0.9,
          sampleSize: 10,
          supportingDays: 6,
          direction: 'higher',
        }],
        dataQuality: {
          currentEntries: 12,
          previousEntries: 9,
          moodDays: 10,
          hasComparison: true,
          hasBehaviorInsights: true,
        },
      },
      aiSummary: {
        period: '30days',
        narrative: 'Your recent entries show a steadier rhythm.',
        recurringThemes: [],
        commonStressors: [],
        positiveAnchors: [],
        suggestedFocusAreas: ['Protect rest'],
        languageShift: {
          direction: 'improving',
          explanation: 'Language became more hopeful.',
        },
      },
      themeTrends: {
        period: '30days',
        recurringThemes: [{ theme: 'rest', count: 4 }],
        commonStressors: [],
        positiveAnchors: [],
      },
    });

    expect(report).toContain('MindfulLife Monthly Wellness Report');
    expect(report).toContain('Average mood: 4.1 / 5 (+0.5 / 5 vs previous period)');
    expect(report).toContain('Fresh air: mood was 0.9 points higher');
    expect(report).toContain('Protect rest');
  });
});
