import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import BrandLogo from './BrandLogo';

const primaryLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/reflection', label: 'Daily Reflection', icon: 'edit_note' },
  { to: '/selfcare', label: 'Self-Care', icon: 'self_care' },
  { to: '/emotional', label: 'Emotional Guidance', icon: 'psychology' },
];

const secondaryLinks = [
  { to: '/review', label: 'Journal Review', icon: 'menu_book' },
  { to: '/analytics', label: 'Analytics', icon: 'monitoring' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
];

const mobilePrimaryLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { to: '/reflection', label: 'Reflect', icon: 'edit_note' },
  { to: '/selfcare', label: 'Self-Care', icon: 'self_care' },
  { to: '/review', label: 'Review', icon: 'menu_book' },
];

const getIsPathActive = (pathname: string, to: string) => pathname === to || (to === '/dashboard' && pathname === '/');

const routeTitleLookup: Record<string, string> = {
  '/': 'Dashboard',
  '/dashboard': 'Dashboard',
  '/reflection': 'Daily Reflection',
  '/selfcare': 'Self-Care',
  '/emotional': 'Emotional Guidance',
  '/review': 'Journal Review',
  '/analytics': 'Analytics',
  '/inspiration': 'Inspiration',
  '/settings': 'Settings',
};

const linkClassName = ({ isActive }: { isActive: boolean }) =>
  [
    'group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all',
    isActive
      ? 'bg-sage-600 text-white shadow-soft dark:bg-sage-500 dark:text-slate-950'
      : 'text-slate-600 hover:bg-sage-50 hover:text-sage-800 dark:text-sage-200 dark:hover:bg-white/10 dark:hover:text-white',
  ].join(' ');

export default function Sidebar() {
  const { logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const currentPageTitle = routeTitleLookup[location.pathname] || 'MindfulLife';
  const isMobileMoreActive = useMemo(
    () => !mobilePrimaryLinks.some((link) => getIsPathActive(location.pathname, link.to)),
    [location.pathname]
  );

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      <div className="sticky top-0 z-30 mb-6 flex items-center justify-between rounded-[1.75rem] border border-sage-200 bg-white/90 px-4 py-3 shadow-soft backdrop-blur-sm lg:hidden dark:border-white/10 dark:bg-[#15201a]/90">
        <BrandLogo
          subtitle={currentPageTitle}
          titleClassName="text-lg"
          iconClassName="h-11 w-11"
        />
        <button
          aria-expanded={isMobileMenuOpen}
          aria-label="Open mobile navigation"
          className="inline-flex h-11 items-center gap-2 rounded-2xl border border-sage-200 bg-sage-50 px-3 text-sm font-semibold text-sage-700 transition-colors hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-sage-100 dark:hover:bg-white/10"
          onClick={() => setIsMobileMenuOpen(true)}
          type="button"
        >
          <span className="material-symbols-outlined text-[20px]">menu</span>
          <span className="hidden sm:inline">Menu</span>
        </button>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
        <div className="mx-auto w-full max-w-7xl px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          <nav
            aria-label="Mobile navigation"
            className="rounded-[1.75rem] border border-sage-200 bg-white/95 px-2 py-2 shadow-soft backdrop-blur-md dark:border-white/10 dark:bg-[#15201a]/95"
          >
            <div className="grid grid-cols-5 gap-1">
              {mobilePrimaryLinks.map((link) => {
                const isActive = getIsPathActive(location.pathname, link.to);

                return (
                  <NavLink
                    key={link.to}
                    className={clsx(
                      'flex min-w-0 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition-all',
                      isActive
                        ? 'bg-sage-600 text-white shadow-soft dark:bg-sage-500 dark:text-slate-950'
                        : 'text-sage-700 hover:bg-sage-50 dark:text-sage-200 dark:hover:bg-white/10'
                    )}
                    to={link.to}
                  >
                    <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
                    <span className="truncate">{link.label}</span>
                  </NavLink>
                );
              })}

              <button
                aria-expanded={isMobileMenuOpen}
                aria-label="Open more navigation options"
                className={clsx(
                  'flex min-w-0 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition-all',
                  isMobileMoreActive || isMobileMenuOpen
                    ? 'bg-sage-600 text-white shadow-soft dark:bg-sage-500 dark:text-slate-950'
                    : 'text-sage-700 hover:bg-sage-50 dark:text-sage-200 dark:hover:bg-white/10'
                )}
                onClick={() => setIsMobileMenuOpen(true)}
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">apps</span>
                <span className="truncate">More</span>
              </button>
            </div>
          </nav>
        </div>
      </div>

      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close mobile navigation"
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
            onClick={() => setIsMobileMenuOpen(false)}
            type="button"
          />

          <div className="absolute inset-x-0 bottom-0 rounded-t-[2rem] border border-sage-200 bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-5 shadow-soft dark:border-white/10 dark:bg-[#15201a]">
            <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-sage-200 dark:bg-white/10" />
            <div className="mb-5 flex items-center justify-between">
              <BrandLogo
                subtitle="Navigate"
                titleClassName="text-2xl text-sage-800 dark:text-sage-50"
                subtitleClassName="text-sage-500 dark:text-sage-300"
                iconClassName="h-10 w-10 text-[#44604a] dark:text-sage-50"
              />
              <button
                aria-label="Close mobile navigation"
                className="mt-2 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-sage-200 bg-sage-50 text-sage-700 transition-colors hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-sage-100 dark:hover:bg-white/10"
                onClick={() => setIsMobileMenuOpen(false)}
                type="button"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.24em] text-sage-500 dark:text-sage-300">Practice</p>
                <div className="space-y-2">
                  {primaryLinks.map((link) => (
                    <NavLink key={link.to} className={linkClassName} to={link.to}>
                      <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
                      {link.label}
                    </NavLink>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.24em] text-sage-500 dark:text-sage-300">Insights</p>
                <div className="space-y-2">
                  {secondaryLinks.map((link) => (
                    <NavLink key={link.to} className={linkClassName} to={link.to}>
                      <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
                      {link.label}
                    </NavLink>
                  ))}
                </div>
              </div>

              <button
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-sage-200 bg-white px-4 py-3 text-sm font-semibold text-sage-700 transition-colors hover:bg-sage-50 dark:border-white/10 dark:bg-white/5 dark:text-sage-100 dark:hover:bg-white/10"
                onClick={logout}
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
                Log out
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col overflow-y-auto border-r border-sage-200 bg-white/90 px-6 py-6 shadow-soft backdrop-blur-sm lg:flex dark:border-white/10 dark:bg-[#15201a]/90">
        <BrandLogo
          className="pb-6"
          subtitle="Wellness Dashboard"
          titleClassName="text-2xl text-sage-800 dark:text-sage-50"
          subtitleClassName="tracking-[0.3em] text-sage-500 dark:text-sage-300"
          iconClassName="h-12 w-12 text-[#44604a] dark:text-sage-50"
        />

        <nav className="mt-2 space-y-2">
          <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-[0.28em] text-sage-500 dark:text-sage-300">Practice</p>
          {primaryLinks.map((link) => (
            <NavLink key={link.to} className={linkClassName} to={link.to}>
              <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <nav className="mt-6 space-y-2">
          <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-[0.28em] text-sage-500 dark:text-sage-300">Insights</p>
          {secondaryLinks.map((link) => (
            <NavLink key={link.to} className={linkClassName} to={link.to}>
              <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-4 pt-6">
          <div className="rounded-[1.75rem] border border-sage-200 bg-sage-50 p-5 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sage-500 dark:text-sage-300">Daily Prompt</p>
            <p className="mt-3 font-display text-2xl font-semibold text-sage-700 dark:text-sage-50">How are you truly?</p>
            <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-sage-200">Return to your dashboard and take one small intentional step toward balance.</p>
          </div>

          <button
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-sage-200 bg-white px-4 py-3 text-sm font-semibold text-sage-700 transition-colors hover:bg-sage-50 dark:border-white/10 dark:bg-white/5 dark:text-sage-100 dark:hover:bg-white/10"
            onClick={logout}
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Log out
          </button>
        </div>
      </aside>
    </>
  );
}
