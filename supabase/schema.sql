-- ================================
-- EXTENSIONS
-- ================================
create extension if not exists pgcrypto;
create extension if not exists postgis;

-- ================================
-- ENUMS
-- ================================
create type public.request_status as enum ('pending', 'accepted', 'rejected', 'cancelled');

-- ================================
-- PROFILES
-- ================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  name text,
  photo_url text,
  bio text,
  profession text,
  native_city text,
  current_city text,
  current_country text,
  community_tag text default 'gujarati',
  privacy_mode boolean default false,
  is_verified boolean default false,
  is_banned boolean default false,
  is_online boolean default false,
  last_seen_at timestamptz,
  invited_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ================================
-- LOCATION
-- ================================
create table public.user_locations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  city text,
  country text,
  accuracy_meters integer,
  location geography(Point, 4326),
  updated_at timestamptz default now()
);

create index user_locations_location_idx
on public.user_locations using gist (location);

-- ================================
-- CONNECTION REQUESTS
-- ================================
create table public.connection_requests (
  id bigserial primary key,
  requester_id uuid references auth.users(id) on delete cascade,
  addressee_id uuid references auth.users(id) on delete cascade,
  status public.request_status default 'pending',
  created_at timestamptz default now(),
  responded_at timestamptz,
  constraint no_self_request check (requester_id <> addressee_id),
  constraint unique_pair unique (requester_id, addressee_id)
);

-- ================================
-- CHAT THREADS
-- ================================
create table public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  connection_request_id bigint references public.connection_requests(id),
  last_message text,
  last_message_at timestamptz,
  created_at timestamptz default now()
);

-- ================================
-- CHAT PARTICIPANTS
-- ================================
create table public.chat_participants (
  thread_id uuid references public.chat_threads(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  primary key (thread_id, user_id)
);

-- ================================
-- MESSAGES
-- ================================
create table public.messages (
  id bigserial primary key,
  thread_id uuid references public.chat_threads(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete cascade,
  body text,
  created_at timestamptz default now(),
  read_at timestamptz
);

create index messages_idx on public.messages (thread_id, created_at desc);

-- ================================
-- BLOCKS & REPORTS
-- ================================
create table public.user_blocks (
  blocker_id uuid references auth.users(id),
  blocked_id uuid references auth.users(id),
  primary key (blocker_id, blocked_id)
);

create table public.reports (
  id bigserial primary key,
  reporter_id uuid references auth.users(id),
  reported_user_id uuid references auth.users(id),
  reason text,
  created_at timestamptz default now()
);

-- ================================
-- ADMIN
-- ================================
create table public.admin_users (
  user_id uuid primary key references auth.users(id)
);

-- ================================
-- FUNCTIONS
-- ================================

-- Auto profile creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, name, community_tag)
  values (new.id, '', 'gujarati')
  on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Auto update timestamp
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated
before update on public.profiles
for each row execute function public.set_updated_at();

-- Create chat when connection accepted
create or replace function public.handle_connection_accept()
returns trigger
language plpgsql
as $$
declare t_id uuid;
begin
  if new.status = 'accepted' and old.status <> 'accepted' then
    insert into public.chat_threads (connection_request_id)
    values (new.id) returning id into t_id;

    insert into public.chat_participants (thread_id, user_id)
    values (t_id, new.requester_id),
           (t_id, new.addressee_id);
  end if;
  return new;
end;
$$;

create trigger connection_accept_trigger
after update on public.connection_requests
for each row execute function public.handle_connection_accept();

-- Update chat preview
create or replace function public.handle_new_message()
returns trigger
language plpgsql
as $$
begin
  update public.chat_threads
  set last_message = new.body,
      last_message_at = now()
  where id = new.thread_id;
  return new;
end;
$$;

create trigger new_message_trigger
after insert on public.messages
for each row execute function public.handle_new_message();

-- ================================
-- NEARBY USERS FUNCTION
-- ================================
create or replace function public.get_nearby_users(
  lat double precision,
  lng double precision,
  radius integer default 20000
)
returns table (
  id uuid,
  name text,
  photo_url text,
  profession text,
  native_city text,
  distance_km numeric
)
language sql
as $$
select
  p.id,
  p.name,
  p.photo_url,
  p.profession,
  p.native_city,
  round(
    (st_distance(
      l.location,
      st_makepoint(lng, lat)::geography
    ) / 1000)::numeric, 2
  )
from public.profiles p
join public.user_locations l on l.user_id = p.id
where st_dwithin(
  l.location,
  st_makepoint(lng, lat)::geography,
  radius
)
and p.is_banned = false
limit 50;
$$;

-- ================================
-- RLS ENABLE
-- ================================
alter table public.profiles enable row level security;
alter table public.user_locations enable row level security;
alter table public.connection_requests enable row level security;
alter table public.chat_threads enable row level security;
alter table public.chat_participants enable row level security;
alter table public.messages enable row level security;
alter table public.user_blocks enable row level security;
alter table public.reports enable row level security;

-- ================================
-- BASIC POLICIES
-- ================================

-- Profiles
create policy "view profiles"
on public.profiles for select
to authenticated using (is_banned = false);

create policy "update own profile"
on public.profiles for update
to authenticated using (auth.uid() = id);

-- Location
create policy "own location"
on public.user_locations for all
to authenticated using (auth.uid() = user_id);

-- Connection
create policy "view own connections"
on public.connection_requests for select
to authenticated using (
  auth.uid() = requester_id OR auth.uid() = addressee_id
);

create policy "send request"
on public.connection_requests for insert
to authenticated with check (auth.uid() = requester_id);

create policy "respond request"
on public.connection_requests for update
to authenticated using (auth.uid() = addressee_id);

-- Chat threads
create policy "view own threads"
on public.chat_threads for select
to authenticated using (
  exists (
    select 1 from public.chat_participants cp
    where cp.thread_id = chat_threads.id
    and cp.user_id = auth.uid()
  )
);

-- Chat participants
create policy "view participants"
on public.chat_participants for select
to authenticated using (
  exists (
    select 1 from public.chat_participants cp
    where cp.thread_id = chat_participants.thread_id
    and cp.user_id = auth.uid()
  )
);

-- Messages
create policy "read messages"
on public.messages for select
to authenticated using (
  exists (
    select 1 from public.chat_participants cp
    where cp.thread_id = messages.thread_id
    and cp.user_id = auth.uid()
  )
);

create policy "send messages"
on public.messages for insert
to authenticated with check (
  sender_id = auth.uid()
);

-- ================================
-- REALTIME
-- ================================
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.chat_threads;
alter publication supabase_realtime add table public.connection_requests;

-- ================================
-- NOTIFICATIONS
-- ================================
create table public.notifications (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  type text, -- 'request' | 'accepted' | 'message' | 'system'
  title text,
  body text,
  read boolean default false,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;

create policy "users can read own notifications"
on public.notifications for select
to authenticated using (auth.uid() = user_id);

create policy "insert notifications"
on public.notifications for insert
to authenticated with check (true);

create policy "update own notifications"
on public.notifications for update
to authenticated using (auth.uid() = user_id);

alter publication supabase_realtime add table public.notifications;

