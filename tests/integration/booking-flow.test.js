import { describe, it, expect } from 'vitest';
import {
  canHoldSeat,
  validateSeatForCheckout,
  calculateHoldExpiry,
  isSeatHoldExpired,
  generateTicketCode,
  checkSalesWindow,
  validatePromoCode,
  calculateDiscount,
  calculateOrderTotal
} from '../../src/lib/business-logic';

/**
 * Integration tests simulating the full booking flow:
 * 1. Check sales window
 * 2. Hold seats
 * 3. Apply promo (optional)
 * 4. Validate seats at checkout
 * 5. Calculate order total
 * 6. Generate ticket codes
 */
describe('Full Booking Flow', () => {
  const settings = {
    online_sales_open_days_ahead: 60,
    offline_sales_open_days_ahead: 90,
    sales_close_minutes_before_departure: 30,
    allow_same_day_sales: true,
    allow_last_minute_online: true
  };

  const trip = {
    id: 'trip_100',
    operator_id: 'op_express',
    departure_datetime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // tomorrow
    trip_status: 'scheduled'
  };

  const seats = [
    { id: 's1', seat_code: 'A1', seat_status: 'available', price_xaf: 5000 },
    { id: 's2', seat_code: 'A2', seat_status: 'available', price_xaf: 5000 },
    { id: 's3', seat_code: 'B1', seat_status: 'available', price_xaf: 7000 }
  ];

  const userEmail = 'passenger@test.com';

  it('Step 1: Sales window is open', () => {
    const result = checkSalesWindow(trip, settings, 'online');
    expect(result.eligible).toBe(true);
  });

  it('Step 2: All seats can be held', () => {
    for (const seat of seats) {
      expect(canHoldSeat(seat)).toEqual({ ok: true });
    }
  });

  it('Step 2b: Hold expiry is 15 minutes out', () => {
    const expiry = calculateHoldExpiry();
    const expiryDate = new Date(expiry);
    const diff = expiryDate.getTime() - Date.now();
    // Should be approximately 15 minutes (±1 second tolerance)
    expect(diff).toBeGreaterThan(14 * 60 * 1000);
    expect(diff).toBeLessThan(16 * 60 * 1000);
  });

  it('Step 3: Promo code applies correctly', () => {
    const promo = {
      status: 'active',
      discount_type: 'percentage',
      discount_value: 20,
      max_uses: 50,
      current_uses: 10,
      valid_from: '2025-01-01',
      valid_until: '2027-12-31'
    };

    const validation = validatePromoCode(promo);
    expect(validation.valid).toBe(true);

    const { subtotal } = calculateOrderTotal(seats);
    expect(subtotal).toBe(17000);

    const discount = calculateDiscount(subtotal, promo);
    expect(discount).toBe(3400); // 20% of 17000
  });

  it('Step 4: Held seats validate at checkout', () => {
    const holdExpiry = calculateHoldExpiry();
    const heldSeats = seats.map(s => ({
      ...s,
      seat_status: 'held',
      held_by_order_id: userEmail,
      held_until: holdExpiry
    }));

    for (const seat of heldSeats) {
      expect(validateSeatForCheckout(seat, userEmail)).toEqual({ ok: true });
    }
  });

  it('Step 4b: Stolen seats fail checkout', () => {
    const stolenSeat = {
      ...seats[0],
      seat_status: 'held',
      held_by_order_id: 'thief@test.com',
      held_until: calculateHoldExpiry()
    };
    expect(validateSeatForCheckout(stolenSeat, userEmail).ok).toBe(false);
  });

  it('Step 5: Order total calculated correctly', () => {
    const { subtotal, fee, netToOperator } = calculateOrderTotal(seats);
    expect(subtotal).toBe(17000);
    expect(fee).toBe(850);
    expect(netToOperator).toBe(16150);
  });

  it('Step 6: Unique ticket codes generated', () => {
    const codes = seats.map(s => generateTicketCode(trip.operator_id, s.seat_code));
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(3); // All unique
    codes.forEach(code => {
      expect(code).toMatch(/^OP_/);
      expect(code.length).toBeGreaterThan(10);
    });
  });
});

describe('Edge Cases — Concurrent Booking Simulation', () => {
  it('detects expired hold at checkout time', () => {
    const expiredSeat = {
      seat_code: 'A1',
      seat_status: 'held',
      held_by_order_id: 'user@test.com',
      held_until: new Date(Date.now() - 1000).toISOString() // expired 1 second ago
    };
    const result = validateSeatForCheckout(expiredSeat, 'user@test.com');
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('expired');
  });

  it('detects seat sold by another channel', () => {
    const soldSeat = {
      seat_code: 'A1',
      seat_status: 'sold_offline',
      held_by_order_id: null
    };
    const result = validateSeatForCheckout(soldSeat, 'user@test.com');
    expect(result.ok).toBe(false);
  });

  it('hold not yet expired is valid', () => {
    const validHold = {
      seat_code: 'A1',
      seat_status: 'held',
      held_by_order_id: 'user@test.com',
      held_until: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 min remaining
    };
    expect(isSeatHoldExpired(validHold)).toBe(false);
    expect(validateSeatForCheckout(validHold, 'user@test.com').ok).toBe(true);
  });
});

describe('Edge Cases — Sales Window Boundaries', () => {
  const settings = {
    online_sales_open_days_ahead: 60,
    offline_sales_open_days_ahead: 90,
    sales_close_minutes_before_departure: 30,
    allow_same_day_sales: true,
    allow_last_minute_online: false
  };

  it('trip departing in exactly 30 minutes is closed', () => {
    const trip = { departure_datetime: new Date(Date.now() + 30 * 60 * 1000).toISOString() };
    // At exactly the boundary, should be blocked (< not <=)
    const result = checkSalesWindow(trip, settings, 'online');
    expect(result.eligible).toBe(false);
  });

  it('trip departing in 31 minutes is within last-minute restriction', () => {
    const trip = { departure_datetime: new Date(Date.now() + 31 * 60 * 1000).toISOString() };
    const result = checkSalesWindow(trip, settings, 'online');
    // 31 min < 120 min (2 hours) → last-minute block
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('Last-minute');
  });

  it('already-departed trip is closed', () => {
    const trip = { departure_datetime: new Date(Date.now() - 60 * 60 * 1000).toISOString() };
    const result = checkSalesWindow(trip, settings, 'online');
    expect(result.eligible).toBe(false);
  });
});
