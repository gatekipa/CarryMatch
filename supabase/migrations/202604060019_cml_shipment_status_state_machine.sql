-- FIX 7: Shipment Status State Machine Enforcement
-- Creates a trigger that validates status transitions on vendor_shipments.
-- Invalid transitions raise an exception. Terminal states allow no further transitions.

CREATE OR REPLACE FUNCTION public.validate_shipment_status_transition()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  allowed text[];
BEGIN
  -- Skip if status is not changing
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  -- Define valid transitions per current status
  CASE OLD.status
    WHEN 'draft' THEN
      allowed := ARRAY['pending'];
    WHEN 'pending' THEN
      allowed := ARRAY['in_batch', 'cancelled'];
    WHEN 'in_batch' THEN
      allowed := ARRAY['in_transit', 'pending', 'cancelled'];
    WHEN 'in_transit' THEN
      allowed := ARRAY['arrived', 'delayed', 'customs_hold'];
    WHEN 'delayed' THEN
      allowed := ARRAY['in_transit', 'arrived', 'customs_hold'];
    WHEN 'customs_hold' THEN
      allowed := ARRAY['in_transit', 'arrived', 'delayed'];
    WHEN 'arrived' THEN
      allowed := ARRAY['ready_for_pickup', 'out_for_last_mile_delivery'];
    WHEN 'ready_for_pickup' THEN
      allowed := ARRAY['out_for_last_mile_delivery', 'collected'];
    WHEN 'out_for_last_mile_delivery' THEN
      allowed := ARRAY['collected'];
    WHEN 'collected' THEN
      allowed := ARRAY[]::text[];  -- terminal
    WHEN 'returned' THEN
      allowed := ARRAY[]::text[];  -- terminal
    WHEN 'cancelled' THEN
      allowed := ARRAY[]::text[];  -- terminal
    ELSE
      allowed := ARRAY[]::text[];
  END CASE;

  IF NEW.status = ANY(allowed) THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Invalid shipment status transition from "%" to "%"', OLD.status, NEW.status
    USING ERRCODE = 'check_violation';
END;
$$;

-- Attach trigger — fires before any update that changes the status column
CREATE TRIGGER enforce_shipment_status_transition
  BEFORE UPDATE OF status
  ON public.vendor_shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_shipment_status_transition();
