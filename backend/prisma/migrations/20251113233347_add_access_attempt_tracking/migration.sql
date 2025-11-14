-- CreateTable
CREATE TABLE "AccessAttempt" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "licensePlate" TEXT NOT NULL,
    "vehicleId" INTEGER,
    "parkingId" INTEGER,
    "attemptTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attemptType" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "failureReason" TEXT,
    "securityOfficerId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AccessAttempt_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AccessAttempt_parkingId_fkey" FOREIGN KEY ("parkingId") REFERENCES "Parking" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AccessAttempt_securityOfficerId_fkey" FOREIGN KEY ("securityOfficerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AccessAttempt_licensePlate_idx" ON "AccessAttempt"("licensePlate");

-- CreateIndex
CREATE INDEX "AccessAttempt_vehicleId_idx" ON "AccessAttempt"("vehicleId");

-- CreateIndex
CREATE INDEX "AccessAttempt_parkingId_idx" ON "AccessAttempt"("parkingId");

-- CreateIndex
CREATE INDEX "AccessAttempt_attemptTime_idx" ON "AccessAttempt"("attemptTime");

-- CreateIndex
CREATE INDEX "AccessAttempt_success_idx" ON "AccessAttempt"("success");
