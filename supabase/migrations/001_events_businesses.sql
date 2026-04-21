-- ================================
-- MIGRATION: Events, RSVPs, Businesses, Interests
-- Run this in your Supabase SQL Editor
-- ================================

-- 1. Add interests field to profiles
alter table public.profiles
  add column if not exists interests text[] default '{}';

-- 2. Events table
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  location text,
  city text,
  event_date timestamptz not null,
  image_url text,
  is_free boolean default true,
  max_attendees integer,
  created_at timestamptz default now() not null
);

-- 3. RSVPs table
create table if not exists public.rsvps (
  event_id uuid references public.events(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  primary key (event_id, user_id)
);

-- 4. Businesses table
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  category text,
  description text,
  city text,
  country text,
  website text,
  phone text,
  image_url text,
  created_at timestamptz default now() not null
);

-- ================================
-- RLS
-- ================================
alter table public.events enable row level security;
alter table public.rsvps enable row level security;
alter table public.businesses enable row level security;

-- Events policies
create policy "anyone can view events"
  on public.events for select to authenticated using (true);

create policy "users can create events"
  on public.events for insert to authenticated
  with check (auth.uid() = creator_id);

create policy "creators can update events"
  on public.events for update to authenticated
  using (auth.uid() = creator_id);

create policy "creators can delete events"
  on public.events for delete to authenticated
  using (auth.uid() = creator_id);

-- RSVPs policies
create policy "view rsvps"
  on public.rsvps for select to authenticated using (true);

create policy "manage own rsvps"
  on public.rsvps for all to authenticated
  using (auth.uid() = user_id);

-- Businesses policies
create policy "anyone can view businesses"
  on public.businesses for select to authenticated using (true);

create policy "owners can create business"
  on public.businesses for insert to authenticated
  with check (auth.uid() = owner_id);

create policy "owners can update business"
  on public.businesses for update to authenticated
  using (auth.uid() = owner_id);

create policy "owners can delete business"
  on public.businesses for delete to authenticated
  using (auth.uid() = owner_id);

-- ================================
-- REALTIME
-- ================================
alter publication supabase_realtime add table public.events;
alter publication supabase_realtime add table public.rsvps;

-- ================================
-- RSVP COUNT VIEW (handy helper)
-- ================================
create or replace view public.event_feed as
select
  e.*,
  p.name as creator_name,
  p.photo_url as creator_photo,
  (select count(*) from public.rsvps r where r.event_id = e.id) as rsvp_count
from public.events e
join public.profiles p on p.id = e.creator_id;

grant select on public.event_feed to authenticated;
