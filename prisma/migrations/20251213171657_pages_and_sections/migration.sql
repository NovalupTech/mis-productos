-- CreateEnum
CREATE TYPE "PageType" AS ENUM ('HOME', 'CATALOG', 'INFO');

-- CreateEnum
CREATE TYPE "SectionType" AS ENUM ('HERO', 'BANNER', 'TEXT', 'IMAGE', 'FEATURES', 'GALLERY', 'CTA');

-- CreateTable
CREATE TABLE "PageSection" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "type" "SectionType" NOT NULL,
    "position" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" "PageType" NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "isLanding" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PageSection_pageId_position_idx" ON "PageSection"("pageId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Page_companyId_type_key" ON "Page"("companyId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Page_companyId_slug_key" ON "Page"("companyId", "slug");
