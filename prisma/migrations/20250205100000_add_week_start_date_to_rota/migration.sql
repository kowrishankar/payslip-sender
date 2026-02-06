-- Add weekStartDate (Monday of the week). Backfill existing rows to this week's Monday.
ALTER TABLE "RotaShift" ADD COLUMN "weekStartDate" DATE;

-- Set existing rows to the Monday of the current week (PostgreSQL: DOW 0=Sun, 1=Mon, ... 6=Sat)
UPDATE "RotaShift"
SET "weekStartDate" = CURRENT_DATE - ((EXTRACT(DOW FROM CURRENT_DATE)::integer + 6) % 7);

ALTER TABLE "RotaShift" ALTER COLUMN "weekStartDate" SET NOT NULL;

-- Replace index for date-based queries
DROP INDEX IF EXISTS "RotaShift_businessId_dayOfWeek_idx";
CREATE INDEX "RotaShift_businessId_weekStartDate_dayOfWeek_idx" ON "RotaShift"("businessId", "weekStartDate", "dayOfWeek");
