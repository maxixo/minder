import { subDays } from 'date-fns';
import type { Entry, EntryInsight, Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { parseEntryDateInput } from '../lib/date.js';
import { serializeEntry } from '../lib/serializers.js';

export type InsightPeriod = '7days' | '30days' | '90days' | 'year';

export interface EntryInsightResponse {
  entryId: string;
  summary: string;
  sentimentScore: number | null;
  dominantEmotions: string[];
  themes: string[];
  stressors: string[];
  positiveAnchors: string[];
  suggestedActions: string[];
  riskFlags: string[];
  modelVersion: string;
  generatedAt: string;
}

export interface AiSummaryResponse {
  period: InsightPeriod;
  narrative: string;
  recurringThemes: Array<{ theme: string; count: number }>;
  commonStressors: Array<{ label: string; count: number }>;
  positiveAnchors: Array<{ label: string; count: number }>;
  suggestedFocusAreas: string[];
  languageShift: {
    direction: 'improving' | 'steady' | 'declining' | 'insufficient_data';
    explanation: string;
  };
}

export interface ThemeTrendResponse {
  period: InsightPeriod;
  recurringThemes: Array<{ theme: string; count: number }>;
  commonStressors: Array<{ label: string; count: number }>;
  positiveAnchors: Array<{ label: string; count: number }>;
}

interface InsightPayload {
  summary: string;
  sentimentScore: number | null;
  dominantEmotions: string[];
  themes: string[];
  stressors: string[];
  positiveAnchors: string[];
  suggestedActions: string[];
  riskFlags: string[];
  modelVersion: string;
  generatedAt: Date;
}

interface AiConfig {
  enabled: boolean;
  provider: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  minTextLength: number;
}

interface ProviderMessageContent {
  content?: string | Array<{ type?: string; text?: string }>;
}

const PERIOD_DAYS: Record<InsightPeriod, number> = {
  '7days': 7,
  '30days': 30,
  '90days': 90,
  'year': 365,
};

const SUMMARY_LIMIT = 280;
const MAX_LIST_ITEMS = 5;

const emotionKeywords: Array<{ label: string; patterns: RegExp[] }> = [
  { label: 'calm', patterns: [/\bcalm\b/i, /\bpeace/i, /\bgrounded\b/i, /\bsteady\b/i] },
  { label: 'stress', patterns: [/\bstress/i, /\boverwhelm/i, /\banxious/i, /\btense\b/i] },
  { label: 'sadness', patterns: [/\bsad/i, /\bdown\b/i, /\blow\b/i, /\bheavy\b/i] },
  { label: 'gratitude', patterns: [/\bgrateful\b/i, /\bgratitude\b/i, /\bthankful\b/i, /\bappreciat/i] },
  { label: 'hope', patterns: [/\bhope/i, /\boptim/i, /\bencourag/i, /\bbetter\b/i] },
  { label: 'fatigue', patterns: [/\btired\b/i, /\bexhaust/i, /\bdrain/i, /\bfatig/i] },
  { label: 'joy', patterns: [/\bhappy\b/i, /\bjoy/i, /\bexcited\b/i, /\bdelight/i] },
];

const themeRules: Array<{ label: string; patterns: RegExp[] }> = [
  { label: 'work', patterns: [/\bwork\b/i, /\bmeeting/i, /\bdeadline/i, /\bjob\b/i, /\bcareer\b/i] },
  { label: 'sleep', patterns: [/\bsleep/i, /\brest\b/i, /\binsomnia\b/i, /\btired\b/i] },
  { label: 'stress', patterns: [/\bstress/i, /\boverwhelm/i, /\bpressure\b/i, /\banxious/i] },
  { label: 'gratitude', patterns: [/\bgratitude\b/i, /\bgrateful\b/i, /\bthankful\b/i, /\bappreciat/i] },
  { label: 'relationships', patterns: [/\bfriend/i, /\bpartner\b/i, /\bfamily\b/i, /\brelationship/i, /\bteam\b/i] },
  { label: 'mindfulness', patterns: [/\bmindful/i, /\bbreath/i, /\bmeditat/i, /\bjournal/i, /\bpresent\b/i] },
  { label: 'health', patterns: [/\bhealth/i, /\bexercise\b/i, /\bwalk\b/i, /\bwater\b/i, /\bmeal/i] },
  { label: 'planning', patterns: [/\bplan/i, /\bpriorit/i, /\btask/i, /\btodo\b/i, /\bfocus\b/i] },
  { label: 'self-care', patterns: [/\bself.?care/i, /\brest\b/i, /\bnap\b/i, /\bbreak\b/i, /\bgentle\b/i] },
];

const crisisPatterns: Array<{ flag: string; pattern: RegExp }> = [
  { flag: 'self_harm_language', pattern: /\b(self harm|hurt myself|kill myself|suicid|end(?:ing)? my life|don'?t want to live)\b/i },
  { flag: 'hopelessness_language', pattern: /\b(no point|hopeless|nothing matters|can'?t go on)\b/i },
];

const stressorRules: Array<{ label: string; patterns: RegExp[] }> = [
  { label: 'workload pressure', patterns: [/\bdeadline/i, /\bmeeting/i, /\bworkload/i, /\btoo much work\b/i] },
  { label: 'sleep disruption', patterns: [/\binsomnia\b/i, /\bbad sleep\b/i, /\bpoor sleep\b/i, /\btired\b/i] },
  { label: 'emotional overload', patterns: [/\boverwhelm/i, /\bstress/i, /\banxious/i, /\bpanic\b/i] },
  { label: 'relationship tension', patterns: [/\bargument\b/i, /\bconflict\b/i, /\bfight\b/i, /\blonely\b/i] },
  { label: 'time pressure', patterns: [/\brushed\b/i, /\bbehind\b/i, /\bno time\b/i, /\bbusy\b/i] },
];

const getAiConfig = (): AiConfig => ({
  enabled: process.env.AI_INSIGHTS_ENABLED !== 'false',
  provider: (process.env.AI_PROVIDER || 'openai').trim().toLowerCase(),
  apiKey: (process.env.AI_API_KEY || '').trim(),
  baseUrl: (process.env.AI_BASE_URL || 'https://api.openai.com/v1').trim().replace(/\/$/, ''),
  model: (process.env.AI_MODEL || 'gpt-4o-mini').trim(),
  minTextLength: Math.max(0, Number.parseInt(process.env.AI_MIN_TEXT_LENGTH || '120', 10) || 120),
});

const takeUnique = (items: string[], limit = MAX_LIST_ITEMS) => (
  Array.from(new Set(items.map((item) => item.trim()).filter(Boolean))).slice(0, limit)
);

const asStringArray = (value: unknown) => (
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
    : []
);

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const isMissingEntryInsightsTableError = (error: unknown) => {
  if (!error || typeof error !== 'object') return false;

  const candidate = error as { code?: string; message?: string };
  return candidate.code === 'P2021' || /entry_insights/i.test(candidate.message || '');
};

const truncate = (value: string, maxLength: number) => (
  value.length <= maxLength ? value : `${value.slice(0, maxLength - 3).trimEnd()}...`
);

const addLine = (lines: string[], label: string, value: unknown) => {
  if (value == null || typeof value !== 'string') return;
  const trimmed = value.trim();
  if (!trimmed) return;
  lines.push(`${label}: ${trimmed}`);
};

const addList = (lines: string[], label: string, value: unknown) => {
  if (!Array.isArray(value)) return;

  const items = value
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (item && typeof item === 'object' && typeof (item as Record<string, unknown>).text === 'string') {
        return String((item as Record<string, unknown>).text).trim();
      }
      return '';
    })
    .filter(Boolean);

  if (!items.length) return;
  lines.push(`${label}: ${items.join('; ')}`);
};

const extractMessageText = (content: ProviderMessageContent['content']) => {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';

  return content
    .map((part) => (part?.type === 'text' || typeof part?.text === 'string' ? part?.text || '' : ''))
    .join('\n')
    .trim();
};

const normalizeInsightPayload = (payload: Partial<InsightPayload>, fallbackVersion: string): InsightPayload => ({
  summary: truncate(
    String(payload.summary || 'Your journal entry captures a few meaningful signals, but there is not enough detail for a richer summary.'),
    SUMMARY_LIMIT
  ),
  sentimentScore: typeof payload.sentimentScore === 'number' ? clamp(Number(payload.sentimentScore.toFixed(2)), -1, 1) : null,
  dominantEmotions: takeUnique(asStringArray(payload.dominantEmotions)),
  themes: takeUnique(asStringArray(payload.themes)),
  stressors: takeUnique(asStringArray(payload.stressors)),
  positiveAnchors: takeUnique(asStringArray(payload.positiveAnchors)),
  suggestedActions: takeUnique(asStringArray(payload.suggestedActions), 3),
  riskFlags: takeUnique(asStringArray(payload.riskFlags), 3),
  modelVersion: String(payload.modelVersion || fallbackVersion),
  generatedAt: payload.generatedAt instanceof Date ? payload.generatedAt : new Date(),
});

const summarizeCounts = (items: string[], key: 'theme' | 'label') => {
  const counts = new Map<string, number>();

  items.forEach((item) => {
    const normalized = item.trim();
    if (!normalized) return;
    counts.set(normalized, (counts.get(normalized) || 0) + 1);
  });

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, MAX_LIST_ITEMS)
    .map(([label, count]) => (key === 'theme' ? { theme: label, count } : { label, count }));
};

const getSourceText = (entry: Entry) => buildEntryInsightInput(entry).text;

export const buildEntryInsightInput = (entry: Entry) => {
  const normalizedEntry = serializeEntry(entry);
  const lines: string[] = [
    `Date: ${normalizedEntry.date?.slice(0, 10) || 'unknown'}`,
    `Mood: ${normalizedEntry.mood ?? 'unknown'}`,
    `Sleep hours: ${normalizedEntry.sleepHours ?? 'unknown'}`,
    `Water intake: ${normalizedEntry.waterIntake ?? 'unknown'}`,
    `Weather: ${normalizedEntry.weather || 'unknown'}`,
    `Primary feeling: ${normalizedEntry.feeling || 'unknown'}`,
  ];

  addList(lines, 'Gratitude', normalizedEntry.gratitude);
  addLine(lines, 'Expectations', normalizedEntry.expectations);
  addList(lines, 'Positive notes', normalizedEntry.positiveNotes);
  addLine(lines, 'What makes today great', normalizedEntry.whatMakesTodayGreat);
  addList(lines, 'Good things happened', normalizedEntry.goodThingsHappened);
  addLine(lines, 'Self assessment', normalizedEntry.selfAssessmentNote);
  addLine(lines, 'Self love', normalizedEntry.selfLove);
  addLine(lines, 'Gratitude note', normalizedEntry.gratitudeNote);
  addLine(lines, 'Mind thoughts', normalizedEntry.mindThoughts);
  addLine(lines, 'Next step', normalizedEntry.nextStep);
  addLine(lines, 'Focus', normalizedEntry.focus);
  addLine(lines, 'Mindfulness notes', normalizedEntry.mindfulnessNotes);
  addList(lines, 'Additional feelings', normalizedEntry.additionalFeelings);
  addList(lines, 'Priorities', normalizedEntry.priorities);
  addList(lines, 'Today notes', normalizedEntry.todayNotes);
  addList(lines, 'Todo items', normalizedEntry.todoList);
  addLine(lines, 'Emotional guidance - where are you', normalizedEntry.emotionalGuidance?.whereAreYou);
  addLine(lines, 'Emotional guidance - feeling', normalizedEntry.emotionalGuidance?.howYoureFeeling);
  addLine(lines, 'Emotional guidance - thinking', normalizedEntry.emotionalGuidance?.whatYoureThinking);
  addLine(lines, 'Emotional guidance - coping method', normalizedEntry.emotionalGuidance?.copingMethod);
  addLine(lines, 'Emotional guidance - before you go', normalizedEntry.emotionalGuidance?.feelingBeforeGo);

  const text = lines.join('\n').trim();

  return {
    text,
    normalizedEntry,
    textLength: text.length,
  };
};

export const buildHeuristicEntryInsight = (entry: Entry): InsightPayload => {
  const { text, normalizedEntry } = buildEntryInsightInput(entry);
  const lowerText = text.toLowerCase();
  const riskFlags = takeUnique(crisisPatterns.filter(({ pattern }) => pattern.test(text)).map(({ flag }) => flag), 3);

  const dominantEmotions = takeUnique([
    normalizedEntry.feeling || '',
    ...(normalizedEntry.additionalFeelings || []),
    ...emotionKeywords
      .filter(({ patterns }) => patterns.some((pattern) => pattern.test(text)))
      .map(({ label }) => label),
  ]);

  const themes = takeUnique(themeRules
    .filter(({ patterns }) => patterns.some((pattern) => pattern.test(text)))
    .map(({ label }) => label));

  const positiveAnchors = takeUnique([
    ...(normalizedEntry.gratitude || []),
    ...(normalizedEntry.positiveNotes || []),
    ...(normalizedEntry.goodThingsHappened || []),
    normalizedEntry.selfLove || '',
    normalizedEntry.gratitudeNote || '',
  ].map((item) => item.trim()).filter((item) => item && item.length >= 3));

  const stressors = takeUnique([
    ...stressorRules
      .filter(({ patterns }) => patterns.some((pattern) => pattern.test(text)))
      .map(({ label }) => label),
    ...(lowerText.includes('stress') ? ['stress load'] : []),
    ...(lowerText.includes('tired') || lowerText.includes('sleep') ? ['low rest'] : []),
  ]);

  let sentimentScore = normalizedEntry.mood != null ? (normalizedEntry.mood - 3) / 2 : null;
  if (sentimentScore == null && positiveAnchors.length) sentimentScore = 0.2;

  if (sentimentScore != null) {
    if (stressors.length) sentimentScore -= Math.min(stressors.length * 0.1, 0.3);
    if (positiveAnchors.length) sentimentScore += Math.min(positiveAnchors.length * 0.08, 0.24);
    sentimentScore = clamp(Number(sentimentScore.toFixed(2)), -1, 1);
  }

  const toneLabel = sentimentScore == null
    ? 'mixed'
    : sentimentScore >= 0.35
      ? 'mostly positive'
      : sentimentScore <= -0.35
        ? 'heavier'
        : 'steady';

  const summaryParts = [
    themes.length
      ? `Your reflection mainly circles around ${themes.slice(0, 2).join(' and ')}.`
      : 'Your reflection highlights a few day-to-day signals without one dominant theme yet.',
    dominantEmotions.length
      ? `The language suggests a ${toneLabel} tone, with ${dominantEmotions.slice(0, 2).join(' and ')} showing up most clearly.`
      : `The overall tone appears ${toneLabel}.`,
    positiveAnchors.length
      ? `Grounding points include ${positiveAnchors.slice(0, 2).join(' and ')}.`
      : '',
    stressors.length
      ? `The main friction seems tied to ${stressors.slice(0, 2).join(' and ')}.`
      : '',
  ].filter(Boolean);

  const suggestedActions = takeUnique([
    themes.includes('sleep') || stressors.includes('sleep disruption') || stressors.includes('low rest')
      ? 'Protect a calmer wind-down routine before bed.'
      : '',
    themes.includes('planning') || themes.includes('work') || stressors.includes('time pressure')
      ? 'Choose one priority and reduce the rest to a shorter follow-up list.'
      : '',
    themes.includes('mindfulness') || themes.includes('stress')
      ? 'Take five quiet minutes to slow your breathing and name what feels most urgent.'
      : '',
    positiveAnchors.length
      ? 'Revisit one of today\'s grounding details when your energy drops.'
      : '',
    !positiveAnchors.length && !themes.length
      ? 'Add one concrete detail about what felt supportive today so future summaries have more signal.'
      : '',
  ], 3);

  return normalizeInsightPayload({
    summary: summaryParts.join(' '),
    sentimentScore,
    dominantEmotions,
    themes,
    stressors,
    positiveAnchors,
    suggestedActions,
    riskFlags,
    modelVersion: 'heuristic-v1',
    generatedAt: new Date(),
  }, 'heuristic-v1');
};

const buildProviderPrompt = (text: string) => ({
  system: 'You analyze wellness journal entries. Return valid JSON only. Do not diagnose. Use cautious language. Base every field only on the supplied text.',
  user: `Analyze this journal entry and return JSON with exactly these keys: summary, sentimentScore, dominantEmotions, themes, stressors, positiveAnchors, suggestedActions, riskFlags.\n\nRules:\n- summary: one concise paragraph under 280 characters\n- sentimentScore: number from -1 to 1 or null\n- array fields: short strings only\n- suggestedActions: 1 to 3 practical actions\n- riskFlags: include crisis-related flags only when the text clearly supports them\n\nEntry:\n${text}`,
});

const requestProviderInsight = async (text: string): Promise<InsightPayload> => {
  const config = getAiConfig();
  const prompt = buildProviderPrompt(text);

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: prompt.system },
        { role: 'user', content: prompt.user },
      ],
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Insight provider request failed (${response.status}): ${message}`);
  }

  const payload = await response.json();
  const content = extractMessageText(payload?.choices?.[0]?.message?.content);
  if (!content) {
    throw new Error('Insight provider returned an empty response.');
  }

  const parsed = JSON.parse(content) as Partial<InsightPayload>;
  return normalizeInsightPayload({
    ...parsed,
    modelVersion: `${config.provider}:${config.model}`,
    generatedAt: new Date(),
  }, `${config.provider}:${config.model}`);
};

export const generateEntryInsight = async (entry: Entry): Promise<InsightPayload | null> => {
  const config = getAiConfig();
  const { textLength } = buildEntryInsightInput(entry);

  if (textLength < config.minTextLength) {
    return null;
  }

  const heuristicInsight = buildHeuristicEntryInsight(entry);

  if (!config.enabled || !config.apiKey) {
    return heuristicInsight;
  }

  try {
    return await requestProviderInsight(getSourceText(entry));
  } catch (error) {
    console.error(`generateEntryInsight fallback: ${error instanceof Error ? error.message : String(error)}`);
    return heuristicInsight;
  }
};

const toInsightCreateInput = (entry: Entry, insight: InsightPayload): Prisma.EntryInsightUncheckedCreateInput => ({
  entryId: entry.id,
  userId: entry.userId,
  summary: insight.summary,
  sentimentScore: insight.sentimentScore,
  dominantEmotions: insight.dominantEmotions,
  themes: insight.themes,
  stressors: insight.stressors,
  positiveAnchors: insight.positiveAnchors,
  suggestedActions: insight.suggestedActions,
  riskFlags: insight.riskFlags,
  modelVersion: insight.modelVersion,
  generatedAt: insight.generatedAt,
});

export const refreshEntryInsight = async (entryId: string) => {
  const entry = await prisma.entry.findUnique({ where: { id: entryId } });
  if (!entry) return null;

  const insight = await generateEntryInsight(entry);

  if (!insight) {
    try {
      await prisma.entryInsight.deleteMany({ where: { entryId: entry.id } });
    } catch (error) {
      if (isMissingEntryInsightsTableError(error)) return null;
      throw error;
    }

    return null;
  }

  try {
    return await prisma.entryInsight.upsert({
      where: { entryId: entry.id },
      update: toInsightCreateInput(entry, insight),
      create: {
        id: crypto.randomUUID(),
        ...toInsightCreateInput(entry, insight),
      },
    });
  } catch (error) {
    if (isMissingEntryInsightsTableError(error)) return null;
    throw error;
  }
};

export const getEntryInsightByEntryId = async (entryId: string, userId: string) => {
  try {
    return await prisma.entryInsight.findFirst({
      where: {
        entryId,
        userId,
      },
    });
  } catch (error) {
    if (isMissingEntryInsightsTableError(error)) return null;
    throw error;
  }
};

const getPeriodStart = (period: InsightPeriod) => (
  parseEntryDateInput(subDays(new Date(), PERIOD_DAYS[period]))
);

const buildLanguageShift = (insights: Array<EntryInsight & { entry: { entryDate: Date } }>) => {
  const sentimentValues = insights
    .map((insight) => insight.sentimentScore)
    .filter((value): value is number => typeof value === 'number');

  if (sentimentValues.length < 4) {
    return {
      direction: 'insufficient_data' as const,
      explanation: 'There is not enough scored text yet to estimate a language shift.',
    };
  }

  const midpoint = Math.floor(sentimentValues.length / 2);
  const firstHalf = sentimentValues.slice(0, midpoint);
  const secondHalf = sentimentValues.slice(midpoint);
  const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
  const delta = average(secondHalf) - average(firstHalf);

  if (delta >= 0.15) {
    return {
      direction: 'improving' as const,
      explanation: 'Recent entries read slightly lighter and more grounded than the earlier part of this period.',
    };
  }

  if (delta <= -0.15) {
    return {
      direction: 'declining' as const,
      explanation: 'Recent entries read heavier than the earlier part of this period, which may be worth checking in on.',
    };
  }

  return {
    direction: 'steady' as const,
    explanation: 'The overall language pattern has stayed fairly consistent across this period.',
  };
};

const buildNarrative = (
  insights: Array<EntryInsight & { entry: { entryDate: Date } }>,
  recurringThemes: Array<{ theme: string; count: number }>,
  commonStressors: Array<{ label: string; count: number }>,
  positiveAnchors: Array<{ label: string; count: number }>,
  languageShift: AiSummaryResponse['languageShift'],
) => {
  if (!insights.length) {
    return 'There are not enough analyzed reflections in this period yet to build an AI summary.';
  }

  const themeText = recurringThemes.length
    ? `Recurring topics center on ${recurringThemes.slice(0, 2).map((item) => item.theme).join(' and ')}.`
    : 'No single theme is dominant yet.';
  const stressorText = commonStressors.length
    ? `The most common friction appears around ${commonStressors.slice(0, 2).map((item) => item.label).join(' and ')}.`
    : 'Stress language is present but not concentrated in one area.';
  const anchorText = positiveAnchors.length
    ? `Supportive anchors include ${positiveAnchors.slice(0, 2).map((item) => item.label).join(' and ')}.`
    : 'Positive anchors are still sparse in the analyzed text.';

  return `${themeText} ${stressorText} ${anchorText} ${languageShift.explanation}`;
};

export const getThemeTrendSummary = async (userId: string, period: InsightPeriod): Promise<ThemeTrendResponse> => {
  try {
    const insights = await prisma.entryInsight.findMany({
      where: {
        userId,
        entry: {
          entryDate: {
            gte: getPeriodStart(period),
          },
        },
      },
      include: {
        entry: {
          select: {
            entryDate: true,
          },
        },
      },
      orderBy: {
        generatedAt: 'asc',
      },
    });

    return {
      period,
      recurringThemes: summarizeCounts(insights.flatMap((insight) => asStringArray(insight.themes)), 'theme') as Array<{ theme: string; count: number }>,
      commonStressors: summarizeCounts(insights.flatMap((insight) => asStringArray(insight.stressors)), 'label') as Array<{ label: string; count: number }>,
      positiveAnchors: summarizeCounts(insights.flatMap((insight) => asStringArray(insight.positiveAnchors)), 'label') as Array<{ label: string; count: number }>,
    };
  } catch (error) {
    if (isMissingEntryInsightsTableError(error)) {
      return {
        period,
        recurringThemes: [],
        commonStressors: [],
        positiveAnchors: [],
      };
    }

    throw error;
  }
};

export const generateUserInsightSummary = async (userId: string, period: InsightPeriod): Promise<AiSummaryResponse> => {
  try {
    const insights = await prisma.entryInsight.findMany({
      where: {
        userId,
        entry: {
          entryDate: {
            gte: getPeriodStart(period),
          },
        },
      },
      include: {
        entry: {
          select: {
            entryDate: true,
          },
        },
      },
      orderBy: {
        generatedAt: 'asc',
      },
    });

    const recurringThemes = summarizeCounts(insights.flatMap((insight) => asStringArray(insight.themes)), 'theme') as Array<{ theme: string; count: number }>;
    const commonStressors = summarizeCounts(insights.flatMap((insight) => asStringArray(insight.stressors)), 'label') as Array<{ label: string; count: number }>;
    const positiveAnchors = summarizeCounts(insights.flatMap((insight) => asStringArray(insight.positiveAnchors)), 'label') as Array<{ label: string; count: number }>;
    const languageShift = buildLanguageShift(insights);

    return {
      period,
      narrative: buildNarrative(insights, recurringThemes, commonStressors, positiveAnchors, languageShift),
      recurringThemes,
      commonStressors,
      positiveAnchors,
      suggestedFocusAreas: takeUnique([
        commonStressors[0]?.label || '',
        recurringThemes.find((item) => item.theme !== 'gratitude')?.theme || '',
        insights.flatMap((insight) => asStringArray(insight.suggestedActions))[0] || '',
      ], 3),
      languageShift,
    };
  } catch (error) {
    if (isMissingEntryInsightsTableError(error)) {
      return {
        period,
        narrative: 'AI insights are not available yet because the insight storage has not been created in this database.',
        recurringThemes: [],
        commonStressors: [],
        positiveAnchors: [],
        suggestedFocusAreas: [],
        languageShift: {
          direction: 'insufficient_data',
          explanation: 'Run the latest Prisma migration to enable stored AI insight summaries.',
        },
      };
    }

    throw error;
  }
};
