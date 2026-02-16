-- AlterTable
ALTER TABLE "UserInsurance" ADD COLUMN     "agentEmail" TEXT,
ADD COLUMN     "agentName" TEXT,
ADD COLUMN     "agentPhone" TEXT,
ADD COLUMN     "coverageLimit" DECIMAL(12,2),
ADD COLUMN     "deductibleAmount" DECIMAL(10,2),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "paymentStatus" TEXT NOT NULL DEFAULT 'PAID',
ADD COLUMN     "policyType" TEXT,
ADD COLUMN     "premiumAmount" DECIMAL(10,2),
ADD COLUMN     "renewalDate" TIMESTAMP(3);
