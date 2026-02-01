-- CreateTable
CREATE TABLE "Business" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "payCycle" TEXT,
    "payDayOfWeek" INTEGER,
    "payDayOfMonth" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Business_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BusinessEmployee" (
    "businessId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("businessId", "employeeId"),
    CONSTRAINT "BusinessEmployee_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BusinessEmployee_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- AlterTable
ALTER TABLE "Payslip" ADD COLUMN "businessId" TEXT;
CREATE INDEX "Payslip_businessId_idx" ON "Payslip"("businessId");

-- Backfill: one Business per employer
INSERT INTO "Business" ("id", "name", "employerId", "createdAt", "updatedAt")
SELECT 'b-' || "id", 'My Business', "id", datetime('now'), datetime('now')
FROM "User" WHERE "role" = 'employer';

-- Backfill: BusinessEmployee from EmployerEmployee
INSERT INTO "BusinessEmployee" ("businessId", "employeeId", "createdAt")
SELECT 'b-' || ee."employerId", ee."employeeId", ee."createdAt"
FROM "EmployerEmployee" ee;

-- Backfill: Payslip.businessId
UPDATE "Payslip" SET "businessId" = 'b-' || "employerId";

-- DropTable
DROP TABLE "EmployerEmployee";