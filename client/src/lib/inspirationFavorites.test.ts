import { describe, expect, it } from 'vitest';
import { getQuoteFavoriteKey } from './inspiration';

describe('inspiration favorite keys', () => {
  it('returns the same key for equivalent quote text and author casing', () => {
    const first = getQuoteFavoriteKey({
      text: 'A steady practice begins with one honest moment.',
      author: 'MindfulLife',
    });
    const second = getQuoteFavoriteKey({
      text: '  A STEADY PRACTICE BEGINS WITH ONE HONEST MOMENT.  ',
      author: 'mindfullife',
    });

    expect(second).toBe(first);
  });

  it('returns different keys for different quotes', () => {
    const first = getQuoteFavoriteKey({ text: 'First quote', author: 'Author' });
    const second = getQuoteFavoriteKey({ text: 'Second quote', author: 'Author' });

    expect(second).not.toBe(first);
  });
});
