import assert from 'node:assert/strict';
import test from 'node:test';
import { isValidTimeZone } from '../src/jobs/reminderJob.ts';

test('isValidTimeZone accepts valid IANA timezone names', () => {
  assert.equal(isValidTimeZone('UTC'), true);
  assert.equal(isValidTimeZone('America/New_York'), true);
  assert.equal(isValidTimeZone('Europe/London'), true);
});

test('isValidTimeZone rejects invalid timezone values', () => {
  assert.equal(isValidTimeZone('GMT+1'), false);
  assert.equal(isValidTimeZone('invalid'), false);
  assert.equal(isValidTimeZone(''), false);
});
