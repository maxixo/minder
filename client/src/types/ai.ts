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

export interface ReflectionAssistResponse {
  suggestedPrompt: string;
  followUpQuestion: string;
  encouragement: string;
  modelVersion: string;
  preview: boolean;
}

export interface SavedReflectionInsightCard {
  title: string;
  summary: string;
  keyThemes: string[];
  anchorLabel: string;
  anchorText: string;
  followUpLabel: string;
  followUpText: string;
  premiumTeaser: string;
  riskMessage: string | null;
}
