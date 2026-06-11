ALTER TABLE "users"
ADD COLUMN "inspirationReminder" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "inspirationReminderTime" TEXT NOT NULL DEFAULT '08:30';

UPDATE "users"
SET "inspirationReminder" = "dailyReminder";

ALTER TABLE "push_subscriptions"
ADD COLUMN "lastInspirationSentAt" TIMESTAMPTZ;
