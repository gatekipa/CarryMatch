import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { trip_id, template_type, recipient_filter, custom_data, manual_send, actor_user_id } = await req.json();

    // Get trip details
    const trips = await base44.asServiceRole.entities.Trip.filter({ id: trip_id });
    const trip = trips[0];

    // Permission check: verify caller is operator staff
    const callerStaff = await base44.asServiceRole.entities.OperatorStaff.filter({
      user_id: user.email,
      operator_id: trip.operator_id,
      status: 'active'
    });
    if (callerStaff.length === 0 && user.role !== 'admin') {
      return Response.json({ error: 'Permission denied: not operator staff' }, { status: 403 });
    }

    if (!trip) {
      return Response.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Get operator and settings
    const operators = await base44.asServiceRole.entities.BusOperator.filter({ id: trip.operator_id });
    const operator = operators[0];

    const settings = await base44.asServiceRole.entities.OperatorSettings.filter({ operator_id: trip.operator_id });
    const operatorSettings = settings[0];

    // Get route
    const routes = await base44.asServiceRole.entities.BusRoute.filter({ id: trip.route_id });
    const route = routes[0];

    // Get departure branch
    const branches = await base44.asServiceRole.entities.OperatorBranch.filter({ id: trip.departure_branch_id });
    const branch = branches[0];

    // Check spam guard (10 minute cooldown) unless manual override
    if (!manual_send) {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const recentBatches = await base44.asServiceRole.entities.NotificationBatchLog.filter({
        trip_id: trip_id,
        batch_type: template_type.replace('reminder_', 'reminder'),
        created_date: { $gte: tenMinutesAgo }
      });
      
      if (recentBatches.length > 0) {
        return Response.json({ 
          error: 'Spam guard: Last reminder sent less than 10 minutes ago',
          skipped: true 
        }, { status: 200 });
      }
    }

    // Get recipients
    const onlineOrders = await base44.asServiceRole.entities.Order.filter({
      trip_id: trip_id,
      order_status: "paid"
    });

    const offlineSales = await base44.asServiceRole.entities.OfflineSale.filter({
      trip_id: trip_id
    });

    // Get tickets for check-in status
    const tickets = await base44.asServiceRole.entities.Ticket.filter({
      order_id: { $in: onlineOrders.map(o => o.id) }
    });

    let recipients = [];

    // Add online passengers
    for (const order of onlineOrders) {
      const ticket = tickets.find(t => t.order_id === order.id);
      
      // Apply recipient filter
      if (recipient_filter === 'not_checked_in_only' && ticket?.checkin_status === 'checked_in') {
        continue;
      }

      recipients.push({
        name: order.passenger_name,
        phone: order.passenger_phone,
        seat: order.seat_code || 'N/A',
        ticket_code: ticket?.ticket_code || 'N/A'
      });
    }

    // Add offline passengers
    for (const sale of offlineSales) {
      recipients.push({
        name: sale.passenger_name,
        phone: sale.passenger_phone,
        seat: sale.seat_code || 'N/A',
        ticket_code: sale.receipt_number_optional || sale.id.slice(0, 8)
      });
    }

    if (recipients.length === 0) {
      return Response.json({ 
        message: 'No recipients found',
        recipients_count: 0 
      });
    }

    // Get template
    const templates = await base44.asServiceRole.entities.MessageTemplate.filter({
      operator_id: trip.operator_id,
      template_type: template_type,
      language: "EN" // TODO: Add user language preference
    });
    
    let template = templates[0];
    if (!template) {
      return Response.json({ error: 'Template not found' }, { status: 404 });
    }

    // Send messages
    const sentCount = recipients.length;
    
    // Placeholder variables
    const placeholders = {
      operator_name: operator.name,
      branch: branch?.branch_name || trip.departure_branch_id,
      origin: route.origin_city,
      destination: route.destination_city,
      date: new Date(trip.departure_datetime).toLocaleDateString('en-GB'),
      time: new Date(trip.departure_datetime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      new_time: custom_data?.new_time || '',
      new_date: custom_data?.new_date || '',
      new_seat: custom_data?.new_seat || ''
    };

    // Send to each recipient (in production, batch this)
    for (const recipient of recipients) {
      let message = template.content_text;
      
      // Replace placeholders
      message = message.replace(/{seat}/g, recipient.seat);
      message = message.replace(/{ticket_code}/g, recipient.ticket_code);
      
      for (const [key, value] of Object.entries(placeholders)) {
        message = message.replace(new RegExp(`{${key}}`, 'g'), value);
      }

      // In production: send via WhatsApp/SMS API
      console.log(`Sending to ${recipient.phone}:`, message);
    }

    // Log notification batch
    await base44.asServiceRole.entities.NotificationBatchLog.create({
      operator_id: trip.operator_id,
      trip_id: trip_id,
      batch_type: template_type.includes('reminder') ? 'reminder' : 
                  template_type === 'delay_notice' ? 'delay' :
                  template_type === 'cancel_notice' ? 'cancel' :
                  template_type === 'boarding_open' ? 'boarding_open' : 'manual',
      channel: operatorSettings?.reminder_channel_preference === 'whatsapp_and_sms' ? 'whatsapp' : 'whatsapp',
      recipients_count: sentCount,
      message_preview: template.content_text.substring(0, 100),
      created_by_user_id: actor_user_id || null
    });

    // Log audit
    if (actor_user_id) {
      await base44.asServiceRole.entities.AuditLog.create({
        actor_user_id: actor_user_id,
        operator_id: trip.operator_id,
        action_type: 'trip_notification_sent',
        entity_type: 'Trip',
        entity_id: trip_id,
        payload_json: {
          template_type,
          recipients_count: sentCount
        }
      });
    }

    return Response.json({
      success: true,
      recipients_count: sentCount,
      message: `Sent ${sentCount} ${sentCount === 1 ? 'message' : 'messages'}`
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});