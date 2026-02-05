-- CreateEnum
CREATE TYPE "Transmission" AS ENUM ('MANUAL', 'AUTO');

-- CreateEnum
CREATE TYPE "FuelType" AS ENUM ('PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'LPG');

-- CreateEnum
CREATE TYPE "CarCategory" AS ENUM ('ECONOMY', 'COMPACT', 'MIDSIZE', 'FULLSIZE', 'SUV', 'VAN', 'LUXURY');

-- CreateEnum
CREATE TYPE "CarStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('RESERVED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PAID', 'REFUNDED');

-- CreateEnum
CREATE TYPE "FranchiseApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Car" (
    "id" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "transmission" "Transmission" NOT NULL,
    "fuel" "FuelType" NOT NULL,
    "category" "CarCategory" NOT NULL,
    "seats" INTEGER NOT NULL,
    "doors" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "dailyPrice" DECIMAL(10,2) NOT NULL,
    "weeklyPrice" DECIMAL(10,2),
    "deposit" DECIMAL(10,2),
    "mileage" INTEGER NOT NULL,
    "images" TEXT[],
    "status" "CarStatus" NOT NULL DEFAULT 'ACTIVE',
    "description" TEXT,
    "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Car_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "bookingCode" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "userId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerSurname" TEXT,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerTC" TEXT,
    "customerDriverLicense" TEXT,
    "notes" TEXT,
    "pickupDate" TIMESTAMP(3) NOT NULL,
    "dropoffDate" TIMESTAMP(3) NOT NULL,
    "originalDropoffDate" TIMESTAMP(3),
    "pickupBranchId" TEXT NOT NULL,
    "dropoffBranchId" TEXT NOT NULL,
    "totalPrice" DECIMAL(10,2),
    "status" "BookingStatus" NOT NULL DEFAULT 'RESERVED',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "paymentProvider" TEXT,
    "paymentRef" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FranchiseApplication" (
    "id" TEXT NOT NULL,
    "status" "FranchiseApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "userId" TEXT NOT NULL,
    "companyName" TEXT,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "city" TEXT,
    "details" JSONB NOT NULL DEFAULT '{}',
    "adminNotes" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FranchiseApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FranchiseAuditLog" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "previousValue" JSONB,
    "newValue" JSONB,
    "performedBy" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FranchiseAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Branch_city_idx" ON "Branch"("city");

-- CreateIndex
CREATE INDEX "Branch_isActive_idx" ON "Branch"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Car_plateNumber_key" ON "Car"("plateNumber");

-- CreateIndex
CREATE INDEX "Car_brand_idx" ON "Car"("brand");

-- CreateIndex
CREATE INDEX "Car_category_idx" ON "Car"("category");

-- CreateIndex
CREATE INDEX "Car_status_idx" ON "Car"("status");

-- CreateIndex
CREATE INDEX "Car_branchId_idx" ON "Car"("branchId");

-- CreateIndex
CREATE INDEX "Car_dailyPrice_idx" ON "Car"("dailyPrice");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_bookingCode_key" ON "Booking"("bookingCode");

-- CreateIndex
CREATE INDEX "Booking_bookingCode_idx" ON "Booking"("bookingCode");

-- CreateIndex
CREATE INDEX "Booking_carId_pickupDate_dropoffDate_idx" ON "Booking"("carId", "pickupDate", "dropoffDate");

-- CreateIndex
CREATE INDEX "Booking_carId_status_idx" ON "Booking"("carId", "status");

-- CreateIndex
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "Booking_customerPhone_idx" ON "Booking"("customerPhone");

-- CreateIndex
CREATE INDEX "FranchiseApplication_status_idx" ON "FranchiseApplication"("status");

-- CreateIndex
CREATE INDEX "FranchiseApplication_userId_idx" ON "FranchiseApplication"("userId");

-- CreateIndex
CREATE INDEX "FranchiseApplication_city_idx" ON "FranchiseApplication"("city");

-- CreateIndex
CREATE INDEX "FranchiseApplication_submittedAt_idx" ON "FranchiseApplication"("submittedAt");

-- CreateIndex
CREATE INDEX "FranchiseAuditLog_applicationId_idx" ON "FranchiseAuditLog"("applicationId");

-- CreateIndex
CREATE INDEX "FranchiseAuditLog_createdAt_idx" ON "FranchiseAuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Car" ADD CONSTRAINT "Car_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_pickupBranchId_fkey" FOREIGN KEY ("pickupBranchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_dropoffBranchId_fkey" FOREIGN KEY ("dropoffBranchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FranchiseApplication" ADD CONSTRAINT "FranchiseApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FranchiseAuditLog" ADD CONSTRAINT "FranchiseAuditLog_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "FranchiseApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
