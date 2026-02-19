import api from './api';

const authService = {
  register: async (data: any) => {
    const res = await api.post('/auth/register', data);
    if (res.data.success) { localStorage.setItem('token', res.data.data.token); localStorage.setItem('user', JSON.stringify(res.data.data.user)); }
    return res.data;
  },
  login: async (data: any) => {
    const res = await api.post('/auth/login', data);
    if (res.data.success) { localStorage.setItem('token', res.data.data.token); localStorage.setItem('user', JSON.stringify(res.data.data.user)); }
    return res.data;
  },
  logout: ()          => { localStorage.removeItem('token'); localStorage.removeItem('user'); },
  getCurrentUser: async () => (await api.get('/auth/me')).data,
  updateProfile:  async (d: any) => { const r = await api.put('/auth/profile', d); if (r.data.success) localStorage.setItem('user', JSON.stringify(r.data.data)); return r.data; },
  updatePassword: async (d: any) => (await api.put('/auth/password', d)).data,
  isAuthenticated: ()       => !!localStorage.getItem('token'),
  getStoredUser:   ()       => { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null; },
};

export default authService;
