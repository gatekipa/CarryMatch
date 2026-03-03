import { describe, it, expect } from 'vitest';
import {
  isSeatHoldExpired,
  calculateHoldExpiry,
  canHoldSeat,
  validateSeatForCheckout
} from '../../src/lib/business-logic';

describe('Seat Hold Logic', () => {
  describe('isSeatHoldExpired', () => {
    it('returns true when held_until is in the past', () => {
      const seat = { held_until: new Date(Date.now() - 60000).toISOString() };
      expect(isSeatHoldExpired(seat)).toBe(true);
    });

    it('returns false when held_until is in the future', () => {
      const seat = { held_until: new Date(Date.now() + 60000).toISOString() };
      expect(isSeatHoldExpired(seat)).toBe(false);
    });

    it('returns true when held_until is null', () => {
      expect(isSeatHoldExpired({ held_until: null })).toBe(true);
    });

    it('returns true when seat is null', () => {
      expect(isSeatHoldExpired(null)).toBe(true);
    });
  });

  describe('calculateHoldExpiry', () => {
    it('returns ISO string 15 minutes from now', () => {
      const now = new Date('2026-01-01T12:00:00Z');
      const expiry = calculateHoldExpiry(now);
      expect(expiry).toBe('2026-01-01T12:15:00.000Z');
    });

    it('returns a valid ISO date string', () => {
      const expiry = calculateHoldExpiry();
      expect(() => new Date(expiry)).not.toThrow();
      expect(new Date(expiry).getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('canHoldSeat', () => {
    it('allows holding an available seat', () => {
      const seat = { seat_code: 'A1', seat_status: 'available' };
      expect(canHoldSeat(seat)).toEqual({ ok: true });
    });

    it('rejects a held seat', () => {
      const seat = { seat_code: 'A1', seat_status: 'held' };
      const result = canHoldSeat(seat);
      expect(result.ok).toBe(false);
      expect(result.reason).toContain('not available');
    });

    it('rejects a sold seat', () => {
      const seat = { seat_code: 'B2', seat_status: 'sold_online' };
      expect(canHoldSeat(seat).ok).toBe(false);
    });

    it('rejects a blocked seat', () => {
      const seat = { seat_code: 'C3', seat_status: 'blocked' };
      expect(canHoldSeat(seat).ok).toBe(false);
    });

    it('rejects null seat', () => {
      expect(canHoldSeat(null).ok).toBe(false);
      expect(canHoldSeat(null).reason).toContain('not found');
    });
  });

  describe('validateSeatForCheckout', () => {
    const userEmail = 'buyer@test.com';

    it('passes when seat is held by user and not expired', () => {
      const seat = {
        seat_code: 'A1',
        seat_status: 'held',
        held_by_order_id: userEmail,
        held_until: new Date(Date.now() + 600000).toISOString()
      };
      expect(validateSeatForCheckout(seat, userEmail)).toEqual({ ok: true });
    });

    it('fails when seat is not held', () => {
      const seat = { seat_code: 'A1', seat_status: 'available', held_by_order_id: null };
      const result = validateSeatForCheckout(seat, userEmail);
      expect(result.ok).toBe(false);
      expect(result.reason).toContain('no longer held');
    });

    it('fails when seat is held by different user', () => {
      const seat = {
        seat_code: 'A1',
        seat_status: 'held',
        held_by_order_id: 'other@test.com',
        held_until: new Date(Date.now() + 600000).toISOString()
      };
      const result = validateSeatForCheckout(seat, userEmail);
      expect(result.ok).toBe(false);
      expect(result.reason).toContain('another user');
    });

    it('fails when hold has expired', () => {
      const seat = {
        seat_code: 'A1',
        seat_status: 'held',
        held_by_order_id: userEmail,
        held_until: new Date(Date.now() - 60000).toISOString()
      };
      const result = validateSeatForCheckout(seat, userEmail);
      expect(result.ok).toBe(false);
      expect(result.reason).toContain('expired');
    });

    it('fails for null seat', () => {
      expect(validateSeatForCheckout(null, userEmail).ok).toBe(false);
    });
  });
});
