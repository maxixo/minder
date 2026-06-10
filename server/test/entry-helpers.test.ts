import assert from 'node:assert/strict';
import test from 'node:test';
import { validationResult } from 'express-validator';
import { ensureCustomSelfCareItemIds, ensureTodoItemIds, getCompletionPercentage } from '../src/lib/entry.ts';
import { entryPayloadValidators } from '../src/middleware/requestValidators.ts';
import { buildEntryPersistenceInput, serializeEntry, serializeUser } from '../src/lib/serializers.ts';

test('serializeUser returns nested preferences and omits passwordHash', () => {
  const user = serializeUser({
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: 'secret',
    theme: 'dark',
    dailyReminder: false,
    reminderTime: '09:30',
    weeklyReport: true,
    timezone: 'America/New_York',
    shareStats: true,
    lastReminderSentAt: new Date('2026-05-24T10:00:00.000Z'),
    createdAt: new Date('2026-05-20T08:00:00.000Z'),
    hasSeenDashboardWelcome: true,
  });

  assert.equal('passwordHash' in user, false);
  assert.equal(user.goal, null);
  assert.equal(user.cadence, null);
  assert.equal(user.createdAt, '2026-05-20T08:00:00.000Z');
  assert.equal(user.hasSeenDashboardWelcome, true);
  assert.deepEqual(user.preferences, {
    theme: 'dark',
    notifications: {
      dailyReminder: false,
      reminderTime: '09:30',
      weeklyReport: true,
      timezone: 'America/New_York',
      lastReminderSentAt: '2026-05-24T10:00:00.000Z',
    },
    privacy: {
      shareStats: true,
    },
  });
});

test('serializeEntry normalizes missing nested data and exposes id', () => {
  const entry = serializeEntry({
    id: 'entry-1',
    userId: 'user-1',
    entryDate: new Date('2026-05-24T00:00:00.000Z'),
    gratitude: ['Breathing room'],
    todoList: [{ text: 'Walk', completed: false }],
  });

  assert.equal(entry.id, 'entry-1');
  assert.equal(entry.userId, 'user-1');
  assert.equal(Array.isArray(entry.todoList), true);
  assert.equal(typeof entry.todoList[0].id, 'string');
  assert.deepEqual(entry.meals, {
    breakfast: false,
    lunch: false,
    dinner: false,
    snack: false,
  });
});

test('buildEntryPersistenceInput preserves todo ids and normalizes date-backed payloads', () => {
  const input = buildEntryPersistenceInput({
    id: 'entry-1',
    date: '2026-05-24T14:30:00.000Z',
    todoList: [{ id: 'task-1', text: 'Stretch', completed: true }],
    gratitude: ['Rest'],
    mood: 4,
  });

  assert.equal(input.entryDate.toISOString(), '2026-05-24T00:00:00.000Z');
  assert.deepEqual(input.todoList, [{ id: 'task-1', text: 'Stretch', completed: true }]);
  assert.equal(input.mood, 4);
});

test('ensureTodoItemIds generates ids and completion percentage matches legacy formula', () => {
  const todoList = ensureTodoItemIds([{ text: 'Journal', completed: false }]);
  assert.equal(typeof todoList[0].id, 'string');

  const completion = getCompletionPercentage({
    gratitude: ['Sunlight'],
    mood: 4,
    waterIntake: 6,
    selfLove: 'Be gentler',
    feeling: 'happy',
    ratings: { overall: 5 },
    emotionalGuidance: { whereAreYou: 'At home' },
    priorities: ['Sleep'],
  });

  assert.equal(completion, 100);
});

test('ensureCustomSelfCareItemIds normalizes persisted custom checklist items', () => {
  const items = ensureCustomSelfCareItemIds([
    { text: 'Take medication', completed: true },
    { id: 'custom-2', text: 'Use the heating pad', completed: false },
    { id: 'empty', text: '   ', completed: true },
  ]);

  assert.equal(items.length, 2);
  assert.equal(typeof items[0].id, 'string');
  assert.deepEqual(items[1], {
    id: 'custom-2',
    text: 'Use the heating pad',
    completed: false,
  });
});

test('entry payload validators allow decimal energy levels from the reflection graph', async () => {
  const req = {
    body: {
      date: '2026-05-24',
      energyLevels: [
        { time: 9, energy: 6.4 },
        { time: 15, energy: 4.8 },
      ],
    },
  } as any;

  for (const validator of entryPayloadValidators) {
    await validator.run(req);
  }

  const result = validationResult(req);
  assert.equal(result.isEmpty(), true, JSON.stringify(result.array()));
});
