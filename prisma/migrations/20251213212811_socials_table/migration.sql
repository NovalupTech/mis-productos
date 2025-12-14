-- CreateEnum
CREATE TYPE "SocialType" AS ENUM ('INSTAGRAM', 'FACEBOOK', 'TIKTOK', 'X', 'LINKEDIN', 'YOUTUBE', 'WHATSAPP', 'WEBSITE');

-- CreateTable
CREATE TABLE "CompanySocial" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" "SocialType" NOT NULL,
    "url" TEXT NOT NULL,
    "label" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanySocial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompanySocial_companyId_type_key" ON "CompanySocial"("companyId", "type");
