create extension if not exists pgcrypto;

create or replace function public.set_row_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.vendor_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  company_name text not null,
  phone text not null,
  whatsapp_number text,
  business_type text not null,
  monthly_volume text,
  corridors jsonb not null default '[]'::jsonb,
  office_addresses jsonb not null default '[]'::jsonb,
  notes text,
  preferred_language text not null default 'en' check (preferred_language in ('en', 'fr')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  reviewed_at timestamptz,
  approved_at timestamptz
);

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  owner_user_id uuid not null unique references auth.users(id) on delete cascade,
  application_id uuid references public.vendor_applications(id) on delete set null,
  company_name text not null,
  vendor_prefix text not null unique,
  default_origin_country text not null,
  default_origin_city text not null,
  pricing_model text not null check (pricing_model in ('per_kg', 'flat_fee', 'manual')),
  insurance_model text not null check (insurance_model in ('percentage', 'flat')),
  plan_tier text not null default 'free' check (plan_tier in ('free', 'pro')),
  status text not null default 'setup_required' check (status in ('setup_required', 'active', 'suspended')),
  setup_completed_at timestamptz,
  preferred_language text not null default 'en' check (preferred_language in ('en', 'fr'))
);

create table if not exists public.vendor_staff (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'owner' check (role in ('owner', 'admin', 'staff')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  constraint vendor_staff_vendor_user_unique unique (vendor_id, user_id)
);

create table if not exists public.vendor_branches (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  branch_name text not null,
  side text not null default 'destination' check (side in ('origin', 'destination')),
  address_text text
);

create index if not exists vendor_applications_user_id_idx on public.vendor_applications(user_id);
create index if not exists vendor_applications_status_idx on public.vendor_applications(status);
create index if not exists vendors_owner_user_id_idx on public.vendors(owner_user_id);
create index if not exists vendors_status_idx on public.vendors(status);
create index if not exists vendor_staff_vendor_id_idx on public.vendor_staff(vendor_id);
create index if not exists vendor_branches_vendor_id_idx on public.vendor_branches(vendor_id);

drop trigger if exists set_vendor_applications_updated_at on public.vendor_applications;
create trigger set_vendor_applications_updated_at
before update on public.vendor_applications
for each row
execute function public.set_row_updated_at();

drop trigger if exists set_vendors_updated_at on public.vendors;
create trigger set_vendors_updated_at
before update on public.vendors
for each row
execute function public.set_row_updated_at();

drop trigger if exists set_vendor_staff_updated_at on public.vendor_staff;
create trigger set_vendor_staff_updated_at
before update on public.vendor_staff
for each row
execute function public.set_row_updated_at();

drop trigger if exists set_vendor_branches_updated_at on public.vendor_branches;
create trigger set_vendor_branches_updated_at
before update on public.vendor_branches
for each row
execute function public.set_row_updated_at();

alter table public.vendor_applications enable row level security;
alter table public.vendors enable row level security;
alter table public.vendor_staff enable row level security;
alter table public.vendor_branches enable row level security;

revoke all on table public.vendor_applications from anon;
revoke all on table public.vendor_applications from authenticated;
revoke all on table public.vendors from anon;
revoke all on table public.vendors from authenticated;
revoke all on table public.vendor_staff from anon;
revoke all on table public.vendor_staff from authenticated;
revoke all on table public.vendor_branches from anon;
revoke all on table public.vendor_branches from authenticated;

grant select, insert on table public.vendor_applications to authenticated;
grant select, insert, update on table public.vendors to authenticated;
grant select, insert, update on table public.vendor_staff to authenticated;
grant select, insert, delete on table public.vendor_branches to authenticated;

drop policy if exists vendor_applications_select_own on public.vendor_applications;
create policy vendor_applications_select_own
on public.vendor_applications
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists vendor_applications_insert_own on public.vendor_applications;
create policy vendor_applications_insert_own
on public.vendor_applications
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists vendors_select_own on public.vendors;
create policy vendors_select_own
on public.vendors
for select
to authenticated
using (auth.uid() = owner_user_id);

drop policy if exists vendors_insert_own_approved on public.vendors;
create policy vendors_insert_own_approved
on public.vendors
for insert
to authenticated
with check (
  auth.uid() = owner_user_id
  and exists (
    select 1
    from public.vendor_applications applications
    where applications.user_id = auth.uid()
      and applications.status = 'approved'
  )
);

drop policy if exists vendors_update_own on public.vendors;
create policy vendors_update_own
on public.vendors
for update
to authenticated
using (auth.uid() = owner_user_id)
with check (auth.uid() = owner_user_id);

drop policy if exists vendor_staff_select_own_vendor on public.vendor_staff;
create policy vendor_staff_select_own_vendor
on public.vendor_staff
for select
to authenticated
using (
  exists (
    select 1
    from public.vendors vendors
    where vendors.id = vendor_staff.vendor_id
      and vendors.owner_user_id = auth.uid()
  )
);

drop policy if exists vendor_staff_insert_own_vendor on public.vendor_staff;
create policy vendor_staff_insert_own_vendor
on public.vendor_staff
for insert
to authenticated
with check (
  exists (
    select 1
    from public.vendors vendors
    where vendors.id = vendor_staff.vendor_id
      and vendors.owner_user_id = auth.uid()
  )
);

drop policy if exists vendor_staff_update_own_vendor on public.vendor_staff;
create policy vendor_staff_update_own_vendor
on public.vendor_staff
for update
to authenticated
using (
  exists (
    select 1
    from public.vendors vendors
    where vendors.id = vendor_staff.vendor_id
      and vendors.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.vendors vendors
    where vendors.id = vendor_staff.vendor_id
      and vendors.owner_user_id = auth.uid()
  )
);

drop policy if exists vendor_branches_select_own_vendor on public.vendor_branches;
create policy vendor_branches_select_own_vendor
on public.vendor_branches
for select
to authenticated
using (
  exists (
    select 1
    from public.vendors vendors
    where vendors.id = vendor_branches.vendor_id
      and vendors.owner_user_id = auth.uid()
  )
);

drop policy if exists vendor_branches_insert_own_vendor on public.vendor_branches;
create policy vendor_branches_insert_own_vendor
on public.vendor_branches
for insert
to authenticated
with check (
  exists (
    select 1
    from public.vendors vendors
    where vendors.id = vendor_branches.vendor_id
      and vendors.owner_user_id = auth.uid()
  )
);

drop policy if exists vendor_branches_delete_own_vendor on public.vendor_branches;
create policy vendor_branches_delete_own_vendor
on public.vendor_branches
for delete
to authenticated
using (
  exists (
    select 1
    from public.vendors vendors
    where vendors.id = vendor_branches.vendor_id
      and vendors.owner_user_id = auth.uid()
  )
);
