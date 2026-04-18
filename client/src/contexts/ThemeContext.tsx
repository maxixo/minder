import { createContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '@/contexts/useAuth';

export type ThemePreference = 'light' | 'dark' | 'auto';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  themePreference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  isDarkMode: boolean;
  setThemePreference: (theme: ThemePreference) => void;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'mindfullife-theme-preference';

const getStoredPreference = (): ThemePreference | null => {
  if (typeof window === 'undefined') return null;

  const storedPreference = window.localStorage.getItem(STORAGE_KEY);
  return storedPreference === 'light' || storedPreference === 'dark' || storedPreference === 'auto'
    ? storedPreference
    : null;
};

const getSystemTheme = (): ResolvedTheme => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const resolveTheme = (themePreference: ThemePreference): ResolvedTheme => {
  if (themePreference === 'auto') return getSystemTheme();
  return themePreference;
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const storedPreference = getStoredPreference();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(storedPreference || 'auto');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(resolveTheme(storedPreference || 'auto'));
  const hydratedFromUserPreference = useRef(Boolean(storedPreference));

  useEffect(() => {
    if (hydratedFromUserPreference.current) return;

    const userThemePreference = user?.preferences?.theme;
    if (userThemePreference === 'light' || userThemePreference === 'dark' || userThemePreference === 'auto') {
      hydratedFromUserPreference.current = true;
      setThemePreferenceState(userThemePreference);
    }
  }, [user?.preferences?.theme]);

  useEffect(() => {
    const applyResolvedTheme = () => {
      const nextResolvedTheme = resolveTheme(themePreference);
      setResolvedTheme(nextResolvedTheme);
      document.documentElement.classList.toggle('dark', nextResolvedTheme === 'dark');
      document.documentElement.style.colorScheme = nextResolvedTheme;
    };

    applyResolvedTheme();
    window.localStorage.setItem(STORAGE_KEY, themePreference);

    if (themePreference !== 'auto') return undefined;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyResolvedTheme();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, [themePreference]);

  const value = useMemo<ThemeContextValue>(() => ({
    themePreference,
    resolvedTheme,
    isDarkMode: resolvedTheme === 'dark',
    setThemePreference: setThemePreferenceState,
    toggleTheme: () => setThemePreferenceState((currentTheme) => {
      const currentResolvedTheme = resolveTheme(currentTheme);
      return currentResolvedTheme === 'dark' ? 'light' : 'dark';
    }),
  }), [resolvedTheme, themePreference]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
