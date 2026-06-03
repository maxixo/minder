ALTER TABLE "users"
ADD COLUMN "hasSeenDashboardWelcome" BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE "users"
SET "hasSeenDashboardWelcome" = TRUE;
