ALTER TABLE "push_subscriptions"
ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'UTC',
ADD COLUMN "lastSentAt" TIMESTAMPTZ;

UPDATE "push_subscriptions" ps
SET "timezone" = u."timezone"
FROM "users" u
WHERE ps."userId" = u."id"
  AND COALESCE(NULLIF(TRIM(u."timezone"), ''), 'UTC') IS NOT NULL;
