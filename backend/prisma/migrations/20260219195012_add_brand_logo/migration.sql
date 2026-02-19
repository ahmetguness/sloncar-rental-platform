/*
  Warnings:

  - You are about to drop the `CarBrand` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Car" ADD COLUMN     "brandLogo" TEXT;

-- DropTable
DROP TABLE "CarBrand";
