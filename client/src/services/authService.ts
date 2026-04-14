import api from './api';

const authService = {
  register: async (data: any) => {
    const res = await api.post('/auth/register', data);
    return res.data;
  },
  login: async (data: any) => {
    const res = await api.post('/auth/login', data);
    return res.data;
  },
  logout: async () => (await api.post('/auth/logout')).data,
  getCurrentUser: async () => (await api.get('/auth/me')).data,
  updateProfile:  async (d: any) => (await api.put('/auth/profile', d)).data,
  updatePassword: async (d: any) => (await api.put('/auth/password', d)).data,
};

export default authService;
