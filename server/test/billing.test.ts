import assert from 'node:assert/strict';
import test from 'node:test';
import { buildBillingSummary } from '../src/lib/billing.ts';

test('buildBillingSummary defaults new accounts to the free plan', () => {
  const summary = buildBillingSummary({});

  assert.equal(summary.plan, 'free');
  assert.equal(summary.status, 'free');
  assert.equal(summary.currentPeriodEnd, null);
  assert.equal(summary.portalAvailable, false);
  assert.equal(summary.pricing.monthly.amount, 8);
  assert.equal(summary.pricing.annual.amount, 60);
});

test('buildBillingSummary exposes trial and renewal state', () => {
  const summary = buildBillingSummary({
    plan: 'premium',
    subscriptionStatus: 'trialing',
    billingProvider: 'stripe',
    billingInterval: 'annual',
    trialEndsAt: new Date('2026-06-24T00:00:00.000Z'),
    currentPeriodEnd: new Date('2027-06-24T00:00:00.000Z'),
  });

  assert.equal(summary.plan, 'premium');
  assert.equal(summary.status, 'trialing');
  assert.equal(summary.billingInterval, 'annual');
  assert.equal(summary.trialEndsAt, '2026-06-24T00:00:00.000Z');
  assert.equal(summary.currentPeriodEnd, '2027-06-24T00:00:00.000Z');
});
