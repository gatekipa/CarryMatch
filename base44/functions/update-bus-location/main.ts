import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { trip_id, latitude, longitude, speed_kmh, heading_degrees, update_source } = await req.json();

    if (!trip_id || latitude == null || longitude == null) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify user has permission for this trip
    const trips = await base44.entities.Trip.filter({ id: trip_id });
    const trip = trips[0];
    
    if (!trip) {
      return Response.json({ error: 'Trip not found' }, { status: 404 });
    }

    const staff = await base44.entities.OperatorStaff.filter({
      user_id: user.email,
      operator_id: trip.operator_id,
      status: "active"
    });

    if (staff.length === 0 && user.role !== 'admin') {
      return Response.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Create location update
    const locationUpdate = await base44.entities.BusLocationUpdate.create({
      trip_id,
      latitude,
      longitude,
      speed_kmh: speed_kmh || 0,
      heading_degrees: heading_degrees || 0,
      update_source: update_source || 'driver_manual',
      updated_by_user: user.email
    });

    return Response.json({
      success: true,
      location_update: locationUpdate
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});