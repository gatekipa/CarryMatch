import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

const LS_KEY = "carrymatch_vendor_staff";

/**
 * Robust hook to find the current user's VendorStaff record.
 *
 * Lookup order:
 *  1. localStorage — validate vendor_id is real before trusting it
 *  2. VendorStaff.list() → client-side email match
 *  3. Vendor.list() → find matching vendor → auto-create VendorStaff
 */
export function useVendorStaff(userEmail) {
  return useQuery({
    queryKey: ['vendor-staff-me', userEmail],
    queryFn: async () => {
      if (!userEmail) return null;
      const emailLower = userEmail.toLowerCase();

      // ---- Step 1: localStorage + vendor validation ----
      try {
        const cached = localStorage.getItem(LS_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.vendor_id &&
              (parsed.email === userEmail || parsed.email?.toLowerCase() === emailLower)) {
            console.log("[useVendorStaff] Step 1: Found in localStorage, validating vendor_id:", parsed.vendor_id);
            // Validate the vendor_id actually exists
            try {
              const vendors = await base44.entities.Vendor.filter({ id: parsed.vendor_id });
              if (vendors && vendors[0]) {
                console.log("[useVendorStaff] ✅ Step 1: localStorage + vendor valid");
                return parsed;
              }
            } catch {}
            // Vendor doesn't exist or 500'd — stale cache, clear it
            console.warn("[useVendorStaff] Step 1: vendor_id invalid, clearing localStorage");
            localStorage.removeItem(LS_KEY);
          }
        }
      } catch (e) {
        console.warn("[useVendorStaff] localStorage error:", e);
        try { localStorage.removeItem(LS_KEY); } catch {}
      }

      // ---- Step 2: VendorStaff.list() + client-side email match ----
      console.log("[useVendorStaff] Step 2: Calling VendorStaff.list() for", userEmail);
      try {
        const allStaff = await base44.entities.VendorStaff.list();
        console.log("[useVendorStaff] Step 2: .list() returned", allStaff?.length, "records");

        if (allStaff && allStaff.length > 0) {
          const match =
            allStaff.find(s => s.email === userEmail && s.status === "ACTIVE") ||
            allStaff.find(s => s.email?.toLowerCase() === emailLower && s.status === "ACTIVE") ||
            allStaff.find(s => s.email === userEmail) ||
            allStaff.find(s => s.email?.toLowerCase() === emailLower);

          if (match) {
            console.log("[useVendorStaff] ✅ Step 2: Found via .list(), id:", match.id, "vendor_id:", match.vendor_id);
            // Validate this vendor_id too before caching
            let vendorValid = false;
            try {
              const v = await base44.entities.Vendor.filter({ id: match.vendor_id });
              vendorValid = !!(v && v[0]);
            } catch {}
            if (vendorValid) {
              try { localStorage.setItem(LS_KEY, JSON.stringify(match)); } catch {}
              return match;
            } else {
              console.warn("[useVendorStaff] Step 2: Found staff but vendor_id", match.vendor_id, "is invalid, skipping");
            }
          }

          console.log("[useVendorStaff] Step 2: No match. Emails in list:",
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
            console.log("[useVendorStaff] Step 3: Found Vendor", vendor.id, "— creating VendorStaff");
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
              console.log("[useVendorStaff] ✅ Step 3: Created VendorStaff:", record.id || "(no id)");
              try { localStorage.setItem(LS_KEY, JSON.stringify(record)); } catch {}
              return record;
            } catch (createErr) {
              console.warn("[useVendorStaff] Step 3: Create failed:", createErr);
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

export function clearVendorStaffCache() {
  try { localStorage.removeItem(LS_KEY); } catch {}
}
