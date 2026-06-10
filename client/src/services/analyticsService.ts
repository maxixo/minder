import api from './api';
import type { ApiEnvelope } from '@/types/api';
import type { AiSummaryResponse, InsightPeriod, ThemeTrendResponse } from '@/types/ai';
import type { AnalyticsPatternInsights } from '@/types/analytics';

const analyticsService = {
  getSummary: async (period: InsightPeriod = '30days') => (
    await api.get('/analytics/summary', { params: { period } })
  ).data,
  getAiSummary: async (period: InsightPeriod = '30days'): Promise<ApiEnvelope<AiSummaryResponse>> => (
    await api.get('/analytics/ai-summary', { params: { period } })
  ).data,
  getThemeTrends: async (period: InsightPeriod = '30days'): Promise<ApiEnvelope<ThemeTrendResponse>> => (
    await api.get('/analytics/theme-trends', { params: { period } })
  ).data,
  getPatternInsights: async (period: InsightPeriod = '30days'): Promise<ApiEnvelope<AnalyticsPatternInsights>> => (
    await api.get('/analytics/pattern-insights', { params: { period } })
  ).data,
  getMoodTrends: async (period: InsightPeriod = '30days') => (
    await api.get('/analytics/mood-trends', { params: { period } })
  ).data,
  getEnergyPatterns: async () => (await api.get('/analytics/energy-patterns')).data,
  getWeeklyReport: async () => (await api.get('/analytics/weekly-report')).data,
};

export default analyticsService;
