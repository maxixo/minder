import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import BrandLogo from '@/components/common/BrandLogo';
import { useAuth } from '@/contexts/useAuth';
import authService from '@/services/authService';
import { getSafeAvatarUrl } from '@/lib/avatar';
import { readOnboardingFlowState, updateOnboardingFlowState } from '@/lib/onboardingFlow';
import { getBrowserTimeZone } from '@/services/pushService';
import '@/styles/pages/onboarding.css';

const ACCEPTED_AVATAR_FILE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const MAX_AVATAR_FILE_BYTES = 2 * 1024 * 1024;
const LEAF_BACKGROUND_URL = 'https://lh3.googleusercontent.com/aida/AP1WRLuYhQ0escJqcBvq3RpJ9dlWvIGbudnO68nOA7yAXNfM2d-bwTRYGBMXCQexpkNaAN2GQn71NXcDm5dsgdigCd1QCJEPAursR1m9naBMgxiDvp-6yGOGuIKE0kgC_0nllpAeYkfoxiPtWGcd1eZ2orEYzWOpRV9ofoQZR7H3XzXkBddn-thNOOloDYxPMuD46uY9DOadbBP3oPONL1Gy2Pj-hJytALvkrhJeUoaM9oPv5CTT9YaoZkG9lpU';
const FILLED_ICON_STYLE: CSSProperties = {
  fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24",
};
const DEFAULT_REMINDER_TIME = '08:30';
const AM_PM_OPTIONS = ['AM', 'PM'] as const;
const HOUR_OPTIONS = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'));
const MINUTE_OPTIONS = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, '0'));
const WHEEL_ITEM_HEIGHT = 56;
const goalOptions = [
  { value: 'better-sleep', label: 'Better Sleep', icon: 'bedtime' },
  { value: 'reduce-stress', label: 'Reduce Stress', icon: 'air' },
  { value: 'daily-focus', label: 'Daily Focus', icon: 'center_focus_strong' },
  { value: 'emotional-balance', label: 'Emotional Balance', icon: 'balance' },
] as const;
const cadenceOptions = [
  { value: 'daily', label: 'Daily', description: 'Build a steady daily check-in habit.' },
  { value: 'three-times-week', label: '3x per week', description: 'Keep a consistent rhythm without aiming for every day.' },
  { value: 'flexible', label: 'Flexible', description: 'Check in when you need support or clarity.' },
] as const;

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

const parseReminderTime = (value?: string | null) => {
  const normalizedValue = typeof value === 'string' && /^\d{2}:\d{2}$/.test(value) ? value : DEFAULT_REMINDER_TIME;
  const [hourPart, minutePart] = normalizedValue.split(':').map((part) => Number(part));
  const safeHour = Number.isFinite(hourPart) ? hourPart : 8;
  const safeMinute = Number.isFinite(minutePart) ? minutePart : 30;
  const normalizedMinute = MINUTE_OPTIONS.includes(String(safeMinute).padStart(2, '0'))
    ? String(safeMinute).padStart(2, '0')
    : '30';
  const period = safeHour >= 12 ? 'PM' : 'AM';
  const hour12 = safeHour % 12 === 0 ? 12 : safeHour % 12;

  return {
    hourIndex: HOUR_OPTIONS.indexOf(String(hour12).padStart(2, '0')),
    minuteIndex: MINUTE_OPTIONS.indexOf(normalizedMinute),
    periodIndex: AM_PM_OPTIONS.indexOf(period),
  };
};

const to24HourTime = (hourLabel: string, minuteLabel: string, period: typeof AM_PM_OPTIONS[number]) => {
  const numericHour = Number(hourLabel);
  const numericMinute = Number(minuteLabel);
  let normalizedHour = numericHour % 12;

  if (period === 'PM') {
    normalizedHour += 12;
  }

  return `${String(normalizedHour).padStart(2, '0')}:${String(numericMinute).padStart(2, '0')}`;
};

export default function Onboarding() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { syncUser, updateProfile, user } = useAuth();
  const hourWheelRef = useRef<HTMLDivElement | null>(null);
  const minuteWheelRef = useRef<HTMLDivElement | null>(null);
  const periodWheelRef = useRef<HTMLDivElement | null>(null);
  const [storedFlow, setStoredFlow] = useState(() => readOnboardingFlowState());
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [goal, setGoal] = useState(() => readOnboardingFlowState()?.goal || '');
  const [cadence, setCadence] = useState(() => readOnboardingFlowState()?.cadence || '');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompletingSetup, setIsCompletingSetup] = useState(false);
  const [selectedHourIndex, setSelectedHourIndex] = useState(() => parseReminderTime(readOnboardingFlowState()?.reminderTime).hourIndex);
  const [selectedMinuteIndex, setSelectedMinuteIndex] = useState(() => parseReminderTime(readOnboardingFlowState()?.reminderTime).minuteIndex);
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState(() => parseReminderTime(readOnboardingFlowState()?.reminderTime).periodIndex);
  const stepParam = searchParams.get('step');
  const currentStep = stepParam === '3' ? 3 : stepParam === '2' ? 2 : 1;

  useEffect(() => {
    const nextName = user?.name || storedFlow?.profileName || '';
    const nextAvatar = user?.avatarUrl || user?.avatar || storedFlow?.profileAvatar || '';

    setName(nextName);
    setAvatarUrl(nextAvatar);
    setAvatarPreview(nextAvatar);
  }, [storedFlow?.profileAvatar, storedFlow?.profileName, user?.avatar, user?.avatarUrl, user?.name]);

  useEffect(() => {
    const parsedReminderTime = parseReminderTime(
      storedFlow?.reminderTime
      || user?.preferences?.notifications?.reminderTime
      || DEFAULT_REMINDER_TIME
    );

    setSelectedHourIndex(parsedReminderTime.hourIndex >= 0 ? parsedReminderTime.hourIndex : parseReminderTime(DEFAULT_REMINDER_TIME).hourIndex);
    setSelectedMinuteIndex(parsedReminderTime.minuteIndex >= 0 ? parsedReminderTime.minuteIndex : parseReminderTime(DEFAULT_REMINDER_TIME).minuteIndex);
    setSelectedPeriodIndex(parsedReminderTime.periodIndex >= 0 ? parsedReminderTime.periodIndex : 0);
  }, [storedFlow?.reminderTime, user?.preferences?.notifications?.reminderTime]);

  useEffect(() => {
    setGoal(storedFlow?.goal || user?.goal || '');
    setCadence(storedFlow?.cadence || user?.cadence || '');
  }, [storedFlow?.cadence, storedFlow?.goal, user?.cadence, user?.goal]);

  const persistedAvatar = getSafeAvatarUrl(avatarUrl);
  const displayAvatar = avatarPreview || persistedAvatar;
  const isBusy = isSaving || isUploadingAvatar;
  const selectedReminderTime = to24HourTime(
    HOUR_OPTIONS[selectedHourIndex] || '08',
    MINUTE_OPTIONS[selectedMinuteIndex] || '30',
    AM_PM_OPTIONS[selectedPeriodIndex] || 'AM'
  );

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

    const previousAvatar = displayAvatar || '';
    setIsUploadingAvatar(true);

    try {
      const fileDataUrl = await readFileAsDataUrl(selectedFile);
      setAvatarPreview(fileDataUrl);

      const response = await authService.uploadProfileAvatar(fileDataUrl);
      const nextAvatar = response?.data?.avatar || '';

      syncUser(response?.data);
      setAvatarUrl(nextAvatar);
      setAvatarPreview(nextAvatar);
      toast.success('Avatar updated.');
    } catch (error: any) {
      setAvatarPreview(previousAvatar);
      toast.error(error?.response?.data?.message || error?.message || 'Unable to upload avatar.');
    } finally {
      event.target.value = '';
      setIsUploadingAvatar(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error('Name is required.');
      return;
    }

    setIsSaving(true);

    try {
      if (trimmedName !== user?.name) {
        await updateProfile({ name: trimmedName });
      }

      const nextFlow = updateOnboardingFlowState({
        profileName: trimmedName,
        profileAvatar: avatarUrl || persistedAvatar || null,
      });

      setStoredFlow(nextFlow);
      setSearchParams({ step: '2' }, { replace: true });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to save your profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSecondStepContinue = () => {
    if (!goal || !cadence) {
      return;
    }

    const nextFlow = updateOnboardingFlowState({
      profileName: name.trim() || user?.name || storedFlow?.profileName || '',
      profileAvatar: avatarUrl || persistedAvatar || storedFlow?.profileAvatar || null,
      focusAreas: [goal],
      goal,
      cadence,
    });

    setStoredFlow(nextFlow);
    setSearchParams({ step: '3' }, { replace: true });
  };

  const handleBackToStepOne = () => {
    setSearchParams({}, { replace: true });
  };

  const handleBackToStepTwo = () => {
    setSearchParams({ step: '2' }, { replace: true });
  };

  const persistReminderPreferences = async (dailyReminder: boolean) => {
    const selectedGoal = goal || storedFlow?.goal || user?.goal || '';
    const selectedCadence = cadence || storedFlow?.cadence || user?.cadence || '';

    if (!selectedGoal || !selectedCadence) {
      toast.error('Choose a goal and reflection cadence before continuing.');
      setSearchParams({ step: '2' }, { replace: true });
      return;
    }

    setIsCompletingSetup(true);

    try {
      const timezone = getBrowserTimeZone();
      const response = await authService.updateProfile({
        goal: selectedGoal,
        cadence: selectedCadence,
        preferences: {
          notifications: {
            dailyReminder,
            reminderTime: selectedReminderTime,
            weeklyReport: user?.preferences?.notifications?.weeklyReport ?? true,
            timezone,
          },
        },
      });

      const nextFlow = updateOnboardingFlowState({
        profileName: name.trim() || user?.name || storedFlow?.profileName || '',
        profileAvatar: avatarUrl || persistedAvatar || storedFlow?.profileAvatar || null,
        focusAreas: [selectedGoal],
        goal: selectedGoal,
        cadence: selectedCadence,
        dailyReminder,
        reminderTime: selectedReminderTime,
      });

      setStoredFlow(nextFlow);
      syncUser(response.data);
      navigate('/reflection?source=onboarding', { replace: true });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to save your onboarding setup.');
    } finally {
      setIsCompletingSetup(false);
    }
  };

  const handleHelpClick = () => {
    toast.message('Pick a time that feels natural. You can change it anytime in settings.');
  };

  const handleCloseOnboarding = () => {
    void persistReminderPreferences(false);
  };

  const renderProgressIndicator = (step: 1 | 2 | 3, className = '') => (
    <div className={`mb-stack-lg flex flex-col items-center space-y-3 ${className}`.trim()}>
      <div className="flex space-x-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`progress-${step}-${index + 1}`}
            className={`h-1 w-12 rounded-full ${index < step ? 'bg-primary' : 'bg-outline-variant'}`}
          />
        ))}
      </div>
      <span className="font-metadata text-metadata uppercase tracking-widest text-primary">
        Step {step} of 3
      </span>
    </div>
  );

  const syncWheelPosition = (element: HTMLDivElement | null, index: number) => {
    if (!element) return;

    const nextScrollTop = index * WHEEL_ITEM_HEIGHT;
    if (Math.abs(element.scrollTop - nextScrollTop) < 1) return;

    element.scrollTo({
      top: nextScrollTop,
      behavior: 'smooth',
    });
  };

  const getNearestWheelIndex = (element: HTMLDivElement, itemCount: number) => {
    const rawIndex = Math.round(element.scrollTop / WHEEL_ITEM_HEIGHT);
    return Math.max(0, Math.min(itemCount - 1, rawIndex));
  };

  const handleWheelScroll = (
    element: HTMLDivElement,
    itemCount: number,
    setIndex: (value: number) => void
  ) => {
    const nextIndex = getNearestWheelIndex(element, itemCount);
    setIndex(nextIndex);
  };

  useEffect(() => {
    if (currentStep !== 3) return;
    syncWheelPosition(hourWheelRef.current, selectedHourIndex);
  }, [currentStep, selectedHourIndex]);

  useEffect(() => {
    if (currentStep !== 3) return;
    syncWheelPosition(minuteWheelRef.current, selectedMinuteIndex);
  }, [currentStep, selectedMinuteIndex]);

  useEffect(() => {
    if (currentStep !== 3) return;
    syncWheelPosition(periodWheelRef.current, selectedPeriodIndex);
  }, [currentStep, selectedPeriodIndex]);

  if (currentStep === 2) {
    return (
      <div className="onboarding-step-two onboarding-botanical-bg relative flex min-h-screen flex-col bg-background text-on-background font-body-md">
        <header className="sticky top-0 z-50 flex w-full items-center justify-between bg-transparent px-container-padding-mobile py-4 md:px-container-padding-desktop">
          <BrandLogo
            className="shrink-0"
            iconClassName="h-8 w-8 text-[#44604a]"
            titleClassName="text-2xl text-primary"
          />
        </header>

        <main className="relative flex flex-1 items-center justify-center overflow-hidden px-container-padding-mobile py-stack-lg md:px-container-padding-desktop">
          <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 opacity-10">
            <svg className="fill-primary" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <path d="M44.7,-76.4C58.1,-69.2,69.5,-57.4,77.3,-43.8C85.1,-30.2,89.2,-15.1,88.4,-0.4C87.7,14.2,82,28.5,73.5,41.2C65,53.8,53.7,64.9,40.6,72.4C27.5,79.8,12.7,83.7,-2,87.2C-16.7,90.6,-33.5,93.6,-47.9,87.2C-62.4,80.7,-74.6,64.8,-82.1,48C-89.6,31.2,-92.4,13.6,-89.1,-3.2C-85.9,-20.1,-76.6,-36.1,-64.8,-48.9C-53,-61.7,-38.7,-71.2,-24.1,-77C-9.5,-82.8,5.4,-84.9,24.1,-77Z" transform="translate(100 100)" />
            </svg>
          </div>

          <div className="z-10 w-full max-w-2xl">
            {renderProgressIndicator(2)}

            <div className="mb-stack-lg text-center">
              <h1 className="mb-4 font-display-lg-mobile text-display-lg-mobile text-primary md:font-display-lg md:text-display-lg">
                What brings you here today?
              </h1>
              <p className="mx-auto max-w-md font-body-lg text-secondary">
                Choose the first result you want from MindfulLife and the rhythm you can realistically keep.
              </p>
            </div>

            <div className="space-y-stack-lg">
              <div>
                <p className="mb-4 text-center font-label-md text-label-md text-primary md:text-left">Primary goal</p>
                <div className="grid grid-cols-2 gap-gutter md:grid-cols-2">
                  {goalOptions.map((option) => {
                    const isSelected = goal === option.value;

                    return (
                      <button
                        key={option.value}
                        className={`onboarding-glass-card group relative flex flex-col items-center justify-center rounded-[24px] border-2 p-stack-lg shadow-sm transition-all duration-300 hover:shadow-md ${
                          isSelected ? 'onboarding-focus-card-active' : 'border-transparent'
                        }`}
                        onClick={() => setGoal(option.value)}
                        type="button"
                      >
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary-fixed text-primary transition-transform group-hover:scale-110">
                          <span className="material-symbols-outlined text-4xl">{option.icon}</span>
                        </div>
                        <span className="text-center font-label-md text-label-md text-on-surface">{option.label}</span>
                        <div className={`absolute right-4 top-4 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`}>
                          <span className="material-symbols-outlined text-primary" style={FILLED_ICON_STYLE}>check_circle</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-4 text-center font-label-md text-label-md text-primary md:text-left">Preferred cadence</p>
                <div className="grid gap-3">
                  {cadenceOptions.map((option) => {
                    const isSelected = cadence === option.value;

                    return (
                      <button
                        key={option.value}
                        className={`onboarding-glass-card flex items-start justify-between rounded-[20px] border-2 px-5 py-4 text-left transition-all duration-300 hover:shadow-md ${
                          isSelected ? 'onboarding-focus-card-active' : 'border-transparent'
                        }`}
                        onClick={() => setCadence(option.value)}
                        type="button"
                      >
                        <span>
                          <span className="block font-label-md text-label-md text-on-surface">{option.label}</span>
                          <span className="mt-1 block text-sm text-secondary">{option.description}</span>
                        </span>
                        <span className={`material-symbols-outlined text-primary transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`} style={FILLED_ICON_STYLE}>
                          check_circle
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-section-gap flex flex-col items-center gap-stack-md">
              <button
                className={`w-full max-w-sm rounded-full bg-primary px-12 py-4 font-label-md text-label-md text-on-primary shadow-xl transition-all hover:opacity-90 active:scale-95 ${
                  goal && cadence ? '' : 'cursor-not-allowed opacity-50'
                }`}
                disabled={!goal || !cadence}
                onClick={handleSecondStepContinue}
                type="button"
              >
                Continue
              </button>
              <button
                className="flex items-center gap-2 font-label-sm text-label-sm text-outline transition-colors hover:text-primary"
                onClick={handleBackToStepOne}
                type="button"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Back
              </button>
            </div>
          </div>
        </main>

        <footer className="pointer-events-none relative h-24 w-full overflow-hidden">
          <div className="absolute bottom-0 left-1/2 w-full max-w-4xl -translate-x-1/2 opacity-20">
            <svg fill="none" viewBox="0 0 400 100" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 100C40 80 60 40 100 60C140 80 160 20 200 40C240 60 260 0 300 20C340 40 360 80 400 100H0Z" fill="#375541" />
            </svg>
          </div>
        </footer>
      </div>
    );
  }

  if (currentStep === 3) {
    return (
      <div className="onboarding-step-three onboarding-organic-grain-stardust flex min-h-screen flex-col items-center bg-background text-body-md text-on-background font-body-md">
        <header className="sticky top-0 z-40 flex w-full items-center justify-between bg-background px-container-padding-mobile py-4 md:px-container-padding-desktop">
          <BrandLogo
            className="shrink-0"
            iconClassName="h-8 w-8 text-[#44604a]"
            titleClassName="text-2xl text-primary"
          />
          <div className="flex items-center gap-4">
            <button
              className="text-outline transition-opacity transition-transform hover:opacity-80 active:scale-95"
              onClick={handleHelpClick}
              type="button"
            >
              <span className="material-symbols-outlined">help</span>
            </button>
            <button
              className="text-outline transition-opacity transition-transform hover:opacity-80 active:scale-95"
              disabled={isCompletingSetup}
              onClick={handleCloseOnboarding}
              type="button"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </header>

        <main className="relative flex w-full max-w-screen-xl flex-1 flex-col items-center justify-center gap-stack-lg overflow-hidden px-container-padding-mobile py-stack-lg md:flex-row md:gap-gutter md:px-container-padding-desktop">
          <div className="onboarding-botanical-bg pointer-events-none absolute inset-0 z-0 opacity-40" />

          <div className="relative z-10 flex w-full flex-col text-center md:w-1/2 md:text-left">
            {renderProgressIndicator(3, 'mt-stack-md md:items-start')}
            <h1 className="mb-stack-sm font-display-lg-mobile text-display-lg-mobile text-primary md:font-display-lg md:text-display-lg">
              Find your rhythm.
            </h1>
            <p className="mx-auto max-w-md font-body-lg text-body-lg text-secondary md:mx-0">
              We&apos;ll send a gentle nudge to support your daily reflection practice. Select a time that feels natural for your routine.
            </p>
          </div>

          <div className="relative z-10 w-full max-w-sm md:w-1/2">
            <div className="rounded-[24px] border border-surface-variant/30 bg-surface-container-lowest p-stack-lg shadow-[0_40px_80px_rgba(55,85,65,0.06)] backdrop-blur-sm">
              <div className="relative flex h-48 select-none items-center justify-center gap-4 overflow-hidden py-stack-md">
                <div className="pointer-events-none absolute inset-x-4 h-14 rounded-sm border-y border-primary-fixed-dim bg-primary-fixed/10" />

                <div
                  ref={hourWheelRef}
                  className="onboarding-time-picker-wheel onboarding-time-picker-column h-full overflow-y-auto"
                  onScroll={(event) => handleWheelScroll(event.currentTarget, HOUR_OPTIONS.length, setSelectedHourIndex)}
                >
                  {HOUR_OPTIONS.map((label, index) => (
                    <button
                      key={`hour-${label}`}
                      aria-selected={selectedHourIndex === index}
                      className={`onboarding-time-picker-option font-display-lg-mobile text-display-lg-mobile transition-colors ${
                        selectedHourIndex === index ? 'font-semibold text-primary' : 'text-outline/60'
                      }`}
                      onClick={() => setSelectedHourIndex(index)}
                      type="button"
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="font-display-lg-mobile text-display-lg-mobile text-primary">:</div>

                <div
                  ref={minuteWheelRef}
                  className="onboarding-time-picker-wheel onboarding-time-picker-column h-full overflow-y-auto"
                  onScroll={(event) => handleWheelScroll(event.currentTarget, MINUTE_OPTIONS.length, setSelectedMinuteIndex)}
                >
                  {MINUTE_OPTIONS.map((label, index) => (
                    <button
                      key={`minute-${label}`}
                      aria-selected={selectedMinuteIndex === index}
                      className={`onboarding-time-picker-option font-display-lg-mobile text-display-lg-mobile transition-colors ${
                        selectedMinuteIndex === index ? 'font-semibold text-primary' : 'text-outline/60'
                      }`}
                      onClick={() => setSelectedMinuteIndex(index)}
                      type="button"
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div
                  ref={periodWheelRef}
                  className="onboarding-time-picker-wheel onboarding-time-picker-column h-full overflow-y-auto"
                  onScroll={(event) => handleWheelScroll(event.currentTarget, AM_PM_OPTIONS.length, setSelectedPeriodIndex)}
                >
                  {AM_PM_OPTIONS.map((period, index) => {
                    const isActive = selectedPeriodIndex === index;

                    return (
                      <button
                        key={period}
                        aria-selected={isActive}
                        className={`onboarding-time-picker-option rounded-full px-3 py-1 font-label-md text-label-md transition-colors ${
                          isActive
                            ? 'bg-primary-container font-bold text-on-primary-container'
                            : 'cursor-pointer text-secondary hover:bg-secondary-fixed-dim'
                        }`}
                        onClick={() => setSelectedPeriodIndex(index)}
                        type="button"
                      >
                        {period}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-stack-lg">
                <button
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-label-md text-label-md text-on-primary shadow-lg transition-all hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isCompletingSetup}
                  onClick={() => void persistReminderPreferences(true)}
                  type="button"
                >
                  {isCompletingSetup ? 'Saving...' : 'Start First Reflection'}
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
                <p className="mt-stack-md text-center font-metadata text-metadata text-outline/80">
                  You can change this anytime in settings.
                </p>
                <button
                  className="mt-3 flex w-full items-center justify-center gap-2 font-label-sm text-label-sm text-outline transition-colors hover:text-primary"
                  disabled={isCompletingSetup}
                  onClick={handleBackToStepTwo}
                  type="button"
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  Back
                </button>
              </div>
            </div>
          </div>
        </main>

        <footer className="flex w-full flex-col items-center py-stack-lg opacity-60">
          <div className="flex gap-stack-md text-secondary">
            <span className="material-symbols-outlined" style={FILLED_ICON_STYLE}>spa</span>
            <span className="material-symbols-outlined" style={FILLED_ICON_STYLE}>energy_savings_leaf</span>
            <span className="material-symbols-outlined" style={FILLED_ICON_STYLE}>schedule</span>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="onboarding-step-one relative min-h-screen overflow-hidden bg-background text-on-background font-body-md selection:bg-primary-fixed-dim">
      <div className="onboarding-organic-grain pointer-events-none fixed inset-0 z-0" />

      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center overflow-hidden px-container-padding-mobile py-12 md:px-container-padding-desktop">
        <div className="absolute inset-0 z-[-1] opacity-60">
          <div
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url('${LEAF_BACKGROUND_URL}')` }}
          />
        </div>

        <div className="onboarding-fade-in" style={{ animationDelay: '0.2s' }}>
          {renderProgressIndicator(1)}
        </div>

        <header className="onboarding-fade-in mb-section-gap max-w-2xl text-center" style={{ animationDelay: '0.4s' }}>
          <h1 className="mb-4 font-display-lg-mobile text-display-lg-mobile leading-tight text-primary md:font-display-lg md:text-display-lg">
            Welcome to your sanctuary.
          </h1>
          <p className="mx-auto max-w-lg font-body-lg text-body-lg text-secondary">
            Let&apos;s begin your journey toward digital decompression and mindful rhythm.
          </p>
        </header>

        <section className="onboarding-fade-in w-full max-w-md rounded-[32px] bg-surface-container-lowest/40 p-8 shadow-xl shadow-primary/5 backdrop-blur-md md:p-10" style={{ animationDelay: '0.6s' }}>
          <form className="space-y-stack-lg" onSubmit={handleSubmit}>
            <div className="flex flex-col items-center space-y-4">
              <div className="group relative">
                <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-surface-container shadow-sm transition-transform duration-300 group-hover:scale-105">
                  {displayAvatar ? (
                    <img alt="Profile preview" className="h-full w-full object-cover" src={displayAvatar} />
                  ) : (
                    <span className="material-symbols-outlined text-4xl text-outline">person</span>
                  )}
                </div>

                <label
                  className="absolute bottom-0 right-0 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-primary text-on-primary shadow-lg transition-all hover:bg-primary-container active:scale-90"
                  htmlFor="onboarding-avatar-input"
                >
                  <span className="material-symbols-outlined text-base">add_a_photo</span>
                  <input
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    disabled={isBusy}
                    id="onboarding-avatar-input"
                    onChange={handleAvatarSelection}
                    type="file"
                  />
                </label>
              </div>

              <span className="font-label-sm text-label-sm text-secondary">
                {isUploadingAvatar ? 'Uploading your profile photo...' : 'Upload your profile photo'}
              </span>
            </div>

            <div className="space-y-2">
              <label className="ml-1 font-label-md text-label-md text-primary" htmlFor="onboarding-name">
                What should we call you?
              </label>
              <input
                autoComplete="name"
                className="h-14 w-full rounded-2xl border-none bg-surface-container-low px-6 font-body-md text-on-surface transition-all placeholder:text-outline/50 focus:ring-2 focus:ring-primary-fixed-dim"
                disabled={isBusy}
                id="onboarding-name"
                onChange={(event) => setName(event.target.value)}
                placeholder="Enter your name"
                type="text"
                value={name}
              />
            </div>

            <button
              aria-busy={isBusy}
              className="w-full rounded-full bg-primary px-8 py-4 font-label-md text-label-md text-on-primary shadow-lg shadow-primary/20 transition-all duration-300 hover:bg-primary-container hover:shadow-primary/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isBusy}
              type="submit"
            >
              {isSaving ? 'Saving...' : 'Continue'}
            </button>
          </form>
        </section>

        <footer className="onboarding-fade-in mt-stack-lg text-center" style={{ animationDelay: '0.8s' }}>
          <p className="flex items-center justify-center gap-2 font-metadata text-metadata text-outline/60">
            <span className="material-symbols-outlined text-[14px] onboarding-lock-icon">lock</span>
            Your data is stored locally and stays private.
          </p>
        </footer>
      </main>
    </div>
  );
}
