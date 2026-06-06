import type { EntryInsightResponse } from '@/types/ai';

export interface ReflectionPack {
  id: string;
  title: string;
  description: string;
  theme: string;
  estimatedMinutes: string;
  isPremium: boolean;
  badge: string;
  intro: string;
  gratitudePrompt: string;
  intentionPrompt: string;
  quickWinsPrompt: string;
  assistHint: string;
  followUpHint: string;
  recommendedWhen?: string[];
}

export const reflectionPacks: ReflectionPack[] = [
  {
    id: 'open-check-in',
    title: 'Open Check-In',
    description: 'A steady daily reflection to name gratitude, intention, and how your energy is moving.',
    theme: 'daily clarity',
    estimatedMinutes: '3 min',
    isPremium: false,
    badge: 'Included',
    intro: 'Stay close to the day as it is. Name what feels true without trying to make it perfect.',
    gratitudePrompt: 'List three things that feel grounding, supportive, or quietly good today.',
    intentionPrompt: 'What would make the rest of today feel lighter or more honest?',
    quickWinsPrompt: 'What small progress or stability showed up, even if it barely counted in the moment?',
    assistHint: 'Use AI assist when you know the feeling but need help finding the next sentence.',
    followUpHint: 'Which part of today deserves one more honest line?',
  },
  {
    id: 'stress-reset',
    title: 'Stress Reset',
    description: 'A guided pressure check-in for work overload, anxious energy, and shrinking the next step.',
    theme: 'stress recovery',
    estimatedMinutes: '4 min',
    isPremium: true,
    badge: 'Premium',
    intro: 'Notice what feels pressurized first, then reduce it to one concrete strain you can respond to.',
    gratitudePrompt: 'What gave you even a brief sense of steadiness while the day felt demanding?',
    intentionPrompt: 'What is the most pressured part of today, and what would make it smaller?',
    quickWinsPrompt: 'Which small boundary, pause, or adjustment helped more than expected?',
    assistHint: 'Preview a guided stress-reset prompt tuned for overloaded days.',
    followUpHint: 'What responsibility can be reduced, delayed, or made smaller today?',
    recommendedWhen: ['stress', 'work', 'workload pressure', 'time pressure', 'emotional overload'],
  },
  {
    id: 'sleep-unwind',
    title: 'Sleep Unwind',
    description: 'A calmer evening reflection for restless energy, overstimulation, and protecting tonight.',
    theme: 'sleep and recovery',
    estimatedMinutes: '4 min',
    isPremium: true,
    badge: 'Premium',
    intro: 'Use this when the goal is less to solve the whole day and more to settle your system before night.',
    gratitudePrompt: 'What felt calming, slow, or less noisy than the rest of the day?',
    intentionPrompt: 'What would help tonight feel more protected than the last few evenings?',
    quickWinsPrompt: 'What small recovery choice already helped your body or mind slow down?',
    assistHint: 'Preview a wind-down prompt designed for late-day reflection.',
    followUpHint: 'What can you remove tonight so rest has a better chance?',
    recommendedWhen: ['sleep', 'sleep disruption', 'low rest', 'fatigue'],
  },
  {
    id: 'burnout-check-in',
    title: 'Burnout Check-In',
    description: 'A deeper prompt pack for emotional depletion, flat motivation, and long-running strain.',
    theme: 'burnout awareness',
    estimatedMinutes: '5 min',
    isPremium: true,
    badge: 'Premium',
    intro: 'This pack helps separate tiredness from deeper depletion so the next step is more realistic.',
    gratitudePrompt: 'What still felt human, warm, or worth noticing even while energy stayed low?',
    intentionPrompt: 'What feels heavier than it should right now, and what relief is actually available?',
    quickWinsPrompt: 'What did you protect, pause, or avoid today that helped preserve some energy?',
    assistHint: 'Preview a more deliberate burnout check-in when the day feels chronically heavy.',
    followUpHint: 'Which demand keeps taking more from you than it gives back?',
    recommendedWhen: ['stress', 'fatigue', 'emotional overload', 'low rest'],
  },
];

export const defaultReflectionPack = reflectionPacks[0];

export const getReflectionPack = (packId?: string | null) => (
  reflectionPacks.find((pack) => pack.id === packId) || defaultReflectionPack
);

export const recommendReflectionPackId = (insight?: EntryInsightResponse | null) => {
  if (!insight) return null;

  const signals = new Set([
    ...insight.themes.map((item) => item.toLowerCase()),
    ...insight.stressors.map((item) => item.toLowerCase()),
  ]);

  const recommendedPack = reflectionPacks.find((pack) => (
    pack.isPremium && pack.recommendedWhen?.some((signal) => signals.has(signal.toLowerCase()))
  ));

  return recommendedPack?.id || null;
};
