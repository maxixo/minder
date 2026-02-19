import api from './api';

const analyticsService = {
  getSummary:       async (period='30days') => (await api.get('/analytics/summary',         { params:{period} })).data,
  getMoodTrends:    async (period='30days') => (await api.get('/analytics/mood-trends',     { params:{period} })).data,
  getEnergyPatterns:async ()               => (await api.get('/analytics/energy-patterns')).data,
  getActivityHeatmap:async (year: number)          => (await api.get('/analytics/activity-heatmap', { params:{year} })).data,
  getWeeklyReport:  async ()               => (await api.get('/analytics/weekly-report')).data,
};

export default analyticsService;
