alter table public.vendor_branches
add column if not exists country_code text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'vendor_branches_country_code_check'
  ) then
    alter table public.vendor_branches
    add constraint vendor_branches_country_code_check
    check (country_code is null or country_code ~ '^[A-Z]{2}$');
  end if;
end
$$;

create index if not exists vendor_branches_vendor_country_idx
on public.vendor_branches(vendor_id, country_code);
