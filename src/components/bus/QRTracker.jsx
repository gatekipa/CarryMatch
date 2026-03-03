import { useEffect } from "react";
import { base44 } from "@/api/base44Client";

export default function QRTracker({ qrType, targetId, operatorId }) {
  useEffect(() => {
    if (!qrType || !targetId || !operatorId) return;

    // Check if this is a QR scan (look for 'qr' parameter in URL)
    const urlParams = new URLSearchParams(window.location.search);
    const isQRScan = urlParams.get('qr') === '1';

    if (isQRScan) {
      // Log the scan event
      base44.entities.QRScanEvent.create({
        operator_id: operatorId,
        qr_type: qrType,
        target_id: targetId,
        scanned_at: new Date().toISOString(),
        user_agent: navigator.userAgent,
        referrer: document.referrer || null
      }).catch(err => console.error('Failed to log QR scan:', err));
    }
  }, [qrType, targetId, operatorId]);

  return null;
}