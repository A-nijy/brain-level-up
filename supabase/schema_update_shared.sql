-- 5. SHARED ITEMS Table (for shared libraries items)
create table if not exists public.shared_items (
  id uuid default uuid_generate_v4() primary key,
  shared_library_id uuid references public.shared_libraries(id) on delete cascade not null,
  question text not null,
  answer text not null,
  memo text,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.shared_items enable row level security;

create policy "Anyone can view shared items" on public.shared_items
  for select using (true);

create policy "Only admins can manage shared items" on public.shared_items
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Function to increment download count
create or replace function public.increment_download_count(row_id uuid)
returns void as $$
begin
  update public.shared_libraries
  set download_count = download_count + 1
  where id = row_id;
end;
$$ language plpgsql security definer;

-- Function to increment success/fail count (for study mode efficiency)
create or replace function public.increment_success(row_id uuid)
returns void as $$
begin
  update public.items
  set success_count = success_count + 1,
      last_reviewed_at = now()
  where id = row_id;
end;
$$ language plpgsql security definer;

create or replace function public.increment_fail(row_id uuid)
returns void as $$
begin
  update public.items
  set fail_count = fail_count + 1,
      last_reviewed_at = now()
  where id = row_id;
end;
$$ language plpgsql security definer;
