-- FIX 5: Convert all price columns from numeric(12,2) to integer (cents)
-- PRD 7.6.10 requires all monetary values stored as integers in cents.
-- This migration:
--   1. Multiplies existing decimal values by 100
--   2. Converts columns to integer type
--   3. Re-applies CHECK constraints

-- ============================================================
-- vendors: rate_per_kg, flat_fee_per_item
-- ============================================================

-- Multiply existing values by 100
UPDATE public.vendors
SET rate_per_kg = rate_per_kg * 100
WHERE rate_per_kg IS NOT NULL;

UPDATE public.vendors
SET flat_fee_per_item = flat_fee_per_item * 100
WHERE flat_fee_per_item IS NOT NULL;

-- Drop existing CHECK constraints
ALTER TABLE public.vendors
  DROP CONSTRAINT IF EXISTS vendors_rate_per_kg_check;
ALTER TABLE public.vendors
  DROP CONSTRAINT IF EXISTS vendors_flat_fee_per_item_check;

-- Convert to integer
ALTER TABLE public.vendors
  ALTER COLUMN rate_per_kg TYPE integer USING rate_per_kg::integer,
  ALTER COLUMN flat_fee_per_item TYPE integer USING flat_fee_per_item::integer;

-- Re-add CHECK constraints
ALTER TABLE public.vendors
  ADD CONSTRAINT vendors_rate_per_kg_check CHECK (rate_per_kg IS NULL OR rate_per_kg >= 0),
  ADD CONSTRAINT vendors_flat_fee_per_item_check CHECK (flat_fee_per_item IS NULL OR flat_fee_per_item >= 0);

-- ============================================================
-- vendor_shipments: base_price, discount_amount, total_price, amount_paid
-- ============================================================

-- Multiply existing values by 100
UPDATE public.vendor_shipments
SET
  base_price = base_price * 100,
  discount_amount = discount_amount * 100,
  total_price = total_price * 100,
  amount_paid = amount_paid * 100;

-- Drop existing CHECK constraints
ALTER TABLE public.vendor_shipments
  DROP CONSTRAINT IF EXISTS vendor_shipments_base_price_check;
ALTER TABLE public.vendor_shipments
  DROP CONSTRAINT IF EXISTS vendor_shipments_discount_amount_check;
ALTER TABLE public.vendor_shipments
  DROP CONSTRAINT IF EXISTS vendor_shipments_total_price_check;
ALTER TABLE public.vendor_shipments
  DROP CONSTRAINT IF EXISTS vendor_shipments_amount_paid_check;

-- Convert to integer
ALTER TABLE public.vendor_shipments
  ALTER COLUMN base_price TYPE integer USING base_price::integer,
  ALTER COLUMN discount_amount TYPE integer USING discount_amount::integer,
  ALTER COLUMN discount_amount SET DEFAULT 0,
  ALTER COLUMN total_price TYPE integer USING total_price::integer,
  ALTER COLUMN total_price SET DEFAULT 0,
  ALTER COLUMN amount_paid TYPE integer USING amount_paid::integer,
  ALTER COLUMN amount_paid SET DEFAULT 0;

-- Re-add CHECK constraints (amount_paid <= total_price still applies, both now in cents)
ALTER TABLE public.vendor_shipments
  ADD CONSTRAINT vendor_shipments_base_price_check CHECK (base_price IS NULL OR base_price >= 0),
  ADD CONSTRAINT vendor_shipments_discount_amount_check CHECK (discount_amount >= 0),
  ADD CONSTRAINT vendor_shipments_total_price_check CHECK (total_price >= 0),
  ADD CONSTRAINT vendor_shipments_amount_paid_check CHECK (amount_paid >= 0 AND amount_paid <= total_price);
