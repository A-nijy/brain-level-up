-- ==========================================
-- BRAIN LEVEL UP - FULL DATABASE SCHEMA
-- ==========================================

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- 1. PROFILES Table
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  role text default 'user' check (role in ('user', 'admin')),
  membership_level text default 'BASIC' check (membership_level in ('BASIC', 'PREMIUM', 'PRO')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

-- Policies: Profiles
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles" on public.profiles for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
drop policy if exists "Admins can update any profile" on public.profiles;
create policy "Admins can update any profile" on public.profiles for update using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- Trigger: Create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role, membership_level)
  values (new.id, new.email, 'user', 'BASIC');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- 2. SHARED LIBRARY CATEGORIES
create table if not exists public.shared_library_categories (
    id uuid primary key default uuid_generate_v4(),
    title text not null,
    display_order integer default 0,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 3. LIBRARIES Table (Personal & Shared Base)
create table if not exists public.libraries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  title text not null,
  description text,
  is_public boolean default false,
  category text, -- Legacy
  display_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.libraries enable row level security;
create policy "Users can CRUD own libraries" on public.libraries for all using (auth.uid() = user_id);
create policy "Public libraries are viewable by everyone" on public.libraries for select using (is_public = true);
create policy "Admins can view all libraries" on public.libraries for select using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 4. SHARED LIBRARIES
create table if not exists public.shared_libraries (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  category text, -- Legacy string
  category_id uuid references public.shared_library_categories(id),
  download_count integer default 0,
  thumbnail_url text,
  created_by uuid references public.profiles(id),
  is_draft boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.shared_libraries enable row level security;
create policy "Public shared libraries are viewable by everyone" on public.shared_libraries for select using (is_draft = false);
create policy "Admins can manage shared libraries" on public.shared_libraries for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 5. SECTIONS (User & Shared)
create table if not exists public.library_sections (
    id uuid primary key default uuid_generate_v4(),
    library_id uuid not null references public.libraries(id) on delete cascade,
    title text not null,
    display_order integer not null default 0,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);
alter table public.library_sections enable row level security;
create policy "Users can manage sections of own libraries" on public.library_sections for all using (exists (select 1 from public.libraries where id = library_sections.library_id and user_id = auth.uid()));

create table if not exists public.shared_sections (
    id uuid primary key default uuid_generate_v4(),
    shared_library_id uuid not null references public.shared_libraries(id) on delete cascade,
    title text not null,
    display_order integer not null default 0,
    created_at timestamp with time zone default now()
);
alter table public.shared_sections enable row level security;
create policy "Public can read shared sections" on public.shared_sections for select using (exists (select 1 from public.shared_libraries where id = shared_sections.shared_library_id and is_draft = false));
create policy "Admins can manage shared sections" on public.shared_sections for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 6. ITEMS (User & Shared)
create table if not exists public.items (
  id uuid default uuid_generate_v4() primary key,
  library_id uuid references public.libraries(id) on delete cascade not null,
  section_id uuid references public.library_sections(id) on delete cascade,
  question text not null,
  answer text not null,
  memo text,
  image_url text,
  success_count integer default 0,
  fail_count integer default 0,
  study_status text default 'undecided' check (study_status in ('learned', 'confused', 'undecided')),
  display_order integer default 0,
  last_reviewed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.items enable row level security;
create policy "Users can CRUD own items" on public.items for all using (exists (select 1 from public.libraries where id = items.library_id and user_id = auth.uid()));

create table if not exists public.shared_items (
  id uuid default uuid_generate_v4() primary key,
  shared_library_id uuid references public.shared_libraries(id) on delete cascade not null,
  shared_section_id uuid references public.shared_sections(id) on delete cascade,
  question text not null,
  answer text not null,
  memo text,
  image_url text,
  display_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.shared_items enable row level security;
create policy "Public can read shared items" on public.shared_items for select using (exists (select 1 from public.shared_libraries where id = shared_items.shared_library_id and is_draft = false));
create policy "Admins can manage shared items" on public.shared_items for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 7. STUDY LOGS & NOTIFICATIONS
create table if not exists public.study_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  study_date date default current_date not null,
  items_count integer default 0,
  correct_count integer default 0,
  study_time_seconds integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, study_date)
);
alter table public.study_logs enable row level security;
create policy "Users can CRUD own study logs" on public.study_logs for all using (auth.uid() = user_id);

create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text default 'SYSTEM',
  is_read boolean default false,
  data jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.notifications enable row level security;
create policy "Users can view own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "Admins can insert notifications" on public.notifications for insert with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 8. NOTICES & INQUIRIES
create table if not exists public.notices (
    id uuid default uuid_generate_v4() primary key,
    title text not null,
    content text not null,
    is_important boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.notices enable row level security;
create policy "Anyone can view notices" on public.notices for select using (true);
create policy "Admins can manage notices" on public.notices for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create table if not exists public.inquiries (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    category text not null check (category in ('Q&A', '건의사항', '버그')),
    title text not null,
    content text not null,
    is_resolved boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.inquiries enable row level security;
create policy "Users can manage own inquiries" on public.inquiries for all using (auth.uid() = user_id);
create policy "Admins can manage all inquiries" on public.inquiries for all using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 9. FUNCTIONS
create or replace function public.increment_download_count(row_id uuid) returns void as $$
begin
  update public.shared_libraries set download_count = download_count + 1 where id = row_id;
end;
$$ language plpgsql security definer;

create or replace function public.increment_success(row_id uuid) returns void as $$
begin
  update public.items set success_count = success_count + 1, last_reviewed_at = now() where id = row_id;
end;
$$ language plpgsql security definer;

create or replace function public.increment_fail(row_id uuid) returns void as $$
begin
  update public.items set fail_count = fail_count + 1, last_reviewed_at = now() where id = row_id;
end;
$$ language plpgsql security definer;
