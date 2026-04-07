-- FIX 1: Staff RLS — Allow vendor_staff members to access their vendor's data
-- Currently only owner_user_id is checked. This adds permissive OR policies for staff.
-- Existing owner-based policies are NOT dropped (Postgres uses OR across permissive policies).

-- 1. Helper function: checks if the current user is an active staff member for a given vendor
CREATE OR REPLACE FUNCTION public.is_vendor_staff_member(p_vendor_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.vendor_staff vs
    WHERE vs.vendor_id = p_vendor_id
      AND vs.user_id = auth.uid()
      AND vs.status = 'active'
  );
$$;

-- 2. vendor_staff: staff can read their OWN staff record (needed for AuthContext to resolve role)
CREATE POLICY vendor_staff_select_self
  ON public.vendor_staff
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 3. vendors: staff can read the vendor they belong to (needed for AuthContext to load vendor)
CREATE POLICY vendors_select_as_staff
  ON public.vendors
  FOR SELECT
  TO authenticated
  USING (public.is_vendor_staff_member(id));

-- 4. vendor_shipments: staff SELECT / INSERT / UPDATE
CREATE POLICY vendor_shipments_select_as_staff
  ON public.vendor_shipments
  FOR SELECT
  TO authenticated
  USING (public.is_vendor_staff_member(vendor_id));

CREATE POLICY vendor_shipments_insert_as_staff
  ON public.vendor_shipments
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_vendor_staff_member(vendor_id));

CREATE POLICY vendor_shipments_update_as_staff
  ON public.vendor_shipments
  FOR UPDATE
  TO authenticated
  USING (public.is_vendor_staff_member(vendor_id))
  WITH CHECK (public.is_vendor_staff_member(vendor_id));

-- 5. vendor_customers: staff SELECT / INSERT / UPDATE
CREATE POLICY vendor_customers_select_as_staff
  ON public.vendor_customers
  FOR SELECT
  TO authenticated
  USING (public.is_vendor_staff_member(vendor_id));

CREATE POLICY vendor_customers_insert_as_staff
  ON public.vendor_customers
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_vendor_staff_member(vendor_id));

CREATE POLICY vendor_customers_update_as_staff
  ON public.vendor_customers
  FOR UPDATE
  TO authenticated
  USING (public.is_vendor_staff_member(vendor_id))
  WITH CHECK (public.is_vendor_staff_member(vendor_id));

-- 6. vendor_batches: staff SELECT / INSERT / UPDATE
CREATE POLICY vendor_batches_select_as_staff
  ON public.vendor_batches
  FOR SELECT
  TO authenticated
  USING (public.is_vendor_staff_member(vendor_id));

CREATE POLICY vendor_batches_insert_as_staff
  ON public.vendor_batches
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_vendor_staff_member(vendor_id));

CREATE POLICY vendor_batches_update_as_staff
  ON public.vendor_batches
  FOR UPDATE
  TO authenticated
  USING (public.is_vendor_staff_member(vendor_id))
  WITH CHECK (public.is_vendor_staff_member(vendor_id));

-- 7. vendor_branches: staff SELECT / INSERT / UPDATE / DELETE
CREATE POLICY vendor_branches_select_as_staff
  ON public.vendor_branches
  FOR SELECT
  TO authenticated
  USING (public.is_vendor_staff_member(vendor_id));

CREATE POLICY vendor_branches_insert_as_staff
  ON public.vendor_branches
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_vendor_staff_member(vendor_id));

CREATE POLICY vendor_branches_update_as_staff
  ON public.vendor_branches
  FOR UPDATE
  TO authenticated
  USING (public.is_vendor_staff_member(vendor_id))
  WITH CHECK (public.is_vendor_staff_member(vendor_id));

CREATE POLICY vendor_branches_delete_as_staff
  ON public.vendor_branches
  FOR DELETE
  TO authenticated
  USING (public.is_vendor_staff_member(vendor_id));

-- 8. vendor_notifications: staff SELECT / INSERT
CREATE POLICY vendor_notifications_select_as_staff
  ON public.vendor_notifications
  FOR SELECT
  TO authenticated
  USING (public.is_vendor_staff_member(vendor_id));

CREATE POLICY vendor_notifications_insert_as_staff
  ON public.vendor_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_vendor_staff_member(vendor_id));

-- 9. vendor_shipment_status_history: staff SELECT / INSERT
CREATE POLICY vendor_shipment_status_history_select_as_staff
  ON public.vendor_shipment_status_history
  FOR SELECT
  TO authenticated
  USING (public.is_vendor_staff_member(vendor_id));

CREATE POLICY vendor_shipment_status_history_insert_as_staff
  ON public.vendor_shipment_status_history
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_vendor_staff_member(vendor_id));
