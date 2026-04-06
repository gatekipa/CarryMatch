do $$
declare
  table_name text;
  policy_name text;
  wave1_tables text[] := array[
    'user_profiles',
    'bus_operators',
    'trips',
    'trip_seat_inventory',
    'orders',
    'order_seats',
    'tickets',
    'operator_staff',
    'operator_branches',
    'bus_routes',
    'vehicles',
    'seat_map_templates'
  ];
begin
  foreach table_name in array wave1_tables loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from anon, authenticated', table_name);

    policy_name := format('service_role_all_%s', table_name);
    execute format('drop policy if exists %I on public.%I', policy_name, table_name);
    execute format(
      'create policy %I on public.%I as permissive for all to service_role using (true) with check (true)',
      policy_name,
      table_name
    );
  end loop;
end $$;
