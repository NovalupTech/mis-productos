-- DropForeignKey
ALTER TABLE "Discount" DROP CONSTRAINT "Discount_companyId_fkey";

-- DropForeignKey
ALTER TABLE "DiscountCondition" DROP CONSTRAINT "DiscountCondition_discountId_fkey";

-- DropForeignKey
ALTER TABLE "DiscountTarget" DROP CONSTRAINT "DiscountTarget_discountId_fkey";
