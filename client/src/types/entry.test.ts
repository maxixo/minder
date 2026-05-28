import { describe, expect, it } from 'vitest';
import {
  createEmptyDailyEntry,
  mergeEntryPatch,
  normalizeDailyEntry,
  toDailyEntryRequest,
  withCompletedSection,
} from './entry';

describe('entry helpers', () => {
  it('merges nested entry patches without dropping sibling fields', () => {
    const entry = createEmptyDailyEntry('2026-05-27T00:00:00.000Z');
    const merged = mergeEntryPatch(entry, {
      meals: { breakfast: true },
      emotionalGuidance: { copingMethod: 'Walk outside' },
    });

    expect(merged.meals.breakfast).toBe(true);
    expect(merged.meals.lunch).toBe(false);
    expect(merged.emotionalGuidance.copingMethod).toBe('Walk outside');
    expect(merged.emotionalGuidance.whereAreYou).toBe('');
  });

  it('normalizes sparse entry payloads into the expected defaults', () => {
    const normalized = normalizeDailyEntry({
      date: '2026-05-27T00:00:00.000Z',
      gratitude: ['Fresh air'],
      selfCarePlanDays: { monday: true },
    });

    expect(normalized.gratitude).toEqual(['Fresh air']);
    expect(normalized.selfCarePlanDays).toEqual({ monday: true });
    expect(normalized.todoList).toEqual([]);
    expect(normalized.activities.music).toBe(0);
  });

  it('removes persistence-managed fields from entry requests', () => {
    const entry = createEmptyDailyEntry('2026-05-27T00:00:00.000Z');
    entry.id = 'entry-id';
    entry.userId = 'user-id';

    const request = toDailyEntryRequest(entry);

    expect(request).not.toHaveProperty('id');
    expect(request).not.toHaveProperty('userId');
    expect(request).not.toHaveProperty('createdAt');
    expect(request).not.toHaveProperty('updatedAt');
    expect(request.date).toBe('2026-05-27');
  });

  it('adds completed sections without duplicates', () => {
    expect(withCompletedSection(['reflection'], 'review')).toEqual(['reflection', 'review']);
    expect(withCompletedSection(['reflection'], 'reflection')).toEqual(['reflection']);
  });
});
