import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// This function should be triggered by a cron job or scheduled task
// Call it every 15 minutes to check for trips that need reminders

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all active operators
    const operators = await base44.asServiceRole.entities.BusOperator.filter({ 
      status: "active" 
    });

    let totalRemindersSent = 0;
    const now = new Date();

    for (const operator of operators) {
      // Get operator reminder settings
      const settings = await base44.asServiceRole.entities.OperatorSettings.filter({ 
        operator_id: operator.id 
      });
      const operatorSettings = settings[0] || { reminder_schedule_minutes_before: [180, 60, 30] };
      
      const reminderSchedule = operatorSettings.reminder_schedule_minutes_before || [180, 60, 30];

      // Get upcoming trips in the next 4 hours (max reminder window)
      const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000);
      
      const upcomingTrips = await base44.asServiceRole.entities.Trip.filter({
        operator_id: operator.id,
        trip_status: { $in: ["scheduled", "boarding", "delayed"] },
        departure_datetime: {
          $gte: now.toISOString(),
          $lte: fourHoursFromNow.toISOString()
        }
      });

      for (const trip of upcomingTrips) {
        const departureTime = new Date(trip.departure_datetime);
        const minutesUntilDeparture = Math.floor((departureTime - now) / (1000 * 60));

        // Check if we should send a reminder
        for (const reminderMinutes of reminderSchedule) {
          // Send if we're within 5 minutes of the reminder time
          if (Math.abs(minutesUntilDeparture - reminderMinutes) <= 5) {
            // Check if we already sent this reminder
            const existingLogs = await base44.asServiceRole.entities.NotificationBatchLog.filter({
              trip_id: trip.id,
              batch_type: "reminder",
              created_date: {
                $gte: new Date(now.getTime() - 20 * 60 * 1000).toISOString() // Last 20 minutes
              }
            });

            if (existingLogs.length === 0) {
              // Get passengers not checked in
              const orders = await base44.asServiceRole.entities.Order.filter({
                trip_id: trip.id,
                order_status: "paid"
              });

              const tickets = await base44.asServiceRole.entities.Ticket.filter({
                order_id: { $in: orders.map(o => o.id) },
                checkin_status: "not_checked_in"
              });

              if (tickets.length > 0) {
                // Get route & branch info
                const routes = await base44.asServiceRole.entities.BusRoute.filter({ id: trip.route_id });
                const route = routes[0];

                const branches = trip.departure_branch_id 
                  ? await base44.asServiceRole.entities.OperatorBranch.filter({ id: trip.departure_branch_id })
                  : [];
                const branch = branches[0];

                const message = `⏰ Reminder: Your bus from ${route.origin_city} to ${route.destination_city} departs in ${reminderMinutes} minutes at ${departureTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}${branch ? ` from ${branch.branch_name}, ${branch.city}` : ''}. Please arrive early for check-in.`;

                // Send emails
                let emailsSent = 0;
                for (const ticket of tickets) {
                  const order = orders.find(o => o.id === ticket.order_id);
                  if (!order) continue;

                  try {
                    await base44.asServiceRole.integrations.Core.SendEmail({
                      to: order.user_id,
                      subject: `Boarding Reminder - ${route.origin_city} → ${route.destination_city}`,
                      from_name: operator.name,
                      body: `
                        <div style="font-family: Arial, sans-serif;">
                          <h2>${operator.name}</h2>
                          <p>Dear ${order.passenger_name},</p>
                          <p style="font-size: 16px; font-weight: bold; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b;">
                            ${message}
                          </p>
                          <hr/>
                          <p><strong>Your Ticket Details:</strong></p>
                          <ul>
                            <li><strong>Route:</strong> ${route.origin_city} → ${route.destination_city}</li>
                            <li><strong>Departure:</strong> ${departureTime.toLocaleString()}</li>
                            ${branch ? `<li><strong>Station:</strong> ${branch.branch_name}, ${branch.city}</li>` : ''}
                            <li><strong>Ticket Code:</strong> ${ticket.ticket_code}</li>
                          </ul>
                          <p>See you soon!<br/><strong>${operator.name}</strong></p>
                        </div>
                      `
                    });
                    emailsSent++;
                  } catch (e) {
                    console.error('Failed to send email:', e);
                  }
                }

                // Log the batch
                await base44.asServiceRole.entities.NotificationBatchLog.create({
                  operator_id: operator.id,
                  trip_id: trip.id,
                  batch_type: "reminder",
                  channel: "email",
                  recipients_count: emailsSent,
                  message_preview: message.substring(0, 200),
                  created_by_user_id: null
                });

                totalRemindersSent += emailsSent;
              }
            }
          }
        }
      }
    }

    return Response.json({
      success: true,
      reminders_sent: totalRemindersSent,
      checked_at: now.toISOString()
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});