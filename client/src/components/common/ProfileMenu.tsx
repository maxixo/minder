import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { useAuth } from '@/contexts/useAuth';

const menuLinks = [
  { label: 'Account', to: '/settings#account-overview', icon: 'account_circle' },
  { label: 'Edit Profile', to: '/settings#profile-details', icon: 'edit' },
  { label: 'Review', to: '/review', icon: 'menu_book' },
] as const;

export default function ProfileMenu() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const initials = useMemo(() => (user?.name || 'Mindful Life')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join(' '), [user?.name]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname, location.hash]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Open profile menu"
        className="flex size-10 items-center justify-center rounded-full border-2 border-[#19e63c] bg-[#19e63c]/20 text-[10px] font-semibold text-[#3a523e] transition-colors hover:bg-[#19e63c]/30 focus:outline-none focus:ring-2 focus:ring-[#19e63c]/40 dark:text-sage-100"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        {user?.avatar ? (
          <span
            aria-hidden="true"
            className="size-full rounded-full bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url("${user.avatar}")` }}
          />
        ) : (
          initials
        )}
      </button>

      {isOpen ? (
        <div
          aria-label="Profile menu"
          className="absolute right-0 top-12 z-30 w-56 overflow-hidden rounded-2xl border border-[#dce6dd] bg-white/95 p-2 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-[#15201a]/95"
          role="menu"
        >
          <div className="border-b border-[#e8ede8] px-3 pb-3 pt-2 dark:border-white/10">
            <p className="truncate text-sm font-semibold text-[#3a523e] dark:text-sage-50">{user?.name || 'Mindful member'}</p>
            <p className="truncate text-xs text-[#638869] dark:text-sage-300">{user?.email || 'No email available'}</p>
          </div>

          <div className="pt-2">
            {menuLinks.map((item) => {
              const [pathname, hash = ''] = item.to.split('#');
              const isActive = location.pathname === pathname && (!hash || location.hash === `#${hash}`);

              return (
                <Link
                  key={item.label}
                  className={clsx(
                    'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[#19e63c]/12 text-[#2f4834] dark:bg-[#19e63c]/15 dark:text-sage-50'
                      : 'text-[#4f6b55] hover:bg-[#f4f7f4] hover:text-[#2f4834] dark:text-sage-200 dark:hover:bg-white/10 dark:hover:text-sage-50'
                  )}
                  role="menuitem"
                  to={item.to}
                >
                  <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}

            <button
              className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
              onClick={handleLogout}
              role="menuitem"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Logout
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
