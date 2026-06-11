import type { DashboardQuote } from '@/constants/dashboardQuotes';

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1350;
const SHARE_CARD_WIDTH = 1080;
const SHARE_CARD_HEIGHT = 1350;
const SHARE_LOGO_URL = 'https://lh3.googleusercontent.com/aida/AP1WRLvCundqemjzSKgHRcFetGSWpcb1wzH9tAckSSy1QEXV6OnfDbRkNdJJD4fRD939T2q_YXihQlrJ-hjWpv1YyKT26fz1Tk4W6z5QrcCaLz-YeBUPs8dD-XgoWohfRsUtGTm-pM46gA_NX1tOaQ6s8eCR0HQ7mLXwTjLP3rOHzQlpLvfe5pb6T9QAbGaIOCUVLASlpjPB_k7HG4mRrZj4S6zzZxO0Tn1jC-gfIhD9g5I2DD4gPQit4TGanH0';
const SHARE_BOTANICAL_URL = 'https://lh3.googleusercontent.com/aida/AP1WRLvq9lZZjsunohZorY3UamcbYhfBe3XHoGzPa6-amzZM8OFdLvAfG_Qetx1bej1N7cQTRtdP7prC_UKiDfhEZx51OAEqrsqCp-I5rKaVCjzWkDtGl1U0XKj9RLd2iSUdIj9yGRcJXf6XKg9dBLfb3t_TeEudkAtfIfvmKc-_I5tiX-_Zvcyfacv3bWdgjY3gzFvv6W_GpG4R2zqtHw3DBIzl6LSb-pVjjAgrXG6PmOUziIig13-mvey1gsE';

const pad = (value: number) => String(value).padStart(2, '0');

export const getLocalDateKey = (date = new Date()) => (
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
);

export const getDailyQuoteIndex = (quotes: DashboardQuote[], date = new Date()) => {
  if (!quotes.length) return -1;

  const key = getLocalDateKey(date);
  const hash = key.split('').reduce((sum, char, index) => sum + (char.charCodeAt(0) * (index + 1)), 0);
  return hash % quotes.length;
};

export const getDailyQuote = (quotes: DashboardQuote[], date = new Date()) => {
  const index = getDailyQuoteIndex(quotes, date);
  return index >= 0 ? quotes[index] : null;
};

export const getShiftedQuoteIndex = (quotes: DashboardQuote[], startIndex: number, offset: number) => {
  if (!quotes.length) return -1;
  const baseIndex = startIndex >= 0 ? startIndex : 0;
  return (baseIndex + offset + quotes.length) % quotes.length;
};

export const getQuoteFavoriteKey = (quote: Pick<DashboardQuote, 'text' | 'author'>) => {
  const normalized = `${quote.author.trim().toLocaleLowerCase()}|${quote.text.trim().toLocaleLowerCase()}`;
  let hash = 2166136261;

  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= normalized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `quote-${(hash >>> 0).toString(16).padStart(8, '0')}`;
};

export const getQuoteCardFilename = (quote: DashboardQuote, date = new Date()) => {
  const slug = quote.author.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'quote';
  return `mindfullife-inspiration-${slug}-${getLocalDateKey(date)}.png`;
};

export type ShareQuoteCardOptions = {
  attribution?: string | null;
  backgroundId?: ShareCardBackgroundId;
  date?: string;
  fontColorId?: ShareCardFontColorId;
  fontFamilyId?: ShareCardFontFamilyId;
  rituals?: string[];
  showQuoteMarks?: boolean;
  source?: string | null;
  streak?: string;
  themeId?: ShareCardThemeId;
};

export type ShareCardBackgroundId =
  | 'leafy'
  | 'golden'
  | 'night'
  | 'soft-mist'
  | 'stars'
  | 'glow'
  | 'clean';
export type ShareCardThemeId = 'sage' | 'sunset' | 'dawn' | 'rose' | 'ocean' | 'ember' | 'midnight';
export type ShareCardFontColorId = 'charcoal' | 'forest' | 'clay' | 'ocean' | 'ivory';
export type ShareCardFontFamilyId = 'editorial' | 'modern' | 'classic' | 'literary';

type ShareCardTheme = {
  id: ShareCardThemeId;
  label: string;
  backgroundStart: string;
  backgroundMid: string;
  backgroundEnd: string;
  imageOverlay: string;
  shellFill: string;
  shellBorder: string;
  panelFill: string;
  panelBorder: string;
  accent: string;
  accentSoft: string;
  accentMuted: string;
  textPrimary: string;
  textSecondary: string;
  badgeText: string;
  badgeIconColor: string;
  divider: string;
  shadow: string;
};

type ShareCardBackground = {
  id: ShareCardBackgroundId;
  label: string;
  imageUrl: string | null;
  opacity: number;
  preview: string;
  recommendedThemeId?: ShareCardThemeId;
};

type ShareCardFontColor = {
  id: ShareCardFontColorId;
  label: string;
  swatch: string;
  primary: string;
  secondary: string;
  muted: string;
  badgeText: string;
};

type ShareCardFontFamily = {
  id: ShareCardFontFamilyId;
  label: string;
  previewFamily: string;
  quoteFamily: string;
  bodyFamily: string;
  metaFamily: string;
};

export const SHARE_CARD_THEMES: Record<ShareCardThemeId, ShareCardTheme> = {
  sage: {
    id: 'sage',
    label: 'Sage',
    backgroundStart: '#eef5ee',
    backgroundMid: '#dce8db',
    backgroundEnd: '#f5efe6',
    imageOverlay: 'rgba(255,255,255,0.12)',
    shellFill: 'rgba(255,255,255,0.12)',
    shellBorder: 'rgba(255,255,255,0.32)',
    panelFill: 'rgba(255,255,255,0.60)',
    panelBorder: 'rgba(255,255,255,0.40)',
    accent: '#375541',
    accentSoft: 'rgba(55, 85, 65, 0.18)',
    accentMuted: 'rgba(55, 85, 65, 0.60)',
    textPrimary: '#1a1c1a',
    textSecondary: '#375541',
    badgeText: '#375541',
    badgeIconColor: '#ffffff',
    divider: 'rgba(55, 85, 65, 0.10)',
    shadow: '0 28px 70px -36px rgba(26, 28, 26, 0.35)',
  },
  sunset: {
    id: 'sunset',
    label: 'Sunset',
    backgroundStart: '#fff1e6',
    backgroundMid: '#f3d6c4',
    backgroundEnd: '#e8b08a',
    imageOverlay: 'rgba(255,248,244,0.10)',
    shellFill: 'rgba(255,248,244,0.18)',
    shellBorder: 'rgba(255,245,240,0.36)',
    panelFill: 'rgba(255,245,240,0.66)',
    panelBorder: 'rgba(255,240,235,0.45)',
    accent: '#7d4d3b',
    accentSoft: 'rgba(125, 77, 59, 0.18)',
    accentMuted: 'rgba(125, 77, 59, 0.62)',
    textPrimary: '#2f211c',
    textSecondary: '#7d4d3b',
    badgeText: '#7d4d3b',
    badgeIconColor: '#ffffff',
    divider: 'rgba(125, 77, 59, 0.14)',
    shadow: '0 28px 70px -36px rgba(74, 41, 28, 0.34)',
  },
  dawn: {
    id: 'dawn',
    label: 'Dawn',
    backgroundStart: '#fff6ea',
    backgroundMid: '#f2e4cf',
    backgroundEnd: '#d9c6b0',
    imageOverlay: 'rgba(255,252,247,0.12)',
    shellFill: 'rgba(255,255,255,0.16)',
    shellBorder: 'rgba(255,251,245,0.34)',
    panelFill: 'rgba(255,250,244,0.68)',
    panelBorder: 'rgba(255,245,236,0.46)',
    accent: '#7a6246',
    accentSoft: 'rgba(122, 98, 70, 0.16)',
    accentMuted: 'rgba(122, 98, 70, 0.58)',
    textPrimary: '#2b241d',
    textSecondary: '#6f563b',
    badgeText: '#6f563b',
    badgeIconColor: '#fffaf5',
    divider: 'rgba(122, 98, 70, 0.14)',
    shadow: '0 28px 70px -36px rgba(73, 54, 36, 0.32)',
  },
  rose: {
    id: 'rose',
    label: 'Rose',
    backgroundStart: '#fff0ef',
    backgroundMid: '#f0d8d8',
    backgroundEnd: '#d7b0b2',
    imageOverlay: 'rgba(255,248,249,0.12)',
    shellFill: 'rgba(255,255,255,0.16)',
    shellBorder: 'rgba(255,247,248,0.35)',
    panelFill: 'rgba(255,248,248,0.66)',
    panelBorder: 'rgba(255,239,240,0.44)',
    accent: '#7a4d58',
    accentSoft: 'rgba(122, 77, 88, 0.16)',
    accentMuted: 'rgba(122, 77, 88, 0.60)',
    textPrimary: '#2f2125',
    textSecondary: '#7a4d58',
    badgeText: '#7a4d58',
    badgeIconColor: '#fff7f8',
    divider: 'rgba(122, 77, 88, 0.14)',
    shadow: '0 28px 70px -36px rgba(78, 45, 52, 0.34)',
  },
  ocean: {
    id: 'ocean',
    label: 'Ocean',
    backgroundStart: '#19343c',
    backgroundMid: '#16303a',
    backgroundEnd: '#0f1f27',
    imageOverlay: 'rgba(7,15,19,0.24)',
    shellFill: 'rgba(255,255,255,0.06)',
    shellBorder: 'rgba(198, 225, 232, 0.14)',
    panelFill: 'rgba(255,255,255,0.08)',
    panelBorder: 'rgba(198, 225, 232, 0.18)',
    accent: '#c5e3e7',
    accentSoft: 'rgba(197, 227, 231, 0.14)',
    accentMuted: 'rgba(197, 227, 231, 0.62)',
    textPrimary: '#f4fbfc',
    textSecondary: '#d9edf0',
    badgeText: '#d9edf0',
    badgeIconColor: '#10232a',
    divider: 'rgba(197, 227, 231, 0.12)',
    shadow: '0 28px 70px -36px rgba(2, 8, 10, 0.72)',
  },
  ember: {
    id: 'ember',
    label: 'Ember',
    backgroundStart: '#3c241b',
    backgroundMid: '#2b1b16',
    backgroundEnd: '#1a120f',
    imageOverlay: 'rgba(10,7,6,0.22)',
    shellFill: 'rgba(255,255,255,0.05)',
    shellBorder: 'rgba(238, 218, 198, 0.14)',
    panelFill: 'rgba(255,255,255,0.08)',
    panelBorder: 'rgba(238, 218, 198, 0.18)',
    accent: '#f2d5b7',
    accentSoft: 'rgba(242, 213, 183, 0.14)',
    accentMuted: 'rgba(242, 213, 183, 0.62)',
    textPrimary: '#fff8f1',
    textSecondary: '#f3e0cf',
    badgeText: '#f3e0cf',
    badgeIconColor: '#2e1c15',
    divider: 'rgba(242, 213, 183, 0.12)',
    shadow: '0 28px 70px -36px rgba(7, 3, 2, 0.72)',
  },
  midnight: {
    id: 'midnight',
    label: 'Midnight',
    backgroundStart: '#1b2b22',
    backgroundMid: '#15201a',
    backgroundEnd: '#0f1712',
    imageOverlay: 'rgba(8,14,11,0.26)',
    shellFill: 'rgba(255,255,255,0.05)',
    shellBorder: 'rgba(199,216,201,0.14)',
    panelFill: 'rgba(255,255,255,0.08)',
    panelBorder: 'rgba(199,216,201,0.18)',
    accent: '#cfe0d1',
    accentSoft: 'rgba(207, 224, 209, 0.14)',
    accentMuted: 'rgba(207, 224, 209, 0.62)',
    textPrimary: '#f1f7f1',
    textSecondary: '#d9e7db',
    badgeText: '#d9e7db',
    badgeIconColor: '#102017',
    divider: 'rgba(207, 224, 209, 0.12)',
    shadow: '0 28px 70px -36px rgba(3, 8, 5, 0.72)',
  },
};

export const SHARE_CARD_BACKGROUNDS: Record<ShareCardBackgroundId, ShareCardBackground> = {
  leafy: {
    id: 'leafy',
    label: 'Leafy',
    imageUrl: SHARE_BOTANICAL_URL,
    opacity: 0.68,
    preview: SHARE_BOTANICAL_URL,
    recommendedThemeId: 'sage',
  },
  golden: {
    id: 'golden',
    label: 'Golden',
    imageUrl: '/backgrounds/share-golden.png',
    opacity: 0.9,
    preview: '/backgrounds/share-golden.png',
    recommendedThemeId: 'sunset',
  },
  night: {
    id: 'night',
    label: 'Night Fern',
    imageUrl: '/backgrounds/share-night.png',
    opacity: 0.92,
    preview: '/backgrounds/share-night.png',
    recommendedThemeId: 'midnight',
  },
  'soft-mist': {
    id: 'soft-mist',
    label: 'Soft Mist',
    imageUrl: '/backgrounds/share-soft-mist.png',
    opacity: 0.92,
    preview: '/backgrounds/share-soft-mist.png',
    recommendedThemeId: 'sage',
  },
  stars: {
    id: 'stars',
    label: 'Stars',
    imageUrl: '/backgrounds/share-stars.jpg',
    opacity: 0.82,
    preview: '/backgrounds/share-stars.jpg',
    recommendedThemeId: 'midnight',
  },
  glow: {
    id: 'glow',
    label: 'Soft Glow',
    imageUrl: '/backgrounds/share-glow.jpg',
    opacity: 0.72,
    preview: '/backgrounds/share-glow.jpg',
    recommendedThemeId: 'dawn',
  },
  clean: {
    id: 'clean',
    label: 'Clean',
    imageUrl: null,
    opacity: 0,
    preview: '',
  },
};

export const SHARE_CARD_FONT_COLORS: Record<ShareCardFontColorId, ShareCardFontColor> = {
  charcoal: {
    id: 'charcoal',
    label: 'Charcoal',
    swatch: '#1f2522',
    primary: '#1f2522',
    secondary: '#35443c',
    muted: 'rgba(53, 68, 60, 0.72)',
    badgeText: '#314038',
  },
  forest: {
    id: 'forest',
    label: 'Forest',
    swatch: '#375541',
    primary: '#24362a',
    secondary: '#375541',
    muted: 'rgba(55, 85, 65, 0.74)',
    badgeText: '#375541',
  },
  clay: {
    id: 'clay',
    label: 'Clay',
    swatch: '#7d4d3b',
    primary: '#442a21',
    secondary: '#7d4d3b',
    muted: 'rgba(125, 77, 59, 0.72)',
    badgeText: '#7d4d3b',
  },
  ocean: {
    id: 'ocean',
    label: 'Ocean',
    swatch: '#2d5662',
    primary: '#1f3640',
    secondary: '#2d5662',
    muted: 'rgba(45, 86, 98, 0.72)',
    badgeText: '#2d5662',
  },
  ivory: {
    id: 'ivory',
    label: 'Ivory',
    swatch: '#f5efe5',
    primary: '#f8f4ec',
    secondary: '#f1e8db',
    muted: 'rgba(241, 232, 219, 0.78)',
    badgeText: '#f7f1e7',
  },
};

export const SHARE_CARD_FONT_FAMILIES: Record<ShareCardFontFamilyId, ShareCardFontFamily> = {
  editorial: {
    id: 'editorial',
    label: 'Editorial',
    previewFamily: '"EB Garamond", serif',
    quoteFamily: '"EB Garamond", serif',
    bodyFamily: '"Plus Jakarta Sans", sans-serif',
    metaFamily: '"JetBrains Mono", monospace',
  },
  modern: {
    id: 'modern',
    label: 'Modern',
    previewFamily: '"Inter", sans-serif',
    quoteFamily: '"Instrument Serif", serif',
    bodyFamily: '"Inter", sans-serif',
    metaFamily: '"JetBrains Mono", monospace',
  },
  classic: {
    id: 'classic',
    label: 'Classic',
    previewFamily: '"Cormorant Garamond", serif',
    quoteFamily: '"Cormorant Garamond", serif',
    bodyFamily: '"Lora", serif',
    metaFamily: '"Inter", sans-serif',
  },
  literary: {
    id: 'literary',
    label: 'Literary',
    previewFamily: '"Literata", serif',
    quoteFamily: '"Literata", serif',
    bodyFamily: '"Plus Jakarta Sans", sans-serif',
    metaFamily: '"JetBrains Mono", monospace',
  },
};

export const getShareCardTheme = (themeId?: string | null) => {
  if (themeId && themeId in SHARE_CARD_THEMES) {
    return SHARE_CARD_THEMES[themeId as ShareCardThemeId];
  }

  return SHARE_CARD_THEMES.sage;
};

export const getShareCardBackground = (backgroundId?: string | null) => {
  if (backgroundId && backgroundId in SHARE_CARD_BACKGROUNDS) {
    return SHARE_CARD_BACKGROUNDS[backgroundId as ShareCardBackgroundId];
  }

  return SHARE_CARD_BACKGROUNDS.leafy;
};

export const getShareCardFontColor = (fontColorId?: string | null) => {
  if (fontColorId && fontColorId in SHARE_CARD_FONT_COLORS) {
    return SHARE_CARD_FONT_COLORS[fontColorId as ShareCardFontColorId];
  }

  return SHARE_CARD_FONT_COLORS.charcoal;
};

export const getShareCardFontFamily = (fontFamilyId?: string | null) => {
  if (fontFamilyId && fontFamilyId in SHARE_CARD_FONT_FAMILIES) {
    return SHARE_CARD_FONT_FAMILIES[fontFamilyId as ShareCardFontFamilyId];
  }

  return SHARE_CARD_FONT_FAMILIES.editorial;
};

export const getDefaultShareCardFontColor = (themeId: ShareCardThemeId): ShareCardFontColorId => {
  if (themeId === 'midnight' || themeId === 'ocean' || themeId === 'ember') {
    return 'ivory';
  }

  if (themeId === 'sunset') {
    return 'clay';
  }

  return 'charcoal';
};

export const formatShareQuoteText = (text: string, showQuoteMarks = true) => (
  showQuoteMarks ? `"${text}"` : text
);

export const buildQuoteSharePath = (
  quote: Pick<DashboardQuote, 'text' | 'author'>,
  options?: {
    attribution?: string | null;
    date?: string;
    source?: string | null;
    streak?: number | string | null;
  },
) => {
  const params = new URLSearchParams({
    text: quote.text,
    author: quote.author,
    date: options?.date || getLocalDateKey(),
  });

  if (options?.source) {
    params.set('source', options.source);
  }

  if (options?.attribution) {
    params.set('attribution', options.attribution);
  }

  if (options?.streak != null) {
    params.set('streak', String(options.streak));
  }

  params.set('from', 'inspiration');
  return `/share?${params.toString()}`;
};

const wrapText = (context: CanvasRenderingContext2D, text: string, maxWidth: number) => {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = '';

  words.forEach((word) => {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (context.measureText(candidate).width <= maxWidth) {
      currentLine = candidate;
      return;
    }

    if (currentLine) {
      lines.push(currentLine);
    }
    currentLine = word;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};

const loadImage = async (src: string) => {
  const image = new Image();
  image.crossOrigin = 'anonymous';

  const loaded = new Promise<HTMLImageElement>((resolve, reject) => {
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load image: ${src}`));
  });

  image.src = src;
  return loaded;
};

const drawContainedImage = (
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  maxWidth: number,
  maxHeight: number,
) => {
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;

  if (!sourceWidth || !sourceHeight) {
    context.drawImage(image, x, y, maxWidth, maxHeight);
    return;
  }

  const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  const offsetX = x + ((maxWidth - drawWidth) / 2);
  const offsetY = y + ((maxHeight - drawHeight) / 2);

  context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
};

const drawRoundedRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
};

const fillRoundedRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  drawRoundedRect(context, x, y, width, height, radius);
  context.fill();
};

const strokeRoundedRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  drawRoundedRect(context, x, y, width, height, radius);
  context.stroke();
};

const drawCheckIcon = (context: CanvasRenderingContext2D, x: number, y: number, color: string) => {
  context.save();
  context.strokeStyle = color;
  context.lineWidth = 3;
  context.lineCap = 'round';
  context.beginPath();
  context.moveTo(x - 6, y + 1);
  context.lineTo(x - 1, y + 7);
  context.lineTo(x + 8, y - 6);
  context.stroke();
  context.restore();
};

const drawCalendarIcon = (context: CanvasRenderingContext2D, x: number, y: number, color: string) => {
  context.save();
  context.strokeStyle = color;
  context.lineWidth = 2.5;
  strokeRoundedRect(context, x, y, 22, 18, 4);
  context.beginPath();
  context.moveTo(x + 5, y - 2);
  context.lineTo(x + 5, y + 4);
  context.moveTo(x + 17, y - 2);
  context.lineTo(x + 17, y + 4);
  context.moveTo(x, y + 7);
  context.lineTo(x + 22, y + 7);
  context.stroke();
  context.restore();
};

const drawLeafIcon = (context: CanvasRenderingContext2D, x: number, y: number, color: string) => {
  context.save();
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(x, y + 10);
  context.quadraticCurveTo(x + 12, y - 4, x + 22, y + 8);
  context.quadraticCurveTo(x + 10, y + 22, x, y + 10);
  context.fill();
  context.strokeStyle = 'rgba(255,255,255,0.65)';
  context.lineWidth = 1.5;
  context.beginPath();
  context.moveTo(x + 5, y + 13);
  context.lineTo(x + 16, y + 4);
  context.stroke();
  context.restore();
};

export const downloadQuoteCard = async (quote: DashboardQuote, date = new Date()) => {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas is not supported in this browser.');
  }

  const background = context.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
  background.addColorStop(0, '#f6f3eb');
  background.addColorStop(0.45, '#dce8db');
  background.addColorStop(1, '#183025');
  context.fillStyle = background;
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  context.save();
  context.globalAlpha = 0.22;
  context.fillStyle = '#ffffff';
  context.beginPath();
  context.arc(190, 180, 150, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.arc(930, 1130, 230, 0, Math.PI * 2);
  context.fill();
  context.restore();

  context.strokeStyle = 'rgba(255,255,255,0.28)';
  context.lineWidth = 3;
  context.strokeRect(56, 56, CARD_WIDTH - 112, CARD_HEIGHT - 112);

  context.fillStyle = 'rgba(255,255,255,0.8)';
  context.font = '700 40px Georgia, serif';
  context.fillText('MINDFULLIFE', 96, 124);

  context.fillStyle = 'rgba(255,255,255,0.6)';
  context.font = '600 26px Arial, sans-serif';
  context.fillText('DAILY INSPIRATION', 96, 168);

  context.fillStyle = 'rgba(255,255,255,0.34)';
  context.font = '700 220px Georgia, serif';
  context.fillText('"', 92, 408);

  context.fillStyle = '#ffffff';
  context.font = '600 68px Georgia, serif';
  const lines = wrapText(context, quote.text, CARD_WIDTH - 192);
  const lineHeight = 92;
  const quoteTop = 410;
  lines.forEach((line, index) => {
    context.fillText(line, 96, quoteTop + (index * lineHeight));
  });

  const authorY = quoteTop + (lines.length * lineHeight) + 72;
  context.fillStyle = 'rgba(255,255,255,0.88)';
  context.font = '700 34px Arial, sans-serif';
  context.fillText(quote.author.toUpperCase(), 96, authorY);

  const footerY = CARD_HEIGHT - 176;
  context.fillStyle = 'rgba(255,255,255,0.92)';
  context.fillRect(96, footerY - 44, CARD_WIDTH - 192, 1);
  context.fillStyle = 'rgba(255,255,255,0.78)';
  context.font = '500 28px Arial, sans-serif';
  context.fillText('Notice one honest feeling. Then carry it into your next reflection.', 96, footerY + 24);
  context.fillText(getLocalDateKey(date), 96, footerY + 78);

  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = getQuoteCardFilename(quote, date);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadShareQuoteCard = async (
  quote: DashboardQuote,
  options: ShareQuoteCardOptions = {},
) => {
  const canvas = document.createElement('canvas');
  canvas.width = SHARE_CARD_WIDTH;
  canvas.height = SHARE_CARD_HEIGHT;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas is not supported in this browser.');
  }

  const theme = getShareCardTheme(options.themeId);
  const background = getShareCardBackground(options.backgroundId);
  const fontColor = getShareCardFontColor(options.fontColorId || getDefaultShareCardFontColor(theme.id));
  const fontFamily = getShareCardFontFamily(options.fontFamilyId);
  const dateKey = options.date || getLocalDateKey();
  const rituals = (options.rituals || []).map((ritual) => ritual.trim()).filter(Boolean);
  const streak = options.streak || '12';
  const showQuoteMarks = options.showQuoteMarks ?? true;

  const cardInset = 12;
  const cardRadius = 72;
  const cardWidth = SHARE_CARD_WIDTH - (cardInset * 2);
  const cardHeight = SHARE_CARD_HEIGHT - (cardInset * 2);

  context.clearRect(0, 0, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT);
  context.save();
  drawRoundedRect(context, cardInset, cardInset, cardWidth, cardHeight, cardRadius);
  context.clip();

  const backgroundGradient = context.createLinearGradient(0, 0, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT);
  backgroundGradient.addColorStop(0, theme.backgroundStart);
  backgroundGradient.addColorStop(0.5, theme.backgroundMid);
  backgroundGradient.addColorStop(1, theme.backgroundEnd);
  context.fillStyle = backgroundGradient;
  context.fillRect(cardInset, cardInset, cardWidth, cardHeight);

  try {
    if (!background.imageUrl) {
      throw new Error('No background image selected.');
    }

    const backgroundImage = await loadImage(background.imageUrl);
    context.save();
    context.globalAlpha = background.opacity;
    context.drawImage(backgroundImage, cardInset, cardInset, cardWidth, cardHeight);
    context.restore();
  } catch {
    if (!background.imageUrl) {
      // The clean option intentionally uses only the selected color gradient.
    } else {
    context.save();
    context.globalAlpha = 0.18;
    context.fillStyle = theme.accent;
    context.beginPath();
    context.arc(150, 210, 180, 0, Math.PI * 2);
    context.fill();
    context.beginPath();
    context.arc(900, 1090, 260, 0, Math.PI * 2);
    context.fill();
    context.restore();
    }
  }

  context.fillStyle = theme.imageOverlay;
  context.fillRect(cardInset, cardInset, cardWidth, cardHeight);

  const contentX = 80;
  const contentY = 76;
  const contentWidth = SHARE_CARD_WIDTH - (contentX * 2);

  try {
    const logoImage = await loadImage(SHARE_LOGO_URL);
    context.save();
    context.globalAlpha = 1;
    drawContainedImage(context, logoImage, contentX, contentY, 250, 72);
    context.restore();
  } catch {
    context.fillStyle = fontColor.secondary;
    context.font = `600 42px ${fontFamily.quoteFamily}`;
    context.fillText('MindfulLife', contentX, contentY + 48);
  }

  const streakWidth = 222;
  const streakHeight = 56;
  const streakX = SHARE_CARD_WIDTH - contentX - streakWidth;
  const streakY = contentY;

  context.fillStyle = theme.accentSoft;
  fillRoundedRect(context, streakX, streakY, streakWidth, streakHeight, 28);
  context.strokeStyle = theme.accentMuted;
  context.lineWidth = 2;
  strokeRoundedRect(context, streakX, streakY, streakWidth, streakHeight, 28);

  context.fillStyle = theme.accent;
  context.beginPath();
  context.arc(streakX + 28, streakY + 28, 12, 0, Math.PI * 2);
  context.fill();
  drawLeafIcon(context, streakX + 17, streakY + 16, theme.badgeIconColor);
  context.fillStyle = fontColor.badgeText;
  context.font = `600 20px ${fontFamily.bodyFamily}`;
  context.fillText(`${streak} Day Streak`, streakX + 48, streakY + 35);

  const ritualsBoxY = contentY + 128;
  const ritualsBoxHeight = 330;
  context.fillStyle = theme.panelFill;
  fillRoundedRect(context, contentX, ritualsBoxY, contentWidth, ritualsBoxHeight, 24);
  context.strokeStyle = theme.panelBorder;
  context.lineWidth = 2;
  strokeRoundedRect(context, contentX, ritualsBoxY, contentWidth, ritualsBoxHeight, 24);

  context.fillStyle = fontColor.secondary;
  drawCalendarIcon(context, contentX + 28, ritualsBoxY + 22, fontColor.secondary);
  context.font = `600 22px ${fontFamily.bodyFamily}`;
  context.fillText("TODAY'S COPING STRATEGIES", contentX + 68, ritualsBoxY + 42);

  const ritualItems = rituals.length ? rituals : ['20m Morning Meditation', 'Forest Mindful Walk', 'Gratitude Journaling'];
  if (ritualItems.length > 4) {
    const rowX = contentX + 38;
    const rowY = ritualsBoxY + 94;
    context.fillStyle = theme.accentSoft;
    context.beginPath();
    context.arc(rowX, rowY, 16, 0, Math.PI * 2);
    context.fill();
    drawCheckIcon(context, rowX, rowY, theme.accent);

    context.fillStyle = fontColor.primary;
    context.font = `400 21px ${fontFamily.bodyFamily}`;
    const strategyLines = wrapText(context, ritualItems.join(' / '), contentWidth - 112);
    strategyLines.forEach((line, index) => {
      context.fillText(line, rowX + 34, rowY + 7 + (index * 34));
    });
  } else {
    ritualItems.forEach((ritual, index) => {
      const rowY = ritualsBoxY + 94 + (index * 58);

      context.fillStyle = theme.accentSoft;
      context.beginPath();
      context.arc(contentX + 38, rowY, 16, 0, Math.PI * 2);
      context.fill();
      drawCheckIcon(context, contentX + 38, rowY, theme.accent);

      context.fillStyle = fontColor.primary;
      context.font = `400 24px ${fontFamily.bodyFamily}`;
      context.fillText(ritual, contentX + 72, rowY + 8);
    });
  }

  const dividerY = ritualsBoxY + ritualsBoxHeight + 16;
  context.strokeStyle = theme.divider;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(contentX, dividerY);
  context.lineTo(contentX + contentWidth, dividerY);
  context.stroke();

  context.fillStyle = fontColor.muted;
  context.font = `500 16px ${fontFamily.metaFamily}`;
  context.textAlign = 'center';
  context.fillText('SOUL INSIGHT', SHARE_CARD_WIDTH / 2, dividerY + 36);

  context.fillStyle = fontColor.secondary;
  context.font = `italic 48px ${fontFamily.quoteFamily}`;
  const quoteLines = wrapText(context, formatShareQuoteText(quote.text, showQuoteMarks), contentWidth - 100);
  const quoteStartY = dividerY + 82;
  quoteLines.forEach((line, index) => {
    context.fillText(line, SHARE_CARD_WIDTH / 2, quoteStartY + (index * 54));
  });

  const authorY = quoteStartY + (quoteLines.length * 54) + 26;
  context.font = `600 22px ${fontFamily.bodyFamily}`;
  context.fillStyle = fontColor.secondary;
  context.fillText(`BY ${quote.author.toUpperCase()}`, SHARE_CARD_WIDTH / 2, authorY);

  let metadataY = authorY + 32;
  if (options.attribution) {
    context.font = `500 14px ${fontFamily.metaFamily}`;
    context.fillStyle = fontColor.muted;
    context.fillText(options.attribution, SHARE_CARD_WIDTH / 2, metadataY);
    metadataY += 28;
  }

  if (options.source) {
    context.font = `500 14px ${fontFamily.metaFamily}`;
    context.fillStyle = fontColor.muted;
    context.fillText(dateKey, SHARE_CARD_WIDTH / 2, metadataY);
    metadataY += 28;
  }

  context.fillStyle = theme.accentSoft;
  fillRoundedRect(context, (SHARE_CARD_WIDTH / 2) - 32, metadataY + 12, 64, 8, 4);
  context.textAlign = 'start';
  context.restore();

  context.strokeStyle = theme.shellBorder;
  context.lineWidth = 3;
  strokeRoundedRect(context, cardInset + 1.5, cardInset + 1.5, cardWidth - 3, cardHeight - 3, cardRadius - 1.5);

  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `mindfullife-share-${quote.author.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'quote'}-${dateKey}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
