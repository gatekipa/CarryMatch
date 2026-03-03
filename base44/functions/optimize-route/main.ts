import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { trip_id, current_location } = await req.json();

    // Get trip details
    const trips = await base44.asServiceRole.entities.Trip.filter({ id: trip_id });
    const trip = trips[0];
    if (!trip) {
      return Response.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Permission check: verify caller is operator staff
    const staff = await base44.asServiceRole.entities.OperatorStaff.filter({
      user_id: user.email,
      operator_id: trip.operator_id,
      status: 'active'
    });
    if (staff.length === 0 && user.role !== 'admin') {
      return Response.json({ error: 'Permission denied: not operator staff' }, { status: 403 });
    }

    // Get route
    const routes = await base44.asServiceRole.entities.BusRoute.filter({ id: trip.route_id });
    const route = routes[0];

    // Get departure branch
    const branches = await base44.asServiceRole.entities.OperatorBranch.filter({ id: trip.departure_branch_id });
    const branch = branches[0];

    // Use AI with internet context for real-time traffic and route optimization
    const currentTime = new Date().toISOString();
    const prompt = `Analyze the current traffic and road conditions for a bus route and provide:
    
Route: ${route.origin_city} to ${route.destination_city}
Departure: ${branch?.address_text || route.origin_city}
Destination: ${trip.arrival_branch_text || route.destination_city}
Current Time: ${currentTime}
${current_location ? `Current Location: ${current_location.latitude}, ${current_location.longitude}` : ''}

Provide:
1. Estimated travel time in minutes (consider current traffic)
2. Traffic conditions (light/moderate/heavy)
3. Recommended departure time to arrive on schedule
4. Any incidents, road closures, or delays along the route
5. Alternative route suggestions if main route has issues
6. Rest stop recommendations for long trips (over 3 hours)

Be realistic and factor in typical traffic patterns for the time of day.`;

    const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          estimated_travel_minutes: { type: "number" },
          traffic_condition: { type: "string", enum: ["light", "moderate", "heavy", "severe"] },
          recommended_departure_time: { type: "string" },
          incidents: { 
            type: "array", 
            items: { 
              type: "object",
              properties: {
                description: { type: "string" },
                severity: { type: "string" },
                location: { type: "string" }
              }
            }
          },
          alternative_routes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                description: { type: "string" },
                estimated_time_minutes: { type: "number" },
                notes: { type: "string" }
              }
            }
          },
          rest_stops: {
            type: "array",
            items: {
              type: "object",
              properties: {
                location: { type: "string" },
                suggested_duration_minutes: { type: "number" }
              }
            }
          }
        }
      }
    });

    // Calculate new ETA
    const departureTime = trip.trip_status === 'departed' ? new Date() : new Date(trip.departure_datetime);
    const estimatedArrival = new Date(departureTime.getTime() + aiResponse.estimated_travel_minutes * 60 * 1000);

    // Check if ETA needs update
    const currentETA = trip.arrival_estimate_datetime ? new Date(trip.arrival_estimate_datetime) : null;
    const etaDifferenceMinutes = currentETA ? Math.abs((estimatedArrival - currentETA) / (1000 * 60)) : 0;

    let etaUpdated = false;
    if (etaDifferenceMinutes > 15) {
      // Significant change - update trip ETA
      await base44.asServiceRole.entities.Trip.update(trip_id, {
        arrival_estimate_datetime: estimatedArrival.toISOString()
      });
      etaUpdated = true;

      // Create status update
      await base44.asServiceRole.entities.TripStatusUpdate.create({
        trip_id: trip_id,
        update_type: 'delayed',
        message: `ETA updated due to ${aiResponse.traffic_condition} traffic`,
        delay_minutes: Math.round(etaDifferenceMinutes),
        new_eta: estimatedArrival.toISOString(),
        updated_by_user: user.email,
        notifications_sent: false
      });

      // If delay is significant (> 30 min), auto-notify passengers
      if (etaDifferenceMinutes > 30 && trip.trip_status === 'departed') {
        await base44.asServiceRole.functions.invoke('sendTemplateMessage', {
          trip_id: trip_id,
          template_type: 'delay_notice',
          recipient_filter: 'all_ticket_holders',
          custom_data: {
            new_time: estimatedArrival.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
          },
          manual_send: false,
          actor_user_id: user.email
        });
      }
    }

    return Response.json({
      success: true,
      optimization: aiResponse,
      new_eta: estimatedArrival.toISOString(),
      eta_updated: etaUpdated,
      eta_difference_minutes: Math.round(etaDifferenceMinutes),
      notifications_sent: etaDifferenceMinutes > 30 && trip.trip_status === 'departed'
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});