import { supabase, supabaseConfigError } from "@/lib/supabaseClient";
import { resolveStoredCountryCode } from "@/features/cml-core/lib/countries";
import { toCents } from "@/features/cml-core/lib/currency";

const NON_FATAL_ONBOARDING_ERROR_CODES = new Set(["PGRST116", "42P01", "42501"]);

const normalizeErrorMessage = (fallbackMessage, error) =>
  error?.message || error?.error_description || fallbackMessage;

const isNonFatalOnboardingError = (error) =>
  NON_FATAL_ONBOARDING_ERROR_CODES.has(error?.code) ||
  error?.status === 401 ||
  error?.status === 403;

const splitLines = (value) =>
  String(value ?? "")
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);

const buildPartnerApplicationPayload = ({ sessionUser, preferredLanguage, form }) => ({
  user_id: sessionUser.id,
  email: sessionUser.email,
  full_name: form.fullName.trim(),
  company_name: form.companyName.trim(),
  phone: form.phone.trim(),
  whatsapp_number: form.whatsAppNumber.trim() || null,
  business_type: form.businessType.trim(),
  monthly_volume: form.monthlyVolume.trim() || null,
  corridors: splitLines(form.corridors),
  office_addresses: splitLines(form.officeAddresses),
  notes: form.notes.trim() || null,
  preferred_language: preferredLanguage,
  status: "pending",
});

const normalizeBranchEntries = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((entry) => ({
        id: entry?.id ?? null,
        branch_name: entry?.officeName?.trim() || "",
        country_code: resolveStoredCountryCode(entry?.countryCode) || "",
        city: entry?.city?.trim() || "",
        address_text: entry?.address?.trim() || "",
      }))
      .filter((entry) => entry.branch_name || entry.country_code || entry.city || entry.address_text);
  }

  return splitLines(value).map((entry) => {
    const [branchName, ...addressParts] = entry.split("|").map((part) => part.trim());
    return {
      id: null,
      branch_name: branchName,
      country_code: "",
      city: "",
      address_text: addressParts.join(" | ").trim(),
    };
  });
};

const mapBranchInputToRows = (value, vendorId) =>
  normalizeBranchEntries(value).map((entry) => ({
    id: entry.id,
    vendor_id: vendorId,
    branch_name: entry.branch_name,
    side: "destination",
    country_code: entry.country_code || null,
    city: entry.city || null,
    address_text: entry.address_text || null,
  }));

const toNullableNumber = (value) => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const buildVendorProfilePayload = ({ form, preferredLanguage }) => ({
  company_name: form.companyName.trim(),
  vendor_prefix: form.vendorPrefix.trim().toUpperCase(),
  default_origin_country: form.defaultOriginCountry.trim(),
  default_origin_city: form.defaultOriginCity.trim(),
  pricing_model: form.pricingModel,
  rate_per_kg: form.ratePerKg != null && form.ratePerKg !== "" ? toCents(form.ratePerKg) : null,
  flat_fee_per_item: form.flatFeePerItem != null && form.flatFeePerItem !== "" ? toCents(form.flatFeePerItem) : null,
  default_currency: form.defaultCurrency.trim().toUpperCase(),
  preferred_language: preferredLanguage,
});

async function maybeSingle(query) {
  const { data, error } = await query.maybeSingle();

  if (error) {
    if (error.code === "PGRST116") {
      return { data: null, error: null };
    }

    throw error;
  }

  return { data, error: null };
}

export async function loadOnboardingSnapshot(sessionUser) {
  if (!supabase || !sessionUser) {
    return {
      application: null,
      vendor: null,
      vendorStaff: null,
      vendorBranches: [],
      warning: supabase ? null : new Error(supabaseConfigError),
    };
  }

  try {
    const { data: application } = await maybeSingle(
      supabase.from("vendor_applications").select("*").eq("user_id", sessionUser.id),
    );

    // Try owner-path first: load vendor where user is the owner
    let { data: vendor } = await maybeSingle(
      supabase.from("vendors").select("*").eq("owner_user_id", sessionUser.id),
    );

    let vendorStaff = null;
    let vendorBranches = [];

    // Staff fallback: if no vendor found as owner, check if user is staff on any vendor
    if (!vendor) {
      const { data: staffRecord } = await maybeSingle(
        supabase
          .from("vendor_staff")
          .select("*")
          .eq("user_id", sessionUser.id)
          .eq("status", "active"),
      );

      if (staffRecord?.vendor_id) {
        const { data: staffVendor } = await maybeSingle(
          supabase.from("vendors").select("*").eq("id", staffRecord.vendor_id),
        );

        if (staffVendor) {
          vendor = staffVendor;
          vendorStaff = staffRecord;
        }
      }
    }

    if (vendor?.id) {
      // If vendorStaff was already loaded via staff fallback, skip re-querying it
      const needStaffQuery = !vendorStaff;

      const branchesPromise = supabase
        .from("vendor_branches")
        .select("*")
        .eq("vendor_id", vendor.id)
        .order("created_at");

      if (needStaffQuery) {
        const [{ data: nextVendorStaff }, { data: nextVendorBranches, error: branchesError }] =
          await Promise.all([
            maybeSingle(
              supabase
                .from("vendor_staff")
                .select("*")
                .eq("vendor_id", vendor.id)
                .eq("user_id", sessionUser.id),
            ),
            branchesPromise,
          ]);

        if (branchesError) {
          throw branchesError;
        }

        vendorStaff = nextVendorStaff;
        vendorBranches = nextVendorBranches ?? [];
      } else {
        const { data: nextVendorBranches, error: branchesError } = await branchesPromise;

        if (branchesError) {
          throw branchesError;
        }

        vendorBranches = nextVendorBranches ?? [];
      }
    }

    return {
      application,
      vendor,
      vendorStaff,
      vendorBranches,
      warning: null,
    };
  } catch (error) {
    if (isNonFatalOnboardingError(error)) {
      return {
        application: null,
        vendor: null,
        vendorStaff: null,
        vendorBranches: [],
        warning: error,
      };
    }

    throw error;
  }
}

export async function submitPartnerApplication({ sessionUser, preferredLanguage, form }) {
  if (!supabase) {
    throw new Error(supabaseConfigError);
  }

  if (!sessionUser?.id || !sessionUser?.email) {
    throw new Error("You must be signed in before submitting an application.");
  }

  const payload = buildPartnerApplicationPayload({
    sessionUser,
    preferredLanguage,
    form,
  });

  const { data: existingApplication } = await maybeSingle(
    supabase.from("vendor_applications").select("*").eq("user_id", sessionUser.id),
  );

  if (existingApplication) {
    if (existingApplication.status !== "rejected") {
      throw new Error("An application already exists for this account.");
    }

    const { data, error } = await supabase
      .from("vendor_applications")
      .update({
        ...payload,
        rejection_reason: null,
        reviewed_at: null,
        approved_at: null,
      })
      .eq("id", existingApplication.id)
      .eq("user_id", sessionUser.id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  const { data, error } = await supabase.from("vendor_applications").insert(payload).select("*").single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("An application already exists for this account.");
    }

    throw error;
  }

  return data;
}

export async function saveSetupWizard({
  sessionUser,
  application,
  existingVendor,
  preferredLanguage,
  form,
}) {
  if (!supabase) {
    throw new Error(supabaseConfigError);
  }

  if (!sessionUser?.id || !sessionUser?.email) {
    throw new Error("You must be signed in before completing setup.");
  }

  if (!existingVendor?.id && application?.status !== "approved") {
    throw new Error("An approved application is required before setup can continue.");
  }

  const baseVendorPayload = {
    owner_user_id: sessionUser.id,
    application_id: application?.id ?? existingVendor?.application_id ?? null,
    company_name:
      form.companyName?.trim() ||
      application?.company_name?.trim() ||
      existingVendor?.company_name?.trim() ||
      sessionUser.user_metadata?.company_name ||
      sessionUser.email,
    vendor_prefix: form.vendorPrefix.trim().toUpperCase(),
    default_origin_country: form.defaultOriginCountry.trim(),
    default_origin_city: form.defaultOriginCity.trim(),
    pricing_model: form.pricingModel,
    insurance_model: form.insuranceModel,
    plan_tier: form.planChoice,
    preferred_language: preferredLanguage,
    status: "setup_required",
    setup_completed_at: null,
  };

  const vendorResponse = existingVendor?.id
    ? await supabase
        .from("vendors")
        .update(baseVendorPayload)
        .eq("id", existingVendor.id)
        .select("*")
        .single()
    : await supabase.from("vendors").insert(baseVendorPayload).select("*").single();

  if (vendorResponse.error) {
    if (vendorResponse.error.code === "23505") {
      throw new Error("That vendor prefix is already in use.");
    }

    throw vendorResponse.error;
  }

  const vendor = vendorResponse.data;

  await replaceVendorBranches({
    vendorId: vendor.id,
    offices: form.destinationOffices ?? form.destinationBranches,
  });

  const { error: staffError } = await supabase.from("vendor_staff").upsert(
    {
      vendor_id: vendor.id,
      user_id: sessionUser.id,
      email: sessionUser.email,
      full_name:
        application?.full_name?.trim() ||
        sessionUser.user_metadata?.full_name ||
        sessionUser.email,
      role: "owner",
      status: "active",
    },
    { onConflict: "vendor_id,user_id" },
  );

  if (staffError) {
    throw staffError;
  }

  const { data: finalizedVendor, error: finalizeVendorError } = await supabase
    .from("vendors")
    .update({
      status: "active",
      setup_completed_at: new Date().toISOString(),
      preferred_language: preferredLanguage,
    })
    .eq("id", vendor.id)
    .select("*")
    .single();

  if (finalizeVendorError) {
    throw finalizeVendorError;
  }

  return finalizedVendor;
}

export async function saveVendorProfile({ vendorId, preferredLanguage, form }) {
  if (!supabase) {
    throw new Error(supabaseConfigError);
  }

  if (!vendorId) {
    throw new Error("A vendor record is required before business settings can be saved.");
  }

  const { data, error } = await supabase
    .from("vendors")
    .update(buildVendorProfilePayload({ form, preferredLanguage }))
    .eq("id", vendorId)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("That vendor prefix is already in use.");
    }

    throw error;
  }

  return data;
}

export async function replaceVendorBranches({ vendorId, offices }) {
  if (!supabase) {
    throw new Error(supabaseConfigError);
  }

  if (!vendorId) {
    throw new Error("A vendor record is required before branches can be saved.");
  }

  const branchRows = mapBranchInputToRows(offices, vendorId);
  const { data: existingBranches, error: existingBranchesError } = await supabase
    .from("vendor_branches")
    .select("id")
    .eq("vendor_id", vendorId)
    .eq("side", "destination");

  if (existingBranchesError) {
    throw existingBranchesError;
  }

  const existingBranchIds = new Set((existingBranches ?? []).map((branch) => branch.id));
  const nextBranchIds = new Set(
    branchRows.map((branch) => branch.id).filter((branchId) => existingBranchIds.has(branchId)),
  );
  const branchIdsToDelete = (existingBranches ?? [])
    .map((branch) => branch.id)
    .filter((branchId) => !nextBranchIds.has(branchId));

  const branchesToUpdate = branchRows.filter((branch) => existingBranchIds.has(branch.id));
  const branchesToInsert = branchRows
    .filter((branch) => !existingBranchIds.has(branch.id))
    .map(({ id: _id, ...branch }) => branch);

  for (const branch of branchesToUpdate) {
    const { error: updateBranchError } = await supabase
      .from("vendor_branches")
      .update({
        branch_name: branch.branch_name,
        country_code: branch.country_code,
        city: branch.city,
        address_text: branch.address_text,
      })
      .eq("vendor_id", vendorId)
      .eq("id", branch.id)
      .eq("side", "destination");

    if (updateBranchError) {
      throw updateBranchError;
    }
  }

  if (branchesToInsert.length > 0) {
    const { error: insertBranchesError } = await supabase.from("vendor_branches").insert(branchesToInsert);

    if (insertBranchesError) {
      throw insertBranchesError;
    }
  }

  if (branchIdsToDelete.length > 0) {
    const { error: deleteBranchesError } = await supabase
      .from("vendor_branches")
      .delete()
      .eq("vendor_id", vendorId)
      .eq("side", "destination")
      .in("id", branchIdsToDelete);

    if (deleteBranchesError) {
      throw deleteBranchesError;
    }
  }

  return branchRows;
}

export function formatListForTextarea(value) {
  return Array.isArray(value) ? value.join("\n") : "";
}

export function formatBranchRowsForOfficeEntries(branchRows) {
  if (!Array.isArray(branchRows) || branchRows.length === 0) {
    return [];
  }

  return branchRows.map((branch) => ({
    id: branch?.id ?? `${branch?.branch_name ?? "office"}-${branch?.created_at ?? Math.random()}`,
    officeName: branch?.branch_name ?? "",
    countryCode: resolveStoredCountryCode(branch?.country_code),
    city: branch?.city ?? "",
    address: branch?.address_text ?? "",
  }));
}

export { normalizeErrorMessage, isNonFatalOnboardingError };
