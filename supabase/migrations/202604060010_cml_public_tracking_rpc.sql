create or replace function public.get_public_shipment_tracking(p_tracking_number text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with target_shipment as (
    select
      shipments.id,
      shipments.created_at,
      shipments.tracking_number,
      shipments.contents_description,
      shipments.weight_kg,
      shipments.quantity,
      shipments.category,
      shipments.shipping_mode,
      shipments.origin_country,
      shipments.origin_city,
      shipments.destination_country,
      shipments.destination_city,
      shipments.status,
      shipments.destination_branch_id,
      shipments.batch_id,
      vendors.company_name as vendor_company_name,
      branches.branch_name as destination_branch_name,
      branches.address_text as destination_branch_address,
      branches.city as destination_branch_city,
      branches.country_code as destination_branch_country,
      batches.batch_name,
      batches.status as batch_status
    from public.vendor_shipments as shipments
    join public.vendors as vendors
      on vendors.id = shipments.vendor_id
    left join public.vendor_branches as branches
      on branches.id = shipments.destination_branch_id
     and branches.vendor_id = shipments.vendor_id
    left join public.vendor_batches as batches
      on batches.id = shipments.batch_id
     and batches.vendor_id = shipments.vendor_id
    where upper(trim(shipments.tracking_number)) = upper(trim(p_tracking_number))
    limit 1
  ),
  history_rows as (
    select
      history.id,
      history.created_at,
      history.status,
      history.event_kind
    from public.vendor_shipment_status_history as history
    join target_shipment
      on target_shipment.id = history.shipment_id
    order by history.created_at desc
  )
  select
    case
      when exists (select 1 from target_shipment) then
        jsonb_build_object(
          'shipment',
          (
            select jsonb_build_object(
              'id', id,
              'created_at', created_at,
              'tracking_number', tracking_number,
              'contents_description', contents_description,
              'weight_kg', weight_kg,
              'quantity', quantity,
              'category', category,
              'shipping_mode', shipping_mode,
              'origin_country', origin_country,
              'origin_city', origin_city,
              'destination_country', destination_country,
              'destination_city', destination_city,
              'status', status
            )
            from target_shipment
          ),
          'vendor',
          (
            select jsonb_build_object(
              'company_name', vendor_company_name
            )
            from target_shipment
          ),
          'destination_branch',
          (
            select
              case
                when destination_branch_id is null then null
                else jsonb_build_object(
                  'id', destination_branch_id,
                  'branch_name', destination_branch_name,
                  'address_text', destination_branch_address,
                  'city', destination_branch_city,
                  'country_code', destination_branch_country
                )
              end
            from target_shipment
          ),
          'status_history',
          coalesce(
            (
              select jsonb_agg(
                jsonb_build_object(
                  'id', id,
                  'created_at', created_at,
                  'status', status,
                  'event_kind', event_kind
                )
                order by created_at desc
              )
              from history_rows
            ),
            '[]'::jsonb
          )
        )
      else null
    end;
$$;

revoke all on function public.get_public_shipment_tracking(text) from public;
grant execute on function public.get_public_shipment_tracking(text) to anon;
grant execute on function public.get_public_shipment_tracking(text) to authenticated;
