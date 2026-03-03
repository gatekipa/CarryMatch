import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Check if seats can be sold on a given channel/branch
 * Enforces allocation limits in real-time
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { trip_id, seat_codes, channel, branch_id } = await req.json();

    // Get trip details
    const trips = await base44.asServiceRole.entities.Trip.filter({ id: trip_id });
    if (trips.length === 0) {
      return Response.json({ error: "Trip not found" }, { status: 404 });
    }
    const trip = trips[0];

    // Emergency mode bypasses all allocations
    if (trip.emergency_mode_enabled) {
      return Response.json({
        allowed: true,
        emergency_mode: true,
        message: "Emergency mode active - all allocations bypassed"
      });
    }

    // Get vehicle to determine total seats
    const vehicles = await base44.asServiceRole.entities.Vehicle.filter({ id: trip.vehicle_id });
    const vehicle = vehicles[0];
    const seatTemplates = await base44.asServiceRole.entities.SeatMapTemplate.filter({ id: vehicle.seat_map_template_id });
    const seatTemplate = seatTemplates[0];
    const layout = seatTemplate.layout_json.layout;
    const totalSeats = layout.reduce((total, row) => total + row.filter(seat => seat === 1).length, 0);

    // Resolve allocation rules (priority: trip > service > route_template > default)
    const allocationResponse = await base44.asServiceRole.functions.invoke('resolveSeatAllocation', {
      trip_id: trip_id,
      route_template_id: trip.route_id,
      vehicle_id: trip.vehicle_id
    });
    const allocationData = allocationResponse.data;

    let allocatedSeats = totalSeats; // default: all online
    
    if (allocationData.source !== 'default') {
      // Find allocation for this channel/branch
      const relevantAllocation = allocationData.allocations.find(a => {
        if (channel === 'online') {
          return a.channel === 'online' && a.branch_id === null;
        } else {
          return a.channel === 'branch' && a.branch_id === branch_id;
        }
      });

      if (!relevantAllocation) {
        return Response.json({
          allowed: false,
          reason: channel === 'online' 
            ? "No seats allocated for online sales" 
            : "No seats allocated for this branch"
        });
      }

      allocatedSeats = relevantAllocation.allocated_seats_count;
    } else if (channel === 'branch') {
      // Default mode: all online, branches get 0
      return Response.json({
        allowed: false,
        reason: "No seats allocated for branch sales. All seats are available online by default."
      });
    }

    // Count seats already sold on this channel/branch
    const inventory = await base44.asServiceRole.entities.TripSeatInventory.filter({ trip_id: trip_id });
    
    let soldOnChannel = 0;
    if (channel === 'online') {
      soldOnChannel = inventory.filter(s => s.seat_status === 'sold_online' || s.seat_status === 'held').length;
    } else {
      // For branches, only count seats sold by this specific branch
      soldOnChannel = inventory.filter(s => 
        s.seat_status === 'sold_offline' && 
        s.sold_by_branch_id === branch_id
      ).length;
    }

    const availableOnChannel = allocatedSeats - soldOnChannel;
    const requestedSeats = seat_codes.length;

    if (requestedSeats > availableOnChannel) {
      return Response.json({
        allowed: false,
        reason: channel === 'online'
          ? `Only ${availableOnChannel} seats available online (${soldOnChannel}/${allocatedSeats} sold)`
          : `Branch allocation exhausted. ${soldOnChannel}/${allocatedSeats} sold.`,
        allocated: allocatedSeats,
        sold: soldOnChannel,
        available: availableOnChannel
      });
    }

    return Response.json({
      allowed: true,
      allocated: allocatedSeats,
      sold: soldOnChannel,
      available: availableOnChannel
    });

  } catch (error) {
    console.error('Allocation check error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});