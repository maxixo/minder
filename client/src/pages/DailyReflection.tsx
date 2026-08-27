import { useEffect, useMemo, useRef, useState, type ChangeEvent, type PointerEvent as ReactPointerEvent } from 'react';
import { format, isToday } from 'date-fns';
import clsx from 'clsx';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BrandLogo from '@/components/common/BrandLogo';
import { useDailyEntry } from '@/hooks/useDailyEntry';
import { clearOnboardingFlowState, readOnboardingFlowState } from '@/lib/onboardingFlow';
import ProfileMenu from '@/components/common/ProfileMenu';
import type { DailyEntryPatch, EntryEnergyPoint, EntryWeather } from '@/types/entry';
import '@/styles/pages/daily-reflection.css';

const ENERGY_MIN_TIME = 6;
const ENERGY_MAX_TIME = 24;
const ENERGY_MIN_LEVEL = 0;
const ENERGY_MAX_LEVEL = 10;
const ENERGY_CHART_WIDTH = 1000;
const ENERGY_CHART_HEIGHT = 100;

const weatherOptions = [
  { key: 'sunny', icon: 'wb_sunny', title: 'Sunny' },
  { key: 'cloudy', icon: 'cloud', title: 'Cloudy' },
  { key: 'rainy', icon: 'umbrella', title: 'Rainy' },
] as const;

const moodOptions = [
  { key: 'veryLow', emoji: '😭', text: 'Very low' },
  { key: 'low', emoji: '😞', text: 'Low' },
  { key: 'slightlyLow', emoji: '😕', text: 'Slightly low' },
  { key: 'neutral', emoji: '😐', text: 'Neutral' },
  { key: 'slightlyGood', emoji: '🙂', text: 'Slightly good' },
  { key: 'good', emoji: '😄', text: 'Good' },
  { key: 'great', emoji: '🤩', text: 'Great' },
] as const;

const mealOptions = [
  { key: 'breakfast', icon: 'breakfast_dining', label: 'BREAKFAST' },
  { key: 'lunch', icon: 'lunch_dining', label: 'LUNCH' },
  { key: 'dinner', icon: 'dinner_dining', label: 'DINNER' },
] as const;

const defaultMealsState = {
  breakfast: false,
  lunch: false,
  dinner: false,
} as const;
const cadenceLabelMap: Record<string, string> = {
  daily: 'daily',
  'three-times-week': 'about three times a week',
  flexible: 'flexibly',
};
const gratitudePrompt = 'List three things that feel grounding, supportive, or quietly good today.';
const intentionPrompt = 'What would help the rest of today feel lighter or more honest?';
const quickWinsPrompt = 'What small progress or stability showed up today, even if it barely counted in the moment?';

type ReflectionWeather = (typeof weatherOptions)[number]['key'];
type ReflectionMood = (typeof moodOptions)[number]['key'];
type ReflectionMealKey = (typeof mealOptions)[number]['key'];

interface ReflectionEnergyPoint {
  id: string;
  time: number;
  energy: number;
}

interface ChartPoint {
  id: string;
  x: number;
  y: number;
}

const moodValueMap: Record<ReflectionMood, number> = {
  veryLow: 1,
  low: 2,
  slightlyLow: 3,
  neutral: 3,
  slightlyGood: 4,
  good: 5,
  great: 5,
};

const valueMoodMap: Record<number, ReflectionMood> = {
  1: 'veryLow',
  2: 'low',
  3: 'neutral',
  4: 'slightlyGood',
  5: 'good',
};

const reflectionWeatherOptions = new Set<ReflectionWeather>(weatherOptions.map((option) => option.key));

const normalizeList = (items: string[], size: number) => {
  const trimmed = items.slice(0, size);
  return [...trimmed, ...Array.from({ length: Math.max(0, size - trimmed.length) }, () => '')];
};

const sanitizeList = (items: string[]) => items.map((item) => item.trim()).filter(Boolean);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const snapToHour = (value: number) => clamp(Math.round(value), ENERGY_MIN_TIME, ENERGY_MAX_TIME);
const roundEnergy = (value: number) => Math.round(clamp(value, ENERGY_MIN_LEVEL, ENERGY_MAX_LEVEL) * 10) / 10;

const createEnergyPointId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const sortByTime = (levels: ReflectionEnergyPoint[]) => [...levels].sort((left, right) => left.time - right.time);

const dedupeEnergyByTime = (levels: ReflectionEnergyPoint[]) => {
  const byTime = new Map<number, ReflectionEnergyPoint>();
  levels.forEach((point) => byTime.set(point.time, point));
  return sortByTime(Array.from(byTime.values()));
};

const timeToChartX = (time: number) => (
  ((time - ENERGY_MIN_TIME) / (ENERGY_MAX_TIME - ENERGY_MIN_TIME)) * ENERGY_CHART_WIDTH
);

const energyToChartY = (energy: number) => (
  ENERGY_CHART_HEIGHT - ((energy - ENERGY_MIN_LEVEL) / (ENERGY_MAX_LEVEL - ENERGY_MIN_LEVEL)) * ENERGY_CHART_HEIGHT
);

const buildSmoothPath = (points: ChartPoint[]) => {
  if (points.length < 2) return '';

  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = index > 0 ? points[index - 1] : points[index];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = index + 2 < points.length ? points[index + 2] : p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)} ${cp2x.toFixed(2)} ${cp2y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  return path;
};

const toReflectionWeather = (weather: EntryWeather): ReflectionWeather => (
  weather && reflectionWeatherOptions.has(weather as ReflectionWeather) ? weather as ReflectionWeather : 'sunny'
);

const toReflectionMood = (mood: number | null): ReflectionMood => (mood != null ? valueMoodMap[mood] || 'neutral' : 'neutral');
const toEntryDateKey = (value?: string | null) => (typeof value === 'string' ? value.slice(0, 10) : '');
const parseDateSearchParam = (value: string | null) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const [year, month, day] = value.split('-').map((part) => Number(part));
  const parsedDate = new Date(year, month - 1, day);

  if (
    Number.isNaN(parsedDate.getTime())
    || parsedDate.getFullYear() !== year
    || parsedDate.getMonth() !== month - 1
    || parsedDate.getDate() !== day
  ) {
    return null;
  }

  return parsedDate;
};

const normalizeEnergyLevels = (levels: EntryEnergyPoint[] | undefined): ReflectionEnergyPoint[] => {
  if (!levels?.length) return [];

  return dedupeEnergyByTime(levels
    .filter((point) => Number.isFinite(point.time) && Number.isFinite(point.energy))
    .map((point) => ({
      id: createEnergyPointId(),
      time: snapToHour(point.time),
      energy: roundEnergy(point.energy),
    })));
};

const validateEnergyLevels = (levels: ReflectionEnergyPoint[]) => {
  const invalidPoint = levels.find((point) => (
    !Number.isFinite(point.time)
    || !Number.isInteger(point.time)
    || !Number.isFinite(point.energy)
    || point.time < ENERGY_MIN_TIME
    || point.time > ENERGY_MAX_TIME
    || point.energy < ENERGY_MIN_LEVEL
    || point.energy > ENERGY_MAX_LEVEL
  ));

  if (invalidPoint) {
    return 'Energy points must use whole hours between 6 and 24, and energy between 0 and 10.';
  }

  return '';
};

export default function DailyReflection() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    entry,
    error,
    loading,
    saveEntryPatch,
    saving,
    selectedDate,
    canGoNext,
    loadEntryByDate,
    goToPreviousDate,
    goToNextDate,
  } = useDailyEntry();
  const chartRef = useRef<SVGSVGElement | null>(null);
  const [gratitude, setGratitude] = useState(['', '', '']);
  const [intention, setIntention] = useState('');
  const [quickWins, setQuickWins] = useState(['', '']);
  const [weather, setWeather] = useState<ReflectionWeather>('sunny');
  const [mood, setMood] = useState<ReflectionMood>('neutral');
  const [hydration, setHydration] = useState(0);
  const [sleep, setSleep] = useState(0);
  const [meals, setMeals] = useState<Record<ReflectionMealKey, boolean>>(defaultMealsState);
  const [energyLevels, setEnergyLevels] = useState<ReflectionEnergyPoint[]>([]);
  const [selectedEnergyPointId, setSelectedEnergyPointId] = useState<string | null>(null);
  const [draggingEnergyPointId, setDraggingEnergyPointId] = useState<string | null>(null);
  const [energyError, setEnergyError] = useState('');
  const [onboardingFlow, setOnboardingFlow] = useState(() => readOnboardingFlowState());
  const requestedSearchDate = useMemo(() => parseDateSearchParam(searchParams.get('date')), [searchParams]);
  const isOnboardingEntry = searchParams.get('source') === 'onboarding';

  const entryDateLabel = useMemo(
    () => (isToday(selectedDate) ? `Today, ${format(selectedDate, 'MMM d, yyyy')}` : format(selectedDate, 'EEE, MMM d, yyyy')),
    [selectedDate]
  );
  const selectedDateInputValue = useMemo(() => format(selectedDate, 'yyyy-MM-dd'), [selectedDate]);
  const todayInputMax = format(new Date(), 'yyyy-MM-dd');
  const controlsDisabled = loading || saving;

  const resetReflectionForm = () => {
    setGratitude(['', '', '']);
    setIntention('');
    setQuickWins(['', '']);
    setWeather('sunny');
    setMood('neutral');
    setHydration(0);
    setSleep(0);
    setMeals(defaultMealsState);
    setEnergyLevels([]);
    setSelectedEnergyPointId(null);
    setDraggingEnergyPointId(null);
    setEnergyError('');
  };

  const handleDateChange = (event: ChangeEvent<HTMLInputElement>) => {
    const [year, month, day] = event.target.value.split('-').map((part) => Number(part));
    if (!year || !month || !day) return;
    const nextDate = new Date(year, month - 1, day);
    void loadEntryByDate(nextDate).catch((loadError: any) => {
      toast.error(loadError?.response?.data?.message || 'Unable to load reflection for this date.');
    });
  };

  const handlePreviousDate = () => {
    if (controlsDisabled) return;
    void goToPreviousDate().catch((loadError: any) => {
      toast.error(loadError?.response?.data?.message || 'Unable to load previous reflection.');
    });
  };

  const handleNextDate = () => {
    if (controlsDisabled || !canGoNext) return;
    void goToNextDate().catch((loadError: any) => {
      toast.error(loadError?.response?.data?.message || 'Unable to load next reflection.');
    });
  };

  useEffect(() => {
    if (!requestedSearchDate) return;
    if (format(requestedSearchDate, 'yyyy-MM-dd') === selectedDateInputValue) return;

    void loadEntryByDate(requestedSearchDate).catch(() => undefined);
  }, [loadEntryByDate, requestedSearchDate, selectedDateInputValue]);

  useEffect(() => {
    if (searchParams.get('date') === selectedDateInputValue) return;

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.set('date', selectedDateInputValue);
    setSearchParams(nextSearchParams, { replace: true });
  }, [searchParams, selectedDateInputValue, setSearchParams]);

  useEffect(() => {
    if (!entry || toEntryDateKey(entry.date) !== selectedDateInputValue) {
      resetReflectionForm();
      return;
    }

    setGratitude(normalizeList(entry.gratitude || [], 3));
    setIntention(entry.expectations || '');
    setQuickWins(normalizeList(entry.positiveNotes || [], 2));
    setWeather(toReflectionWeather(entry.weather));
    setMood(toReflectionMood(entry.mood));
    setHydration(Math.max(0, Math.min(8, entry.waterIntake || 0)));
    setSleep(Math.max(0, Math.min(12, entry.sleepHours || 0)));
    setMeals({
      breakfast: Boolean(entry.meals?.breakfast),
      lunch: Boolean(entry.meals?.lunch),
      dinner: Boolean(entry.meals?.dinner),
    });
    setEnergyLevels(normalizeEnergyLevels(entry.energyLevels));
    setSelectedEnergyPointId(null);
    setDraggingEnergyPointId(null);
    setEnergyError('');
  }, [entry, selectedDateInputValue]);

  const sortedEnergyLevels = useMemo(() => sortByTime(energyLevels), [energyLevels]);
  const selectedEnergyPoint = useMemo(
    () => sortedEnergyLevels.find((point) => point.id === selectedEnergyPointId) || null,
    [selectedEnergyPointId, sortedEnergyLevels]
  );

  const chartData = useMemo(() => {
    const points: ChartPoint[] = sortedEnergyLevels.map((point) => ({
      id: point.id,
      x: timeToChartX(point.time),
      y: energyToChartY(point.energy),
    }));

    if (points.length < 2) {
      return { points, linePath: '', areaPath: '', isRenderable: false };
    }

    const linePath = buildSmoothPath(points);
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    const areaPath = `${linePath} L ${lastPoint.x.toFixed(2)} ${ENERGY_CHART_HEIGHT} L ${firstPoint.x.toFixed(2)} ${ENERGY_CHART_HEIGHT} Z`;

    return {
      points,
      linePath,
      areaPath,
      isRenderable: true,
    };
  }, [sortedEnergyLevels]);

  const updateGratitude = (index: number, value: string) => {
    setGratitude((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
  };

  const updateQuickWin = (index: number, value: string) => {
    setQuickWins((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
  };

  const toggleMeal = (mealKey: ReflectionMealKey) => {
    setMeals((current) => ({
      ...current,
      [mealKey]: !current[mealKey],
    }));
  };

  const parsePointerPosition = (event: ReactPointerEvent<SVGSVGElement>) => {
    const svg = chartRef.current;
    if (!svg) return null;

    const bounds = svg.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return null;

    const ratioX = clamp((event.clientX - bounds.left) / bounds.width, 0, 1);
    const ratioY = clamp((event.clientY - bounds.top) / bounds.height, 0, 1);

    const time = snapToHour(ENERGY_MIN_TIME + ratioX * (ENERGY_MAX_TIME - ENERGY_MIN_TIME));
    const energy = roundEnergy(ENERGY_MAX_LEVEL - ratioY * (ENERGY_MAX_LEVEL - ENERGY_MIN_LEVEL));

    return { time, energy };
  };

  const upsertEnergyPoint = (id: string, time: number, energy: number) => {
    const nextPoint: ReflectionEnergyPoint = {
      id,
      time: snapToHour(time),
      energy: roundEnergy(energy),
    };

    setEnergyLevels((current) => {
      const withUpdate = current.some((point) => point.id === id)
        ? current.map((point) => (point.id === id ? nextPoint : point))
        : [...current, nextPoint];

      const withoutDuplicateHour = withUpdate.filter((point) => point.id === id || point.time !== nextPoint.time);
      return sortByTime(withoutDuplicateHour);
    });
  };

  const removeEnergyPoint = (id: string) => {
    setEnergyLevels((current) => current.filter((point) => point.id !== id));
    setSelectedEnergyPointId((current) => (current === id ? null : current));
    setDraggingEnergyPointId((current) => (current === id ? null : current));
  };

  const handleEnergyChartPointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    const location = parsePointerPosition(event);
    if (!location) return;

    const clickedPointId = (event.target as HTMLElement).dataset.energyPointId || null;
    const pointId = clickedPointId || (sortedEnergyLevels.find((point) => point.time === location.time)?.id ?? createEnergyPointId());

    upsertEnergyPoint(pointId, location.time, location.energy);
    setSelectedEnergyPointId(pointId);
    setDraggingEnergyPointId(pointId);
    setEnergyError('');

    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  };

  const handleEnergyChartPointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!draggingEnergyPointId) return;

    const location = parsePointerPosition(event);
    if (!location) return;

    upsertEnergyPoint(draggingEnergyPointId, location.time, location.energy);
    setEnergyError('');
  };

  const stopEnergyDrag = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDraggingEnergyPointId(null);
  };

  const removeSelectedEnergyPoint = () => {
    if (!selectedEnergyPointId) return;
    removeEnergyPoint(selectedEnergyPointId);
  };

  const handleSave = async () => {
    const validationMessage = validateEnergyLevels(energyLevels);
    if (validationMessage) {
      setEnergyError(validationMessage);
      toast.error(validationMessage);
      return;
    }

    const normalizedEnergyLevels = dedupeEnergyByTime(energyLevels)
      .map((point) => ({
        time: snapToHour(point.time),
        energy: roundEnergy(point.energy),
      }))
      .sort((left, right) => left.time - right.time);

    const patch: DailyEntryPatch = {
      gratitude: sanitizeList(gratitude),
      expectations: intention.trim(),
      positiveNotes: sanitizeList(quickWins),
      weather,
      mood: moodValueMap[mood],
      waterIntake: hydration,
      sleepHours: sleep,
      meals: {
        breakfast: meals.breakfast,
        lunch: meals.lunch,
        dinner: meals.dinner,
      },
      energyLevels: normalizedEnergyLevels,
    };

    try {
      await saveEntryPatch(patch, 'reflection');
      setEnergyError('');
      clearOnboardingFlowState();
      setOnboardingFlow(null);
      if (isOnboardingEntry) {
        toast.success('Reflection saved');
        navigate('/dashboard', { replace: true });
        return;
      }
      toast.success('Reflection saved');
    } catch (saveError: any) {
      toast.error(saveError?.response?.data?.message || 'Unable to save reflection');
    }
  };

  return (
    <div className="daily-reflection-scrollbar animate-fade-in pb-10 transition-colors text-[#3a523e] [&_h1]:font-body [&_h2]:font-body [&_h3]:font-body [&_h4]:font-body [&_h5]:font-body [&_h6]:font-body dark:text-sage-50">
      <header className="sticky top-3 z-20 mb-6 rounded-[1.5rem] border border-[#e8ede8] bg-white/85 px-4 py-4 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-[#101915]/95 dark:shadow-none">
        <div className="flex w-full flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#638869] dark:text-sage-300">Reflection Space</p>
              <h1 className="mt-1 text-2xl font-black text-[#3a523e] sm:text-3xl dark:text-sage-50">Daily Reflection</h1>
            </div>

            <div className="shrink-0">
              <ProfileMenu buttonClassName="border-sage-200 bg-white text-[#3a523e] hover:bg-sage-50 dark:border-white/10 dark:bg-[#15201a] dark:text-sage-100 dark:hover:bg-[#223127]" />
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 rounded-xl border border-[#e8ede8] bg-[#f4f7f4] px-4 py-3 dark:border-white/10 dark:bg-[#15201a] dark:text-sage-100 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex items-center justify-between gap-3 sm:flex-1 sm:justify-start">
              <button
                className={clsx(
                  'material-symbols-outlined rounded-full p-1 transition-colors',
                  controlsDisabled ? 'cursor-not-allowed text-[#638869]/30' : 'text-[#638869] hover:bg-white hover:text-[#3a523e] dark:hover:bg-[#223127]'
                )}
                disabled={controlsDisabled}
                onClick={handlePreviousDate}
                type="button"
              >
                chevron_left
              </button>
              <span className="min-w-0 flex-1 text-center text-sm font-semibold sm:min-w-[180px] sm:flex-none">
                {entryDateLabel}
              </span>
              <button
                className={clsx(
                  'material-symbols-outlined rounded-full p-1 transition-colors',
                  controlsDisabled || !canGoNext
                    ? 'cursor-not-allowed text-[#638869]/30'
                    : 'text-[#638869] hover:bg-white hover:text-[#3a523e] dark:hover:bg-[#223127]'
                )}
                disabled={controlsDisabled || !canGoNext}
                onClick={handleNextDate}
                type="button"
              >
                chevron_right
              </button>
            </div>

            <div className="mx-auto flex w-full max-w-[11rem] flex-col gap-3 sm:max-w-none sm:flex-row sm:items-center">
              <input
                className="w-full rounded-full border border-[#d1dbd2] bg-white px-3 py-2 text-center text-sm font-semibold text-[#3a523e] outline-none focus:border-[#19e63c] dark:border-white/20 dark:bg-[#0f1712] dark:text-sage-50 sm:w-auto sm:max-w-[160px] sm:text-xs sm:px-4"
                disabled={controlsDisabled}
                max={todayInputMax}
                onChange={handleDateChange}
                type="date"
                value={selectedDateInputValue}
              />
              <div className="flex w-fit self-center items-center justify-center gap-3 rounded-full bg-white/70 px-3 py-2 dark:bg-[#0f1712] sm:w-auto">
                {weatherOptions.map((option) => (
                  <button key={option.key} onClick={() => setWeather(option.key)} title={option.title} type="button">
                    <span
                      className={clsx(
                        'material-symbols-outlined text-[22px] transition-colors',
                        weather === option.key ? 'text-[#19e63c]' : 'text-[#638869]/40'
                      )}
                    >
                      {option.icon}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full flex-1 space-y-8 py-2">
        {isOnboardingEntry && onboardingFlow ? (
          <div className="rounded-xl border border-[#dce8dd] bg-[#eef6ee] px-6 py-5 shadow-sm dark:border-white/10 dark:bg-[#15201a]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#638869] dark:text-sage-300">First-entry flow</p>
            <h2 className="mt-2 text-lg font-bold text-[#3a523e] dark:text-sage-50">
              Start with one honest check-in.
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#4f6b55] dark:text-sage-200">
              {onboardingFlow.goal
                ? (
                  <>
                    You&apos;re starting with <span className="font-semibold">{onboardingFlow.goal.replace(/-/g, ' ')}</span> and a plan to reflect{' '}
                    <span className="font-semibold">{cadenceLabelMap[onboardingFlow.cadence || ''] || 'consistently'}</span>.
                    Save this first reflection and the rest of the app will have a real starting point.
                  </>
                )
                : (
                  <>
                    Save this first reflection and the rest of the app will have a real starting point.
                  </>
                )}
            </p>
            {onboardingFlow.dailyReminder !== undefined ? (
              <p className="mt-2 text-sm leading-6 text-[#4f6b55] dark:text-sage-200">
                {onboardingFlow.dailyReminder
                  ? `Your reminder is set for ${onboardingFlow.reminderTime}.`
                  : 'You can turn reminders on later in settings if you want a stronger habit loop.'}
              </p>
            ) : null}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-xl border border-[#e8ede8] bg-[#f4f7f4] px-6 py-4 text-sm font-medium text-[#638869] shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-sage-200">
            Loading reflection...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-6 py-4 text-sm leading-6 text-amber-800 shadow-sm">
            {error}
          </div>
        ) : null}

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              <div className="space-y-8 lg:col-span-7">
                <section className="rounded-xl border border-[#e8ede8] bg-white p-8 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <div className="mb-6 flex items-center gap-3">
                    <span className="material-symbols-outlined text-red-400">favorite</span>
                    <h3 className="text-xl font-bold">1. Gratitude Practice</h3>
                  </div>
                  <p className="mb-6 text-sm italic text-[#638869] dark:text-sage-300">{gratitudePrompt}</p>

                  <div className="space-y-4">
                    {gratitude.map((item, index) => (
                      <div
                        key={`gratitude-${index + 1}`}
                        className="flex items-center gap-4 rounded-xl border border-[#e8ede8] bg-[#f4f7f4] p-4 dark:border-white/10 dark:bg-[#101915]"
                      >
                        <span className="font-bold text-[#19e63c]">{String(index + 1).padStart(2, '0')}</span>
                        <input
                          className="w-full border-none bg-transparent text-[#3a523e] outline-none placeholder:text-[#638869] dark:text-sage-50 dark:placeholder:text-sage-500"
                          onChange={(event) => updateGratitude(index, event.target.value)}
                          placeholder="I am grateful for..."
                          type="text"
                          value={item}
                        />
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-xl border border-[#e8ede8] bg-white p-8 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <div className="mb-6 flex items-center gap-3">
                    <span className="material-symbols-outlined text-amber-500">target</span>
                    <h3 className="text-xl font-bold">2. Expectations &amp; Goals</h3>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="mb-2 block text-sm font-semibold dark:text-sage-200">What is your main intention for today?</label>
                      <p className="mb-3 text-sm leading-6 text-[#638869] dark:text-sage-300">{intentionPrompt}</p>
                      <textarea
                        className="w-full rounded-xl border border-[#e8ede8] bg-[#f4f7f4] px-4 py-3 text-[#3a523e] outline-none placeholder:text-[#638869] focus:border-[#19e63c] dark:border-white/10 dark:bg-[#101915] dark:text-sage-50 dark:placeholder:text-sage-500"
                        onChange={(event) => setIntention(event.target.value)}
                        placeholder={intentionPrompt}
                        rows={3}
                        value={intention}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold dark:text-sage-200">Quick Wins (Bullet Points)</label>
                      <p className="mb-3 text-sm leading-6 text-[#638869] dark:text-sage-300">{quickWinsPrompt}</p>
                      <div className="space-y-2">
                        {quickWins.map((item, index) => (
                          <div key={`quick-win-${index + 1}`} className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-sm text-[#19e63c]">circle</span>
                            <input
                              className="flex-1 border-b border-[#e8ede8] bg-transparent py-1 outline-none placeholder:text-[#638869] focus:border-[#19e63c] dark:border-white/10 dark:text-sage-50 dark:placeholder:text-sage-500"
                              onChange={(event) => updateQuickWin(index, event.target.value)}
                              placeholder={`Task ${index + 1}`}
                              type="text"
                              value={item}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <div className="space-y-8 lg:col-span-5">
                <section className="rounded-xl border border-[#e8ede8] bg-white p-8 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <div className="mb-8 flex items-center gap-3">
                    <span className="material-symbols-outlined text-blue-400">monitoring</span>
                    <h3 className="text-xl font-bold">3. Vitality Trackers</h3>
                  </div>

                  <div className="space-y-8">
                <div>
                  <p className="mb-4 text-sm font-semibold">Mood Check-in</p>
                  <div className="grid grid-cols-7 gap-x-2 gap-y-4 sm:gap-2">
                    {moodOptions.map((option) => {
                      const isActive = mood === option.key;

                      return (
                        <button
                          key={option.key}
                          className={clsx(
                            'flex min-w-0 appearance-none flex-col items-center justify-start rounded-xl px-0.5 py-2 text-center transition-transform focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 [-webkit-tap-highlight-color:transparent] sm:px-1',
                            isActive
                              ? 'scale-105'
                              : 'opacity-60 grayscale hover:scale-105 hover:opacity-100 hover:grayscale-0'
                          )}
                          onClick={() => setMood(option.key)}
                          title={option.text}
                          type="button"
                        >
                          <span
                            className={clsx(
                              'block text-2xl transition-all duration-200',
                              isActive
                                ? 'scale-110 brightness-125 saturate-150 drop-shadow-[0_0_14px_rgba(25,230,60,0.35)]'
                                : ''
                            )}
                          >
                            {option.emoji}
                          </span>
                          <span className="mt-1 hidden text-[10px] font-semibold text-slate-500 dark:text-sage-300 sm:block">{option.text}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                    <div>
                      <div className="mb-4 flex items-center justify-between">
                        <p className="text-sm font-semibold">Hydration</p>
                        <span className="text-xs font-bold text-blue-500">{hydration} / 8 Glasses</span>
                      </div>
                      <div className="flex justify-between gap-1">
                        {Array.from({ length: 8 }, (_, index) => {
                          const filled = index < hydration;

                          return (
                            <button key={`water-${index + 1}`} onClick={() => setHydration(index + 1)} type="button">
                              <span className={clsx('material-symbols-outlined', filled ? 'material-fill-1 text-blue-500' : 'text-[#d1dbd2]')}>
                                water_drop
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="mb-4 flex items-center justify-between">
                        <p className="text-sm font-semibold">Sleep</p>
                        <span className="text-xs font-bold text-indigo-500">{sleep} Hours</span>
                      </div>
                      <input
                        className="daily-reflection-slider"
                        max="12"
                        min="0"
                        onChange={(event) => setSleep(Number(event.target.value))}
                        step="0.5"
                        type="range"
                        value={sleep}
                      />
                      <div className="mt-2 flex justify-between text-[10px] font-bold text-slate-400 dark:text-sage-400">
                        <span>0h</span>
                        <span>6h</span>
                        <span>12h</span>
                      </div>
                    </div>

                <div>
                  <p className="mb-4 text-sm font-semibold">Nourishment</p>
                      <div className="grid grid-cols-3 gap-3">
                        {mealOptions.map((option) => {
                          const isSelected = meals[option.key];
                          return (
                            <button
                              key={option.key}
                              aria-pressed={isSelected}
                              className={clsx(
                                'rounded-xl border p-3 transition-colors',
                                isSelected
                                  ? 'border-[#19e63c] bg-[#19e63c]/10'
                                  : 'border-[#e8ede8] bg-[#f4f7f4] hover:border-[#19e63c]',
                                'dark:border-white/10 dark:bg-[#101915]'
                              )}
                              onClick={() => toggleMeal(option.key)}
                              type="button"
                            >
                              <span className="flex flex-col items-center gap-2">
                                <span className={clsx('material-symbols-outlined', isSelected ? 'text-[#19e63c]' : 'text-slate-400 dark:text-sage-400')}>{option.icon}</span>
                                <span className={clsx('text-[10px] font-bold', isSelected ? 'text-[#19e63c]' : 'text-slate-500 dark:text-sage-200')}>{option.label}</span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            <section className="hidden w-full rounded-xl border border-[#e8ede8] bg-white p-8 shadow-sm dark:border-white/10 dark:bg-white/5 lg:block">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#19e63c]">bolt</span>
                  <h3 className="text-xl font-bold">4. Energy Graph</h3>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {selectedEnergyPoint ? (
                    <button
                      className="shrink-0 whitespace-nowrap rounded-lg border border-rose-300 bg-rose-50 px-3 py-1 text-xs font-bold !text-black hover:bg-rose-100 dark:border-rose-300/60 dark:bg-rose-100 dark:!text-black"
                      onClick={removeSelectedEnergyPoint}
                      style={{ color: '#000000' }}
                      type="button"
                    >
                      Undo
                    </button>
                  ) : null}
                  <p className="text-xs font-semibold text-slate-500 dark:text-sage-300">Tap chart to add or edit. Drag points to refine.</p>
                </div>
              </div>

              <div className="relative h-72 w-full border border-[#e8ede8] bg-[#f9fcf9] dark:border-white/10 dark:bg-[#0f1712]">
                <svg
                  ref={chartRef}
                  className="h-full w-full touch-none"
                  onPointerCancel={stopEnergyDrag}
                  onPointerDown={handleEnergyChartPointerDown}
                  onPointerMove={handleEnergyChartPointerMove}
                  onPointerUp={stopEnergyDrag}
                  preserveAspectRatio="none"
                  viewBox={`0 0 ${ENERGY_CHART_WIDTH} ${ENERGY_CHART_HEIGHT}`}
                >
                  <defs>
                    <linearGradient id="energy-gradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#19e63c" stopOpacity="0.34" />
                      <stop offset="100%" stopColor="#19e63c" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  <rect fill="#d7f8dc" height="30" width={ENERGY_CHART_WIDTH} x="0" y="0" />
                  <rect fill="#e9f7ec" height="40" width={ENERGY_CHART_WIDTH} x="0" y="30" />
                  <rect fill="#f4faf5" height="30" width={ENERGY_CHART_WIDTH} x="0" y="70" />

                  {Array.from({ length: 7 }, (_, index) => {
                    const x = (index / 6) * ENERGY_CHART_WIDTH;
                    return <line key={`grid-x-${index + 1}`} stroke="#d8e4d9" strokeWidth="1" x1={x} x2={x} y1="0" y2={ENERGY_CHART_HEIGHT} />;
                  })}

                  <line stroke="#c2d2c4" strokeDasharray="6 4" strokeWidth="1" x1="0" x2={ENERGY_CHART_WIDTH} y1="30" y2="30" />
                  <line stroke="#c2d2c4" strokeDasharray="6 4" strokeWidth="1" x1="0" x2={ENERGY_CHART_WIDTH} y1="70" y2="70" />

                  {chartData.isRenderable ? (
                    <>
                      <path d={chartData.areaPath} fill="url(#energy-gradient)" stroke="none" />
                      <path d={chartData.linePath} fill="none" stroke="#19e63c" strokeWidth="2.5" />
                    </>
                  ) : null}

                  {chartData.points.map((point) => {
                    const isSelected = point.id === selectedEnergyPointId;
                    return (
                      <circle
                        key={point.id}
                        cx={point.x}
                        cy={point.y}
                        data-energy-point-id={point.id}
                        fill={isSelected ? '#0ea830' : '#19e63c'}
                        r={isSelected ? 4.5 : 3.5}
                        stroke="#ffffff"
                        strokeWidth="1.4"
                      />
                    );
                  })}

                  {!chartData.isRenderable ? (
                    <text
                      dominantBaseline="middle"
                      fill="#6f8b74"
                      fontSize="9"
                      fontWeight="600"
                      letterSpacing="0.2"
                      textAnchor="middle"
                      x={ENERGY_CHART_WIDTH / 2}
                      y={ENERGY_CHART_HEIGHT / 2}
                    >
                      Add at least two checkpoints to render your energy curve.
                    </text>
                  ) : null}
                </svg>

                <div className="pointer-events-none absolute inset-x-0 -bottom-7 h-5 text-slate-400 dark:text-sage-400">
                  <svg className="h-full w-full overflow-visible" preserveAspectRatio="none" viewBox={`0 0 ${ENERGY_CHART_WIDTH} 20`}>
                    {['6 AM', '9 AM', '12 PM', '3 PM', '6 PM', '9 PM', '12 AM'].map((label, index) => (
                      <text
                        key={label}
                        fill="currentColor"
                        fontSize="10"
                        fontWeight="700"
                        textAnchor="middle"
                        x={(index / 6) * ENERGY_CHART_WIDTH}
                        y="12"
                      >
                        {label}
                      </text>
                    ))}
                  </svg>
                </div>
              </div>

              {selectedEnergyPoint ? (
                <p className="mt-8 text-sm font-semibold text-[#4f6b55] dark:text-sage-200">
                  Selected checkpoint: {selectedEnergyPoint.time}:00, energy {selectedEnergyPoint.energy}/10
                </p>
              ) : (
                <p className="mt-8 text-sm text-[#638869] dark:text-sage-300">No checkpoint selected. Tap a point to select and remove it.</p>
              )}

              {energyError ? (
                <p className="mt-2 text-sm font-semibold text-rose-600 dark:text-rose-300">{energyError}</p>
              ) : null}
            </section>
          </main>

          <button
            className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.75rem)] left-4 right-4 z-50 flex items-center justify-center gap-2 rounded-2xl bg-[#19e63c] px-5 py-3 text-sm font-bold text-[#3a523e] shadow-lg shadow-[#19e63c]/30 transition-transform hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100 sm:bottom-8 sm:left-auto sm:right-8 sm:rounded-full sm:px-8 sm:py-4 sm:text-base sm:hover:scale-105"
            disabled={loading || saving}
            onClick={handleSave}
            type="button"
          >
            <span className="material-symbols-outlined">save</span>
            <span>{saving ? 'Saving...' : 'Save Reflection'}</span>
          </button>

      <footer className="mt-20 hidden border-t border-[#e8ede8] bg-[#f4f7f4] py-10 dark:border-white/10 dark:bg-[#15201a] sm:block">
        <div className="flex w-full flex-col items-center justify-between gap-6 px-6 text-center md:flex-row md:text-left">
          <BrandLogo
            titleClassName="text-lg text-sage-800 dark:text-sage-50"
            iconClassName="h-8 w-8 text-[#44604a] dark:text-sage-50"
          />
          <div className="flex flex-col items-center gap-3 text-sm font-medium text-[#638869] dark:text-sage-300 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-6">
            <a className="hover:text-[#19e63c]" href="#">Guide</a>
            <a className="hover:text-[#19e63c]" href="#">Community</a>
            <a className="hover:text-[#19e63c]" href="#">Privacy</a>
            <a className="hover:text-[#19e63c]" href="#">Support</a>
          </div>
          <p className="text-xs text-slate-400 dark:text-sage-400">Copyright 2024 MindfulLife. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
