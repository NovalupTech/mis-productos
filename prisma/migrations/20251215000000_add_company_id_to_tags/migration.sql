-- Agregar companyId a Tag como nullable primero
ALTER TABLE "Tag" ADD COLUMN "companyId" TEXT;

-- Asignar companyId a los tags existentes basándose en los productos que los usan
-- Si un tag está asociado a productos, usamos el companyId del primer producto
-- Si no tiene productos, asignamos la primera compañía disponible
UPDATE "Tag" 
SET "companyId" = COALESCE(
  (SELECT DISTINCT p."companyId" 
   FROM "ProductTag" pt 
   INNER JOIN "Product" p ON pt."productId" = p."id" 
   WHERE pt."tagId" = "Tag"."id" 
   LIMIT 1),
  (SELECT id FROM "Company" LIMIT 1)
)
WHERE "companyId" IS NULL;

-- Hacer companyId NOT NULL
ALTER TABLE "Tag" ALTER COLUMN "companyId" SET NOT NULL;

-- Agregar foreign key constraint
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_companyId_fkey" 
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Eliminar el constraint único anterior de name
ALTER TABLE "Tag" DROP CONSTRAINT IF EXISTS "Tag_name_key";

-- Agregar unique constraint para name y companyId
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_name_companyId_key" UNIQUE ("name", "companyId");

-- Agregar índice para companyId
CREATE INDEX IF NOT EXISTS "Tag_companyId_idx" ON "Tag"("companyId");
