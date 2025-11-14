/*
  Warnings:

  - A unique constraint covering the columns `[parkingId,spaceNumber]` on the table `ParkingSpace` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ParkingSpace_spaceNumber_key";

-- CreateIndex
CREATE UNIQUE INDEX "ParkingSpace_parkingId_spaceNumber_key" ON "ParkingSpace"("parkingId", "spaceNumber");
