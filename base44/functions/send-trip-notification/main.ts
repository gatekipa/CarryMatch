import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { trip_id, update_type, message, delay_minutes, new_eta } = await req.json();

    if (!trip_id || !update_type) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify permission
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

    // Get trip details
    const routes = await base44.asServiceRole.entities.BusRoute.filter({ id: trip.route_id });
    const route = routes[0];
    
    const operators = await base44.asServiceRole.entities.BusOperator.filter({ id: trip.operator_id });
    const operator = operators[0];

    // Get all passengers for this trip
    const orders = await base44.asServiceRole.entities.Order.filter({
      trip_id: trip_id,
      order_status: "paid"
    });

    const offlineSales = await base44.asServiceRole.entities.OfflineSale.filter({
      trip_id: trip_id
    });

    // Create status update record
    const statusUpdate = await base44.entities.TripStatusUpdate.create({
      trip_id,
      update_type,
      message: message || getDefaultMessage(update_type, route, delay_minutes),
      delay_minutes: delay_minutes || undefined,
      new_eta: new_eta || undefined,
      updated_by_user: user.email,
      notifications_sent: true
    });

    // Send notifications to all passengers
    let emailsSent = 0;
    const notificationMessage = message || getDefaultMessage(update_type, route, delay_minutes, new_eta);

    for (const order of orders) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: order.user_id,
          subject: `${operator.name} - Trip Update: ${route.origin_city} → ${route.destination_city}`,
          from_name: operator.name,
          body: `
            <h2>Trip Update</h2>
            <p>Dear ${order.passenger_name},</p>
            <p><strong>${notificationMessage}</strong></p>
            <hr/>
            <p><strong>Trip Details:</strong></p>
            <ul>
              <li>Route: ${route.origin_city} → ${route.destination_city}</li>
              <li>Original Departure: ${new Date(trip.departure_datetime).toLocaleString()}</li>
              <li>Passenger: ${order.passenger_name}</li>
              <li>Phone: ${order.passenger_phone}</li>
            </ul>
            ${new_eta ? `<p><strong>New ETA:</strong> ${new Date(new_eta).toLocaleString()}</p>` : ''}
            <p>For assistance, contact us at ${operator.phone}</p>
            <p>Safe travels,<br/>${operator.name}</p>
          `
        });
        emailsSent++;
      } catch (e) {
        console.error('Failed to send email to:', order.user_id, e);
      }
    }

    // TODO: Send SMS via Twilio when credentials are configured
    // This would use offlineSales passenger_phone numbers

    return Response.json({
      success: true,
      status_update: statusUpdate,
      notifications_sent: {
        email: emailsSent,
        sms: 0,
        total_passengers: orders.length + offlineSales.length
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getDefaultMessage(type, route, delayMinutes, newEta) {
  const messages = {
    boarding_open: `Boarding is now open for ${route.origin_city} → ${route.destination_city}. Please proceed to the boarding gate.`,
    departed: `Your bus has departed from ${route.origin_city} and is on the way to ${route.destination_city}.`,
    delayed: `Your trip has been delayed by ${delayMinutes} minutes. We apologize for the inconvenience.`,
    rest_stop: `Your bus is currently at a rest stop. We will continue shortly.`,
    arriving_soon: `Your bus will arrive at ${route.destination_city} in approximately 30 minutes.`,
    arrived: `Your bus has arrived at ${route.destination_city}. Thank you for traveling with us!`
  };
  return messages[type] || 'Trip status updated.';
}