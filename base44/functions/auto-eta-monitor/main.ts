import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all currently departed trips
    const trips = await base44.asServiceRole.entities.Trip.filter({
      trip_status: 'departed'
    });

    let updated = 0;
    let notified = 0;

    for (const trip of trips) {
      // Get latest location update for this trip
      const locations = await base44.asServiceRole.entities.BusLocationUpdate.filter({
        trip_id: trip.id
      }, '-created_date', 1);

      if (locations.length === 0) continue;
      const latestLocation = locations[0];

      // Get route
      const routes = await base44.asServiceRole.entities.BusRoute.filter({ id: trip.route_id });
      const route = routes[0];

      // Use AI to estimate remaining time based on current location and traffic
      const prompt = `A bus is currently traveling from ${route.origin_city} to ${route.destination_city}.

Current GPS Location: ${latestLocation.latitude}, ${latestLocation.longitude}
Current Speed: ${latestLocation.speed_kmh} km/h
Destination: ${trip.arrival_branch_text || route.destination_city}
Scheduled Arrival: ${trip.arrival_estimate_datetime}

Based on current location, speed, traffic conditions, and typical route patterns:
1. Estimate minutes remaining to destination
2. Assess if there will be a significant delay (>15 minutes)
3. Identify any traffic issues ahead

Consider current time of day and typical traffic patterns.`;

      const aiResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            estimated_minutes_remaining: { type: "number" },
            expected_delay_minutes: { type: "number" },
            traffic_ahead: { type: "string" },
            should_notify_passengers: { type: "boolean" }
          }
        }
      });

      // Calculate new ETA
      const newETA = new Date(Date.now() + aiResponse.estimated_minutes_remaining * 60 * 1000);
      const currentETA = new Date(trip.arrival_estimate_datetime);
      const delayMinutes = Math.round((newETA - currentETA) / (1000 * 60));

      // Update if significant change (>15 minutes)
      if (Math.abs(delayMinutes) > 15) {
        await base44.asServiceRole.entities.Trip.update(trip.id, {
          arrival_estimate_datetime: newETA.toISOString()
        });

        await base44.asServiceRole.entities.TripStatusUpdate.create({
          trip_id: trip.id,
          update_type: 'delayed',
          message: `ETA updated: ${aiResponse.traffic_ahead}`,
          delay_minutes: Math.abs(delayMinutes),
          new_eta: newETA.toISOString(),
          updated_by_user: 'system',
          notifications_sent: aiResponse.should_notify_passengers
        });

        updated++;

        // Notify passengers if delay is significant
        if (aiResponse.should_notify_passengers && delayMinutes > 20) {
          try {
            await base44.asServiceRole.functions.invoke('sendTemplateMessage', {
              trip_id: trip.id,
              template_type: 'delay_notice',
              recipient_filter: 'all_ticket_holders',
              custom_data: {
                new_time: newETA.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
              },
              manual_send: false,
              actor_user_id: null
            });
            notified++;
          } catch (e) {
            console.error('Notification failed:', e);
          }
        }
      }
    }

    return Response.json({
      success: true,
      trips_checked: trips.length,
      etas_updated: updated,
      passengers_notified: notified
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});