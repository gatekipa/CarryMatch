import { supabase, supabaseConfigError } from "@/lib/supabaseClient";

const DEFAULT_NOTIFICATION_CHANNEL = "whatsapp";
export const NOTIFICATION_CHANNEL_OPTIONS = ["whatsapp", "email"];

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

function normalizeNotificationChannel(value) {
  const normalizedValue = String(value ?? "")
    .trim()
    .toLowerCase();

  return NOTIFICATION_CHANNEL_OPTIONS.includes(normalizedValue)
    ? normalizedValue
    : DEFAULT_NOTIFICATION_CHANNEL;
}

export async function listVendorNotifications(vendorId) {
  if (!supabase) {
    throw new Error(supabaseConfigError);
  }

  if (!vendorId) {
    return [];
  }

  const { data: notifications, error } = await supabase
    .from("vendor_notifications")
    .select("*")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw error;
  }

  const notificationRows = notifications ?? [];
  const shipmentIds = Array.from(new Set(notificationRows.map((row) => row.shipment_id).filter(Boolean)));
  const batchIds = Array.from(new Set(notificationRows.map((row) => row.batch_id).filter(Boolean)));

  let shipmentMap = {};
  let batchMap = {};

  if (shipmentIds.length > 0) {
    const { data: shipments, error: shipmentsError } = await supabase
      .from("vendor_shipments")
      .select("id,tracking_number")
      .eq("vendor_id", vendorId)
      .in("id", shipmentIds);

    if (shipmentsError) {
      throw shipmentsError;
    }

    shipmentMap = Object.fromEntries((shipments ?? []).map((shipment) => [shipment.id, shipment]));
  }

  if (batchIds.length > 0) {
    const { data: batches, error: batchesError } = await supabase
      .from("vendor_batches")
      .select("id,batch_name,status")
      .eq("vendor_id", vendorId)
      .in("id", batchIds);

    if (batchesError) {
      throw batchesError;
    }

    batchMap = Object.fromEntries((batches ?? []).map((batch) => [batch.id, batch]));
  }

  return notificationRows.map((row) => ({
    ...row,
    shipment: row.shipment_id ? shipmentMap[row.shipment_id] ?? null : null,
    batch: row.batch_id ? batchMap[row.batch_id] ?? null : null,
  }));
}

export async function saveVendorNotificationSettings({
  vendorId,
  notificationsEnabled,
  notificationDefaultChannel,
}) {
  if (!supabase) {
    throw new Error(supabaseConfigError);
  }

  if (!vendorId) {
    throw new Error("A vendor record is required before notification settings can be saved.");
  }

  const { data, error } = await supabase
    .from("vendors")
    .update({
      notifications_enabled: Boolean(notificationsEnabled),
      notification_default_channel: normalizeNotificationChannel(notificationDefaultChannel),
    })
    .eq("id", vendorId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export { normalizeNotificationChannel };
