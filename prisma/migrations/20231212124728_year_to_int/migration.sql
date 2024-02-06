/*
  Warnings:

  - You are about to alter the column `year` on the `CarModel` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CarModel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "visibility" BOOLEAN NOT NULL DEFAULT false,
    "year" INTEGER NOT NULL,
    "description" TEXT,
    "seo" TEXT,
    "videoLinks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "carBrandId" TEXT NOT NULL,
    CONSTRAINT "CarModel_carBrandId_fkey" FOREIGN KEY ("carBrandId") REFERENCES "CarBrand" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CarModel" ("carBrandId", "createdAt", "description", "id", "seo", "title", "updatedAt", "url", "videoLinks", "visibility", "year") SELECT "carBrandId", "createdAt", "description", "id", "seo", "title", "updatedAt", "url", "videoLinks", "visibility", "year" FROM "CarModel";
DROP TABLE "CarModel";
ALTER TABLE "new_CarModel" RENAME TO "CarModel";
CREATE UNIQUE INDEX "CarModel_url_key" ON "CarModel"("url");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
