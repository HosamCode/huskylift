-- HuskyLift — Database Schema (v1)
-- Target: Postgres (via Supabase)

-- profiles: app-specific data attached 1:1 to each auth user
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  weekly_goal integer not null default 3 check (weekly_goal between 1 and 7),
  created_at  timestamptz not null default now()
);

-- Auto-create a profile row whenever someone signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- check_ins: one row per gym visit
create table public.check_ins (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  visit_date    date not null
    generated always as ((checked_in_at at time zone 'America/New_York')::date) stored,
  unique (user_id, visit_date)
);

-- Row Level Security: users can only touch their own rows.
alter table public.profiles  enable row level security;
alter table public.check_ins enable row level security;

create policy "read own profile"   on public.profiles for select using (auth.uid() = id);
create policy "update own profile" on public.profiles for update using (auth.uid() = id);

create policy "read own check_ins"   on public.check_ins for select using (auth.uid() = user_id);
create policy "add own check_ins"    on public.check_ins for insert with check (auth.uid() = user_id);
create policy "delete own check_ins" on public.check_ins for delete using (auth.uid() = user_id);
