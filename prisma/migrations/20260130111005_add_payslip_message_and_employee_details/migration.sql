-- AlterTable
ALTER TABLE "Payslip" ADD COLUMN "emailMessage" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "address" TEXT;
ALTER TABLE "User" ADD COLUMN "contactNumber" TEXT;
ALTER TABLE "User" ADD COLUMN "startDate" DATETIME;
