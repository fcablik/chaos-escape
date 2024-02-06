-- CreateTable
CREATE TABLE "Room" (
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
CREATE TABLE "SeasonList" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "dateFrom" TEXT NOT NULL,
    "dateTo" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "SeasonalRoomPrice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "seasonId" TEXT NOT NULL,
    "nightPrice" INTEGER NOT NULL,
    "additionalNightPrice" INTEGER NOT NULL,
    "roomId" TEXT NOT NULL,
    "weekDivisionId" TEXT NOT NULL,
    CONSTRAINT "SeasonalRoomPrice_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "SeasonList" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SeasonalRoomPrice_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SeasonalRoomPrice_weekDivisionId_fkey" FOREIGN KEY ("weekDivisionId") REFERENCES "WeekDivision" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WeekDivision" (
    "id" TEXT NOT NULL PRIMARY KEY
);

-- CreateTable
CREATE TABLE "WeekDay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dayInAWeek" TEXT NOT NULL,
    "divisionAssignmentId" TEXT,
    CONSTRAINT "WeekDay_divisionAssignmentId_fkey" FOREIGN KEY ("divisionAssignmentId") REFERENCES "WeekDivision" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RoomsGallery" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "RoomsGalleryImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "altText" TEXT,
    "contentType" TEXT NOT NULL,
    "blob" BLOB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "roomsGalleryId" TEXT NOT NULL,
    CONSTRAINT "RoomsGalleryImage_roomsGalleryId_fkey" FOREIGN KEY ("roomsGalleryId") REFERENCES "RoomsGallery" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RoomFacility" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "iconName" TEXT
);

-- CreateTable
CREATE TABLE "RoomPackageItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "visibility" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RoomMultiPackage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "dateFrom" TEXT NOT NULL,
    "dateTo" TEXT NOT NULL,
    "visibility" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RoomDiscount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "nights" TEXT,
    "code" TEXT,
    "value" INTEGER NOT NULL,
    "valueType" TEXT NOT NULL,
    "visibility" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'accepted',
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT,
    "totalPrice" INTEGER NOT NULL,
    "numberOfGuests" INTEGER NOT NULL,
    "numberOfNights" INTEGER NOT NULL,
    "reservationNumber" TEXT NOT NULL,
    "reservationDateFrom" TEXT NOT NULL,
    "reservationDateTo" TEXT NOT NULL,
    "createdAtString" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Reservation_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_RoomToRoomFacility" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_RoomToRoomFacility_A_fkey" FOREIGN KEY ("A") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_RoomToRoomFacility_B_fkey" FOREIGN KEY ("B") REFERENCES "RoomFacility" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_RoomToRoomPackageItem" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_RoomToRoomPackageItem_A_fkey" FOREIGN KEY ("A") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_RoomToRoomPackageItem_B_fkey" FOREIGN KEY ("B") REFERENCES "RoomPackageItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_RoomToRoomMultiPackage" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_RoomToRoomMultiPackage_A_fkey" FOREIGN KEY ("A") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_RoomToRoomMultiPackage_B_fkey" FOREIGN KEY ("B") REFERENCES "RoomMultiPackage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_RoomToRoomDiscount" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_RoomToRoomDiscount_A_fkey" FOREIGN KEY ("A") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_RoomToRoomDiscount_B_fkey" FOREIGN KEY ("B") REFERENCES "RoomDiscount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_RoomToSeasonList" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_RoomToSeasonList_A_fkey" FOREIGN KEY ("A") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_RoomToSeasonList_B_fkey" FOREIGN KEY ("B") REFERENCES "SeasonList" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_RoomMultiPackageToRoomPackageItem" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_RoomMultiPackageToRoomPackageItem_A_fkey" FOREIGN KEY ("A") REFERENCES "RoomMultiPackage" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_RoomMultiPackageToRoomPackageItem_B_fkey" FOREIGN KEY ("B") REFERENCES "RoomPackageItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ReservationToRoomPackageItem" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ReservationToRoomPackageItem_A_fkey" FOREIGN KEY ("A") REFERENCES "Reservation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ReservationToRoomPackageItem_B_fkey" FOREIGN KEY ("B") REFERENCES "RoomPackageItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ReservationToRoomMultiPackage" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ReservationToRoomMultiPackage_A_fkey" FOREIGN KEY ("A") REFERENCES "Reservation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ReservationToRoomMultiPackage_B_fkey" FOREIGN KEY ("B") REFERENCES "RoomMultiPackage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new__galleryImages" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_galleryImages_A_fkey" FOREIGN KEY ("A") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_galleryImages_B_fkey" FOREIGN KEY ("B") REFERENCES "RoomsGalleryImage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new__galleryImages" ("A", "B") SELECT "A", "B" FROM "_galleryImages";
DROP TABLE "_galleryImages";
ALTER TABLE "new__galleryImages" RENAME TO "_galleryImages";
CREATE UNIQUE INDEX "_galleryImages_AB_unique" ON "_galleryImages"("A", "B");
CREATE INDEX "_galleryImages_B_index" ON "_galleryImages"("B");
CREATE TABLE "new__previewImages" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_previewImages_A_fkey" FOREIGN KEY ("A") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_previewImages_B_fkey" FOREIGN KEY ("B") REFERENCES "RoomsGalleryImage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new__previewImages" ("A", "B") SELECT "A", "B" FROM "_previewImages";
DROP TABLE "_previewImages";
ALTER TABLE "new__previewImages" RENAME TO "_previewImages";
CREATE UNIQUE INDEX "_previewImages_AB_unique" ON "_previewImages"("A", "B");
CREATE INDEX "_previewImages_B_index" ON "_previewImages"("B");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "Room_url_key" ON "Room"("url");

-- CreateIndex
CREATE UNIQUE INDEX "SeasonList_id_key" ON "SeasonList"("id");

-- CreateIndex
CREATE UNIQUE INDEX "SeasonalRoomPrice_id_key" ON "SeasonalRoomPrice"("id");

-- CreateIndex
CREATE UNIQUE INDEX "WeekDivision_id_key" ON "WeekDivision"("id");

-- CreateIndex
CREATE UNIQUE INDEX "WeekDay_id_key" ON "WeekDay"("id");

-- CreateIndex
CREATE UNIQUE INDEX "WeekDay_dayInAWeek_key" ON "WeekDay"("dayInAWeek");

-- CreateIndex
CREATE UNIQUE INDEX "RoomsGallery_id_key" ON "RoomsGallery"("id");

-- CreateIndex
CREATE INDEX "RoomsGalleryImage_roomsGalleryId_idx" ON "RoomsGalleryImage"("roomsGalleryId");

-- CreateIndex
CREATE UNIQUE INDEX "RoomFacility_id_key" ON "RoomFacility"("id");

-- CreateIndex
CREATE UNIQUE INDEX "RoomPackageItem_id_key" ON "RoomPackageItem"("id");

-- CreateIndex
CREATE UNIQUE INDEX "RoomMultiPackage_id_key" ON "RoomMultiPackage"("id");

-- CreateIndex
CREATE UNIQUE INDEX "RoomDiscount_id_key" ON "RoomDiscount"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_id_key" ON "Reservation"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_reservationNumber_key" ON "Reservation"("reservationNumber");

-- CreateIndex
CREATE INDEX "Reservation_roomId_updatedAt_idx" ON "Reservation"("roomId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "_RoomToRoomFacility_AB_unique" ON "_RoomToRoomFacility"("A", "B");

-- CreateIndex
CREATE INDEX "_RoomToRoomFacility_B_index" ON "_RoomToRoomFacility"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_RoomToRoomPackageItem_AB_unique" ON "_RoomToRoomPackageItem"("A", "B");

-- CreateIndex
CREATE INDEX "_RoomToRoomPackageItem_B_index" ON "_RoomToRoomPackageItem"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_RoomToRoomMultiPackage_AB_unique" ON "_RoomToRoomMultiPackage"("A", "B");

-- CreateIndex
CREATE INDEX "_RoomToRoomMultiPackage_B_index" ON "_RoomToRoomMultiPackage"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_RoomToRoomDiscount_AB_unique" ON "_RoomToRoomDiscount"("A", "B");

-- CreateIndex
CREATE INDEX "_RoomToRoomDiscount_B_index" ON "_RoomToRoomDiscount"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_RoomToSeasonList_AB_unique" ON "_RoomToSeasonList"("A", "B");

-- CreateIndex
CREATE INDEX "_RoomToSeasonList_B_index" ON "_RoomToSeasonList"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_RoomMultiPackageToRoomPackageItem_AB_unique" ON "_RoomMultiPackageToRoomPackageItem"("A", "B");

-- CreateIndex
CREATE INDEX "_RoomMultiPackageToRoomPackageItem_B_index" ON "_RoomMultiPackageToRoomPackageItem"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ReservationToRoomPackageItem_AB_unique" ON "_ReservationToRoomPackageItem"("A", "B");

-- CreateIndex
CREATE INDEX "_ReservationToRoomPackageItem_B_index" ON "_ReservationToRoomPackageItem"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ReservationToRoomMultiPackage_AB_unique" ON "_ReservationToRoomMultiPackage"("A", "B");

-- CreateIndex
CREATE INDEX "_ReservationToRoomMultiPackage_B_index" ON "_ReservationToRoomMultiPackage"("B");
