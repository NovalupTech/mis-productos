-- Crear tabla Company
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "logo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- Crear una company por defecto para los datos existentes
INSERT INTO "Company" ("id", "name", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'Empresa por Defecto', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Agregar companyId a Category como nullable primero
ALTER TABLE "Category" ADD COLUMN "companyId" TEXT;

-- Asignar la company por defecto a todas las categorías existentes
UPDATE "Category" SET "companyId" = (SELECT id FROM "Company" LIMIT 1) WHERE "companyId" IS NULL;

-- Hacer companyId NOT NULL y agregar foreign key
ALTER TABLE "Category" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Category" ADD CONSTRAINT "Category_companyId_fkey" 
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Agregar unique constraint para name y companyId
ALTER TABLE "Category" DROP CONSTRAINT IF EXISTS "Category_name_key";
ALTER TABLE "Category" ADD CONSTRAINT "Category_name_companyId_key" UNIQUE ("name", "companyId");

-- Agregar companyId a Order como nullable primero
ALTER TABLE "Order" ADD COLUMN "companyId" TEXT;

-- Asignar la company por defecto a todas las órdenes existentes
UPDATE "Order" SET "companyId" = (SELECT id FROM "Company" LIMIT 1) WHERE "companyId" IS NULL;

-- Hacer companyId NOT NULL y agregar foreign key
ALTER TABLE "Order" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Order" ADD CONSTRAINT "Order_companyId_fkey" 
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Agregar companyId a Product como nullable primero
ALTER TABLE "Product" ADD COLUMN "companyId" TEXT;

-- Asignar la company por defecto a todos los productos existentes
UPDATE "Product" SET "companyId" = (SELECT id FROM "Company" LIMIT 1) WHERE "companyId" IS NULL;

-- Hacer companyId NOT NULL y agregar foreign key
ALTER TABLE "Product" ALTER COLUMN "companyId" SET NOT NULL;
ALTER TABLE "Product" ADD CONSTRAINT "Product_companyId_fkey" 
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Agregar índice en companyId de Product
CREATE INDEX "Product_companyId_idx" ON "Product"("companyId");

-- Crear tabla Customer
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

ALTER TABLE "Customer" ADD CONSTRAINT "Customer_companyId_fkey" 
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Agregar customerId a Order (nullable porque puede ser null)
ALTER TABLE "Order" ADD COLUMN "customerId" TEXT;

ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" 
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Crear enum AttributeType
CREATE TYPE "AttributeType" AS ENUM ('text', 'number', 'select', 'multiselect');

-- Crear tabla Attribute
CREATE TABLE "Attribute" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AttributeType" NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "Attribute_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Attribute_name_companyId_key" ON "Attribute"("name", "companyId");

ALTER TABLE "Attribute" ADD CONSTRAINT "Attribute_companyId_fkey" 
    FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Crear tabla AttributeValue
CREATE TABLE "AttributeValue" (
    "id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,

    CONSTRAINT "AttributeValue_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AttributeValue" ADD CONSTRAINT "AttributeValue_attributeId_fkey" 
    FOREIGN KEY ("attributeId") REFERENCES "Attribute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Crear tabla ProductAttribute
CREATE TABLE "ProductAttribute" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,
    "attributeValueId" TEXT,
    "valueText" TEXT,
    "valueNumber" DOUBLE PRECISION,

    CONSTRAINT "ProductAttribute_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ProductAttribute" ADD CONSTRAINT "ProductAttribute_productId_fkey" 
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProductAttribute" ADD CONSTRAINT "ProductAttribute_attributeId_fkey" 
    FOREIGN KEY ("attributeId") REFERENCES "Attribute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProductAttribute" ADD CONSTRAINT "ProductAttribute_attributeValueId_fkey" 
    FOREIGN KEY ("attributeValueId") REFERENCES "AttributeValue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Crear tabla Tag
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- Crear tabla ProductTag
CREATE TABLE "ProductTag" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "ProductTag_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductTag_productId_tagId_key" ON "ProductTag"("productId", "tagId");

CREATE INDEX "ProductTag_productId_idx" ON "ProductTag"("productId");
CREATE INDEX "ProductTag_tagId_idx" ON "ProductTag"("tagId");

ALTER TABLE "ProductTag" ADD CONSTRAINT "ProductTag_productId_fkey" 
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductTag" ADD CONSTRAINT "ProductTag_tagId_fkey" 
    FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Eliminar columnas obsoletas de Product
ALTER TABLE "Product" DROP COLUMN IF EXISTS "gender";
ALTER TABLE "Product" DROP COLUMN IF EXISTS "sizes";
ALTER TABLE "Product" DROP COLUMN IF EXISTS "tags";

-- Eliminar columna size de OrderItem si existe
ALTER TABLE "OrderItem" DROP COLUMN IF EXISTS "size";

-- Eliminar índices obsoletos si existen
DROP INDEX IF EXISTS "Product_gender_idx";

-- Eliminar tipos enum obsoletos si no se usan
-- (No los eliminamos por si acaso hay otras referencias)

