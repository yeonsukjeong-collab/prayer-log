-- AlterTable: add requestDate, backfilling existing rows from createdAt
ALTER TABLE "prayer_log_prayer_requests" ADD COLUMN "requestDate" TIMESTAMP(3);
UPDATE "prayer_log_prayer_requests" SET "requestDate" = "createdAt" WHERE "requestDate" IS NULL;
ALTER TABLE "prayer_log_prayer_requests" ALTER COLUMN "requestDate" SET NOT NULL;
ALTER TABLE "prayer_log_prayer_requests" ALTER COLUMN "requestDate" SET DEFAULT CURRENT_TIMESTAMP;
