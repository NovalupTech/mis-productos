-- Agregar companyId a Discount como nullable primero
ALTER TABLE "Discount" ADD COLUMN "companyId" TEXT;

-- Asignar companyId a los descuentos existentes
-- Si hay descuentos existentes, asignamos la primera compañía disponible
UPDATE "Discount" 
SET "companyId" = (SELECT id FROM "Company" LIMIT 1)
WHERE "companyId" IS NULL;

-- Hacer companyId NOT NULL
ALTER TABLE "Discount" ALTER COLUMN "companyId" SET NOT NULL;

-- Agregar foreign key constraint
ALTER TABLE "Discount" ADD CONSTRAINT "Discount_companyId_fkey" 
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Agregar índice para companyId
CREATE INDEX "Discount_companyId_idx" ON "Discount"("companyId");
