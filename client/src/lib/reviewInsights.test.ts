import { describe, expect, it } from 'vitest';
import { createEmptyDailyEntry } from '@/types/entry';
import {
  buildCarryForwardSuggestions,
  buildDailyScorecard,
  buildWeeklyReview,
  extractCarryForwardItems,
  replaceCarryForwardBlock,
} from './reviewInsights';

const makeEntry = (date: string) => createEmptyDailyEntry(`${date}T00:00:00.000Z`);

describe('review insights', () => {
  it('builds a daily scorecard from saved tasks and practices', () => {
    const entry = makeEntry('2026-06-10');
    entry.todoList = [
      { text: 'Finish report', completed: true },
      { text: 'Take a walk', completed: false },
    ];
    entry.completedSections = ['reflection', 'selfcare'];
    entry.selfCareChecklist.drankWater = true;
    entry.selfCareChecklist.gotFreshAir = true;
    entry.mindfulnessNotes = 'I protected my attention better today.';

    const scorecard = buildDailyScorecard(entry);

    expect(scorecard.completedTasks).toBe(1);
    expect(scorecard.taskCompletion).toBe(50);
    expect(scorecard.completedPractices).toBe(2);
    expect(scorecard.selfCareActions).toBe(2);
    expect(scorecard.closureScore).toBeGreaterThan(0);
  });

  it('suggests unfinished work without duplicating similar priorities', () => {
    const entry = makeEntry('2026-06-10');
    entry.todoList = [
      { id: 'one', text: 'Plan the launch', completed: false },
      { id: 'two', text: 'Reply to Sam', completed: true },
    ];
    entry.priorities = ['Plan the launch', 'Take a walk'];

    const suggestions = buildCarryForwardSuggestions(entry);

    expect(suggestions.map((item) => item.text)).toEqual(['Plan the launch', 'Take a walk']);
  });

  it('replaces only the carry-forward block in tomorrow plan text', () => {
    const original = 'Start with a calm morning.';
    const updated = replaceCarryForwardBlock(original, ['Plan the launch', 'Take a walk']);
    const replaced = replaceCarryForwardBlock(updated, ['Take a walk']);

    expect(replaced).toContain(original);
    expect(extractCarryForwardItems(replaced)).toEqual(['Take a walk']);
    expect(replaced).not.toContain('Plan the launch');
  });

  it('generates a seven-day review from entry history', () => {
    const first = makeEntry('2026-06-08');
    first.todoList = [
      { text: 'Prepare slides', completed: true },
      { text: 'Book appointment', completed: false },
    ];
    first.mood = 4;
    first.completedSections = ['review'];

    const second = makeEntry('2026-06-10');
    second.todoList = [{ text: 'Book appointment', completed: false }];
    second.mood = 2;
    second.ratings.energyPoint = 3;

    const old = makeEntry('2026-05-20');
    old.todoList = [{ text: 'Old task', completed: true }];

    const review = buildWeeklyReview([first, second, old], new Date(2026, 5, 10));

    expect(review.daysLogged).toBe(2);
    expect(review.closureDays).toBe(1);
    expect(review.completedTasks).toBe(1);
    expect(review.totalTasks).toBe(3);
    expect(review.averageMood).toBe(3);
    expect(review.recurringUnfinished).toContain('Book appointment');
  });
});
