-- PaperLens initial schema: per-user profile with monthly usage counter + Pro flag.

create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  email         text,
  is_pro        boolean not null default false,
  extpay_status text,
  summary_count integer not null default 0,
  usage_period  text,                          -- 'YYYY-MM' bucket for the free counter
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- A user may read (but not modify) their own profile. All writes happen through
-- edge functions using the service-role key, which bypasses RLS.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Atomically reset the monthly bucket if needed, enforce the free limit, and
-- (when allowed) increment the counter. Pro users are always allowed.
create or replace function public.consume_summary(p_user uuid, p_free_limit integer)
returns table (used integer, is_pro boolean, allowed boolean, resets_on date)
language plpgsql
security definer set search_path = public
as $$
declare
  cur_period text := to_char(now(), 'YYYY-MM');
  next_reset date := (date_trunc('month', now()) + interval '1 month')::date;
  prof public.profiles;
begin
  select * into prof from public.profiles where id = p_user for update;
  if not found then
    insert into public.profiles (id) values (p_user) returning * into prof;
  end if;

  -- New month => reset the counter.
  if prof.usage_period is distinct from cur_period then
    update public.profiles
      set usage_period = cur_period, summary_count = 0, updated_at = now()
      where id = p_user;
    prof.summary_count := 0;
  end if;

  if prof.is_pro then
    update public.profiles
      set summary_count = prof.summary_count + 1, updated_at = now()
      where id = p_user;
    return query select prof.summary_count + 1, true, true, next_reset;
    return;
  end if;

  if prof.summary_count >= p_free_limit then
    return query select prof.summary_count, false, false, next_reset;
    return;
  end if;

  update public.profiles
    set summary_count = prof.summary_count + 1, updated_at = now()
    where id = p_user;
  return query select prof.summary_count + 1, false, true, next_reset;
end;
$$;

-- Set / clear the Pro flag (called from the sync-subscription edge function).
create or replace function public.set_pro(p_user uuid, p_is_pro boolean, p_status text)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles
    set is_pro = p_is_pro, extpay_status = p_status, updated_at = now()
    where id = p_user;
end;
$$;
