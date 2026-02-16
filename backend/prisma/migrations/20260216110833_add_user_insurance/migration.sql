-- CreateEnum
CREATE TYPE "CarType" AS ENUM ('RENTAL', 'SALE');

-- DropForeignKey
ALTER TABLE "FranchiseApplication" DROP CONSTRAINT "FranchiseApplication_userId_fkey";

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "adminRead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "expiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Car" ADD COLUMN     "accidentDescription" TEXT,
ADD COLUMN     "changedParts" TEXT[],
ADD COLUMN     "features" TEXT[],
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paintedParts" TEXT[],
ADD COLUMN     "salePrice" DECIMAL(12,2),
ADD COLUMN     "type" "CarType" NOT NULL DEFAULT 'RENTAL',
ALTER COLUMN "dailyPrice" DROP NOT NULL;

-- AlterTable
ALTER TABLE "FranchiseApplication" ADD COLUMN     "adminRead" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "userId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "ctaText" TEXT,
    "ctaLink" TEXT,
    "tag" TEXT,
    "requiredCondition" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserInsurance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "policyNumber" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "coverageType" TEXT,
    "documentUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserInsurance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Campaign_isActive_idx" ON "Campaign"("isActive");

-- CreateIndex
CREATE INDEX "Campaign_order_idx" ON "Campaign"("order");

-- CreateIndex
CREATE UNIQUE INDEX "UserInsurance_policyNumber_key" ON "UserInsurance"("policyNumber");

-- CreateIndex
CREATE INDEX "UserInsurance_userId_idx" ON "UserInsurance"("userId");

-- CreateIndex
CREATE INDEX "UserInsurance_policyNumber_idx" ON "UserInsurance"("policyNumber");

-- CreateIndex
CREATE INDEX "Car_salePrice_idx" ON "Car"("salePrice");

-- CreateIndex
CREATE INDEX "Car_type_idx" ON "Car"("type");

-- CreateIndex
CREATE INDEX "Car_isFeatured_idx" ON "Car"("isFeatured");

-- AddForeignKey
ALTER TABLE "FranchiseApplication" ADD CONSTRAINT "FranchiseApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInsurance" ADD CONSTRAINT "UserInsurance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
