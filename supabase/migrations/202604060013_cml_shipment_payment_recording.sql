alter table public.vendor_shipments
add column if not exists amount_paid numeric(12,2);

alter table public.vendor_shipments
add column if not exists payment_method text;

alter table public.vendor_shipments
add column if not exists payment_note text;

update public.vendor_shipments
set payment_method = lower(trim(payment_method))
where payment_method is not null;

update public.vendor_shipments
set amount_paid = case
  when payment_status = 'paid' then coalesce(total_price, 0)
  else 0
end
where amount_paid is null;

update public.vendor_shipments
set amount_paid = greatest(least(amount_paid, coalesce(total_price, 0)), 0)
where amount_paid is not null;

alter table public.vendor_shipments
alter column amount_paid set default 0;

alter table public.vendor_shipments
alter column amount_paid set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'vendor_shipments_amount_paid_check'
  ) then
    alter table public.vendor_shipments
    add constraint vendor_shipments_amount_paid_check
    check (amount_paid >= 0 and amount_paid <= total_price);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'vendor_shipments_payment_method_check'
  ) then
    alter table public.vendor_shipments
    add constraint vendor_shipments_payment_method_check
    check (
      payment_method is null
      or payment_method in ('cash', 'zelle', 'cashapp', 'mobile_money', 'card', 'other')
    );
  end if;
end
$$;
