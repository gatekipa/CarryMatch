import { jsPDF } from "jspdf";
import QRCode from "qrcode";

const LABEL_WIDTH = 288;
const LABEL_HEIGHT = 432;
const LABEL_PADDING = 18;

function toDisplayValue(value, fallback) {
  const normalizedValue = String(value ?? "").trim();
  return normalizedValue || fallback;
}

function buildTrackingUrl(trackingNumber) {
  const normalizedTrackingNumber = encodeURIComponent(String(trackingNumber ?? "").trim());

  if (typeof window === "undefined") {
    return `/track/${normalizedTrackingNumber}`;
  }

  return new URL(`/track/${normalizedTrackingNumber}`, window.location.origin).toString();
}

function createPreviewWindow(title) {
  if (typeof window === "undefined") {
    return null;
  }

  const previewWindow = window.open("", "_blank", "noopener,noreferrer");

  if (!previewWindow) {
    return null;
  }

  previewWindow.document.write(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          body {
            margin: 0;
            padding: 24px;
            font-family: Arial, sans-serif;
            color: #0f172a;
            background: #f8fafc;
          }

          .label-loading {
            max-width: 420px;
            margin: 40px auto;
            padding: 20px;
            border: 1px solid #cbd5e1;
            border-radius: 16px;
            background: #ffffff;
            box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="label-loading">${title}</div>
      </body>
    </html>
  `);
  previewWindow.document.close();

  return previewWindow;
}

function fitTextLines(doc, text, maxWidth, maxLines = 3) {
  const rawLines = doc.splitTextToSize(String(text ?? ""), maxWidth);

  if (rawLines.length <= maxLines) {
    return rawLines;
  }

  const visibleLines = rawLines.slice(0, maxLines);
  const lastLine = visibleLines[maxLines - 1];
  visibleLines[maxLines - 1] = `${String(lastLine).slice(0, Math.max(lastLine.length - 3, 0)).trim()}...`;
  return visibleLines;
}

function drawField(doc, { label, value, y, maxWidth, fallback, maxLines = 3 }) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(label, LABEL_PADDING, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  const lines = fitTextLines(doc, toDisplayValue(value, fallback), maxWidth, maxLines);
  doc.text(lines, LABEL_PADDING, y + 12);

  return y + 18 + lines.length * 11;
}

function triggerPdfPreview(doc, fileName, previewWindow) {
  const pdfBlob = doc.output("blob");
  const pdfUrl = URL.createObjectURL(pdfBlob);

  if (previewWindow) {
    previewWindow.location.replace(pdfUrl);
  } else if (typeof window !== "undefined") {
    const downloadLink = window.document.createElement("a");
    downloadLink.href = pdfUrl;
    downloadLink.download = fileName;
    downloadLink.click();
  }

  window.setTimeout(() => {
    URL.revokeObjectURL(pdfUrl);
  }, 60000);
}

export async function openShipmentLabel({
  vendorName,
  trackingNumber,
  senderName,
  receiverName,
  destinationBranchName,
  destinationLocation,
  shippingModeLabel,
  weightLabel,
  contentsSummary,
  paymentStatusLabel,
  t,
}) {
  const resolvedTrackingNumber = String(trackingNumber ?? "").trim();

  if (!resolvedTrackingNumber) {
    throw new Error("A tracking number is required before a shipping label can be generated.");
  }

  const trackingUrl = buildTrackingUrl(resolvedTrackingNumber);
  const previewWindow = createPreviewWindow(t("shippingLabel.loadingPreview"));
  const qrCodeDataUrl = await QRCode.toDataURL(trackingUrl, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 280,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: [LABEL_WIDTH, LABEL_HEIGHT],
  });

  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, LABEL_WIDTH, LABEL_HEIGHT, "F");

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(1);
  doc.rect(LABEL_PADDING, LABEL_PADDING, LABEL_WIDTH - LABEL_PADDING * 2, 86);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(15, 23, 42);
  doc.text(
    fitTextLines(
      doc,
      toDisplayValue(vendorName, t("shippingLabel.companyFallback")),
      LABEL_WIDTH - LABEL_PADDING * 2 - 88,
      2,
    ),
    LABEL_PADDING + 10,
    LABEL_PADDING + 22,
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(t("shippingLabel.title"), LABEL_PADDING + 10, LABEL_PADDING + 52);

  doc.setFont("courier", "bold");
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(resolvedTrackingNumber, LABEL_PADDING + 10, LABEL_PADDING + 72);

  doc.addImage(qrCodeDataUrl, "PNG", LABEL_WIDTH - LABEL_PADDING - 70, LABEL_PADDING + 8, 60, 60);

  let y = LABEL_PADDING + 108;
  const maxFieldWidth = LABEL_WIDTH - LABEL_PADDING * 2;

  y = drawField(doc, {
    label: t("shippingLabel.sender"),
    value: senderName,
    y,
    maxWidth: maxFieldWidth,
    fallback: t("shippingLabel.notAvailable"),
    maxLines: 2,
  });
  y = drawField(doc, {
    label: t("shippingLabel.receiver"),
    value: receiverName,
    y,
    maxWidth: maxFieldWidth,
    fallback: t("shippingLabel.notAvailable"),
    maxLines: 2,
  });
  y = drawField(doc, {
    label: t("shippingLabel.destinationBranch"),
    value: destinationBranchName,
    y,
    maxWidth: maxFieldWidth,
    fallback: t("shippingLabel.notAvailable"),
    maxLines: 2,
  });
  y = drawField(doc, {
    label: t("shippingLabel.destination"),
    value: destinationLocation,
    y,
    maxWidth: maxFieldWidth,
    fallback: t("shippingLabel.notAvailable"),
    maxLines: 2,
  });
  y = drawField(doc, {
    label: t("shippingLabel.shippingMode"),
    value: shippingModeLabel,
    y,
    maxWidth: maxFieldWidth,
    fallback: t("shippingLabel.notAvailable"),
    maxLines: 1,
  });
  y = drawField(doc, {
    label: t("shippingLabel.weight"),
    value: weightLabel,
    y,
    maxWidth: maxFieldWidth,
    fallback: t("shippingLabel.notAvailable"),
    maxLines: 1,
  });
  y = drawField(doc, {
    label: t("shippingLabel.contents"),
    value: contentsSummary,
    y,
    maxWidth: maxFieldWidth,
    fallback: t("shippingLabel.notAvailable"),
    maxLines: 3,
  });
  y = drawField(doc, {
    label: t("shippingLabel.paymentStatus"),
    value: paymentStatusLabel,
    y,
    maxWidth: maxFieldWidth,
    fallback: t("shippingLabel.notAvailable"),
    maxLines: 1,
  });

  doc.setDrawColor(203, 213, 225);
  doc.line(LABEL_PADDING, y + 2, LABEL_WIDTH - LABEL_PADDING, y + 2);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(t("shippingLabel.scanToTrack"), LABEL_PADDING, y + 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(fitTextLines(doc, trackingUrl, maxFieldWidth, 2), LABEL_PADDING, y + 30);

  triggerPdfPreview(doc, `${resolvedTrackingNumber}-label.pdf`, previewWindow);
}
