import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { trip_id, cancel_reason } = await req.json();

    if (!trip_id || !cancel_reason) {
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

    // Update trip status
    await base44.asServiceRole.entities.Trip.update(trip_id, {
      trip_status: 'canceled'
    });

    // Create status update record
    await base44.asServiceRole.entities.TripStatusUpdate.create({
      trip_id: trip_id,
      update_type: 'canceled',
      message: cancel_reason,
      updated_by_user: user.email,
      notifications_sent: true
    });

    // Send cancellation notice
    const response = await base44.asServiceRole.functions.invoke('sendTemplateMessage', {
      trip_id: trip_id,
      template_type: 'cancel_notice',
      recipient_filter: 'all_ticket_holders',
      manual_send: true,
      actor_user_id: user.email
    });

    // Log audit
    await base44.asServiceRole.entities.AuditLog.create({
      actor_user_id: user.email,
      operator_id: (await base44.asServiceRole.entities.Trip.filter({ id: trip_id }))[0].operator_id,
      action_type: 'trip_canceled',
      entity_type: 'Trip',
      entity_id: trip_id,
      payload_json: {
        cancel_reason
      }
    });

    return Response.json({
      success: true,
      message: `Cancellation notice sent to ${response.data.recipients_count} ${response.data.recipients_count === 1 ? 'passenger' : 'passengers'}`,
      recipients_count: response.data.recipients_count
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});