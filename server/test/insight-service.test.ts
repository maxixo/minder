import assert from 'node:assert/strict';
import test from 'node:test';
import type { Entry } from '@prisma/client';
import {
  buildEntryInsightInput,
  buildHeuristicEntryInsight,
  buildHeuristicReflectionAssist,
  generateEntryInsight,
  generateReflectionAssist,
} from '../src/services/insightService.ts';

const createEntry = (overrides: Partial<Entry> = {}): Entry => ({
  id: '11111111-1111-1111-1111-111111111111',
  userId: '22222222-2222-2222-2222-222222222222',
  entryDate: new Date('2026-05-31T00:00:00.000Z'),
  weather: 'rainy',
  gratitude: ['A calm breakfast'],
  expectations: 'Handle work with more patience.',
  positiveNotes: ['Finished the hardest task'],
  whatMakesTodayGreat: 'Making time to walk after lunch.',
  goodThingsHappened: ['A friend checked in'],
  selfAssessmentNote: 'I was tense before meetings but settled later.',
  mood: 3,
  waterIntake: 5,
  sleepHours: 5.5,
  sleepQuality: 'fair',
  meals: { breakfast: true, lunch: true, dinner: false, snack: false },
  nutrition: {},
  energyLevels: [{ time: 9, energy: 4.5 }],
  tomorrowPlan: {},
  selfLove: 'Slow down before reacting.',
  gratitudeNote: 'The walk helped me reset.',
  feeling: 'overwhelmed',
  additionalFeelings: ['tired'],
  activities: {},
  mindThoughts: 'Work deadlines made me stressed and tired.',
  nextStep: 'Protect a quiet evening.',
  ratings: {},
  selfCareChecklist: {},
  emotionalGuidance: {
    whereAreYou: 'At home after work',
    howYoureFeeling: 'Stressed but calmer now',
    whatYoureThinking: 'I need better boundaries with meetings',
    copingMethod: 'Breathing exercises',
    feelingBeforeGo: 'More grounded',
  },
  selfCarePlanDays: {},
  priorities: ['Rest', 'Finish one important task'],
  todoList: [{ id: 'todo-1', text: 'Prepare tomorrow plan', completed: false }],
  focus: 'Rest and planning',
  mindfulnessNotes: 'Breathing helped me slow down.',
  todayNotes: ['Need better sleep'],
  completedSections: ['reflection'],
  createdAt: new Date('2026-05-31T01:00:00.000Z'),
  updatedAt: new Date('2026-05-31T01:30:00.000Z'),
  ...overrides,
});

test('buildEntryInsightInput creates a stable multi-section text payload', () => {
  const input = buildEntryInsightInput(createEntry());

  assert.match(input.text, /Date: 2026-05-31/);
  assert.match(input.text, /Expectations: Handle work with more patience\./);
  assert.match(input.text, /Todo items: Prepare tomorrow plan/);
  assert.match(input.text, /Emotional guidance - coping method: Breathing exercises/);
  assert.equal(input.textLength, input.text.length);
});

test('buildHeuristicEntryInsight extracts themes, anchors, and practical actions', () => {
  const insight = buildHeuristicEntryInsight(createEntry());

  assert.equal(typeof insight.summary, 'string');
  assert.equal(insight.summary.length > 0, true);
  assert.equal(insight.themes.includes('work'), true);
  assert.equal(insight.themes.includes('sleep'), true);
  assert.equal(insight.stressors.includes('workload pressure') || insight.stressors.includes('stress load'), true);
  assert.equal(insight.positiveAnchors.includes('A calm breakfast'), true);
  assert.equal(insight.suggestedActions.length > 0, true);
  assert.equal(insight.modelVersion, 'heuristic-v1');
});

test('generateEntryInsight skips very short entries', async () => {
  const originalMinTextLength = process.env.AI_MIN_TEXT_LENGTH;
  const originalEnabled = process.env.AI_INSIGHTS_ENABLED;
  const originalApiKey = process.env.AI_API_KEY;

  process.env.AI_MIN_TEXT_LENGTH = '500';
  process.env.AI_INSIGHTS_ENABLED = 'true';
  process.env.AI_API_KEY = '';

  try {
    const insight = await generateEntryInsight(createEntry({
      gratitude: [],
      expectations: 'Short note',
      positiveNotes: [],
      goodThingsHappened: [],
      mindThoughts: '',
      mindfulnessNotes: '',
      selfAssessmentNote: '',
      selfLove: '',
      gratitudeNote: '',
      priorities: [],
      todayNotes: [],
      todoList: [],
      emotionalGuidance: {},
    }));

    assert.equal(insight, null);
  } finally {
    process.env.AI_MIN_TEXT_LENGTH = originalMinTextLength;
    process.env.AI_INSIGHTS_ENABLED = originalEnabled;
    process.env.AI_API_KEY = originalApiKey;
  }
});

test('buildHeuristicEntryInsight flags crisis language when present', () => {
  const insight = buildHeuristicEntryInsight(createEntry({
    mindThoughts: 'I do not want to live like this and sometimes think about ending my life.',
    emotionalGuidance: {
      whereAreYou: 'Bedroom',
      howYoureFeeling: 'Hopeless',
      whatYoureThinking: 'Nothing matters',
      copingMethod: '',
      feelingBeforeGo: '',
    },
  }));

  assert.equal(insight.riskFlags.includes('self_harm_language'), true);
  assert.equal(insight.riskFlags.includes('hopelessness_language'), true);
});

test('buildHeuristicReflectionAssist fills the biggest missing reflection gap first', () => {
  const assist = buildHeuristicReflectionAssist({
    gratitude: [],
    expectations: '',
    positiveNotes: [],
    mindThoughts: 'Work has felt noisy all day.',
    mood: 2,
  }, 'stress-reset');

  assert.match(assist.suggestedPrompt, /small detail|steady|comforting/i);
  assert.match(assist.followUpQuestion, /pressure|smaller/i);
  assert.match(assist.encouragement, /plain details|enough/i);
  assert.equal(assist.preview, true);
});

test('generateReflectionAssist falls back to heuristic output when AI is unavailable', async () => {
  const originalEnabled = process.env.AI_INSIGHTS_ENABLED;
  const originalApiKey = process.env.AI_API_KEY;

  process.env.AI_INSIGHTS_ENABLED = 'true';
  process.env.AI_API_KEY = '';

  try {
    const assist = await generateReflectionAssist({
      gratitude: ['A quiet breakfast'],
      expectations: 'Stay calmer during work.',
      positiveNotes: [],
      mindThoughts: 'I feel pressure about deadlines.',
    }, 'stress-reset');

    assert.equal(typeof assist.suggestedPrompt, 'string');
    assert.equal(assist.suggestedPrompt.length > 0, true);
    assert.equal(assist.preview, true);
    assert.equal(assist.modelVersion, 'heuristic-reflection-assist-v1');
  } finally {
    process.env.AI_INSIGHTS_ENABLED = originalEnabled;
    process.env.AI_API_KEY = originalApiKey;
  }
});
