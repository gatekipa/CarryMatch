import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { trip_id, batch_type, custom_message, delay_info } = await req.json();

    if (!trip_id || !batch_type) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get trip
    const trips = await base44.asServiceRole.entities.Trip.filter({ id: trip_id });
    const trip = trips[0];
    
    if (!trip) {
      return Response.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Verify permission
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

    const branches = await base44.asServiceRole.entities.OperatorBranch.filter({ 
      id: trip.departure_branch_id 
    });
    const branch = branches[0];

    // Get message template
    const templateType = {
      'reminder': 'boarding_reminder',
      'last_call': 'boarding_reminder',
      'delay': 'delay_notice',
      'cancel': 'cancellation_notice',
      'boarding_open': 'boarding_reminder'
    }[batch_type] || 'boarding_reminder';

    const templates = await base44.asServiceRole.entities.MessageTemplate.filter({
      operator_id: trip.operator_id,
      template_type: templateType
    });
    const template = templates[0];

    // Get all passengers for this trip
    const orders = await base44.asServiceRole.entities.Order.filter({
      trip_id: trip_id,
      order_status: "paid"
    });

    const tickets = await base44.asServiceRole.entities.Ticket.filter({
      order_id: { $in: orders.map(o => o.id) }
    });

    const offlineSales = await base44.asServiceRole.entities.OfflineSale.filter({
      trip_id: trip_id
    });

    // Filter: for reminders, only send to not-checked-in
    let targetTickets = tickets;
    if (['reminder', 'last_call', 'boarding_open'].includes(batch_type)) {
      targetTickets = tickets.filter(t => t.checkin_status !== 'checked_in');
    }

    // Build message
    const message = custom_message || buildMessage(batch_type, {
      operator_name: operator.name,
      route: route,
      trip: trip,
      branch: branch,
      delay_info: delay_info,
      template: template
    });

    // Send emails
    let emailsSent = 0;
    for (const ticket of targetTickets) {
      const order = orders.find(o => o.id === ticket.order_id);
      if (!order) continue;

      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: order.user_id,
          subject: getSubject(batch_type, operator.name, route),
          from_name: operator.name,
          body: formatEmailBody(message, order, ticket, trip, route, operator, branch)
        });
        emailsSent++;
      } catch (e) {
        console.error('Failed to send email:', e);
      }
    }

    // Log notification batch
    const batchLog = await base44.asServiceRole.entities.NotificationBatchLog.create({
      operator_id: trip.operator_id,
      trip_id: trip_id,
      batch_type: batch_type,
      channel: 'email',
      recipients_count: emailsSent,
      message_preview: message.substring(0, 200),
      created_by_user_id: user.email
    });

    // If delay, update trip status and create status update
    if (batch_type === 'delay' && delay_info) {
      await base44.asServiceRole.entities.Trip.update(trip_id, {
        trip_status: 'delayed',
        arrival_estimate_datetime: delay_info.new_eta || trip.arrival_estimate_datetime
      });

      await base44.asServiceRole.entities.TripStatusUpdate.create({
        trip_id: trip_id,
        update_type: 'delayed',
        message: message,
        delay_minutes: delay_info.delay_minutes,
        new_eta: delay_info.new_eta,
        updated_by_user: user.email,
        notifications_sent: true
      });
    }

    return Response.json({
      success: true,
      batch_log: batchLog,
      emails_sent: emailsSent,
      total_passengers: orders.length + offlineSales.length
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function buildMessage(type, context) {
  const { operator_name, route, trip, branch, delay_info, template } = context;
  
  if (template?.content_text) {
    return template.content_text
      .replace('{{passenger_name}}', '{{PASSENGER_NAME}}')
      .replace('{{origin}}', route.origin_city)
      .replace('{{destination}}', route.destination_city)
      .replace('{{departure_time}}', new Date(trip.departure_datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))
      .replace('{{operator_name}}', operator_name);
  }

  const messages = {
    reminder: `Reminder: Your bus from ${route.origin_city} to ${route.destination_city} departs at ${new Date(trip.departure_datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}${branch ? ` from ${branch.branch_name}, ${branch.city}` : ''}. Please arrive 30 minutes early for check-in.`,
    last_call: `⚠️ LAST CALL: Your bus from ${route.origin_city} to ${route.destination_city} departs in 30 minutes! Please check in immediately at ${branch?.branch_name || 'the station'}.`,
    boarding_open: `🚌 Boarding is now open for ${route.origin_city} → ${route.destination_city}. Please proceed to gate for check-in.`,
    delay: `⏰ DELAY NOTICE: Your trip from ${route.origin_city} to ${route.destination_city} has been delayed by ${delay_info?.delay_minutes || 0} minutes. New departure time: ${delay_info?.new_time || 'TBD'}. We apologize for the inconvenience.`,
    cancel: `❌ TRIP CANCELLED: Unfortunately, your trip from ${route.origin_city} to ${route.destination_city} scheduled for ${new Date(trip.departure_datetime).toLocaleDateString()} has been cancelled. Please contact ${operator_name} at the station for refund.`
  };

  return messages[type] || messages.reminder;
}

function getSubject(type, operatorName, route) {
  const subjects = {
    reminder: `Boarding Reminder - ${route.origin_city} → ${route.destination_city}`,
    last_call: `⚠️ LAST CALL - Your bus departs soon!`,
    boarding_open: `🚌 Boarding Open - ${operatorName}`,
    delay: `⏰ Trip Delayed - ${route.origin_city} → ${route.destination_city}`,
    cancel: `Trip Cancelled - ${operatorName}`
  };
  return subjects[type] || `Trip Update - ${operatorName}`;
}

function formatEmailBody(message, order, ticket, trip, route, operator, branch) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>${operator.name}</h2>
      <p>Dear ${order.passenger_name},</p>
      <p style="font-size: 16px; font-weight: bold; padding: 15px; background: #f0f9ff; border-left: 4px solid #3b82f6;">
        ${message}
      </p>
      <hr/>
      <h3>Trip Details:</h3>
      <ul style="line-height: 1.8;">
        <li><strong>Route:</strong> ${route.origin_city} → ${route.destination_city}</li>
        <li><strong>Departure:</strong> ${new Date(trip.departure_datetime).toLocaleString()}</li>
        ${branch ? `<li><strong>Station:</strong> ${branch.branch_name}, ${branch.city}</li>` : ''}
        <li><strong>Ticket Code:</strong> ${ticket.ticket_code}</li>
        <li><strong>Seat:</strong> ${ticket.ticket_code.slice(-2)}</li>
      </ul>
      <p style="margin-top: 20px;">For assistance, contact us at ${operator.phone || operator.email}</p>
      <p>Safe travels,<br/><strong>${operator.name}</strong></p>
    </div>
  `;
}