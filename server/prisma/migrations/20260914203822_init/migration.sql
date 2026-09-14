-- CreateTable
CREATE TABLE "prayer_log_members" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prayer_log_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prayer_log_prayer_requests" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isAnswered" BOOLEAN NOT NULL DEFAULT false,
    "answeredNote" TEXT,
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "prayer_log_prayer_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prayer_log_prayer_texts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "meetingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "prayer_log_prayer_texts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "prayer_log_members_name_key" ON "prayer_log_members"("name");

-- AddForeignKey
ALTER TABLE "prayer_log_prayer_requests" ADD CONSTRAINT "prayer_log_prayer_requests_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "prayer_log_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prayer_log_prayer_texts" ADD CONSTRAINT "prayer_log_prayer_texts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "prayer_log_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

