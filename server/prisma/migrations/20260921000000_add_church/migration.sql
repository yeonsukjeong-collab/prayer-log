-- CreateTable
CREATE TABLE "prayer_log_benediction" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT NOT NULL,

    CONSTRAINT "prayer_log_benediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prayer_log_pastor_prayers" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "prayerDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "recordedById" TEXT NOT NULL,

    CONSTRAINT "prayer_log_pastor_prayers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "prayer_log_pastor_prayers_prayerDate_idx" ON "prayer_log_pastor_prayers"("prayerDate");

-- AddForeignKey
ALTER TABLE "prayer_log_benediction" ADD CONSTRAINT "prayer_log_benediction_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "prayer_log_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prayer_log_pastor_prayers" ADD CONSTRAINT "prayer_log_pastor_prayers_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "prayer_log_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
