-- CreateTable
CREATE TABLE "CarBrand" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "seo" TEXT,
    "visibility" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CarBrandImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "altText" TEXT,
    "contentType" TEXT NOT NULL,
    "blob" BLOB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "carBrandId" TEXT NOT NULL,
    CONSTRAINT "CarBrandImage_carBrandId_fkey" FOREIGN KEY ("carBrandId") REFERENCES "CarBrand" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CarBrand_url_key" ON "CarBrand"("url");

-- CreateIndex
CREATE INDEX "CarBrandImage_carBrandId_idx" ON "CarBrandImage"("carBrandId");
