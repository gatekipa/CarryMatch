import { supabase, supabaseConfigError } from "@/lib/supabaseClient";
import { appendShipmentStatusHistory } from "@/features/cml-core/api/cmlShipments";

const NON_FATAL_BATCH_ERROR_CODES = new Set(["PGRST116", "42P01", "42501"]);
export const BATCH_ASSIGNMENT_EDITABLE_STATUSES = ["open"];
const BATCH_PICKUP_ACTIONABLE_STATUSES = ["ready_for_pickup", "out_for_last_mile_delivery"];
const SHIPMENT_BATCH_SYNC_EXCLUDED_STATUSES = ["collected", "returned", "cancelled"];
const ETA_REQUIRED_BATCH_STATUSES = ["delayed", "customs_hold"];

export const BATCH_STATUSES = [
  "open",
  "locked",
  "shipped",
  "delayed",
  "customs_hold",
  "arrived",
  "ready_for_pickup",
  "out_for_last_mile_delivery",
];

export const BATCH_STATUS_TRANSITIONS = {
  open: ["locked", "shipped", "delayed", "customs_hold"],
  locked: ["open", "shipped", "delayed", "customs_hold"],
  shipped: ["delayed", "customs_hold", "arrived"],
  delayed: ["shipped", "customs_hold", "arrived"],
  customs_hold: ["shipped", "delayed", "arrived"],
  arrived: ["ready_for_pickup", "out_for_last_mile_delivery"],
  ready_for_pickup: ["out_for_last_mile_delivery"],
  out_for_last_mile_delivery: [],
};

const BATCH_SHIPMENT_SELECT = `
  id,
  tracking_number,
  sender_name,
  receiver_name,
  origin_city,
  destination_city,
  destination_branch_id,
  shipping_mode,
  status,
  created_at,
  batch_id
`;

const normalizeErrorMessage = (fallbackMessage, error) =>
  error?.message || error?.error_description || fallbackMessage;

const isNonFatalBatchError = (error) =>
  NON_FATAL_BATCH_ERROR_CODES.has(error?.code) ||
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

async function loadVendorBatch(vendorId, batchId) {
  const { data } = await maybeSingle(
    supabase.from("vendor_batches").select("*").eq("vendor_id", vendorId).eq("id", batchId),
  );

  return data;
}

async function appendEtaUpdateHistoryForBatchShipments({ vendorId, batchId, batchStatus }) {
  const { data: shipments, error } = await supabase
    .from("vendor_shipments")
    .select("id,status")
    .eq("vendor_id", vendorId)
    .eq("batch_id", batchId);

  if (error) {
    throw error;
  }

  const historyEntries = (shipments ?? [])
    .filter((shipment) => !SHIPMENT_BATCH_SYNC_EXCLUDED_STATUSES.includes(shipment.status))
    .map((shipment) => ({
      vendorId,
      shipmentId: shipment.id,
      batchId,
      status: ETA_REQUIRED_BATCH_STATUSES.includes(batchStatus) ? batchStatus : shipment.status,
      eventKind: "eta_updated",
    }));

  if (historyEntries.length > 0) {
    await appendShipmentStatusHistory(historyEntries);
  }
}

async function decorateShipmentsWithDestinationBranches(vendorId, shipments) {
  if (!shipments?.length) {
    return [];
  }

  const destinationBranchIds = [...new Set(
    shipments.map((shipment) => shipment.destination_branch_id).filter(Boolean),
  )];

  if (destinationBranchIds.length === 0) {
    return shipments.map((shipment) => ({
      ...shipment,
      destination_branch: null,
    }));
  }

  const { data: branches, error: branchesError } = await supabase
    .from("vendor_branches")
    .select("id,branch_name,city,country_code,address_text")
    .eq("vendor_id", vendorId)
    .in("id", destinationBranchIds);

  if (branchesError) {
    throw branchesError;
  }

  const branchMap = Object.fromEntries((branches ?? []).map((branch) => [branch.id, branch]));

  return shipments.map((shipment) => ({
    ...shipment,
    destination_branch: shipment.destination_branch_id
      ? branchMap[shipment.destination_branch_id] ?? null
      : null,
  }));
}

function normalizeEtaValue(value) {
  return value ? new Date(value).toISOString() : null;
}

function mapShipmentStatusForBatchStatus(batchStatus) {
  switch (batchStatus) {
    case "open":
    case "locked":
      return "in_batch";
    case "shipped":
      return "in_transit";
    case "delayed":
      return "delayed";
    case "customs_hold":
      return "customs_hold";
    case "arrived":
      return "arrived";
    case "ready_for_pickup":
      return "ready_for_pickup";
    case "out_for_last_mile_delivery":
      return "out_for_last_mile_delivery";
    default:
      return null;
  }
}

async function syncShipmentStatusesForBatch({ vendorId, batchId, batchStatus }) {
  const nextShipmentStatus = mapShipmentStatusForBatchStatus(batchStatus);

  if (!nextShipmentStatus) {
    return;
  }

  const { data: shipmentsNeedingUpdate, error: shipmentsLookupError } = await supabase
    .from("vendor_shipments")
    .select("id,status")
    .eq("vendor_id", vendorId)
    .eq("batch_id", batchId);

  if (shipmentsLookupError) {
    throw shipmentsLookupError;
  }

  const shipmentIdsToUpdate = (shipmentsNeedingUpdate ?? [])
    .filter(
      (shipment) =>
        shipment.status !== nextShipmentStatus &&
        !SHIPMENT_BATCH_SYNC_EXCLUDED_STATUSES.includes(shipment.status),
    )
    .map((shipment) => shipment.id);

  if (shipmentIdsToUpdate.length === 0) {
    return;
  }

  const { data: updatedShipments, error: updateError } = await supabase
    .from("vendor_shipments")
    .update({ status: nextShipmentStatus })
    .eq("vendor_id", vendorId)
    .in("id", shipmentIdsToUpdate)
    .select("id");

  if (updateError) {
    throw updateError;
  }

  const historyEntries = (updatedShipments ?? []).map((shipment) => ({
    vendorId,
    shipmentId: shipment.id,
    batchId,
    status: nextShipmentStatus,
    eventKind: "status_change",
  }));

  if (historyEntries.length > 0) {
    await appendShipmentStatusHistory(historyEntries);
  }
}

export async function listVendorBatches(vendorId) {
  if (!supabase) {
    throw new Error(supabaseConfigError);
  }

  if (!vendorId) {
    return [];
  }

  const [{ data: batches, error: batchesError }, { data: shipmentRows, error: shipmentsError }] =
    await Promise.all([
      supabase.from("vendor_batches").select("*").eq("vendor_id", vendorId).order("created_at", { ascending: false }),
      supabase
        .from("vendor_shipments")
        .select("id,batch_id")
        .eq("vendor_id", vendorId)
        .not("batch_id", "is", null),
    ]);

  if (batchesError) {
    throw batchesError;
  }

  if (shipmentsError) {
    throw shipmentsError;
  }

  const shipmentCountByBatchId = (shipmentRows ?? []).reduce((counts, shipmentRow) => {
    const batchId = shipmentRow.batch_id;
    counts[batchId] = (counts[batchId] ?? 0) + 1;
    return counts;
  }, {});

  return (batches ?? []).map((batch) => ({
    ...batch,
    shipment_count: shipmentCountByBatchId[batch.id] ?? 0,
  }));
}

export async function listVendorAssignableBatches(vendorId) {
  const batches = await listVendorBatches(vendorId);
  return batches.filter((batch) => BATCH_ASSIGNMENT_EDITABLE_STATUSES.includes(batch.status));
}

export async function loadBatchDetail({ vendorId, batchId }) {
  if (!supabase) {
    throw new Error(supabaseConfigError);
  }

  if (!vendorId || !batchId) {
    return { batch: null, batchShipments: [], pendingShipments: [] };
  }

  const [{ data: batch }, { data: batchShipments, error: batchShipmentsError }, { data: pendingShipments, error: pendingShipmentsError }] =
    await Promise.all([
      maybeSingle(supabase.from("vendor_batches").select("*").eq("vendor_id", vendorId).eq("id", batchId)),
      supabase
        .from("vendor_shipments")
        .select(BATCH_SHIPMENT_SELECT)
        .eq("vendor_id", vendorId)
        .eq("batch_id", batchId)
        .order("created_at", { ascending: false }),
      supabase
        .from("vendor_shipments")
        .select(BATCH_SHIPMENT_SELECT)
        .eq("vendor_id", vendorId)
        .is("batch_id", null)
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
    ]);

  if (batchShipmentsError) {
    throw batchShipmentsError;
  }

  if (pendingShipmentsError) {
    throw pendingShipmentsError;
  }

  const [decoratedBatchShipments, decoratedPendingShipments] = await Promise.all([
    decorateShipmentsWithDestinationBranches(vendorId, batchShipments ?? []),
    decorateShipmentsWithDestinationBranches(vendorId, pendingShipments ?? []),
  ]);

  return {
    batch,
    batchShipments: decoratedBatchShipments,
    pendingShipments: decoratedPendingShipments,
  };
}

export async function createVendorBatch({ vendorId, batchName, etaAt }) {
  if (!supabase) {
    throw new Error(supabaseConfigError);
  }

  const { data, error } = await supabase
    .from("vendor_batches")
    .insert({
      vendor_id: vendorId,
      batch_name: batchName.trim(),
      eta_at: normalizeEtaValue(etaAt),
      status: "open",
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateVendorBatchBasics({ vendorId, batchId, batchName, etaAt }) {
  if (!supabase) {
    throw new Error(supabaseConfigError);
  }

  const { data, error } = await supabase
    .from("vendor_batches")
    .update({
      batch_name: batchName.trim(),
      eta_at: normalizeEtaValue(etaAt),
    })
    .eq("vendor_id", vendorId)
    .eq("id", batchId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function changeVendorBatchStatus({ vendorId, batchId, currentStatus, nextStatus, etaAt = null }) {
  if (!supabase) {
    throw new Error(supabaseConfigError);
  }

  if (!BATCH_STATUS_TRANSITIONS[currentStatus]?.includes(nextStatus)) {
    throw new Error("That batch status change is not allowed.");
  }

  if (ETA_REQUIRED_BATCH_STATUSES.includes(nextStatus) && !etaAt) {
    throw new Error("A revised ETA is required before moving this batch into delayed or customs-hold status.");
  }

  const { data, error } = await supabase
    .from("vendor_batches")
    .update({
      status: nextStatus,
      ...(ETA_REQUIRED_BATCH_STATUSES.includes(nextStatus) ? { eta_at: normalizeEtaValue(etaAt) } : {}),
    })
    .eq("vendor_id", vendorId)
    .eq("id", batchId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await syncShipmentStatusesForBatch({
    vendorId,
    batchId,
    batchStatus: nextStatus,
  });

  if (ETA_REQUIRED_BATCH_STATUSES.includes(nextStatus)) {
    await appendEtaUpdateHistoryForBatchShipments({
      vendorId,
      batchId,
      batchStatus: nextStatus,
    });
  }

  return data;
}

export async function updateVendorBatchDelayEta({ vendorId, batchId, currentStatus, etaAt }) {
  if (!supabase) {
    throw new Error(supabaseConfigError);
  }

  if (!ETA_REQUIRED_BATCH_STATUSES.includes(currentStatus)) {
    throw new Error("ETA can only be revised directly while the batch is delayed or in customs hold.");
  }

  if (!etaAt) {
    throw new Error("A revised ETA is required before saving this delay update.");
  }

  const { data, error } = await supabase
    .from("vendor_batches")
    .update({ eta_at: normalizeEtaValue(etaAt) })
    .eq("vendor_id", vendorId)
    .eq("id", batchId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await appendEtaUpdateHistoryForBatchShipments({
    vendorId,
    batchId,
    batchStatus: currentStatus,
  });

  return data;
}

export async function addShipmentToBatch({ vendorId, batchId, shipmentId }) {
  if (!supabase) {
    throw new Error(supabaseConfigError);
  }

  const batch = await loadVendorBatch(vendorId, batchId);

  if (!batch) {
    throw new Error("The selected batch could not be found for this vendor.");
  }

  if (!BATCH_ASSIGNMENT_EDITABLE_STATUSES.includes(batch.status)) {
    throw new Error("Shipments can only be assigned to open batches right now.");
  }

  const { data, error } = await supabase
    .from("vendor_shipments")
    .update({
      batch_id: batchId,
      status: "in_batch",
    })
    .eq("vendor_id", vendorId)
    .eq("id", shipmentId)
    .is("batch_id", null)
    .eq("status", "pending")
    .select(BATCH_SHIPMENT_SELECT)
    .single();

  if (error) {
    throw error;
  }

  await appendShipmentStatusHistory([
    {
      vendorId,
      shipmentId: data.id,
      batchId,
      status: data.status,
      eventKind: "batch_linked",
    },
  ]);

  return data;
}

export async function removeShipmentFromBatch({ vendorId, batchId, shipmentId }) {
  if (!supabase) {
    throw new Error(supabaseConfigError);
  }

  const batch = await loadVendorBatch(vendorId, batchId);

  if (!batch) {
    throw new Error("The linked batch could not be found for this vendor.");
  }

  if (!BATCH_ASSIGNMENT_EDITABLE_STATUSES.includes(batch.status)) {
    throw new Error("Shipments can only be removed from open batches right now.");
  }

  const { data, error } = await supabase
    .from("vendor_shipments")
    .update({
      batch_id: null,
      status: "pending",
    })
    .eq("vendor_id", vendorId)
    .eq("id", shipmentId)
    .eq("batch_id", batchId)
    .select(BATCH_SHIPMENT_SELECT)
    .single();

  if (error) {
    throw error;
  }

  await appendShipmentStatusHistory([
    {
      vendorId,
      shipmentId: data.id,
      batchId,
      status: data.status,
      eventKind: "batch_unlinked",
    },
  ]);

  return data;
}

export async function markBatchShipmentCollected({ vendorId, batchId, shipmentId }) {
  if (!supabase) {
    throw new Error(supabaseConfigError);
  }

  const batch = await loadVendorBatch(vendorId, batchId);

  if (!batch) {
    throw new Error("The linked batch could not be found for this vendor.");
  }

  if (!BATCH_PICKUP_ACTIONABLE_STATUSES.includes(batch.status)) {
    throw new Error("Shipments can only be marked as collected after the batch reaches pickup or last-mile stage.");
  }

  const { data: shipment } = await maybeSingle(
    supabase
      .from("vendor_shipments")
      .select(BATCH_SHIPMENT_SELECT)
      .eq("vendor_id", vendorId)
      .eq("id", shipmentId)
      .eq("batch_id", batchId),
  );

  if (!shipment) {
    throw new Error("The shipment could not be found in this batch.");
  }

  if (!BATCH_PICKUP_ACTIONABLE_STATUSES.includes(shipment.status)) {
    throw new Error("Only shipments already in pickup or last-mile stage can be marked as collected right now.");
  }

  const { data, error } = await supabase
    .from("vendor_shipments")
    .update({ status: "collected" })
    .eq("vendor_id", vendorId)
    .eq("id", shipmentId)
    .eq("batch_id", batchId)
    .select(BATCH_SHIPMENT_SELECT)
    .single();

  if (error) {
    throw error;
  }

  await appendShipmentStatusHistory([
    {
      vendorId,
      shipmentId: data.id,
      batchId,
      status: data.status,
      eventKind: "status_change",
    },
  ]);

  return data;
}

export { normalizeErrorMessage, isNonFatalBatchError };
