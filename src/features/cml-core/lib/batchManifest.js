/**
 * Generates a printable HTML manifest for a batch.
 * Opens in a new window with window.print().
 *
 * Note: Uses the same popup-based print pattern as shippingLabel.js.
 */
export function openBatchManifest({ batchName, etaAt, shipments, vendorName, t, language }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return "\u2014";
    try {
      return new Intl.DateTimeFormat(language === "fr" ? "fr-FR" : "en-US", {
        year: "numeric", month: "short", day: "numeric",
      }).format(new Date(dateStr));
    } catch { return dateStr; }
  };

  const totalWeight = shipments.reduce((sum, s) => sum + (Number(s.weight_kg) || 0), 0);

  const rows = shipments.map((s, i) => `
    <tr>
      <td>${i + 1}</td>
      <td style="font-family:monospace">${s.tracking_number || "\u2014"}</td>
      <td>${s.sender_name || "\u2014"}</td>
      <td>${s.receiver_name || "\u2014"}</td>
      <td>${s.origin_city || "\u2014"} \u2192 ${s.destination_city || "\u2014"}</td>
      <td style="text-align:right">${s.weight_kg ?? "\u2014"} kg</td>
      <td>${s.payment_status || "\u2014"}</td>
    </tr>
  `).join("");

  const html = `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="utf-8">
  <title>${t("batchManifest.title")} \u2014 ${batchName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 24px; color: #1e293b; }
    h1 { font-size: 20px; margin: 0 0 4px; }
    .meta { font-size: 13px; color: #64748b; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #f1f5f9; text-align: left; padding: 8px 12px; border-bottom: 2px solid #e2e8f0; font-weight: 600; }
    td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) { background: #f8fafc; }
    .summary { margin-top: 16px; font-size: 14px; font-weight: 600; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>${t("batchManifest.title")}: ${batchName}</h1>
  <div class="meta">
    ${vendorName} &middot; ${t("batchManifest.printedOn")} ${formatDate(new Date().toISOString())}
    ${etaAt ? ` &middot; ETA: ${formatDate(etaAt)}` : ""}
  </div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>${t("batchManifest.colTracking")}</th>
        <th>${t("batchManifest.colSender")}</th>
        <th>${t("batchManifest.colReceiver")}</th>
        <th>${t("batchManifest.colRoute")}</th>
        <th style="text-align:right">${t("batchManifest.colWeight")}</th>
        <th>${t("batchManifest.colPayment")}</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="summary">
    ${t("batchManifest.totalItems")}: ${shipments.length} &middot;
    ${t("batchManifest.totalWeight")}: ${totalWeight.toFixed(1)} kg
  </div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
