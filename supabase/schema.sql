-- ==============================================================================
-- Mcut Database Schema & Security Policies for Supabase
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. TABLES

-- Profiles (Entity: User)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'user' check (role in ('admin', 'user')),
  display_name text,
  preferred_currency text default 'INR',
  currency text default 'INR',
  upi_id text,
  avatar_url text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

-- Trips (Entity: Trip)
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  destination text,
  description text,
  start_date date,
  end_date date,
  currency text not null default 'INR',
  cover_image text,
  budget_minor bigint default 0,
  archived boolean not null default false,
  members text[] not null default '{}',
  created_by_id uuid references auth.users(id) default auth.uid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

-- Trip Members (Entity: TripMember)
create table if not exists public.trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id text not null,
  user_name text,
  user_email text,
  avatar_url text,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  upi_id text,
  members text[] not null default '{}',
  created_by_id uuid references auth.users(id) default auth.uid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

-- Expenses (Entity: Expense)
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  title text not null,
  amount_minor bigint not null,
  currency text not null default 'INR',
  category text,
  expense_date date default current_date,
  notes text,
  merchant text,
  location text,
  receipt_uri text,
  split_method text not null default 'equal' check (split_method in ('equal', 'exact', 'percent', 'shares')),
  payers jsonb not null default '[]'::jsonb,
  shares jsonb not null default '[]'::jsonb,
  created_by_name text,
  members text[] not null default '{}',
  created_by_id uuid references auth.users(id) default auth.uid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

-- Settlements (Entity: Settlement)
create table if not exists public.settlements (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  from_user_id text not null,
  from_name text,
  to_user_id text not null,
  to_name text,
  amount_minor bigint not null,
  currency text default 'INR',
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected', 'cancelled')),
  note text,
  settled_on date,
  members text[] not null default '{}',
  created_by_id uuid references auth.users(id) default auth.uid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

-- Activity Events (Entity: ActivityEvent)
create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  type text,
  actor_id text,
  actor_name text,
  message text not null,
  amount_minor bigint,
  currency text,
  ref_id text,
  members text[] not null default '{}',
  created_by_id uuid references auth.users(id) default auth.uid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

-- Chat Messages (Entity: ChatMessage)
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id text,
  user_name text,
  text text not null,
  members text[] not null default '{}',
  created_by_id uuid references auth.users(id) default auth.uid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

-- Itinerary Items (Entity: ItineraryItem)
create table if not exists public.itinerary_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  day date,
  time text,
  title text not null,
  notes text,
  location text,
  members text[] not null default '{}',
  created_by_id uuid references auth.users(id) default auth.uid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

-- Trip Invites (Entity: TripInvite)
create table if not exists public.trip_invites (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  token text not null unique,
  trip_name text,
  created_by_name text,
  expires_at timestamptz,
  revoked boolean not null default false,
  members text[] not null default '{}',
  created_by_id uuid references auth.users(id) default auth.uid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

-- 3. INDEXES
create unique index if not exists idx_trip_members_unique on public.trip_members(trip_id, user_id);
create index if not exists idx_trip_members_user on public.trip_members(user_id);
create index if not exists idx_expenses_trip on public.expenses(trip_id);
create index if not exists idx_settlements_trip on public.settlements(trip_id);
create index if not exists idx_activity_events_trip on public.activity_events(trip_id);
create index if not exists idx_chat_messages_trip on public.chat_messages(trip_id);
create index if not exists idx_itinerary_items_trip on public.itinerary_items(trip_id);
create index if not exists idx_trip_invites_trip on public.trip_invites(trip_id);
create index if not exists idx_trip_invites_token on public.trip_invites(token);

-- 4. REALTIME
alter publication supabase_realtime add table public.chat_messages;

-- 5. AUTOMATED TIMESTAMP & PROFILE TRIGGERS

-- Function to set updated_date = now() on update for every table
create or replace function public.set_updated_date()
returns trigger as $$
begin
  new.updated_date := now();
  return new;
end;
$$ language plpgsql set search_path = public;

create or replace trigger set_profiles_updated_date before update on public.profiles for each row execute procedure public.set_updated_date();
create or replace trigger set_trips_updated_date before update on public.trips for each row execute procedure public.set_updated_date();
create or replace trigger set_trip_members_updated_date before update on public.trip_members for each row execute procedure public.set_updated_date();
create or replace trigger set_expenses_updated_date before update on public.expenses for each row execute procedure public.set_updated_date();
create or replace trigger set_settlements_updated_date before update on public.settlements for each row execute procedure public.set_updated_date();
create or replace trigger set_activity_events_updated_date before update on public.activity_events for each row execute procedure public.set_updated_date();
create or replace trigger set_chat_messages_updated_date before update on public.chat_messages for each row execute procedure public.set_updated_date();
create or replace trigger set_itinerary_items_updated_date before update on public.itinerary_items for each row execute procedure public.set_updated_date();
create or replace trigger set_trip_invites_updated_date before update on public.trip_invites for each row execute procedure public.set_updated_date();

-- Trigger to automatically populate profile when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Prevent users from changing their own role unless admin
create or replace function public.prevent_role_change()
returns trigger as $$
begin
  if new.role is distinct from old.role and (
    auth.uid() is null or
    not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  ) then
    new.role := old.role;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create or replace trigger enforce_profiles_role
  before update on public.profiles
  for each row execute procedure public.prevent_role_change();

-- 6. SECURITY HELPER FUNCTIONS

-- Helper to check if current user is an active member of a trip
create or replace function public.is_trip_member(p_trip_id uuid)
returns boolean as $$
  select exists (
    select 1 from public.trip_members
    where trip_id = p_trip_id
      and user_id = auth.uid()::text
  );
$$ language sql security definer set search_path = public;

-- Function to securely validate an invite token and join the user to the trip
create or replace function public.join_trip(token text)
returns json as $$
declare
  v_user_id uuid := auth.uid();
  v_invite record;
  v_trip record;
  v_name text;
  v_email text;
  v_avatar text;
begin
  if v_user_id is null then
    return json_build_object('error', 'Please sign in first.');
  end if;

  if token is null or length(trim(token)) < 6 then
    return json_build_object('error', 'This invite link is missing its code.');
  end if;

  select * into v_invite from public.trip_invites where trip_invites.token = trim(join_trip.token);
  if not found then
    return json_build_object('error', 'This invite link is not valid.');
  end if;

  if v_invite.revoked then
    return json_build_object('error', 'This invite link was revoked.');
  end if;

  if v_invite.expires_at is not null and v_invite.expires_at < now() then
    return json_build_object('error', 'This invite link has expired. Ask for a new one.');
  end if;

  select * into v_trip from public.trips where trips.id = v_invite.trip_id;
  if not found then
    return json_build_object('error', 'That trip no longer exists.');
  end if;

  -- Check if user is already a member
  if exists (select 1 from public.trip_members where trip_id = v_trip.id and user_id = v_user_id::text) then
    return json_build_object('trip_id', v_trip.id, 'already_member', true);
  end if;

  -- Get user info
  select display_name, email, avatar_url into v_name, v_email, v_avatar from public.profiles where id = v_user_id;
  v_name := coalesce(v_name, split_part(v_email, '@', 1), 'Traveller');

  -- Add user to trip members list
  update public.trips
  set members = array_append(members, v_user_id::text)
  where id = v_trip.id;

  -- Create trip member entry
  insert into public.trip_members (trip_id, user_id, user_name, user_email, avatar_url, role, members)
  values (
    v_trip.id,
    v_user_id::text,
    v_name,
    v_email,
    v_avatar,
    'member',
    array_append(v_trip.members, v_user_id::text)
  );

  -- Record activity event
  insert into public.activity_events (trip_id, type, actor_id, actor_name, message, members)
  values (
    v_trip.id,
    'member_joined',
    v_user_id::text,
    v_name,
    v_name || ' joined the trip',
    array_append(v_trip.members, v_user_id::text)
  );

  return json_build_object('trip_id', v_trip.id, 'already_member', false);
end;
$$ language plpgsql security definer set search_path = public;

-- 7. ROW-LEVEL SECURITY (RLS) POLICIES

alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.expenses enable row level security;
alter table public.settlements enable row level security;
alter table public.activity_events enable row level security;
alter table public.chat_messages enable row level security;
alter table public.itinerary_items enable row level security;
alter table public.trip_invites enable row level security;

-- PROFILES
-- Authenticated users can view self + members with whom they share a trip
create policy "Profiles select" on public.profiles for select
  using (
    auth.uid() = id
    or exists (
      select 1 from public.trip_members tm1
      join public.trip_members tm2 on tm1.trip_id = tm2.trip_id
      where tm1.user_id = auth.uid()::text
        and tm2.user_id = profiles.id::text
    )
  );

-- Users can update only their own row
create policy "Profiles update" on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- TRIPS
create policy "Trips select" on public.trips for select
  using (created_by_id = auth.uid() or is_trip_member(id));

create policy "Trips insert" on public.trips for insert
  with check (auth.uid() is not null);

create policy "Trips update" on public.trips for update
  using (created_by_id = auth.uid() or is_trip_member(id))
  with check (created_by_id = auth.uid() or is_trip_member(id));

create policy "Trips delete" on public.trips for delete
  using (created_by_id = auth.uid());

-- TRIP MEMBERS
-- Select: view members of trips you belong to or created
create policy "TripMember select" on public.trip_members for select
  using (
    user_id = auth.uid()::text
    or is_trip_member(trip_id)
    or exists (select 1 from public.trips t where t.id = trip_id and t.created_by_id = auth.uid())
  );

-- Insert: allowed only when the trip's created_by_id = auth.uid() (joiners added by join_trip)
create policy "TripMember insert" on public.trip_members for insert
  with check (
    exists (select 1 from public.trips t where t.id = trip_id and t.created_by_id = auth.uid())
  );

-- Members update only their own row
create policy "TripMember update" on public.trip_members for update
  using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

-- Members delete only their own row
create policy "TripMember delete" on public.trip_members for delete
  using (user_id = auth.uid()::text);

-- EXPENSES
create policy "Expenses select" on public.expenses for select
  using (is_trip_member(trip_id) or exists (select 1 from public.trips t where t.id = trip_id and t.created_by_id = auth.uid()));

create policy "Expenses insert" on public.expenses for insert
  with check (is_trip_member(trip_id) or exists (select 1 from public.trips t where t.id = trip_id and t.created_by_id = auth.uid()));

create policy "Expenses update" on public.expenses for update
  using (is_trip_member(trip_id) or exists (select 1 from public.trips t where t.id = trip_id and t.created_by_id = auth.uid()))
  with check (is_trip_member(trip_id) or exists (select 1 from public.trips t where t.id = trip_id and t.created_by_id = auth.uid()));

create policy "Expenses delete" on public.expenses for delete
  using (is_trip_member(trip_id) or exists (select 1 from public.trips t where t.id = trip_id and t.created_by_id = auth.uid()));

-- SETTLEMENTS
create policy "Settlements select" on public.settlements for select
  using (is_trip_member(trip_id) or exists (select 1 from public.trips t where t.id = trip_id and t.created_by_id = auth.uid()));

create policy "Settlements insert" on public.settlements for insert
  with check (is_trip_member(trip_id) or exists (select 1 from public.trips t where t.id = trip_id and t.created_by_id = auth.uid()));

create policy "Settlements update" on public.settlements for update
  using (is_trip_member(trip_id) or exists (select 1 from public.trips t where t.id = trip_id and t.created_by_id = auth.uid()))
  with check (is_trip_member(trip_id) or exists (select 1 from public.trips t where t.id = trip_id and t.created_by_id = auth.uid()));

create policy "Settlements delete" on public.settlements for delete
  using (is_trip_member(trip_id) or exists (select 1 from public.trips t where t.id = trip_id and t.created_by_id = auth.uid()));

-- ACTIVITY EVENTS
create policy "Activity select" on public.activity_events for select
  using (is_trip_member(trip_id) or exists (select 1 from public.trips t where t.id = trip_id and t.created_by_id = auth.uid()));

create policy "Activity insert" on public.activity_events for insert
  with check (is_trip_member(trip_id) or exists (select 1 from public.trips t where t.id = trip_id and t.created_by_id = auth.uid()));

create policy "Activity update" on public.activity_events for update
  using (is_trip_member(trip_id) or exists (select 1 from public.trips t where t.id = trip_id and t.created_by_id = auth.uid()))
  with check (is_trip_member(trip_id) or exists (select 1 from public.trips t where t.id = trip_id and t.created_by_id = auth.uid()));

create policy "Activity delete" on public.activity_events for delete
  using (is_trip_member(trip_id) or exists (select 1 from public.trips t where t.id = trip_id and t.created_by_id = auth.uid()));

-- CHAT MESSAGES
create policy "Chat select" on public.chat_messages for select
  using (is_trip_member(trip_id) or exists (select 1 from public.trips t where t.id = trip_id and t.created_by_id = auth.uid()));

create policy "Chat insert" on public.chat_messages for insert
  with check (is_trip_member(trip_id) or exists (select 1 from public.trips t where t.id = trip_id and t.created_by_id = auth.uid()));

create policy "Chat update" on public.chat_messages for update
  using (is_trip_member(trip_id) or exists (select 1 from public.trips t where t.id = trip_id and t.created_by_id = auth.uid()))
  with check (is_trip_member(trip_id) or exists (select 1 from public.trips t where t.id = trip_id and t.created_by_id = auth.uid()));

create policy "Chat delete" on public.chat_messages for delete
  using (is_trip_member(trip_id) or exists (select 1 from public.trips t where t.id = trip_id and t.created_by_id = auth.uid()));

-- ITINERARY ITEMS
create policy "Itinerary select" on public.itinerary_items for select
  using (is_trip_member(trip_id) or exists (select 1 from public.trips t where t.id = trip_id and t.created_by_id = auth.uid()));

create policy "Itinerary insert" on public.itinerary_items for insert
  with check (is_trip_member(trip_id) or exists (select 1 from public.trips t where t.id = trip_id and t.created_by_id = auth.uid()));

create policy "Itinerary update" on public.itinerary_items for update
  using (is_trip_member(trip_id) or exists (select 1 from public.trips t where t.id = trip_id and t.created_by_id = auth.uid()))
  with check (is_trip_member(trip_id) or exists (select 1 from public.trips t where t.id = trip_id and t.created_by_id = auth.uid()));

create policy "Itinerary delete" on public.itinerary_items for delete
  using (is_trip_member(trip_id) or exists (select 1 from public.trips t where t.id = trip_id and t.created_by_id = auth.uid()));

-- TRIP INVITES
-- Members/creators can select, insert, or update invites (joining is handled by join_trip)
create policy "Invites select" on public.trip_invites for select
  using (is_trip_member(trip_id) or exists (select 1 from public.trips t where t.id = trip_id and t.created_by_id = auth.uid()));

create policy "Invites insert" on public.trip_invites for insert
  with check (is_trip_member(trip_id) or exists (select 1 from public.trips t where t.id = trip_id and t.created_by_id = auth.uid()));

create policy "Invites update" on public.trip_invites for update
  using (is_trip_member(trip_id) or exists (select 1 from public.trips t where t.id = trip_id and t.created_by_id = auth.uid()))
  with check (is_trip_member(trip_id) or exists (select 1 from public.trips t where t.id = trip_id and t.created_by_id = auth.uid()));

-- 8. STORAGE BUCKETS & POLICIES
-- Create buckets if they don't exist
insert into storage.buckets (id, name, public)
values ('public-avatars', 'public-avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

-- Public avatars policies: public read, write restricted to owner's folder
create policy "Public avatars read" on storage.objects for select
  using (bucket_id = 'public-avatars');

create policy "Public avatars insert" on storage.objects for insert
  with check (
    bucket_id = 'public-avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Public avatars update" on storage.objects for update
  using (
    bucket_id = 'public-avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Receipts policies: upload to owner's folder, read for owner OR co-members of the trip containing the receipt
create policy "Receipts insert" on storage.objects for insert
  with check (
    bucket_id = 'receipts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Receipts select" on storage.objects for select
  using (
    bucket_id = 'receipts'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or exists (
        select 1 from public.expenses e
        where e.receipt_uri = storage.objects.name
          and (
            is_trip_member(e.trip_id)
            or exists (select 1 from public.trips t where t.id = e.trip_id and t.created_by_id = auth.uid())
          )
      )
    )
  );
