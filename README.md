# 목장 기도록

목장 모임의 대표기도문과 기도제목을 함께 작성하고 관리하는 웹 앱(PWA)입니다.

- **프론트엔드**: React + Vite + TypeScript + Tailwind CSS (PWA)
- **백엔드**: Node.js + Express + TypeScript
- **DB**: PostgreSQL (Prisma ORM) — Render의 기존 Postgres 인스턴스 사용
- **로그인**: 이름 + 목장 공유 암호 (목장원 전체가 같은 암호를 사용, 계정 가입 없음)
- **배포**: Render Web Service 1개로 프론트/백엔드 통합 배포

## 1. 로컬 개발 환경 설정

```bash
npm run install:all
```

`server/.env.example`을 `server/.env`로 복사 후 값 채우기:

```
DATABASE_URL=postgresql://...   # Render Postgres의 External Database URL
ACCESS_PASSWORD=...             # 목장원 전체가 사용할 공유 암호
JWT_SECRET=...                  # openssl rand -hex 32 로 생성
CLIENT_URL=http://localhost:5173
```

DB 스키마 생성 (최초 1회, 로컬에서 Render Postgres에 직접 마이그레이션 적용):

```bash
npm run prisma:migrate:dev
```

개발 서버 실행 (프론트 5173, 백엔드 3000, `/api` 프록시 설정됨):

```bash
npm run dev
```

## 2. 로그인 방식

목장원은 접속 후 **이름**과 **공유 암호**(목자가 정해서 알려준 암호)를 입력해 들어옵니다.

- 암호가 맞으면 입력한 이름으로 로그인되고, 이후 그 이름으로 작성한 글만 본인이 수정·삭제할 수 있습니다.
- 계정 가입이나 비밀번호 찾기 절차가 없어 관리 부담이 없습니다.
- 같은 이름을 여러 사람이 쓰면 같은 사람으로 취급되니, 목장원끼리 이름을 겹치지 않게 정하는 것을 권장합니다.
- 암호는 `ACCESS_PASSWORD` 환경변수로 관리하며, 바꾸고 싶으면 이 값만 변경하면 됩니다 (기존에 로그인된 브라우저는 세션이 끊길 때까지 유지됨).

## 3. Render 배포

이 저장소를 GitHub에 올린 뒤 Render 대시보드에서 "New Web Service"로 연결하거나, 저장소 루트의 `render.yaml`(Blueprint)을 이용해 한 번에 생성할 수 있습니다.

Render 서비스에 아래 환경변수를 설정하세요 (기존 Postgres 인스턴스의 접속 정보 사용):

- `DATABASE_URL` — 기존 Render Postgres의 **Internal Database URL** (같은 리전에 웹 서비스를 두면 내부망으로 더 빠르고 무료)
- `ACCESS_PASSWORD` — 목장원 전체가 사용할 공유 암호
- `JWT_SECRET` (Blueprint 사용 시 자동 생성됨)
- `CLIENT_URL` — 배포된 앱의 URL (예: `https://prayer-log.onrender.com`)

Build Command:
```
cd client && npm install --include=dev && npm run build && cd ../server && npm install --include=dev && npm run build && npx prisma migrate deploy
```

Start Command:
```
node server/dist/index.js
```

> DB 테이블은 다른 서비스와 충돌하지 않도록 `prayer_log_` 접두사를 붙여 생성됩니다 (`prayer_log_members`, `prayer_log_prayer_requests`, `prayer_log_prayer_texts`). 기존에 사용 중인 Postgres에 다른 앱의 테이블이 있어도 안전하게 함께 쓸 수 있습니다.

## 4. PWA 아이콘

`client/public/`에 `pwa-192x192.png`, `pwa-512x512.png` 아이콘을 추가하면 홈 화면 추가 시 아이콘이 표시됩니다 (현재는 기본 favicon만 있음).

## 주요 기능

- 이름 + 공유 암호로 로그인 (목장원 공용, 계정 가입 없음)
- 기도제목 등록 / 목록 확인 (본인 글만 수정·삭제 가능)
- 기도제목에 "응답됨" 표시 + 응답 내용 기록
- 대표기도문 작성 및 목록 열람
