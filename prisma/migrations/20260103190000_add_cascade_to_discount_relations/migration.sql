-- Agregar onDelete Cascade a DiscountTarget
ALTER TABLE "DiscountTarget" DROP CONSTRAINT IF EXISTS "DiscountTarget_discountId_fkey";
ALTER TABLE "DiscountTarget" ADD CONSTRAINT "DiscountTarget_discountId_fkey" 
    FOREIGN KEY ("discountId") REFERENCES "Discount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Agregar onDelete Cascade a DiscountCondition
ALTER TABLE "DiscountCondition" DROP CONSTRAINT IF EXISTS "DiscountCondition_discountId_fkey";
ALTER TABLE "DiscountCondition" ADD CONSTRAINT "DiscountCondition_discountId_fkey" 
    FOREIGN KEY ("discountId") REFERENCES "Discount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
