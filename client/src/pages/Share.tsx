import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import AuthThemeToggle from '@/components/common/AuthThemeToggle';
import BrandLogo from '@/components/common/BrandLogo';
import { useAuth } from '@/contexts/useAuth';
import { useTheme } from '@/contexts/useTheme';
import {
  SHARE_CARD_BACKGROUNDS,
  SHARE_CARD_FONT_COLORS,
  SHARE_CARD_FONT_FAMILIES,
  SHARE_CARD_THEMES,
  downloadShareQuoteCard,
  formatShareQuoteText,
  getDefaultShareCardFontColor,
  getShareCardBackground,
  getShareCardFontColor,
  getShareCardFontFamily,
  getLocalDateKey,
  getShareCardTheme,
  type ShareCardBackgroundId,
  type ShareCardFontColorId,
  type ShareCardFontFamilyId,
  type ShareCardThemeId,
} from '@/lib/inspiration';
import analyticsService from '@/services/analyticsService';
import type { DashboardQuote } from '@/constants/dashboardQuotes';

const fallbackQuote: DashboardQuote = {
  id: 'mindfullife-share-fallback',
  text: 'A steady practice begins with one honest moment of attention.',
  author: 'MindfulLife',
};

const defaultRituals = [
  '20m Morning Meditation',
  'Forest Mindful Walk',
  'Gratitude Journaling',
];

const logoUrl = 'https://lh3.googleusercontent.com/aida/AP1WRLvCundqemjzSKgHRcFetGSWpcb1wzH9tAckSSy1QEXV6OnfDbRkNdJJD4fRD939T2q_YXihQlrJ-hjWpv1YyKT26fz1Tk4W6z5QrcCaLz-YeBUPs8dD-XgoWohfRsUtGTm-pM46gA_NX1tOaQ6s8eCR0HQ7mLXwTjLP3rOHzQlpLvfe5pb6T9QAbGaIOCUVLASlpjPB_k7HG4mRrZj4S6zzZxO0Tn1jC-gfIhD9g5I2DD4gPQit4TGanH0';
const baseCardTransform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1)';
const defaultToastMessage = 'Ready for sharing!';

const iconStyle = {
  fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
} as const;

const filledIconStyle = {
  fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24",
} as const;

const parseShareDate = (value: string | null) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return getLocalDateKey();
  }

  return value;
};

const parseShareStreak = (value: string | null) => {
  const parsedValue = Number.parseInt(value || '', 10);
  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return '0';
  }

  return String(parsedValue);
};

const parseQuoteFromSearch = (params: URLSearchParams): DashboardQuote => {
  const text = params.get('text')?.trim();
  const author = params.get('author')?.trim();

  if (!text || !author) {
    return fallbackQuote;
  }

  return {
    id: `share-${author.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    text,
    author,
  };
};

type ShareLocationState = {
  currentStreak?: number;
};

type SummaryData = {
  currentStreak: number;
};

export default function Share() {
  const { isAuthenticated, loading: isAuthLoading } = useAuth();
  const { isDarkMode } = useTheme();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const routeStreak = searchParams.get('streak');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [cardTransform, setCardTransform] = useState(baseCardTransform);
  const [toastMessage, setToastMessage] = useState(defaultToastMessage);
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [isCardAnimating, setIsCardAnimating] = useState(false);
  const [showQuoteMarks, setShowQuoteMarks] = useState(true);
  const [backgroundId, setBackgroundId] = useState<ShareCardBackgroundId>('leafy');
  const [themeId, setThemeId] = useState<ShareCardThemeId>(isDarkMode ? 'midnight' : 'sage');
  const [fontColorId, setFontColorId] = useState<ShareCardFontColorId>(
    getDefaultShareCardFontColor(isDarkMode ? 'midnight' : 'sage'),
  );
  const [fontFamilyId, setFontFamilyId] = useState<ShareCardFontFamilyId>('editorial');
  const [streak, setStreak] = useState(() => {
    const locationState = location.state as ShareLocationState | null;
    return locationState?.currentStreak != null
      ? parseShareStreak(String(locationState.currentStreak))
      : parseShareStreak(routeStreak);
  });
  const exportResetTimeoutRef = useRef<number | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);
  const hasCustomThemeSelectionRef = useRef(false);
  const hasCustomFontColorSelectionRef = useRef(false);

  const quote = useMemo(() => parseQuoteFromSearch(searchParams), [searchParams]);
  const shareDate = useMemo(() => parseShareDate(searchParams.get('date')), [searchParams]);
  const quoteSource = searchParams.get('source');
  const attribution = searchParams.get('attribution');
  const from = searchParams.get('from');
  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';

    const url = new URL(
      `${location.pathname}${location.search}${location.hash}`,
      window.location.origin,
    );
    url.searchParams.set('streak', streak);
    return url.toString();
  }, [location.hash, location.pathname, location.search, streak]);

  const initialRituals = useMemo(() => {
    const rituals = searchParams.getAll('ritual');
    const baseRituals = rituals.length ? rituals.slice(0, 3) : defaultRituals;
    return Array.from({ length: 3 }, (_, index) => baseRituals[index] || '');
  }, [searchParams]);
  const [ritualInputs, setRitualInputs] = useState<string[]>(initialRituals);

  useEffect(() => {
    setRitualInputs(initialRituals);
  }, [initialRituals]);

  useEffect(() => {
    const locationState = location.state as ShareLocationState | null;
    const fallbackStreak = locationState?.currentStreak != null
      ? String(locationState.currentStreak)
      : routeStreak;

    setStreak(parseShareStreak(fallbackStreak));

    if (isAuthLoading || !isAuthenticated) return undefined;

    let isCancelled = false;

    const loadCurrentStreak = async () => {
      try {
        const response = await analyticsService.getSummary('7days');
        if (!isCancelled) {
          setStreak(String((response.data as SummaryData).currentStreak || 0));
        }
      } catch {
        // Keep the streak embedded in the share link when live account data is unavailable.
      }
    };

    void loadCurrentStreak();

    return () => {
      isCancelled = true;
    };
  }, [isAuthLoading, isAuthenticated, location.state, routeStreak]);

  useEffect(() => {
    if (hasCustomThemeSelectionRef.current) return;
    setThemeId(isDarkMode ? 'midnight' : 'sage');
  }, [isDarkMode]);

  useEffect(() => {
    if (hasCustomFontColorSelectionRef.current) return;
    setFontColorId(getDefaultShareCardFontColor(themeId));
  }, [themeId]);

  const shareRituals = useMemo(
    () => ritualInputs.map((ritual) => ritual.trim()).filter(Boolean).slice(0, 3),
    [ritualInputs],
  );
  const theme = getShareCardTheme(themeId);
  const background = getShareCardBackground(backgroundId);
  const fontColor = getShareCardFontColor(fontColorId);
  const fontFamily = getShareCardFontFamily(fontFamilyId);
  const quoteDisplayText = formatShareQuoteText(quote.text, showQuoteMarks);
  const fontColorOptions = Object.values(SHARE_CARD_FONT_COLORS);
  const fontFamilyOptions = Object.values(SHARE_CARD_FONT_FAMILIES);
  const themeOptions = Object.values(SHARE_CARD_THEMES);
  const backgroundOptions = Object.values(SHARE_CARD_BACKGROUNDS);

  useEffect(() => () => {
    if (exportResetTimeoutRef.current) {
      window.clearTimeout(exportResetTimeoutRef.current);
    }

    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
  }, []);

  const showToast = (message = defaultToastMessage) => {
    setToastMessage(message);
    setIsToastVisible(true);

    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }

    toastTimeoutRef.current = window.setTimeout(() => {
      setIsToastVisible(false);
    }, 3000);
  };

  const resetCardAnimationLater = () => {
    if (exportResetTimeoutRef.current) {
      window.clearTimeout(exportResetTimeoutRef.current);
    }

    exportResetTimeoutRef.current = window.setTimeout(() => {
      setCardTransform(baseCardTransform);
      setIsCardAnimating(false);
    }, 3000);
  };

  const runExportFeedback = () => {
    setIsCardAnimating(true);
    setCardTransform('scale(0.98)');

    window.setTimeout(() => {
      setCardTransform('scale(1.02)');
      showToast(defaultToastMessage);
      resetCardAnimationLater();
    }, 200);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    runExportFeedback();

    try {
      await downloadShareQuoteCard(quote, {
        attribution,
        backgroundId,
        date: shareDate,
        fontColorId,
        fontFamilyId,
        rituals: shareRituals,
        showQuoteMarks,
        source: quoteSource,
        streak,
        themeId,
      });
    } catch (error: any) {
      toast.error(error?.message || 'Unable to download the share card');
      setCardTransform(baseCardTransform);
      setIsCardAnimating(false);
      setIsToastVisible(false);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'MindfulLife Share Card',
          text: `"${quote.text}" - ${quote.author}`,
          url: shareUrl,
        });
        showToast(defaultToastMessage);
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        showToast('Share link copied');
      } else {
        toast.error('Sharing is not supported in this browser.');
      }
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        toast.error('Unable to open the share sheet');
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleCardMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (isCardAnimating) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    setCardTransform(`perspective(1000px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg) scale(1.02)`);
  };

  const handleCardMouseLeave = () => {
    if (isCardAnimating) return;
    setCardTransform(baseCardTransform);
  };

  const handleRitualChange = (index: number, value: string) => {
    setRitualInputs((current) => current.map((ritual, ritualIndex) => (
      ritualIndex === index ? value : ritual
    )));
  };

  const handleThemeSelect = (nextThemeId: ShareCardThemeId) => {
    hasCustomThemeSelectionRef.current = true;
    setThemeId(nextThemeId);
  };

  const handleBackgroundSelect = (nextBackgroundId: ShareCardBackgroundId) => {
    const nextBackground = getShareCardBackground(nextBackgroundId);
    setBackgroundId(nextBackgroundId);

    if (nextBackground.recommendedThemeId) {
      handleThemeSelect(nextBackground.recommendedThemeId);
      if (!hasCustomFontColorSelectionRef.current) {
        setFontColorId(getDefaultShareCardFontColor(nextBackground.recommendedThemeId));
      }
    }
  };

  const handleFontColorSelect = (nextFontColorId: ShareCardFontColorId) => {
    hasCustomFontColorSelectionRef.current = true;
    setFontColorId(nextFontColorId);
  };

  const handleFontFamilySelect = (nextFontFamilyId: ShareCardFontFamilyId) => {
    setFontFamilyId(nextFontFamilyId);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f6f8f7] font-body-md text-slate-900 dark:bg-[#0f1712] dark:text-sage-50">
      <header className="fixed left-1/2 top-0 z-50 mx-auto flex w-full max-w-7xl -translate-x-1/2 items-center justify-between border-b border-sage-200/70 bg-[#f6f8f7]/92 px-gutter py-4 shadow-sm shadow-sage-900/5 backdrop-blur-xl dark:border-white/10 dark:bg-[#101915]/96 dark:shadow-black/20">
        <Link className="shrink-0" to="/">
          <BrandLogo
            className="gap-2"
            iconClassName="h-8 w-8"
            titleClassName="text-xl"
            tone={isDarkMode ? 'light' : 'brand'}
            withWordmark
          />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link className="font-label-md text-label-md text-sage-600 transition-colors duration-300 hover:text-sage-800 dark:text-sage-200 dark:hover:text-sage-50" to="/reflection">
            Reflection
          </Link>
          <Link className="font-label-md text-label-md text-sage-600 transition-colors duration-300 hover:text-sage-800 dark:text-sage-200 dark:hover:text-sage-50" to="/analytics">
            Energy
          </Link>
          <Link className="border-b-2 border-sage-600 pb-1 font-label-md text-label-md font-bold text-sage-700 dark:border-sage-300 dark:text-sage-100" to="/inspiration">
            Guidance
          </Link>
          <Link className="font-label-md text-label-md text-sage-600 transition-colors duration-300 hover:text-sage-800 dark:text-sage-200 dark:hover:text-sage-50" to="/">
            About
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <AuthThemeToggle className="shrink-0" showLabel={false} />
          <Link
            className="rounded-full bg-primary px-6 py-2.5 font-label-md text-label-md text-on-primary shadow-sm transition-all duration-200 hover:opacity-90"
            to={from === 'inspiration' ? '/inspiration' : '/'}
          >
            {from === 'inspiration' ? 'Back to Inspiration' : 'Start Your Journey'}
          </Link>
        </div>
      </header>

      <main className="flex flex-grow flex-col items-center justify-center gap-stack-lg bg-gradient-to-b from-transparent via-sage-50/70 to-transparent px-gutter pb-section-gap pt-32 dark:bg-gradient-to-b dark:from-[#0f1712] dark:via-[#121b16] dark:to-[#0f1712]">
        <div className="animate-fade-in space-y-2 text-center">
          <h1 className="font-headline-md text-headline-md text-sage-900 dark:text-sage-50">Share Your Journey</h1>
          <p className="font-body-md text-body-md text-sage-600 dark:text-sage-200">
            Capture your daily progress and inspire your community.
          </p>
          <p className="font-label-md text-label-md uppercase tracking-[0.12em] text-sage-500 dark:text-sage-300">
            Featuring {quote.author}
          </p>
        </div>

        <div className="grid w-full max-w-6xl gap-8 xl:grid-cols-[minmax(320px,420px)_minmax(0,1fr)] xl:items-start">
          <div className="space-y-5">
            <div
              className="relative aspect-[4/5] w-full max-w-[420px] cursor-default overflow-hidden rounded-[32px] border transition-transform duration-500 hover:scale-[1.02]"
              id="export-card"
              onMouseLeave={handleCardMouseLeave}
              onMouseMove={handleCardMouseMove}
              style={{
                transform: cardTransform,
                background: `linear-gradient(160deg, ${theme.backgroundStart} 0%, ${theme.backgroundMid} 52%, ${theme.backgroundEnd} 100%)`,
                borderColor: theme.shellBorder,
                boxShadow: theme.shadow,
              }}
            >
              {background.imageUrl ? (
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url('${background.imageUrl}')`,
                    opacity: background.opacity,
                  }}
                />
              ) : null}
              <div className="absolute inset-0" style={{ background: theme.imageOverlay }} />

              <div className="relative flex h-full w-full flex-col p-8">
                <div className="flex items-start justify-between">
                  <img alt="MindfulLife" className="h-10 w-auto object-contain opacity-100" src={logoUrl} />

                  <div className="flex flex-col items-end">
                    <div
                      className="flex items-center gap-1.5 rounded-full border px-3 py-1"
                      style={{ background: theme.accentSoft, borderColor: theme.accentMuted }}
                    >
                      <span className="material-symbols-outlined text-[18px]" style={{ ...filledIconStyle, color: theme.accent }}>eco</span>
                      <span className="font-label-sm text-label-sm" style={{ color: fontColor.badgeText, fontFamily: fontFamily.bodyFamily }}>
                        {streak} Day Streak
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className="mt-5 rounded-[24px] border p-5 shadow-sm backdrop-blur-[16px]"
                  style={{ background: theme.panelFill, borderColor: theme.panelBorder }}
                >
                  <h3 className="mb-4 flex items-center gap-2 font-label-md text-label-md" style={{ color: fontColor.secondary, fontFamily: fontFamily.bodyFamily }}>
                    <span className="material-symbols-outlined text-[20px]" style={{ ...iconStyle, color: fontColor.secondary }}>calendar_today</span>
                    TODAY&apos;S RITUALS
                  </h3>
                  <ul className="space-y-4">
                    {shareRituals.map((ritual) => (
                      <li key={ritual} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full" style={{ background: theme.accentSoft }}>
                            <span className="material-symbols-outlined text-[16px] font-bold" style={{ ...iconStyle, color: theme.accent }}>check</span>
                          </div>
                          <span className="font-body-md text-[15px]" style={{ color: fontColor.primary, fontFamily: fontFamily.bodyFamily }}>{ritual}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="h-[1px] w-full" style={{ background: theme.divider }} />

                  <div className="px-4 text-center">
                    <span className="mb-2 block font-metadata text-metadata uppercase tracking-[0.2em]" style={{ color: fontColor.muted, fontFamily: fontFamily.metaFamily }}>
                      Soul Insight
                    </span>
                    <p className="font-headline-sm text-headline-sm italic leading-relaxed" style={{ color: fontColor.secondary, fontFamily: fontFamily.quoteFamily }}>
                      {quoteDisplayText}
                    </p>
                    <span className="mt-3 block font-label-md text-label-md uppercase tracking-[0.16em]" style={{ color: fontColor.secondary, fontFamily: fontFamily.bodyFamily }}>
                      By {quote.author}
                    </span>
                    {attribution ? (
                      <span className="mt-2 block font-metadata text-metadata" style={{ color: fontColor.muted, fontFamily: fontFamily.metaFamily }}>
                        {attribution}
                      </span>
                    ) : null}
                    {quoteSource ? (
                      <span className="mt-2 block font-metadata text-metadata uppercase tracking-[0.12em]" style={{ color: fontColor.muted, fontFamily: fontFamily.metaFamily }}>
                        {shareDate}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex justify-center pt-2">
                    <div className="h-1 w-8 rounded-full" style={{ background: theme.accentSoft }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <button
                className="flex items-center gap-3 rounded-full bg-primary px-8 py-4 font-label-md text-label-md text-on-primary shadow-lg shadow-primary/20 transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
                disabled={isDownloading}
                onClick={() => void handleDownload()}
                type="button"
              >
                <span className="material-symbols-outlined" style={iconStyle}>download</span>
                {isDownloading ? 'Preparing export...' : 'Export as Image'}
              </button>

              <button
                className="flex items-center gap-3 rounded-full border border-outline-variant bg-surface-container px-8 py-4 font-label-md text-label-md text-slate-900 transition-all duration-300 hover:bg-surface-container-high dark:border-white/10 dark:bg-[#18231d] dark:text-sage-300 dark:hover:bg-[#1c2921]"
                disabled={isSharing}
                onClick={() => void handleShare()}
                type="button"
              >
                <span className="material-symbols-outlined" style={iconStyle}>share</span>
                {isSharing ? 'Opening share sheet...' : 'Share to Instagram'}
              </button>
            </div>
          </div>
          <section className="w-full rounded-[2rem] border border-sage-200 bg-gradient-to-b from-white via-sage-50/80 to-sand-50/70 p-6 shadow-soft backdrop-blur-sm dark:border-white/10 dark:bg-gradient-to-b dark:from-[#18231d] dark:via-[#121b16] dark:to-[#101915]">
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sage-500 dark:text-sage-300">Card Controls</p>
                <button
                  className="inline-flex items-center gap-2 rounded-full border border-sage-200 bg-white px-5 py-3 text-sm font-semibold text-sage-700 transition-all hover:bg-sage-50 dark:border-white/10 dark:bg-[#18231d] dark:text-sage-100 dark:hover:bg-[#1c2921]"
                  onClick={() => setShowQuoteMarks((current) => !current)}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">{showQuoteMarks ? 'format_quote' : 'format_quote_off'}</span>
                  {showQuoteMarks ? 'Remove quote marks' : 'Show quote marks'}
                </button>
              </div>

              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-sage-500 dark:text-sage-300">Card Background</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {backgroundOptions.map((backgroundOption) => (
                    <button
                      key={backgroundOption.id}
                      aria-pressed={backgroundId === backgroundOption.id}
                      className="overflow-hidden rounded-2xl border bg-white text-left transition-all dark:bg-[#18231d]"
                      onClick={() => handleBackgroundSelect(backgroundOption.id)}
                      style={{
                        borderColor: backgroundId === backgroundOption.id ? theme.accent : (isDarkMode ? 'rgba(255,255,255,0.16)' : 'rgba(194, 200, 193, 0.7)'),
                        boxShadow: backgroundId === backgroundOption.id ? `0 0 0 2px ${theme.accentSoft}` : 'none',
                      }}
                      type="button"
                    >
                      <span
                        className="block h-20 bg-cover bg-center"
                        style={{
                          background: backgroundOption.imageUrl
                            ? `linear-gradient(rgba(255,255,255,0.08), rgba(255,255,255,0.08)), url('${backgroundOption.preview}') center / cover`
                            : `linear-gradient(135deg, ${theme.backgroundStart}, ${theme.backgroundEnd})`,
                        }}
                      />
                      <span className="block px-3 py-2 text-sm font-semibold text-sage-700 dark:text-sage-100">
                        {backgroundOption.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-sage-500 dark:text-sage-300">Card Color</p>
                <div className="flex flex-wrap gap-3">
                  {themeOptions.map((themeOption) => (
                    <button
                      key={themeOption.id}
                      className="inline-flex items-center gap-3 rounded-full border px-4 py-2 text-sm font-semibold transition-all"
                      onClick={() => handleThemeSelect(themeOption.id)}
                      style={{
                        background: `linear-gradient(135deg, ${themeOption.backgroundStart}, ${themeOption.backgroundEnd})`,
                        borderColor: themeId === themeOption.id ? themeOption.accent : (isDarkMode ? 'rgba(255,255,255,0.16)' : 'rgba(194, 200, 193, 0.7)'),
                        color: themeOption.textSecondary,
                        boxShadow: themeId === themeOption.id ? `0 0 0 2px ${themeOption.accentSoft}` : 'none',
                      }}
                      type="button"
                    >
                      <span className="h-3 w-3 rounded-full" style={{ background: themeOption.accent }} />
                      {themeOption.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-sage-500 dark:text-sage-300">Font Color</p>
                <div className="flex flex-wrap gap-3">
                  {fontColorOptions.map((fontColorOption) => (
                    <button
                      key={fontColorOption.id}
                      className="inline-flex items-center gap-3 rounded-full border bg-white/90 px-4 py-2 text-sm font-semibold text-sage-700 transition-all dark:bg-[#18231d] dark:text-sage-100"
                      onClick={() => handleFontColorSelect(fontColorOption.id)}
                      style={{
                        borderColor: fontColorId === fontColorOption.id ? fontColorOption.swatch : (isDarkMode ? 'rgba(255,255,255,0.16)' : 'rgba(194, 200, 193, 0.7)'),
                        boxShadow: fontColorId === fontColorOption.id ? `0 0 0 2px ${fontColorOption.swatch}22` : 'none',
                      }}
                      type="button"
                    >
                      <span className="h-4 w-4 rounded-full border border-black/10" style={{ background: fontColorOption.swatch }} />
                      {fontColorOption.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-sage-500 dark:text-sage-300">Font Family</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {fontFamilyOptions.map((fontFamilyOption) => (
                    <button
                      key={fontFamilyOption.id}
                      className="rounded-3xl border px-4 py-3 text-left transition-all"
                      onClick={() => handleFontFamilySelect(fontFamilyOption.id)}
                      style={{
                        borderColor: fontFamilyId === fontFamilyOption.id ? theme.accent : (isDarkMode ? 'rgba(255,255,255,0.16)' : 'rgba(194, 200, 193, 0.7)'),
                        background: isDarkMode ? 'rgba(24,35,29,0.92)' : 'rgba(255,255,255,0.92)',
                        boxShadow: fontFamilyId === fontFamilyOption.id ? `0 0 0 2px ${theme.accentSoft}` : 'none',
                      }}
                      type="button"
                    >
                      <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-sage-500 dark:text-sage-300">
                        {fontFamilyOption.label}
                      </span>
                      <span
                        className="mt-2 block text-xl text-slate-900 dark:text-sage-50"
                        style={{ fontFamily: fontFamilyOption.previewFamily }}
                      >
                        Quiet clarity
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-sage-500 dark:text-sage-300">Edit Rituals</p>
                <div className="grid gap-3 md:grid-cols-3">
                  {ritualInputs.map((ritual, index) => (
                    <input
                      key={`ritual-${index + 1}`}
                      className="rounded-2xl border border-sage-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner-soft outline-none transition-colors placeholder:text-sage-400 focus:border-sage-500 dark:border-white/10 dark:bg-[#101915] dark:text-sage-50"
                      onChange={(event) => handleRitualChange(index, event.target.value)}
                      placeholder={`Ritual ${index + 1}`}
                      type="text"
                      value={ritual}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        <div
          className={`fixed bottom-10 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-inverse-surface px-6 py-3 font-label-md text-label-md text-inverse-on-surface shadow-xl transition-all duration-500 ${isToastVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}
          id="toast"
        >
          <span className="material-symbols-outlined text-[20px]" style={iconStyle}>check_circle</span>
          {toastMessage}
        </div>
      </main>

      <footer className="mt-auto flex w-full flex-col items-center justify-between gap-stack-md border-t border-sage-200/70 bg-[#eef3ef] px-gutter py-stack-lg md:flex-row dark:border-white/10 dark:bg-[#101915]">
        <div className="flex flex-col items-center gap-2 md:items-start">
          <span className="font-headline-sm text-headline-sm text-sage-900 dark:text-sage-50">MindfulLife</span>
          <p className="font-label-sm text-label-sm text-sage-500 dark:text-sage-300">© 2024 MindfulLife. Cultivating digital sanctuary.</p>
        </div>

        <div className="flex gap-8">
          <Link className="font-label-sm text-label-sm text-sage-500 underline decoration-sage-400/40 transition-colors duration-300 hover:text-sage-700 dark:text-sage-300 dark:hover:text-sage-100" to="/">
            Privacy Policy
          </Link>
          <Link className="font-label-sm text-label-sm text-sage-500 underline decoration-sage-400/40 transition-colors duration-300 hover:text-sage-700 dark:text-sage-300 dark:hover:text-sage-100" to="/">
            Terms of Service
          </Link>
          <Link className="font-label-sm text-label-sm text-sage-500 underline decoration-sage-400/40 transition-colors duration-300 hover:text-sage-700 dark:text-sage-300 dark:hover:text-sage-100" to="/">
            Contact Us
          </Link>
        </div>
      </footer>
    </div>
  );
}
