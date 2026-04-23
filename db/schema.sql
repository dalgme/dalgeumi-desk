-- 달그미데스크 초기 스키마
-- Supabase 신규 프로젝트의 SQL Editor 에서 전량 실행

-- 섹션 (북마크 카테고리)
create table if not exists public.sections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null check (length(name) between 1 and 60),
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 북마크
create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  section_id uuid not null references public.sections on delete cascade,
  title text not null check (length(title) between 1 and 200),
  url text not null check (length(url) between 1 and 2000),
  favicon_url text,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sections_user on public.sections(user_id, position);
create index if not exists idx_bookmarks_user on public.bookmarks(user_id, section_id, position);

-- Row Level Security
alter table public.sections enable row level security;
alter table public.bookmarks enable row level security;

drop policy if exists "own rows select" on public.sections;
drop policy if exists "own rows insert" on public.sections;
drop policy if exists "own rows update" on public.sections;
drop policy if exists "own rows delete" on public.sections;

create policy "own rows select" on public.sections for select using (auth.uid() = user_id);
create policy "own rows insert" on public.sections for insert with check (auth.uid() = user_id);
create policy "own rows update" on public.sections for update using (auth.uid() = user_id);
create policy "own rows delete" on public.sections for delete using (auth.uid() = user_id);

drop policy if exists "own rows select" on public.bookmarks;
drop policy if exists "own rows insert" on public.bookmarks;
drop policy if exists "own rows update" on public.bookmarks;
drop policy if exists "own rows delete" on public.bookmarks;

create policy "own rows select" on public.bookmarks for select using (auth.uid() = user_id);
create policy "own rows insert" on public.bookmarks for insert with check (auth.uid() = user_id);
create policy "own rows update" on public.bookmarks for update using (auth.uid() = user_id);
create policy "own rows delete" on public.bookmarks for delete using (auth.uid() = user_id);

-- Realtime 활성화
alter publication supabase_realtime add table public.sections;
alter publication supabase_realtime add table public.bookmarks;

-- updated_at 자동 갱신
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;

drop trigger if exists trg_sections_updated on public.sections;
drop trigger if exists trg_bookmarks_updated on public.bookmarks;
create trigger trg_sections_updated before update on public.sections
  for each row execute function public.touch_updated_at();
create trigger trg_bookmarks_updated before update on public.bookmarks
  for each row execute function public.touch_updated_at();
