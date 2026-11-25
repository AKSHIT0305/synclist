-- 0004_invites: shareable invite tokens. Redeemed only by the join-list Edge Function (Phase 3).

create table public.invites (
  id          uuid primary key default gen_random_uuid(),
  list_id     uuid not null references public.lists (id) on delete cascade,
  -- 24 random bytes, base64url without padding (32 chars). Unguessable.
  token       text not null unique
              default translate(encode(extensions.gen_random_bytes(24), 'base64'), '+/', '-_'),
  role        public.member_role not null default 'editor' check (role <> 'owner'),
  created_by  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '7 days',
  max_uses    integer check (max_uses is null or max_uses > 0),
  uses        integer not null default 0 check (uses >= 0),
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users (id) on delete set null,
  deleted_at  timestamptz,
  check (max_uses is null or uses <= max_uses)
);

create index invites_list_id_idx on public.invites (list_id);
create index invites_created_by_created_at_idx on public.invites (created_by, created_at);

create trigger invites_set_updated_at
  before insert or update on public.invites
  for each row execute function public.set_updated_at();

-- Rate limit: 20 invites per user per rolling 24 hours.
create or replace function public.enforce_invite_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('invites:' || new.created_by::text, 0));
  if (select count(*) from public.invites i
      where i.created_by = new.created_by
        and i.created_at > now() - interval '24 hours') >= 20 then
    raise exception 'invite limit reached (20 per day)' using errcode = 'SL429';
  end if;
  return new;
end;
$$;

create trigger invites_rate_limit
  before insert on public.invites
  for each row execute function public.enforce_invite_rate_limit();
