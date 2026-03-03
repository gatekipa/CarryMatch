import { describe, it, expect } from 'vitest';
import { checkSalesWindow } from '../../src/lib/business-logic';

describe('Sales Window Check', () => {
  const defaultSettings = {
    online_sales_open_days_ahead: 60,
    offline_sales_open_days_ahead: 90,
    sales_close_minutes_before_departure: 30,
    allow_same_day_sales: true,
    allow_last_minute_online: false
  };

  function tripDepartingIn(minutes) {
    const departure = new Date(Date.now() + minutes * 60 * 1000);
    return { departure_datetime: departure.toISOString(), operator_id: 'op_1' };
  }

  function tripDepartingInDays(days) {
    const departure = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    return { departure_datetime: departure.toISOString(), operator_id: 'op_1' };
  }

  it('allows purchase for trip just over 2 hours from now (online)', () => {
    const result = checkSalesWindow(tripDepartingIn(121), defaultSettings, 'online');
    expect(result.eligible).toBe(true);
  });

  it('allows purchase for trip 3 hours from now (online)', () => {
    const result = checkSalesWindow(tripDepartingIn(180), defaultSettings, 'online');
    expect(result.eligible).toBe(true);
  });

  it('blocks sales within close window (30 min)', () => {
    const result = checkSalesWindow(tripDepartingIn(20), defaultSettings, 'online');
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('Sales closed');
    expect(result.requiresOverride).toBe(true);
  });

  it('blocks online sales too far ahead (61 days)', () => {
    const result = checkSalesWindow(tripDepartingInDays(61), defaultSettings, 'online');
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('60 days ahead');
  });

  it('allows offline sales further ahead than online', () => {
    const trip = tripDepartingInDays(75);
    const onlineResult = checkSalesWindow(trip, defaultSettings, 'online');
    const offlineResult = checkSalesWindow(trip, defaultSettings, 'offline');
    expect(onlineResult.eligible).toBe(false);
    expect(offlineResult.eligible).toBe(true);
  });

  it('blocks same-day sales when disabled', () => {
    const noSameDay = { ...defaultSettings, allow_same_day_sales: false };
    const trip = tripDepartingIn(180); // 3 hours, same day
    const result = checkSalesWindow(trip, noSameDay, 'online');
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain('Same-day');
  });

  it('allows last-minute online when enabled', () => {
    const lastMinuteOk = { ...defaultSettings, allow_last_minute_online: true };
    const trip = tripDepartingIn(90); // 1.5 hours
    const result = checkSalesWindow(trip, lastMinuteOk, 'online');
    expect(result.eligible).toBe(true);
  });

  it('returns loading state for null trip', () => {
    const result = checkSalesWindow(null, defaultSettings);
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('Loading...');
  });

  it('returns loading state for null settings', () => {
    const result = checkSalesWindow(tripDepartingIn(120), null);
    expect(result.eligible).toBe(false);
  });

  it('provides minutesUntilDeparture when eligible', () => {
    const result = checkSalesWindow(tripDepartingInDays(5), defaultSettings, 'offline');
    expect(result.eligible).toBe(true);
    expect(result.minutesUntilDeparture).toBeGreaterThan(0);
  });
});
