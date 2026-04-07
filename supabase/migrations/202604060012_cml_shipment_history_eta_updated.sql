alter table public.vendor_shipment_status_history
drop constraint if exists vendor_shipment_status_history_event_kind_check;

alter table public.vendor_shipment_status_history
add constraint vendor_shipment_status_history_event_kind_check
check (
  event_kind in ('created', 'status_change', 'batch_linked', 'batch_unlinked', 'eta_updated')
);
