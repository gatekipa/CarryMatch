-- FIX 9: Customer Management — add notes and preferred_language to vendor_customers

ALTER TABLE public.vendor_customers
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'en';

ALTER TABLE public.vendor_customers
  ADD CONSTRAINT vendor_customers_preferred_language_check
  CHECK (preferred_language IS NULL OR preferred_language IN ('en', 'fr'));

CREATE INDEX IF NOT EXISTS idx_vendor_customers_email
  ON public.vendor_customers (vendor_id, email)
  WHERE email IS NOT NULL;
