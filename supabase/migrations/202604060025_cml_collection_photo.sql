-- FEATURE 2: Collection photo support

-- Add collection_photo_url to vendor_shipments
ALTER TABLE public.vendor_shipments
  ADD COLUMN IF NOT EXISTS collection_photo_url text;

-- Note: Supabase Storage bucket 'shipment-photos' should be created via the dashboard
-- or using: INSERT INTO storage.buckets (id, name, public) VALUES ('shipment-photos', 'shipment-photos', false);
-- For now, we just add the column. Bucket creation is a manual step.
