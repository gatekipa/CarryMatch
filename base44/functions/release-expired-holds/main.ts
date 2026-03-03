import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Background job to release expired seat holds
 * Should be called periodically (e.g., every 5 minutes via cron)
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all held seats with expired holds
    const allSeats = await base44.asServiceRole.entities.TripSeatInventory.filter({
      seat_status: 'held'
    });
    
    const now = new Date();
    const expiredSeats = allSeats.filter(seat => {
      if (!seat.held_until) return false;
      return new Date(seat.held_until) < now;
    });
    
    console.log(`Found ${expiredSeats.length} expired holds to release`);
    
    let released = 0;
    for (const seat of expiredSeats) {
      try {
        // Release the seat
        await base44.asServiceRole.entities.TripSeatInventory.update(seat.id, {
          seat_status: 'available',
          held_until: null,
          held_by_order_id: null
        });
        
        // Create audit log
        await base44.asServiceRole.entities.AuditLog.create({
          actor_user_id: 'system',
          action_type: 'hold_expired',
          entity_type: 'TripSeatInventory',
          entity_id: seat.id,
          payload_json: {
            trip_id: seat.trip_id,
            seat_code: seat.seat_code,
            held_until: seat.held_until,
            held_by: seat.held_by_order_id
          }
        });
        
        released++;
      } catch (error) {
        console.error(`Failed to release seat ${seat.id}:`, error);
      }
    }
    
    return Response.json({
      success: true,
      checked: allSeats.length,
      expired: expiredSeats.length,
      released: released
    });
    
  } catch (error) {
    console.error('Error releasing expired holds:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});