-- DropForeignKey (si existe)
ALTER TABLE "OrderAddress" DROP CONSTRAINT IF EXISTS "OrderAddress_countryId_fkey";

-- Paso 1: Crear columna temporal para addressId (nullable primero)
ALTER TABLE "OrderAddress" ADD COLUMN IF NOT EXISTS "addressId" TEXT;

-- Paso 2: Para órdenes existentes, crear UserAddress si no existe y vincularlo
-- Primero, crear UserAddress para cada OrderAddress que no tenga uno asociado
DO $$
DECLARE
    order_addr RECORD;
    user_addr_id TEXT;
BEGIN
    FOR order_addr IN 
        SELECT oa.id, oa."orderId", o."userId", oa.address, oa."address2", oa."postalCode", oa.city, oa."countryId"
        FROM "OrderAddress" oa
        INNER JOIN "Order" o ON o.id = oa."orderId"
        WHERE oa."addressId" IS NULL
    LOOP
        -- Buscar si ya existe un UserAddress para este usuario
        SELECT id INTO user_addr_id
        FROM "UserAddress"
        WHERE "userId" = order_addr."userId"
        LIMIT 1;
        
        -- Si no existe, crear uno basado en los datos de OrderAddress
        IF user_addr_id IS NULL THEN
            INSERT INTO "UserAddress" (id, "userId", address, "address2", "postalCode", city, "countryId")
            VALUES (
                gen_random_uuid()::TEXT,
                order_addr."userId",
                order_addr.address,
                order_addr."address2",
                order_addr."postalCode",
                order_addr.city,
                order_addr."countryId"
            )
            RETURNING id INTO user_addr_id;
        END IF;
        
        -- Actualizar OrderAddress con el addressId
        UPDATE "OrderAddress"
        SET "addressId" = user_addr_id
        WHERE id = order_addr.id;
    END LOOP;
END $$;

-- Paso 3: Eliminar columnas antiguas (solo si existen)
ALTER TABLE "OrderAddress" DROP COLUMN IF EXISTS "firstName",
DROP COLUMN IF EXISTS "lastName",
DROP COLUMN IF EXISTS "address",
DROP COLUMN IF EXISTS "address2",
DROP COLUMN IF EXISTS "postalCode",
DROP COLUMN IF EXISTS "city",
DROP COLUMN IF EXISTS "phone",
DROP COLUMN IF EXISTS "countryId";

-- Paso 4: Hacer addressId NOT NULL y agregar foreign key
ALTER TABLE "OrderAddress" ALTER COLUMN "addressId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "OrderAddress" ADD CONSTRAINT "OrderAddress_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "UserAddress"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OrderAddress_addressId_idx" ON "OrderAddress"("addressId");
