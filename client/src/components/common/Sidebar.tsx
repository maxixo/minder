import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';

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

const linkClassName = ({ isActive }: { isActive: boolean }) =>
  [
    'group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all',
    isActive
      ? 'bg-sage-600 text-white shadow-soft'
      : 'text-slate-600 hover:bg-sage-50 hover:text-sage-800',
  ].join(' ');

export default function Sidebar() {
  const { logout } = useAuth();

  return (
    <>
      <div className="sticky top-0 z-30 mb-6 flex items-center justify-between rounded-[1.75rem] border border-sage-200 bg-white/90 px-4 py-3 shadow-soft backdrop-blur-sm lg:hidden">
        <div className="flex items-center gap-3 text-sage-700">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sage-100 text-sage-600">
            <span className="material-symbols-outlined">eco</span>
          </div>
          <div>
            <p className="font-display text-lg font-semibold">MindfulLife</p>
            <p className="text-xs uppercase tracking-[0.24em] text-sage-500">Dashboard</p>
          </div>
        </div>
        <NavLink className={linkClassName} to="/settings">
          <span className="material-symbols-outlined text-[20px]">settings</span>
          <span className="hidden sm:inline">Settings</span>
        </NavLink>
      </div>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col overflow-y-auto border-r border-sage-200 bg-white/90 px-6 py-6 shadow-soft backdrop-blur-sm lg:flex">
        <div className="flex items-center gap-3 pb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sage-100 text-sage-600">
            <span className="material-symbols-outlined text-2xl">eco</span>
          </div>
          <div>
            <p className="font-display text-2xl font-semibold text-sage-800">MindfulLife</p>
            <p className="text-xs uppercase tracking-[0.3em] text-sage-500">Wellness Dashboard</p>
          </div>
        </div>

        <nav className="mt-2 space-y-2">
          <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-[0.28em] text-sage-500">Practice</p>
          {primaryLinks.map((link) => (
            <NavLink key={link.to} className={linkClassName} to={link.to}>
              <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <nav className="mt-6 space-y-2">
          <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-[0.28em] text-sage-500">Insights</p>
          {secondaryLinks.map((link) => (
            <NavLink key={link.to} className={linkClassName} to={link.to}>
              <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-4 pt-6">
          <div className="rounded-[1.75rem] border border-sage-200 bg-sage-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sage-500">Daily Prompt</p>
            <p className="mt-3 font-display text-2xl font-semibold text-sage-700">How are you truly?</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">Return to your dashboard and take one small intentional step toward balance.</p>
          </div>

          <button
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-sage-200 bg-white px-4 py-3 text-sm font-semibold text-sage-700 transition-colors hover:bg-sage-50"
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
