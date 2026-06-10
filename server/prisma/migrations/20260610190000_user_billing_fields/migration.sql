ALTER TABLE "users"
ADD COLUMN "plan" TEXT NOT NULL DEFAULT 'free',
ADD COLUMN "subscriptionStatus" TEXT NOT NULL DEFAULT 'free',
ADD COLUMN "billingProvider" TEXT,
ADD COLUMN "billingCustomerId" TEXT,
ADD COLUMN "billingSubscriptionId" TEXT,
ADD COLUMN "billingInterval" TEXT,
ADD COLUMN "currentPeriodEnd" TIMESTAMP(3),
ADD COLUMN "trialEndsAt" TIMESTAMP(3),
ADD COLUMN "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "premiumInterestAt" TIMESTAMP(3),
ADD COLUMN "premiumInterestInterval" TEXT;

CREATE UNIQUE INDEX "users_billingCustomerId_key" ON "users"("billingCustomerId");
CREATE UNIQUE INDEX "users_billingSubscriptionId_key" ON "users"("billingSubscriptionId");
