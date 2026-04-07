create table if not exists public.vendor_customers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  full_name text not null,
  phone text not null,
  whatsapp_number text,
  email text,
  last_role text not null default 'sender' check (last_role in ('sender', 'receiver', 'both')),
  constraint vendor_customers_vendor_id_phone_key unique (vendor_id, phone)
);

create table if not exists public.vendor_shipments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  tracking_number text not null unique,
  sender_customer_id uuid references public.vendor_customers(id) on delete set null,
  receiver_customer_id uuid references public.vendor_customers(id) on delete set null,
  sender_name text not null,
  sender_phone text not null,
  sender_whatsapp_number text,
  sender_email text,
  receiver_name text not null,
  receiver_phone text not null,
  receiver_whatsapp_number text,
  receiver_email text,
  origin_country text not null check (origin_country ~ '^[A-Z]{2}$'),
  origin_city text not null,
  destination_country text not null check (destination_country ~ '^[A-Z]{2}$'),
  destination_city text not null,
  shipping_mode text not null check (shipping_mode in ('air', 'sea', 'road-bus')),
  contents_description text not null,
  weight_kg numeric(10,2) not null check (weight_kg > 0),
  quantity integer not null check (quantity > 0),
  category text not null,
  base_price numeric(12,2) not null check (base_price >= 0),
  payment_status text not null default 'unpaid' check (payment_status in ('paid', 'partial', 'unpaid')),
  reference_note text,
  status text not null default 'pending' check (
    status in ('draft', 'pending', 'in_batch', 'in_transit', 'arrived', 'delayed', 'collected', 'returned', 'cancelled')
  )
);

create index if not exists vendor_customers_vendor_id_idx
  on public.vendor_customers(vendor_id);

create index if not exists vendor_customers_vendor_id_phone_idx
  on public.vendor_customers(vendor_id, phone);

create index if not exists vendor_customers_vendor_id_full_name_idx
  on public.vendor_customers(vendor_id, full_name);

create index if not exists vendor_shipments_vendor_id_idx
  on public.vendor_shipments(vendor_id);

create index if not exists vendor_shipments_vendor_id_created_at_idx
  on public.vendor_shipments(vendor_id, created_at desc);

create index if not exists vendor_shipments_vendor_id_status_idx
  on public.vendor_shipments(vendor_id, status);

create index if not exists vendor_shipments_sender_phone_idx
  on public.vendor_shipments(sender_phone);

create index if not exists vendor_shipments_receiver_phone_idx
  on public.vendor_shipments(receiver_phone);

drop trigger if exists set_vendor_customers_updated_at on public.vendor_customers;
create trigger set_vendor_customers_updated_at
before update on public.vendor_customers
for each row
execute function public.set_row_updated_at();

drop trigger if exists set_vendor_shipments_updated_at on public.vendor_shipments;
create trigger set_vendor_shipments_updated_at
before update on public.vendor_shipments
for each row
execute function public.set_row_updated_at();

alter table public.vendor_customers enable row level security;
alter table public.vendor_shipments enable row level security;

revoke all on table public.vendor_customers from anon;
revoke all on table public.vendor_customers from authenticated;
revoke all on table public.vendor_shipments from anon;
revoke all on table public.vendor_shipments from authenticated;

grant select, insert, update on table public.vendor_customers to authenticated;
grant select, insert on table public.vendor_shipments to authenticated;

drop policy if exists vendor_customers_select_own_vendor on public.vendor_customers;
create policy vendor_customers_select_own_vendor
on public.vendor_customers
for select
to authenticated
using (
  exists (
    select 1
    from public.vendors vendors
    where vendors.id = vendor_customers.vendor_id
      and vendors.owner_user_id = auth.uid()
  )
);

drop policy if exists vendor_customers_insert_own_vendor on public.vendor_customers;
create policy vendor_customers_insert_own_vendor
on public.vendor_customers
for insert
to authenticated
with check (
  exists (
    select 1
    from public.vendors vendors
    where vendors.id = vendor_customers.vendor_id
      and vendors.owner_user_id = auth.uid()
  )
);

drop policy if exists vendor_customers_update_own_vendor on public.vendor_customers;
create policy vendor_customers_update_own_vendor
on public.vendor_customers
for update
to authenticated
using (
  exists (
    select 1
    from public.vendors vendors
    where vendors.id = vendor_customers.vendor_id
      and vendors.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.vendors vendors
    where vendors.id = vendor_customers.vendor_id
      and vendors.owner_user_id = auth.uid()
  )
);

drop policy if exists vendor_shipments_select_own_vendor on public.vendor_shipments;
create policy vendor_shipments_select_own_vendor
on public.vendor_shipments
for select
to authenticated
using (
  exists (
    select 1
    from public.vendors vendors
    where vendors.id = vendor_shipments.vendor_id
      and vendors.owner_user_id = auth.uid()
  )
);

drop policy if exists vendor_shipments_insert_own_vendor on public.vendor_shipments;
create policy vendor_shipments_insert_own_vendor
on public.vendor_shipments
for insert
to authenticated
with check (
  exists (
    select 1
    from public.vendors vendors
    where vendors.id = vendor_shipments.vendor_id
      and vendors.owner_user_id = auth.uid()
  )
);
