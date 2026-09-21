-- CreateTable
CREATE TABLE "prayer_log_photo_comments" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "photoId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "prayer_log_photo_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "prayer_log_photo_comments_photoId_idx" ON "prayer_log_photo_comments"("photoId");

-- AddForeignKey
ALTER TABLE "prayer_log_photo_comments" ADD CONSTRAINT "prayer_log_photo_comments_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "prayer_log_photos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prayer_log_photo_comments" ADD CONSTRAINT "prayer_log_photo_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "prayer_log_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
