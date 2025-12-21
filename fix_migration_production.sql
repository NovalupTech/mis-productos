-- Script SQL para corregir la migración fallida en producción
-- Ejecuta este script directamente en tu base de datos de producción
-- ANTES de ejecutar: npx prisma migrate resolve --applied 20251220170325_reset

-- ============================================
-- PARTE 1: UserAddress (DEBE IR PRIMERO)
-- ============================================

-- Paso 1: Agregar columnas a UserAddress como nullable primero
ALTER TABLE "UserAddress" 
ADD COLUMN IF NOT EXISTS "firstName" TEXT,
ADD COLUMN IF NOT EXISTS "lastName" TEXT,
ADD COLUMN IF NOT EXISTS "phone" TEXT;

-- Paso 2: Actualizar UserAddress con valores por defecto si están NULL
UPDATE "UserAddress"
SET 
  "firstName" = COALESCE("firstName", 'Usuario'),
  "lastName" = COALESCE("lastName", 'Sin apellido'),
  "phone" = COALESCE("phone", '0000000000')
WHERE "firstName" IS NULL 
   OR "lastName" IS NULL 
   OR "phone" IS NULL;

-- Paso 3: Hacer las columnas de UserAddress NOT NULL
ALTER TABLE "UserAddress" 
ALTER COLUMN "firstName" SET NOT NULL,
ALTER COLUMN "lastName" SET NOT NULL,
ALTER COLUMN "phone" SET NOT NULL;

-- ============================================
-- PARTE 2: OrderAddress (DESPUÉS de UserAddress)
-- ============================================

-- Paso 4: Agregar las columnas como nullable primero (si no existen)
ALTER TABLE "OrderAddress" 
ADD COLUMN IF NOT EXISTS "address" TEXT,
ADD COLUMN IF NOT EXISTS "address2" TEXT,
ADD COLUMN IF NOT EXISTS "city" TEXT,
ADD COLUMN IF NOT EXISTS "countryId" TEXT,
ADD COLUMN IF NOT EXISTS "firstName" TEXT,
ADD COLUMN IF NOT EXISTS "lastName" TEXT,
ADD COLUMN IF NOT EXISTS "phone" TEXT,
ADD COLUMN IF NOT EXISTS "postalCode" TEXT;

-- Paso 5: Actualizar datos desde UserAddress si existe addressId
-- Ahora UserAddress ya tiene firstName, lastName y phone disponibles
UPDATE "OrderAddress" oa
SET 
  "address" = COALESCE(ua.address, 'Dirección no especificada'),
  "address2" = ua."address2",
  "city" = COALESCE(ua.city, 'Ciudad no especificada'),
  "countryId" = COALESCE(ua."countryId", (SELECT id FROM "Country" LIMIT 1)),
  "firstName" = COALESCE(ua."firstName", 'Usuario'),
  "lastName" = COALESCE(ua."lastName", 'Sin apellido'),
  "phone" = COALESCE(ua.phone, '0000000000'),
  "postalCode" = COALESCE(ua."postalCode", '00000')
FROM "UserAddress" ua
WHERE oa."addressId" = ua.id 
  AND (oa."address" IS NULL OR oa."city" IS NULL OR oa."countryId" IS NULL 
       OR oa."firstName" IS NULL OR oa."lastName" IS NULL 
       OR oa."phone" IS NULL OR oa."postalCode" IS NULL);

-- Paso 6: Para registros sin addressId, usar valores por defecto
UPDATE "OrderAddress"
SET 
  "address" = COALESCE("address", 'Dirección no especificada'),
  "city" = COALESCE("city", 'Ciudad no especificada'),
  "countryId" = COALESCE("countryId", (SELECT id FROM "Country" LIMIT 1)),
  "firstName" = COALESCE("firstName", 'Usuario'),
  "lastName" = COALESCE("lastName", 'Sin apellido'),
  "phone" = COALESCE("phone", '0000000000'),
  "postalCode" = COALESCE("postalCode", '00000')
WHERE "address" IS NULL 
   OR "city" IS NULL 
   OR "countryId" IS NULL 
   OR "firstName" IS NULL 
   OR "lastName" IS NULL 
   OR "phone" IS NULL 
   OR "postalCode" IS NULL;

-- Paso 7: Eliminar addressId y hacer las columnas NOT NULL
DROP INDEX IF EXISTS "OrderAddress_addressId_idx";
ALTER TABLE "OrderAddress" DROP COLUMN IF EXISTS "addressId";

ALTER TABLE "OrderAddress" 
ALTER COLUMN "address" SET NOT NULL,
ALTER COLUMN "city" SET NOT NULL,
ALTER COLUMN "countryId" SET NOT NULL,
ALTER COLUMN "firstName" SET NOT NULL,
ALTER COLUMN "lastName" SET NOT NULL,
ALTER COLUMN "phone" SET NOT NULL,
ALTER COLUMN "postalCode" SET NOT NULL;

-- ============================================
-- PARTE 3: Crear índices
-- ============================================

CREATE INDEX IF NOT EXISTS "OrderAddress_countryId_idx" ON "OrderAddress"("countryId");

-- ============================================
-- VERIFICACIÓN (opcional, comentar si no quieres ejecutarlo)
-- ============================================

-- Verificar que no hay NULLs en OrderAddress
-- SELECT COUNT(*) as nulls_en_orderaddress
-- FROM "OrderAddress" 
-- WHERE "address" IS NULL 
--    OR "city" IS NULL 
--    OR "countryId" IS NULL 
--    OR "firstName" IS NULL 
--    OR "lastName" IS NULL 
--    OR "phone" IS NULL 
--    OR "postalCode" IS NULL;
-- Debe retornar 0

-- Verificar que no hay NULLs en UserAddress
-- SELECT COUNT(*) as nulls_en_useraddress
-- FROM "UserAddress" 
-- WHERE "firstName" IS NULL 
--    OR "lastName" IS NULL 
--    OR "phone" IS NULL;
-- Debe retornar 0
