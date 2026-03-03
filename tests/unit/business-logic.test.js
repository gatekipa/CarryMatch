import { describe, it, expect } from 'vitest';
import {
  validatePromoCode,
  calculateDiscount,
  calculateCloseoutVariance,
  hasOperatorAccess,
  hasStaffPermission,
  calculateOrderTotal
} from '../../src/lib/business-logic';

// ── Promo Code Validation ───────────────────────────────────────────
describe('Promo Code Validation', () => {
  const validPromo = {
    status: 'active',
    discount_type: 'percentage',
    discount_value: 10,
    max_uses: 100,
    current_uses: 50,
    valid_from: '2025-01-01T00:00:00Z',
    valid_until: '2027-12-31T23:59:59Z'
  };

  it('accepts a valid promo code', () => {
    const result = validatePromoCode(validPromo);
    expect(result.valid).toBe(true);
    expect(result.discount_type).toBe('percentage');
  });

  it('rejects null promo', () => {
    expect(validatePromoCode(null).valid).toBe(false);
  });

  it('rejects inactive promo', () => {
    expect(validatePromoCode({ ...validPromo, status: 'disabled' }).valid).toBe(false);
  });

  it('rejects promo at usage limit', () => {
    const result = validatePromoCode({ ...validPromo, current_uses: 100 });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('limit reached');
  });

  it('rejects promo not yet valid', () => {
    const future = { ...validPromo, valid_from: '2030-01-01T00:00:00Z' };
    expect(validatePromoCode(future).valid).toBe(false);
  });

  it('rejects expired promo', () => {
    const expired = { ...validPromo, valid_until: '2020-01-01T00:00:00Z' };
    expect(validatePromoCode(expired).valid).toBe(false);
  });

  it('accepts promo with no usage limit', () => {
    const noLimit = { ...validPromo, max_uses: null, current_uses: 999 };
    expect(validatePromoCode(noLimit).valid).toBe(true);
  });
});

// ── Discount Calculation ────────────────────────────────────────────
describe('Discount Calculation', () => {
  it('calculates percentage discount', () => {
    expect(calculateDiscount(10000, { discount_type: 'percentage', discount_value: 10 })).toBe(1000);
  });

  it('calculates fixed discount', () => {
    expect(calculateDiscount(10000, { discount_type: 'fixed', discount_value: 2000 })).toBe(2000);
  });

  it('caps fixed discount at subtotal', () => {
    expect(calculateDiscount(1000, { discount_type: 'fixed', discount_value: 5000 })).toBe(1000);
  });

  it('returns 0 for null promo', () => {
    expect(calculateDiscount(10000, null)).toBe(0);
  });

  it('rounds percentage discount', () => {
    expect(calculateDiscount(3333, { discount_type: 'percentage', discount_value: 15 })).toBe(500);
  });
});

// ── Daily Closeout Variance ─────────────────────────────────────────
describe('Closeout Variance', () => {
  it('calculates zero variance when totals match', () => {
    const expected = { cash: 50000, momo: 30000, orange: 20000, other: 0 };
    const counted = { cash: 50000, momo: 30000, orange: 20000, other: 0 };
    const { variance, totalVariance } = calculateCloseoutVariance(expected, counted);
    expect(totalVariance).toBe(0);
    expect(variance.cash).toBe(0);
  });

  it('detects positive variance (overage)', () => {
    const expected = { cash: 50000, momo: 0, orange: 0, other: 0 };
    const counted = { cash: 52000, momo: 0, orange: 0, other: 0 };
    const { variance, totalVariance } = calculateCloseoutVariance(expected, counted);
    expect(totalVariance).toBe(2000);
    expect(variance.cash).toBe(2000);
  });

  it('detects negative variance (shortage)', () => {
    const expected = { cash: 50000, momo: 30000, orange: 0, other: 0 };
    const counted = { cash: 48000, momo: 30000, orange: 0, other: 0 };
    const { totalVariance } = calculateCloseoutVariance(expected, counted);
    expect(totalVariance).toBe(-2000);
  });

  it('handles missing payment methods gracefully', () => {
    const expected = { cash: 10000 };
    const counted = { cash: 10000 };
    const { totalVariance } = calculateCloseoutVariance(expected, counted);
    expect(totalVariance).toBe(0);
  });
});

// ── Permission Checks ───────────────────────────────────────────────
describe('Operator Access', () => {
  const staff = [
    { user_id: 'admin@bus.com', operator_id: 'op_1', status: 'active', staff_role: 'vendor_bus_operator' },
    { user_id: 'agent@bus.com', operator_id: 'op_1', status: 'active', staff_role: 'vendor_bus_agent', can_refund: false },
    { user_id: 'fired@bus.com', operator_id: 'op_1', status: 'inactive', staff_role: 'vendor_bus_agent' },
    { user_id: 'agent@bus.com', operator_id: 'op_2', status: 'active', staff_role: 'vendor_bus_checkin' }
  ];

  it('grants access to active staff', () => {
    expect(hasOperatorAccess(staff, 'admin@bus.com', 'op_1')).toBe(true);
  });

  it('denies access to inactive staff', () => {
    expect(hasOperatorAccess(staff, 'fired@bus.com', 'op_1')).toBe(false);
  });

  it('denies access to unknown user', () => {
    expect(hasOperatorAccess(staff, 'stranger@test.com', 'op_1')).toBe(false);
  });

  it('scopes access to specific operator', () => {
    expect(hasOperatorAccess(staff, 'admin@bus.com', 'op_2')).toBe(false);
  });

  it('handles null inputs', () => {
    expect(hasOperatorAccess(null, 'admin@bus.com', 'op_1')).toBe(false);
    expect(hasOperatorAccess(staff, null, 'op_1')).toBe(false);
  });
});

describe('Staff Permissions', () => {
  it('grants all permissions to operator role', () => {
    const operator = { staff_role: 'vendor_bus_operator' };
    expect(hasStaffPermission(operator, 'refund')).toBe(true);
    expect(hasStaffPermission(operator, 'override_seat')).toBe(true);
  });

  it('denies refund to agent without permission', () => {
    const agent = { staff_role: 'vendor_bus_agent', can_refund: false };
    expect(hasStaffPermission(agent, 'refund')).toBe(false);
  });

  it('grants refund to agent with permission', () => {
    const agent = { staff_role: 'vendor_bus_agent', can_refund: true };
    expect(hasStaffPermission(agent, 'refund')).toBe(true);
  });

  it('denies for null staff record', () => {
    expect(hasStaffPermission(null, 'refund')).toBe(false);
  });
});

// ── Order Calculations ──────────────────────────────────────────────
describe('Order Total Calculation', () => {
  it('calculates correct subtotal', () => {
    const seats = [{ price_xaf: 5000 }, { price_xaf: 5000 }, { price_xaf: 7000 }];
    const { subtotal } = calculateOrderTotal(seats);
    expect(subtotal).toBe(17000);
  });

  it('calculates 5% platform fee by default', () => {
    const seats = [{ price_xaf: 10000 }];
    const { fee } = calculateOrderTotal(seats);
    expect(fee).toBe(500);
  });

  it('calculates custom fee percentage', () => {
    const seats = [{ price_xaf: 10000 }];
    const { fee } = calculateOrderTotal(seats, 10);
    expect(fee).toBe(1000);
  });

  it('calculates net to operator', () => {
    const seats = [{ price_xaf: 20000 }];
    const { subtotal, fee, netToOperator } = calculateOrderTotal(seats);
    expect(netToOperator).toBe(subtotal - fee);
    expect(netToOperator).toBe(19000);
  });

  it('handles empty seats array', () => {
    const { subtotal, fee, netToOperator } = calculateOrderTotal([]);
    expect(subtotal).toBe(0);
    expect(fee).toBe(0);
    expect(netToOperator).toBe(0);
  });

  it('handles seats with missing price', () => {
    const seats = [{ price_xaf: 5000 }, { seat_code: 'B1' }];
    const { subtotal } = calculateOrderTotal(seats);
    expect(subtotal).toBe(5000);
  });
});
