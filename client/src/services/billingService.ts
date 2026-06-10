import api from './api';
import type { ApiEnvelope } from '@/types/api';
import type { BillingInterval, BillingSummary } from '@/types/billing';

const billingService = {
  getStatus: async (): Promise<ApiEnvelope<BillingSummary>> => (
    await api.get('/billing/status')
  ).data,
  createCheckout: async (interval: BillingInterval): Promise<ApiEnvelope<{ url: string }>> => (
    await api.post('/billing/checkout', { interval })
  ).data,
  getPortal: async (): Promise<ApiEnvelope<{ url: string }>> => (
    await api.get('/billing/portal')
  ).data,
  requestPremiumAccess: async (interval: BillingInterval): Promise<ApiEnvelope<BillingSummary>> => (
    await api.post('/billing/upgrade-interest', { interval })
  ).data,
};

export default billingService;
