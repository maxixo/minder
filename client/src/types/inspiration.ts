export type InspirationQuoteSource = 'zenquotes' | 'fallback';
export type SavedInspirationQuoteSource = InspirationQuoteSource | 'collection';

export interface InspirationQuoteResponse {
  text: string;
  author: string;
  source: InspirationQuoteSource;
  attribution: string | null;
  date: string;
  fetchedAt: string;
}

export interface SavedInspirationQuote {
  id: string;
  quoteKey: string;
  text: string;
  author: string;
  source: SavedInspirationQuoteSource;
  attribution: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SaveInspirationQuoteRequest {
  quoteKey: string;
  text: string;
  author: string;
  source: SavedInspirationQuoteSource;
  attribution?: string | null;
}
