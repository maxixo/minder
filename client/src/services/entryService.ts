import api from './api';
import type { ApiEnvelope, PaginatedApiEnvelope } from '@/types/api';
import type { EntryInsightResponse } from '@/types/ai';
import type { DailyEntry, DailyEntryRequest, EntryQueryParams } from '@/types/entry';

const entryService = {
  getEntries: async (params: EntryQueryParams = {}): Promise<PaginatedApiEnvelope<DailyEntry[]>> => (
    await api.get('/entries', { params })
  ).data,
  getEntry: async (id: string): Promise<ApiEnvelope<DailyEntry>> => (
    await api.get(`/entries/${id}`)
  ).data,
  getEntryInsight: async (id: string): Promise<ApiEnvelope<EntryInsightResponse | null>> => (
    await api.get(`/entries/${id}/insight`)
  ).data,
  getEntryByDate: async (date: string): Promise<ApiEnvelope<DailyEntry | null>> => (
    await api.get(`/entries/date/${date}`)
  ).data,
  getTodayEntry: async (): Promise<ApiEnvelope<DailyEntry | null>> => (
    await api.get('/entries/today')
  ).data,
  getRecentEntries: async (days = 7): Promise<ApiEnvelope<DailyEntry[]>> => (
    await api.get('/entries/recent', { params: { days } })
  ).data,
  createEntry: async (data: Partial<DailyEntryRequest>): Promise<ApiEnvelope<DailyEntry>> => (
    await api.post('/entries', data)
  ).data,
  updateEntry: async (id: string, data: DailyEntryRequest): Promise<ApiEnvelope<DailyEntry>> => (
    await api.put(`/entries/${id}`, data)
  ).data,
  autoSaveEntry: async (id: string, data: DailyEntryRequest): Promise<ApiEnvelope<DailyEntry>> => (
    await api.patch(`/entries/${id}/autosave`, data)
  ).data,
  deleteEntry: async (id: string): Promise<ApiEnvelope<null>> => (
    await api.delete(`/entries/${id}`)
  ).data,
};

export default entryService;
