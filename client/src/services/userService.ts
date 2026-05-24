import api from './api';

const userService = {
  getPreferences: async () => (await api.get('/users/preferences')).data,
  updatePreferences: async (data: any) => (await api.put('/users/preferences', data)).data,
  getPushSubscriptionStatus: async () => (await api.get('/users/push-subscriptions/status')).data,
  savePushSubscription: async (data: any) => (await api.post('/users/push-subscriptions', data)).data,
  deletePushSubscription: async (data?: any) => (await api.delete('/users/push-subscriptions', { data })).data,
  sendTestPushNotification: async (data?: any) => (await api.post('/users/push-subscriptions/test', data || {})).data,
  exportData: async () => await api.get('/users/export', { responseType: 'blob' }),
  deleteAccount: async () => (await api.delete('/users/account')).data,
};

export default userService;
