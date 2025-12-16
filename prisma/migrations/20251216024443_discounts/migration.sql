-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'BUY_X_GET_Y');

-- CreateEnum
CREATE TYPE "DiscountTargetType" AS ENUM ('PRODUCT', 'CATEGORY', 'TAG', 'ALL');

-- CreateEnum
CREATE TYPE "DiscountConditionType" AS ENUM ('MIN_QUANTITY', 'MIN_AMOUNT');

-- CreateTable
CREATE TABLE "Discount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "DiscountType" NOT NULL,
    "value" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "combinable" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Discount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscountTarget" (
    "id" TEXT NOT NULL,
    "discountId" TEXT NOT NULL,
    "targetType" "DiscountTargetType" NOT NULL,
    "targetId" TEXT,

    CONSTRAINT "DiscountTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscountCondition" (
    "id" TEXT NOT NULL,
    "discountId" TEXT NOT NULL,
    "conditionType" "DiscountConditionType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "DiscountCondition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DiscountTarget_discountId_idx" ON "DiscountTarget"("discountId");

-- CreateIndex
CREATE INDEX "DiscountCondition_discountId_idx" ON "DiscountCondition"("discountId");
