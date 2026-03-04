import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const LS_KEY = "carrymatch_vendor_staff";

/**
 * Robust hook to find the current user's VendorStaff record.
 *
 * Base44's .filter() has a confirmed indexing delay — .create() succeeds but
 * .filter() returns empty for an extended period. We bypass .filter() entirely
 * and use .list() with client-side matching instead.
 *
 * Lookup order:
 *  1. localStorage (instant — populated by PartnerSignup or backfilled here)
 *  2. VendorStaff.list() → client-side email match (bypasses filter index)
 *  3. Vendor.list() → find matching vendor → auto-create VendorStaff
 */
export function useVendorStaff(userEmail) {
  return useQuery({
    queryKey: ['vendor-staff-me', userEmail],
    queryFn: async () => {
      if (!userEmail) return null;
      const emailLower = userEmail.toLowerCase();

      // ---- Step 1: localStorage (instant, no network) ----
      try {
        const cached = localStorage.getItem(LS_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.vendor_id &&
              (parsed.email === userEmail || parsed.email?.toLowerCase() === emailLower)) {
            console.log("[useVendorStaff] ✅ Step 1: Found in localStorage, vendor_id:", parsed.vendor_id);
            return parsed;
          }
        }
      } catch (e) {
        console.warn("[useVendorStaff] localStorage read error:", e);
      }

      // ---- Step 2: VendorStaff.list() + client-side email match ----
      console.log("[useVendorStaff] Step 2: Calling VendorStaff.list() for", userEmail);
      try {
        const allStaff = await base44.entities.VendorStaff.list();
        console.log("[useVendorStaff] Step 2: .list() returned", allStaff?.length, "records");

        if (allStaff && allStaff.length > 0) {
          // Try exact match first, then case-insensitive
          const match =
            allStaff.find(s => s.email === userEmail && s.status === "ACTIVE") ||
            allStaff.find(s => s.email?.toLowerCase() === emailLower && s.status === "ACTIVE") ||
            allStaff.find(s => s.email === userEmail) ||
            allStaff.find(s => s.email?.toLowerCase() === emailLower);

          if (match) {
            console.log("[useVendorStaff] ✅ Step 2: Found via .list(), id:", match.id, "vendor_id:", match.vendor_id);
            // Backfill localStorage for instant access on future loads
            try { localStorage.setItem(LS_KEY, JSON.stringify(match)); } catch {}
            return match;
          }

          // Log all emails for debugging if no match
          console.log("[useVendorStaff] Step 2: No email match. Emails in list:",
            allStaff.map(s => s.email).join(", "));
        }
      } catch (e) {
        console.warn("[useVendorStaff] Step 2: .list() failed:", e);
      }

      // ---- Step 3: Vendor.list() → find vendor by email → auto-create VendorStaff ----
      console.log("[useVendorStaff] Step 3: Trying Vendor.list() fallback");
      try {
        const allVendors = await base44.entities.Vendor.list();
        console.log("[useVendorStaff] Step 3: Vendor.list() returned", allVendors?.length, "records");

        if (allVendors && allVendors.length > 0) {
          const vendor = allVendors.find(v =>
            v.primary_contact_email === userEmail ||
            v.primary_contact_email === emailLower ||
            v.primary_contact_email?.toLowerCase() === emailLower
          );

          if (vendor) {
            console.log("[useVendorStaff] Step 3: Found orphan Vendor", vendor.id, "— auto-creating VendorStaff");

            try {
              const created = await base44.entities.VendorStaff.create({
                vendor_id: vendor.id,
                email: userEmail,
                full_name: vendor.primary_contact_name || "Owner",
                role: "OWNER",
                status: "ACTIVE"
              });
              const record = created || {
                vendor_id: vendor.id,
                email: userEmail,
                full_name: vendor.primary_contact_name || "Owner",
                role: "OWNER",
                status: "ACTIVE"
              };
              console.log("[useVendorStaff] ✅ Step 3: Auto-created VendorStaff:", record.id || "(no id)");
              try { localStorage.setItem(LS_KEY, JSON.stringify(record)); } catch {}
              return record;
            } catch (createErr) {
              console.warn("[useVendorStaff] Step 3: Auto-create failed:", createErr);
              // Even if create fails, return a synthetic record so dashboard can load
              const synthetic = {
                vendor_id: vendor.id,
                email: userEmail,
                full_name: vendor.primary_contact_name || "Owner",
                role: "OWNER",
                status: "ACTIVE",
                _synthetic: true
              };
              try { localStorage.setItem(LS_KEY, JSON.stringify(synthetic)); } catch {}
              return synthetic;
            }
          }
        }
      } catch (e) {
        console.warn("[useVendorStaff] Step 3: Vendor.list() failed:", e);
      }

      console.log("[useVendorStaff] ❌ No VendorStaff found for", userEmail);
      return null;
    },
    enabled: !!userEmail,
    staleTime: 30 * 1000,
    refetchOnMount: 'always',
    retry: 2,
    retryDelay: 2000
  });
}

/** Clear the localStorage cache (call on logout or when user changes) */
export function clearVendorStaffCache() {
  try { localStorage.removeItem(LS_KEY); } catch {}
}
