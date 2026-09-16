# 자카르타 목장

목장 모임의 릴레이 기도(대표기도문)와 기도제목을 함께 작성하고 관리하는 웹 앱(PWA)입니다.

- **프론트엔드**: React + Vite + TypeScript + Tailwind CSS (PWA)
- **백엔드**: Node.js + Express + TypeScript
- **DB**: PostgreSQL (Prisma ORM) — Render의 기존 Postgres 인스턴스 사용
- **로그인**: 정해진 목장원 명단(이름) + 목장 공유 암호 (계정 가입 없음, 명단에 없는 이름은 로그인 불가)
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

목장원 명단 시딩 (최초 1회, 또는 명단이 바뀔 때):

```bash
npm run prisma:seed --prefix server
```

목장원을 추가·변경하려면 `server/prisma/seed.ts`의 `MEMBERS` 배열과 `client/src/constants.ts`의 `MEMBER_NAMES` 배열을 함께 수정한 뒤 위 시드 명령을 다시 실행하세요.

개발 서버 실행 (프론트 5173, 백엔드 3000, `/api` 프록시 설정됨):

```bash
npm run dev
```

## 2. 로그인 방식

목장원은 접속 후 미리 정해진 명단에서 **이름을 선택**하고 **공유 암호**(목자가 정해서 알려준 암호)를 입력해 들어옵니다.

- 명단에 없는 이름이거나 암호가 틀리면 로그인할 수 없습니다.
- 로그인하면 그 이름으로 작성한 글만 본인이 수정·삭제할 수 있습니다 (목자는 예외 — 아래 참고).
- 계정 가입이나 비밀번호 찾기 절차가 없어 관리 부담이 없습니다.
- 암호는 `ACCESS_PASSWORD` 환경변수로 관리하며, 바꾸고 싶으면 이 값만 변경하면 됩니다 (기존에 로그인된 브라우저는 세션이 끊길 때까지 유지됨).

### 작성자 선택

기도제목을 등록할 때 누구나 풀다운 메뉴에서 **작성자(누구의 기도제목인지)**를 선택할 수 있습니다. 기본값은 로그인한 본인 이름이며, 전화·문자 등으로 받은 기도제목을 대신 입력할 때는 다른 목장원 이름을 선택하면 됩니다.

수정·삭제는 여전히 실제 작성자 본인만 할 수 있습니다. 예외로, 시드 데이터 기준 **정연석**이 목자로 지정되어 있어(`server/prisma/seed.ts`의 `isLeader: true`) 다른 사람이 작성한 기도제목도 관리(수정·삭제)할 수 있습니다.

### 웹관리자

**정연석**, **김선경**이 웹관리자로 지정되어 있습니다(`server/prisma/seed.ts`의 `isAdmin: true`). 웹관리자로 로그인하면 "여러 명 기도제목 한번에 붙여넣기" 기능이 보입니다 — 일반 목장원에게는 이 기능이 표시되지 않습니다.

## 3. Render 배포

이 저장소를 GitHub에 올린 뒤 Render 대시보드에서 "New Web Service"로 연결하거나, 저장소 루트의 `render.yaml`(Blueprint)을 이용해 한 번에 생성할 수 있습니다.

Render 서비스에 아래 환경변수를 설정하세요 (기존 Postgres 인스턴스의 접속 정보 사용):

- `DATABASE_URL` — 기존 Render Postgres의 **External Database URL** (Internal Database URL은 웹 서비스와 DB가 같은 리전에 있을 때만 동작합니다. 웹 서비스를 DB와 같은 리전으로 만들었다면 Internal URL을 써도 됩니다.)
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

> DB 테이블은 다른 서비스와 충돌하지 않도록 `prayer_log_` 접두사를 붙여 생성됩니다 (`prayer_log_members`, `prayer_log_prayer_requests`, `prayer_log_prayer_texts`, `prayer_log_photos`). 기존에 사용 중인 Postgres에 다른 앱의 테이블이 있어도 안전하게 함께 쓸 수 있습니다.
>
> 사진은 별도 저장소 없이 Postgres에 base64로 저장합니다 (브라우저에서 업로드 전 리사이즈·압축). 사진이 많이 쌓이면 Render Postgres 무료 플랜의 1GB 저장 공간에 여유가 있는지 가끔 확인하세요.

## 4. PWA 아이콘

파비콘과 홈 화면 아이콘(`favicon.png`, `pwa-192x192.png`, `pwa-512x512.png`)은 기도하는 사람 모양으로 되어 있습니다. 다른 아이콘으로 바꾸려면 `client/public/`의 해당 파일들을 교체하세요.

## 주요 기능

- 정해진 명단 + 공유 암호로 로그인 (명단에 없는 이름은 로그인 불가)
- 기도제목 등록 시 작성자를 풀다운 메뉴에서 선택 가능 (대신 입력), 표시는 작성자 이름 · 날짜(요일)
- (웹관리자 전용) `(이름)` + `- 항목` 형식으로 여러 명의 기도제목을 붙여넣으면 사람별로 자동 구분해서, 한 사람당 기도제목 1건으로 일괄 등록
- 기도제목·릴레이 기도 목록은 목원별·기간별(최근 1주/2주/1달/전체/날짜 직접 선택)로 서버에서 조건에 맞게 조회 (기본은 전체 목원·최근 1주간만 불러옴, 필터를 바꾸면 그 조건으로 다시 조회)
- 기도제목 카드 상단에 이름·날짜(요일)를 굵은 파란 글씨로 표시, 하이픈 항목은 들여쓴 글머리 기호 목록으로 표시
- 기도제목 목록 확인 (실제 작성자 본인만 수정·삭제 가능, 목자는 전체 관리 가능)
- 카드 상단 우측의 "수정" 버튼으로 내용·날짜 수정 + 응답 여부/응답 내용을 함께 편집
- 릴레이 기도 작성 시에도 작성자를 풀다운 메뉴에서 선택 가능, 카드 상단에 이름·날짜(요일) 굵은 파란 글씨로 표시
- 기도제목·릴레이 기도 모두 등록/수정 시 날짜를 직접 선택 가능 (기본값은 오늘)
- 화면 글자 크기 조절 아이콘 (브라우저에 저장됨)
- **추억** 탭: 사진 촬영/업로드, 날짜별로 묶은 썸네일 그리드, 클릭 시 원본 보기. 목록에는 작은 썸네일만 전달하고 원본은 클릭 시에만 불러와 로딩을 가볍게 유지
