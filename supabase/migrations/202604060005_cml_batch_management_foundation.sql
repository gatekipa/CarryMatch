create table if not exists public.vendor_batches (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  batch_name text not null,
  eta_at timestamptz,
  status text not null default 'open' check (
    status in ('open', 'locked', 'shipped', 'delayed', 'customs_hold', 'arrived', 'ready_for_pickup')
  )
);

create index if not exists vendor_batches_vendor_id_idx
  on public.vendor_batches(vendor_id);

create index if not exists vendor_batches_vendor_id_status_idx
  on public.vendor_batches(vendor_id, status);

create index if not exists vendor_batches_vendor_id_created_at_idx
  on public.vendor_batches(vendor_id, created_at desc);

drop trigger if exists set_vendor_batches_updated_at on public.vendor_batches;
create trigger set_vendor_batches_updated_at
before update on public.vendor_batches
for each row
execute function public.set_row_updated_at();

alter table public.vendor_batches enable row level security;

revoke all on table public.vendor_batches from anon;
revoke all on table public.vendor_batches from authenticated;

grant select, insert, update on table public.vendor_batches to authenticated;

drop policy if exists vendor_batches_select_own_vendor on public.vendor_batches;
create policy vendor_batches_select_own_vendor
on public.vendor_batches
for select
to authenticated
using (
  exists (
    select 1
    from public.vendors vendors
    where vendors.id = vendor_batches.vendor_id
      and vendors.owner_user_id = auth.uid()
  )
);

drop policy if exists vendor_batches_insert_own_vendor on public.vendor_batches;
create policy vendor_batches_insert_own_vendor
on public.vendor_batches
for insert
to authenticated
with check (
  exists (
    select 1
    from public.vendors vendors
    where vendors.id = vendor_batches.vendor_id
      and vendors.owner_user_id = auth.uid()
  )
);

drop policy if exists vendor_batches_update_own_vendor on public.vendor_batches;
create policy vendor_batches_update_own_vendor
on public.vendor_batches
for update
to authenticated
using (
  exists (
    select 1
    from public.vendors vendors
    where vendors.id = vendor_batches.vendor_id
      and vendors.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.vendors vendors
    where vendors.id = vendor_batches.vendor_id
      and vendors.owner_user_id = auth.uid()
  )
);

alter table public.vendor_shipments
add column if not exists batch_id uuid references public.vendor_batches(id) on delete set null;

create index if not exists vendor_shipments_batch_id_idx
  on public.vendor_shipments(batch_id);

create index if not exists vendor_shipments_vendor_id_batch_id_idx
  on public.vendor_shipments(vendor_id, batch_id);

grant update on table public.vendor_shipments to authenticated;

drop policy if exists vendor_shipments_update_own_vendor on public.vendor_shipments;
create policy vendor_shipments_update_own_vendor
on public.vendor_shipments
for update
to authenticated
using (
  exists (
    select 1
    from public.vendors vendors
    where vendors.id = vendor_shipments.vendor_id
      and vendors.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.vendors vendors
    where vendors.id = vendor_shipments.vendor_id
      and vendors.owner_user_id = auth.uid()
  )
);

alter table public.vendor_shipments
drop constraint if exists vendor_shipments_status_check;

alter table public.vendor_shipments
add constraint vendor_shipments_status_check
check (
  status in (
    'draft',
    'pending',
    'in_batch',
    'in_transit',
    'arrived',
    'ready_for_pickup',
    'customs_hold',
    'delayed',
    'collected',
    'returned',
    'cancelled'
  )
);
