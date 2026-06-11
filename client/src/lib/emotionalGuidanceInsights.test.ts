import { describe, expect, it } from 'vitest';
import { createEmptyDailyEntry } from '@/types/entry';
import {
  buildCopingPatterns,
  buildRecurringTriggers,
  buildReassuranceSummary,
  buildSavedCopingPlans,
  findPriorCopingRecall,
} from './emotionalGuidanceInsights';

const makeEmotionalEntry = (
  date: string,
  {
    closing = '',
    coping = '',
    feelings = '',
    mood = null,
    thoughts = '',
    where = '',
  }: {
    closing?: string;
    coping?: string;
    feelings?: string;
    mood?: number | null;
    thoughts?: string;
    where?: string;
  } = {},
) => {
  const entry = createEmptyDailyEntry(`${date}T12:00:00.000Z`);
  entry.completedSections = ['emotional'];
  entry.mood = mood;
  entry.emotionalGuidance = {
    whereAreYou: where,
    howYoureFeeling: feelings,
    whatYoureThinking: thoughts,
    copingMethod: coping,
    feelingBeforeGo: closing,
  };
  return entry;
};

describe('emotional guidance insights', () => {
  it('groups repeated coping plans and calculates their mood history', () => {
    const entries = [
      makeEmotionalEntry('2026-06-10', { coping: 'Deep Breathing, Short Walk', mood: 4 }),
      makeEmotionalEntry('2026-06-08', { coping: 'Deep Breathing, Short Walk', mood: 2 }),
      makeEmotionalEntry('2026-06-06', { coping: 'Journaling', mood: 3 }),
    ];

    const plans = buildSavedCopingPlans(entries);

    expect(plans[0].strategies).toEqual(['Deep Breathing', 'Short Walk']);
    expect(plans[0].uses).toBe(2);
    expect(plans[0].averageMood).toBe(3);
  });

  it('recalls a prior coping plan with themes similar to the current check-in', () => {
    const entries = [
      makeEmotionalEntry('2026-06-09', {
        coping: 'Listen to Music',
        feelings: 'Lonely after a quiet day',
        closing: 'I felt less alone.',
      }),
      makeEmotionalEntry('2026-06-05', {
        coping: 'Deep Breathing, Short Walk',
        thoughts: 'The work deadline and client meeting feel like too much.',
        closing: 'The pressure felt more manageable.',
      }),
    ];

    const recall = findPriorCopingRecall(entries, '2026-06-11', {
      thoughts: 'I am overwhelmed by a work deadline.',
    });

    expect(recall?.strategies).toEqual(['Deep Breathing', 'Short Walk']);
    expect(recall?.matchingThemes).toContain('Work or deadline pressure');
  });

  it('falls back to the most recent coping plan before the current check-in has context', () => {
    const entries = [
      makeEmotionalEntry('2026-06-10', {
        coping: 'Short Walk',
      }),
      makeEmotionalEntry('2026-06-05', {
        coping: 'Deep Breathing',
        closing: 'I felt calmer.',
      }),
    ];

    const recall = findPriorCopingRecall(entries, '2026-06-11', {});

    expect(recall?.strategies).toEqual(['Short Walk']);
  });

  it('reports only emotional trigger themes repeated across check-ins', () => {
    const entries = [
      makeEmotionalEntry('2026-06-10', { thoughts: 'A work deadline is making me anxious.' }),
      makeEmotionalEntry('2026-06-08', { thoughts: 'Too many work meetings and project deadlines.' }),
      makeEmotionalEntry('2026-06-06', { thoughts: 'I feel lonely tonight.' }),
    ];

    const triggers = buildRecurringTriggers(entries);

    expect(triggers).toEqual([
      expect.objectContaining({ id: 'work-pressure', count: 2 }),
    ]);
  });

  it('builds per-strategy history and a reassurance summary after saving', () => {
    const prior = makeEmotionalEntry('2026-06-08', {
      coping: 'Deep Breathing',
      mood: 3,
    });
    const current = makeEmotionalEntry('2026-06-11', {
      coping: 'Deep Breathing',
      closing: 'My shoulders feel less tense.',
      mood: 4,
    });

    const patterns = buildCopingPatterns([current, prior]);
    const reassurance = buildReassuranceSummary(current, [current, prior]);

    expect(patterns[0]).toEqual(expect.objectContaining({
      strategy: 'Deep Breathing',
      uses: 2,
      moodSamples: 2,
      averageMood: 3.5,
    }));
    expect(reassurance.title).toContain('closing note');
    expect(reassurance.message).toContain('less tense');
  });
});
