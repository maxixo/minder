-- AlterTable
ALTER TABLE "entries" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "gratitude" SET DEFAULT '[]'::jsonb,
ALTER COLUMN "positiveNotes" SET DEFAULT '[]'::jsonb,
ALTER COLUMN "goodThingsHappened" SET DEFAULT '[]'::jsonb,
ALTER COLUMN "meals" SET DEFAULT '{}'::jsonb,
ALTER COLUMN "nutrition" SET DEFAULT '{}'::jsonb,
ALTER COLUMN "energyLevels" SET DEFAULT '[]'::jsonb,
ALTER COLUMN "tomorrowPlan" SET DEFAULT '{}'::jsonb,
ALTER COLUMN "additionalFeelings" SET DEFAULT '[]'::jsonb,
ALTER COLUMN "activities" SET DEFAULT '{}'::jsonb,
ALTER COLUMN "ratings" SET DEFAULT '{}'::jsonb,
ALTER COLUMN "selfCareChecklist" SET DEFAULT '{}'::jsonb,
ALTER COLUMN "emotionalGuidance" SET DEFAULT '{}'::jsonb,
ALTER COLUMN "selfCarePlanDays" SET DEFAULT '{}'::jsonb,
ALTER COLUMN "priorities" SET DEFAULT '[]'::jsonb,
ALTER COLUMN "todoList" SET DEFAULT '[]'::jsonb,
ALTER COLUMN "todayNotes" SET DEFAULT '[]'::jsonb,
ALTER COLUMN "completedSections" SET DEFAULT '[]'::jsonb,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "push_subscriptions" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "lastSentAt" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "lastReminderSentAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updatedAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMP(3);
