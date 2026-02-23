/*
  Warnings:

  - You are about to drop the `UserInsurance` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "InsuranceBranch" AS ENUM ('KASKO', 'DASK', 'TRAFIK', 'KONUT', 'SAGLIK', 'DIGER');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'USER';

-- DropForeignKey
ALTER TABLE "UserInsurance" DROP CONSTRAINT "UserInsurance_userId_fkey";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER';

-- DropTable
DROP TABLE "UserInsurance";

-- CreateTable
CREATE TABLE "insurances" (
    "id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "tcNo" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "profession" TEXT,
    "phone" TEXT,
    "plate" TEXT,
    "serialOrOrderNo" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "branch" "InsuranceBranch" NOT NULL,
    "company" TEXT NOT NULL,
    "policyNo" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT,
    "adminRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "insurances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "insurances_policyNo_key" ON "insurances"("policyNo");

-- CreateIndex
CREATE INDEX "insurances_userId_idx" ON "insurances"("userId");

-- CreateIndex
CREATE INDEX "insurances_policyNo_idx" ON "insurances"("policyNo");

-- CreateIndex
CREATE INDEX "insurances_tcNo_idx" ON "insurances"("tcNo");

-- AddForeignKey
ALTER TABLE "insurances" ADD CONSTRAINT "insurances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
