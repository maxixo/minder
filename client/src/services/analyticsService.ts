import api from './api';
import type { ApiEnvelope } from '@/types/api';
import type { AiSummaryResponse, InsightPeriod, ThemeTrendResponse } from '@/types/ai';

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
  getMoodTrends: async (period: InsightPeriod = '30days') => (
    await api.get('/analytics/mood-trends', { params: { period } })
  ).data,
  getEnergyPatterns: async () => (await api.get('/analytics/energy-patterns')).data,
  getActivityHeatmap: async (year: number) => (
    await api.get('/analytics/activity-heatmap', { params: { year } })
  ).data,
  getWeeklyReport: async () => (await api.get('/analytics/weekly-report')).data,
};

export default analyticsService;
