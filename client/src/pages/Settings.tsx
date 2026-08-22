import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { format } from 'date-fns';
import { toast } from 'sonner';
import UserAvatar from '@/components/common/UserAvatar';
import { getSafeAvatarUrl } from '@/lib/avatar';
import { useAuth } from '@/contexts/useAuth';
import { useTheme, } from '@/contexts/useTheme';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import authService from '@/services/authService';
import billingService from '@/services/billingService';
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
import type { BillingInterval, BillingSummary, SubscriptionStatus } from '@/types/billing';

type ThemePreference = 'light' | 'dark' | 'auto';

interface PreferencesState {
  theme: ThemePreference;
  notifications: {
    dailyReminder: boolean;
    reminderTime: string;
    inspirationReminder: boolean;
    inspirationReminderTime: string;
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
    inspirationReminder: true,
    inspirationReminderTime: '08:30',
    weeklyReport: true,
    timezone: 'UTC',
  },
  privacy: {
    shareStats: false,
  },
};

const emptyBillingSummary: BillingSummary = {
  plan: 'free',
  status: 'free',
  billingProvider: null,
  billingInterval: null,
  currentPeriodEnd: null,
  trialEndsAt: null,
  cancelAtPeriodEnd: false,
  premiumInterestAt: null,
  premiumInterestInterval: null,
  checkout: {
    monthly: false,
    annual: false,
  },
  portalAvailable: false,
  pricing: {
    monthly: {
      amount: 8,
      currency: 'USD',
      interval: 'month',
    },
    annual: {
      amount: 60,
      currency: 'USD',
      interval: 'year',
      monthlyEquivalent: 5,
      savingsPercent: 38,
    },
  },
  invoices: [],
};

const billingStatusLabel: Record<SubscriptionStatus, string> = {
  free: 'Free',
  trialing: 'Trial active',
  active: 'Active',
  past_due: 'Payment needs attention',
  canceled: 'Canceled',
};

const formatBillingDate = (value: string | null) => (
  value ? format(new Date(value), 'MMMM d, yyyy') : null
);

const normalizePreferences = (preferences: any): PreferencesState => ({
  theme: preferences?.theme || 'light',
  notifications: {
    dailyReminder: preferences?.notifications?.dailyReminder ?? true,
    reminderTime: preferences?.notifications?.reminderTime || '20:00',
    inspirationReminder: preferences?.notifications?.inspirationReminder ?? true,
    inspirationReminderTime: preferences?.notifications?.inspirationReminderTime || '08:30',
    weeklyReport: preferences?.notifications?.weeklyReport ?? true,
    timezone: preferences?.notifications?.timezone || 'UTC',
  },
  privacy: {
    shareStats: preferences?.privacy?.shareStats ?? false,
  },
});

const settingsPanelClassName = 'panel-shell-gradient';
const settingsInputClassName = 'input rounded-[1.25rem] border-sage-200 bg-sage-100/70 dark:border-white/10 dark:bg-[#101915]';
const settingsInsetClassName = 'panel-inset';
const MAX_AVATAR_FILE_BYTES = 2 * 1024 * 1024;
const ACCEPTED_AVATAR_FILE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();

  reader.onload = () => {
    if (typeof reader.result !== 'string') {
      reject(new Error('Unable to read the selected image file.'));
      return;
    }

    resolve(reader.result);
  };

  reader.onerror = () => {
    reject(new Error('Unable to read the selected image file.'));
  };

  reader.readAsDataURL(file);
});

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
      <p className="font-medium text-slate-900 dark:text-sage-50">{label}</p>
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
  const { logout, syncUser, updateProfile, user } = useAuth();
  const { isDarkMode, setThemePreference } = useTheme();
  const { canInstall, install, isInstalled, isIosLikeBrowser } = usePwaInstall();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

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
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
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
  const [billing, setBilling] = useState<BillingSummary>(emptyBillingSummary);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('annual');
  const [isBillingLoading, setIsBillingLoading] = useState(true);
  const [isBillingActionPending, setIsBillingActionPending] = useState(false);
  const safeAvatarUrl = getSafeAvatarUrl(avatar);

  const applyPushStatus = (browserSubscription: Awaited<ReturnType<typeof getExistingPushSubscription>>, statusResponse: any) => {
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
  };

  const loadPushStatus = async () => {
    const [browserSubscription, statusResponse] = await Promise.all([
      getExistingPushSubscription(),
      userService.getPushSubscriptionStatus().catch(() => null),
    ]);

    return {
      browserSubscription,
      statusResponse,
    };
  };

  useEffect(() => {
    if (!user) return;

    setName(user.name || '');
    setAvatar(user.avatarUrl || user.avatar || '');
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
    if (!user) return;

    let cancelled = false;
    setIsBillingLoading(true);

    void billingService.getStatus()
      .then((response) => {
        if (cancelled) return;
        setBilling(response.data);
        setBillingInterval(response.data.billingInterval || response.data.premiumInterestInterval || 'annual');
      })
      .catch(() => {
        if (!cancelled) setBilling(emptyBillingSummary);
      })
      .finally(() => {
        if (!cancelled) setIsBillingLoading(false);
      });

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

    void loadPushStatus().then(({ browserSubscription, statusResponse }) => {
      if (cancelled) return;

      applyPushStatus(browserSubscription, statusResponse);
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

  const overviewItems = useMemo(
    () => [
      {
        label: 'Theme',
        value: preferences.theme === 'auto' ? 'Auto-switching with your device' : `${preferences.theme[0].toUpperCase()}${preferences.theme.slice(1)} mode`,
        icon: preferences.theme === 'dark' ? 'dark_mode' : preferences.theme === 'light' ? 'light_mode' : 'brightness_auto',
      },
      {
        label: 'Reflection Reminder',
        value: preferences.notifications.dailyReminder
          ? `Enabled at ${preferences.notifications.reminderTime} (${preferences.notifications.timezone})`
          : 'Currently paused',
        icon: 'edit_note',
      },
      {
        label: 'Daily Inspiration',
        value: preferences.notifications.inspirationReminder
          ? `Enabled at ${preferences.notifications.inspirationReminderTime} (${preferences.notifications.timezone})`
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
    if (isIosLikeBrowser) {
      return 'On iPhone or iPad, install MindfulLife from Safari using Share > Add to Home Screen.';
    }
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      return 'App installation is only available on HTTPS or localhost.';
    }
    if (import.meta.env.DEV) {
      return 'The browser has not exposed the install prompt yet. Refresh once after the service worker registers, then try again.';
    }
    return 'The browser has not exposed the install prompt in this session yet. Refresh once, then check the installed-app settings if install still does not appear.';
  }, [canInstall, isInstalled, isIosLikeBrowser]);

  const getEffectiveReminderTimeZone = () => getBrowserTimeZone();

  const notificationStatusDetail = useMemo(() => {
    if (isIosLikeBrowser && !isInstalled) {
      return 'On iPhone or iPad, install MindfulLife to the Home Screen in Safari before enabling notifications.';
    }
    if (!pushSupported) return 'This browser does not support service worker push notifications.';
    if (!isPushServerConfigured) {
      return 'The server is not configured to send web push yet. Add VAPID keys on the backend before testing delivery.';
    }
    if (
      !preferences.notifications.dailyReminder
      && !preferences.notifications.inspirationReminder
      && isPushSubscribed
    ) {
      return 'Push is enabled on this device, but both scheduled reminders are paused in your account preferences.';
    }
    if (notificationPermission === 'denied') {
      return 'Notifications are blocked for this site. Update the site permission in your browser settings, then reload the page.';
    }
    if (notificationPermission === 'default') {
      return 'Notifications have not been approved for this site yet.';
    }
    if (!isPushSubscribed) {
      return 'Permission is granted, but this device is not subscribed yet. Use Enable Notifications to create a push subscription.';
    }
    return 'This device is ready to receive your configured reflection and inspiration reminders.';
  }, [
    isInstalled,
    isIosLikeBrowser,
    isPushServerConfigured,
    isPushSubscribed,
    notificationPermission,
    preferences.notifications.dailyReminder,
    preferences.notifications.inspirationReminder,
    pushSupported,
  ]);

  const billingRenewalMessage = useMemo(() => {
    const trialEnd = formatBillingDate(billing.trialEndsAt);
    const periodEnd = formatBillingDate(billing.currentPeriodEnd);

    if (billing.status === 'trialing' && trialEnd) {
      return `Trial ends ${trialEnd}.`;
    }
    if (billing.cancelAtPeriodEnd && periodEnd) {
      return `Access remains available until ${periodEnd}.`;
    }
    if (billing.status === 'active' && periodEnd) {
      return `Renews ${periodEnd}.`;
    }
    if (billing.status === 'past_due') {
      return 'Update payment details to keep Premium access active.';
    }
    if (billing.status === 'canceled') {
      return 'This subscription is no longer renewing.';
    }
    return 'No renewal date. The Free plan has no recurring charge.';
  }, [billing]);

  const handleUpgrade = async () => {
    setIsBillingActionPending(true);

    try {
      if (billing.checkout[billingInterval]) {
        const response = await billingService.createCheckout(billingInterval);
        window.location.assign(response.data.url);
        return;
      }

      const response = await billingService.requestPremiumAccess(billingInterval);
      setBilling(response.data);
      toast.success(response.message || 'Premium access request saved');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to start the Premium upgrade');
    } finally {
      setIsBillingActionPending(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!billing.portalAvailable) {
      toast.info('Subscription management will appear here when the billing portal is connected.');
      return;
    }

    setIsBillingActionPending(true);

    try {
      const response = await billingService.getPortal();
      window.location.assign(response.data.url);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to open subscription management');
    } finally {
      setIsBillingActionPending(false);
    }
  };

  const enablePushForCurrentDevice = async (timezone: string) => {
    const permission = await requestNotificationPermission();
    setNotificationPermission(permission);

    if (permission !== 'granted') {
      throw new Error(
        permission === 'denied'
          ? 'Notifications are blocked for this site. Change the site permission to Allow and reload the page.'
          : 'Notification permission is required for daily inspiration delivery.'
      );
    }

    const subscription = await subscribeToPush();
    const response = await userService.savePushSubscription({
      subscription,
      timezone,
    });

    const { browserSubscription, statusResponse } = await loadPushStatus();
    applyPushStatus(browserSubscription, statusResponse);

    return response;
  };

  const syncCurrentDeviceSubscriptionTimeZone = async (timezone: string) => {
    const existingSubscription = await getExistingPushSubscription();
    if (!existingSubscription) return null;

    return userService.savePushSubscription({
      subscription: existingSubscription.toJSON(),
      timezone,
    });
  };

  const handleProfileSave = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setProfileError('Name is required.');
      return;
    }

    setProfileError('');
    setIsSavingProfile(true);

    try {
      await updateProfile({
        name: trimmedName,
      });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAvatarSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    if (!ACCEPTED_AVATAR_FILE_TYPES.includes(selectedFile.type)) {
      toast.error('Choose a PNG, JPEG, WEBP, or GIF image.');
      event.target.value = '';
      return;
    }

    if (selectedFile.size > MAX_AVATAR_FILE_BYTES) {
      toast.error('Avatar images must be 2MB or smaller.');
      event.target.value = '';
      return;
    }

    setProfileError('');
    setIsUploadingAvatar(true);

    try {
      const fileDataUrl = await readFileAsDataUrl(selectedFile);
      const response = await authService.uploadProfileAvatar(fileDataUrl);
      const nextAvatar = response?.data?.avatar || '';

      syncUser(response?.data);
      setAvatar(nextAvatar);
      toast.success('Avatar updated');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Unable to upload avatar');
    } finally {
      event.target.value = '';
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarRemove = async () => {
    setProfileError('');
    setIsUploadingAvatar(true);

    try {
      const response = await authService.deleteProfileAvatar();
      syncUser(response?.data);
      setAvatar('');
      toast.success('Avatar removed');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to remove avatar');
    } finally {
      if (avatarInputRef.current) {
        avatarInputRef.current.value = '';
      }
      setIsUploadingAvatar(false);
    }
  };

  const handlePreferencesSave = async () => {
    setIsSavingPreferences(true);
    const timezone = getEffectiveReminderTimeZone();

    try {
      const response = await userService.updatePreferences({
        ...preferences,
        notifications: {
          ...preferences.notifications,
          timezone,
        },
      });
      setPreferences(normalizePreferences(response.data));

      if (isPushSubscribed) {
        await syncCurrentDeviceSubscriptionTimeZone(timezone);
      }

      const hasScheduledNotifications = (
        response.data.notifications.dailyReminder
        || response.data.notifications.inspirationReminder
      );

      if (hasScheduledNotifications && !isPushSubscribed) {
        if (!pushSupported) {
          toast.error('Notification schedules were saved, but this browser does not support push notifications.');
          return;
        }

        try {
          await enablePushForCurrentDevice(timezone);
          toast.success('Preferences updated and notifications enabled for this device.');
          return;
        } catch (error: any) {
          toast.error(error?.message || 'Preferences were saved, but notifications could not be enabled for this device.');
          return;
        }
      }

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
    if (isIosLikeBrowser && !isInstalled) {
      toast.error('On iPhone or iPad, add MindfulLife to the Home Screen in Safari before enabling notifications.');
      return;
    }

    if (!pushSupported) {
      toast.error('Push notifications are not supported in this browser.');
      return;
    }

    setIsUpdatingPush(true);

    try {
      const timezone = getEffectiveReminderTimeZone();
      const pushResponse = await enablePushForCurrentDevice(timezone);
      const preferencesResponse = await userService.updatePreferences({
        ...preferences,
        notifications: {
          ...preferences.notifications,
          timezone,
        },
      });

      setPreferences(normalizePreferences(preferencesResponse.data));
      setSubscriptionCount(pushResponse?.data?.subscriptionCount || 0);
      const { browserSubscription, statusResponse } = await loadPushStatus();
      applyPushStatus(browserSubscription, statusResponse);
      toast.success('Notifications enabled.');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Unable to enable notifications.');
    } finally {
      setIsUpdatingPush(false);
    }
  };

  const handleDisableNotifications = async () => {
    setIsUpdatingPush(true);

    try {
      const existingSubscription = await getExistingPushSubscription();
      const endpoint = existingSubscription?.endpoint;

      if (existingSubscription) {
        await existingSubscription.unsubscribe();
      } else {
        await unsubscribeFromPush();
      }

      if (endpoint) {
        const response = await userService.deletePushSubscription({ endpoint });
        setSubscriptionCount(response?.data?.subscriptionCount || 0);
      }

      setIsPushSubscribed(false);
      const { browserSubscription, statusResponse } = await loadPushStatus();
      applyPushStatus(browserSubscription, statusResponse);
      toast.success(
        endpoint
          ? 'Daily inspiration delivery disabled on this device.'
          : 'This browser had no active endpoint to remove from the server. Local notifications are disabled.'
      );
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Unable to disable notifications.');
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
    <div className="editorial-page animate-fade-in">
      <section className="hero-shell section-reveal-soft" id="account-overview">
        <div className="flex flex-col gap-6 px-6 py-8 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-10">
          <div className="max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-[0.32em] text-sage-500 dark:text-sage-300">Settings</p>
            <h1 className="compact-hero-title mt-3 font-display text-sage-900 dark:text-sage-50">
              A calmer space for your account, {firstName}.
            </h1>
            <p className="compact-lead mt-4 max-w-2xl text-sage-600 dark:text-sage-200">
              Shape how MindfulLife feels day to day, protect your privacy, and keep your account details aligned with the rhythm you want.
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-[1.5rem] border border-sage-200 bg-sage-100/80 p-5 shadow-sm backdrop-blur sm:min-w-[300px] dark:border-white/10 dark:bg-white/5">
            <UserAvatar
              ariaHidden
              avatar={safeAvatarUrl}
              className="h-16 w-16 rounded-2xl shadow-sm"
              fallbackClassName="flex items-center justify-center bg-sage-100 text-lg font-medium text-sage-700 dark:bg-white/10 dark:text-sage-100"
              imgClassName="object-cover"
              name={name || user?.name}
            />

            <div>
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-sage-500 dark:text-sage-300">Account Snapshot</p>
              <p className="compact-display-value mt-2 font-display text-sage-800 dark:text-sage-50">{user?.name || 'Mindful member'}</p>
              <p className="mt-1 text-sm text-sage-600 dark:text-sage-200">{user?.email || 'No email available'}</p>
              <p className="mt-2 text-sm text-sage-500 dark:text-sage-300">Member since {memberSince}</p>
            </div>
          </div>
        </div>
      </section>

      <section
        className="panel-shell mt-8 overflow-hidden section-reveal"
        id="billing"
        style={{ animationDelay: '90ms' }}
      >
        <div className="grid grid-cols-1">
          <div className="bg-gradient-to-br from-sage-800 via-sage-700 to-[#4f6d58] p-6 text-white sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/65">Current Plan</p>
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white/85">
                {billingStatusLabel[billing.status]}
              </span>
            </div>

            {isBillingLoading ? (
              <div className="mt-6 skeleton h-44 rounded-[1.5rem] bg-white/10" />
            ) : (
              <>
                <h2 className="compact-display-number mt-5 font-display">
                  {billing.plan === 'free' ? 'MindfulLife Free' : `MindfulLife ${billing.plan[0].toUpperCase()}${billing.plan.slice(1)}`}
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-white/80">{billingRenewalMessage}</p>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-[1.25rem] border border-white/10 bg-white/10 p-4">
                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/60">Billing</p>
                    <p className="mt-2 text-sm font-medium text-white">
                      {billing.billingInterval ? `${billing.billingInterval[0].toUpperCase()}${billing.billingInterval.slice(1)}` : 'No recurring charge'}
                    </p>
                  </div>
                  <div className="rounded-[1.25rem] border border-white/10 bg-white/10 p-4">
                    <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/60">Provider</p>
                    <p className="mt-2 text-sm font-medium text-white">
                      {billing.billingProvider || 'Not connected'}
                    </p>
                  </div>
                </div>

                {billing.plan !== 'free' ? (
                  <button
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-sage-900 transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isBillingActionPending}
                    onClick={() => void handleManageSubscription()}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">credit_card</span>
                    Manage Subscription
                  </button>
                ) : null}
              </>
            )}
          </div>

          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-sage-500 dark:text-sage-300">Premium Upgrade</p>
                <h2 className="compact-section-title mt-2 font-display text-sage-900 dark:text-sage-50">Turn daily check-ins into longer-term clarity.</h2>
              </div>
              <div className="inline-flex rounded-full border border-sage-200 bg-sage-50 p-1 dark:border-white/10 dark:bg-white/5">
                {(['monthly', 'annual'] as BillingInterval[]).map((interval) => (
                  <button
                    key={interval}
                    className={clsx(
                      'rounded-full px-4 py-2 text-xs font-medium transition-colors',
                      billingInterval === interval
                        ? 'bg-sage-700 text-white dark:bg-sage-400 dark:text-sage-950'
                        : 'text-sage-600 hover:text-sage-900 dark:text-sage-200 dark:hover:text-white'
                    )}
                    onClick={() => setBillingInterval(interval)}
                    type="button"
                  >
                    {interval === 'annual' ? 'Annual' : 'Monthly'}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(230px,0.7fr)]">
              <div className="rounded-[1.25rem] border border-sage-100 bg-sage-50/70 p-4 dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-sage-500 dark:text-sage-300">
                  Everything included
                </p>
                <div className="mt-3 grid gap-2.5">
                  {[
                    'Full mood, sleep, and behavior analytics',
                    'AI summaries and longer trend comparisons',
                    'Monthly and quarterly report downloads',
                    'Premium reflection packs and richer guidance',
                  ].map((feature) => (
                    <div key={feature} className="flex gap-3">
                      <span className="material-symbols-outlined mt-0.5 text-[18px] text-sage-700 dark:text-sage-200">check_circle</span>
                      <p className="text-sm leading-6 text-sage-700 dark:text-sage-100">{feature}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-sand-200 bg-sand-50 p-5 dark:border-white/10 dark:bg-[#101915]">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-sand-700 dark:text-sand-200">
                  {billingInterval === 'annual' ? 'Best value' : 'Flexible plan'}
                </p>
                <p className="compact-display-number mt-3 font-display text-sage-900 dark:text-sage-50">
                  ${billing.pricing[billingInterval].amount}
                  <span className="ml-1 text-base font-medium text-sage-500 dark:text-sage-300">
                    /{billing.pricing[billingInterval].interval}
                  </span>
                </p>
                {billingInterval === 'annual' ? (
                  <p className="mt-2 text-sm leading-6 text-sage-600 dark:text-sage-200">
                    ${billing.pricing.annual.monthlyEquivalent}/month equivalent, saving {billing.pricing.annual.savingsPercent}%.
                  </p>
                ) : (
                  <p className="mt-2 text-sm leading-6 text-sage-600 dark:text-sage-200">Cancel from the billing portal when provider access is connected.</p>
                )}

                {billing.plan === 'free' ? (
                  <button
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-sage-700 px-5 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-sage-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-sage-400 dark:text-sage-950"
                    disabled={isBillingActionPending || Boolean(billing.premiumInterestAt && !billing.checkout[billingInterval])}
                    onClick={() => void handleUpgrade()}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {billing.checkout[billingInterval] ? 'lock_open' : 'notifications_active'}
                    </span>
                    {isBillingActionPending
                      ? 'Preparing...'
                      : billing.premiumInterestAt && !billing.checkout[billingInterval]
                        ? 'Premium requested'
                        : billing.checkout[billingInterval]
                          ? 'Upgrade to Premium'
                          : 'Request Premium access'}
                  </button>
                ) : (
                  <div className="mt-5 rounded-2xl bg-sage-100 px-4 py-3 text-sm font-medium text-sage-700 dark:bg-white/10 dark:text-sage-100">
                    Your account already includes paid-plan access.
                  </div>
                )}

                {!billing.checkout.monthly && !billing.checkout.annual && billing.plan === 'free' ? (
                  <p className="mt-3 text-xs leading-5 text-sage-500 dark:text-sage-400">
                    Checkout is not connected in this environment. Your request records plan interest without changing access or charging you.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-sage-100 px-6 py-6 sm:px-8 dark:border-white/10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-sage-500 dark:text-sage-300">Billing History</p>
              <p className="mt-2 text-sm leading-6 text-sage-600 dark:text-sage-200">
                {billing.invoices.length
                  ? `${billing.invoices.length} billing record${billing.invoices.length === 1 ? '' : 's'} available.`
                  : billing.plan === 'free'
                    ? 'No invoices yet. Free accounts are never charged.'
                    : 'No invoice records have been synced from the billing provider yet.'}
              </p>
            </div>
            {billing.invoices.length ? (
              <div className="flex flex-wrap gap-2">
                {billing.invoices.slice(0, 3).map((invoice) => (
                  <a
                    key={invoice.id}
                    className="rounded-full border border-sage-200 px-4 py-2 text-xs font-medium text-sage-700 hover:bg-sage-50 dark:border-white/10 dark:text-sage-100 dark:hover:bg-white/10"
                    href={invoice.receiptUrl || undefined}
                    rel="noreferrer"
                    target={invoice.receiptUrl ? '_blank' : undefined}
                  >
                    {format(new Date(invoice.date), 'MMM d, yyyy')} - ${invoice.amount}
                  </a>
                ))}
              </div>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full bg-sage-50 px-4 py-2 text-xs font-medium text-sage-600 dark:bg-white/10 dark:text-sage-200">
                <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                Nothing billed
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,1fr)]">
        <div className="space-y-8">
          <section className={`${settingsPanelClassName} section-reveal`} id="profile-details" style={{ animationDelay: '150ms' }}>
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sage-100 text-sage-700 dark:bg-white/10 dark:text-sage-100">
                <span className="material-symbols-outlined">badge</span>
              </div>
              <div>
                <h2 className="font-display text-2xl font-medium text-sage-900 dark:text-sage-50">Profile Details</h2>
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
                <label className="label" htmlFor="settings-avatar-upload">Avatar</label>
                <div className="mb-4 rounded-[1.25rem] border border-sage-200 bg-sage-100/70 p-4 dark:border-white/10 dark:bg-[#101915]">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <UserAvatar
                        ariaHidden
                        avatar={safeAvatarUrl}
                        className="h-20 w-20 rounded-2xl shadow-sm"
                        fallbackClassName="flex items-center justify-center bg-sage-200 text-lg font-medium text-sage-700 dark:bg-white/10 dark:text-sage-100"
                        imgClassName="object-cover"
                        name={name || user?.name}
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-sage-50">Stored in Cloudinary</p>
                        <p className="mt-1 text-sm text-sage-600 dark:text-sage-300">PNG, JPEG, WEBP, or GIF up to 2MB.</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <input
                        accept={ACCEPTED_AVATAR_FILE_TYPES.join(',')}
                        className="sr-only"
                        id="settings-avatar-upload"
                        onChange={handleAvatarSelection}
                        ref={avatarInputRef}
                        type="file"
                      />
                      <button
                        className="btn btn-secondary rounded-full"
                        disabled={isUploadingAvatar}
                        onClick={() => avatarInputRef.current?.click()}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">upload</span>
                        {isUploadingAvatar ? 'Uploading...' : 'Upload Avatar'}
                      </button>
                      <button
                        className="btn btn-ghost rounded-full border border-sage-200 dark:border-white/10"
                        disabled={!avatar || isUploadingAvatar}
                        onClick={handleAvatarRemove}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                        Remove Avatar
                      </button>
                    </div>
                  </div>
                </div>
                <p className="helper-text">Uploads go through the backend and the returned secure URL is saved on your profile.</p>
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
              <button className="btn btn-primary rounded-full px-6" disabled={isSavingProfile || isUploadingAvatar} onClick={handleProfileSave} type="button">
                <span className="material-symbols-outlined text-[18px]">save</span>
                {isSavingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </section>

          <section className={`${settingsPanelClassName} section-reveal`} style={{ animationDelay: '220ms' }}>
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sage-100 text-sage-700 dark:bg-white/10 dark:text-sage-100">
                <span className="material-symbols-outlined">tune</span>
              </div>
              <div>
                <h2 className="font-display text-2xl font-medium text-sage-900 dark:text-sage-50">Preferences</h2>
                <p className="text-sm text-sage-500 dark:text-sage-300">Choose the pace, reminders, and privacy settings that best support your routine.</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium uppercase tracking-[0.22em] text-sage-500 dark:text-sage-300">Theme</p>
                <span className="inline-flex items-center gap-2 rounded-full bg-sage-100 px-3 py-1 text-xs font-medium text-sage-700 dark:bg-white/10 dark:text-sage-100">
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
                        'flex items-center justify-center gap-2 rounded-[1.25rem] border px-4 py-4 text-sm font-medium transition-all',
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
                description="Receive a gentle nudge to pause, check in, and complete your daily reflection."
                label="Daily reflection reminder"
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
                <label className="label" htmlFor="settings-reminder-time">Reflection Reminder Time</label>
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

              <ToggleRow
                checked={preferences.notifications.inspirationReminder}
                description="Receive the featured inspiration quote at your preferred time, with a direct link to the Inspiration page."
                label="Daily inspiration delivery"
                onToggle={() => setPreferences((current) => ({
                  ...current,
                  notifications: {
                    ...current.notifications,
                    inspirationReminder: !current.notifications.inspirationReminder,
                  },
                }))}
              />

              <div className={clsx(
                'rounded-[1.25rem] border border-sage-200 bg-sage-100/70 p-4 transition-opacity dark:border-white/10 dark:bg-white/5',
                !preferences.notifications.inspirationReminder && 'opacity-60'
              )}>
                <label className="label" htmlFor="settings-inspiration-reminder-time">Inspiration Delivery Time</label>
                <input
                  className="input rounded-[1rem] border-sage-200 bg-sage-50 dark:border-white/10 dark:bg-[#101915]"
                  disabled={!preferences.notifications.inspirationReminder}
                  id="settings-inspiration-reminder-time"
                  onChange={(event) => setPreferences((current) => ({
                    ...current,
                    notifications: {
                      ...current.notifications,
                      inspirationReminderTime: event.target.value,
                    },
                  }))}
                  type="time"
                  value={preferences.notifications.inspirationReminderTime}
                />
              </div>

              <div className={clsx(
                'rounded-[1.25rem] border border-sage-200 bg-sage-100/70 p-4 transition-opacity dark:border-white/10 dark:bg-white/5',
                !preferences.notifications.dailyReminder
                  && !preferences.notifications.inspirationReminder
                  && 'opacity-60'
              )}>
                <label className="label" htmlFor="settings-reminder-timezone">Reminder Timezone</label>
                <input
                  className="input rounded-[1rem] border-sage-200 bg-sage-50 dark:border-white/10 dark:bg-[#101915]"
                  disabled
                  id="settings-reminder-timezone"
                  placeholder="America/New_York"
                  type="text"
                  value={getEffectiveReminderTimeZone()}
                />
                <p className="helper-text">This timezone syncs automatically from the current device and applies to both reminder schedules.</p>
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

          <section className={`${settingsPanelClassName} section-reveal`} style={{ animationDelay: '290ms' }}>
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sage-100 text-sage-700 dark:bg-white/10 dark:text-sage-100">
                <span className="material-symbols-outlined">password</span>
              </div>
              <div>
                <h2 className="font-display text-2xl font-medium text-sage-900 dark:text-sage-50">Password & Security</h2>
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

        <aside className="space-y-8 xl:sticky xl:top-6 xl:self-start">
          <section className="panel-shell-gradient section-reveal" style={{ animationDelay: '180ms' }}>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-sage-500 dark:text-sage-300">Account Overview</p>
            <h2 className="compact-section-title mt-2 font-display text-sage-900 dark:text-sage-50">Your current rhythm</h2>
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
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-sage-500 dark:text-sage-300">{item.label}</p>
                      <p className="mt-1 text-sm font-medium leading-6 text-slate-700 dark:text-sage-100">{item.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={`${settingsPanelClassName} section-reveal`} style={{ animationDelay: '250ms' }}>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sage-100 text-sage-700 dark:bg-white/10 dark:text-sage-100">
                <span className="material-symbols-outlined">install_mobile</span>
              </div>
              <div className="flex-1">
                <h3 className="font-display text-2xl font-medium text-sage-900 dark:text-sage-50">App Install & Notifications</h3>
                <p className="mt-2 text-sm leading-7 text-sage-600 dark:text-sage-200">
                  Install MindfulLife like an app and keep daily reflection reminders connected to this device.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className={settingsInsetClassName}>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-sage-500 dark:text-sage-300">Install Status</p>
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
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-sage-500 dark:text-sage-300">Notification Status</p>
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

          <section className={`${settingsPanelClassName} section-reveal`} style={{ animationDelay: '320ms' }}>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sage-100 text-sage-700 dark:bg-white/10 dark:text-sage-100">
                <span className="material-symbols-outlined">download</span>
              </div>
              <div>
                <h3 className="font-display text-2xl font-medium text-sage-900 dark:text-sage-50">Export Your Data</h3>
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

          <section className="section-reveal rounded-[1.75rem] border border-red-200 bg-gradient-to-b from-red-50/90 to-red-100/70 p-6 shadow-soft sm:p-8 dark:border-red-500/30 dark:bg-gradient-to-b dark:from-red-950/40 dark:to-[#261313]" style={{ animationDelay: '390ms' }}>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-200">
                <span className="material-symbols-outlined">warning</span>
              </div>
              <div>
                <h3 className="font-display text-2xl font-medium text-red-900 dark:text-red-100">Danger Zone</h3>
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
