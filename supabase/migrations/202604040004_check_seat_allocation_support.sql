create table if not exists public.seat_allocation_rules (
  id uuid primary key default gen_random_uuid(),
  legacy_base44_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  operator_id uuid not null,
  trip_id uuid,
  route_template_legacy_base44_id text,
  vehicle_id uuid,
  allocation_scope text not null check (allocation_scope in ('trip', 'service', 'route_template')),
  allow_rebalance boolean not null default true,
  raw_legacy_payload jsonb not null default '{}'::jsonb
);

create table if not exists public.seat_allocations (
  id uuid primary key default gen_random_uuid(),
  legacy_base44_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  seat_allocation_rule_id uuid not null,
  branch_id uuid,
  channel text not null check (channel in ('online', 'branch')),
  allocated_seats_count integer not null,
  locked boolean not null default false,
  raw_legacy_payload jsonb not null default '{}'::jsonb
);

alter table public.seat_allocation_rules
  add constraint seat_allocation_rules_operator_id_fkey
  foreign key (operator_id)
  references public.bus_operators (id)
  on delete cascade,
  add constraint seat_allocation_rules_trip_id_fkey
  foreign key (trip_id)
  references public.trips (id)
  on delete cascade,
  add constraint seat_allocation_rules_vehicle_id_fkey
  foreign key (vehicle_id)
  references public.vehicles (id)
  on delete set null;

alter table public.seat_allocations
  add constraint seat_allocations_seat_allocation_rule_id_fkey
  foreign key (seat_allocation_rule_id)
  references public.seat_allocation_rules (id)
  on delete cascade,
  add constraint seat_allocations_branch_id_fkey
  foreign key (branch_id)
  references public.operator_branches (id)
  on delete set null;

create unique index if not exists seat_allocation_rules_trip_scope_key
  on public.seat_allocation_rules (trip_id)
  where allocation_scope = 'trip' and trip_id is not null;

create unique index if not exists seat_allocation_rules_scope_route_template_legacy_key
  on public.seat_allocation_rules (allocation_scope, route_template_legacy_base44_id)
  where route_template_legacy_base44_id is not null
    and allocation_scope in ('service', 'route_template');

create unique index if not exists seat_allocations_online_rule_key
  on public.seat_allocations (seat_allocation_rule_id)
  where channel = 'online' and branch_id is null;

create unique index if not exists seat_allocations_branch_rule_branch_key
  on public.seat_allocations (seat_allocation_rule_id, branch_id)
  where channel = 'branch' and branch_id is not null;

create index if not exists seat_allocation_rules_operator_id_idx
  on public.seat_allocation_rules (operator_id);

create index if not exists seat_allocation_rules_trip_id_idx
  on public.seat_allocation_rules (trip_id);

create index if not exists seat_allocation_rules_allocation_scope_trip_id_idx
  on public.seat_allocation_rules (allocation_scope, trip_id);

create index if not exists seat_allocation_rules_allocation_scope_route_template_legacy_idx
  on public.seat_allocation_rules (allocation_scope, route_template_legacy_base44_id);

create index if not exists seat_allocation_rules_vehicle_id_idx
  on public.seat_allocation_rules (vehicle_id);

create index if not exists seat_allocations_seat_allocation_rule_id_idx
  on public.seat_allocations (seat_allocation_rule_id);

create index if not exists seat_allocations_branch_id_idx
  on public.seat_allocations (branch_id);

create index if not exists seat_allocations_channel_branch_id_idx
  on public.seat_allocations (channel, branch_id);

alter table public.seat_allocation_rules enable row level security;
alter table public.seat_allocations enable row level security;

revoke all on table public.seat_allocation_rules from anon, authenticated;
revoke all on table public.seat_allocations from anon, authenticated;

drop policy if exists service_role_all_seat_allocation_rules on public.seat_allocation_rules;
create policy service_role_all_seat_allocation_rules
  on public.seat_allocation_rules
  as permissive
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists service_role_all_seat_allocations on public.seat_allocations;
create policy service_role_all_seat_allocations
  on public.seat_allocations
  as permissive
  for all
  to service_role
  using (true)
  with check (true);
