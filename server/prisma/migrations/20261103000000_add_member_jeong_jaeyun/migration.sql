-- 목장원 정재윤을 추가합니다. 이미 있으면 그대로 둡니다.
INSERT INTO "prayer_log_members" ("id", "name")
VALUES (gen_random_uuid()::text, '정재윤')
ON CONFLICT ("name") DO NOTHING;
