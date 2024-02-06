-- CreateTable
CREATE TABLE "Translation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tid" TEXT NOT NULL,
    "en" TEXT NOT NULL,
    "cs" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Translation_id_key" ON "Translation"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Translation_tid_key" ON "Translation"("tid");
