export type InspirationQuoteSource = 'zenquotes' | 'fallback';

export interface InspirationQuoteResponse {
  text: string;
  author: string;
  source: InspirationQuoteSource;
  attribution: string | null;
  date: string;
  fetchedAt: string;
}
