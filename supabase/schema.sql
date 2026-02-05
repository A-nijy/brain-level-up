-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- 1. PROFILES Table
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  role text default 'user' check (role in ('user', 'admin')),
  membership_level text default 'BASIC' check (membership_level in ('BASIC', 'PREMIUM', 'PRO')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS: Profiles
alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Admins can view all profiles" on public.profiles
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Trigger: Create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role, membership_level)
  values (new.id, new.email, 'user', 'BASIC');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. LIBRARIES Table
create table public.libraries (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  title text not null,
  description text,
  is_public boolean default false,
  category text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS: Libraries
alter table public.libraries enable row level security;

create policy "Users can CRUD own libraries" on public.libraries
  for all using (auth.uid() = user_id);

create policy "Public libraries are viewable by everyone" on public.libraries
  for select using (is_public = true);


-- 3. ITEMS Table
create table public.items (
  id uuid default uuid_generate_v4() primary key,
  library_id uuid references public.libraries(id) on delete cascade not null,
  question text not null,
  answer text not null,
  memo text,
  image_url text,
  success_count integer default 0,
  fail_count integer default 0,
  last_reviewed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS: Items
alter table public.items enable row level security;

-- Policy: Users can perform all actions on items if they own the library
create policy "Users can CRUD own items" on public.items
  for all using (
    auth.uid() in (
      select user_id from public.libraries where id = library_id
    )
  );

-- Policy: Public items are viewable
create policy "Public items are viewable" on public.items
  for select using (
    exists (
      select 1 from public.libraries
      where id = library_id and is_public = true
    )
  );

-- 4. SHARED LIBRARIES (Admin managed)
create table public.shared_libraries (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  category text,
  download_count integer default 0,
  thumbnail_url text,
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.shared_libraries enable row level security;

create policy "Anyone can view shared libraries" on public.shared_libraries
  for select using (true);

create policy "Only admins can insert/update/delete shared libraries" on public.shared_libraries
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
