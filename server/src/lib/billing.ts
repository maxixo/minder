export type BillingPlan = 'free' | 'premium' | 'plus';
export type SubscriptionStatus = 'free' | 'trialing' | 'active' | 'past_due' | 'canceled';
export type BillingInterval = 'monthly' | 'annual';

interface BillingUser {
  plan?: string | null;
  subscriptionStatus?: string | null;
  billingProvider?: string | null;
  billingInterval?: string | null;
  currentPeriodEnd?: Date | string | null;
  trialEndsAt?: Date | string | null;
  cancelAtPeriodEnd?: boolean | null;
  premiumInterestAt?: Date | string | null;
  premiumInterestInterval?: string | null;
}

const plans: BillingPlan[] = ['free', 'premium', 'plus'];
const statuses: SubscriptionStatus[] = ['free', 'trialing', 'active', 'past_due', 'canceled'];
const intervals: BillingInterval[] = ['monthly', 'annual'];

const asIso = (value: Date | string | null | undefined) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const safeExternalUrl = (value: string | undefined) => {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol === 'https:') return url.toString();
    if (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)) return url.toString();
    return null;
  } catch {
    return null;
  }
};

export const getCheckoutUrl = (interval: BillingInterval) => safeExternalUrl(
  interval === 'annual'
    ? process.env.PREMIUM_ANNUAL_CHECKOUT_URL
    : process.env.PREMIUM_MONTHLY_CHECKOUT_URL
);

export const getBillingPortalUrl = () => safeExternalUrl(process.env.BILLING_PORTAL_URL);

export const buildBillingSummary = (user: BillingUser) => {
  const plan = plans.includes(user.plan as BillingPlan) ? user.plan as BillingPlan : 'free';
  const status = statuses.includes(user.subscriptionStatus as SubscriptionStatus)
    ? user.subscriptionStatus as SubscriptionStatus
    : 'free';
  const billingInterval = intervals.includes(user.billingInterval as BillingInterval)
    ? user.billingInterval as BillingInterval
    : null;
  const interestInterval = intervals.includes(user.premiumInterestInterval as BillingInterval)
    ? user.premiumInterestInterval as BillingInterval
    : null;

  return {
    plan,
    status,
    billingProvider: user.billingProvider || null,
    billingInterval,
    currentPeriodEnd: asIso(user.currentPeriodEnd),
    trialEndsAt: asIso(user.trialEndsAt),
    cancelAtPeriodEnd: Boolean(user.cancelAtPeriodEnd),
    premiumInterestAt: asIso(user.premiumInterestAt),
    premiumInterestInterval: interestInterval,
    checkout: {
      monthly: Boolean(getCheckoutUrl('monthly')),
      annual: Boolean(getCheckoutUrl('annual')),
    },
    portalAvailable: Boolean(getBillingPortalUrl()) && plan !== 'free',
    pricing: {
      monthly: {
        amount: 8,
        currency: 'USD',
        interval: 'month',
      },
      annual: {
        amount: 60,
        currency: 'USD',
        interval: 'year',
        monthlyEquivalent: 5,
        savingsPercent: 38,
      },
    },
    invoices: [],
  };
};
