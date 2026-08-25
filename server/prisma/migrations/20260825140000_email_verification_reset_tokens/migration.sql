-- AlterTable
ALTER TABLE "users" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN "emailVerificationTokenHash" TEXT,
ADD COLUMN "emailVerificationTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN "resetTokenHash" TEXT,
ADD COLUMN "resetTokenExpiresAt" TIMESTAMP(3);
