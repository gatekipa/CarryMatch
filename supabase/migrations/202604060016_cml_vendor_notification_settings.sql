alter table public.vendors
add column if not exists notifications_enabled boolean;

alter table public.vendors
add column if not exists notification_default_channel text;

update public.vendors
set notifications_enabled = true
where notifications_enabled is null;

update public.vendors
set notification_default_channel = lower(trim(notification_default_channel))
where notification_default_channel is not null;

update public.vendors
set notification_default_channel = 'whatsapp'
where notification_default_channel is null or trim(notification_default_channel) = '';

alter table public.vendors
alter column notifications_enabled set default true;

alter table public.vendors
alter column notifications_enabled set not null;

alter table public.vendors
alter column notification_default_channel set default 'whatsapp';

alter table public.vendors
alter column notification_default_channel set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'vendors_notification_default_channel_check'
  ) then
    alter table public.vendors
    add constraint vendors_notification_default_channel_check
    check (notification_default_channel in ('whatsapp', 'email'));
  end if;
end
$$;
