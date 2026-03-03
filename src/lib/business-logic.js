/**
 * CarryMatch Business Logic — Extracted for testability
 * These functions encapsulate critical business rules used across the platform.
 */

// ── Ticket Code Generation ──────────────────────────────────────────
/**
 * Generate a unique ticket code for a bus ticket
 * Format: PREFIX(3) + TIMESTAMP(5) + RANDOM(3) + SEAT_CODE
 */
export function generateTicketCode(operatorId, seatCode) {
  const prefix = (operatorId || 'UNK').slice(0, 3).toUpperCase();
  const ts = Date.now().toString().slice(-5);
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}${ts}${rand}${seatCode}`;
}

// ── Trip Type Classification ────────────────────────────────────────
/**
 * Determine if a trip is a bus trip (has operator_id) vs P2P trip
 */
export function isBusTrip(trip) {
  return !!trip?.operator_id;
}

/**
 * Filter trips to P2P only (exclude bus trips)
 */
export function filterP2PTrips(trips) {
  return (trips || []).filter(t => t.status === 'active' && !t.operator_id);
}

/**
 * Filter trips to bus only
 */
export function filterBusTrips(trips) {
  return (trips || []).filter(t => t.trip_status && t.operator_id);
}

// ── Sales Window Check ──────────────────────────────────────────────
/**
 * Check if sales are currently allowed for a trip
 * @param {Object} trip - Trip entity with departure_datetime
 * @param {Object} settings - Operator settings
 * @param {string} channel - 'online' or 'offline'
 * @param {Date} now - Current time (injectable for testing)
 */
export function checkSalesWindow(trip, settings, channel = 'online', now = new Date()) {
  if (!trip || !settings) {
    return { eligible: false, reason: 'Loading...', requiresOverride: false };
  }

  const departure = new Date(trip.departure_datetime);
  const minutesUntilDeparture = (departure - now) / (1000 * 60);
  const daysUntilDeparture = (departure - now) / (1000 * 60 * 60 * 24);

  // Check if sales have closed
  if (minutesUntilDeparture < settings.sales_close_minutes_before_departure) {
    return {
      eligible: false,
      reason: `Sales closed ${settings.sales_close_minutes_before_departure} minutes before departure`,
      requiresOverride: true
    };
  }

  // Check same-day sales
  const isSameDay = departure.toDateString() === now.toDateString();
  if (isSameDay && !settings.allow_same_day_sales) {
    return { eligible: false, reason: 'Same-day sales not allowed', requiresOverride: true };
  }

  // Check if within sales window
  const maxDaysAhead = channel === 'online'
    ? settings.online_sales_open_days_ahead
    : settings.offline_sales_open_days_ahead;

  if (daysUntilDeparture > maxDaysAhead) {
    return {
      eligible: false,
      reason: `${channel === 'online' ? 'Online' : 'Offline'} sales open ${maxDaysAhead} days ahead`,
      requiresOverride: false
    };
  }

  // Check last-minute online restriction
  if (channel === 'online' && !settings.allow_last_minute_online) {
    if (minutesUntilDeparture < 120) {
      return { eligible: false, reason: 'Last-minute online purchases not allowed', requiresOverride: false };
    }
  }

  return {
    eligible: true,
    reason: null,
    minutesUntilDeparture: Math.round(minutesUntilDeparture),
    requiresOverride: false
  };
}

// ── Seat Hold Validation ────────────────────────────────────────────
/**
 * Check if a seat hold has expired
 */
export function isSeatHoldExpired(seat, now = new Date()) {
  if (!seat?.held_until) return true;
  return new Date(seat.held_until) < now;
}

/**
 * Calculate hold expiry time (15 min from now)
 */
export function calculateHoldExpiry(now = new Date()) {
  return new Date(now.getTime() + 15 * 60 * 1000).toISOString();
}

/**
 * Validate seat can be held
 */
export function canHoldSeat(seat) {
  if (!seat) return { ok: false, reason: 'Seat not found' };
  if (seat.seat_status !== 'available') {
    return { ok: false, reason: `Seat ${seat.seat_code} is not available (status: ${seat.seat_status})` };
  }
  return { ok: true };
}

/**
 * Validate seat is still held by user for checkout
 */
export function validateSeatForCheckout(seat, userEmail) {
  if (!seat) return { ok: false, reason: 'Seat not found' };
  if (seat.seat_status !== 'held') {
    return { ok: false, reason: `Seat ${seat.seat_code} is no longer held` };
  }
  if (seat.held_by_order_id !== userEmail) {
    return { ok: false, reason: `Seat ${seat.seat_code} is held by another user` };
  }
  if (isSeatHoldExpired(seat)) {
    return { ok: false, reason: 'Your reservation has expired. Please start again.' };
  }
  return { ok: true };
}

// ── Promo Code Validation ───────────────────────────────────────────
/**
 * Validate a promo code can be applied
 */
export function validatePromoCode(promo, now = new Date()) {
  if (!promo) return { valid: false, reason: 'Promo code not found' };
  if (promo.status !== 'active') return { valid: false, reason: 'Promo code is not active' };
  if (promo.max_uses && promo.current_uses >= promo.max_uses) {
    return { valid: false, reason: 'Promo code usage limit reached' };
  }
  if (promo.valid_from && new Date(promo.valid_from) > now) {
    return { valid: false, reason: 'Promo code is not yet valid' };
  }
  if (promo.valid_until && new Date(promo.valid_until) < now) {
    return { valid: false, reason: 'Promo code has expired' };
  }
  return { valid: true, discount_type: promo.discount_type, discount_value: promo.discount_value };
}

/**
 * Calculate discount amount
 */
export function calculateDiscount(subtotal, promo) {
  if (!promo || !promo.discount_type) return 0;
  if (promo.discount_type === 'percentage') {
    return Math.round(subtotal * (promo.discount_value / 100));
  }
  if (promo.discount_type === 'fixed') {
    return Math.min(promo.discount_value, subtotal);
  }
  return 0;
}

// ── Daily Closeout ──────────────────────────────────────────────────
/**
 * Calculate variance between expected and counted totals
 */
export function calculateCloseoutVariance(expected, counted) {
  const methods = ['cash', 'momo', 'orange', 'other'];
  const variance = {};
  let totalVariance = 0;

  for (const method of methods) {
    const exp = parseFloat(expected[method]) || 0;
    const cnt = parseFloat(counted[method]) || 0;
    variance[method] = cnt - exp;
    totalVariance += variance[method];
  }

  return { variance, totalVariance };
}

// ── Permission Checks ───────────────────────────────────────────────
/**
 * Check if user has staff access to an operator
 */
export function hasOperatorAccess(staffRecords, userEmail, operatorId) {
  if (!staffRecords || !userEmail || !operatorId) return false;
  return staffRecords.some(s =>
    s.user_id === userEmail &&
    s.operator_id === operatorId &&
    s.status === 'active'
  );
}

/**
 * Check if staff member has specific permission
 */
export function hasStaffPermission(staffRecord, permission) {
  if (!staffRecord) return false;
  if (staffRecord.staff_role === 'vendor_bus_operator') return true; // Operators have all permissions
  if (permission === 'refund') return staffRecord.can_refund === true;
  if (permission === 'override_seat') return staffRecord.can_override_seat_block === true;
  return false;
}

// ── Order Calculations ──────────────────────────────────────────────
/**
 * Calculate order totals from seat prices
 */
export function calculateOrderTotal(seats, platformFeePercent = 5) {
  const subtotal = seats.reduce((sum, seat) => sum + (seat.price_xaf || 0), 0);
  const fee = Math.max(200, Math.round(subtotal * (platformFeePercent / 100)));
  const netToOperator = subtotal;
  const total = subtotal + fee;
  return { subtotal, fee, netToOperator, total };
}
