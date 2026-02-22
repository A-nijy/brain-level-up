-- app_logs 테이블 생성 (DAU, 수익분석, 시스템상태 추적용)
create table if not exists public.app_logs (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) on delete set null,
    event_type text not null, -- 'app_open', 'ad_view', 'error', 'study_complete' 등
    metadata jsonb default '{}'::jsonb, -- 광고 경로, 에러 메시지 등 상세 정보
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 인덱스 추가 (속도 향상)
create index if not exists idx_app_logs_event_type on public.app_logs(event_type);
create index if not exists idx_app_logs_created_at on public.app_logs(created_at);

-- RLS 설정
alter table public.app_logs enable row level security;

-- 누구나 로그는 쌓을 수 있게 (Insert), 관리자만 조회 가능하게 (Select)
create policy "Anyone can insert logs" on public.app_logs for insert with check (true);
create policy "Admins can view all logs" on public.app_logs for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
