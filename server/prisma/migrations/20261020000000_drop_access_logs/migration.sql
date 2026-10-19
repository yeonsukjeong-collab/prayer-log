-- DropForeignKey
ALTER TABLE "prayer_log_access_logs" DROP CONSTRAINT "prayer_log_access_logs_memberId_fkey";

-- DropTable
DROP TABLE "prayer_log_access_logs";
