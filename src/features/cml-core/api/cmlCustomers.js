import { supabase, supabaseConfigError } from "@/lib/supabaseClient";

export async function listVendorCustomers(vendorId, options = {}) {
  if (!supabase) throw new Error(supabaseConfigError);
  if (!vendorId) throw new Error("Vendor ID is required.");

  const { search = "", page = 1, pageSize = 20 } = options;

  let query = supabase
    .from("vendor_customers")
    .select("*", { count: "exact" })
    .eq("vendor_id", vendorId);

  if (search.trim()) {
    const s = search.trim();
    query = query.or(`phone.ilike.%${s}%,full_name.ilike.%${s}%,email.ilike.%${s}%`);
  }

  query = query.order("updated_at", { ascending: false });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  return { customers: data ?? [], totalCount: count ?? 0 };
}

export async function loadVendorCustomerDetail(vendorId, customerId) {
  if (!supabase) throw new Error(supabaseConfigError);

  const { data, error } = await supabase
    .from("vendor_customers")
    .select("*")
    .eq("vendor_id", vendorId)
    .eq("id", customerId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateVendorCustomer(vendorId, customerId, updates) {
  if (!supabase) throw new Error(supabaseConfigError);

  const allowedFields = ["full_name", "email", "whatsapp_number", "preferred_language", "notes"];
  const payload = {};
  for (const key of allowedFields) {
    if (updates[key] !== undefined) {
      payload[key] = updates[key] === "" ? null : updates[key];
    }
  }

  const { data, error } = await supabase
    .from("vendor_customers")
    .update(payload)
    .eq("vendor_id", vendorId)
    .eq("id", customerId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function listCustomerShipments(vendorId, customerId) {
  if (!supabase) throw new Error(supabaseConfigError);

  const { data, error } = await supabase
    .from("vendor_shipments")
    .select("id, tracking_number, status, payment_status, origin_city, destination_city, created_at, sender_customer_id, receiver_customer_id")
    .eq("vendor_id", vendorId)
    .or(`sender_customer_id.eq.${customerId},receiver_customer_id.eq.${customerId}`)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data ?? [];
}
