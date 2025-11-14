/*
  Warnings:

  - Added the required column `parkingId` to the `ParkingSpace` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Parking" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Insert default parking
INSERT INTO "Parking" ("id", "name", "createdAt", "updatedAt")
VALUES (1, 'Parqueo Principal', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ParkingSpace" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "spaceNumber" TEXT NOT NULL,
    "spaceType" TEXT NOT NULL DEFAULT 'CAR',
    "parkingId" INTEGER NOT NULL,
    "isOccupied" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ParkingSpace_parkingId_fkey" FOREIGN KEY ("parkingId") REFERENCES "Parking" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
-- Assign all existing spaces to 'Parqueo Principal' with default CAR type
INSERT INTO "new_ParkingSpace" ("createdAt", "id", "isOccupied", "spaceNumber", "updatedAt", "parkingId", "spaceType")
SELECT "createdAt", "id", "isOccupied", "spaceNumber", "updatedAt", 1, 'CAR' FROM "ParkingSpace";
DROP TABLE "ParkingSpace";
ALTER TABLE "new_ParkingSpace" RENAME TO "ParkingSpace";
CREATE UNIQUE INDEX "ParkingSpace_spaceNumber_key" ON "ParkingSpace"("spaceNumber");
CREATE INDEX "ParkingSpace_parkingId_idx" ON "ParkingSpace"("parkingId");
CREATE INDEX "ParkingSpace_spaceType_isOccupied_idx" ON "ParkingSpace"("spaceType", "isOccupied");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Parking_name_key" ON "Parking"("name");
