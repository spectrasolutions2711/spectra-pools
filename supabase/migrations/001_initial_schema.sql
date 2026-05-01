-- ============================================================
-- SPECTRA POOL — Initial Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
create type user_role as enum ('admin', 'technician', 'client');
create type area_type as enum ('POOL', 'SPA', 'TANK');
create type reading_section as enum ('TEST', 'HEATER');
create type visit_status as enum ('pending', 'in_progress', 'completed', 'skipped');
create type work_order_priority as enum ('low', 'medium', 'high', 'urgent');
create type work_order_status as enum ('pending', 'in_progress', 'completed');
create type invoice_status as enum ('draft', 'sent', 'paid', 'overdue');

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  role         user_role not null default 'technician',
  first_name   text,
  last_name    text,
  phone        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, role)
  values (new.id, 'technician');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- CLIENTS
-- ============================================================
create table clients (
  id               uuid primary key default uuid_generate_v4(),
  name             text not null,
  contact_name     text,
  contact_email    text,
  contact_phone    text,
  billing_address  text,
  notes            text,
  active           boolean not null default true,
  created_at       timestamptz not null default now()
);

-- ============================================================
-- CLIENT LOCATIONS
-- ============================================================
create table client_locations (
  id               uuid primary key default uuid_generate_v4(),
  client_id        uuid not null references clients(id) on delete cascade,
  name             text not null,
  address          text not null,
  city             text not null,
  state            text not null,
  zip              text,
  contact_name     text,
  contact_email    text,
  contact_phone    text,
  latitude         decimal(10,7),
  longitude        decimal(10,7),
  service_days     text[],
  notes            text,
  active           boolean not null default true,
  created_at       timestamptz not null default now()
);

-- ============================================================
-- POOL AREAS (POOL / SPA / TANK per location)
-- ============================================================
create table pool_areas (
  id           uuid primary key default uuid_generate_v4(),
  location_id  uuid not null references client_locations(id) on delete cascade,
  area_type    area_type not null,
  name         text not null,
  gallons      integer,
  filter_type  text,
  system_type  text,
  has_heater   boolean not null default false,
  notes        text,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- POOL TARGET PARAMETERS
-- ============================================================
create table pool_target_params (
  id            uuid primary key default uuid_generate_v4(),
  area_id       uuid not null references pool_areas(id) on delete cascade,
  param_name    text not null,
  min_value     decimal,
  max_value     decimal,
  target_value  decimal,
  unit          text,
  unique(area_id, param_name)
);

-- ============================================================
-- TECHNICIANS
-- ============================================================
create table technicians (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade unique,
  license_number  text,
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- CLIENT USERS
-- ============================================================
create table client_users (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade unique,
  client_id  uuid not null references clients(id) on delete cascade,
  role       text not null default 'viewer',
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ROUTES
-- ============================================================
create table routes (
  id             uuid primary key default uuid_generate_v4(),
  technician_id  uuid references technicians(id) on delete set null,
  name           text not null,
  day_of_week    text[],
  active         boolean not null default true,
  created_at     timestamptz not null default now()
);

create table route_stops (
  id                         uuid primary key default uuid_generate_v4(),
  route_id                   uuid not null references routes(id) on delete cascade,
  location_id                uuid not null references client_locations(id) on delete cascade,
  stop_order                 integer not null,
  estimated_service_minutes  integer default 30,
  unique(route_id, stop_order)
);

-- ============================================================
-- SERVICE VISITS
-- ============================================================
create table service_visits (
  id                  uuid primary key default uuid_generate_v4(),
  location_id         uuid not null references client_locations(id),
  technician_id       uuid not null references technicians(id),
  visit_date          date not null,
  checkin_time        timestamptz,
  checkout_time       timestamptz,
  duration_minutes    integer,
  status              visit_status not null default 'pending',
  service_email_sent  boolean not null default false,
  synced              boolean not null default true,
  created_at          timestamptz not null default now()
);

create table checklist_items (
  id           uuid primary key default uuid_generate_v4(),
  visit_id     uuid not null references service_visits(id) on delete cascade,
  task         text not null,
  completed    boolean not null default false,
  completed_at timestamptz
);

create table maintenance_ops (
  id         uuid primary key default uuid_generate_v4(),
  visit_id   uuid not null references service_visits(id) on delete cascade,
  operation  text not null,
  area_type  area_type,
  notes      text
);

-- ============================================================
-- WATER READINGS
-- ============================================================
create table water_readings (
  id              uuid primary key default uuid_generate_v4(),
  visit_id        uuid not null references service_visits(id) on delete cascade,
  area_id         uuid not null references pool_areas(id),
  reading_section reading_section not null,
  ph              decimal(4,2),
  orp             decimal(5,1),
  orp_setpoint    decimal(5,1),
  not_set         boolean default false,
  free_chlorine   decimal(5,2),
  total_chlorine  decimal(5,2),
  alkalinity      decimal(6,1),
  stabilizer_cya  decimal(5,1),
  total_hardness  decimal(6,1),
  phosphates      decimal(5,3),
  salt            decimal(7,1),
  temperature     decimal(4,1),
  status          text,
  lsi_value       decimal(4,2),
  recorded_at     timestamptz not null default now(),
  notes           text
);

-- ============================================================
-- PRODUCTS & INVENTORY
-- ============================================================
create table products (
  id             uuid primary key default uuid_generate_v4(),
  name           text not null,
  category       text,
  unit           text not null default 'oz',
  cost_per_unit  decimal(8,2),
  active         boolean not null default true
);

create table inventory (
  id                  uuid primary key default uuid_generate_v4(),
  product_id          uuid not null references products(id) unique,
  quantity_on_hand    decimal(10,2) not null default 0,
  low_stock_threshold decimal(10,2),
  last_updated        timestamptz not null default now()
);

create table chemical_dosages (
  id          uuid primary key default uuid_generate_v4(),
  visit_id    uuid not null references service_visits(id) on delete cascade,
  area_id     uuid references pool_areas(id),
  product_id  uuid not null references products(id),
  quantity    decimal(8,2) not null,
  unit        text not null,
  cost        decimal(8,2),
  applied_at  timestamptz not null default now()
);

-- ============================================================
-- VISIT PHOTOS, NOTES, ITEMS NEEDED
-- ============================================================
create table visit_photos (
  id            uuid primary key default uuid_generate_v4(),
  visit_id      uuid not null references service_visits(id) on delete cascade,
  storage_path  text not null,
  photo_type    text,
  caption       text,
  taken_at      timestamptz not null default now()
);

create table visit_notes (
  id         uuid primary key default uuid_generate_v4(),
  visit_id   uuid not null references service_visits(id) on delete cascade,
  note       text not null,
  created_at timestamptz not null default now()
);

create table items_needed (
  id           uuid primary key default uuid_generate_v4(),
  visit_id     uuid not null references service_visits(id) on delete cascade,
  location_id  uuid not null references client_locations(id),
  description  text not null,
  resolved     boolean not null default false,
  resolved_at  timestamptz
);

-- ============================================================
-- WORK ORDERS
-- ============================================================
create table work_orders (
  id             uuid primary key default uuid_generate_v4(),
  location_id    uuid not null references client_locations(id),
  technician_id  uuid references technicians(id),
  title          text not null,
  description    text,
  priority       work_order_priority not null default 'medium',
  status         work_order_status not null default 'pending',
  due_date       date,
  completed_at   timestamptz,
  created_at     timestamptz not null default now()
);

-- ============================================================
-- INVOICES
-- ============================================================
create table invoices (
  id             uuid primary key default uuid_generate_v4(),
  client_id      uuid not null references clients(id),
  invoice_number text not null unique,
  period_start   date not null,
  period_end     date not null,
  subtotal       decimal(10,2) not null default 0,
  tax            decimal(10,2) not null default 0,
  total          decimal(10,2) not null default 0,
  status         invoice_status not null default 'draft',
  due_date       date,
  paid_at        timestamptz,
  notes          text,
  created_at     timestamptz not null default now()
);

create table invoice_items (
  id           uuid primary key default uuid_generate_v4(),
  invoice_id   uuid not null references invoices(id) on delete cascade,
  description  text not null,
  quantity     decimal(8,2) not null,
  unit_price   decimal(8,2) not null,
  total        decimal(10,2) not null,
  item_type    text not null default 'service'
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table clients enable row level security;
alter table client_locations enable row level security;
alter table pool_areas enable row level security;
alter table pool_target_params enable row level security;
alter table technicians enable row level security;
alter table client_users enable row level security;
alter table routes enable row level security;
alter table route_stops enable row level security;
alter table service_visits enable row level security;
alter table checklist_items enable row level security;
alter table maintenance_ops enable row level security;
alter table water_readings enable row level security;
alter table products enable row level security;
alter table inventory enable row level security;
alter table chemical_dosages enable row level security;
alter table visit_photos enable row level security;
alter table visit_notes enable row level security;
alter table items_needed enable row level security;
alter table work_orders enable row level security;
alter table invoices enable row level security;
alter table invoice_items enable row level security;

-- Helper: get current user role
create or replace function get_user_role()
returns user_role language sql security definer as $$
  select role from profiles where id = auth.uid();
$$;

-- Helper: check if admin
create or replace function is_admin()
returns boolean language sql security definer as $$
  select get_user_role() = 'admin';
$$;

-- PROFILES: user sees own, admin sees all
create policy "profiles_select" on profiles for select
  using (id = auth.uid() or is_admin());
create policy "profiles_update" on profiles for update
  using (id = auth.uid() or is_admin());

-- CLIENTS: admin full access, client user reads own
create policy "clients_admin" on clients for all using (is_admin());
create policy "clients_client_select" on clients for select
  using (id in (select client_id from client_users where user_id = auth.uid()));

-- CLIENT_LOCATIONS: admin full, technician reads assigned, client reads own
create policy "locations_admin" on client_locations for all using (is_admin());
create policy "locations_technician_select" on client_locations for select
  using (
    get_user_role() = 'technician' and
    id in (
      select rs.location_id from route_stops rs
      join routes r on r.id = rs.route_id
      join technicians t on t.id = r.technician_id
      where t.user_id = auth.uid()
    )
  );
create policy "locations_client_select" on client_locations for select
  using (
    get_user_role() = 'client' and
    client_id in (select client_id from client_users where user_id = auth.uid())
  );

-- POOL_AREAS: follow location access
create policy "pool_areas_admin" on pool_areas for all using (is_admin());
create policy "pool_areas_others_select" on pool_areas for select
  using (
    location_id in (
      select id from client_locations
      where (
        get_user_role() = 'technician' and id in (
          select rs.location_id from route_stops rs
          join routes r on r.id = rs.route_id
          join technicians t on t.id = r.technician_id
          where t.user_id = auth.uid()
        )
      ) or (
        get_user_role() = 'client' and
        client_id in (select client_id from client_users where user_id = auth.uid())
      )
    )
  );

-- SERVICE VISITS: admin full, technician own, client read own
create policy "visits_admin" on service_visits for all using (is_admin());
create policy "visits_technician" on service_visits for all
  using (
    get_user_role() = 'technician' and
    technician_id in (select id from technicians where user_id = auth.uid())
  );
create policy "visits_client_select" on service_visits for select
  using (
    get_user_role() = 'client' and
    location_id in (
      select cl.id from client_locations cl
      join client_users cu on cu.client_id = cl.client_id
      where cu.user_id = auth.uid()
    )
  );

-- WATER READINGS: admin full, technician own visits, client read own
create policy "readings_admin" on water_readings for all using (is_admin());
create policy "readings_technician" on water_readings for all
  using (
    get_user_role() = 'technician' and
    visit_id in (
      select sv.id from service_visits sv
      join technicians t on t.id = sv.technician_id
      where t.user_id = auth.uid()
    )
  );
create policy "readings_client_select" on water_readings for select
  using (
    get_user_role() = 'client' and
    visit_id in (
      select sv.id from service_visits sv
      join client_locations cl on cl.id = sv.location_id
      join client_users cu on cu.client_id = cl.client_id
      where cu.user_id = auth.uid()
    )
  );

-- PRODUCTS & INVENTORY: admin full, others read
create policy "products_admin" on products for all using (is_admin());
create policy "products_others_select" on products for select using (auth.uid() is not null);
create policy "inventory_admin" on inventory for all using (is_admin());
create policy "inventory_technician_select" on inventory for select using (get_user_role() = 'technician');

-- VISIT NOTES: admin + technician (own), client NO access
create policy "notes_admin" on visit_notes for all using (is_admin());
create policy "notes_technician" on visit_notes for all
  using (
    get_user_role() = 'technician' and
    visit_id in (
      select sv.id from service_visits sv
      join technicians t on t.id = sv.technician_id
      where t.user_id = auth.uid()
    )
  );

-- INVOICES: admin full, client read own
create policy "invoices_admin" on invoices for all using (is_admin());
create policy "invoices_client_select" on invoices for select
  using (
    get_user_role() = 'client' and
    client_id in (select client_id from client_users where user_id = auth.uid())
  );

-- ============================================================
-- SEED: default products catalog
-- ============================================================
insert into products (name, category, unit, cost_per_unit) values
  ('Liquid Chlorine',    'chlorine',   'gal',  4.50),
  ('Chlorine Tabs',      'chlorine',   'lbs',  3.20),
  ('Shock',              'chlorine',   'lbs',  2.80),
  ('pH UP',              'pH',         'lbs',  1.90),
  ('pH DOWN',            'pH',         'lbs',  1.70),
  ('Alkalinity UP',      'alkalinity', 'lbs',  1.60),
  ('Alkalinity DOWN',    'alkalinity', 'lbs',  1.80),
  ('Cyanuric Acid',      'specialty',  'lbs',  3.50),
  ('Phosphates Reducer', 'specialty',  'oz',   0.45),
  ('Chlorine Reducer',   'specialty',  'oz',   0.40);
