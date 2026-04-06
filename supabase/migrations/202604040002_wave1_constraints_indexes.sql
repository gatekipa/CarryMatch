alter table public.user_profiles
  add constraint user_profiles_supabase_auth_user_id_fkey
  foreign key (supabase_auth_user_id)
  references auth.users (id)
  on delete set null;

alter table public.bus_operators
  add constraint bus_operators_created_by_user_profile_id_fkey
  foreign key (created_by_user_profile_id)
  references public.user_profiles (id)
  on delete set null;

alter table public.operator_branches
  add constraint operator_branches_operator_id_fkey
  foreign key (operator_id)
  references public.bus_operators (id)
  on delete cascade;

alter table public.bus_routes
  add constraint bus_routes_operator_id_fkey
  foreign key (operator_id)
  references public.bus_operators (id)
  on delete cascade;

alter table public.seat_map_templates
  add constraint seat_map_templates_operator_id_fkey
  foreign key (operator_id)
  references public.bus_operators (id)
  on delete cascade;

alter table public.vehicles
  add constraint vehicles_operator_id_fkey
  foreign key (operator_id)
  references public.bus_operators (id)
  on delete cascade,
  add constraint vehicles_seat_map_template_id_fkey
  foreign key (seat_map_template_id)
  references public.seat_map_templates (id)
  on delete restrict;

alter table public.trips
  add constraint trips_operator_id_fkey
  foreign key (operator_id)
  references public.bus_operators (id)
  on delete set null,
  add constraint trips_route_id_fkey
  foreign key (route_id)
  references public.bus_routes (id)
  on delete set null,
  add constraint trips_vehicle_id_fkey
  foreign key (vehicle_id)
  references public.vehicles (id)
  on delete set null,
  add constraint trips_departure_branch_id_fkey
  foreign key (departure_branch_id)
  references public.operator_branches (id)
  on delete set null;

alter table public.trip_seat_inventory
  add constraint trip_seat_inventory_trip_id_fkey
  foreign key (trip_id)
  references public.trips (id)
  on delete cascade,
  add constraint trip_seat_inventory_sold_by_branch_id_fkey
  foreign key (sold_by_branch_id)
  references public.operator_branches (id)
  on delete set null,
  add constraint trip_seat_inventory_released_by_user_profile_id_fkey
  foreign key (released_by_user_profile_id)
  references public.user_profiles (id)
  on delete set null;

alter table public.operator_staff
  add constraint operator_staff_operator_id_fkey
  foreign key (operator_id)
  references public.bus_operators (id)
  on delete cascade,
  add constraint operator_staff_user_profile_id_fkey
  foreign key (user_profile_id)
  references public.user_profiles (id)
  on delete set null;

alter table public.orders
  add constraint orders_buyer_user_profile_id_fkey
  foreign key (buyer_user_profile_id)
  references public.user_profiles (id)
  on delete set null,
  add constraint orders_trip_id_fkey
  foreign key (trip_id)
  references public.trips (id)
  on delete restrict,
  add constraint orders_operator_id_fkey
  foreign key (operator_id)
  references public.bus_operators (id)
  on delete restrict;

alter table public.order_seats
  add constraint order_seats_order_id_fkey
  foreign key (order_id)
  references public.orders (id)
  on delete cascade,
  add constraint order_seats_trip_id_fkey
  foreign key (trip_id)
  references public.trips (id)
  on delete restrict;

alter table public.tickets
  add constraint tickets_order_id_fkey
  foreign key (order_id)
  references public.orders (id)
  on delete cascade,
  add constraint tickets_checked_in_by_user_profile_id_fkey
  foreign key (checked_in_by_user_profile_id)
  references public.user_profiles (id)
  on delete set null;

alter table public.trip_seat_inventory
  add constraint trip_seat_inventory_trip_id_seat_code_key
  unique (trip_id, seat_code);

alter table public.operator_staff
  add constraint operator_staff_operator_id_user_email_key
  unique (operator_id, user_email);

alter table public.order_seats
  add constraint order_seats_order_id_seat_code_key
  unique (order_id, seat_code);

alter table public.tickets
  add constraint tickets_ticket_code_key
  unique (ticket_code);

create unique index if not exists bus_operators_public_slug_key
  on public.bus_operators (public_slug)
  where public_slug is not null;

create unique index if not exists vehicles_operator_id_plate_number_key
  on public.vehicles (operator_id, plate_number)
  where plate_number is not null;

create index if not exists user_profiles_user_type_idx
  on public.user_profiles (user_type);

create index if not exists user_profiles_bus_operator_role_idx
  on public.user_profiles (bus_operator_role);

create index if not exists user_profiles_is_verified_idx
  on public.user_profiles (is_verified);

create index if not exists user_profiles_verification_status_idx
  on public.user_profiles (verification_status);

create index if not exists user_profiles_vendor_legacy_base44_id_idx
  on public.user_profiles (vendor_legacy_base44_id);

create index if not exists bus_operators_status_idx
  on public.bus_operators (status);

create index if not exists bus_operators_created_by_email_idx
  on public.bus_operators (created_by_email);

create index if not exists bus_operators_created_by_user_profile_id_idx
  on public.bus_operators (created_by_user_profile_id);

create index if not exists bus_operators_verification_status_idx
  on public.bus_operators (verification_status);

create index if not exists bus_operators_email_idx
  on public.bus_operators (email);

create index if not exists operator_branches_operator_id_idx
  on public.operator_branches (operator_id);

create index if not exists operator_branches_city_idx
  on public.operator_branches (city);

create index if not exists operator_branches_operator_id_is_primary_idx
  on public.operator_branches (operator_id, is_primary);

create index if not exists operator_branches_operator_id_branch_name_idx
  on public.operator_branches (operator_id, branch_name);

create index if not exists bus_routes_operator_id_idx
  on public.bus_routes (operator_id);

create index if not exists bus_routes_route_status_idx
  on public.bus_routes (route_status);

create index if not exists bus_routes_operator_id_origin_destination_idx
  on public.bus_routes (operator_id, origin_city, destination_city);

create index if not exists seat_map_templates_operator_id_idx
  on public.seat_map_templates (operator_id);

create index if not exists seat_map_templates_template_name_idx
  on public.seat_map_templates (template_name);

create index if not exists vehicles_operator_id_idx
  on public.vehicles (operator_id);

create index if not exists vehicles_seat_map_template_id_idx
  on public.vehicles (seat_map_template_id);

create index if not exists vehicles_status_idx
  on public.vehicles (status);

create index if not exists vehicles_plate_number_idx
  on public.vehicles (plate_number);

create index if not exists trips_operator_id_idx
  on public.trips (operator_id);

create index if not exists trips_route_id_idx
  on public.trips (route_id);

create index if not exists trips_vehicle_id_idx
  on public.trips (vehicle_id);

create index if not exists trips_departure_branch_id_idx
  on public.trips (departure_branch_id);

create index if not exists trips_departure_datetime_idx
  on public.trips (departure_datetime);

create index if not exists trips_trip_status_idx
  on public.trips (trip_status);

create index if not exists trips_status_idx
  on public.trips (status);

create index if not exists trips_traveler_email_idx
  on public.trips (traveler_email);

create index if not exists trips_trip_kind_idx
  on public.trips (trip_kind);

create index if not exists trips_operator_id_trip_status_departure_datetime_idx
  on public.trips (operator_id, trip_status, departure_datetime desc);

create index if not exists trip_seat_inventory_trip_id_idx
  on public.trip_seat_inventory (trip_id);

create index if not exists trip_seat_inventory_trip_id_seat_status_idx
  on public.trip_seat_inventory (trip_id, seat_status);

create index if not exists trip_seat_inventory_trip_id_sold_by_branch_id_seat_status_idx
  on public.trip_seat_inventory (trip_id, sold_by_branch_id, seat_status);

create index if not exists trip_seat_inventory_held_until_idx
  on public.trip_seat_inventory (held_until);

create index if not exists trip_seat_inventory_held_by_order_id_idx
  on public.trip_seat_inventory (held_by_order_id);

create index if not exists trip_seat_inventory_trip_id_seat_class_idx
  on public.trip_seat_inventory (trip_id, seat_class);

create index if not exists operator_staff_operator_id_idx
  on public.operator_staff (operator_id);

create index if not exists operator_staff_user_email_idx
  on public.operator_staff (user_email);

create index if not exists operator_staff_status_idx
  on public.operator_staff (status);

create index if not exists operator_staff_staff_role_idx
  on public.operator_staff (staff_role);

create index if not exists operator_staff_operator_id_user_email_status_idx
  on public.operator_staff (operator_id, user_email, status);

create index if not exists orders_buyer_user_profile_id_idx
  on public.orders (buyer_user_profile_id);

create index if not exists orders_buyer_email_idx
  on public.orders (buyer_email);

create index if not exists orders_trip_id_idx
  on public.orders (trip_id);

create index if not exists orders_operator_id_idx
  on public.orders (operator_id);

create index if not exists orders_order_status_idx
  on public.orders (order_status);

create index if not exists orders_payment_reference_idx
  on public.orders (payment_reference);

create index if not exists orders_trip_id_order_status_idx
  on public.orders (trip_id, order_status);

create index if not exists order_seats_order_id_idx
  on public.order_seats (order_id);

create index if not exists order_seats_trip_id_idx
  on public.order_seats (trip_id);

create index if not exists order_seats_trip_id_seat_code_idx
  on public.order_seats (trip_id, seat_code);

create index if not exists tickets_order_id_idx
  on public.tickets (order_id);

create index if not exists tickets_checkin_status_idx
  on public.tickets (checkin_status);

create index if not exists tickets_checked_in_by_user_email_idx
  on public.tickets (checked_in_by_user_email);
