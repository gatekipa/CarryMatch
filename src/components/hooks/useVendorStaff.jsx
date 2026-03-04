import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

/**
 * Robust hook to find the current user's VendorStaff record.
 *
 * Lookup order:
 * 1. VendorStaff where email = userEmail AND status = "ACTIVE"
 * 2. VendorStaff where email = userEmail (any status)
 * 3. Vendor where primary_contact_email = userEmail  →  auto-create VendorStaff
 *
 * Step 3 is the self-healing fallback: if PartnerSignup created a Vendor but
 * VendorStaff creation silently failed (or wasn't indexed yet), the dashboard
 * will still work by creating the missing VendorStaff on the fly.
 */
export function useVendorStaff(userEmail) {
  return useQuery({
    queryKey: ['vendor-staff-me', userEmail],
    queryFn: async () => {
      if (!userEmail) return null;

      // ---- Step 1: exact email + ACTIVE status ----
      try {
        const staff = await base44.entities.VendorStaff.filter({
          email: userEmail,
          status: "ACTIVE"
        });
        if (staff[0]) return staff[0];
      } catch (e) {
        console.warn("[useVendorStaff] Step 1 filter failed:", e);
      }

      // ---- Step 2: email only (any status) ----
      try {
        const staffAny = await base44.entities.VendorStaff.filter({
          email: userEmail
        });
        if (staffAny[0]) return staffAny[0];
      } catch (e) {
        console.warn("[useVendorStaff] Step 2 filter failed:", e);
      }

      // ---- Step 3: Vendor fallback → auto-create VendorStaff ----
      try {
        const emailLower = userEmail.toLowerCase();
        const vendors = await base44.entities.Vendor.filter({
          primary_contact_email: emailLower
        });

        if (vendors[0]) {
          console.log("[useVendorStaff] Found orphan Vendor", vendors[0].id,
            "— auto-creating VendorStaff for", userEmail);

          // Guard: re-check VendorStaff one more time (race with retry)
          const recheck = await base44.entities.VendorStaff.filter({ email: userEmail });
          if (recheck[0]) return recheck[0];

          const created = await base44.entities.VendorStaff.create({
            vendor_id: vendors[0].id,
            email: userEmail,
            full_name: vendors[0].primary_contact_name || "Owner",
            role: "OWNER",
            status: "ACTIVE"
          });
          console.log("[useVendorStaff] Auto-created VendorStaff:", created?.id);
          return created;
        }
      } catch (e) {
        console.warn("[useVendorStaff] Step 3 vendor fallback failed:", e);
      }

      return null;
    },
    enabled: !!userEmail,
    staleTime: 15 * 1000,
    refetchOnMount: 'always',
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1500 * (attemptIndex + 1), 5000)
  });
}
