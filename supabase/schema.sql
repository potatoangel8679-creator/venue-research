-- Venue Research Service — 데이터베이스 스키마
-- Supabase SQL Editor에서 이 파일 전체를 그대로 붙여넣고 실행하면 됩니다.

create extension if not exists "uuid-ossp";

-- 1) 행사장 종류 (컨벤션센터, 호텔볼룸, 갤러리 등)
create table if not exists venue_types (
  id uuid primary key default uuid_generate_v4(),
  name_ko text not null,
  name_en text not null
);

-- 2) 행사장 본체
create table if not exists venues (
  id uuid primary key default uuid_generate_v4(),
  google_place_id text unique,
  name text not null,
  address text,
  region text,
  latitude double precision,
  longitude double precision,
  venue_type_id uuid references venue_types(id),

  total_area_sqm numeric,
  rentable_area_sqm numeric,
  max_capacity integer,
  seated_capacity integer,
  standing_capacity integer,
  indoor_outdoor text check (indoor_outdoor in ('indoor','outdoor','both')),

  primary_use text[], -- 예: {"전시","컨퍼런스"}
  official_website text,
  google_maps_url text,

  last_researched_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_venues_region on venues (region);
create index if not exists idx_venues_capacity on venues (max_capacity);

-- 3) 행사장 사진
create table if not exists venue_photos (
  id uuid primary key default uuid_generate_v4(),
  venue_id uuid references venues(id) on delete cascade,
  url text not null,
  source text check (source in ('google_places','official_site','uploaded')),
  attribution text
);

-- 4) 행사장 자체 정보의 출처 (공식 홈페이지 등 — 면적/수용인원 등의 근거)
create table if not exists venue_sources (
  id uuid primary key default uuid_generate_v4(),
  venue_id uuid references venues(id) on delete cascade,
  source_type text check (source_type in ('news','press_release','brand_official','venue_official','blog_review','other')),
  title text not null,
  url text not null,
  confidence text check (confidence in ('high','medium','low')) default 'medium'
);

-- 5) 과거 행사 (하나의 행사 = 하나의 row. 같은 행사를 다루는 기사가 여러 개여도 row는 1개)
create table if not exists events (
  id uuid primary key default uuid_generate_v4(),
  venue_id uuid references venues(id) on delete cascade,
  event_name text not null,
  event_date date,
  event_year integer, -- 정확한 날짜는 모르지만 연도만 확인된 경우
  event_type text,
  organizer text,
  brand text,
  description text,
  estimated_attendance integer, -- 출처에 숫자가 명시된 경우에만 채움
  confidence text check (confidence in ('high','medium','low')) default 'medium',
  created_at timestamptz default now(),

  -- 동일 장소에서 이름+연도가 같은 행사가 중복 저장되는 것을 방지
  unique (venue_id, event_name, event_year)
);

create index if not exists idx_events_venue on events (venue_id);
create index if not exists idx_events_type on events (event_type);

-- 6) 행사의 근거자료 (Evidence) — 하나의 event에 여러 개 연결 가능
create table if not exists event_sources (
  id uuid primary key default uuid_generate_v4(),
  event_id uuid references events(id) on delete cascade,
  source_type text check (source_type in ('news','press_release','brand_official','venue_official','blog_review','other')),
  title text not null,
  url text not null,
  evidence_text text, -- 근거가 되는 짧은 발췌 (저작권 보호를 위해 짧게만 저장)
  image_url text,
  confidence text check (confidence in ('high','medium','low')) default 'medium',
  created_at timestamptz default now(),

  unique (event_id, url) -- 같은 URL이 같은 행사에 중복 연결되지 않도록
);

create index if not exists idx_event_sources_event on event_sources (event_id);

-- 7) 리서치 작업 이력 — 캐시/재조사 판단용
create table if not exists research_jobs (
  id uuid primary key default uuid_generate_v4(),
  venue_id uuid references venues(id) on delete cascade,
  status text check (status in ('pending','running','done','failed')) default 'pending',
  started_at timestamptz,
  finished_at timestamptz,
  error_message text
);

-- updated_at 자동 갱신 트리거
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_venues_updated_at on venues;
create trigger trg_venues_updated_at
before update on venues
for each row execute function set_updated_at();

-- 초기 venue_types 데이터
insert into venue_types (name_ko, name_en) values
  ('컨벤션센터', 'Convention Center'),
  ('호텔 볼룸', 'Hotel Ballroom'),
  ('갤러리', 'Gallery'),
  ('창고형 공간', 'Warehouse'),
  ('공연장', 'Performance Hall'),
  ('복합문화공간', 'Culture Space'),
  ('이벤트홀', 'Event Hall')
on conflict do nothing;

-- Row Level Security: 일반 사용자는 읽기만 가능, 쓰기는 서버(Service Role)만 가능
alter table venues enable row level security;
alter table venue_photos enable row level security;
alter table venue_sources enable row level security;
alter table events enable row level security;
alter table event_sources enable row level security;
alter table venue_types enable row level security;

create policy "public read venues" on venues for select using (true);
create policy "public read venue_photos" on venue_photos for select using (true);
create policy "public read venue_sources" on venue_sources for select using (true);
create policy "public read events" on events for select using (true);
create policy "public read event_sources" on event_sources for select using (true);
create policy "public read venue_types" on venue_types for select using (true);

-- research_jobs, 쓰기 작업은 RLS를 열지 않음 → 서버(Service Role Key)에서만 접근 가능
alter table research_jobs enable row level security;
