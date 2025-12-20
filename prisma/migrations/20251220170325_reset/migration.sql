/*
  Warnings:

  - You are about to drop the column `addressId` on the `OrderAddress` table. All the data in the column will be lost.
  - Added the required column `address` to the `OrderAddress` table without a default value. This is not possible if the table is not empty.
  - Added the required column `city` to the `OrderAddress` table without a default value. This is not possible if the table is not empty.
  - Added the required column `countryId` to the `OrderAddress` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `OrderAddress` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `OrderAddress` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `OrderAddress` table without a default value. This is not possible if the table is not empty.
  - Added the required column `postalCode` to the `OrderAddress` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `UserAddress` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `UserAddress` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `UserAddress` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "OrderAddress_addressId_idx";

-- AlterTable
ALTER TABLE "OrderAddress" DROP COLUMN "addressId",
ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "address2" TEXT,
ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "countryId" TEXT NOT NULL,
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT NOT NULL,
ADD COLUMN     "postalCode" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "UserAddress" ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "OrderAddress_countryId_idx" ON "OrderAddress"("countryId");
