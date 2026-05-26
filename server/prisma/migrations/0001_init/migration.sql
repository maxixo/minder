CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE "users" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "avatar" TEXT,
  "theme" TEXT NOT NULL DEFAULT 'light',
  "dailyReminder" BOOLEAN NOT NULL DEFAULT TRUE,
  "reminderTime" TEXT NOT NULL DEFAULT '20:00',
  "weeklyReport" BOOLEAN NOT NULL DEFAULT TRUE,
  "timezone" TEXT NOT NULL DEFAULT 'UTC',
  "lastReminderSentAt" TIMESTAMPTZ,
  "shareStats" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE TABLE "push_subscriptions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "endpoint" TEXT NOT NULL,
  "expirationTime" BIGINT,
  "p256dh" TEXT NOT NULL,
  "auth" TEXT NOT NULL,
  "userAgent" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "push_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "push_subscriptions_userId_endpoint_key" ON "push_subscriptions"("userId", "endpoint");
CREATE INDEX "push_subscriptions_userId_idx" ON "push_subscriptions"("userId");

CREATE TABLE "entries" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "entryDate" DATE NOT NULL,
  "weather" TEXT,
  "gratitude" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "expectations" TEXT NOT NULL DEFAULT '',
  "positiveNotes" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "whatMakesTodayGreat" TEXT NOT NULL DEFAULT '',
  "goodThingsHappened" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "selfAssessmentNote" TEXT NOT NULL DEFAULT '',
  "mood" INTEGER,
  "waterIntake" INTEGER NOT NULL DEFAULT 0,
  "sleepHours" DOUBLE PRECISION,
  "sleepQuality" TEXT,
  "meals" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "nutrition" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "energyLevels" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "tomorrowPlan" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "selfLove" TEXT NOT NULL DEFAULT '',
  "gratitudeNote" TEXT NOT NULL DEFAULT '',
  "feeling" TEXT,
  "additionalFeelings" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "activities" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "mindThoughts" TEXT NOT NULL DEFAULT '',
  "nextStep" TEXT NOT NULL DEFAULT '',
  "ratings" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "selfCareChecklist" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "emotionalGuidance" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "selfCarePlanDays" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "priorities" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "todoList" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "focus" TEXT NOT NULL DEFAULT '',
  "mindfulnessNotes" TEXT NOT NULL DEFAULT '',
  "todayNotes" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "completedSections" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "entries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "entries_userId_entryDate_key" ON "entries"("userId", "entryDate");
CREATE INDEX "entries_userId_entryDate_idx" ON "entries"("userId", "entryDate");
CREATE INDEX "entries_userId_idx" ON "entries"("userId");
