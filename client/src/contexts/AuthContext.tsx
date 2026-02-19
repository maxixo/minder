import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import authService from '@/services/authService';
import { toast } from 'sonner';

interface AuthContextValue {
  user: any;
  loading: boolean;
  isAuthenticated: boolean;
  register: (data: any) => Promise<any>;
  login: (credentials: any) => Promise<any>;
  logout: () => void;
  updateProfile: (data: any) => Promise<any>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user,            setUser]            = useState<any>(null);
  const [loading,         setLoading]         = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (authService.isAuthenticated()) {
          setUser(authService.getStoredUser());
          setIsAuthenticated(true);
          const res = await authService.getCurrentUser();
          setUser(res.data);
        }
      } catch { logout(); }
      finally  { setLoading(false); }
    })();
  }, []);

  const register = async (data: any) => {
    const res = await authService.register(data);
    setUser(res.data.user);
    setIsAuthenticated(true);
    toast.success('Welcome to Mindful Webapp! 🌿');
    return res;
  };

  const login = async (credentials: any) => {
    const res = await authService.login(credentials);
    setUser(res.data.user);
    setIsAuthenticated(true);
    toast.success('Welcome back!');
    return res;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateProfile = async (data: any) => {
    const res = await authService.updateProfile(data);
    setUser(res.data);
    toast.success('Profile updated');
    return res;
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, register, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
