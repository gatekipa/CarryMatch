alter table public.vendor_shipments
add column if not exists destination_branch_id uuid references public.vendor_branches(id) on delete set null;

create index if not exists vendor_shipments_vendor_id_destination_branch_id_idx
  on public.vendor_shipments(vendor_id, destination_branch_id);
