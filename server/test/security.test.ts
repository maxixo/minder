import assert from 'node:assert/strict';
import test from 'node:test';
import { isAllowedAvatarUrl } from '../src/lib/avatar.ts';
import {
  isRetriableCloudinaryStatus,
  isTransientCloudinaryFetchError,
  MAX_AVATAR_UPLOAD_BYTES,
  validateAvatarUploadDataUrl,
} from '../src/lib/cloudinary.ts';
import { csrfTokensMatch, generateCsrfToken, isAllowedFetchSite } from '../src/middleware/csrf.ts';

test('isAllowedAvatarUrl only accepts https and localhost http urls', () => {
  assert.equal(isAllowedAvatarUrl('https://example.com/avatar.png'), true);
  assert.equal(isAllowedAvatarUrl('http://localhost:3000/avatar.png'), true);
  assert.equal(isAllowedAvatarUrl('http://127.0.0.1:3000/avatar.png'), true);
  assert.equal(isAllowedAvatarUrl('http://example.com/avatar.png'), false);
  assert.equal(isAllowedAvatarUrl('data:image/jpeg;base64,abcdEFGH0123+/=='), false);
  assert.equal(isAllowedAvatarUrl('javascript:alert(1)'), false);
  assert.equal(isAllowedAvatarUrl('not-a-url'), false);
});

test('validateAvatarUploadDataUrl accepts supported image data urls within size limits', () => {
  const tinyPngDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4////fwAJ+wP9KobjigAAAABJRU5ErkJggg==';

  assert.equal(validateAvatarUploadDataUrl(tinyPngDataUrl), tinyPngDataUrl);
});

test('validateAvatarUploadDataUrl rejects unsupported and oversized uploads', () => {
  assert.throws(
    () => validateAvatarUploadDataUrl('data:image/svg+xml;base64,PHN2Zz48L3N2Zz4='),
    /PNG, JPEG, WEBP, or GIF/,
  );

  const oversizedDataUrl = `data:image/png;base64,${'A'.repeat(Math.ceil((MAX_AVATAR_UPLOAD_BYTES * 4) / 3) + 8)}`;

  assert.throws(
    () => validateAvatarUploadDataUrl(oversizedDataUrl),
    /2MB or smaller/,
  );
});

test('Cloudinary retry helpers only retry transient failures', () => {
  assert.equal(isRetriableCloudinaryStatus(429), true);
  assert.equal(isRetriableCloudinaryStatus(503), true);
  assert.equal(isRetriableCloudinaryStatus(400), false);

  const transientError = new Error('fetch failed') as Error & { cause?: { code?: string; message?: string } };
  transientError.cause = { code: 'EAI_AGAIN', message: 'getaddrinfo EAI_AGAIN api.cloudinary.com' };

  const permanentError = new Error('fetch failed') as Error & { cause?: { code?: string; message?: string } };
  permanentError.cause = { code: 'ERR_INVALID_URL', message: 'Invalid URL' };

  assert.equal(isTransientCloudinaryFetchError(transientError), true);
  assert.equal(isTransientCloudinaryFetchError(permanentError), false);
});

test('csrf token helpers enforce exact token matches', () => {
  const token = generateCsrfToken();

  assert.equal(csrfTokensMatch(token, token), true);
  assert.equal(csrfTokensMatch(token, `${token}x`), false);
  assert.equal(csrfTokensMatch(token, null), false);
});

test('fetch metadata helper rejects explicit cross-site mutating requests', () => {
  assert.equal(isAllowedFetchSite(undefined), true);
  assert.equal(isAllowedFetchSite('same-origin'), true);
  assert.equal(isAllowedFetchSite('same-site'), true);
  assert.equal(isAllowedFetchSite('none'), true);
  assert.equal(isAllowedFetchSite('cross-site'), false);
});
