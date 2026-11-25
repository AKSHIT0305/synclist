-- 0002_profiles: one row per auth user, created automatically on sign-up.

create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text not null default '' check (char_length(display_name) <= 60),
  avatar_url    text check (avatar_url is null or char_length(avatar_url) <= 1000),
  -- Private: never readable by other users (see column grants in 0006_rls).
  push_tokens   text[] not null default '{}',
  -- Set when the user finishes the onboarding profile step; drives the app's auth routing.
  onboarded_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  updated_by    uuid references auth.users (id) on delete set null,
  deleted_at    timestamptz
);

create trigger profiles_set_updated_at
  before insert or update on public.profiles
  for each row execute function public.set_updated_at();

-- Create a profile for every new auth user, prefilled from the OAuth provider's metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url, updated_by)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''), 60),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    new.id
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
