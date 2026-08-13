# Venue Research — 설치 및 배포 가이드 (비개발자용)

이 문서는 개발 지식이 없어도 따라 할 수 있도록 작성했습니다.
순서대로 진행해주세요. 막히는 부분이 있으면 그 화면을 캡처해서 Claude에게 보여주시면 됩니다.

---

## 0. 준비물 체크리스트

- [x] GitHub 계정 (이미 보유)
- [x] Vercel 계정 (이미 보유)
- [ ] Supabase 계정 (데이터베이스) — 아래에서 생성
- [ ] Google Cloud 계정 (지도/장소 정보) — 아래에서 생성

---

## 1. Supabase 프로젝트 만들기 (데이터베이스)

1. https://supabase.com 접속 → 오른쪽 위 **Start your project** 클릭 → GitHub 계정으로 로그인
2. **New Project** 클릭
3. Project name: `venue-research` 입력, 데이터베이스 비밀번호는 자동 생성되는 것을 사용하거나 직접 만들고 **꼭 별도로 저장**해두세요.
4. Region은 **Northeast Asia (Seoul)** 선택
5. 프로젝트 생성이 끝나면(1~2분 소요), 왼쪽 메뉴에서 **SQL Editor** 클릭
6. 이 프로젝트 폴더 안의 `supabase/schema.sql` 파일을 열어서 **전체 내용을 복사**
7. SQL Editor에 붙여넣고 오른쪽 아래 **Run** 버튼 클릭 → "Success" 메시지가 뜨면 완료
8. 왼쪽 메뉴 **Project Settings → API** 이동
9. 아래 3개 값을 복사해서 `.env.local` 파일에 붙여넣을 준비를 해주세요.
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ 이 키는 절대 외부에 공유하거나 GitHub에 올리면 안 됩니다)

---

## 2. Google Cloud — Places API Key 발급

1. https://console.cloud.google.com 접속 → Google 계정으로 로그인
2. 상단의 프로젝트 선택 메뉴 → **새 프로젝트** → 이름 `venue-research` 입력 후 생성
3. 왼쪽 상단 메뉴(≡) → **API 및 서비스 → 라이브러리** 이동
4. 검색창에 `Places API (New)` 입력 → 클릭 → **사용 설정(Enable)** 버튼 클릭
5. 같은 방법으로 `Maps JavaScript API`도 사용 설정 (지도 표시용)
6. 왼쪽 메뉴 **API 및 서비스 → 사용자 인증 정보(Credentials)** 이동
7. 상단 **+ 사용자 인증 정보 만들기 → API 키** 클릭 → 키가 생성되면 복사
8. 생성된 키를 클릭해서 들어간 뒤, **API 제한사항**에서 방금 사용 설정한 `Places API (New)`, `Maps JavaScript API`만 체크 (보안 강화, 요청하신 20번 항목 반영)
9. **결제 계정 연결**이 필요할 수 있습니다 (Google이 카드 등록을 요구하지만, 월 일정 금액까지 무료 크레딧이 제공됩니다). 이 단계는 결제 승인이 필요한 부분이라 대표님이 직접 진행해주셔야 합니다.
10. 복사한 키를 `.env.local`의 `GOOGLE_PLACES_API_KEY`에 붙여넣습니다.

---

## 3. 로컬에서 실행해보기 (선택 사항이지만 추천)

컴퓨터에 Node.js가 설치되어 있어야 합니다 (https://nodejs.org 에서 LTS 버전 설치).

1. 이 프로젝트 폴더를 다운로드/압축 해제
2. 폴더 안의 `.env.local.example` 파일을 복사해서 이름을 `.env.local`로 변경
3. 1번, 2번 단계에서 복사해둔 값들을 `.env.local`에 채워 넣기
4. `ADMIN_PASSWORD`에는 관리자 페이지에 사용할 비밀번호를 직접 정해서 입력
5. 터미널(명령 프롬프트)을 열고 프로젝트 폴더로 이동한 뒤 아래 명령어 순서대로 입력:
   ```
   npm install
   npm run dev
   ```
6. 브라우저에서 http://localhost:3000 접속 → 화면이 보이면 성공입니다.

---

## 4. GitHub에 올리기

1. GitHub에서 새 저장소(Repository) 생성 (Private 추천)
2. 터미널에서 프로젝트 폴더로 이동 후:
   ```
   git init
   git add .
   git commit -m "Venue Research 초기 버전"
   git branch -M main
   git remote add origin (본인의 저장소 URL)
   git push -u origin main
   ```
   (`.env.local`은 `.gitignore`에 등록되어 있어서 자동으로 제외되니, GitHub에 비밀 키가 올라갈 걱정은 하지 않으셔도 됩니다.)

---

## 5. Vercel에 배포하기

1. https://vercel.com 접속 → 로그인 → **Add New → Project**
2. 방금 만든 GitHub 저장소 선택 → **Import**
3. **Environment Variables** 섹션에서 `.env.local`에 넣었던 값들을 **하나씩 그대로** 입력
   (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_PLACES_API_KEY`, `ADMIN_PASSWORD`, `ANTHROPIC_API_KEY` 등)
4. **Deploy** 버튼 클릭 → 1~2분 후 배포 완료
5. 완료되면 `https://xxxxx.vercel.app` 형태의 실제 주소가 발급됩니다.

---

## 지금 이 코드로 되는 것 / 아직 안 되는 것

**되는 것**
- 검색 화면, 결과 화면, Venue 상세 화면, 관리자 로그인/목록/삭제 화면 UI 전체
- Supabase 데이터베이스 구조, 추천 점수 계산 로직
- Google Places 연동 코드, AI 기반 행사 정보 구조화 코드

**아직 안 되는 것 (Phase 5 이후에 함께 진행할 부분)**
- 실제 웹 검색 공급자 연결 (`lib/searchProvider.ts`의 `NotConfiguredSearchProvider`를 실제 API로 교체해야 함 — 어떤 검색 API를 쓸지 함께 정해야 합니다)
- 서울 실제 Venue 10곳 데이터 입력 (Phase 8)
- 실제 배포 후 QA (Phase 9)

이 부분은 계정이 준비되면 이어서 진행하겠습니다.
