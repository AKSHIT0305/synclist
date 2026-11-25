-- 0007_storage_realtime: avatar storage bucket and Realtime publication.

-- Avatars: public read (served via public URL); each user writes only inside "<their uid>/".
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "avatars: upload to own folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatars: update own files"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatars: delete own files"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Upsert needs to read the existing object.
create policy "avatars: read own files"
  on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Realtime postgres_changes for the synced tables (RLS still applies to each subscriber).
alter publication supabase_realtime
  add table public.lists, public.list_members, public.tasks, public.task_notes;
