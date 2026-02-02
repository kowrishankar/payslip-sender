-- Run this in Neon SQL Editor (or any Postgres client) if you get:
-- "The table `public.ScheduledPayslip` does not exist in the current database."
-- Use the same database as your DATABASE_URL (e.g. production Neon branch).

CREATE TABLE IF NOT EXISTS "ScheduledPayslip" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "emailMessage" TEXT,
    "amountCents" INTEGER,
    "businessId" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledPayslip_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ScheduledPayslip" DROP CONSTRAINT IF EXISTS "ScheduledPayslip_businessId_fkey";
ALTER TABLE "ScheduledPayslip" ADD CONSTRAINT "ScheduledPayslip_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ScheduledPayslip" DROP CONSTRAINT IF EXISTS "ScheduledPayslip_employerId_fkey";
ALTER TABLE "ScheduledPayslip" ADD CONSTRAINT "ScheduledPayslip_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ScheduledPayslip" DROP CONSTRAINT IF EXISTS "ScheduledPayslip_employeeId_fkey";
ALTER TABLE "ScheduledPayslip" ADD CONSTRAINT "ScheduledPayslip_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
