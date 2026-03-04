import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const LS_KEY = "carrymatch_vendor_staff";

/**
 * Robust hook to find the current user's VendorStaff record.
 *
 * IMPORTANT: Base44's .filter() has a significant indexing delay — records
 * created with .create() are NOT immediately returned by .filter().
 * This was confirmed by console logs showing .filter() returning empty
 * results even 6+ seconds after .create() returned a valid ID.
 *
 * Lookup order (first match wins):
 *  0. localStorage cache  (instant — set by PartnerSignup after .create())
 *  1. VendorStaff.filter({ email, status: "ACTIVE" })
 *  2. VendorStaff.filter({ email })                  (any status)
 *  3. VendorStaff.list()  → client-side email match   (bypasses filter index)
 *  4. Vendor.filter({ primary_contact_email })  → auto-create VendorStaff
 */
export function useVendorStaff(userEmail) {
  return useQuery({
    queryKey: ['vendor-staff-me', userEmail],
    queryFn: async () => {
      if (!userEmail) return null;

      // ---- Step 0: localStorage cache (instant, no network) ----
      try {
        const cached = localStorage.getItem(LS_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.email === userEmail && parsed.vendor_id) {
            console.log("[useVendorStaff] ✅ Found in localStorage, vendor_id:", parsed.vendor_id);
            return parsed;
          }
        }
      } catch (e) {
        console.warn("[useVendorStaff] localStorage read failed:", e);
      }

      // ---- Step 1: exact email + ACTIVE status ----
      try {
        const staff = await base44.entities.VendorStaff.filter({
          email: userEmail,
          status: "ACTIVE"
        });
        if (staff[0]) {
          console.log("[useVendorStaff] ✅ Found via filter (email+ACTIVE)");
          // Backfill localStorage for future visits
          try { localStorage.setItem(LS_KEY, JSON.stringify(staff[0])); } catch {}
          return staff[0];
        }
      } catch (e) {
        console.warn("[useVendorStaff] Step 1 filter failed:", e);
      }

      // ---- Step 2: email only (any status) ----
      try {
        const staffAny = await base44.entities.VendorStaff.filter({
          email: userEmail
        });
        if (staffAny[0]) {
          console.log("[useVendorStaff] ✅ Found via filter (email-only)");
          try { localStorage.setItem(LS_KEY, JSON.stringify(staffAny[0])); } catch {}
          return staffAny[0];
        }
      } catch (e) {
        console.warn("[useVendorStaff] Step 2 filter failed:", e);
      }

      // ---- Step 3: list ALL VendorStaff + client-side match ----
      // .list() may bypass the filter indexing delay
      try {
        const allStaff = await base44.entities.VendorStaff.list();
        const match = allStaff.find(s =>
          s.email === userEmail || s.email?.toLowerCase() === userEmail.toLowerCase()
        );
        if (match) {
          console.log("[useVendorStaff] ✅ Found via .list() client-side match");
          try { localStorage.setItem(LS_KEY, JSON.stringify(match)); } catch {}
          return match;
        }
      } catch (e) {
        console.warn("[useVendorStaff] Step 3 list() failed:", e);
      }

      // ---- Step 4: Vendor fallback → auto-create VendorStaff ----
      try {
        const emailLower = userEmail.toLowerCase();
        const vendors = await base44.entities.Vendor.filter({
          primary_contact_email: emailLower
        });

        if (vendors[0]) {
          console.log("[useVendorStaff] Found orphan Vendor", vendors[0].id,
            "— auto-creating VendorStaff for", userEmail);

          const created = await base44.entities.VendorStaff.create({
            vendor_id: vendors[0].id,
            email: userEmail,
            full_name: vendors[0].primary_contact_name || "Owner",
            role: "OWNER",
            status: "ACTIVE"
          });
          console.log("[useVendorStaff] ✅ Auto-created VendorStaff:", created?.id);
          // Cache in localStorage
          const record = created || {
            vendor_id: vendors[0].id,
            email: userEmail,
            full_name: vendors[0].primary_contact_name || "Owner",
            role: "OWNER",
            status: "ACTIVE"
          };
          try { localStorage.setItem(LS_KEY, JSON.stringify(record)); } catch {}
          return record;
        }
      } catch (e) {
        console.warn("[useVendorStaff] Step 4 vendor fallback failed:", e);
      }

      console.log("[useVendorStaff] ❌ No VendorStaff found for", userEmail);
      return null;
    },
    enabled: !!userEmail,
    staleTime: 15 * 1000,
    refetchOnMount: 'always',
    retry: 2,
    retryDelay: 2000
  });
}

/** Clear the localStorage cache (call on logout or when user changes) */
export function clearVendorStaffCache() {
  try { localStorage.removeItem(LS_KEY); } catch {}
}
