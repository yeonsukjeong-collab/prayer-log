-- CreateTable
CREATE TABLE "prayer_log_meditations" (
    "id" TEXT NOT NULL,
    "book" TEXT NOT NULL,
    "chapter" INTEGER NOT NULL,
    "verseStart" INTEGER NOT NULL,
    "verseEnd" INTEGER,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "prayer_log_meditations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "prayer_log_meditations_authorId_idx" ON "prayer_log_meditations"("authorId");

-- CreateIndex
CREATE INDEX "prayer_log_meditations_createdAt_idx" ON "prayer_log_meditations"("createdAt");

-- AddForeignKey
ALTER TABLE "prayer_log_meditations" ADD CONSTRAINT "prayer_log_meditations_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "prayer_log_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

