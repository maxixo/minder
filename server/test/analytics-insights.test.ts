import assert from 'node:assert/strict';
import test from 'node:test';
import { createEmptyEntry } from '../src/lib/entry.ts';
import { buildAnalyticsPatternInsights } from '../src/lib/analyticsInsights.ts';

const makeEntry = (date: string, mood: number, patch: Record<string, any> = {}) => ({
  ...createEmptyEntry(`${date}T00:00:00.000Z`),
  mood,
  ...patch,
});

test('buildAnalyticsPatternInsights compares adjacent periods', () => {
  const entries = [
    makeEntry('2026-06-10', 5, { waterIntake: 8, sleepHours: 8 }),
    makeEntry('2026-06-09', 4, { waterIntake: 6, sleepHours: 7 }),
    makeEntry('2026-06-03', 3, { waterIntake: 4, sleepHours: 6 }),
    makeEntry('2026-06-02', 2, { waterIntake: 2, sleepHours: 5 }),
  ];

  const result = buildAnalyticsPatternInsights(entries, '7days', new Date('2026-06-10T12:00:00.000Z'));
  const mood = result.comparisons.find((item) => item.key === 'mood');

  assert.equal(result.dataQuality.currentEntries, 2);
  assert.equal(result.dataQuality.previousEntries, 2);
  assert.equal(mood?.current, 4.5);
  assert.equal(mood?.previous, 2.5);
  assert.equal(mood?.delta, 2);
});

test('buildAnalyticsPatternInsights requires both behavior cohorts', () => {
  const entries = [
    makeEntry('2026-06-10', 5, {
      selfCareChecklist: { ...createEmptyEntry().selfCareChecklist, gotFreshAir: true },
    }),
    makeEntry('2026-06-09', 4, {
      selfCareChecklist: { ...createEmptyEntry().selfCareChecklist, gotFreshAir: true },
    }),
    makeEntry('2026-06-08', 3),
    makeEntry('2026-06-07', 2),
  ];

  const result = buildAnalyticsPatternInsights(entries, '7days', new Date('2026-06-10T12:00:00.000Z'));
  const freshAir = result.behaviorInsights.find((item) => item.id === 'fresh-air');

  assert.equal(freshAir?.withAverage, 4.5);
  assert.equal(freshAir?.withoutAverage, 2.5);
  assert.equal(freshAir?.delta, 2);
});
