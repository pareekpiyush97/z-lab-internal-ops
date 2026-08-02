-- TechPlus OS -- Z Labs schema (Postgres / Supabase)
--
-- Run this once against your Supabase database before starting the app:
--   1) Supabase Dashboard -> SQL Editor -> paste this file -> Run, OR
--   2) psql "$DATABASE_URL" -f db/schema.sql
--
-- Safe to re-run: every statement is idempotent (IF NOT EXISTS / OR REPLACE).

create extension if not exists pgcrypto; -- provides gen_random_uuid()

create table if not exists admin_users (
  id            uuid primary key default gen_random_uuid(),
  username      text unique not null,
  password_hash text,
  created_at    timestamptz not null default now(),
  last_login_at timestamptz
);

-- Supports "Sign in with Google" admins alongside password admins:
-- password_hash is null for Google-authenticated accounts.
alter table admin_users add column if not exists auth_provider text not null default 'password';
alter table admin_users alter column password_hash drop not null;

create table if not exists services (
  id          uuid primary key default gen_random_uuid(),
  key         text unique not null,
  title       text not null,
  tagline     text not null,
  description text not null,
  image_url   text not null,
  duration    text not null,
  warranty    text not null,
  process     jsonb not null default '[]'::jsonb,
  benefits    jsonb not null default '[]'::jsonb,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists services_sort_idx on services (sort_order);

create table if not exists gallery_items (
  id         uuid primary key default gen_random_uuid(),
  image_url  text not null,
  caption    text not null,
  wide       boolean not null default false,
  sort_order integer not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists gallery_sort_idx on gallery_items (sort_order);

create table if not exists leads (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  phone       text not null,
  service_key text,
  message     text,
  source      text not null default 'website',
  status      text not null default 'new' check (status in ('new','contacted','booked','completed','lost')),
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists leads_status_idx on leads (status);
create index if not exists leads_created_idx on leads (created_at desc);

create table if not exists business_settings (
  key   text primary key,
  value text not null
);

-- Future integration (not wired to any hardware yet): fixed single-camera
-- plate recognition. This table exists now so /api/integrations/plate-recognition
-- has somewhere durable to write once a camera/edge device is deployed --
-- see README "Roadmap" for the rollout plan. Nothing in the app reads from
-- this table yet.
create table if not exists vehicle_sightings (
  id              uuid primary key default gen_random_uuid(),
  camera_id       text not null,
  plate_number    text not null,
  confidence      real,
  image_url       text,
  captured_at     timestamptz not null,
  matched_lead_id uuid references leads(id) on delete set null,
  created_at      timestamptz not null default now()
);
create index if not exists vehicle_sightings_plate_idx on vehicle_sightings (plate_number);

-- Keep updated_at fresh automatically instead of trusting every call site.
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists services_set_updated_at on services;
create trigger services_set_updated_at before update on services
  for each row execute function set_updated_at();

drop trigger if exists leads_set_updated_at on leads;
create trigger leads_set_updated_at before update on leads
  for each row execute function set_updated_at();

-- ============================================================
-- Shop-floor operations: Jobs, Stock & Logistics, Purchases,
-- Reminders. Ported from the z-lab-internal-ops prototype
-- (localStorage-based) into real, durable Postgres tables.
-- ============================================================

-- Staff vs owner access. Staff: Jobs, Stock, Service History.
-- Owner: all of the above + Purchases, P&L, Reminders, and the
-- marketing-site admin (Leads/Services/Gallery/Settings).
alter table admin_users add column if not exists role text not null default 'owner';
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'admin_users_role_check'
  ) then
    alter table admin_users add constraint admin_users_role_check
      check (role in ('owner','staff'));
  end if;
end $$;

create sequence if not exists jobs_number_seq start 1000;

create table if not exists jobs (
  id              uuid primary key default gen_random_uuid(),
  job_number      text unique not null default ('JOB-' || lpad(nextval('jobs_number_seq')::text, 6, '0')),
  customer_name   text not null,
  phone           text not null,
  car_model       text,
  customer_plate  text,  -- entered by the customer at intake, unconfirmed
  confirmed_plate text,  -- staff-confirmed (manually, or from a future ANPR scan)
  suggested_plate text,  -- ANPR-suggested; simulated today, real once the camera integration lands
  services        jsonb not null default '[]'::jsonb,
  price           integer,
  status          text not null default 'draft' check (status in ('draft','active','completed','delivered')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists jobs_status_idx on jobs (status);
create index if not exists jobs_created_idx on jobs (created_at desc);
create index if not exists jobs_confirmed_plate_idx on jobs (confirmed_plate);
create index if not exists jobs_customer_plate_idx on jobs (customer_plate);

drop trigger if exists jobs_set_updated_at on jobs;
create trigger jobs_set_updated_at before update on jobs
  for each row execute function set_updated_at();

-- Migrate the jobs status check to include the 'completed' (Ready) step:
-- New -> Working (active) -> Ready (completed) -> Delivered.
alter table jobs drop constraint if exists jobs_status_check;
alter table jobs add constraint jobs_status_check
  check (status in ('draft','active','completed','delivered'));

create table if not exists stock_items (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  category   text not null default 'Other',
  qty        integer not null default 0,
  unit       text not null default 'pcs',
  low_at     integer not null default 3,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists stock_items_set_updated_at on stock_items;
create trigger stock_items_set_updated_at before update on stock_items
  for each row execute function set_updated_at();

-- Owner-only: what came in, how much, at what cost. Feeds the P&L cost
-- figure and bumps the matching stock_items.qty when logged.
create table if not exists stock_purchases (
  id            uuid primary key default gen_random_uuid(),
  stock_item_id uuid references stock_items(id) on delete set null,
  item_name     text not null, -- snapshot so history still reads fine if the stock item is later renamed/removed
  qty           integer not null,
  unit_cost     integer not null,
  total_cost    integer not null,
  purchased_at  timestamptz not null default now(),
  created_at    timestamptz not null default now()
);
create index if not exists stock_purchases_date_idx on stock_purchases (purchased_at desc);

-- Owner-only: low-stock alerts are computed from stock_items at read time;
-- this table is just the free-text reminders half (e.g. "Renew shop license").
create table if not exists reminders (
  id         uuid primary key default gen_random_uuid(),
  text       text not null,
  due_date   date,
  done       boolean not null default false,
  created_at timestamptz not null default now()
);

-- Note on Row Level Security: this app talks to Postgres directly with a
-- server-side connection string (never exposed to the browser), so RLS is
-- not on the request path and is left disabled here. If you later also
-- expose these tables through Supabase's auto-generated PostgREST/GraphQL
-- API or a client-side Supabase SDK, enable RLS + policies on each table
-- first -- otherwise anon/service_role API access would bypass this app's
-- own authentication entirely.
