const CUSTOMER_UPDATE_EVENT_TYPES = new Set([
  "shipment_created",
  "batch_shipped",
  "batch_arrived",
  "ready_for_pickup",
  "delayed",
  "customs_hold",
  "out_for_last_mile_delivery",
  "collected",
  "eta_updated",
  "processing_update",
]);

const CUSTOMER_UPDATE_EVENT_FROM_STATUS = {
  draft: "shipment_created",
  pending: "shipment_created",
  in_batch: "shipment_created",
  in_transit: "batch_shipped",
  delayed: "delayed",
  customs_hold: "customs_hold",
  arrived: "batch_arrived",
  ready_for_pickup: "ready_for_pickup",
  out_for_last_mile_delivery: "out_for_last_mile_delivery",
  collected: "collected",
  returned: "returned",
  cancelled: "cancelled",
};

const CUSTOMER_UPDATE_EVENT_FROM_HISTORY_KIND = {
  created: "shipment_created",
  eta_updated: "eta_updated",
  batch_linked: "processing_update",
  batch_unlinked: "processing_update",
};

const CUSTOMER_UPDATE_RECIPIENT_ROLES = {
  shipment_created: ["sender", "receiver"],
  batch_shipped: ["sender", "receiver"],
  batch_arrived: ["sender", "receiver"],
  ready_for_pickup: ["receiver"],
  delayed: ["sender", "receiver"],
  customs_hold: ["sender", "receiver"],
  out_for_last_mile_delivery: ["receiver"],
  collected: ["sender"],
};

export function getCustomerFacingRecipientRoles(eventType) {
  return CUSTOMER_UPDATE_RECIPIENT_ROLES[eventType] ?? [];
}

export function getCustomerFacingStatusLabelKey(status) {
  const mappedStatusKey = CUSTOMER_UPDATE_EVENT_FROM_STATUS[status] ?? "processing_update";
  return `customerUpdates.statusLabels.${mappedStatusKey}`;
}

export function getCustomerFacingUpdateType({ eventType, eventKind, status }) {
  if (CUSTOMER_UPDATE_EVENT_TYPES.has(eventType)) {
    return eventType;
  }

  if (CUSTOMER_UPDATE_EVENT_FROM_HISTORY_KIND[eventKind]) {
    return CUSTOMER_UPDATE_EVENT_FROM_HISTORY_KIND[eventKind];
  }

  if (eventKind === "status_change") {
    return CUSTOMER_UPDATE_EVENT_FROM_STATUS[status] ?? "processing_update";
  }

  return CUSTOMER_UPDATE_EVENT_FROM_STATUS[status] ?? "processing_update";
}

export function getCustomerFacingUpdateLabelKey(update, recipientRole = "public") {
  const updateType = getCustomerFacingUpdateType(update);

  if (updateType === "shipment_created") {
    if (recipientRole === "sender") {
      return "customerUpdates.eventLabels.shipment_created.sender";
    }

    if (recipientRole === "receiver") {
      return "customerUpdates.eventLabels.shipment_created.receiver";
    }

    return "customerUpdates.eventLabels.shipment_created.public";
  }

  return `customerUpdates.eventLabels.${updateType}`;
}
