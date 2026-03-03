import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { shipment_id } = await req.json();

    // Get shipment
    const shipments = await base44.asServiceRole.entities.Shipment.filter({ id: shipment_id });
    if (shipments.length === 0) {
      return Response.json({ error: 'Shipment not found' }, { status: 404 });
    }
    const shipment = shipments[0];

    // Permission check: verify caller is vendor staff
    const vendorStaff = await base44.asServiceRole.entities.VendorStaff.filter({
      email: user.email,
      vendor_id: shipment.vendor_id,
      status: 'ACTIVE'
    });
    if (vendorStaff.length === 0 && user.role !== 'admin') {
      return Response.json({ error: 'Permission denied: not vendor staff' }, { status: 403 });
    }

    // Get vendor routes
    const routes = await base44.asServiceRole.entities.VendorRoute.filter({
      vendor_id: shipment.vendor_id,
      is_active: true
    });

    // Find matching routes
    const matchingRoutes = routes.filter(route => 
      route.origin_city.toLowerCase() === shipment.sender_city.toLowerCase() &&
      route.destination_city.toLowerCase() === shipment.recipient_city.toLowerCase()
    );

    if (matchingRoutes.length === 0) {
      return Response.json({
        success: true,
        matched: false,
        message: 'No pre-defined route found',
        suggestion: {
          origin: { city: shipment.sender_city, country: shipment.sender_country },
          destination: { city: shipment.recipient_city, country: shipment.recipient_country },
          waypoints: []
        }
      });
    }

    // Select best route (most used or shortest)
    const bestRoute = matchingRoutes.sort((a, b) => {
      if (a.usage_count !== b.usage_count) {
        return b.usage_count - a.usage_count;
      }
      return (a.estimated_distance_km || 999999) - (b.estimated_distance_km || 999999);
    })[0];

    // Increment usage count
    await base44.asServiceRole.entities.VendorRoute.update(bestRoute.id, {
      usage_count: (bestRoute.usage_count || 0) + 1
    });

    return Response.json({
      success: true,
      matched: true,
      route: {
        id: bestRoute.id,
        name: bestRoute.route_name,
        origin: { city: bestRoute.origin_city, country: bestRoute.origin_country },
        destination: { city: bestRoute.destination_city, country: bestRoute.destination_country },
        waypoints: bestRoute.waypoints || [],
        estimated_distance_km: bestRoute.estimated_distance_km,
        estimated_duration_hours: bestRoute.estimated_duration_hours,
        notes: bestRoute.route_notes
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});