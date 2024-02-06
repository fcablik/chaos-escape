/*
  Warnings:

  - You are about to drop the column `additionalNightPrice1` on the `CarModel` table. All the data in the column will be lost.
  - You are about to drop the column `additionalNightPrice2` on the `CarModel` table. All the data in the column will be lost.
  - You are about to drop the column `additionalNightPrice3` on the `CarModel` table. All the data in the column will be lost.
  - You are about to drop the column `maxGuests` on the `CarModel` table. All the data in the column will be lost.
  - You are about to drop the column `numberOfGuestsForDefaultPrice` on the `CarModel` table. All the data in the column will be lost.
  - You are about to drop the column `price1` on the `CarModel` table. All the data in the column will be lost.
  - You are about to drop the column `price2` on the `CarModel` table. All the data in the column will be lost.
  - You are about to drop the column `price3` on the `CarModel` table. All the data in the column will be lost.

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
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_CarModel" ("createdAt", "description", "id", "seo", "title", "updatedAt", "url", "visibility") SELECT "createdAt", "description", "id", "seo", "title", "updatedAt", "url", "visibility" FROM "CarModel";
DROP TABLE "CarModel";
ALTER TABLE "new_CarModel" RENAME TO "CarModel";
CREATE UNIQUE INDEX "CarModel_url_key" ON "CarModel"("url");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
