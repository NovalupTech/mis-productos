-- DropForeignKey
ALTER TABLE "Discount" DROP CONSTRAINT IF EXISTS "Discount_companyId_fkey";

-- DropForeignKey
ALTER TABLE "DiscountCondition" DROP CONSTRAINT IF EXISTS "DiscountCondition_discountId_fkey";

-- DropForeignKey
ALTER TABLE "DiscountTarget" DROP CONSTRAINT IF EXISTS "DiscountTarget_discountId_fkey";
