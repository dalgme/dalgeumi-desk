# M6. Chrome 웹스토어 Unlisted 업로드 가이드

실장이 제공한 최종 산출물을 사장님 Google 계정으로 업로드하는 절차입니다. 총 **약 20~30분**, 단계별로 따라와 주세요.

---

## STEP 1 — Chrome 개발자 계정 등록 ($5 1회 결제) · 5~10분

1. https://chrome.google.com/webstore/devconsole/register 접속
2. 본인 Google 계정 로그인 (회사 이메일 권장)
3. 개발자 동의사항 수락
4. **$5 등록비** 신용카드 결제 (1회, 평생)
5. 등록 완료 → Developer Dashboard 접근 가능

---

## STEP 2 — Privacy Policy URL 배포 · 3분

Chrome 웹스토어는 개인정보 처리방침 URL 을 요구합니다. 이미 `docs/privacy.html` 은 커밋되어 있으니 GitHub Pages 만 켜면 바로 공개 URL 이 생깁니다.

1. https://github.com/dalgme/dalgeumi-desk/settings/pages 접속
2. **Build and deployment → Source**: `Deploy from a branch`
3. **Branch**: `main` / Folder: `/docs`
4. **Save** 클릭
5. 1~2분 후 페이지 상단에 **Your site is live at https://dalgme.github.io/dalgeumi-desk/** 라는 초록색 박스 표시 → **이 URL 뒤에 `privacy.html` 붙인 주소**가 Privacy Policy URL 입니다:
   ```
   https://dalgme.github.io/dalgeumi-desk/privacy.html
   ```
6. 브라우저에서 열어 페이지가 정상 렌더되는지 확인

---

## STEP 3 — 확장 로컬 로드 + 스크린샷 1~5장 캡처 · 5~10분

### 3-1 확장 로드 (심사 제출과 무관, 스크린샷 촬영용)
1. Chrome 주소창 → `chrome://extensions`
2. 우측 상단 **개발자 모드** ON
3. 좌측 **압축해제된 확장 프로그램 로드** 클릭 → `C:\dev\dalgeumi-desk\dist` 선택
4. "달그미데스크" 카드 나타남
5. **새 탭** 열기 → 기존 세션(jinkidi@gmail.com)으로 자동 로그인 → Dashboard 렌더 (테스트섹션 + Google + Realtime테스트)

### 3-2 스크린샷 촬영 (Windows 캡처 도구 `Win + Shift + S`)
다음 **5장** 권장 (최소 1장 필요):

| 번호 | 장면 | 촬영 방법 |
|------|------|----------|
| 01 | Dashboard (로그인된 상태) | 현재 화면 캡처 |
| 02 | 북마크 여러 개 | 북마크 몇 개 더 추가 후 캡처 |
| 03 | 섹션 여러 개 | 섹션 2~3개 만든 뒤 캡처 |
| 04 | 오프라인 상태 | DevTools → Network → Offline → 새 탭 → 캡처 |
| 05 | 로그인 화면 | 로그아웃 후 새 탭 → 캡처 |

**크기**: 1280×800 권장 (최소 640×400). Windows 캡처 도구는 원본 해상도로 저장됨. 캡처 후 그림판에서 필요 시 리사이즈.

저장 위치: `C:\dev\dalgeumi-desk\release\screenshots\` (폴더 없으면 만드세요)

> **최소 1장만으로도 심사 통과 가능**. 5장 다 찍기 부담되면 Dashboard 1장만 찍고 업로드하셔도 출시 후 추가 가능합니다.

---

## STEP 4 — Chrome 웹스토어 새 Item 업로드 · 5분

1. https://chrome.google.com/webstore/devconsole 접속
2. 좌측 **Items** → 우측 상단 **`+ New Item`** 클릭
3. **zip 업로드**: `C:\dev\dalgeumi-desk\release\dalgeumi-desk.zip` 선택
4. 업로드 완료되면 자동으로 Listing 편집 화면으로 이동

---

## STEP 5 — Listing 정보 입력 · 7분

좌측 메뉴 순서대로 작성. **별표(*)는 필수**.

### 5-1 Store listing
- **Description**\*:
  ```
  달그미데스크 — 팀 내부용 개인 북마크 시작페이지입니다.
  
  새 탭에 본인의 북마크·섹션을 표시하고, Google 계정(Magic Link OTP)으로 로그인하면 여러 PC·노트북 간에 실시간 동기화됩니다. 오프라인 상태에서도 캐시된 북마크를 사용할 수 있고, 온라인 복귀 시 자동 동기화됩니다.
  
  - 팀 내부용 비공개 배포 (Unlisted)
  - 이메일 6자리 코드 로그인 (Magic Link OTP)
  - PostgreSQL + Row-Level Security 로 본인 데이터만 접근
  - 실시간 멀티 PC 동기화 (Supabase Realtime)
  - 오프라인 캐시 (IndexedDB)
  
  기술: Chrome MV3 / Preact / TypeScript / Supabase
  ```
- **Category**\*: `Productivity`
- **Language**\*: `Korean`
- **Screenshots**\*: STEP 3 에서 찍은 이미지 업로드 (최소 1장, 1280×800)
- **Small promo tile**: 440×280. 선택사항, 넘어가도 OK
- **Store icon**: 이미 manifest 에 포함 (128×128 icon-128.png 자동 인식) — 별도 업로드 불필요

### 5-2 Privacy practices
- **Single purpose description**\*:
  ```
  팀 내부 사용자가 개인 북마크를 새 탭에 정리하고 여러 PC 간 동기화하기 위한 시작 페이지를 제공합니다.
  ```
- **Permission justification**:
  - `storage` 권한:
    ```
    로그인 세션 토큰과 오프라인 북마크 캐시를 브라우저 localStorage / IndexedDB 에 저장하기 위해 필요합니다.
    ```
  - `Host permission` (`https://*.supabase.co/*`):
    ```
    사용자 데이터의 읽기·쓰기·실시간 동기화를 위해 Supabase REST/WebSocket 엔드포인트에 접근합니다.
    ```
- **Data usage**: 다음 항목 체크
  - [x] Personally identifiable information (이메일)
  - [x] User activity (본인이 입력한 북마크)
  - 그 외 전부 체크 해제
- **Privacy Policy URL**\*: `https://dalgme.github.io/dalgeumi-desk/privacy.html` (STEP 2 에서 얻은 URL)
- **Certifications** 모두 체크:
  - [x] I do not sell or transfer user data to third parties...
  - [x] I do not use or transfer user data for purposes unrelated to...
  - [x] I do not use or transfer user data to determine creditworthiness...

### 5-3 Distribution
- **Visibility**: **`Unlisted`** 선택 (중요!) — 링크 있는 사람만 설치
- **Distribution**: 필요 국가 체크 (All OK)

---

## STEP 6 — Submit for Review

- 우측 상단 **`Submit for review`** 버튼 클릭
- Google 검토: 보통 **1~3영업일**, 최대 7일
- 통과 시 이메일로 통지 + Unlisted URL 발급

---

## STEP 7 — Unlisted 링크를 직원 10명에게 전달 (M7)
- 심사 통과 후 Dashboard 에서 **Item URL** 복사
- 형식: `https://chromewebstore.google.com/detail/달그미데스크/<확장ID>`
- 이 URL 을 Slack/이메일로 직원들에게 공유
- 직원은 링크 클릭 → "Chrome 에 추가" → 끝

---

## 요약: 사장님이 하시는 것
1. ✅ Chrome 개발자 등록 $5 결제 (STEP 1)
2. ✅ GitHub Pages 활성화 1회 클릭 (STEP 2)
3. ✅ 스크린샷 1~5장 캡처 (STEP 3)
4. ✅ zip 업로드 (STEP 4)
5. ✅ Listing 폼 채우기 (STEP 5, 위 텍스트 그대로 복붙 가능)
6. ✅ Submit (STEP 6)

실장이 사전에 완료해 둔 것:
- manifest.json, 아이콘 3종, dist 빌드, zip 패키지, Privacy Policy HTML, 모든 메타데이터 초안
