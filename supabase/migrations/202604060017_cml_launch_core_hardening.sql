grant update on table public.vendor_applications to authenticated;
grant update on table public.vendor_branches to authenticated;

drop policy if exists vendor_applications_update_own_rejected on public.vendor_applications;
create policy vendor_applications_update_own_rejected
on public.vendor_applications
for update
to authenticated
using (
  auth.uid() = user_id
  and status = 'rejected'
)
with check (
  auth.uid() = user_id
);

drop policy if exists vendor_branches_update_own_vendor on public.vendor_branches;
create policy vendor_branches_update_own_vendor
on public.vendor_branches
for update
to authenticated
using (
  exists (
    select 1
    from public.vendors vendors
    where vendors.id = vendor_branches.vendor_id
      and vendors.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.vendors vendors
    where vendors.id = vendor_branches.vendor_id
      and vendors.owner_user_id = auth.uid()
  )
);
