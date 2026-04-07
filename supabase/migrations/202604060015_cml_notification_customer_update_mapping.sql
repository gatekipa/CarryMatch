alter table public.vendor_notifications
drop constraint if exists vendor_notifications_event_type_check;

alter table public.vendor_notifications
add constraint vendor_notifications_event_type_check
check (
  event_type in (
    'shipment_created',
    'batch_shipped',
    'batch_arrived',
    'ready_for_pickup',
    'delayed',
    'customs_hold',
    'out_for_last_mile_delivery',
    'collected'
  )
);

create or replace function public.enqueue_vendor_notification_records_for_shipment(
  p_vendor_id uuid,
  p_shipment_id uuid,
  p_batch_id uuid,
  p_event_type text,
  p_sender_customer_id uuid,
  p_sender_name text,
  p_sender_phone text,
  p_sender_whatsapp_number text,
  p_sender_email text,
  p_receiver_customer_id uuid,
  p_receiver_name text,
  p_receiver_phone text,
  p_receiver_whatsapp_number text,
  p_receiver_email text
)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_sender_target_phone text := coalesce(nullif(trim(p_sender_whatsapp_number), ''), nullif(trim(p_sender_phone), ''));
  v_sender_target_email text := nullif(trim(p_sender_email), '');
  v_sender_planned_channel text := case
    when coalesce(nullif(trim(p_sender_whatsapp_number), ''), nullif(trim(p_sender_phone), '')) is not null then 'whatsapp'
    when nullif(trim(p_sender_email), '') is not null then 'email'
    else 'whatsapp'
  end;
  v_receiver_target_phone text := coalesce(nullif(trim(p_receiver_whatsapp_number), ''), nullif(trim(p_receiver_phone), ''));
  v_receiver_target_email text := nullif(trim(p_receiver_email), '');
  v_receiver_planned_channel text := case
    when coalesce(nullif(trim(p_receiver_whatsapp_number), ''), nullif(trim(p_receiver_phone), '')) is not null then 'whatsapp'
    when nullif(trim(p_receiver_email), '') is not null then 'email'
    else 'whatsapp'
  end;
begin
  if p_event_type in ('shipment_created', 'batch_shipped', 'batch_arrived', 'delayed', 'customs_hold', 'collected') then
    insert into public.vendor_notifications (
      vendor_id,
      shipment_id,
      batch_id,
      recipient_role,
      recipient_customer_id,
      recipient_name,
      recipient_phone,
      recipient_email,
      event_type,
      planned_channel,
      delivery_status
    )
    values (
      p_vendor_id,
      p_shipment_id,
      p_batch_id,
      'sender',
      p_sender_customer_id,
      nullif(trim(p_sender_name), ''),
      v_sender_target_phone,
      v_sender_target_email,
      p_event_type,
      v_sender_planned_channel,
      'recorded'
    );
  end if;

  if p_event_type in ('shipment_created', 'batch_shipped', 'batch_arrived', 'ready_for_pickup', 'delayed', 'customs_hold', 'out_for_last_mile_delivery') then
    insert into public.vendor_notifications (
      vendor_id,
      shipment_id,
      batch_id,
      recipient_role,
      recipient_customer_id,
      recipient_name,
      recipient_phone,
      recipient_email,
      event_type,
      planned_channel,
      delivery_status
    )
    values (
      p_vendor_id,
      p_shipment_id,
      p_batch_id,
      'receiver',
      p_receiver_customer_id,
      nullif(trim(p_receiver_name), ''),
      v_receiver_target_phone,
      v_receiver_target_email,
      p_event_type,
      v_receiver_planned_channel,
      'recorded'
    );
  end if;
end;
$$;

create or replace function public.handle_vendor_shipment_notification_events()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_event_type text := null;
begin
  if tg_op = 'INSERT' then
    v_event_type := 'shipment_created';
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    case new.status
      when 'in_transit' then
        if new.batch_id is not null then
          v_event_type := 'batch_shipped';
        end if;
      when 'arrived' then
        if new.batch_id is not null then
          v_event_type := 'batch_arrived';
        end if;
      when 'ready_for_pickup' then
        if new.batch_id is not null then
          v_event_type := 'ready_for_pickup';
        end if;
      when 'delayed' then
        v_event_type := 'delayed';
      when 'customs_hold' then
        v_event_type := 'customs_hold';
      when 'out_for_last_mile_delivery' then
        v_event_type := 'out_for_last_mile_delivery';
      when 'collected' then
        v_event_type := 'collected';
      else
        v_event_type := null;
    end case;
  end if;

  if v_event_type is null then
    return new;
  end if;

  perform public.enqueue_vendor_notification_records_for_shipment(
    new.vendor_id,
    new.id,
    new.batch_id,
    v_event_type,
    new.sender_customer_id,
    new.sender_name,
    new.sender_phone,
    new.sender_whatsapp_number,
    new.sender_email,
    new.receiver_customer_id,
    new.receiver_name,
    new.receiver_phone,
    new.receiver_whatsapp_number,
    new.receiver_email
  );

  return new;
end;
$$;
