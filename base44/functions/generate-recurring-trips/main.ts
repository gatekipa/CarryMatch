import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { service_id, days_ahead } = await req.json();

    if (!service_id) {
      return Response.json({ error: 'service_id required' }, { status: 400 });
    }

    const daysToGenerate = days_ahead || 14;

    // Fetch service
    const services = await base44.asServiceRole.entities.RecurringService.filter({ id: service_id });
    if (services.length === 0) {
      return Response.json({ error: 'Service not found' }, { status: 404 });
    }
    const service = services[0];

    // Permission check: verify caller is operator staff
    const staff = await base44.asServiceRole.entities.OperatorStaff.filter({
      user_id: user.email,
      operator_id: service.operator_id,
      status: 'active'
    });
    if (staff.length === 0 && user.role !== 'admin') {
      return Response.json({ error: 'Permission denied: not operator staff' }, { status: 403 });
    }


    // Fetch route template
    const templates = await base44.asServiceRole.entities.RouteTemplate.filter({ id: service.route_template_id });
    if (templates.length === 0) {
      return Response.json({ error: 'Route template not found' }, { status: 404 });
    }
    const template = templates[0];

    // Fetch vehicles
    let vehicleIds = [];
    if (service.vehicle_id) {
      vehicleIds = [service.vehicle_id];
    } else if (service.vehicle_pool_json?.length > 0) {
      vehicleIds = service.vehicle_pool_json;
    }

    const vehicles = await base44.asServiceRole.entities.Vehicle.filter({
      id: { $in: vehicleIds }
    });

    if (vehicles.length === 0) {
      return Response.json({ error: 'No vehicles available' }, { status: 400 });
    }

    // Fetch seat map templates
    const seatMapTemplateIds = [...new Set(vehicles.map(v => v.seat_map_template_id))];
    const seatMapTemplates = await base44.asServiceRole.entities.SeatMapTemplate.filter({
      id: { $in: seatMapTemplateIds }
    });

    // Check for allocation rules (service level, then template level)
    let allocationRule = null;
    let allocations = [];

    // Priority 1: Service-level allocation
    const serviceRules = await base44.asServiceRole.entities.SeatAllocationRule.filter({
      route_template_id: service_id,
      allocation_scope: "service"
    });
    
    if (serviceRules.length > 0) {
      allocationRule = serviceRules[0];
      allocations = await base44.asServiceRole.entities.SeatAllocation.filter({
        seat_allocation_rule_id: allocationRule.id
      });
    } else {
      // Priority 2: Template-level allocation
      const templateRules = await base44.asServiceRole.entities.SeatAllocationRule.filter({
        route_template_id: service.route_template_id,
        allocation_scope: "route_template"
      });
      
      if (templateRules.length > 0) {
        allocationRule = templateRules[0];
        allocations = await base44.asServiceRole.entities.SeatAllocation.filter({
          seat_allocation_rule_id: allocationRule.id
        });
      }
    }

    // Get existing trips to prevent duplicates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + daysToGenerate);

    const existingTrips = await base44.asServiceRole.entities.Trip.filter({
      operator_id: service.operator_id,
      departure_datetime: {
        $gte: startDate.toISOString(),
        $lte: endDate.toISOString()
      }
    });

    const tripsToCreate = [];
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    let vehicleIndex = 0;

    for (let dayOffset = 0; dayOffset <= daysToGenerate; dayOffset++) {
      const date = new Date();
      date.setDate(date.getDate() + dayOffset);
      const dayName = dayNames[date.getDay()];

      // Skip if not scheduled for this day
      if (!service.days_of_week_json?.[dayName]) continue;

      // Check service date range
      if (service.start_date && date < new Date(service.start_date)) continue;
      if (service.end_date && date > new Date(service.end_date)) continue;

      // Build departure datetime
      const [hours, minutes] = service.departure_time_local.split(':');
      const departureDate = new Date(date);
      departureDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Check for duplicates
      const duplicate = existingTrips.find(t => {
        const tripDate = new Date(t.departure_datetime);
        return Math.abs(tripDate - departureDate) < 60000; // within 1 minute
      });

      if (duplicate) continue;

      // Assign vehicle (round-robin for pool)
      const vehicle = vehicles[vehicleIndex % vehicles.length];
      vehicleIndex++;

      // Calculate arrival
      const arrivalDate = template.default_duration_minutes
        ? new Date(departureDate.getTime() + template.default_duration_minutes * 60000)
        : null;

      // Create route if needed
      let route;
      const existingRoutes = await base44.asServiceRole.entities.BusRoute.filter({
        operator_id: service.operator_id,
        origin_city: template.origin_city,
        destination_city: template.destination_city
      });

      if (existingRoutes.length > 0) {
        route = existingRoutes[0];
      } else {
        route = await base44.asServiceRole.entities.BusRoute.create({
          operator_id: service.operator_id,
          origin_city: template.origin_city,
          destination_city: template.destination_city,
          route_status: "active",
          notes: `Auto-created from service: ${service.service_name}`
        });
      }

      const tripData = {
        operator_id: service.operator_id,
        route_id: route.id,
        vehicle_id: vehicle.id,
        departure_datetime: departureDate.toISOString(),
        arrival_estimate_datetime: arrivalDate?.toISOString(),
        departure_branch_id: template.default_departure_branch_id,
        arrival_branch_text: template.default_arrival_branch_text,
        base_price_xaf: service.base_price_xaf,
        trip_status: "scheduled",
        sales_channels_enabled_json: service.sales_channels_enabled_json,
        online_seat_pool_rule: service.online_seat_pool_rule
      };

      tripsToCreate.push(tripData);
    }

    // Bulk create trips
    const createdTrips = tripsToCreate.length > 0
      ? await base44.asServiceRole.entities.Trip.bulkCreate(tripsToCreate)
      : [];

    // Generate seat inventory for each trip
    for (const trip of createdTrips) {
      const vehicle = vehicles.find(v => v.id === trip.vehicle_id);
      const seatTemplate = seatMapTemplates.find(t => t.id === vehicle.seat_map_template_id);

      const seatInventory = [];
      const layout = seatTemplate.layout_json.layout;
      const seatClasses = seatTemplate.layout_json.seatClasses || {};
      const pricingRules = service.seat_pricing_rules_json || seatTemplate.default_seat_class_rules_json || {};

      for (let rowIndex = 0; rowIndex < layout.length; rowIndex++) {
        const row = layout[rowIndex];
        let seatNumber = 1;
        for (let colIndex = 0; colIndex < row.length; colIndex++) {
          if (row[colIndex] === 1) {
            const rowLabel = String.fromCharCode(65 + rowIndex);
            const seatCode = `${rowLabel}${seatNumber}`;
            const isVip = seatClasses[seatCode] === 'vip';

            let price = service.base_price_xaf;
            if (isVip && pricingRules.vip_multiplier) {
              price = price * pricingRules.vip_multiplier;
            }
            if (rowIndex === 0 && pricingRules.front_row_premium) {
              price += pricingRules.front_row_premium;
            }

            const isOnlineAllowed = service.online_seat_pool_rule === 'all' || 
              (service.subset_seats_json || []).includes(seatCode);

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

      // Apply allocation rule if defined
      if (allocationRule && allocations.length > 0) {
        const newRule = await base44.asServiceRole.entities.SeatAllocationRule.create({
          operator_id: service.operator_id,
          trip_id: trip.id,
          vehicle_id: vehicle.id,
          allocation_scope: "trip",
          allow_rebalance: allocationRule.allow_rebalance
        });

        const newAllocations = allocations.map(alloc => ({
          seat_allocation_rule_id: newRule.id,
          branch_id: alloc.branch_id,
          channel: alloc.channel,
          allocated_seats_count: alloc.allocated_seats_count,
          locked: alloc.locked
        }));

        await base44.asServiceRole.entities.SeatAllocation.bulkCreate(newAllocations);
      }
    }

    return Response.json({
      success: true,
      trips_created: createdTrips.length,
      service_name: service.service_name
    });

  } catch (error) {
    console.error('Error generating trips:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});