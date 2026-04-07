/**
 * Currency conversion utilities for cents ↔ dollars.
 * PRD 7.6.10: all monetary values stored as integers in cents.
 */

/**
 * Convert a dollar amount (user input) to integer cents for storage.
 * @param {number|string} dollars - Dollar amount (e.g. 25.50)
 * @returns {number} Integer cents (e.g. 2550)
 */
export function toCents(dollars) {
  const n = Number(dollars);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

/**
 * Convert integer cents from storage to a dollar amount for display.
 * @param {number|string} cents - Integer cents (e.g. 2550)
 * @returns {number} Dollar amount (e.g. 25.50)
 */
export function fromCents(cents) {
  const n = Number(cents);
  if (!Number.isFinite(n)) return 0;
  return n / 100;
}
