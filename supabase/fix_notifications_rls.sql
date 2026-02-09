-- Allow admins to insert notifications for all users
create policy "Admins can insert notifications for all" on public.notifications
  for insert with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Users should be able to delete their own notifications if needed (optional but good)
create policy "Users can delete own notifications" on public.notifications
  for delete using (auth.uid() = user_id);
