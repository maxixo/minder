import { createContext, useState, useEffect, type ReactNode } from 'react';
import authService from '@/services/authService';
import { toast } from 'sonner';

export interface AuthContextValue {
  user: any;
  loading: boolean;
  isAuthenticated: boolean;
  register: (data: any) => Promise<any>;
  login: (credentials: any) => Promise<any>;
  logout: () => void;
  updateProfile: (data: any) => Promise<any>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user,            setUser]            = useState<any>(null);
  const [loading,         setLoading]         = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await authService.getCurrentUser();
        setUser(res.data);
        setIsAuthenticated(true);
      } catch {
        setUser(null);
        setIsAuthenticated(false);
      }
      finally  { setLoading(false); }
    })();
  }, []);

  const register = async (data: any) => {
    const res = await authService.register(data);
    setUser(null);
    setIsAuthenticated(false);
    toast.success(res.message || 'Account created. Please log in.');
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
    void authService.logout();
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
