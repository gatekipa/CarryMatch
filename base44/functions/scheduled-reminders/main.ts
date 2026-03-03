import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get all active operators
    const operators = await base44.asServiceRole.entities.BusOperator.filter({ status: "active" });

    let totalSent = 0;
    const results = [];

    for (const operator of operators) {
      // Get operator settings
      const settings = await base44.asServiceRole.entities.OperatorSettings.filter({ 
        operator_id: operator.id 
      });
      const operatorSettings = settings[0];
      
      if (!operatorSettings) continue;

      const reminderOffsets = operatorSettings.reminder_schedule_minutes_before || [180, 60, 30];
      const recipientFilter = operatorSettings.send_reminders_to || 'not_checked_in_only';

      // Get upcoming trips for this operator
      const now = new Date();
      const next4Hours = new Date(now.getTime() + 4 * 60 * 60 * 1000);

      const trips = await base44.asServiceRole.entities.Trip.filter({
        operator_id: operator.id,
        trip_status: { $in: ["scheduled", "boarding"] },
        departure_datetime: { 
          $gte: now.toISOString(),
          $lte: next4Hours.toISOString()
        }
      });

      for (const trip of trips) {
        const departureTime = new Date(trip.departure_datetime);
        const minutesUntilDeparture = Math.floor((departureTime - now) / (1000 * 60));

        // Check which reminder to send
        for (const offset of reminderOffsets) {
          // Send if within 5-minute window of the offset
          if (minutesUntilDeparture <= offset && minutesUntilDeparture > (offset - 5)) {
            const templateType = `reminder_${offset}`;
            
            // Check if already sent
            const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
            const existingBatch = await base44.asServiceRole.entities.NotificationBatchLog.filter({
              trip_id: trip.id,
              batch_type: 'reminder',
              created_date: { $gte: fiveMinutesAgo }
            });

            if (existingBatch.length > 0) {
              continue; // Already sent recently
            }

            // Send via sendTemplateMessage function
            const response = await base44.asServiceRole.functions.invoke('sendTemplateMessage', {
              trip_id: trip.id,
              template_type: templateType,
              recipient_filter: recipientFilter,
              manual_send: false,
              actor_user_id: null
            });

            if (response.data?.recipients_count > 0) {
              totalSent += response.data.recipients_count;
              results.push({
                trip_id: trip.id,
                offset: offset,
                sent: response.data.recipients_count
              });
            }
          }
        }
      }
    }

    return Response.json({
      success: true,
      total_messages_sent: totalSent,
      results: results
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});