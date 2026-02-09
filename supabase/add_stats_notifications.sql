-- 1. STUDY_LOGS Table
create table public.study_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  study_date date default current_date not null,
  items_count integer default 0,
  correct_count integer default 0,
  study_time_seconds integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, study_date)
);

-- RLS: Study Logs
alter table public.study_logs enable row level security;

create policy "Users can CRUD own study logs" on public.study_logs
  for all using (auth.uid() = user_id);

-- 2. NOTIFICATIONS Table
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text default 'SYSTEM',
  is_read boolean default false,
  data jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS: Notifications
alter table public.notifications enable row level security;

create policy "Users can view own notifications" on public.notifications
  for select using (auth.uid() = user_id);

create policy "Users can update own notifications (mark as read)" on public.notifications
  for update using (auth.uid() = user_id);

-- 3. Indices for performance
create index idx_study_logs_user_date on public.study_logs(user_id, study_date);
create index idx_notifications_user_read on public.notifications(user_id, is_read);
