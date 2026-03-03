import { describe, it, expect } from 'vitest';
import { generateTicketCode } from '../../src/lib/business-logic';

describe('Ticket Code Generation', () => {
  it('generates a code with correct prefix from operator ID', () => {
    const code = generateTicketCode('op_cameroon_express', 'A1');
    expect(code).toMatch(/^OP_/);
  });

  it('ends with the seat code', () => {
    const code = generateTicketCode('op_abc', 'B3');
    expect(code).toMatch(/B3$/);
  });

  it('is at least 11 characters long', () => {
    const code = generateTicketCode('op_abc', 'A1');
    // PREFIX(3) + TS(5) + RAND(3) + SEAT(2) = 13+
    expect(code.length).toBeGreaterThanOrEqual(11);
  });

  it('handles short operator IDs', () => {
    const code = generateTicketCode('AB', 'C1');
    expect(code.startsWith('AB')).toBe(true);
  });

  it('handles missing operator ID', () => {
    const code = generateTicketCode(null, 'A1');
    expect(code).toMatch(/^UNK/);
  });

  it('generates unique codes on consecutive calls', () => {
    const codes = new Set();
    for (let i = 0; i < 100; i++) {
      codes.add(generateTicketCode('op_test', 'A1'));
    }
    // With random component, should have high uniqueness
    expect(codes.size).toBeGreaterThan(90);
  });

  it('generates unique codes for different seats same operator', () => {
    const codeA1 = generateTicketCode('op_test', 'A1');
    const codeA2 = generateTicketCode('op_test', 'A2');
    expect(codeA1).not.toBe(codeA2);
  });
});
