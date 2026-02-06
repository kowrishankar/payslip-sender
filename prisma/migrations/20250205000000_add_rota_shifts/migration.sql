-- CreateTable
CREATE TABLE "RotaShift" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RotaShift_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RotaShift_businessId_dayOfWeek_idx" ON "RotaShift"("businessId", "dayOfWeek");

-- AddForeignKey
ALTER TABLE "RotaShift" ADD CONSTRAINT "RotaShift_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RotaShift" ADD CONSTRAINT "RotaShift_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
