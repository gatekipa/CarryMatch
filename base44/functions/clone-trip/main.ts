import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { trip_id, new_dates } = await req.json();

    if (!trip_id || !new_dates?.length) {
      return Response.json({ error: 'trip_id and new_dates required' }, { status: 400 });
    }

    // Fetch original trip
    const trips = await base44.asServiceRole.entities.Trip.filter({ id: trip_id });
    if (trips.length === 0) {
      return Response.json({ error: 'Trip not found' }, { status: 404 });
    }
    const originalTrip = trips[0];

    // Permission check: verify caller is operator staff
    const staff = await base44.asServiceRole.entities.OperatorStaff.filter({
      user_id: user.email,
      operator_id: originalTrip.operator_id,
      status: 'active'
    });
    if (staff.length === 0 && user.role !== 'admin') {
      return Response.json({ error: 'Permission denied: not operator staff' }, { status: 403 });
    }

    // Fetch original seat inventory
    const originalSeats = await base44.asServiceRole.entities.TripSeatInventory.filter({ trip_id: trip_id });

    // Check for allocation rules on original trip
    const allocationRules = await base44.asServiceRole.entities.SeatAllocationRule.filter({
      trip_id: trip_id,
      allocation_scope: "trip"
    });
    const hasAllocationRule = allocationRules.length > 0;

    // Fetch vehicle and seat template
    const vehicles = await base44.asServiceRole.entities.Vehicle.filter({ id: originalTrip.vehicle_id });
    const vehicle = vehicles[0];
    const seatTemplates = await base44.asServiceRole.entities.SeatMapTemplate.filter({ id: vehicle.seat_map_template_id });
    const seatTemplate = seatTemplates[0];

    const createdTrips = [];

    for (const dateStr of new_dates) {
      const originalDate = new Date(originalTrip.departure_datetime);
      const newDate = new Date(dateStr);
      newDate.setHours(originalDate.getHours(), originalDate.getMinutes(), 0, 0);

      // Calculate arrival if original had one
      let arrivalDatetime = null;
      if (originalTrip.arrival_estimate_datetime) {
        const originalArrival = new Date(originalTrip.arrival_estimate_datetime);
        const durationMs = originalArrival - originalDate;
        arrivalDatetime = new Date(newDate.getTime() + durationMs).toISOString();
      }

      // Create new trip
      const newTrip = await base44.asServiceRole.entities.Trip.create({
        operator_id: originalTrip.operator_id,
        route_id: originalTrip.route_id,
        vehicle_id: originalTrip.vehicle_id,
        departure_datetime: newDate.toISOString(),
        arrival_estimate_datetime: arrivalDatetime,
        departure_branch_id: originalTrip.departure_branch_id,
        arrival_branch_text: originalTrip.arrival_branch_text,
        base_price_xaf: originalTrip.base_price_xaf,
        trip_status: "scheduled",
        sales_channels_enabled_json: originalTrip.sales_channels_enabled_json,
        online_seat_pool_rule: originalTrip.online_seat_pool_rule
      });

      // Clone seat inventory (preserve pricing and blocked status, reset sold/held)
      const newSeats = originalSeats.map(seat => ({
        trip_id: newTrip.id,
        seat_code: seat.seat_code,
        seat_class: seat.seat_class,
        seat_status: seat.seat_status === 'sold_online' || seat.seat_status === 'sold_offline' || seat.seat_status === 'held' || seat.seat_status === 'released_for_walkin'
          ? 'available'
          : seat.seat_status, // Preserves 'blocked' status for offline-only seats
        price_xaf: seat.price_xaf
      }));

      if (newSeats.length === 0) {
        // Fallback: Generate from template if no original seats
        const seatInventory = [];
        const layout = seatTemplate.layout_json.layout;
        const seatClasses = seatTemplate.layout_json.seatClasses || {};
        const pricingRules = seatTemplate.default_seat_class_rules_json || {};

        for (let rowIndex = 0; rowIndex < layout.length; rowIndex++) {
          const row = layout[rowIndex];
          let seatNumber = 1;
          for (let colIndex = 0; colIndex < row.length; colIndex++) {
            if (row[colIndex] === 1) {
              const rowLabel = String.fromCharCode(65 + rowIndex);
              const seatCode = `${rowLabel}${seatNumber}`;
              const isVip = seatClasses[seatCode] === 'vip';

              let price = originalTrip.base_price_xaf;
              if (isVip && pricingRules.vip_multiplier) {
                price = price * pricingRules.vip_multiplier;
              }

              const isOnlineAllowed = originalTrip.online_seat_pool_rule === 'all';

              seatInventory.push({
                trip_id: newTrip.id,
                seat_code: seatCode,
                seat_class: isVip ? 'vip' : 'standard',
                seat_status: isOnlineAllowed ? 'available' : 'blocked',
                price_xaf: Math.round(price)
              });

              seatNumber++;
            }
          }
        }
        await base44.asServiceRole.entities.TripSeatInventory.bulkCreate(seatInventory);
      } else {
        await base44.asServiceRole.entities.TripSeatInventory.bulkCreate(newSeats);
      }

      // Log audit
      await base44.asServiceRole.entities.AuditLog.create({
        actor_user_id: user.email,
        operator_id: originalTrip.operator_id,
        action_type: "trip_created",
        entity_type: "Trip",
        entity_id: newTrip.id,
        payload_json: {
          cloned_from: trip_id,
          cloned_date: dateStr
        }
      });

      // Inherit allocation rule if exists
      if (hasAllocationRule) {
        const originalRule = allocationRules[0];
        const originalAllocations = await base44.asServiceRole.entities.SeatAllocation.filter({
          seat_allocation_rule_id: originalRule.id
        });

        // Create new rule for cloned trip
        const newRule = await base44.asServiceRole.entities.SeatAllocationRule.create({
          operator_id: originalRule.operator_id,
          trip_id: newTrip.id,
          vehicle_id: originalRule.vehicle_id,
          allocation_scope: "trip",
          allow_rebalance: originalRule.allow_rebalance
        });

        // Clone allocations
        const newAllocations = originalAllocations.map(alloc => ({
          seat_allocation_rule_id: newRule.id,
          branch_id: alloc.branch_id,
          channel: alloc.channel,
          allocated_seats_count: alloc.allocated_seats_count,
          locked: alloc.locked
        }));

        if (newAllocations.length > 0) {
          await base44.asServiceRole.entities.SeatAllocation.bulkCreate(newAllocations);
        }
      }

      createdTrips.push(newTrip);
    }

    return Response.json({
      success: true,
      trips_created: createdTrips.length
    });

  } catch (error) {
    console.error('Error cloning trip:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});