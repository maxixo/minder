import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/useAuth';
import { useTheme, } from '@/contexts/useTheme';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import authService from '@/services/authService';
import {
  getBrowserTimeZone,
  getExistingPushSubscription,
  getNotificationPermissionStatus,
  isPushSupported,
  requestNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  type NotificationPermissionStatus,
} from '@/services/pushService';
import userService from '@/services/userService';

type ThemePreference = 'light' | 'dark' | 'auto';

interface PreferencesState {
  theme: ThemePreference;
  notifications: {
    dailyReminder: boolean;
    reminderTime: string;
    weeklyReport: boolean;
    timezone: string;
  };
  privacy: {
    shareStats: boolean;
  };
}

const themeOptions: Array<{ value: ThemePreference; label: string; icon: string }> = [
  { value: 'light', label: 'Light', icon: 'light_mode' },
  { value: 'dark', label: 'Dark', icon: 'dark_mode' },
  { value: 'auto', label: 'Auto', icon: 'brightness_auto' },
];

const defaultPreferences: PreferencesState = {
  theme: 'light',
  notifications: {
    dailyReminder: true,
    reminderTime: '20:00',
    weeklyReport: true,
    timezone: 'UTC',
  },
  privacy: {
    shareStats: false,
  },
};

const normalizePreferences = (preferences: any): PreferencesState => ({
  theme: preferences?.theme || 'light',
  notifications: {
    dailyReminder: preferences?.notifications?.dailyReminder ?? true,
    reminderTime: preferences?.notifications?.reminderTime || '20:00',
    weeklyReport: preferences?.notifications?.weeklyReport ?? true,
    timezone: preferences?.notifications?.timezone || 'UTC',
  },
  privacy: {
    shareStats: preferences?.privacy?.shareStats ?? false,
  },
});

const getInitials = (name: string) => name
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0]?.toUpperCase())
  .join(' ');

const settingsPanelClassName = 'rounded-[1.75rem] border border-sage-200 bg-gradient-to-br from-sage-50 via-[#f8fcf8] to-sage-100/80 p-6 shadow-soft sm:p-8 dark:border-white/10 dark:bg-gradient-to-br dark:from-[#18231d] dark:via-[#121b16] dark:to-[#0f1712]';
const settingsInputClassName = 'input rounded-[1.25rem] border-sage-200 bg-sage-100/70 dark:border-white/10 dark:bg-[#101915]';
const settingsInsetClassName = 'rounded-[1.25rem] border border-sage-200 bg-sage-50/90 p-4 shadow-sm dark:border-white/10 dark:bg-white/5';

const ToggleRow = ({
  checked,
  description,
  disabled = false,
  label,
  onToggle,
}: {
  checked: boolean;
  description: string;
  disabled?: boolean;
  label: string;
  onToggle: () => void;
}) => (
  <button
    className={clsx(
      'flex w-full items-center justify-between gap-4 rounded-[1.25rem] border px-4 py-4 text-left transition-all',
      disabled
        ? 'cursor-not-allowed border-sage-200 bg-sage-100/70 opacity-60 dark:border-white/10 dark:bg-white/5'
        : 'border-sage-200 bg-sage-50/90 hover:border-sage-300 hover:bg-sage-100/80 hover:shadow-sm dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10'
    )}
    disabled={disabled}
    onClick={onToggle}
    type="button"
  >
    <div>
      <p className="font-semibold text-slate-900 dark:text-sage-50">{label}</p>
      <p className="mt-1 text-sm leading-6 text-sage-600 dark:text-sage-300">{description}</p>
    </div>
    <span className={clsx(
      'relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors',
      checked ? 'bg-sage-600' : 'bg-sage-200'
    )}>
      <span className={clsx(
        'absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-all dark:bg-sage-50',
        checked ? 'left-6' : 'left-1'
      )} />
    </span>
  </button>
);

export default function Settings() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, updateProfile, user } = useAuth();
  const { isDarkMode, setThemePreference } = useTheme();
  const { canInstall, install, isInstalled, isIosLikeBrowser } = usePwaInstall();

  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [preferences, setPreferences] = useState<PreferencesState>(defaultPreferences);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermissionStatus>('unsupported');
  const [pushSupported, setPushSupported] = useState(false);
  const [isPushSubscribed, setIsPushSubscribed] = useState(false);
  const [isPushServerConfigured, setIsPushServerConfigured] = useState(false);
  const [subscriptionCount, setSubscriptionCount] = useState(0);
  const [isUpdatingPush, setIsUpdatingPush] = useState(false);
  const [isSendingTestPush, setIsSendingTestPush] = useState(false);

  useEffect(() => {
    if (!user) return;

    setName(user.name || '');
    setAvatar(user.avatar || '');
    setPreferences(normalizePreferences(user.preferences));

    let cancelled = false;

    void userService.getPreferences()
      .then((response) => {
        if (!cancelled) {
          setPreferences(normalizePreferences(response.data));
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    const detectedPushSupport = isPushSupported();
    setPushSupported(detectedPushSupport);
    setNotificationPermission(getNotificationPermissionStatus());

    if (!detectedPushSupport) return;

    let cancelled = false;

    void Promise.all([
      getExistingPushSubscription(),
      userService.getPushSubscriptionStatus().catch(() => null),
    ]).then(([browserSubscription, statusResponse]) => {
      if (cancelled) return;

      setIsPushSubscribed(Boolean(browserSubscription));
      setIsPushServerConfigured(Boolean(statusResponse?.data?.configured));
      setSubscriptionCount(statusResponse?.data?.subscriptionCount || 0);

      const serverTimezone = statusResponse?.data?.timezone;
      if (serverTimezone) {
        setPreferences((current) => ({
          ...current,
          notifications: {
            ...current.notifications,
            timezone: serverTimezone,
          },
        }));
      }
    }).catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!location.hash) return;

    const section = document.getElementById(location.hash.slice(1));
    if (!section) return;

    requestAnimationFrame(() => {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [location.hash]);

  const firstName = user?.name?.split(' ')[0] || 'Friend';
  const memberSince = user?.createdAt ? format(new Date(user.createdAt), 'MMMM yyyy') : 'recently';
  const initials = getInitials(name || user?.name || 'Mindful Life');

  const overviewItems = useMemo(
    () => [
      {
        label: 'Theme',
        value: preferences.theme === 'auto' ? 'Auto-switching with your device' : `${preferences.theme[0].toUpperCase()}${preferences.theme.slice(1)} mode`,
        icon: preferences.theme === 'dark' ? 'dark_mode' : preferences.theme === 'light' ? 'light_mode' : 'brightness_auto',
      },
      {
        label: 'Daily Reminder',
        value: preferences.notifications.dailyReminder
          ? `Enabled at ${preferences.notifications.reminderTime} (${preferences.notifications.timezone})`
          : 'Currently paused',
        icon: 'notifications_active',
      },
      {
        label: 'Privacy',
        value: preferences.privacy.shareStats ? 'Anonymous stats sharing enabled' : 'Stats stay private to your account',
        icon: preferences.privacy.shareStats ? 'share' : 'lock',
      },
    ],
    [preferences]
  );

  const installStatusMessage = useMemo(() => {
    if (isInstalled) return 'MindfulLife is already installed on this device.';
    if (canInstall) return 'This browser can install MindfulLife right now.';
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      return 'Chrome only shows the install flow in a secure context like HTTPS or localhost.';
    }
    if (import.meta.env.DEV) {
      return 'Chrome has not exposed the install prompt yet. In local development, refresh once after the service worker registers, then try again.';
    }
    return 'Chrome has not exposed the install prompt in this session yet. Refresh once, then check DevTools > Application > Manifest if install still does not appear.';
  }, [canInstall, isInstalled]);

  const notificationStatusDetail = useMemo(() => {
    if (!pushSupported) return 'This browser does not support service worker push notifications.';
    if (!isPushServerConfigured) {
      return 'The server is not configured to send web push yet. Add VAPID keys on the backend before testing delivery.';
    }
    if (notificationPermission === 'denied') {
      return 'Chrome is blocking notifications for this site. Open the padlock in the address bar, set Notifications to Allow, then reload the page.';
    }
    if (notificationPermission === 'default') {
      return 'Notifications have not been approved for this site yet.';
    }
    if (!isPushSubscribed) {
      return 'Permission is granted, but this device is not subscribed yet. Use Enable Notifications to create a push subscription.';
    }
    return 'This device is ready to receive push reminders.';
  }, [isPushServerConfigured, isPushSubscribed, notificationPermission, pushSupported]);

  const handleProfileSave = async () => {
    const trimmedName = name.trim();
    const trimmedAvatar = avatar.trim();

    if (!trimmedName) {
      setProfileError('Name is required.');
      return;
    }

    setProfileError('');
    setIsSavingProfile(true);

    try {
      await updateProfile({
        name: trimmedName,
        avatar: trimmedAvatar || null,
      });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePreferencesSave = async () => {
    setIsSavingPreferences(true);
    const timezone = preferences.notifications.timezone || getBrowserTimeZone();

    try {
      const response = await userService.updatePreferences({
        ...preferences,
        notifications: {
          ...preferences.notifications,
          timezone,
        },
      });
      setPreferences(normalizePreferences(response.data));
      toast.success('Preferences updated');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to update preferences');
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const handleInstallApp = async () => {
    try {
      const result = await install();
      if (result?.outcome === 'accepted') {
        toast.success('MindfulLife is ready to use from your home screen.');
      }
    } catch {
      toast.error('Unable to start the install flow.');
    }
  };

  const handleEnableNotifications = async () => {
    if (!pushSupported) {
      toast.error('Push notifications are not supported in this browser.');
      return;
    }

    setIsUpdatingPush(true);

    try {
      const permission = await requestNotificationPermission();
      setNotificationPermission(permission);

      if (permission !== 'granted') {
        toast.error(
          permission === 'denied'
            ? 'Chrome is blocking notifications for this site. Change the site permission to Allow and reload the page.'
            : 'Notification permission is required for daily reminders.'
        );
        return;
      }

      const timezone = preferences.notifications.timezone || getBrowserTimeZone();
      const subscription = await subscribeToPush();

      await userService.savePushSubscription({
        subscription,
        timezone,
      });

      setPreferences((current) => ({
        ...current,
        notifications: {
          ...current.notifications,
          timezone,
        },
      }));
      setIsPushSubscribed(true);
      setIsPushServerConfigured(true);
      setSubscriptionCount((current) => Math.max(1, current));
      toast.success('Daily reminder notifications enabled.');
    } catch (error: any) {
      toast.error(error?.message || 'Unable to enable notifications.');
    } finally {
      setIsUpdatingPush(false);
    }
  };

  const handleDisableNotifications = async () => {
    setIsUpdatingPush(true);

    try {
      const existingSubscription = await getExistingPushSubscription();
      const endpoint = existingSubscription?.endpoint || undefined;

      if (existingSubscription) {
        await existingSubscription.unsubscribe();
      } else {
        await unsubscribeFromPush();
      }

      await userService.deletePushSubscription(endpoint ? { endpoint } : undefined);
      setIsPushSubscribed(false);
      setSubscriptionCount(0);
      toast.success('Daily reminder notifications disabled.');
    } catch (error: any) {
      toast.error(error?.message || 'Unable to disable notifications.');
    } finally {
      setIsUpdatingPush(false);
    }
  };

  const handleSendTestNotification = async () => {
    setIsSendingTestPush(true);

    try {
      const response = await userService.sendTestPushNotification();
      toast.success(response.message || 'Test notification sent');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to send test notification');
    } finally {
      setIsSendingTestPush(false);
    }
  };

  const handlePasswordSave = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Fill in all password fields before saving.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setPasswordError('');
    setIsSavingPassword(true);

    try {
      const response = await authService.updatePassword({ currentPassword, newPassword });
      toast.success(response.message || 'Password updated');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to update password');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const response = await userService.exportData();
      const blob = new Blob([response.data], { type: 'application/json' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const header = response.headers['content-disposition'];
      const filenameMatch = /filename="([^"]+)"/.exec(header || '');

      link.href = downloadUrl;
      link.download = filenameMatch?.[1] || `mindful-export-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast.success('Your data export has started');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      toast.error('Type DELETE to confirm account removal.');
      return;
    }

    setIsDeleting(true);

    try {
      const response = await userService.deleteAccount();
      toast.success(response.message || 'Account deleted');
      logout();
      navigate('/login', { replace: true });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="animate-fade-in pb-10 text-slate-900 dark:text-sage-50">
      <section className="overflow-hidden rounded-[2rem] border border-sage-200 bg-gradient-to-br from-white via-sage-50 to-sand-50 shadow-soft dark:border-white/10 dark:bg-gradient-to-br dark:from-[#18231d] dark:via-[#121b16] dark:to-[#0f1712]" id="account-overview">
        <div className="flex flex-col gap-6 px-6 py-8 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-10">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sage-500 dark:text-sage-300">Settings</p>
            <h1 className="mt-3 font-display text-4xl font-semibold text-sage-900 sm:text-5xl dark:text-sage-50">
              A calmer space for your account, {firstName}.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-sage-600 sm:text-lg dark:text-sage-200">
              Shape how MindfulLife feels day to day, protect your privacy, and keep your account details aligned with the rhythm you want.
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-[1.5rem] border border-sage-200 bg-sage-100/80 p-5 shadow-sm backdrop-blur sm:min-w-[300px] dark:border-white/10 dark:bg-white/5">
            {avatar ? (
              <div
                aria-label="Profile avatar"
                className="h-16 w-16 rounded-2xl bg-cover bg-center bg-no-repeat shadow-sm"
                role="img"
                style={{ backgroundImage: `url("${avatar}")` }}
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sage-100 text-lg font-semibold text-sage-700 shadow-sm dark:bg-white/10 dark:text-sage-100">
                {initials}
              </div>
            )}

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sage-500 dark:text-sage-300">Account Snapshot</p>
              <p className="mt-2 font-display text-2xl font-semibold text-sage-800 dark:text-sage-50">{user?.name || 'Mindful member'}</p>
              <p className="mt-1 text-sm text-sage-600 dark:text-sage-200">{user?.email || 'No email available'}</p>
              <p className="mt-2 text-sm text-sage-500 dark:text-sage-300">Member since {memberSince}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
        <div className="space-y-8">
          <section className={settingsPanelClassName} id="profile-details">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sage-100 text-sage-700 dark:bg-white/10 dark:text-sage-100">
                <span className="material-symbols-outlined">badge</span>
              </div>
              <div>
                <h2 className="font-display text-2xl font-semibold text-sage-900 dark:text-sage-50">Profile Details</h2>
                <p className="text-sm text-sage-500 dark:text-sage-300">Update the parts of your account that feel most personal and visible.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="label" htmlFor="settings-name">Full Name</label>
                <input
                  className={settingsInputClassName}
                  id="settings-name"
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  type="text"
                  value={name}
                />
              </div>

              <div className="md:col-span-2">
                <label className="label" htmlFor="settings-avatar">Avatar URL</label>
                <input
                  className={settingsInputClassName}
                  id="settings-avatar"
                  onChange={(event) => setAvatar(event.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  type="url"
                  value={avatar}
                />
              </div>

              <div className="md:col-span-2">
                <label className="label" htmlFor="settings-email">Email Address</label>
                <input
                  className="input rounded-[1.25rem] border-sage-200 bg-sage-100/80 text-sage-500 dark:border-white/10 dark:bg-white/5 dark:text-sage-300"
                  disabled
                  id="settings-email"
                  type="email"
                  value={user?.email || ''}
                />
                <p className="helper-text">Email changes are not available in this version.</p>
              </div>
            </div>

            {profileError ? <p className="error-text mt-4">{profileError}</p> : null}

            <div className="mt-6 flex justify-end">
              <button className="btn btn-primary rounded-full px-6" disabled={isSavingProfile} onClick={handleProfileSave} type="button">
                <span className="material-symbols-outlined text-[18px]">save</span>
                {isSavingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </section>

          <section className={settingsPanelClassName}>
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sage-100 text-sage-700 dark:bg-white/10 dark:text-sage-100">
                <span className="material-symbols-outlined">tune</span>
              </div>
              <div>
                <h2 className="font-display text-2xl font-semibold text-sage-900 dark:text-sage-50">Preferences</h2>
                <p className="text-sm text-sage-500 dark:text-sage-300">Choose the pace, reminders, and privacy settings that best support your routine.</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sage-500 dark:text-sage-300">Theme</p>
                <span className="inline-flex items-center gap-2 rounded-full bg-sage-100 px-3 py-1 text-xs font-semibold text-sage-700 dark:bg-white/10 dark:text-sage-100">
                  <span className="material-symbols-outlined text-[16px]">{isDarkMode ? 'dark_mode' : 'light_mode'}</span>
                  {isDarkMode ? 'Dark active' : 'Light active'}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {themeOptions.map((option) => {
                  const isActive = preferences.theme === option.value;

                  return (
                    <button
                      key={option.value}
                      className={clsx(
                        'flex items-center justify-center gap-2 rounded-[1.25rem] border px-4 py-4 text-sm font-semibold transition-all',
                        isActive
                          ? 'border-sage-300 bg-sage-100 text-sage-900 shadow-sm dark:border-sage-400/50 dark:bg-white/10 dark:text-sage-50'
                          : 'border-sage-200 bg-sage-50/90 text-sage-600 hover:border-sage-300 hover:bg-sage-100/80 dark:border-white/10 dark:bg-white/5 dark:text-sage-200 dark:hover:bg-white/10'
                      )}
                      onClick={() => {
                        setPreferences((current) => ({ ...current, theme: option.value }));
                        setThemePreference(option.value);
                      }}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[18px]">{option.icon}</span>
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <ToggleRow
                checked={preferences.notifications.dailyReminder}
                description="Receive a daily nudge to pause and check in with yourself."
                label="Daily reminder"
                onToggle={() => setPreferences((current) => ({
                  ...current,
                  notifications: {
                    ...current.notifications,
                    dailyReminder: !current.notifications.dailyReminder,
                  },
                }))}
              />

              <div className={clsx(
                'rounded-[1.25rem] border border-sage-200 bg-sage-100/70 p-4 transition-opacity dark:border-white/10 dark:bg-white/5',
                !preferences.notifications.dailyReminder && 'opacity-60'
              )}>
                <label className="label" htmlFor="settings-reminder-time">Reminder Time</label>
                <input
                  className="input rounded-[1rem] border-sage-200 bg-sage-50 dark:border-white/10 dark:bg-[#101915]"
                  disabled={!preferences.notifications.dailyReminder}
                  id="settings-reminder-time"
                  onChange={(event) => setPreferences((current) => ({
                    ...current,
                    notifications: {
                      ...current.notifications,
                      reminderTime: event.target.value,
                    },
                  }))}
                  type="time"
                  value={preferences.notifications.reminderTime}
                />
              </div>

              <div className={clsx(
                'rounded-[1.25rem] border border-sage-200 bg-sage-100/70 p-4 transition-opacity dark:border-white/10 dark:bg-white/5',
                !preferences.notifications.dailyReminder && 'opacity-60'
              )}>
                <label className="label" htmlFor="settings-reminder-timezone">Reminder Timezone</label>
                <input
                  className="input rounded-[1rem] border-sage-200 bg-sage-50 dark:border-white/10 dark:bg-[#101915]"
                  disabled={!preferences.notifications.dailyReminder}
                  id="settings-reminder-timezone"
                  onChange={(event) => setPreferences((current) => ({
                    ...current,
                    notifications: {
                      ...current.notifications,
                      timezone: event.target.value,
                    },
                  }))}
                  placeholder="America/New_York"
                  type="text"
                  value={preferences.notifications.timezone}
                />
                <p className="helper-text">Use an IANA timezone like `America/New_York` so reminders arrive at the right local hour.</p>
              </div>

              <ToggleRow
                checked={preferences.notifications.weeklyReport}
                description="Keep weekly summary reminders turned on so your broader patterns stay visible."
                label="Weekly report reminders"
                onToggle={() => setPreferences((current) => ({
                  ...current,
                  notifications: {
                    ...current.notifications,
                    weeklyReport: !current.notifications.weeklyReport,
                  },
                }))}
              />

              <ToggleRow
                checked={preferences.privacy.shareStats}
                description="Allow anonymous wellness stats to help improve future product insights."
                label="Share anonymous stats"
                onToggle={() => setPreferences((current) => ({
                  ...current,
                  privacy: {
                    ...current.privacy,
                    shareStats: !current.privacy.shareStats,
                  },
                }))}
              />
            </div>

            <div className="mt-6 flex justify-end">
              <button className="btn btn-primary rounded-full px-6" disabled={isSavingPreferences} onClick={handlePreferencesSave} type="button">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                {isSavingPreferences ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </section>

          <section className={settingsPanelClassName}>
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sage-100 text-sage-700 dark:bg-white/10 dark:text-sage-100">
                <span className="material-symbols-outlined">password</span>
              </div>
              <div>
                <h2 className="font-display text-2xl font-semibold text-sage-900 dark:text-sage-50">Password & Security</h2>
                <p className="text-sm text-sage-500 dark:text-sage-300">Keep your account protected with a fresh password when you need one.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="label" htmlFor="settings-current-password">Current Password</label>
                <input
                  className={settingsInputClassName}
                  id="settings-current-password"
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  type="password"
                  value={currentPassword}
                />
              </div>

              <div>
                <label className="label" htmlFor="settings-new-password">New Password</label>
                <input
                  className={settingsInputClassName}
                  id="settings-new-password"
                  onChange={(event) => setNewPassword(event.target.value)}
                  type="password"
                  value={newPassword}
                />
              </div>

              <div>
                <label className="label" htmlFor="settings-confirm-password">Confirm New Password</label>
                <input
                  className={settingsInputClassName}
                  id="settings-confirm-password"
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  type="password"
                  value={confirmPassword}
                />
              </div>
            </div>

            {passwordError ? <p className="error-text mt-4">{passwordError}</p> : null}

            <div className="mt-6 flex justify-end">
              <button className="btn btn-primary rounded-full px-6" disabled={isSavingPassword} onClick={handlePasswordSave} type="button">
                <span className="material-symbols-outlined text-[18px]">shield_lock</span>
                {isSavingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </section>
        </div>

        <aside className="space-y-8">
          <section className="rounded-[1.75rem] border border-sage-200 bg-gradient-to-b from-sage-50 via-[#f7fbf7] to-sage-100/80 p-6 shadow-soft sm:p-8 dark:border-white/10 dark:bg-gradient-to-b dark:from-[#18231d] dark:via-[#121b16] dark:to-[#0f1712]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sage-500 dark:text-sage-300">Account Overview</p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-sage-900 dark:text-sage-50">Your current rhythm</h2>
            <p className="mt-3 text-sm leading-7 text-sage-600 dark:text-sage-200">
              These settings shape how the app feels in your day, from visual tone to when gentle prompts arrive.
            </p>

            <div className="mt-6 space-y-3">
              {overviewItems.map((item) => (
                <div key={item.label} className={settingsInsetClassName}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-100 text-sage-700 dark:bg-white/10 dark:text-sage-100">
                      <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sage-500 dark:text-sage-300">{item.label}</p>
                      <p className="mt-1 text-sm font-medium leading-6 text-slate-700 dark:text-sage-100">{item.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={settingsPanelClassName}>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sage-100 text-sage-700 dark:bg-white/10 dark:text-sage-100">
                <span className="material-symbols-outlined">install_mobile</span>
              </div>
              <div className="flex-1">
                <h3 className="font-display text-2xl font-semibold text-sage-900 dark:text-sage-50">App Install & Notifications</h3>
                <p className="mt-2 text-sm leading-7 text-sage-600 dark:text-sage-200">
                  Install MindfulLife like an app and keep daily reflection reminders connected to this device.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className={settingsInsetClassName}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sage-500 dark:text-sage-300">Install Status</p>
                <p className="mt-2 text-sm font-medium text-slate-700 dark:text-sage-100">
                  {installStatusMessage}
                </p>
                {isIosLikeBrowser && !isInstalled ? (
                  <p className="mt-2 text-sm text-sage-600 dark:text-sage-300">
                    On iPhone or iPad, use Safari&apos;s Share menu and choose Add to Home Screen.
                  </p>
                ) : null}
              </div>

              <div className={settingsInsetClassName}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sage-500 dark:text-sage-300">Notification Status</p>
                <p className="mt-2 text-sm font-medium text-slate-700 dark:text-sage-100">
                  Permission: {notificationPermission}. Device subscription: {isPushSubscribed ? 'active' : 'inactive'}.
                </p>
                <p className="mt-1 text-sm text-sage-600 dark:text-sage-300">
                  {notificationStatusDetail}
                </p>
                <p className="mt-1 text-sm text-sage-600 dark:text-sage-300">
                  Server subscriptions linked to your account: {subscriptionCount}.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              {canInstall ? (
                <button className="btn btn-primary rounded-full" onClick={handleInstallApp} type="button">
                  <span className="material-symbols-outlined text-[18px]">download_for_offline</span>
                  Install MindfulLife
                </button>
              ) : null}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  className="btn btn-secondary rounded-full"
                  disabled={!pushSupported || isUpdatingPush}
                  onClick={handleEnableNotifications}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">notifications_active</span>
                  {isUpdatingPush ? 'Connecting...' : 'Enable Notifications'}
                </button>

                <button
                  className="btn btn-ghost rounded-full border border-sage-200 dark:border-white/10"
                  disabled={!isPushSubscribed || isUpdatingPush}
                  onClick={handleDisableNotifications}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">notifications_off</span>
                  Disable Notifications
                </button>
              </div>

              <button
                className="btn btn-secondary rounded-full"
                disabled={!isPushSubscribed || isSendingTestPush}
                onClick={handleSendTestNotification}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
                {isSendingTestPush ? 'Sending Test...' : 'Send Test Notification'}
              </button>
            </div>
          </section>

          <section className={settingsPanelClassName}>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sage-100 text-sage-700 dark:bg-white/10 dark:text-sage-100">
                <span className="material-symbols-outlined">download</span>
              </div>
              <div>
                <h3 className="font-display text-2xl font-semibold text-sage-900 dark:text-sage-50">Export Your Data</h3>
                <p className="mt-2 text-sm leading-7 text-sage-600 dark:text-sage-200">
                  Download a JSON copy of your profile basics and journal entries for personal backup or migration.
                </p>
              </div>
            </div>

            <button className="btn btn-secondary mt-6 w-full rounded-full" disabled={isExporting} onClick={handleExport} type="button">
              <span className="material-symbols-outlined text-[18px]">file_download</span>
              {isExporting ? 'Preparing Export...' : 'Download Export'}
            </button>
          </section>

          <section className="rounded-[1.75rem] border border-red-200 bg-gradient-to-b from-red-50/90 to-red-100/70 p-6 shadow-soft sm:p-8 dark:border-red-500/30 dark:bg-gradient-to-b dark:from-red-950/40 dark:to-[#261313]">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-200">
                <span className="material-symbols-outlined">warning</span>
              </div>
              <div>
                <h3 className="font-display text-2xl font-semibold text-red-900 dark:text-red-100">Danger Zone</h3>
                <p className="mt-2 text-sm leading-7 text-red-800/80 dark:text-red-200/85">
                  Deleting your account permanently removes your profile and all saved journal data. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-[1.25rem] border border-red-200 bg-red-50/85 p-4 dark:border-red-500/30 dark:bg-red-950/20">
              <label className="label text-red-900 dark:text-red-100" htmlFor="settings-delete-confirmation">Type DELETE to confirm</label>
              <input
                className="input rounded-[1rem] border-red-200 bg-white/80 focus:border-red-400 focus:ring-red-100 dark:border-red-500/30 dark:bg-[#241315] dark:text-red-50 dark:placeholder:text-red-200/40 dark:focus:ring-red-500/10"
                id="settings-delete-confirmation"
                onChange={(event) => setDeleteConfirmation(event.target.value)}
                placeholder="DELETE"
                type="text"
                value={deleteConfirmation}
              />
            </div>

            <button
              className="btn mt-6 w-full rounded-full bg-red-600 text-white hover:bg-red-700 focus:ring-red-300"
              disabled={isDeleting || deleteConfirmation !== 'DELETE'}
              onClick={handleDeleteAccount}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">delete_forever</span>
              {isDeleting ? 'Deleting Account...' : 'Delete Account Forever'}
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}
