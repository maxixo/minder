import api, { clearAuthToken, setAuthToken } from './api';

const authService = {
  register: async (data: any) => {
    const res = await api.post('/auth/register', data);
    return res.data;
  },
  login: async (data: any) => {
    const res = await api.post('/auth/login', data);
    const token = res.data?.data?.token;
    if (typeof token === 'string' && token) {
      setAuthToken(token);
    }
    return res.data;
  },
  googleConfig: async () => (await api.get('/auth/google/config')).data,
  googleLogin: async (credential: string) => {
    const res = await api.post('/auth/google', { credential });
    const token = res.data?.data?.token;
    if (typeof token === 'string' && token) {
      setAuthToken(token);
    }
    return res.data;
  },
  acknowledgeDashboardWelcome: async () => (await api.post('/auth/dashboard-welcome/ack')).data,
  logout: async () => {
    try {
      return (await api.post('/auth/logout')).data;
    } finally {
      clearAuthToken();
    }
  },
  getCurrentUser: async () => (await api.get('/auth/me')).data,
  updateProfile: async (d: any) => (await api.put('/auth/profile', d)).data,
  uploadProfileAvatar: async (file: string) => (await api.post('/auth/profile/avatar', { file })).data,
  deleteProfileAvatar: async () => (await api.delete('/auth/profile/avatar')).data,
  updatePassword: async (d: any) => (await api.put('/auth/password', d)).data,
};

export default authService;
