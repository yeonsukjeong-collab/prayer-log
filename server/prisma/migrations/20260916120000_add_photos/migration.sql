-- CreateTable
CREATE TABLE "prayer_log_photos" (
    "id" TEXT NOT NULL,
    "caption" TEXT,
    "photoDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "thumbnailData" TEXT NOT NULL,
    "imageData" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "prayer_log_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "prayer_log_photos_authorId_idx" ON "prayer_log_photos"("authorId");

-- CreateIndex
CREATE INDEX "prayer_log_photos_photoDate_idx" ON "prayer_log_photos"("photoDate");

-- AddForeignKey
ALTER TABLE "prayer_log_photos" ADD CONSTRAINT "prayer_log_photos_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "prayer_log_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
