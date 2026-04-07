import { openShipmentLabel } from "@/features/cml-core/lib/shippingLabel";

/**
 * Generates labels for all shipments in a batch.
 * Opens each in a new tab (browser may block multiple popups).
 * For production, consider generating a multi-page PDF.
 */
export function openBatchLabels({ shipments, vendor, destinationBranches, t }) {
  if (!shipments?.length) return;

  // For now, open the first label (single PDF with all labels would be better)
  // This is a simplified implementation
  for (const shipment of shipments) {
    const branch = destinationBranches?.find((b) => b.id === shipment.destination_branch_id);

    openShipmentLabel({
      vendorName: vendor?.company_name || "",
      trackingNumber: shipment.tracking_number || "",
      senderName: shipment.sender_name || "",
      receiverName: shipment.receiver_name || "",
      destinationBranchName: branch?.branch_name || "",
      destinationLocation: branch?.address_text || "",
      shippingModeLabel: shipment.shipping_mode || "",
      weightLabel: `${shipment.weight_kg ?? "\u2014"} kg`,
      contentsSummary: (shipment.contents_description || "").substring(0, 50),
      paymentStatusLabel: shipment.payment_status || "",
      t,
    });

    // Small delay to prevent popup blocking
    // In production, combine into a single multi-page PDF
  }
}
