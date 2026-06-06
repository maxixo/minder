export type InspirationQuote = {
  text: string;
  author: string;
  source: 'zenquotes' | 'fallback';
  attribution: string | null;
  date: string;
  fetchedAt: string;
};

type InspirationCache = {
  dateKey: string | null;
  quote: InspirationQuote | null;
  fetchedAtMs: number | null;
};

type ZenQuotesItem = {
  q?: unknown;
  a?: unknown;
};

const DEFAULT_ZENQUOTES_API_URL = 'https://zenquotes.io/api/today';
const DEFAULT_ZENQUOTES_TIMEOUT_MS = 5000;
const FALLBACK_TEXT = 'A steady practice begins with one honest moment of attention.';
const FALLBACK_AUTHOR = 'MindfulLife';
const ZENQUOTES_ATTRIBUTION = 'Quotes provided by ZenQuotes';

const inspirationCache: InspirationCache = {
  dateKey: null,
  quote: null,
  fetchedAtMs: null,
};

const pad = (value: number) => String(value).padStart(2, '0');

const getDateKey = (date = new Date()) => (
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
);

const parseTimeoutMs = () => {
  const parsed = Number.parseInt(process.env.ZENQUOTES_TIMEOUT_MS || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_ZENQUOTES_TIMEOUT_MS;
};

const getZenQuotesApiUrl = () => process.env.ZENQUOTES_API_URL || DEFAULT_ZENQUOTES_API_URL;

const createFallbackQuote = (dateKey: string, fetchedAt = new Date().toISOString()): InspirationQuote => ({
  text: FALLBACK_TEXT,
  author: FALLBACK_AUTHOR,
  source: 'fallback',
  attribution: null,
  date: dateKey,
  fetchedAt,
});

const normalizeZenQuotesQuote = (payload: unknown, dateKey: string, fetchedAt: string): InspirationQuote | null => {
  if (!Array.isArray(payload) || !payload.length) {
    return null;
  }

  const firstItem = payload[0] as ZenQuotesItem | undefined;
  const text = typeof firstItem?.q === 'string' ? firstItem.q.trim() : '';
  const author = typeof firstItem?.a === 'string' ? firstItem.a.trim() : '';

  if (!text || !author) {
    return null;
  }

  return {
    text,
    author,
    source: 'zenquotes',
    attribution: ZENQUOTES_ATTRIBUTION,
    date: dateKey,
    fetchedAt,
  };
};

const setCachedQuote = (quote: InspirationQuote) => {
  inspirationCache.dateKey = quote.date;
  inspirationCache.quote = quote;
  inspirationCache.fetchedAtMs = Date.parse(quote.fetchedAt);
};

const fetchZenQuotesToday = async (dateKey: string): Promise<InspirationQuote> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), parseTimeoutMs());

  try {
    const response = await fetch(getZenQuotesApiUrl(), {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`ZenQuotes request failed with status ${response.status}`);
    }

    const fetchedAt = new Date().toISOString();
    const payload = await response.json();
    const quote = normalizeZenQuotesQuote(payload, dateKey, fetchedAt);

    if (!quote) {
      throw new Error('ZenQuotes returned an invalid daily quote payload');
    }

    return quote;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const getTodayInspirationQuote = async (): Promise<InspirationQuote> => {
  const dateKey = getDateKey();

  if (
    inspirationCache.dateKey === dateKey
    && inspirationCache.quote
    && inspirationCache.quote.source === 'zenquotes'
  ) {
    return inspirationCache.quote;
  }

  try {
    const quote = await fetchZenQuotesToday(dateKey);
    setCachedQuote(quote);
    return quote;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Get today inspiration quote failed: ${message}`);

    if (inspirationCache.quote) {
      return inspirationCache.quote;
    }

    const fallbackQuote = createFallbackQuote(dateKey);
    setCachedQuote(fallbackQuote);
    return fallbackQuote;
  }
};

export const resetInspirationCache = () => {
  inspirationCache.dateKey = null;
  inspirationCache.quote = null;
  inspirationCache.fetchedAtMs = null;
};

export const seedInspirationCache = (quote: InspirationQuote) => {
  setCachedQuote(quote);
};
