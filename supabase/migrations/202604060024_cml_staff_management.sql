-- FEATURE 1: Staff Management — enable invited status + nullable user_id

-- 1. Update status CHECK to include 'invited'
ALTER TABLE public.vendor_staff
  DROP CONSTRAINT IF EXISTS vendor_staff_status_check;

ALTER TABLE public.vendor_staff
  ADD CONSTRAINT vendor_staff_status_check
  CHECK (status IN ('active', 'inactive', 'invited'));

-- 2. Make user_id nullable (for invited staff who haven't signed up yet)
ALTER TABLE public.vendor_staff
  ALTER COLUMN user_id DROP NOT NULL;

-- 3. Drop the single-user unique constraint and add vendor+email unique instead
ALTER TABLE public.vendor_staff
  DROP CONSTRAINT IF EXISTS vendor_staff_user_id_key;

-- Only enforce uniqueness on non-null user_ids per vendor
CREATE UNIQUE INDEX IF NOT EXISTS vendor_staff_vendor_user_unique
  ON public.vendor_staff (vendor_id, user_id)
  WHERE user_id IS NOT NULL;

-- Ensure one invitation per email per vendor
CREATE UNIQUE INDEX IF NOT EXISTS vendor_staff_vendor_email_unique
  ON public.vendor_staff (vendor_id, email)
  WHERE status != 'inactive';

-- 4. Owner can DELETE staff (for removal)
CREATE POLICY vendor_staff_delete_own_vendor
  ON public.vendor_staff
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vendors
      WHERE vendors.id = vendor_staff.vendor_id
        AND vendors.owner_user_id = auth.uid()
    )
  );

-- 5. Update is_vendor_staff_member to also match by email for invited staff
-- (This allows the AuthContext staff-fallback to work when linking)
