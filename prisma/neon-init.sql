-- Run this entire script once in Neon SQL Editor (Dashboard → SQL Editor).
-- This creates all tables required by the app. Use the same Neon project
-- that is set as DATABASE_URL in Vercel.

-- CreateTable
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "inviteToken" TEXT,
    "inviteTokenExpires" TIMESTAMP(3),
    "department" TEXT,
    "startDate" TIMESTAMP(3),
    "address" TEXT,
    "contactNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Business" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "address" TEXT,
    "logoUrl" TEXT,
    "logoPath" TEXT,
    "payCycle" TEXT,
    "payDayOfWeek" INTEGER,
    "payDayOfMonth" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Business_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "BusinessEmployee" (
    "businessId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "payCycle" TEXT,
    "payDayOfWeek" INTEGER,
    "payDayOfMonth" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessEmployee_pkey" PRIMARY KEY ("businessId","employeeId")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Payslip" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "emailMessage" TEXT,
    "amountCents" INTEGER,
    "businessId" TEXT,
    "employerId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payslip_pkey" PRIMARY KEY ("id")
);

-- Index (ignore error if already exists)
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

-- Foreign keys (drop first if re-running to avoid duplicate constraint errors)
ALTER TABLE "Business" DROP CONSTRAINT IF EXISTS "Business_employerId_fkey";
ALTER TABLE "Business" ADD CONSTRAINT "Business_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BusinessEmployee" DROP CONSTRAINT IF EXISTS "BusinessEmployee_businessId_fkey";
ALTER TABLE "BusinessEmployee" ADD CONSTRAINT "BusinessEmployee_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BusinessEmployee" DROP CONSTRAINT IF EXISTS "BusinessEmployee_employeeId_fkey";
ALTER TABLE "BusinessEmployee" ADD CONSTRAINT "BusinessEmployee_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Payslip" DROP CONSTRAINT IF EXISTS "Payslip_businessId_fkey";
ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Payslip" DROP CONSTRAINT IF EXISTS "Payslip_employerId_fkey";
ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Payslip" DROP CONSTRAINT IF EXISTS "Payslip_employeeId_fkey";
ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
