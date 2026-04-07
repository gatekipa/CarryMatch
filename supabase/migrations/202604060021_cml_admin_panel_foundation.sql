-- FIX 3: Admin Panel — admin_users table + info_requested status

-- 1. Admin users table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'cml_admin' CHECK (role IN ('super_admin', 'cml_admin'))
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.admin_users TO authenticated;

CREATE POLICY admin_users_select_self
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 2. Add 'info_requested' to vendor_applications status
ALTER TABLE public.vendor_applications
  DROP CONSTRAINT IF EXISTS vendor_applications_status_check;

ALTER TABLE public.vendor_applications
  ADD CONSTRAINT vendor_applications_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'info_requested'));

-- 3. Admin can SELECT all vendor_applications
CREATE POLICY vendor_applications_admin_select_all
  ON public.vendor_applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );

-- 4. Admin can UPDATE any vendor_application
CREATE POLICY vendor_applications_admin_update_all
  ON public.vendor_applications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );

-- 5. Admin can INSERT vendors (for approval flow)
CREATE POLICY vendors_admin_insert
  ON public.vendors
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );

-- 6. Admin can INSERT vendor_staff (for creating owner record during approval)
CREATE POLICY vendor_staff_admin_insert
  ON public.vendor_staff
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
  );
