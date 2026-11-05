-- CreateTable
CREATE TABLE "prayer_log_quiz_history" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prayer_log_quiz_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "prayer_log_quiz_history_scope_createdAt_idx" ON "prayer_log_quiz_history"("scope", "createdAt");

