import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Checks all upcoming trips and triggers rebalancing where needed
 * Can be called via cron job or manually
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all active operators with auto-rebalance enabled
    const allSettings = await base44.asServiceRole.entities.OperatorSettings.filter({
      enable_auto_rebalance: true
    });

    const results = [];

    for (const setting of allSettings) {
      const rebalanceThreshold = setting.rebalance_minutes_before_departure || 60;
      
      // Find trips approaching the rebalance window
      const now = new Date();
      const windowStart = new Date(now.getTime() + rebalanceThreshold * 60 * 1000);
      const windowEnd = new Date(now.getTime() + (rebalanceThreshold + 10) * 60 * 1000);

      const trips = await base44.asServiceRole.entities.Trip.filter({
        operator_id: setting.operator_id,
        trip_status: { $in: ['scheduled', 'boarding'] },
        departure_datetime: {
          $gte: windowStart.toISOString(),
          $lte: windowEnd.toISOString()
        }
      });

      // Trigger rebalance for each eligible trip
      for (const trip of trips) {
        try {
          const rebalanceResponse = await base44.asServiceRole.functions.invoke('rebalanceSeats', {
            trip_id: trip.id,
            triggered_by: 'system',
            actor_user_id: 'auto-rebalance-cron'
          });

          results.push({
            trip_id: trip.id,
            operator_id: trip.operator_id,
            status: 'success',
            result: rebalanceResponse.data
          });
        } catch (error) {
          results.push({
            trip_id: trip.id,
            operator_id: trip.operator_id,
            status: 'error',
            error: error.message
          });
        }
      }
    }

    return Response.json({
      success: true,
      message: `Checked ${results.length} trip(s) for rebalancing`,
      results: results,
      total_operators: allSettings.length
    });

  } catch (error) {
    console.error('Auto-rebalance check error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});