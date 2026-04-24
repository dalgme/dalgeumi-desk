// QA Part A — Supabase 백엔드 자동 검증
// 사용: node qa/backend.mjs (또는 npm run qa:backend)
// 의존: .env 의 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
// 출력: 각 항목 PASS/FAIL + 종료코드 (모두 PASS = 0)

import { readFileSync } from 'node:fs';

function loadEnv() {
  try {
    const raw = readFileSync('.env', 'utf-8');
    const out = {};
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (m) out[m[1]] = m[2].trim();
    }
    return out;
  } catch {
    return {};
  }
}

const env = { ...loadEnv(), ...process.env };
const URL = env.VITE_SUPABASE_URL;
const KEY = env.VITE_SUPABASE_ANON_KEY;

if (!URL || !KEY) {
  console.error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 누락 (.env 또는 환경변수)');
  process.exit(2);
}

const results = [];
async function check(id, desc, fn) {
  try {
    const { pass, detail } = await fn();
    results.push({ id, desc, pass, detail });
    console.log(`${pass ? 'PASS' : 'FAIL'}  ${id}  ${desc}${detail ? '  — ' + detail : ''}`);
  } catch (e) {
    results.push({ id, desc, pass: false, detail: `exception: ${e.message}` });
    console.log(`FAIL  ${id}  ${desc}  — exception: ${e.message}`);
  }
}

const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` };

await check('A1', 'anon read returns empty (RLS on sections)', async () => {
  const r = await fetch(`${URL}/rest/v1/sections?select=id`, { headers });
  if (r.status === 404) return { pass: false, detail: 'schema not applied (PGRST205)' };
  if (!r.ok) return { pass: false, detail: `HTTP ${r.status}` };
  const data = await r.json();
  const ok = Array.isArray(data) && data.length === 0;
  return { pass: ok, detail: `HTTP 200, ${JSON.stringify(data)}` };
});

await check('A1b', 'anon read returns empty (RLS on bookmarks)', async () => {
  const r = await fetch(`${URL}/rest/v1/bookmarks?select=id`, { headers });
  if (r.status === 404) return { pass: false, detail: 'schema not applied (PGRST205)' };
  if (!r.ok) return { pass: false, detail: `HTTP ${r.status}` };
  const data = await r.json();
  const ok = Array.isArray(data) && data.length === 0;
  return { pass: ok, detail: `HTTP 200, ${JSON.stringify(data)}` };
});

await check('A2', 'anon write blocked on sections', async () => {
  const r = await fetch(`${URL}/rest/v1/sections`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({ user_id: '00000000-0000-0000-0000-000000000000', name: 'hack', position: 0 }),
  });
  if (r.status === 404) return { pass: false, detail: 'schema not applied' };
  const ok = r.status === 401 || r.status === 403;
  const body = await r.text();
  return { pass: ok, detail: `HTTP ${r.status}: ${body.slice(0, 120)}` };
});

await check('A2b', 'anon write blocked on bookmarks', async () => {
  const r = await fetch(`${URL}/rest/v1/bookmarks`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({
      user_id: '00000000-0000-0000-0000-000000000000',
      section_id: '00000000-0000-0000-0000-000000000000',
      title: 'hack',
      url: 'https://example.com',
      position: 0,
    }),
  });
  if (r.status === 404) return { pass: false, detail: 'schema not applied' };
  const ok = r.status === 401 || r.status === 403;
  const body = await r.text();
  return { pass: ok, detail: `HTTP ${r.status}: ${body.slice(0, 120)}` };
});

await check('A3', 'Auth endpoint reachable and email provider enabled', async () => {
  const r = await fetch(`${URL}/auth/v1/settings`, { headers: { apikey: KEY } });
  if (!r.ok) return { pass: false, detail: `HTTP ${r.status}` };
  const data = await r.json();
  const emailEnabled = data?.external?.email ?? false;
  return {
    pass: r.ok && emailEnabled,
    detail: `HTTP 200, email_provider=${emailEnabled}, mailer_autoconfirm=${data?.mailer_autoconfirm}`,
  };
});

// A4/A5 는 pg_catalog 접근 필요 — anon 에겐 제한적이지만 PostgREST 통해 information_schema 일부 노출 가능.
// RPC 함수 없이는 불가. 사장님이 SQL Editor 에서 아래 쿼리로 직접 확인 요청.
await check('A4', 'Realtime publication includes sections/bookmarks (needs manual SQL)', async () => {
  return {
    pass: null,
    detail: '사장님 SQL Editor 실행: select tablename from pg_publication_tables where pubname=\'supabase_realtime\';',
  };
});

await check('A5', 'schema integrity (uuid id, RLS, triggers — needs manual SQL)', async () => {
  return {
    pass: null,
    detail: '사장님 SQL Editor 실행: select relname, relrowsecurity from pg_class where relname in (\'sections\',\'bookmarks\');',
  };
});

const hardFails = results.filter((r) => r.pass === false);
const skipped = results.filter((r) => r.pass === null);

console.log('\n=== SUMMARY ===');
console.log(`PASS: ${results.filter((r) => r.pass === true).length}`);
console.log(`FAIL: ${hardFails.length}`);
console.log(`SKIP (manual): ${skipped.length}`);

// 결과를 04_qa_results.md 형식 일부로 stdout 에 내보내기
console.log('\n=== MARKDOWN ROWS ===');
for (const r of results) {
  const mark = r.pass === true ? '✅' : r.pass === false ? '❌' : '⏸️';
  console.log(`| ${r.id} | ${r.desc} | ${mark} | ${r.detail ?? ''} |`);
}

process.exit(hardFails.length > 0 ? 1 : 0);
