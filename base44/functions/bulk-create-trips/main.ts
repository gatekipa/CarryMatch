import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();

    if (!payload.route_template_id || !payload.departure_time || !payload.base_price_xaf || 
        !payload.date_range_start || !payload.date_range_end) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch route template
    const templates = await base44.asServiceRole.entities.RouteTemplate.filter({ id: payload.route_template_id });
    if (templates.length === 0) {
      return Response.json({ error: 'Template not found' }, { status: 404 });
    }
    const template = templates[0];

    // Permission check: verify caller is operator staff
    const staff = await base44.asServiceRole.entities.OperatorStaff.filter({
      user_id: user.email,
      operator_id: template.operator_id,
      status: 'active'
    });
    if (staff.length === 0 && user.role !== 'admin') {
      return Response.json({ error: 'Permission denied: not operator staff' }, { status: 403 });
    }

    // Get or create route
    let route;
    const existingRoutes = await base44.asServiceRole.entities.BusRoute.filter({
      operator_id: template.operator_id,
      origin_city: template.origin_city,
      destination_city: template.destination_city
    });

    if (existingRoutes.length > 0) {
      route = existingRoutes[0];
    } else {
      route = await base44.asServiceRole.entities.BusRoute.create({
        operator_id: template.operator_id,
        origin_city: template.origin_city,
        destination_city: template.destination_city,
        route_status: "active",
        notes: `Auto-created from template: ${template.template_name}`
      });
    }

    // Get vehicles
    let vehicleIds = [];
    if (payload.vehicle_assignment_type === 'fixed') {
      vehicleIds = [payload.vehicle_id];
    } else {
      vehicleIds = payload.vehicle_pool_json;
    }

    const vehicles = await base44.asServiceRole.entities.Vehicle.filter({
      id: { $in: vehicleIds }
    });

    if (vehicles.length === 0) {
      return Response.json({ error: 'No vehicles available' }, { status: 400 });
    }

    // Fetch seat templates
    const seatTemplateIds = [...new Set(vehicles.map(v => v.seat_map_template_id))];
    const seatTemplates = await base44.asServiceRole.entities.SeatMapTemplate.filter({
      id: { $in: seatTemplateIds }
    });

    // Check for allocation rules at template level
    const templateAllocationRules = await base44.asServiceRole.entities.SeatAllocationRule.filter({
      route_template_id: payload.route_template_id,
      allocation_scope: "route_template"
    });
    const hasTemplateAllocation = templateAllocationRules.length > 0;
    let templateAllocations = [];
    if (hasTemplateAllocation) {
      templateAllocations = await base44.asServiceRole.entities.SeatAllocation.filter({
        seat_allocation_rule_id: templateAllocationRules[0].id
      });
    }

    // Generate trips
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const start = new Date(payload.date_range_start);
    const end = new Date(payload.date_range_end);
    const createdTrips = [];
    let vehicleIndex = 0;

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayName = dayNames[d.getDay()];
      if (!payload.days_of_week[dayName]) continue;

      const [hours, minutes] = payload.departure_time.split(':');
      const departureDate = new Date(d);
      departureDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const vehicle = vehicles[vehicleIndex % vehicles.length];
      vehicleIndex++;

      const arrivalDate = template.default_duration_minutes
        ? new Date(departureDate.getTime() + template.default_duration_minutes * 60000)
        : null;

      const trip = await base44.asServiceRole.entities.Trip.create({
        operator_id: template.operator_id,
        route_id: route.id,
        vehicle_id: vehicle.id,
        departure_datetime: departureDate.toISOString(),
        arrival_estimate_datetime: arrivalDate?.toISOString(),
        departure_branch_id: template.default_departure_branch_id,
        arrival_branch_text: template.default_arrival_branch_text,
        base_price_xaf: parseFloat(payload.base_price_xaf),
        trip_status: "scheduled",
        sales_channels_enabled_json: payload.sales_channels_enabled_json,
        online_seat_pool_rule: payload.online_seat_pool_rule
      });

      // Generate seat inventory
      const seatTemplate = seatTemplates.find(t => t.id === vehicle.seat_map_template_id);
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

            let price = parseFloat(payload.base_price_xaf);
            if (isVip && pricingRules.vip_multiplier) {
              price = price * pricingRules.vip_multiplier;
            }
            if (rowIndex === 0 && pricingRules.front_row_premium) {
              price += pricingRules.front_row_premium;
            }

            const isOnlineAllowed = payload.online_seat_pool_rule === 'all' || 
              (payload.selected_online_seats || []).includes(seatCode);

            seatInventory.push({
              trip_id: trip.id,
              seat_code: seatCode,
              seat_class: isVip ? 'vip' : 'standard',
              seat_status: isOnlineAllowed ? 'available' : 'blocked',
              price_xaf: Math.round(price)
            });

            seatNumber++;
          }
        }
      }

      if (seatInventory.length > 0) {
        await base44.asServiceRole.entities.TripSeatInventory.bulkCreate(seatInventory);
      }

      // Log audit
      await base44.asServiceRole.entities.AuditLog.create({
        actor_user_id: user.email,
        operator_id: template.operator_id,
        action_type: "trip_created",
        entity_type: "Trip",
        entity_id: trip.id,
        payload_json: {
          bulk_create: true,
          template_id: template.id
        }
      });

      // Apply allocation rule if defined at template level
      if (hasTemplateAllocation && templateAllocations.length > 0) {
        const newRule = await base44.asServiceRole.entities.SeatAllocationRule.create({
          operator_id: template.operator_id,
          trip_id: trip.id,
          vehicle_id: vehicle.id,
          allocation_scope: "trip",
          allow_rebalance: templateAllocationRules[0].allow_rebalance
        });

        const newAllocations = templateAllocations.map(alloc => ({
          seat_allocation_rule_id: newRule.id,
          branch_id: alloc.branch_id,
          channel: alloc.channel,
          allocated_seats_count: alloc.allocated_seats_count,
          locked: alloc.locked
        }));

        await base44.asServiceRole.entities.SeatAllocation.bulkCreate(newAllocations);
      }

      createdTrips.push(trip);
    }

    return Response.json({
      success: true,
      trips_created: createdTrips.length
    });

  } catch (error) {
    console.error('Error bulk creating trips:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});