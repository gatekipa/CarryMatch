-- FIX 8: Subscription & Coupon System

CREATE TABLE IF NOT EXISTS public.coupon_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  code text NOT NULL UNIQUE,
  plan_tier text NOT NULL CHECK (plan_tier IN ('pro')),
  duration_months integer NOT NULL CHECK (duration_months > 0),
  status text NOT NULL DEFAULT 'unused' CHECK (status IN ('unused', 'active', 'expired')),
  vendor_id uuid REFERENCES public.vendors(id),
  generated_by_admin_id uuid REFERENCES public.admin_users(id),
  activated_at timestamptz,
  expires_at timestamptz
);

ALTER TABLE public.coupon_codes ENABLE ROW LEVEL SECURITY;

GRANT SELECT, UPDATE ON public.coupon_codes TO authenticated;

-- Vendors can see unused coupons (for lookup) and their own active coupons
CREATE POLICY coupon_codes_select_available
  ON public.coupon_codes
  FOR SELECT
  TO authenticated
  USING (status = 'unused' OR vendor_id IN (
    SELECT vs.vendor_id FROM public.vendor_staff vs WHERE vs.user_id = auth.uid() AND vs.status = 'active'
  ));

-- Vendors can update unused coupons to activate them
CREATE POLICY coupon_codes_update_activate
  ON public.coupon_codes
  FOR UPDATE
  TO authenticated
  USING (status = 'unused')
  WITH CHECK (true);

-- Add subscription fields to vendors
ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_source text;

ALTER TABLE public.vendors
  DROP CONSTRAINT IF EXISTS vendors_subscription_source_check;

ALTER TABLE public.vendors
  ADD CONSTRAINT vendors_subscription_source_check
  CHECK (subscription_source IS NULL OR subscription_source IN ('stripe', 'coupon', 'manual'));
