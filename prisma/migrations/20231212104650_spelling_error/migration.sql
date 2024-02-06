/*
  Warnings:

  - You are about to drop the column `countrOfOrigin` on the `CarBrand` table. All the data in the column will be lost.
  - Added the required column `countryOfOrigin` to the `CarBrand` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CarBrand" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "countryOfOrigin" TEXT NOT NULL,
    "logoIcon" TEXT,
    "seo" TEXT,
    "visibility" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_CarBrand" ("createdAt", "description", "id", "logoIcon", "seo", "title", "updatedAt", "url", "visibility") SELECT "createdAt", "description", "id", "logoIcon", "seo", "title", "updatedAt", "url", "visibility" FROM "CarBrand";
DROP TABLE "CarBrand";
ALTER TABLE "new_CarBrand" RENAME TO "CarBrand";
CREATE UNIQUE INDEX "CarBrand_url_key" ON "CarBrand"("url");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
