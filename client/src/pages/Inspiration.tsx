import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { dashboardQuotes, type DashboardQuote } from '@/constants/dashboardQuotes';
import {
  buildQuoteSharePath,
  downloadQuoteCard,
  getDailyQuote,
  getDailyQuoteIndex,
  getLocalDateKey,
  getQuoteFavoriteKey,
  getShiftedQuoteIndex,
} from '@/lib/inspiration';
import analyticsService from '@/services/analyticsService';
import inspirationService from '@/services/inspirationService';
import type {
  InspirationQuoteResponse,
  SavedInspirationQuote,
  SavedInspirationQuoteSource,
} from '@/types/inspiration';

const fallbackQuote: DashboardQuote = {
  id: 'mindfullife-default',
  text: 'A steady practice begins with one honest moment of attention.',
  author: 'MindfulLife',
};

const buildQuoteId = (prefix: string, quote: Pick<DashboardQuote, 'text' | 'author'>) => (
  `${prefix}-${quote.author.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${quote.text.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 48)}`
);

const mapServerQuoteToDashboardQuote = (quote: InspirationQuoteResponse): DashboardQuote => ({
  id: buildQuoteId(`${quote.source}-${quote.date}`, quote),
  text: quote.text,
  author: quote.author,
});

type SummaryData = {
  currentStreak: number;
};

export default function Inspiration() {
  const dailyIndex = useMemo(() => getDailyQuoteIndex(dashboardQuotes), []);
  const localFeaturedQuote = useMemo(() => getDailyQuote(dashboardQuotes) || fallbackQuote, []);
  const initialIndex = dailyIndex >= 0 ? dailyIndex : 0;

  const [featuredQuote, setFeaturedQuote] = useState<DashboardQuote>(localFeaturedQuote);
  const [activeQuote, setActiveQuote] = useState<DashboardQuote>(localFeaturedQuote);
  const [featuredDate, setFeaturedDate] = useState(getLocalDateKey());
  const [quoteSource, setQuoteSource] = useState<InspirationQuoteResponse['source'] | null>(null);
  const [quoteAttribution, setQuoteAttribution] = useState<string | null>(null);
  const [isLoadingDailyQuote, setIsLoadingDailyQuote] = useState(true);
  const [activeIndex, setActiveIndex] = useState(dailyIndex >= 0 ? dailyIndex : 0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [savedQuotes, setSavedQuotes] = useState<SavedInspirationQuote[]>([]);
  const [savedQuotesLoading, setSavedQuotesLoading] = useState(true);
  const [savedQuotesError, setSavedQuotesError] = useState('');
  const [favoriteActionPending, setFavoriteActionPending] = useState(false);
  const [activeSavedQuote, setActiveSavedQuote] = useState<SavedInspirationQuote | null>(null);
  const hasUserSelectedQuote = useRef(false);

  useEffect(() => {
    let isCancelled = false;

    const loadTodayQuote = async () => {
      try {
        const response = await inspirationService.getToday();
        if (isCancelled) return;

        const serverQuote = mapServerQuoteToDashboardQuote(response.data);
        const matchingIndex = dashboardQuotes.findIndex(
          (quote) => quote.text === response.data.text && quote.author === response.data.author,
        );

        setFeaturedQuote(serverQuote);
        setFeaturedDate(response.data.date);
        setQuoteSource(response.data.source);
        setQuoteAttribution(response.data.attribution);

        if (matchingIndex >= 0) {
          setActiveIndex(matchingIndex);
        }

        if (!hasUserSelectedQuote.current) {
          setActiveQuote(serverQuote);
        }
      } catch {
        if (isCancelled) return;

        setFeaturedQuote(localFeaturedQuote);
        setFeaturedDate(getLocalDateKey());
        setQuoteSource(null);
        setQuoteAttribution(null);

        if (!hasUserSelectedQuote.current) {
          setActiveQuote(localFeaturedQuote);
          setActiveIndex(initialIndex);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingDailyQuote(false);
        }
      }
    };

    void loadTodayQuote();

    return () => {
      isCancelled = true;
    };
  }, [initialIndex, localFeaturedQuote]);

  useEffect(() => {
    let isCancelled = false;

    const loadCurrentStreak = async () => {
      try {
        const response = await analyticsService.getSummary('7days');
        if (isCancelled) return;

        setCurrentStreak((response.data as SummaryData).currentStreak || 0);
      } catch {
        if (!isCancelled) {
          setCurrentStreak(0);
        }
      }
    };

    void loadCurrentStreak();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const loadSavedQuotes = async () => {
      setSavedQuotesLoading(true);
      setSavedQuotesError('');

      try {
        const response = await inspirationService.getSaved();
        if (!isCancelled) setSavedQuotes(response.data);
      } catch (error: any) {
        if (!isCancelled) {
          setSavedQuotes([]);
          setSavedQuotesError(error?.response?.data?.message || 'Your saved quote library could not be loaded.');
        }
      } finally {
        if (!isCancelled) setSavedQuotesLoading(false);
      }
    };

    void loadSavedQuotes();

    return () => {
      isCancelled = true;
    };
  }, []);

  const activeQuoteKey = getQuoteFavoriteKey(activeQuote);
  const activeFavorite = savedQuotes.find((quote) => quote.quoteKey === activeQuoteKey) || null;
  const isShowingDailyQuote = !activeSavedQuote && activeQuote.id === featuredQuote.id;
  const activeQuoteSource: SavedInspirationQuoteSource = activeSavedQuote?.source
    || (isShowingDailyQuote ? quoteSource || 'fallback' : 'collection');
  const visibleAttribution = activeSavedQuote?.attribution
    || (isShowingDailyQuote && quoteSource === 'zenquotes' ? quoteAttribution : null);
  const totalQuotes = dashboardQuotes.length || 1;
  const sharePath = buildQuoteSharePath(activeQuote, {
    attribution: visibleAttribution,
    date: isShowingDailyQuote ? featuredDate : activeSavedQuote?.createdAt.slice(0, 10) || getLocalDateKey(),
    source: activeQuoteSource,
    streak: currentStreak,
  });

  const handleShiftQuote = (offset: number) => {
    if (!dashboardQuotes.length) return;

    hasUserSelectedQuote.current = true;
    setActiveSavedQuote(null);
    const nextIndex = getShiftedQuoteIndex(dashboardQuotes, activeIndex, offset);
    setActiveIndex(nextIndex);
    setActiveQuote(dashboardQuotes[nextIndex] || fallbackQuote);
  };

  const handleSelectCollectionQuote = (index: number) => {
    if (index < 0 || index >= dashboardQuotes.length) return;

    hasUserSelectedQuote.current = true;
    setActiveSavedQuote(null);
    setActiveIndex(index);
    setActiveQuote(dashboardQuotes[index]);
  };

  const handleSelectFeaturedQuote = () => {
    hasUserSelectedQuote.current = false;
    setActiveSavedQuote(null);
    setActiveQuote(featuredQuote);
  };

  const handleSelectSavedQuote = (quote: SavedInspirationQuote) => {
    hasUserSelectedQuote.current = true;
    setActiveSavedQuote(quote);
    setActiveQuote({
      id: quote.quoteKey,
      text: quote.text,
      author: quote.author,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeSavedQuote = async (quote: SavedInspirationQuote) => {
    const response = await inspirationService.removeSaved(quote.id);
    setSavedQuotes((current) => current.filter((savedQuote) => savedQuote.id !== quote.id));
    setActiveSavedQuote((current) => current?.id === quote.id ? null : current);
    toast.success(response.message || 'Quote removed from your inspiration library');
  };

  const handleToggleFavorite = async () => {
    setFavoriteActionPending(true);

    try {
      if (activeFavorite) {
        await removeSavedQuote(activeFavorite);
        return;
      }

      const response = await inspirationService.save({
        quoteKey: activeQuoteKey,
        text: activeQuote.text,
        author: activeQuote.author,
        source: activeQuoteSource,
        attribution: visibleAttribution,
      });
      setSavedQuotes((current) => [
        response.data,
        ...current.filter((quote) => quote.id !== response.data.id),
      ]);
      toast.success(response.message || 'Quote saved to your inspiration library');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to update your inspiration library');
    } finally {
      setFavoriteActionPending(false);
    }
  };

  const handleRemoveSavedQuote = async (quote: SavedInspirationQuote) => {
    setFavoriteActionPending(true);

    try {
      await removeSavedQuote(quote);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Unable to remove this quote from your library');
    } finally {
      setFavoriteActionPending(false);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);

    try {
      await downloadQuoteCard(activeQuote);
      toast.success('Inspiration card downloaded');
    } catch (error: any) {
      toast.error(error?.message || 'Unable to download the inspiration card');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="editorial-page animate-fade-in">
      <section className="overflow-hidden rounded-[2rem] border border-sage-200 bg-gradient-to-br from-white via-sage-50 to-sand-50 shadow-soft dark:border-white/10 dark:from-[#18231d] dark:via-[#121b16] dark:to-[#0f1712]">
        <div className="flex flex-col gap-6 px-6 py-8 sm:px-8 lg:flex-row lg:items-end lg:justify-between lg:px-10">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sage-500 dark:text-sage-300">Daily Inspiration</p>
            <h1 className="compact-hero-title mt-3 text-sage-900 dark:text-sage-50">
              A quieter utility for your daily reset.
            </h1>
            <p className="compact-lead mt-4 max-w-2xl text-sage-600 dark:text-sage-200">
              This page keeps inspiration separate from the dashboard so your home screen stays action-oriented while quotes remain easy to revisit, reflect on, and share.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-sage-100 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sage-500 dark:text-sage-300">Today</p>
            <p className="compact-display-value mt-2 text-sage-800 dark:text-sage-50">{featuredDate}</p>
            <p className="mt-2 text-sm font-medium text-sage-700 dark:text-sage-100">By {featuredQuote.author}</p>
            <p className="mt-2 text-sm leading-6 text-sage-600 dark:text-sage-200">
              {isLoadingDailyQuote
                ? 'Loading today\'s featured quote.'
                : isShowingDailyQuote
                  ? 'You are viewing today\'s featured quote.'
                  : 'You are browsing the wider inspiration collection.'}
            </p>
          </div>
        </div>
      </section>

      <div className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)]">
        <section className="rounded-[1.75rem] border border-sage-100 bg-white p-6 shadow-soft sm:p-8 dark:border-white/10 dark:bg-white/5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sage-500 dark:text-sage-300">
                {isLoadingDailyQuote && isShowingDailyQuote
                  ? 'Loading featured quote'
                  : isShowingDailyQuote
                    ? 'Featured today'
                    : activeSavedQuote
                      ? 'From your library'
                    : 'From the collection'}
              </p>
              <h2 className="compact-section-title mt-3 tracking-tight text-slate-900 dark:text-sage-50">
                {isShowingDailyQuote
                  ? 'Today\'s quote'
                  : activeSavedQuote
                    ? 'Saved inspiration'
                    : `Quote ${activeIndex + 1} of ${totalQuotes}`}
              </h2>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-sage-50 px-4 py-2 text-sm font-medium text-sage-700 dark:bg-white/10 dark:text-sage-100">
              <span className={`material-symbols-outlined text-base ${isLoadingDailyQuote ? 'animate-pulse' : ''}`}>ios_share</span>
              {isLoadingDailyQuote ? 'Refreshing daily quote' : 'Export-ready card'}
            </div>
          </div>

          <article className="mt-6 overflow-hidden rounded-[1.75rem] border border-sage-200 bg-gradient-to-br from-[#2f4737] via-[#45614b] to-[#7d9380] p-8 text-white shadow-soft sm:p-10">
            <div className="flex min-h-[420px] flex-col justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/65">{activeQuote.author}</p>
                <span className="material-symbols-outlined mt-6 text-5xl text-white/40">format_quote</span>
                <blockquote className="compact-display-number mt-5 max-w-3xl font-semibold leading-tight sm:text-4xl">
                  {activeQuote.text}
                </blockquote>
              </div>

              <div className="mt-8 flex flex-col gap-5 border-t border-white/15 pt-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">Author</p>
                  <p className="mt-2 text-lg font-semibold">{activeQuote.author}</p>
                  {visibleAttribution ? (
                    <p className="mt-3 text-sm leading-6 text-white/75">{visibleAttribution}</p>
                  ) : null}
                </div>
                <p className="max-w-sm text-sm leading-6 text-white/80">
                  Notice what this brings up, then carry one grounded thought into your next reflection.
                </p>
              </div>
            </div>
          </article>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              aria-pressed={Boolean(activeFavorite)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-sage-700 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-sage-800 hover:shadow-lifted disabled:cursor-not-allowed disabled:opacity-70 dark:bg-sage-500 dark:text-slate-950 dark:hover:bg-sage-400"
              disabled={favoriteActionPending || savedQuotesLoading}
              onClick={() => void handleToggleFavorite()}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">
                {activeFavorite ? 'favorite' : 'favorite_border'}
              </span>
              {favoriteActionPending
                ? 'Updating library...'
                : activeFavorite
                  ? 'Remove favorite'
                  : 'Save favorite'}
            </button>

            <button
              className="inline-flex items-center justify-center gap-2 rounded-full border border-sage-200 bg-white px-6 py-3 text-sm font-semibold text-sage-700 transition-all hover:bg-sage-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-white/10 dark:bg-white/5 dark:text-sage-100 dark:hover:bg-white/10"
              disabled={isDownloading}
              onClick={() => void handleDownload()}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              {isDownloading ? 'Preparing card...' : 'Download card'}
            </button>

            <Link
              className="inline-flex items-center justify-center gap-2 rounded-full border border-sage-200 bg-white px-6 py-3 text-sm font-semibold text-sage-700 transition-all hover:bg-sage-50 dark:border-white/10 dark:bg-white/5 dark:text-sage-100 dark:hover:bg-white/10"
              to="/reflection?source=inspiration"
            >
              <span className="material-symbols-outlined text-[18px]">edit_note</span>
              Use in reflection
            </Link>

            <Link
              className="inline-flex items-center justify-center gap-2 rounded-full border border-sage-200 bg-white px-6 py-3 text-sm font-semibold text-sage-700 transition-all hover:bg-sage-50 dark:border-white/10 dark:bg-white/5 dark:text-sage-100 dark:hover:bg-white/10"
              state={{ currentStreak }}
              to={sharePath}
            >
              <span className="material-symbols-outlined text-[18px]">share</span>
              Open share page
            </Link>

            {!isShowingDailyQuote ? (
              <button
                className="inline-flex items-center justify-center gap-2 rounded-full border border-sage-200 bg-white px-6 py-3 text-sm font-semibold text-sage-700 transition-all hover:bg-sage-50 dark:border-white/10 dark:bg-white/5 dark:text-sage-100 dark:hover:bg-white/10"
                onClick={handleSelectFeaturedQuote}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">wb_sunny</span>
                Return to today&apos;s quote
              </button>
            ) : null}

            <button
              className="inline-flex items-center justify-center gap-2 rounded-full border border-sage-200 bg-white px-6 py-3 text-sm font-semibold text-sage-700 transition-all hover:bg-sage-50 dark:border-white/10 dark:bg-white/5 dark:text-sage-100 dark:hover:bg-white/10"
              onClick={() => handleShiftQuote(-1)}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Previous
            </button>

            <button
              className="inline-flex items-center justify-center gap-2 rounded-full border border-sage-200 bg-white px-6 py-3 text-sm font-semibold text-sage-700 transition-all hover:bg-sage-50 dark:border-white/10 dark:bg-white/5 dark:text-sage-100 dark:hover:bg-white/10"
              onClick={() => handleShiftQuote(1)}
              type="button"
            >
              Another quote
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-[1.75rem] border border-sage-100 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-white/5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sage-500 dark:text-sage-300">How to use this</p>
            <div className="mt-5 space-y-4">
              {[
                'Open this page when you want emotional tone without interrupting the dashboard\'s action flow.',
                'Download the card when you want a shareable reminder for your own routine or social posting.',
                'Carry one phrase from the quote into your next reflection instead of treating it as passive reading.',
              ].map((item) => (
                <div key={item} className="rounded-[1.25rem] bg-sage-50 px-4 py-4 text-sm leading-7 text-sage-700 dark:bg-white/5 dark:text-sage-100">
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-slate-900 bg-gradient-to-br from-slate-900 via-[#1b2b22] to-sage-800 p-6 text-white shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">Collection</p>
            <h2 className="compact-section-title mt-3 font-semibold leading-tight">A small quote set for daily reuse</h2>
            <p className="mt-3 text-sm leading-7 text-white/80">
              Today&apos;s featured quote now comes from the server, while this local collection stays available for quick browsing and fallback coverage.
            </p>
            <div className="mt-6 grid gap-3">
              {dashboardQuotes.slice(0, 3).map((quote) => (
                <button
                  key={quote.id}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left transition-all hover:bg-white/10"
                  onClick={() => handleSelectCollectionQuote(dashboardQuotes.findIndex((item) => item.id === quote.id))}
                  type="button"
                >
                  <p className="text-sm font-semibold leading-6 text-white/90">{quote.text}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">{quote.author}</p>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>

      <section className="mt-8 rounded-[1.75rem] border border-sage-100 bg-white p-6 shadow-soft sm:p-8 dark:border-white/10 dark:bg-white/5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sage-500 dark:text-sage-300">Personal Quote Library</p>
            <h2 className="compact-section-title mt-2 font-semibold text-sage-900 dark:text-sage-50">Inspiration worth returning to</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-sage-600 dark:text-sage-200">
              Favorite quotes stay connected to your account so you can reopen, reflect on, download, or share them later.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-sage-50 px-4 py-2 text-sm font-semibold text-sage-700 dark:bg-white/10 dark:text-sage-100">
            <span className="material-symbols-outlined text-[18px]">favorite</span>
            {savedQuotes.length} saved
          </div>
        </div>

        {savedQuotesError ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
            {savedQuotesError}
          </div>
        ) : null}

        {savedQuotesLoading ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={`saved-quote-skeleton-${index + 1}`} className="skeleton h-56 rounded-[1.5rem]" />
            ))}
          </div>
        ) : savedQuotes.length ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {savedQuotes.map((quote) => (
              <article key={quote.id} className="flex flex-col justify-between rounded-[1.5rem] border border-sage-100 bg-gradient-to-b from-sage-50/80 to-white p-5 dark:border-white/10 dark:bg-gradient-to-b dark:from-[#18231d] dark:to-[#101915]">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="material-symbols-outlined text-3xl text-sage-500 dark:text-sage-300">format_quote</span>
                    <span className="text-xs font-medium text-sage-500 dark:text-sage-300">
                      {new Date(quote.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <blockquote className="mt-4 text-lg font-semibold leading-7 text-sage-900 dark:text-sage-50">
                    {quote.text}
                  </blockquote>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-sage-500 dark:text-sage-300">
                    {quote.author}
                  </p>
                </div>

                <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                  <button
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-sage-700 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-sage-800"
                    onClick={() => handleSelectSavedQuote(quote)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[17px]">visibility</span>
                    Open quote
                  </button>
                  <button
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-sage-200 bg-white px-4 py-2.5 text-xs font-semibold text-sage-700 transition-colors hover:bg-sage-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-sage-100 dark:hover:bg-white/10"
                    disabled={favoriteActionPending}
                    onClick={() => void handleRemoveSavedQuote(quote)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[17px]">delete</span>
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-[1.5rem] border border-dashed border-sage-200 bg-sage-50/70 px-6 py-10 text-center dark:border-white/10 dark:bg-[#101915]">
            <span className="material-symbols-outlined text-4xl text-sage-400">favorite_border</span>
            <p className="mt-3 text-lg font-semibold text-sage-800 dark:text-sage-100">Your quote library is ready.</p>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-sage-500 dark:text-sage-300">
              Use Save favorite on any featured or collection quote to keep it here.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
