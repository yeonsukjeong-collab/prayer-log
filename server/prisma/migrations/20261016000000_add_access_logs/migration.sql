-- CreateTable
CREATE TABLE "prayer_log_access_logs" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "memberId" TEXT NOT NULL,

    CONSTRAINT "prayer_log_access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "prayer_log_access_logs_createdAt_idx" ON "prayer_log_access_logs"("createdAt");

-- CreateIndex
CREATE INDEX "prayer_log_access_logs_memberId_createdAt_idx" ON "prayer_log_access_logs"("memberId", "createdAt");

-- AddForeignKey
ALTER TABLE "prayer_log_access_logs" ADD CONSTRAINT "prayer_log_access_logs_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "prayer_log_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
