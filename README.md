# 달그미데스크 (dalgeumi-desk)

팀 내부용 북마크 시작페이지 Chrome 확장 (MV3) + Supabase 백엔드.

## 아키텍처

- **Frontend**: Chrome MV3 Extension — Preact + TypeScript + Vite
- **Backend**: Supabase (Auth + Postgres + RLS + Realtime)
- **Distribution**: Chrome Web Store (Unlisted)
- **CI/CD**: GitHub Actions → Chrome Web Store API

## 로컬 개발

```bash
cp .env.example .env
# .env 편집해 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY 입력
npm install
npm run dev
```

`dist/` 결과물을 Chrome `chrome://extensions` 의 "압축해제된 확장 프로그램 로드" 로 선택.

## DB 스키마

`db/schema.sql` 참조. Supabase 신규 프로젝트에서 SQL 편집기로 한번에 실행.

## 라이선스
내부용. 외부 배포 시 별도 검토.
