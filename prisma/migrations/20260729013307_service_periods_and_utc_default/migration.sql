-- CreateTable
CREATE TABLE "ServicePeriod" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "outletId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "ServicePeriod_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Outlet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "currency" TEXT NOT NULL DEFAULT 'NPR',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "qrImagePath" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Outlet_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Outlet" ("active", "address", "currency", "id", "name", "organizationId", "phone", "qrImagePath", "timezone") SELECT "active", "address", "currency", "id", "name", "organizationId", "phone", "qrImagePath", "timezone" FROM "Outlet";
DROP TABLE "Outlet";
ALTER TABLE "new_Outlet" RENAME TO "Outlet";
CREATE TABLE "new_Reservation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "outletId" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "partySize" INTEGER NOT NULL,
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "servicePeriodId" TEXT,
    "periodLabel" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "notes" TEXT NOT NULL DEFAULT '',
    "orderId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reservation_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Reservation_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "DiningTable" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Reservation_servicePeriodId_fkey" FOREIGN KEY ("servicePeriodId") REFERENCES "ServicePeriod" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Reservation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Reservation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Reservation" ("allDay", "createdAt", "createdById", "customerName", "email", "endAt", "id", "notes", "orderId", "outletId", "partySize", "phone", "startAt", "status", "tableId") SELECT "allDay", "createdAt", "createdById", "customerName", "email", "endAt", "id", "notes", "orderId", "outletId", "partySize", "phone", "startAt", "status", "tableId" FROM "Reservation";
DROP TABLE "Reservation";
ALTER TABLE "new_Reservation" RENAME TO "Reservation";
CREATE UNIQUE INDEX "Reservation_orderId_key" ON "Reservation"("orderId");
CREATE INDEX "Reservation_outletId_startAt_idx" ON "Reservation"("outletId", "startAt");
CREATE INDEX "Reservation_tableId_status_startAt_idx" ON "Reservation"("tableId", "status", "startAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ServicePeriod_outletId_name_key" ON "ServicePeriod"("outletId", "name");

-- Data migration ------------------------------------------------------------
-- 1. Every existing outlet gets the default service periods, so bookings can
--    still be taken the moment this deploys. Ids are derived from the outlet id
--    to stay deterministic (no random() in a migration).
INSERT INTO "ServicePeriod" ("id", "outletId", "name", "startTime", "endTime", "sortOrder", "active")
SELECT "id" || '_breakfast', "id", 'Breakfast', '07:00', '11:00', 1, true FROM "Outlet";
INSERT INTO "ServicePeriod" ("id", "outletId", "name", "startTime", "endTime", "sortOrder", "active")
SELECT "id" || '_lunch', "id", 'Lunch', '12:00', '15:00', 2, true FROM "Outlet";
INSERT INTO "ServicePeriod" ("id", "outletId", "name", "startTime", "endTime", "sortOrder", "active")
SELECT "id" || '_dinner', "id", 'Dinner', '18:00', '23:00', 3, true FROM "Outlet";

-- 2. Bookings taken before periods existed keep their stored UTC window, which
--    is still the truth; they just need a label to display. All-day holds show
--    "All day" from the flag, so only the timed ones need one.
UPDATE "Reservation" SET "periodLabel" = 'Custom' WHERE "allDay" = false AND "periodLabel" = '';
