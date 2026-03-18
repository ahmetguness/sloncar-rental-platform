-- CreateEnum
CREATE TYPE "MembershipType" AS ENUM ('INDIVIDUAL', 'CORPORATE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "membershipType" "MembershipType" NOT NULL DEFAULT 'INDIVIDUAL',
ADD COLUMN "tcNo" TEXT,
ADD COLUMN "companyName" TEXT,
ADD COLUMN "taxNumber" TEXT,
ADD COLUMN "taxOffice" TEXT,
ADD COLUMN "companyAddress" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_taxNumber_key" ON "User"("taxNumber");

-- CreateIndex
CREATE INDEX "User_membershipType_idx" ON "User"("membershipType");
