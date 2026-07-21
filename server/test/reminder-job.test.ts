import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildDailyInspirationNotification,
  buildDailyReflectionNotification,
  isReminderDue,
  shouldStartDailyReminderJob,
  toMinutesSinceMidnight,
} from '../src/jobs/reminderJob.ts';

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

test('shouldStartDailyReminderJob defaults to enabled unless explicitly false', () => {
  assert.equal(shouldStartDailyReminderJob(undefined), true);
  assert.equal(shouldStartDailyReminderJob('true'), true);
  assert.equal(shouldStartDailyReminderJob('FALSE'), false);
});

test('buildDailyInspirationNotification links the daily quote to the inspiration page', () => {
  const notification = buildDailyInspirationNotification({
    text: 'A steady practice begins with one honest moment of attention.',
    author: 'MindfulLife',
    source: 'fallback',
    attribution: null,
    date: '2026-06-11',
    fetchedAt: '2026-06-11T08:00:00.000Z',
  });

  assert.deepEqual(notification, {
    title: 'Your daily inspiration',
    body: '"A steady practice begins with one honest moment of attention." - MindfulLife',
    url: '/inspiration',
    tag: 'daily-inspiration-reminder',
  });
});

test('buildDailyReflectionNotification keeps reflection delivery separate', () => {
  assert.deepEqual(buildDailyReflectionNotification(), {
    title: 'Time for your daily reflection',
    body: 'Take one minute to check in and log today\'s entry.',
    url: '/reflection',
    tag: 'daily-reflection-reminder',
  });
});
