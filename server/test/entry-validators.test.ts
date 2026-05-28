import assert from 'node:assert/strict';
import test from 'node:test';
import { validationResult, type ValidationChain } from 'express-validator';
import {
  entryCollectionValidators,
  entryDateParamValidator,
  entryIdParamValidator,
  entryPayloadValidators,
  recentEntriesValidators,
} from '../src/middleware/requestValidators.ts';

const runValidators = async (
  validators: ValidationChain[],
  req: { body?: Record<string, unknown>; params?: Record<string, unknown>; query?: Record<string, unknown> },
) => {
  const request = {
    body: req.body || {},
    params: req.params || {},
    query: req.query || {},
  } as any;

  for (const validator of validators) {
    await validator.run(request);
  }

  return validationResult(request);
};

test('entry payload validators accept a full entry payload', async () => {
  const result = await runValidators(entryPayloadValidators, {
    body: {
      date: '2026-05-24',
      weather: 'partly_cloudy',
      gratitude: ['Fresh air', 'Time to think'],
      expectations: 'Stay steady through the afternoon.',
      positiveNotes: ['Completed the hard task first'],
      whatMakesTodayGreat: 'A slow walk after lunch.',
      goodThingsHappened: ['Had a good conversation'],
      selfAssessmentNote: 'A little tired but focused.',
      mood: 4,
      waterIntake: 7,
      sleepHours: 7.5,
      sleepQuality: 'great',
      meals: {
        breakfast: true,
        lunch: true,
        dinner: false,
        snack: true,
      },
      nutrition: {
        calories: 1900,
        protein: 120,
        carbs: 180,
        fat: 65,
      },
      energyLevels: [
        { time: 9, energy: 6.4 },
        { time: 15, energy: 4.8 },
      ],
      tomorrowPlan: {
        howToMakeBetter: 'Protect one deep work block.',
        expectations: 'Start earlier.',
      },
      selfLove: 'Take breaks before burnout.',
      gratitudeNote: 'The day felt manageable.',
      feeling: 'relaxed',
      additionalFeelings: ['happy', 'tired'],
      activities: {
        reading: 2,
        music: 1,
        mindfulness: 1,
      },
      mindThoughts: 'Need less context switching.',
      nextStep: 'Close the laptop on time.',
      ratings: {
        selfTalk: 4,
        energyPoint: 3,
        overall: 4,
      },
      selfCareChecklist: {
        ateBreakfast: true,
        ateLunch: true,
        ateDinner: false,
        slept7to9Hours: true,
        tookNap: false,
        watchedMovie: false,
        gotFreshAir: true,
        exercised: false,
        calledFriend: true,
        journaled: true,
        drankWater: true,
      },
      emotionalGuidance: {
        whereAreYou: 'At home and a bit scattered.',
        howYoureFeeling: 'Mostly calm.',
        whatYoureThinking: 'Trying to simplify the evening.',
        copingMethod: 'Deep Breathing',
        feelingBeforeGo: 'Lighter than before.',
      },
      selfCarePlanDays: {
        mon: true,
        wed: true,
        sun: false,
      },
      priorities: ['Sleep', 'Stretch'],
      todoList: [
        { id: 'task-1', text: 'Walk for 15 minutes', completed: false },
        { text: 'Prep breakfast', completed: true },
      ],
      focus: 'Reduce noise.',
      mindfulnessNotes: 'Breathing helped more than expected.',
      todayNotes: ['Pause before reacting.', 'Eat before the late meeting.'],
      completedSections: ['reflection', 'selfcare', 'emotional', 'review'],
    },
  });

  assert.equal(result.isEmpty(), true, JSON.stringify(result.array()));
});

test('entry payload validators accept payloads from each entry screen', async () => {
  const payloads = [
    {
      date: '2026-05-24',
      gratitude: ['Morning quiet'],
      expectations: 'Finish one important task.',
      positiveNotes: ['Drank water'],
      weather: 'sunny',
      mood: 5,
      waterIntake: 4,
      sleepHours: 6.5,
      meals: {
        breakfast: true,
        lunch: false,
        dinner: true,
      },
      energyLevels: [
        { time: 8, energy: 7.2 },
        { time: 13, energy: 5.6 },
      ],
    },
    {
      date: '2026-05-24',
      feeling: 'happy',
      activities: {
        reading: 1,
        music: 2,
        mindfulness: 1,
      },
      mindThoughts: 'Less rushed than yesterday.',
      ratings: {
        selfTalk: 4,
        energyPoint: 3,
        overall: 4,
      },
      selfCareChecklist: {
        ateBreakfast: true,
        ateLunch: true,
        ateDinner: true,
        slept7to9Hours: true,
        gotFreshAir: false,
        exercised: true,
        drankWater: true,
      },
    },
    {
      date: '2026-05-24',
      emotionalGuidance: {
        whereAreYou: 'In my room.',
        howYoureFeeling: 'A bit tense.',
        whatYoureThinking: 'Need a reset.',
        copingMethod: 'Short Walk',
      },
      selfCarePlanDays: {
        mon: true,
        tue: false,
        wed: true,
      },
      todayNotes: ['Go outside for ten minutes.'],
    },
    {
      date: '2026-05-24',
      focus: 'Protect calm.',
      priorities: ['Stretch', 'Plan tomorrow'],
      todoList: [
        { text: 'Set out clothes', completed: false },
        { id: 'task-2', text: 'Journal for five minutes', completed: true },
      ],
      mindfulnessNotes: 'Evening felt steadier than expected.',
    },
  ];

  for (const payload of payloads) {
    const result = await runValidators(entryPayloadValidators, { body: payload });
    assert.equal(result.isEmpty(), true, JSON.stringify(result.array()));
  }
});

test('entry payload validators reject unsupported enum values', async () => {
  const invalidPayloads = [
    {
      body: { date: '2026-05-24', weather: 'windy' },
      expectedMessage: 'weather must be one of',
    },
    {
      body: { date: '2026-05-24', sleepQuality: 'legendary' },
      expectedMessage: 'sleepQuality must be one of',
    },
    {
      body: { date: '2026-05-24', feeling: 'calm' },
      expectedMessage: 'feeling must be one of',
    },
    {
      body: { date: '2026-05-24', additionalFeelings: ['happy', 'calm'] },
      expectedMessage: 'additionalFeelings[1] must be one of',
    },
  ];

  for (const { body, expectedMessage } of invalidPayloads) {
    const result = await runValidators(entryPayloadValidators, { body });
    assert.equal(result.isEmpty(), false);
    const messages = result.array().map((item) => String(item.msg));
    assert.equal(messages.some((message) => message.includes(expectedMessage)), true, JSON.stringify(messages));
  }
});

test('entry route validators accept valid params and reject malformed ones', async () => {
  const validCollection = await runValidators(entryCollectionValidators, {
    query: {
      page: '2',
      limit: '20',
      startDate: '2026-05-01',
      endDate: '2026-05-31',
    },
  });
  assert.equal(validCollection.isEmpty(), true, JSON.stringify(validCollection.array()));

  const invalidCollection = await runValidators(entryCollectionValidators, {
    query: {
      page: '0',
      limit: '200',
      startDate: '2026/05/01',
      endDate: '2026-5-31',
    },
  });
  assert.equal(invalidCollection.isEmpty(), false);

  const validRecent = await runValidators(recentEntriesValidators, {
    query: {
      days: '30',
    },
  });
  assert.equal(validRecent.isEmpty(), true, JSON.stringify(validRecent.array()));

  const invalidRecent = await runValidators(recentEntriesValidators, {
    query: {
      days: '400',
    },
  });
  assert.equal(invalidRecent.isEmpty(), false);

  const validId = await runValidators(entryIdParamValidator, {
    params: {
      id: '550e8400-e29b-41d4-a716-446655440000',
    },
  });
  assert.equal(validId.isEmpty(), true, JSON.stringify(validId.array()));

  const invalidId = await runValidators(entryIdParamValidator, {
    params: {
      id: 'not-a-uuid',
    },
  });
  assert.equal(invalidId.isEmpty(), false);

  const validDate = await runValidators(entryDateParamValidator, {
    params: {
      date: '2026-05-24',
    },
  });
  assert.equal(validDate.isEmpty(), true, JSON.stringify(validDate.array()));

  const invalidDate = await runValidators(entryDateParamValidator, {
    params: {
      date: '05/24/2026',
    },
  });
  assert.equal(invalidDate.isEmpty(), false);
});
