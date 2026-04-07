import { supabase, supabaseConfigError } from "@/lib/supabaseClient";

export async function loadAdminUser(userId) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("admin_users")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST116" || error.code === "42P01") return null;
    throw error;
  }
  return data;
}

export async function listApplications(statusFilter = "") {
  if (!supabase) throw new Error(supabaseConfigError);

  let query = supabase
    .from("vendor_applications")
    .select("*")
    .order("created_at", { ascending: false });

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function approveApplication(applicationId) {
  if (!supabase) throw new Error(supabaseConfigError);

  // 1. Load the application
  const { data: application, error: loadError } = await supabase
    .from("vendor_applications")
    .select("*")
    .eq("id", applicationId)
    .single();

  if (loadError) throw loadError;
  if (!application) throw new Error("Application not found.");

  // 2. Generate a vendor prefix from company name
  const prefixBase = (application.company_name || "VND")
    .replace(/[^A-Za-z]/g, "")
    .substring(0, 3)
    .toUpperCase()
    .padEnd(3, "X");

  const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
  const vendorPrefix = prefixBase.substring(0, 3);

  // 3. Update application to approved
  const { error: updateError } = await supabase
    .from("vendor_applications")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
    })
    .eq("id", applicationId);

  if (updateError) throw updateError;

  // 4. Create vendor record
  const { data: vendor, error: vendorError } = await supabase
    .from("vendors")
    .insert({
      owner_user_id: application.user_id,
      application_id: application.id,
      company_name: application.company_name || "",
      vendor_prefix: `${vendorPrefix}${randomSuffix}`.substring(0, 3).toUpperCase(),
      default_origin_country: "US",
      default_origin_city: "",
      status: "setup_required",
      preferred_language: application.preferred_language || "en",
    })
    .select("*")
    .single();

  if (vendorError) throw vendorError;

  // 5. Create vendor_staff record for the owner
  const { error: staffError } = await supabase
    .from("vendor_staff")
    .insert({
      vendor_id: vendor.id,
      user_id: application.user_id,
      email: application.email || "",
      full_name: application.full_name || "",
      role: "owner",
      status: "active",
    });

  if (staffError) throw staffError;

  return vendor;
}

export async function rejectApplication(applicationId, rejectionReason) {
  if (!supabase) throw new Error(supabaseConfigError);

  const { error } = await supabase
    .from("vendor_applications")
    .update({
      status: "rejected",
      rejection_reason: rejectionReason,
    })
    .eq("id", applicationId);

  if (error) throw error;
}

export async function requestInfoApplication(applicationId) {
  if (!supabase) throw new Error(supabaseConfigError);

  const { error } = await supabase
    .from("vendor_applications")
    .update({ status: "info_requested" })
    .eq("id", applicationId);

  if (error) throw error;
}
