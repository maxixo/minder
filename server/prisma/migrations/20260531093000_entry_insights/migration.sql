CREATE TABLE "entry_insights" (
    "id" UUID NOT NULL,
    "entryId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "summary" TEXT NOT NULL,
    "sentimentScore" DOUBLE PRECISION,
    "dominantEmotions" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "themes" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "stressors" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "positiveAnchors" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "suggestedActions" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "riskFlags" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "modelVersion" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entry_insights_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "entry_insights_entryId_key" ON "entry_insights"("entryId");
CREATE INDEX "entry_insights_userId_generatedAt_idx" ON "entry_insights"("userId", "generatedAt");

ALTER TABLE "entry_insights" ADD CONSTRAINT "entry_insights_entryId_fkey"
FOREIGN KEY ("entryId") REFERENCES "entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "entry_insights" ADD CONSTRAINT "entry_insights_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
