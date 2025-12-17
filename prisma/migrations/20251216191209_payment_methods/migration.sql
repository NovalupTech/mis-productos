-- CreateEnum
CREATE TYPE "PaymentMethodType" AS ENUM ('BANK_TRANSFER', 'PAYPAL', 'MERCADOPAGO', 'CASH');

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" "PaymentMethodType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentMethod_companyId_type_key" ON "PaymentMethod"("companyId", "type");
