import clsx from 'clsx';
import { useTheme } from '@/contexts/useTheme';

interface AuthThemeToggleProps {
  className?: string;
}

export default function AuthThemeToggle({ className }: AuthThemeToggleProps) {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      aria-label={`Current theme: ${isDarkMode ? 'dark' : 'light'} mode. Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      className={clsx(
        'inline-flex items-center gap-3 rounded-full border border-sage-200 bg-sage-50/90 px-3 py-2 text-sm font-semibold text-sage-700 shadow-sm transition-all hover:border-sage-300 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-sage-100 dark:hover:bg-white/10',
        className
      )}
      onClick={toggleTheme}
      type="button"
    >
      <span className="material-symbols-outlined text-[18px]">{isDarkMode ? 'dark_mode' : 'light_mode'}</span>
      <span>{isDarkMode ? 'Dark mode' : 'Light mode'}</span>
      <span
        className={clsx(
          'relative inline-flex h-6 w-11 rounded-full transition-colors',
          isDarkMode ? 'bg-sage-500' : 'bg-sage-300'
        )}
      >
        <span
          className={clsx(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all',
            isDarkMode ? 'left-5' : 'left-0.5'
          )}
        />
      </span>
    </button>
  );
}
