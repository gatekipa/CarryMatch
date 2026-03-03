import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export function useSalesWindowCheck(trip, channel = 'online') {
  const { data: settings } = useQuery({
    queryKey: ['operator-settings', trip?.operator_id],
    queryFn: async () => {
      const settingsArr = await base44.entities.OperatorSettings.filter({ 
        operator_id: trip.operator_id 
      });
      return settingsArr[0] || {
        online_sales_open_days_ahead: 60,
        offline_sales_open_days_ahead: 90,
        sales_close_minutes_before_departure: 30,
        allow_same_day_sales: true,
        allow_last_minute_online: false
      };
    },
    enabled: !!trip
  });

  if (!trip || !settings) {
    return { eligible: false, reason: 'Loading...', settings: null };
  }

  const now = new Date();
  const departure = new Date(trip.departure_datetime);
  const minutesUntilDeparture = (departure - now) / (1000 * 60);
  const daysUntilDeparture = (departure - now) / (1000 * 60 * 60 * 24);

  // Check if sales have closed
  if (minutesUntilDeparture < settings.sales_close_minutes_before_departure) {
    return { 
      eligible: false, 
      reason: `Sales closed ${settings.sales_close_minutes_before_departure} minutes before departure`,
      settings,
      requiresOverride: true
    };
  }

  // Check if same-day sales are allowed
  const isSameDay = departure.toDateString() === now.toDateString();
  if (isSameDay && !settings.allow_same_day_sales) {
    return { 
      eligible: false, 
      reason: 'Same-day sales not allowed',
      settings,
      requiresOverride: true
    };
  }

  // Check if within sales window
  const maxDaysAhead = channel === 'online' 
    ? settings.online_sales_open_days_ahead 
    : settings.offline_sales_open_days_ahead;

  if (daysUntilDeparture > maxDaysAhead) {
    return { 
      eligible: false, 
      reason: `${channel === 'online' ? 'Online' : 'Offline'} sales open ${maxDaysAhead} days ahead`,
      settings,
      requiresOverride: false
    };
  }

  // Check last-minute online restriction
  if (channel === 'online' && !settings.allow_last_minute_online) {
    if (minutesUntilDeparture < 120) { // within 2 hours
      return { 
        eligible: false, 
        reason: 'Last-minute online purchases not allowed',
        settings,
        requiresOverride: false
      };
    }
  }

  return { 
    eligible: true, 
    reason: null,
    settings,
    minutesUntilDeparture: Math.round(minutesUntilDeparture),
    requiresOverride: false
  };
}