import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Toggle emergency mode for a trip
 * Temporarily disables allocations - all seats sellable everywhere
 * Auto-expires after departure time
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { trip_id, enable, reason } = await req.json();

    if (!trip_id) {
      return Response.json({ error: "trip_id required" }, { status: 400 });
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

    // Update trip
    await base44.asServiceRole.entities.Trip.update(trip_id, {
      emergency_mode_enabled: enable,
      emergency_mode_reason: enable ? reason : null
    });

    // Audit log
    await base44.asServiceRole.entities.AuditLog.create({
      actor_user_id: user.email,
      operator_id: trip.operator_id,
      action_type: enable ? 'trip_created' : 'trip_canceled',
      entity_type: 'Trip',
      entity_id: trip_id,
      payload_json: {
        emergency_mode: enable,
        reason: reason,
        message: enable 
          ? 'Emergency mode ENABLED - all allocations bypassed' 
          : 'Emergency mode DISABLED'
      }
    });

    return Response.json({
      success: true,
      message: enable 
        ? "Emergency mode enabled - all seats now sellable on all channels"
        : "Emergency mode disabled - allocations restored"
    });

  } catch (error) {
    console.error('Emergency mode toggle error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});