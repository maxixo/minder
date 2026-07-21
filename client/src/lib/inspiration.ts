import type { DashboardQuote } from '@/constants/dashboardQuotes';
import {
  BRAND_LOGO_LEAF_OFFSET_X,
  BRAND_LOGO_LEAF_PATH,
  BRAND_LOGO_LEAF_VEIN_PATH,
} from '@/lib/brandLogo';

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1350;
const SHARE_CARD_WIDTH = 1080;
const SHARE_CARD_HEIGHT = 1350;
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

const drawCoverImage = (
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) => {
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const sourceCropWidth = width / scale;
  const sourceCropHeight = height / scale;
  const sourceX = (sourceWidth - sourceCropWidth) / 2;
  const sourceY = (sourceHeight - sourceCropHeight) / 2;

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceCropWidth,
    sourceCropHeight,
    x,
    y,
    width,
    height,
  );
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

const drawCheckIcon = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  scale = 1,
) => {
  context.save();
  context.strokeStyle = color;
  context.lineWidth = 3 * scale;
  context.lineCap = 'round';
  context.beginPath();
  context.moveTo(x - (6 * scale), y + scale);
  context.lineTo(x - scale, y + (7 * scale));
  context.lineTo(x + (8 * scale), y - (6 * scale));
  context.stroke();
  context.restore();
};

const drawCalendarIcon = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  scale = 1,
) => {
  context.save();
  context.strokeStyle = color;
  context.lineWidth = 2.5 * scale;
  strokeRoundedRect(context, x, y, 22 * scale, 18 * scale, 4 * scale);
  context.beginPath();
  context.moveTo(x + (5 * scale), y - (2 * scale));
  context.lineTo(x + (5 * scale), y + (4 * scale));
  context.moveTo(x + (17 * scale), y - (2 * scale));
  context.lineTo(x + (17 * scale), y + (4 * scale));
  context.moveTo(x, y + (7 * scale));
  context.lineTo(x + (22 * scale), y + (7 * scale));
  context.stroke();
  context.restore();
};

const drawLeafIcon = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  scale = 1,
) => {
  context.save();
  context.fillStyle = color;
  context.beginPath();
  context.moveTo(x, y + (10 * scale));
  context.quadraticCurveTo(x + (12 * scale), y - (4 * scale), x + (22 * scale), y + (8 * scale));
  context.quadraticCurveTo(x + (10 * scale), y + (22 * scale), x, y + (10 * scale));
  context.fill();
  context.strokeStyle = 'rgba(255,255,255,0.65)';
  context.lineWidth = 1.5 * scale;
  context.beginPath();
  context.moveTo(x + (5 * scale), y + (13 * scale));
  context.lineTo(x + (16 * scale), y + (4 * scale));
  context.stroke();
  context.restore();
};

const drawShareBrandLogo = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  scale: number,
) => {
  const iconPath = new Path2D(BRAND_LOGO_LEAF_PATH);
  const veinPath = new Path2D(BRAND_LOGO_LEAF_VEIN_PATH);

  context.save();
  context.translate(x, y);
  context.scale(scale, scale);
  context.translate(BRAND_LOGO_LEAF_OFFSET_X, 0);
  context.strokeStyle = color;
  context.lineWidth = 2.6;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.stroke(iconPath);
  context.stroke(veinPath);
  context.restore();

  context.save();
  context.fillStyle = color;
  context.font = `600 ${24 * scale}px "Plus Jakarta Sans"`;
  context.letterSpacing = `${-0.6 * scale}px`;
  context.fillText('MindfulLife', x + (48 * scale) + (8 * scale), y + (31 * scale));
  context.restore();
};

const loadShareCardFonts = async (fontFamily: ShareCardFontFamily) => {
  if (!document.fonts) return;

  await document.fonts.ready;
  await Promise.all([
    document.fonts.load('600 24px "Plus Jakarta Sans"', 'MindfulLife'),
    document.fonts.load(`italic 500 24px ${fontFamily.quoteFamily}`, 'Soul Insight'),
    document.fonts.load(`400 13px ${fontFamily.bodyFamily}`, 'Morning Meditation'),
    document.fonts.load(`600 14px ${fontFamily.bodyFamily}`, 'Today Day Streak'),
    document.fonts.load(`400 11px ${fontFamily.metaFamily}`, 'SOUL INSIGHT'),
  ]);
  await document.fonts.ready;
};

export const downloadQuoteCard = async (quote: DashboardQuote, date = new Date()) => {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas is not supported in this browser.');
  }

  const cardInset = 64;
  const cardRadius = 48;
  const cardWidth = CARD_WIDTH - (cardInset * 2);
  const cardHeight = CARD_HEIGHT - (cardInset * 2);
  const contentInset = 72;
  const contentX = cardInset + contentInset;
  const contentWidth = cardWidth - (contentInset * 2);

  context.fillStyle = '#faf9f6';
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  context.save();
  context.shadowColor = 'rgba(26, 28, 26, 0.22)';
  context.shadowBlur = 44;
  context.shadowOffsetY = 18;
  context.fillStyle = '#45614b';
  fillRoundedRect(context, cardInset, cardInset, cardWidth, cardHeight, cardRadius);
  context.restore();

  context.save();
  drawRoundedRect(context, cardInset, cardInset, cardWidth, cardHeight, cardRadius);
  context.clip();

  const background = context.createLinearGradient(cardInset, cardInset, cardInset + cardWidth, cardInset + cardHeight);
  background.addColorStop(0, '#2f4737');
  background.addColorStop(0.5, '#45614b');
  background.addColorStop(1, '#7d9380');
  context.fillStyle = background;
  context.fillRect(cardInset, cardInset, cardWidth, cardHeight);

  context.fillStyle = 'rgba(255,255,255,0.65)';
  context.font = '600 20px "Plus Jakarta Sans", Inter, sans-serif';
  context.letterSpacing = '5px';
  context.fillText(quote.author.toUpperCase(), contentX, cardInset + 104);

  context.letterSpacing = '0px';
  context.fillStyle = 'rgba(255,255,255,0.40)';
  context.font = '700 112px Georgia, serif';
  context.fillText('“', contentX - 4, cardInset + 244);

  const quoteTop = cardInset + 292;
  const quoteBottom = cardInset + cardHeight - 350;
  let quoteFontSize = 58;
  let lineHeight = 70;
  let lines: string[] = [];

  do {
    context.font = `600 ${quoteFontSize}px "Plus Jakarta Sans", Inter, sans-serif`;
    lines = wrapText(context, quote.text, contentWidth);
    lineHeight = Math.round(quoteFontSize * 1.2);
    if ((lines.length * lineHeight) <= (quoteBottom - quoteTop) || quoteFontSize <= 40) break;
    quoteFontSize -= 2;
  } while (quoteFontSize >= 40);

  context.fillStyle = '#ffffff';
  lines.forEach((line, index) => {
    context.fillText(line, contentX, quoteTop + (index * lineHeight));
  });

  const dividerY = cardInset + cardHeight - 300;
  context.strokeStyle = 'rgba(255,255,255,0.15)';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(contentX, dividerY);
  context.lineTo(contentX + contentWidth, dividerY);
  context.stroke();

  context.fillStyle = 'rgba(255,255,255,0.60)';
  context.font = '600 17px "Plus Jakarta Sans", Inter, sans-serif';
  context.letterSpacing = '4px';
  context.fillText('AUTHOR', contentX, dividerY + 58);

  context.fillStyle = '#ffffff';
  context.font = '600 28px "Plus Jakarta Sans", Inter, sans-serif';
  context.letterSpacing = '0px';
  context.fillText(quote.author, contentX, dividerY + 105);

  context.fillStyle = 'rgba(255,255,255,0.80)';
  context.font = '400 22px "Plus Jakarta Sans", Inter, sans-serif';
  const footerTextX = contentX + 420;
  const footerLines = wrapText(
    context,
    'Notice what this brings up, then carry one grounded thought into your next reflection.',
    contentWidth - 420,
  );
  footerLines.forEach((line, index) => {
    context.fillText(line, footerTextX, dividerY + 58 + (index * 34));
  });
  context.restore();

  context.strokeStyle = '#eeeeea';
  context.lineWidth = 2;
  strokeRoundedRect(context, cardInset + 1, cardInset + 1, cardWidth - 2, cardHeight - 2, cardRadius - 1);

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
  const previewScale = SHARE_CARD_WIDTH / 420;
  const px = (value: number) => value * previewScale;
  const cardInset = px(10);
  const cardRadius = px(32);
  const cardWidth = SHARE_CARD_WIDTH - (cardInset * 2);
  const cardHeight = SHARE_CARD_HEIGHT - (cardInset * 2);
  const contentX = cardInset + px(32);
  const contentY = cardInset + px(32);
  const contentWidth = cardWidth - px(64);
  const logoColor = fontColor.id === 'ivory' ? '#f1f1ed' : '#44604a';

  await loadShareCardFonts(fontFamily);

  context.fillStyle = theme.backgroundStart;
  context.fillRect(0, 0, SHARE_CARD_WIDTH, SHARE_CARD_HEIGHT);
  context.save();
  context.shadowColor = 'rgba(26, 28, 26, 0.20)';
  context.shadowBlur = px(8);
  context.shadowOffsetY = px(3);
  context.fillStyle = theme.backgroundMid;
  fillRoundedRect(context, cardInset, cardInset, cardWidth, cardHeight, cardRadius);
  context.restore();

  context.save();
  drawRoundedRect(context, cardInset, cardInset, cardWidth, cardHeight, cardRadius);
  context.clip();

  const backgroundGradient = context.createLinearGradient(
    cardInset,
    cardInset,
    cardInset + cardWidth,
    cardInset + cardHeight,
  );
  backgroundGradient.addColorStop(0, theme.backgroundStart);
  backgroundGradient.addColorStop(0.52, theme.backgroundMid);
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
    drawCoverImage(context, backgroundImage, cardInset, cardInset, cardWidth, cardHeight);
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

  drawShareBrandLogo(context, contentX, contentY, logoColor, previewScale);

  const streakHeight = px(26);
  context.font = `600 ${px(12)}px ${fontFamily.bodyFamily}`;
  const streakLabel = `${streak} Day Streak`;
  const streakWidth = px(12 + 18 + 6 + 12) + context.measureText(streakLabel).width;
  const streakX = SHARE_CARD_WIDTH - contentX - streakWidth;
  const streakY = contentY + ((px(40) - streakHeight) / 2);

  context.fillStyle = theme.accentSoft;
  fillRoundedRect(context, streakX, streakY, streakWidth, streakHeight, streakHeight / 2);
  context.strokeStyle = theme.accentMuted;
  context.lineWidth = px(1);
  strokeRoundedRect(context, streakX, streakY, streakWidth, streakHeight, streakHeight / 2);

  context.fillStyle = theme.accent;
  context.beginPath();
  context.arc(streakX + px(21), streakY + (streakHeight / 2), px(9), 0, Math.PI * 2);
  context.fill();
  drawLeafIcon(context, streakX + px(13), streakY + px(5), theme.badgeIconColor, previewScale * 0.72);
  context.fillStyle = fontColor.badgeText;
  context.font = `600 ${px(12)}px ${fontFamily.bodyFamily}`;
  context.fillText(streakLabel, streakX + px(45), streakY + px(18));

  const ritualsBoxY = contentY + px(40) + px(20);
  const panelPadding = px(20);
  const headingLineHeight = px(20);
  const headingMarginBottom = px(16);
  const ritualFontSize = px(13);
  const ritualLineHeight = px(20);
  const ritualIconSize = px(20);
  const ritualTextGap = px(8);
  const ritualItems = rituals.length ? rituals : ['20m Morning Meditation', 'Forest Mindful Walk', 'Gratitude Journaling'];
  const usesGrid = ritualItems.length > 4;
  const columnGap = px(12);
  const rowGap = usesGrid ? px(8) : px(16);
  const innerWidth = contentWidth - (panelPadding * 2);
  const columnWidth = usesGrid ? (innerWidth - columnGap) / 2 : innerWidth;
  const ritualTextWidth = columnWidth - ritualIconSize - ritualTextGap;

  context.font = `400 ${ritualFontSize}px ${fontFamily.bodyFamily}`;
  const ritualLayouts = ritualItems.map((ritual) => {
    const lines = wrapText(context, ritual, ritualTextWidth);
    return {
      lines,
      height: Math.max(ritualIconSize, lines.length * ritualLineHeight),
    };
  });

  const ritualRows: number[][] = [];
  for (let index = 0; index < ritualLayouts.length; index += usesGrid ? 2 : 1) {
    ritualRows.push(usesGrid ? [index, index + 1].filter((item) => item < ritualLayouts.length) : [index]);
  }
  const ritualsListHeight = ritualRows.reduce((height, row, rowIndex) => (
    height
    + Math.max(...row.map((item) => ritualLayouts[item].height))
    + (rowIndex ? rowGap : 0)
  ), 0);
  const ritualsBoxHeight = (panelPadding * 2) + headingLineHeight + headingMarginBottom + ritualsListHeight;

  context.fillStyle = theme.panelFill;
  fillRoundedRect(context, contentX, ritualsBoxY, contentWidth, ritualsBoxHeight, px(24));
  context.strokeStyle = theme.panelBorder;
  context.lineWidth = px(1);
  strokeRoundedRect(context, contentX, ritualsBoxY, contentWidth, ritualsBoxHeight, px(24));

  context.fillStyle = fontColor.secondary;
  drawCalendarIcon(
    context,
    contentX + panelPadding,
    ritualsBoxY + panelPadding + px(1),
    fontColor.secondary,
    previewScale * 0.9,
  );
  context.font = `600 ${px(14)}px ${fontFamily.bodyFamily}`;
  context.fillText(
    "TODAY'S RITUALS",
    contentX + panelPadding + px(28),
    ritualsBoxY + panelPadding + px(15),
  );

  let rowY = ritualsBoxY + panelPadding + headingLineHeight + headingMarginBottom;
  ritualRows.forEach((row, rowIndex) => {
    const rowHeight = Math.max(...row.map((item) => ritualLayouts[item].height));
    row.forEach((item, columnIndex) => {
      const itemX = contentX + panelPadding + (columnIndex * (columnWidth + columnGap));
      const iconCenterX = itemX + (ritualIconSize / 2);
      const iconCenterY = rowY + (ritualIconSize / 2);
      context.fillStyle = theme.accentSoft;
      context.beginPath();
      context.arc(iconCenterX, iconCenterY, ritualIconSize / 2, 0, Math.PI * 2);
      context.fill();
      drawCheckIcon(context, iconCenterX, iconCenterY, theme.accent, previewScale * 0.62);

      context.fillStyle = fontColor.primary;
      context.font = `400 ${ritualFontSize}px ${fontFamily.bodyFamily}`;
      ritualLayouts[item].lines.forEach((line, lineIndex) => {
        context.fillText(
          line,
          itemX + ritualIconSize + ritualTextGap,
          rowY + px(15) + (lineIndex * ritualLineHeight),
        );
      });
    });
    rowY += rowHeight + (rowIndex < ritualRows.length - 1 ? rowGap : 0);
  });

  const dividerY = ritualsBoxY + ritualsBoxHeight + px(16);
  context.strokeStyle = theme.divider;
  context.lineWidth = px(1);
  context.beginPath();
  context.moveTo(contentX, dividerY);
  context.lineTo(contentX + contentWidth, dividerY);
  context.stroke();

  const insightX = SHARE_CARD_WIDTH / 2;
  const insightContentTop = dividerY + px(12);
  context.fillStyle = fontColor.muted;
  context.font = `400 ${px(11)}px ${fontFamily.metaFamily}`;
  context.letterSpacing = `${px(2.2)}px`;
  context.textAlign = 'center';
  context.fillText('SOUL INSIGHT', insightX, insightContentTop + px(13));

  context.fillStyle = fontColor.secondary;
  context.font = `italic 500 ${px(24)}px ${fontFamily.quoteFamily}`;
  context.letterSpacing = '0px';
  const quoteLines = wrapText(context, formatShareQuoteText(quote.text, showQuoteMarks), contentWidth - px(32));
  const quoteLineHeight = px(39);
  const quoteStartY = insightContentTop + px(11 + 8 + 24);
  quoteLines.forEach((line, index) => {
    context.fillText(line, insightX, quoteStartY + (index * quoteLineHeight));
  });

  const authorY = quoteStartY + ((quoteLines.length - 1) * quoteLineHeight) + px(12 + 20);
  context.font = `600 ${px(14)}px ${fontFamily.bodyFamily}`;
  context.letterSpacing = `${px(2.24)}px`;
  context.fillStyle = fontColor.secondary;
  context.fillText(`BY ${quote.author.toUpperCase()}`, insightX, authorY);

  let metadataY = authorY + px(8 + 15);
  context.letterSpacing = '0px';
  if (options.attribution) {
    context.font = `400 ${px(11)}px ${fontFamily.metaFamily}`;
    context.fillStyle = fontColor.muted;
    context.fillText(options.attribution, insightX, metadataY);
    metadataY += px(8 + 15);
  }

  if (options.source) {
    context.font = `400 ${px(11)}px ${fontFamily.metaFamily}`;
    context.letterSpacing = `${px(1.32)}px`;
    context.fillStyle = fontColor.muted;
    context.fillText(dateKey, insightX, metadataY);
    metadataY += px(8 + 15);
  }

  context.letterSpacing = '0px';
  context.fillStyle = theme.accentSoft;
  fillRoundedRect(context, insightX - px(16), metadataY + px(14), px(32), px(4), px(2));
  context.textAlign = 'start';
  context.restore();

  context.strokeStyle = theme.shellBorder;
  context.lineWidth = px(1.5);
  strokeRoundedRect(
    context,
    cardInset + (context.lineWidth / 2),
    cardInset + (context.lineWidth / 2),
    cardWidth - context.lineWidth,
    cardHeight - context.lineWidth,
    cardRadius - (context.lineWidth / 2),
  );

  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `mindfullife-share-${quote.author.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'quote'}-${dateKey}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
