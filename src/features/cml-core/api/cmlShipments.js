import { supabase, supabaseConfigError } from "@/lib/supabaseClient";

const NON_FATAL_SHIPMENT_ERROR_CODES = new Set(["PGRST116", "42P01", "42501"]);
const TRACKING_CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const DEFAULT_CURRENCY = "USD";
const PAYMENT_METHODS = new Set(["cash", "zelle", "cashapp", "mobile_money", "card", "other"]);
const SHIPMENT_HISTORY_EVENT_KINDS = new Set([
  "created",
  "status_change",
  "batch_linked",
  "batch_unlinked",
  "eta_updated",
]);

/** Valid shipment status transitions per PRD 7.6.2 */
export const SHIPMENT_STATUS_TRANSITIONS = {
  draft: ["pending"],
  pending: ["in_batch", "cancelled"],
  in_batch: ["in_transit", "pending", "cancelled"],
  in_transit: ["arrived", "delayed", "customs_hold"],
  delayed: ["in_transit", "arrived", "customs_hold"],
  customs_hold: ["in_transit", "arrived", "delayed"],
  arrived: ["ready_for_pickup", "out_for_last_mile_delivery"],
  ready_for_pickup: ["out_for_last_mile_delivery", "collected"],
  out_for_last_mile_delivery: ["collected"],
  collected: [],
  returned: [],
  cancelled: [],
};

const normalizeErrorMessage = (fallbackMessage, error) =>
  error?.message || error?.error_description || fallbackMessage;

const isNonFatalShipmentError = (error) =>
  NON_FATAL_SHIPMENT_ERROR_CODES.has(error?.code) ||
  error?.status === 401 ||
  error?.status === 403;

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

function randomSegment(length) {
  return Array.from({ length }, () => TRACKING_CHARSET[Math.floor(Math.random() * TRACKING_CHARSET.length)]).join("");
}

function buildDateSegment(date = new Date()) {
  const year = String(date.getFullYear()).slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function buildTrackingNumber(prefix, extraLength = 0) {
  return `${prefix}-${buildDateSegment()}${randomSegment(6 + extraLength)}`;
}

function normalizeCurrencyCode(value) {
  const normalizedValue = String(value ?? "")
    .trim()
    .toUpperCase();

  return /^[A-Z]{3}$/.test(normalizedValue) ? normalizedValue : DEFAULT_CURRENCY;
}

function normalizeMoneyAmount(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? Number(numericValue.toFixed(2)) : 0;
}

function normalizePaymentMethod(value) {
  const normalizedValue = String(value ?? "")
    .trim()
    .toLowerCase();

  return PAYMENT_METHODS.has(normalizedValue) ? normalizedValue : null;
}

function deriveShipmentPaymentStatus(totalPrice, amountPaid) {
  const normalizedTotal = normalizeMoneyAmount(totalPrice);
  const normalizedAmountPaid = normalizeMoneyAmount(amountPaid);

  if (normalizedTotal <= 0) {
    return "paid";
  }

  if (normalizedAmountPaid <= 0) {
    return "unpaid";
  }

  if (normalizedAmountPaid >= normalizedTotal) {
    return "paid";
  }

  return "partial";
}

function resolveShipmentCategory(form) {
  if (form.categoryPreset === "Other") {
    return form.categoryOther.trim();
  }

  return String(form.categoryPreset ?? "").trim();
}

function normalizeCountryCode(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase();
}

function normalizeShipmentHistoryEventKind(value) {
  return SHIPMENT_HISTORY_EVENT_KINDS.has(value) ? value : "status_change";
}

function normalizeTrackingNumber(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase();
}

function buildShipmentPayload({
  vendor,
  senderCustomer,
  receiverCustomer,
  destinationBranch,
  form,
  trackingNumber,
}) {
  const basePrice = Number(form.basePrice);
  const discountAmount = Number(form.discountAmount || 0);
  const totalPrice = Math.max(basePrice - discountAmount, 0);
  const amountPaid = form.paymentStatus === "paid" ? totalPrice : 0;
  const destinationCountry = normalizeCountryCode(
    destinationBranch?.country_code || form.destinationCountry,
  );
  const destinationCity = String(destinationBranch?.city ?? form.destinationCity ?? "").trim();

  return {
    vendor_id: vendor.id,
    tracking_number: trackingNumber,
    sender_customer_id: senderCustomer?.id ?? null,
    receiver_customer_id: receiverCustomer?.id ?? null,
    sender_name: form.senderName.trim(),
    sender_phone: form.senderPhone.normalizedValue,
    sender_whatsapp_number: form.senderWhatsApp.normalizedValue || null,
    sender_email: form.senderEmail.trim() || null,
    receiver_name: form.receiverName.trim(),
    receiver_phone: form.receiverPhone.normalizedValue,
    receiver_whatsapp_number: form.receiverWhatsApp.normalizedValue || null,
    receiver_email: form.receiverEmail.trim() || null,
    origin_country: normalizeCountryCode(form.originCountry),
    origin_city: form.originCity.trim(),
    destination_branch_id: destinationBranch?.id ?? null,
    destination_country: destinationCountry,
    destination_city: destinationCity,
    shipping_mode: form.shippingMode,
    contents_description: form.contentsDescription.trim(),
    weight_kg: Number(form.weightKg),
    quantity: Number.parseInt(form.quantity, 10),
    category: resolveShipmentCategory(form),
    currency_code: normalizeCurrencyCode(form.currencyCode || vendor.default_currency),
    base_price: basePrice,
    discount_amount: discountAmount,
    total_price: totalPrice,
    amount_paid: amountPaid,
    payment_method: null,
    payment_note: null,
    payment_status: deriveShipmentPaymentStatus(totalPrice, amountPaid),
    reference_note: form.referenceNote.trim() || null,
    status: "pending",
  };
}

function mergeRole(existingRole, nextRole) {
  if (!existingRole || existingRole === nextRole) {
    return nextRole;
  }

  return "both";
}

export async function appendShipmentStatusHistory(entries) {
  if (!supabase) {
    throw new Error(supabaseConfigError);
  }

  const normalizedEntries = (entries ?? [])
    .map((entry) => ({
      vendor_id: entry?.vendorId ?? null,
      shipment_id: entry?.shipmentId ?? null,
      batch_id: entry?.batchId ?? null,
      status: String(entry?.status ?? "").trim(),
      event_kind: normalizeShipmentHistoryEventKind(entry?.eventKind),
    }))
    .filter((entry) => entry.vendor_id && entry.shipment_id && entry.status);

  if (normalizedEntries.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("vendor_shipment_status_history")
    .insert(normalizedEntries)
    .select("*");

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function saveVendorCustomer({ vendorId, customer, role }) {
  const phone = customer.phone?.normalizedValue;

  if (!phone) {
    throw new Error("A valid customer phone number is required.");
  }

  const { data: existingCustomer } = await maybeSingle(
    supabase.from("vendor_customers").select("*").eq("vendor_id", vendorId).eq("phone", phone),
  );

  const payload = {
    vendor_id: vendorId,
    full_name: customer.name.trim() || existingCustomer?.full_name || phone,
    phone,
    whatsapp_number:
      customer.whatsApp?.normalizedValue || existingCustomer?.whatsapp_number || null,
    email: customer.email.trim() || existingCustomer?.email || null,
    last_role: mergeRole(existingCustomer?.last_role, role),
  };

  const response = existingCustomer?.id
    ? await supabase.from("vendor_customers").update(payload).eq("id", existingCustomer.id).select("*").single()
    : await supabase.from("vendor_customers").insert(payload).select("*").single();

  if (response.error) {
    throw response.error;
  }

  return response.data;
}

export async function findVendorCustomerByPhone({ vendorId, phone }) {
  if (!supabase) {
    throw new Error(supabaseConfigError);
  }

  if (!vendorId || !phone) {
    return null;
  }

  const { data } = await maybeSingle(
    supabase.from("vendor_customers").select("*").eq("vendor_id", vendorId).eq("phone", phone),
  );

  return data;
}

export async function listVendorDestinationBranches(vendorId) {
  if (!supabase) {
    throw new Error(supabaseConfigError);
  }

  if (!vendorId) {
    return [];
  }

  const { data, error } = await supabase
    .from("vendor_branches")
    .select("*")
    .eq("vendor_id", vendorId)
    .eq("side", "destination")
    .order("created_at");

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function createVendorShipment({ vendor, form }) {
  if (!supabase) {
    throw new Error(supabaseConfigError);
  }

  if (!vendor?.id || !vendor?.vendor_prefix) {
    throw new Error("An active vendor with a valid prefix is required before intake can continue.");
  }

  const senderCustomer = await saveVendorCustomer({
    vendorId: vendor.id,
    customer: {
      name: form.senderName,
      phone: form.senderPhone,
      whatsApp: form.senderWhatsApp,
      email: form.senderEmail,
    },
    role: "sender",
  });

  const receiverCustomer = await saveVendorCustomer({
    vendorId: vendor.id,
    customer: {
      name: form.receiverName,
      phone: form.receiverPhone,
      whatsApp: form.receiverWhatsApp,
      email: form.receiverEmail,
    },
    role: "receiver",
  });

  let destinationBranch = null;

  if (form.destinationBranchId) {
    const { data } = await maybeSingle(
      supabase
        .from("vendor_branches")
        .select("*")
        .eq("vendor_id", vendor.id)
        .eq("side", "destination")
        .eq("id", form.destinationBranchId),
    );

    if (!data) {
      throw new Error("The selected destination branch could not be found for this vendor.");
    }

    if (!String(data.country_code ?? "").trim()) {
      throw new Error("The selected destination branch is missing a saved country.");
    }

    destinationBranch = data;
  }

  const payloadBase = buildShipmentPayload({
    vendor,
    senderCustomer,
    receiverCustomer,
    destinationBranch,
    form,
    trackingNumber: "",
  });

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const trackingNumber = buildTrackingNumber(vendor.vendor_prefix, attempt >= 4 ? 1 : 0);
    const { data, error } = await supabase
      .from("vendor_shipments")
      .insert({
        ...payloadBase,
        tracking_number: trackingNumber,
      })
      .select("*")
      .single();

    if (!error) {
      await appendShipmentStatusHistory([
        {
          vendorId: vendor.id,
          shipmentId: data.id,
          status: data.status,
          eventKind: "created",
        },
      ]);
      return data;
    }

    if (error.code === "23505") {
      continue;
    }

    throw error;
  }

  throw new Error("We could not generate a unique tracking number. Please try again.");
}

export async function loadVendorShipmentDetail({ vendorId, shipmentId }) {
  if (!supabase) {
    throw new Error(supabaseConfigError);
  }

  if (!vendorId || !shipmentId) {
    return {
      shipment: null,
      destinationBranch: null,
      batch: null,
      statusHistory: [],
    };
  }

  const { data: shipment } = await maybeSingle(
    supabase.from("vendor_shipments").select("*").eq("vendor_id", vendorId).eq("id", shipmentId),
  );

  if (!shipment) {
    return {
      shipment: null,
      destinationBranch: null,
      batch: null,
      statusHistory: [],
    };
  }

  const [{ data: destinationBranch }, { data: batch }, { data: statusHistoryRows, error: statusHistoryError }] =
    await Promise.all([
      shipment.destination_branch_id
        ? maybeSingle(
            supabase
              .from("vendor_branches")
              .select("*")
              .eq("vendor_id", vendorId)
              .eq("id", shipment.destination_branch_id),
          )
        : Promise.resolve({ data: null, error: null }),
      shipment.batch_id
        ? maybeSingle(
            supabase
              .from("vendor_batches")
              .select("*")
              .eq("vendor_id", vendorId)
              .eq("id", shipment.batch_id),
          )
        : Promise.resolve({ data: null, error: null }),
      supabase
        .from("vendor_shipment_status_history")
        .select("*")
        .eq("vendor_id", vendorId)
        .eq("shipment_id", shipmentId)
        .order("created_at", { ascending: false }),
    ]);

  if (statusHistoryError) {
    throw statusHistoryError;
  }

  const historyBatchIds = Array.from(
    new Set((statusHistoryRows ?? []).map((entry) => entry.batch_id).filter(Boolean)),
  );

  let historyBatchMap = {};

  if (historyBatchIds.length > 0) {
    const { data: historyBatches, error: historyBatchesError } = await supabase
      .from("vendor_batches")
      .select("id,batch_name,status")
      .eq("vendor_id", vendorId)
      .in("id", historyBatchIds);

    if (historyBatchesError) {
      throw historyBatchesError;
    }

    historyBatchMap = Object.fromEntries((historyBatches ?? []).map((nextBatch) => [nextBatch.id, nextBatch]));
  }

  return {
    shipment,
    destinationBranch,
    batch,
    statusHistory: (statusHistoryRows ?? []).map((entry) => ({
      ...entry,
      batch: entry.batch_id ? historyBatchMap[entry.batch_id] ?? null : null,
    })),
  };
}

export async function updateVendorShipmentPayment({
  vendorId,
  shipmentId,
  amountPaid,
  paymentMethod,
  paymentNote,
}) {
  if (!supabase) {
    throw new Error(supabaseConfigError);
  }

  if (!vendorId || !shipmentId) {
    throw new Error("A saved vendor shipment is required before payment can be updated.");
  }

  const { data: shipment } = await maybeSingle(
    supabase.from("vendor_shipments").select("*").eq("vendor_id", vendorId).eq("id", shipmentId),
  );

  if (!shipment) {
    throw new Error("The shipment could not be found for this vendor.");
  }

  const normalizedTotalPrice = normalizeMoneyAmount(shipment.total_price);
  const normalizedAmountPaid = normalizeMoneyAmount(amountPaid);

  if (normalizedAmountPaid < 0) {
    throw new Error("Payment amount cannot be negative.");
  }

  if (normalizedAmountPaid > normalizedTotalPrice + 0.0001) {
    throw new Error("Payment amount cannot be greater than the shipment total.");
  }

  const nextPaymentStatus = deriveShipmentPaymentStatus(normalizedTotalPrice, normalizedAmountPaid);

  const { data, error } = await supabase
    .from("vendor_shipments")
    .update({
      amount_paid: normalizedAmountPaid,
      payment_status: nextPaymentStatus,
      payment_method: normalizePaymentMethod(paymentMethod),
      payment_note: String(paymentNote ?? "").trim() || null,
    })
    .eq("vendor_id", vendorId)
    .eq("id", shipmentId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function findVendorShipmentByTrackingNumber({ vendorId, trackingNumber }) {
  if (!supabase) {
    throw new Error(supabaseConfigError);
  }

  const normalizedTrackingNumber = normalizeTrackingNumber(trackingNumber);

  if (!vendorId || !normalizedTrackingNumber) {
    return {
      shipment: null,
      destinationBranch: null,
      batch: null,
    };
  }

  const { data: shipment } = await maybeSingle(
    supabase
      .from("vendor_shipments")
      .select("*")
      .eq("vendor_id", vendorId)
      .eq("tracking_number", normalizedTrackingNumber),
  );

  if (!shipment) {
    return {
      shipment: null,
      destinationBranch: null,
      batch: null,
    };
  }

  const [{ data: destinationBranch }, { data: batch }] = await Promise.all([
    shipment.destination_branch_id
      ? maybeSingle(
          supabase
            .from("vendor_branches")
            .select("*")
            .eq("vendor_id", vendorId)
            .eq("id", shipment.destination_branch_id),
        )
      : Promise.resolve({ data: null, error: null }),
    shipment.batch_id
      ? maybeSingle(
          supabase
            .from("vendor_batches")
            .select("id,batch_name,status")
            .eq("vendor_id", vendorId)
            .eq("id", shipment.batch_id),
        )
      : Promise.resolve({ data: null, error: null }),
  ]);

  return {
    shipment,
    destinationBranch,
    batch,
  };
}

export async function loadPublicShipmentTracking(trackingNumber) {
  if (!supabase) {
    throw new Error(supabaseConfigError);
  }

  const normalizedTrackingNumber = normalizeTrackingNumber(trackingNumber);

  if (!normalizedTrackingNumber) {
    return {
      shipment: null,
      vendor: null,
      destinationBranch: null,
      statusHistory: [],
      operationalEtaAt: null,
    };
  }

  const { data, error } = await supabase.rpc("get_public_shipment_tracking", {
    p_tracking_number: normalizedTrackingNumber,
  });

  if (error) {
    throw error;
  }

  if (!data) {
    return {
      shipment: null,
      vendor: null,
      destinationBranch: null,
      statusHistory: [],
      operationalEtaAt: null,
    };
  }

  return {
    shipment: data.shipment ?? null,
    vendor: data.vendor ?? null,
    destinationBranch: data.destination_branch ?? null,
    statusHistory: data.status_history ?? [],
    operationalEtaAt: data.operational_eta_at ?? null,
  };
}

export { normalizeErrorMessage, isNonFatalShipmentError };
