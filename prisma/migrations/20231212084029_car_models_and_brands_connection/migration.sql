/*
  Warnings:

  - Added the required column `carBrandId` to the `CarModel` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CarModel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "seo" TEXT,
    "visibility" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "carBrandId" TEXT NOT NULL,
    CONSTRAINT "CarModel_carBrandId_fkey" FOREIGN KEY ("carBrandId") REFERENCES "CarBrand" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CarModel" ("createdAt", "description", "id", "seo", "title", "updatedAt", "url", "visibility") SELECT "createdAt", "description", "id", "seo", "title", "updatedAt", "url", "visibility" FROM "CarModel";
DROP TABLE "CarModel";
ALTER TABLE "new_CarModel" RENAME TO "CarModel";
CREATE UNIQUE INDEX "CarModel_url_key" ON "CarModel"("url");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
