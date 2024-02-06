-- CreateTable
CREATE TABLE "CarModel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "seo" TEXT,
    "visibility" BOOLEAN NOT NULL DEFAULT false,
    "price1" INTEGER NOT NULL,
    "additionalNightPrice1" INTEGER NOT NULL,
    "price2" INTEGER,
    "additionalNightPrice2" INTEGER,
    "price3" INTEGER,
    "additionalNightPrice3" INTEGER,
    "numberOfGuestsForDefaultPrice" INTEGER NOT NULL,
    "maxGuests" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CarModelsGallery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "CarModelsGalleryImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "altText" TEXT,
    "contentType" TEXT NOT NULL,
    "blob" BLOB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "carModelsGalleryId" TEXT NOT NULL,
    CONSTRAINT "CarModelsGalleryImage_carModelsGalleryId_fkey" FOREIGN KEY ("carModelsGalleryId") REFERENCES "CarModelsGallery" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CarModelFacility" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "iconName" TEXT
);

-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "seo" TEXT,
    "visibility" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PageImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "altText" TEXT,
    "contentType" TEXT NOT NULL,
    "blob" BLOB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "pageId" TEXT NOT NULL,
    CONSTRAINT "PageImage_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_CarModelToCarModelFacility" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CarModelToCarModelFacility_A_fkey" FOREIGN KEY ("A") REFERENCES "CarModel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CarModelToCarModelFacility_B_fkey" FOREIGN KEY ("B") REFERENCES "CarModelFacility" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_galleryImages" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_galleryImages_A_fkey" FOREIGN KEY ("A") REFERENCES "CarModel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_galleryImages_B_fkey" FOREIGN KEY ("B") REFERENCES "CarModelsGalleryImage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_previewImages" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_previewImages_A_fkey" FOREIGN KEY ("A") REFERENCES "CarModel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_previewImages_B_fkey" FOREIGN KEY ("B") REFERENCES "CarModelsGalleryImage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CarModel_url_key" ON "CarModel"("url");

-- CreateIndex
CREATE UNIQUE INDEX "CarModelsGallery_id_key" ON "CarModelsGallery"("id");

-- CreateIndex
CREATE INDEX "CarModelsGalleryImage_carModelsGalleryId_idx" ON "CarModelsGalleryImage"("carModelsGalleryId");

-- CreateIndex
CREATE UNIQUE INDEX "CarModelFacility_id_key" ON "CarModelFacility"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Page_url_key" ON "Page"("url");

-- CreateIndex
CREATE INDEX "PageImage_pageId_idx" ON "PageImage"("pageId");

-- CreateIndex
CREATE UNIQUE INDEX "_CarModelToCarModelFacility_AB_unique" ON "_CarModelToCarModelFacility"("A", "B");

-- CreateIndex
CREATE INDEX "_CarModelToCarModelFacility_B_index" ON "_CarModelToCarModelFacility"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_galleryImages_AB_unique" ON "_galleryImages"("A", "B");

-- CreateIndex
CREATE INDEX "_galleryImages_B_index" ON "_galleryImages"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_previewImages_AB_unique" ON "_previewImages"("A", "B");

-- CreateIndex
CREATE INDEX "_previewImages_B_index" ON "_previewImages"("B");
