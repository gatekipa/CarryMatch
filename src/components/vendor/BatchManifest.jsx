import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, FileText } from "lucide-react";
import { format } from "date-fns";

export default function BatchManifest({ batch, shipments, vendor, onClose }) {
  const manifestRef = React.useRef(null);

  const handleDownloadPDF = () => {
    const printWindow = window.open("", "_blank");
    const content = manifestRef.current.innerHTML;
    printWindow.document.write(`
      <html>
        <head>
          <title>Manifest - ${batch.code}</title>
          <style>
            body { font-family: Arial; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f2f2f2; }
            .header { margin-bottom: 20px; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownloadCSV = () => {
    const headers = ["Tracking Code", "Sender", "Recipient", "Origin", "Destination", "Description", "Weight (kg)", "Value", "Insured"];
    const rows = shipments.map(s => [
      s.tracking_code,
      s.sender_name,
      s.recipient_name,
      `${s.sender_city}, ${s.sender_country}`,
      `${s.recipient_city}, ${s.recipient_country}`,
      s.description,
      s.weight_kg || "",
      s.declared_value || s.total_amount || "",
      s.insurance_enabled ? "Yes" : "No"
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `manifest-${batch.code}.csv`;
    a.click();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1a2e] border-white/10 max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Batch Manifest
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-3 mb-4">
          <Button onClick={handleDownloadPDF} className="bg-red-500 hover:bg-red-600">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button onClick={handleDownloadCSV} className="bg-green-500 hover:bg-green-600">
            <Download className="w-4 h-4 mr-2" />
            Download CSV
          </Button>
        </div>

        <div ref={manifestRef} className="bg-white p-8 rounded-lg">
          <div className="header">
            <div className="flex items-center justify-between mb-4">
              {vendor?.logo_url ? (
                <img src={vendor.logo_url} alt={vendor.display_name} className="h-12" />
              ) : (
                <h2 className="text-xl font-bold">{vendor?.display_name}</h2>
              )}
              <div className="text-right text-sm">
                <p className="font-bold">SHIPMENT MANIFEST</p>
                <p>Date: {format(new Date(), "yyyy-MM-dd HH:mm")}</p>
              </div>
            </div>

            <div className="bg-gray-100 p-4 rounded mb-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Batch Code:</strong> {batch.code}</p>
                  <p><strong>Route:</strong> {batch.route}</p>
                  <p><strong>Mode:</strong> {batch.mode}</p>
                </div>
                <div>
                  {batch.carrier && <p><strong>Carrier:</strong> {batch.carrier}</p>}
                  {batch.flight_number && <p><strong>Flight/Vessel:</strong> {batch.flight_number}</p>}
                  {batch.etd_at && <p><strong>ETD:</strong> {format(new Date(batch.etd_at), "yyyy-MM-dd HH:mm")}</p>}
                </div>
              </div>
            </div>

            <div className="mb-4 text-sm">
              <p><strong>Total Shipments:</strong> {shipments.length}</p>
              <p><strong>Total Weight:</strong> {batch.total_weight_kg} kg</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Tracking Code</th>
                <th>Sender</th>
                <th>Recipient</th>
                <th>Origin</th>
                <th>Destination</th>
                <th>Description</th>
                <th>Weight (kg)</th>
                <th>Value</th>
                <th>Insured</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((shipment, index) => (
                <tr key={shipment.id}>
                  <td>{index + 1}</td>
                  <td>{shipment.tracking_code}</td>
                  <td>{shipment.sender_name}</td>
                  <td>{shipment.recipient_name}</td>
                  <td>{shipment.sender_city}, {shipment.sender_country}</td>
                  <td>{shipment.recipient_city}, {shipment.recipient_country}</td>
                  <td>{shipment.description}</td>
                  <td>{shipment.weight_kg || "-"}</td>
                  <td>{shipment.currency} {shipment.declared_value || shipment.total_amount || "-"}</td>
                  <td>{shipment.insurance_enabled ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-8 text-xs text-gray-600 border-t pt-4">
            <p>Generated by {vendor?.display_name}</p>
            <p>This manifest is for internal use and shipping documentation purposes.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}