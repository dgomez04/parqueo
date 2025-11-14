-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "passwordHistory" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL,
    "dateOfBirth" DATETIME NOT NULL,
    "identificationNumber" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "isFirstLogin" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "dateOfBirth", "email", "id", "identificationNumber", "isFirstLogin", "name", "password", "role", "updatedAt") SELECT "createdAt", "dateOfBirth", "email", "id", "identificationNumber", "isFirstLogin", "name", "password", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_identificationNumber_key" ON "User"("identificationNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
