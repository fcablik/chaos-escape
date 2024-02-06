-- CreateIndex
CREATE INDEX "CarModel_carBrandId_idx" ON "CarModel"("carBrandId");

-- CreateIndex
CREATE INDEX "CarModel_carBrandId_updatedAt_idx" ON "CarModel"("carBrandId", "updatedAt");
