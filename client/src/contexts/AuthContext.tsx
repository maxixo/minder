import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
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
  syncUser: (nextUser: any) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

const mergeUserState = (currentUser: any, nextUser: any, submittedData?: any) => {
  if (!currentUser) {
    if (submittedData?.avatar !== undefined) {
      return {
        ...(nextUser || {}),
        avatar: submittedData.avatar,
      };
    }

    return nextUser;
  }

  return {
    ...currentUser,
    ...(nextUser || {}),
    avatar: submittedData?.avatar !== undefined
      ? submittedData.avatar
      : nextUser?.avatar ?? currentUser.avatar ?? null,
    preferences: {
      ...(currentUser.preferences || {}),
      ...(nextUser?.preferences || {}),
      notifications: {
        ...(currentUser.preferences?.notifications || {}),
        ...(nextUser?.preferences?.notifications || {}),
      },
      privacy: {
        ...(currentUser.preferences?.privacy || {}),
        ...(nextUser?.preferences?.privacy || {}),
      },
    },
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user,            setUser]            = useState<any>(null);
  const [loading,         setLoading]         = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const isSyncingTimeZoneRef = useRef(false);
  const lastSyncedTimeZoneRef = useRef<string | null>(null);

  const syncSubscriptionTimeZoneToCurrentDevice = useCallback(async (timeZone: string) => {
    const existingSubscription = await getExistingPushSubscription().catch(() => null);
    if (!existingSubscription) return;

    await userService.savePushSubscription({
      subscription: existingSubscription.toJSON(),
      timezone: timeZone,
    });
  }, []);

  const syncTimeZoneToCurrentDevice = useCallback(async (targetUser: any) => {
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
      setUser((currentUser: any) => mergeUserState(currentUser, response.data));
      lastSyncedTimeZoneRef.current = browserTimeZone;
    } catch {
      lastSyncedTimeZoneRef.current = null;
    } finally {
      isSyncingTimeZoneRef.current = false;
    }
  }, [syncSubscriptionTimeZoneToCurrentDevice]);

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
  }, [syncTimeZoneToCurrentDevice]);

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
  }, [isAuthenticated, syncTimeZoneToCurrentDevice, user]);

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

  const syncUser = (nextUser: any) => {
    setUser((currentUser: any) => mergeUserState(currentUser, nextUser));
    setIsAuthenticated(Boolean(nextUser));
  };

  const updateProfile = async (data: any) => {
    const res = await authService.updateProfile(data);
    setUser((currentUser: any) => mergeUserState(currentUser, res.data, data));
    toast.success('Profile updated');
    return res;
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, register, login, logout, updateProfile, syncUser }}>
      {children}
    </AuthContext.Provider>
  );
};
