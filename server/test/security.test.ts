import assert from 'node:assert/strict';
import test from 'node:test';
import { isAllowedAvatarUrl } from '../src/lib/avatar.ts';
import { csrfTokensMatch, generateCsrfToken, isAllowedFetchSite } from '../src/middleware/csrf.ts';

test('isAllowedAvatarUrl only accepts https and localhost http urls', () => {
  assert.equal(isAllowedAvatarUrl('https://example.com/avatar.png'), true);
  assert.equal(isAllowedAvatarUrl('http://localhost:3000/avatar.png'), true);
  assert.equal(isAllowedAvatarUrl('http://127.0.0.1:3000/avatar.png'), true);
  assert.equal(isAllowedAvatarUrl('http://example.com/avatar.png'), false);
  assert.equal(isAllowedAvatarUrl('javascript:alert(1)'), false);
  assert.equal(isAllowedAvatarUrl('not-a-url'), false);
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
