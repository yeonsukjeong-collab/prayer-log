-- CreateIndex
CREATE INDEX "prayer_log_prayer_requests_authorId_idx" ON "prayer_log_prayer_requests"("authorId");

-- CreateIndex
CREATE INDEX "prayer_log_prayer_requests_requestDate_idx" ON "prayer_log_prayer_requests"("requestDate");

-- CreateIndex
CREATE INDEX "prayer_log_prayer_texts_authorId_idx" ON "prayer_log_prayer_texts"("authorId");

-- CreateIndex
CREATE INDEX "prayer_log_prayer_texts_meetingDate_idx" ON "prayer_log_prayer_texts"("meetingDate");
