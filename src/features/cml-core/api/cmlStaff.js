import { supabase, supabaseConfigError } from "@/lib/supabaseClient";

export async function listVendorStaff(vendorId) {
  if (!supabase) throw new Error(supabaseConfigError);

  const { data, error } = await supabase
    .from("vendor_staff")
    .select("*")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function inviteStaffMember(vendorId, { email, fullName, role }) {
  if (!supabase) throw new Error(supabaseConfigError);

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) throw new Error("Email is required.");
  if (!role || !["admin", "staff"].includes(role)) throw new Error("Role must be admin or staff.");

  const { data, error } = await supabase
    .from("vendor_staff")
    .insert({
      vendor_id: vendorId,
      email: normalizedEmail,
      full_name: fullName?.trim() || null,
      role,
      status: "invited",
      user_id: null,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("This email is already a staff member or has a pending invitation.");
    }
    throw error;
  }
  return data;
}

export async function updateStaffRole(vendorId, staffId, newRole) {
  if (!supabase) throw new Error(supabaseConfigError);
  if (!["admin", "staff"].includes(newRole)) throw new Error("Invalid role.");

  const { data, error } = await supabase
    .from("vendor_staff")
    .update({ role: newRole })
    .eq("vendor_id", vendorId)
    .eq("id", staffId)
    .neq("role", "owner")
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function removeStaffMember(vendorId, staffId) {
  if (!supabase) throw new Error(supabaseConfigError);

  const { error } = await supabase
    .from("vendor_staff")
    .update({ status: "inactive" })
    .eq("vendor_id", vendorId)
    .eq("id", staffId)
    .neq("role", "owner");

  if (error) throw error;
}

export async function linkInvitedStaff(userId, email) {
  if (!supabase) throw new Error(supabaseConfigError);

  const normalizedEmail = email.trim().toLowerCase();

  const { data, error } = await supabase
    .from("vendor_staff")
    .update({ user_id: userId, status: "active" })
    .eq("email", normalizedEmail)
    .eq("status", "invited")
    .is("user_id", null)
    .select("*");

  if (error) throw error;
  return data ?? [];
}
