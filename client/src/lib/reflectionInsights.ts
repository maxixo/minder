import type { EntryInsightResponse, SavedReflectionInsightCard } from '@/types/ai';
import type { ReflectionPack } from '@/lib/reflectionPacks';

const fallbackRiskMessage = 'This reflection includes language that may need extra care. If you are in immediate danger or thinking about harming yourself, contact local emergency services or a crisis line right away.';

export const buildSavedReflectionInsightCard = (
  insight: EntryInsightResponse,
  pack: ReflectionPack,
): SavedReflectionInsightCard => ({
  title: insight.themes[0]
    ? `${insight.themes[0].charAt(0).toUpperCase()}${insight.themes[0].slice(1)} is shaping this reflection`
    : 'A clearer read on this reflection',
  summary: insight.summary,
  keyThemes: insight.themes.slice(0, 2),
  anchorLabel: insight.positiveAnchors.length ? 'Grounding point' : 'Grounding point to add next time',
  anchorText: insight.positiveAnchors[0] || 'Add one more concrete detail about what felt supportive so the next reflection has a stronger anchor.',
  followUpLabel: pack.isPremium ? `${pack.title} follow-up` : 'Next question',
  followUpText: insight.suggestedActions[0] || pack.followUpHint,
  premiumTeaser: pack.isPremium
    ? 'This guided pack is part of the premium reflection library. Weekly pattern reads and deeper pack flows can build on moments like this.'
    : 'Unlock guided reflection packs and deeper weekly pattern reads once you want more structured insight.',
  riskMessage: insight.riskFlags.length ? fallbackRiskMessage : null,
});
