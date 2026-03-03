import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Automatic seat rebalancing engine
 * Reallocates unused seats from branches to online pool or other branches
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { trip_id, triggered_by = 'system', actor_user_id } = await req.json();

    if (!trip_id) {
      return Response.json({ error: "trip_id required" }, { status: 400 });
    }

    // Get trip details
    const trips = await base44.asServiceRole.entities.Trip.filter({ id: trip_id });
    if (trips.length === 0) {
      return Response.json({ error: "Trip not found" }, { status: 404 });
    }
    const trip = trips[0];

    // Get operator settings
    const settings = await base44.asServiceRole.entities.OperatorSettings.filter({ 
      operator_id: trip.operator_id 
    });
    const rebalanceThreshold = settings[0]?.rebalance_minutes_before_departure || 60;
    const enableAutoRebalance = settings[0]?.enable_auto_rebalance !== false;

    if (!enableAutoRebalance && triggered_by === 'system') {
      return Response.json({ 
        message: "Auto-rebalance disabled for this operator",
        rebalances: []
      });
    }

    // Check if trip allows rebalancing
    const allocationResponse = await base44.asServiceRole.functions.invoke('resolveSeatAllocation', {
      trip_id: trip_id,
      route_template_id: trip.route_id,
      vehicle_id: trip.vehicle_id
    });
    const allocationData = allocationResponse.data;

    if (allocationData.source === 'default') {
      return Response.json({ 
        message: "No allocation rules configured - all seats online by default",
        rebalances: []
      });
    }

    const rule = allocationData.rule;
    if (!rule.allow_rebalance) {
      return Response.json({ 
        message: "Rebalancing disabled for this trip's allocation rule",
        rebalances: []
      });
    }

    // Check timing for system triggers
    const minutesUntilDeparture = (new Date(trip.departure_datetime) - new Date()) / (1000 * 60);

    if (minutesUntilDeparture > rebalanceThreshold && triggered_by === 'system') {
      return Response.json({
        message: `Too early to rebalance. Will trigger at ${Math.round(minutesUntilDeparture - rebalanceThreshold)} minutes before departure`,
        rebalances: [],
        minutes_until_trigger: Math.round(minutesUntilDeparture - rebalanceThreshold)
      });
    }

    // Get all seat inventory
    const inventory = await base44.asServiceRole.entities.TripSeatInventory.filter({ trip_id: trip_id });
    const allocations = allocationData.allocations;
    const rebalanceEvents = [];

    // Calculate current usage per allocation
    const onlineAllocation = allocations.find(a => a.channel === 'online' && !a.branch_id);
    const branchAllocations = allocations.filter(a => a.channel === 'branch' && a.branch_id);

    if (!onlineAllocation) {
      return Response.json({ 
        message: "No online allocation found - cannot rebalance",
        rebalances: []
      });
    }

    let totalReallocated = 0;

    // Process each branch allocation
    for (const allocation of branchAllocations) {
      if (allocation.locked) {
        console.log(`Skipping locked allocation for branch ${allocation.branch_id}`);
        continue;
      }

      // Count sold seats for this branch
      const branchSold = inventory.filter(s => 
        s.seat_status === 'sold_offline' && 
        s.sold_by_branch_id === allocation.branch_id
      ).length;

      const unused = allocation.allocated_seats_count - branchSold;
      
      if (unused > 0) {
        // Reallocate unused seats to online pool
        await base44.asServiceRole.entities.SeatAllocation.update(allocation.id, {
          allocated_seats_count: branchSold
        });
        
        await base44.asServiceRole.entities.SeatAllocation.update(onlineAllocation.id, {
          allocated_seats_count: onlineAllocation.allocated_seats_count + unused
        });

        totalReallocated += unused;

        // Get branch name for logging
        const branches = await base44.asServiceRole.entities.OperatorBranch.filter({ id: allocation.branch_id });
        const branchName = branches[0]?.branch_name || 'Unknown Branch';

        // Create rebalance event
        const event = await base44.asServiceRole.entities.SeatRebalanceEvent.create({
          operator_id: trip.operator_id,
          trip_id: trip_id,
          from_branch_id: allocation.branch_id,
          to_branch_id: null,
          seats_moved_count: unused,
          triggered_by: triggered_by,
          reason: triggered_by === 'system' 
            ? `Auto-rebalance ${Math.round(minutesUntilDeparture)} min before departure: ${branchName} unused allocation`
            : `Manual admin rebalance: ${branchName} unused allocation`
        });

        rebalanceEvents.push(event);

        // Audit log
        await base44.asServiceRole.entities.AuditLog.create({
          actor_user_id: actor_user_id || 'system',
          operator_id: trip.operator_id,
          action_type: 'seat_force_released',
          entity_type: 'SeatAllocation',
          entity_id: allocation.id,
          payload_json: {
            trip_id: trip_id,
            from_branch_id: allocation.branch_id,
            from_branch_name: branchName,
            to_channel: 'online',
            seats_moved: unused,
            triggered_by: triggered_by,
            reason: event.reason,
            minutes_until_departure: Math.round(minutesUntilDeparture)
          }
        });
      }
    }

    return Response.json({
      success: true,
      message: totalReallocated > 0 
        ? `Rebalanced ${totalReallocated} seat(s) to online pool from ${rebalanceEvents.length} branch(es)`
        : 'No seats needed rebalancing - all allocations in use',
      rebalances: rebalanceEvents,
      total_reallocated: totalReallocated,
      minutes_until_departure: Math.round(minutesUntilDeparture)
    });

  } catch (error) {
    console.error('Rebalance error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});