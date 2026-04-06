create extension if not exists pgcrypto;

create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  legacy_base44_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  supabase_auth_user_id uuid unique,
  email text not null unique,
  full_name text,
  user_type text not null default 'carrymatch',
  vendor_legacy_base44_id text,
  bus_operator_role text,
  bio text,
  location text,
  phone text,
  profile_picture_url text,
  travel_preferences jsonb not null default '[]'::jsonb,
  languages_spoken jsonb not null default '[]'::jsonb,
  additional_roles jsonb not null default '[]'::jsonb,
  role_permissions jsonb not null default '{}'::jsonb,
  is_verified boolean not null default false,
  is_featured boolean not null default false,
  trust_score numeric(5,2) not null default 50,
  average_rating numeric(5,2) not null default 0,
  total_reviews integer not null default 0,
  total_trips integer not null default 0,
  total_shipments integer not null default 0,
  verification_status text not null default 'none',
  verification_document_type text,
  verification_document_uri text,
  verification_documents jsonb not null default '[]'::jsonb,
  verification_submitted_date timestamptz,
  verification_approved_date timestamptz,
  verification_rejection_reason text,
  is_restricted boolean not null default false,
  restriction_reason text,
  flags_count integer not null default 0,
  is_online boolean not null default false,
  last_seen timestamptz,
  raw_legacy_payload jsonb not null default '{}'::jsonb
);

create table if not exists public.bus_operators (
  id uuid primary key default gen_random_uuid(),
  legacy_base44_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  legal_name text,
  phone text not null,
  email text not null,
  logo_url text,
  hq_city text,
  main_station_name text,
  status text not null default 'pending',
  public_slug text,
  payout_method text,
  payout_details_encrypted text,
  manifest_template_settings_json jsonb not null default '{}'::jsonb,
  verification_status text not null default 'unverified',
  verification_date timestamptz,
  created_by_email text,
  created_by_user_profile_id uuid,
  raw_legacy_payload jsonb not null default '{}'::jsonb
);

create table if not exists public.operator_branches (
  id uuid primary key default gen_random_uuid(),
  legacy_base44_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  operator_id uuid not null,
  branch_name text not null,
  city text not null,
  address_text text,
  contact_phone text,
  is_primary boolean not null default false,
  raw_legacy_payload jsonb not null default '{}'::jsonb
);

create table if not exists public.bus_routes (
  id uuid primary key default gen_random_uuid(),
  legacy_base44_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  operator_id uuid not null,
  origin_city text not null,
  destination_city text not null,
  route_status text not null default 'active',
  notes text,
  raw_legacy_payload jsonb not null default '{}'::jsonb
);

create table if not exists public.seat_map_templates (
  id uuid primary key default gen_random_uuid(),
  legacy_base44_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  operator_id uuid not null,
  template_name text not null,
  layout_json jsonb not null,
  default_seat_class_rules_json jsonb not null default '{}'::jsonb,
  raw_legacy_payload jsonb not null default '{}'::jsonb
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  legacy_base44_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  operator_id uuid not null,
  nickname text not null,
  plate_number text,
  seat_map_template_id uuid,
  amenities_json jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  raw_legacy_payload jsonb not null default '{}'::jsonb
);

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  legacy_base44_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  trip_kind text not null default 'traveler_listing' check (trip_kind in ('traveler_listing', 'bus_service')),
  from_city text,
  from_country text,
  from_iata text,
  to_city text,
  to_country text,
  to_iata text,
  departure_date date,
  arrival_date date,
  available_weight_kg numeric(10,2),
  price_per_kg numeric(10,2),
  status text,
  traveler_name text,
  traveler_phone text,
  traveler_email text,
  additional_info text,
  description text,
  is_recommended boolean not null default false,
  date_flexible boolean not null default false,
  flexible_date_range text,
  delivery_services jsonb not null default '["airport-to-airport"]'::jsonb,
  can_pickup_from_address boolean not null default false,
  can_deliver_to_address boolean not null default false,
  preferred_routes jsonb not null default '[]'::jsonb,
  availability_notes text,
  operator_id uuid,
  route_id uuid,
  vehicle_id uuid,
  driver_legacy_base44_id text,
  departure_datetime timestamptz,
  arrival_estimate_datetime timestamptz,
  departure_branch_id uuid,
  arrival_branch_text text,
  base_price_xaf numeric(12,2),
  trip_status text,
  sales_channels_enabled_json jsonb not null default '{}'::jsonb,
  online_seat_pool_rule text,
  emergency_mode_enabled boolean not null default false,
  emergency_mode_reason text,
  created_by_email text,
  raw_legacy_payload jsonb not null default '{}'::jsonb
);

create table if not exists public.trip_seat_inventory (
  id uuid primary key default gen_random_uuid(),
  legacy_base44_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  trip_id uuid not null,
  seat_code text not null,
  seat_class text not null default 'standard' check (seat_class in ('standard', 'vip')),
  seat_status text not null default 'available' check (
    seat_status in (
      'available',
      'held',
      'sold_online',
      'sold_offline',
      'blocked',
      'released_for_walkin',
      'canceled'
    )
  ),
  price_xaf numeric(12,2) not null,
  held_until timestamptz,
  held_by_order_id text,
  sold_by_branch_id uuid,
  released_at timestamptz,
  released_by_user_profile_id uuid,
  released_by_user_email text,
  release_reason text,
  raw_legacy_payload jsonb not null default '{}'::jsonb
);

create table if not exists public.operator_staff (
  id uuid primary key default gen_random_uuid(),
  legacy_base44_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  operator_id uuid not null,
  user_profile_id uuid,
  user_email text not null,
  staff_role text not null,
  status text not null default 'active',
  pin_hash text,
  allowed_branches_json jsonb not null default '[]'::jsonb,
  can_refund boolean not null default false,
  can_override_seat_block boolean not null default false,
  raw_legacy_payload jsonb not null default '{}'::jsonb
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  legacy_base44_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  buyer_user_profile_id uuid,
  buyer_email text not null,
  trip_id uuid not null,
  operator_id uuid not null,
  passenger_name text not null,
  passenger_phone text not null,
  passenger_id_optional text,
  channel text not null default 'online',
  order_status text not null default 'reserved',
  amount_xaf numeric(12,2) not null,
  fee_xaf numeric(12,2) not null default 0,
  net_to_operator_xaf numeric(12,2),
  payment_provider text,
  payment_reference text,
  paid_at timestamptz,
  expires_at timestamptz,
  cancellation_reason text,
  canceled_at timestamptz,
  refunded_at timestamptz,
  raw_legacy_payload jsonb not null default '{}'::jsonb
);

create table if not exists public.order_seats (
  id uuid primary key default gen_random_uuid(),
  legacy_base44_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  order_id uuid not null,
  trip_id uuid not null,
  seat_code text not null,
  seat_price_xaf numeric(12,2) not null,
  raw_legacy_payload jsonb not null default '{}'::jsonb
);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  legacy_base44_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  order_id uuid not null,
  ticket_code text not null,
  qr_payload text,
  checkin_status text not null default 'not_checked_in' check (checkin_status in ('not_checked_in', 'checked_in')),
  checkin_time timestamptz,
  checked_in_by_user_profile_id uuid,
  checked_in_by_user_email text,
  seat_code_snapshot text,
  raw_legacy_payload jsonb not null default '{}'::jsonb
);
