import type { ApiEnvelope } from '@/types/api';
import type {
  InspirationQuoteResponse,
  SavedInspirationQuote,
  SaveInspirationQuoteRequest,
} from '@/types/inspiration';
import api from './api';

const inspirationService = {
  getToday: async (): Promise<ApiEnvelope<InspirationQuoteResponse>> => (
    await api.get('/inspiration/today')
  ).data,
  getSaved: async (): Promise<ApiEnvelope<SavedInspirationQuote[]>> => (
    await api.get('/inspiration/saved')
  ).data,
  save: async (quote: SaveInspirationQuoteRequest): Promise<ApiEnvelope<SavedInspirationQuote>> => (
    await api.post('/inspiration/saved', quote)
  ).data,
  removeSaved: async (id: string): Promise<ApiEnvelope<null>> => (
    await api.delete(`/inspiration/saved/${id}`)
  ).data,
};

export default inspirationService;
