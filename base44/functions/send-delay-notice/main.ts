import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { trip_id, new_departure_time, delay_reason, delay_minutes } = await req.json();

    if (!trip_id || !new_departure_time || !delay_reason) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Permission check: verify caller is operator staff
    const trips = await base44.asServiceRole.entities.Trip.filter({ id: trip_id });
    if (trips.length === 0) {
      return Response.json({ error: 'Trip not found' }, { status: 404 });
    }
    const tripData = trips[0];
    const staff = await base44.asServiceRole.entities.OperatorStaff.filter({
      user_id: user.email,
      operator_id: tripData.operator_id,
      status: 'active'
    });
    if (staff.length === 0 && user.role !== 'admin') {
      return Response.json({ error: 'Permission denied: not operator staff' }, { status: 403 });
    }

    // Update trip
    await base44.asServiceRole.entities.Trip.update(trip_id, {
      departure_datetime: new_departure_time,
      trip_status: 'delayed'
    });

    // Create status update record
    await base44.asServiceRole.entities.TripStatusUpdate.create({
      trip_id: trip_id,
      update_type: 'delayed',
      message: delay_reason,
      delay_minutes: delay_minutes || 0,
      new_eta: new_departure_time,
      updated_by_user: user.email,
      notifications_sent: true
    });

    // Send delay notice to all ticket holders
    const response = await base44.asServiceRole.functions.invoke('sendTemplateMessage', {
      trip_id: trip_id,
      template_type: 'delay_notice',
      recipient_filter: 'all_ticket_holders',
      custom_data: {
        new_time: new Date(new_departure_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
      },
      manual_send: true,
      actor_user_id: user.email
    });

    // Log audit
    await base44.asServiceRole.entities.AuditLog.create({
      actor_user_id: user.email,
      operator_id: (await base44.asServiceRole.entities.Trip.filter({ id: trip_id }))[0].operator_id,
      action_type: 'trip_delayed',
      entity_type: 'Trip',
      entity_id: trip_id,
      payload_json: {
        delay_reason,
        delay_minutes,
        new_time: new_departure_time
      }
    });

    return Response.json({
      success: true,
      message: `Delay notice sent to ${response.data.recipients_count} ${response.data.recipients_count === 1 ? 'passenger' : 'passengers'}`,
      recipients_count: response.data.recipients_count
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});