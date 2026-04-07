alter table public.vendor_batches
drop constraint if exists vendor_batches_status_check;

alter table public.vendor_batches
add constraint vendor_batches_status_check
check (
  status in (
    'open',
    'locked',
    'shipped',
    'delayed',
    'customs_hold',
    'arrived',
    'ready_for_pickup',
    'out_for_last_mile_delivery'
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
    'out_for_last_mile_delivery',
    'customs_hold',
    'delayed',
    'collected',
    'returned',
    'cancelled'
  )
);
