import assert from 'node:assert/strict';
import test from 'node:test';
import { isReminderDue, toMinutesSinceMidnight } from '../src/jobs/reminderJob.ts';

test('toMinutesSinceMidnight converts HH:mm values', () => {
  assert.equal(toMinutesSinceMidnight('00:00'), 0);
  assert.equal(toMinutesSinceMidnight('09:30'), 570);
  assert.equal(toMinutesSinceMidnight('23:59'), 1439);
});

test('toMinutesSinceMidnight rejects invalid values', () => {
  assert.equal(toMinutesSinceMidnight('invalid'), null);
  assert.equal(toMinutesSinceMidnight('09'), null);
});

test('isReminderDue returns true at the scheduled minute and after it', () => {
  assert.equal(isReminderDue('09:30', '09:30'), true);
  assert.equal(isReminderDue('09:31', '09:30'), true);
  assert.equal(isReminderDue('10:00', '09:30'), true);
});

test('isReminderDue returns false before the scheduled minute', () => {
  assert.equal(isReminderDue('09:29', '09:30'), false);
  assert.equal(isReminderDue('08:59', '09:30'), false);
});
