import { createContext, useEffect, useRef, useState, type ReactNode } from 'react';
import authService from '@/services/authService';
import userService from '@/services/userService';
import { getBrowserTimeZone, getExistingPushSubscription } from '@/services/pushService';
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
  const isSyncingTimeZoneRef = useRef(false);
  const lastSyncedTimeZoneRef = useRef<string | null>(null);

  const syncSubscriptionTimeZoneToCurrentDevice = async (timeZone: string) => {
    const existingSubscription = await getExistingPushSubscription().catch(() => null);
    if (!existingSubscription) return;

    await userService.savePushSubscription({
      subscription: existingSubscription.toJSON(),
      timezone: timeZone,
    });
  };

  const syncTimeZoneToCurrentDevice = async (targetUser: any) => {
    if (!targetUser || isSyncingTimeZoneRef.current) return;

    const browserTimeZone = getBrowserTimeZone();
    const currentTimeZone = targetUser?.preferences?.notifications?.timezone;

    if (!browserTimeZone || currentTimeZone === browserTimeZone || lastSyncedTimeZoneRef.current === browserTimeZone) {
      return;
    }

    isSyncingTimeZoneRef.current = true;

    try {
      const response = await authService.updateProfile({
        preferences: {
          ...targetUser.preferences,
          notifications: {
            ...targetUser.preferences?.notifications,
            timezone: browserTimeZone,
          },
        },
      });

      await syncSubscriptionTimeZoneToCurrentDevice(browserTimeZone);
      setUser(response.data);
      lastSyncedTimeZoneRef.current = browserTimeZone;
    } catch {
      lastSyncedTimeZoneRef.current = null;
    } finally {
      isSyncingTimeZoneRef.current = false;
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await authService.getCurrentUser();
        setUser(res.data);
        setIsAuthenticated(true);
        void syncTimeZoneToCurrentDevice(res.data);
      } catch {
        setUser(null);
        setIsAuthenticated(false);
      }
      finally  { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const handleFocus = () => {
      void syncTimeZoneToCurrentDevice(user);
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [isAuthenticated, user]);

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
