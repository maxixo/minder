import api from './api';

const userService = {
  getPreferences: async () => (await api.get('/users/preferences')).data,
  updatePreferences: async (data: any) => (await api.put('/users/preferences', data)).data,
  exportData: async () => await api.get('/users/export', { responseType: 'blob' }),
  deleteAccount: async () => (await api.delete('/users/account')).data,
};

export default userService;
