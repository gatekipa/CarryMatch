create table if not exists public.vendor_shipment_status_history (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  shipment_id uuid not null references public.vendor_shipments(id) on delete cascade,
  batch_id uuid references public.vendor_batches(id) on delete set null,
  status text not null check (
    status in (
      'draft',
      'pending',
      'in_batch',
      'in_transit',
      'arrived',
      'ready_for_pickup',
      'out_for_last_mile_delivery',
      'customs_hold',
      'delayed',
      'collected',
      'returned',
      'cancelled'
    )
  ),
  event_kind text not null default 'status_change' check (
    event_kind in ('created', 'status_change', 'batch_linked', 'batch_unlinked')
  )
);

create index if not exists vendor_shipment_status_history_vendor_id_idx
  on public.vendor_shipment_status_history(vendor_id);

create index if not exists vendor_shipment_status_history_shipment_created_idx
  on public.vendor_shipment_status_history(shipment_id, created_at desc);

create index if not exists vendor_shipment_status_history_vendor_shipment_created_idx
  on public.vendor_shipment_status_history(vendor_id, shipment_id, created_at desc);

alter table public.vendor_shipment_status_history enable row level security;

revoke all on table public.vendor_shipment_status_history from anon;
revoke all on table public.vendor_shipment_status_history from authenticated;

grant select, insert on table public.vendor_shipment_status_history to authenticated;

drop policy if exists vendor_shipment_status_history_select_own_vendor on public.vendor_shipment_status_history;
create policy vendor_shipment_status_history_select_own_vendor
on public.vendor_shipment_status_history
for select
to authenticated
using (
  exists (
    select 1
    from public.vendors vendors
    where vendors.id = vendor_shipment_status_history.vendor_id
      and vendors.owner_user_id = auth.uid()
  )
);

drop policy if exists vendor_shipment_status_history_insert_own_vendor on public.vendor_shipment_status_history;
create policy vendor_shipment_status_history_insert_own_vendor
on public.vendor_shipment_status_history
for insert
to authenticated
with check (
  exists (
    select 1
    from public.vendors vendors
    where vendors.id = vendor_shipment_status_history.vendor_id
      and vendors.owner_user_id = auth.uid()
  )
);
