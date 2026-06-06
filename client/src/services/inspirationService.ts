import type { ApiEnvelope } from '@/types/api';
import type { InspirationQuoteResponse } from '@/types/inspiration';
import api from './api';

const inspirationService = {
  getToday: async (): Promise<ApiEnvelope<InspirationQuoteResponse>> => (
    await api.get('/inspiration/today')
  ).data,
};

export default inspirationService;
