import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Resolves seat allocation rules with priority:
 * 1. Trip-level
 * 2. RecurringService
 * 3. RouteTemplate
 * 4. Default (all online)
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { trip_id, route_template_id, recurring_service_id, vehicle_id } = await req.json();

    // Priority 1: Trip-level allocation
    if (trip_id) {
      const tripRules = await base44.asServiceRole.entities.SeatAllocationRule.filter({
        trip_id: trip_id,
        allocation_scope: "trip"
      });
      
      if (tripRules.length > 0) {
        const allocations = await base44.asServiceRole.entities.SeatAllocation.filter({
          seat_allocation_rule_id: tripRules[0].id
        });
        return Response.json({
          source: "trip",
          rule: tripRules[0],
          allocations: allocations
        });
      }
    }

    // Priority 2: RecurringService allocation
    if (recurring_service_id) {
      const serviceRules = await base44.asServiceRole.entities.SeatAllocationRule.filter({
        route_template_id: recurring_service_id,
        allocation_scope: "service"
      });
      
      if (serviceRules.length > 0) {
        const allocations = await base44.asServiceRole.entities.SeatAllocation.filter({
          seat_allocation_rule_id: serviceRules[0].id
        });
        return Response.json({
          source: "service",
          rule: serviceRules[0],
          allocations: allocations
        });
      }
    }

    // Priority 3: RouteTemplate allocation
    if (route_template_id) {
      const templateRules = await base44.asServiceRole.entities.SeatAllocationRule.filter({
        route_template_id: route_template_id,
        allocation_scope: "route_template"
      });
      
      if (templateRules.length > 0) {
        const allocations = await base44.asServiceRole.entities.SeatAllocation.filter({
          seat_allocation_rule_id: templateRules[0].id
        });
        return Response.json({
          source: "route_template",
          rule: templateRules[0],
          allocations: allocations
        });
      }
    }

    // Priority 4: Default (all seats online)
    return Response.json({
      source: "default",
      rule: null,
      allocations: []
    });

  } catch (error) {
    console.error('Error resolving allocation:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});