export type BillingPlan = 'free' | 'premium' | 'plus';
export type SubscriptionStatus = 'free' | 'trialing' | 'active' | 'past_due' | 'canceled';
export type BillingInterval = 'monthly' | 'annual';

export interface BillingPrice {
  amount: number;
  currency: string;
  interval: 'month' | 'year';
  monthlyEquivalent?: number;
  savingsPercent?: number;
}

export interface BillingInvoice {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: string;
  receiptUrl: string | null;
}

export interface BillingSummary {
  plan: BillingPlan;
  status: SubscriptionStatus;
  billingProvider: string | null;
  billingInterval: BillingInterval | null;
  currentPeriodEnd: string | null;
  trialEndsAt: string | null;
  cancelAtPeriodEnd: boolean;
  premiumInterestAt: string | null;
  premiumInterestInterval: BillingInterval | null;
  checkout: Record<BillingInterval, boolean>;
  portalAvailable: boolean;
  pricing: {
    monthly: BillingPrice;
    annual: BillingPrice;
  };
  invoices: BillingInvoice[];
}
