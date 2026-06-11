CREATE TABLE "saved_inspiration_quotes" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "quoteKey" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "attribution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_inspiration_quotes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "saved_inspiration_quotes_userId_quoteKey_key"
ON "saved_inspiration_quotes"("userId", "quoteKey");

CREATE INDEX "saved_inspiration_quotes_userId_createdAt_idx"
ON "saved_inspiration_quotes"("userId", "createdAt");

ALTER TABLE "saved_inspiration_quotes"
ADD CONSTRAINT "saved_inspiration_quotes_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
