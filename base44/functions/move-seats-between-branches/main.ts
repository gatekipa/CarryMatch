import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Manual seat movement between branches
 * Operator admin only
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { trip_id, from_branch_id, to_branch_id, seats_count, reason } = await req.json();

    if (!trip_id || seats_count <= 0 || !reason) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get trip
    const trips = await base44.asServiceRole.entities.Trip.filter({ id: trip_id });
    if (trips.length === 0) {
      return Response.json({ error: "Trip not found" }, { status: 404 });
    }
    const trip = trips[0];

    // Verify user is operator admin
    const staff = await base44.asServiceRole.entities.OperatorStaff.filter({
      user_id: user.email,
      operator_id: trip.operator_id,
      staff_role: 'vendor_bus_operator',
      status: 'active'
    });

    if (staff.length === 0) {
      return Response.json({ error: "Operator admin access required" }, { status: 403 });
    }

    // Get allocation rule
    const allocationResponse = await base44.asServiceRole.functions.invoke('resolveSeatAllocation', {
      trip_id: trip_id,
      route_template_id: trip.route_id,
      vehicle_id: trip.vehicle_id
    });
    const allocationData = allocationResponse.data;

    if (allocationData.source === 'default') {
      return Response.json({ error: "No allocation rules to modify" }, { status: 400 });
    }

    const allocations = allocationData.allocations;

    // Find source and target allocations
    const fromAllocation = from_branch_id 
      ? allocations.find(a => a.branch_id === from_branch_id)
      : allocations.find(a => a.channel === 'online' && !a.branch_id);

    const toAllocation = to_branch_id
      ? allocations.find(a => a.branch_id === to_branch_id)
      : allocations.find(a => a.channel === 'online' && !a.branch_id);

    if (!fromAllocation || !toAllocation) {
      return Response.json({ error: "Source or target allocation not found" }, { status: 404 });
    }

    // Check if source has enough seats
    const inventory = await base44.asServiceRole.entities.TripSeatInventory.filter({ trip_id: trip_id });
    
    const fromSold = from_branch_id
      ? inventory.filter(s => s.seat_status === 'sold_offline' && s.sold_by_branch_id === from_branch_id).length
      : inventory.filter(s => s.seat_status === 'sold_online' || s.seat_status === 'held').length;

    const fromAvailable = fromAllocation.allocated_seats_count - fromSold;

    if (fromAvailable < seats_count) {
      return Response.json({ 
        error: `Source only has ${fromAvailable} unsold seats (${fromSold}/${fromAllocation.allocated_seats_count} sold)` 
      }, { status: 400 });
    }

    // Perform the move
    await base44.asServiceRole.entities.SeatAllocation.update(fromAllocation.id, {
      allocated_seats_count: fromAllocation.allocated_seats_count - seats_count
    });

    await base44.asServiceRole.entities.SeatAllocation.update(toAllocation.id, {
      allocated_seats_count: toAllocation.allocated_seats_count + seats_count
    });

    // Create rebalance event
    const event = await base44.asServiceRole.entities.SeatRebalanceEvent.create({
      operator_id: trip.operator_id,
      trip_id: trip_id,
      from_branch_id: from_branch_id,
      to_branch_id: to_branch_id,
      seats_moved_count: seats_count,
      triggered_by: 'admin',
      reason: `Manual override: ${reason}`
    });

    // Audit log
    await base44.asServiceRole.entities.AuditLog.create({
      actor_user_id: user.email,
      operator_id: trip.operator_id,
      action_type: 'seat_force_released',
      entity_type: 'SeatAllocation',
      entity_id: fromAllocation.id,
      payload_json: {
        trip_id: trip_id,
        from_branch_id: from_branch_id,
        to_branch_id: to_branch_id,
        seats_moved: seats_count,
        reason: reason,
        manual_override: true
      }
    });

    return Response.json({
      success: true,
      message: `Moved ${seats_count} seat(s) successfully`,
      event: event
    });

  } catch (error) {
    console.error('Move seats error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});