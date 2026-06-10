ALTER TABLE "entries"
ADD COLUMN "customSelfCareChecklist" JSONB NOT NULL DEFAULT '[]'::jsonb;
