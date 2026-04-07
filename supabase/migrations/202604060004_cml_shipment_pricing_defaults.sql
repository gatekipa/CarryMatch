alter table public.vendors
add column if not exists rate_per_kg numeric(12,2);

alter table public.vendors
add column if not exists flat_fee_per_item numeric(12,2);

alter table public.vendors
add column if not exists default_currency text;

update public.vendors
set default_currency = upper(trim(default_currency))
where default_currency is not null;

update public.vendors
set default_currency = 'USD'
where default_currency is null or trim(default_currency) = '';

alter table public.vendors
alter column default_currency set default 'USD';

alter table public.vendors
alter column default_currency set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'vendors_default_currency_check'
  ) then
    alter table public.vendors
    add constraint vendors_default_currency_check
    check (default_currency ~ '^[A-Z]{3}$');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'vendors_rate_per_kg_check'
  ) then
    alter table public.vendors
    add constraint vendors_rate_per_kg_check
    check (rate_per_kg is null or rate_per_kg >= 0);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'vendors_flat_fee_per_item_check'
  ) then
    alter table public.vendors
    add constraint vendors_flat_fee_per_item_check
    check (flat_fee_per_item is null or flat_fee_per_item >= 0);
  end if;
end
$$;

alter table public.vendor_shipments
add column if not exists currency_code text;

alter table public.vendor_shipments
add column if not exists discount_amount numeric(12,2);

alter table public.vendor_shipments
add column if not exists total_price numeric(12,2);

update public.vendor_shipments
set currency_code = upper(trim(currency_code))
where currency_code is not null;

update public.vendor_shipments
set currency_code = 'USD'
where currency_code is null or trim(currency_code) = '';

update public.vendor_shipments
set discount_amount = 0
where discount_amount is null;

update public.vendor_shipments
set total_price = greatest(base_price - coalesce(discount_amount, 0), 0)
where total_price is null;

alter table public.vendor_shipments
alter column currency_code set default 'USD';

alter table public.vendor_shipments
alter column currency_code set not null;

alter table public.vendor_shipments
alter column discount_amount set default 0;

alter table public.vendor_shipments
alter column discount_amount set not null;

alter table public.vendor_shipments
alter column total_price set default 0;

alter table public.vendor_shipments
alter column total_price set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'vendor_shipments_currency_code_check'
  ) then
    alter table public.vendor_shipments
    add constraint vendor_shipments_currency_code_check
    check (currency_code ~ '^[A-Z]{3}$');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'vendor_shipments_discount_amount_check'
  ) then
    alter table public.vendor_shipments
    add constraint vendor_shipments_discount_amount_check
    check (discount_amount >= 0);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'vendor_shipments_total_price_check'
  ) then
    alter table public.vendor_shipments
    add constraint vendor_shipments_total_price_check
    check (total_price >= 0);
  end if;
end
$$;

create index if not exists vendor_shipments_vendor_currency_idx
on public.vendor_shipments(vendor_id, currency_code);
