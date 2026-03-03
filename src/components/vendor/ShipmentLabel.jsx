import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";

export default function ShipmentLabel({ shipment, vendor, branch }) {
  const labelRef = React.useRef(null);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    const content = labelRef.current.innerHTML;
    printWindow.document.write(`
      <html>
        <head>
          <title>Label - ${shipment.tracking_code}</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: Arial, sans-serif;
            }
            @page {
              size: A6;
              margin: 0;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const trackingUrl = `${window.location.origin}/track/${shipment.tracking_code}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(trackingUrl)}`;

  return (
    <Card className="p-6 bg-white/5 border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Shipment Label</h3>
        <div className="flex gap-2">
          <Button
            onClick={handlePrint}
            variant="outline"
            size="sm"
            className="border-white/10 text-gray-300"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Label Preview (A6 size) */}
      <div
        ref={labelRef}
        className="bg-white p-6 rounded-lg"
        style={{
          width: "105mm",
          height: "148mm",
          margin: "0 auto"
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-3">
          {vendor?.logo_url ? (
            <img src={vendor.logo_url} alt={vendor.display_name} className="h-12 object-contain" />
          ) : (
            <div className="font-bold text-lg">{vendor?.display_name}</div>
          )}
          <div className="text-right text-xs">
            <div className="font-bold">{branch?.name}</div>
            <div>{branch?.city}, {branch?.country}</div>
          </div>
        </div>

        {/* QR Code */}
        <div className="flex justify-center mb-4">
          <img 
            src={qrCodeUrl} 
            alt="QR Code"
            className="w-32 h-32"
          />
        </div>

        {/* Tracking Code */}
        <div className="text-center mb-4">
          <div className="text-xs text-gray-600 mb-1">TRACKING NUMBER</div>
          <div className="text-2xl font-bold font-mono tracking-wider border-2 border-black p-2">
            {shipment.tracking_code}
          </div>
        </div>

        {/* Route */}
        <div className="border-t-2 border-black pt-3 mb-3">
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <div className="text-xs font-bold text-gray-600 mb-1">FROM</div>
              <div className="font-bold text-sm">{shipment.sender_name}</div>
              <div className="text-xs text-gray-600">{shipment.sender_city}</div>
              <div className="text-xs text-gray-600">{shipment.sender_country}</div>
            </div>
            <div>
              <div className="text-xs font-bold text-gray-600 mb-1">TO</div>
              <div className="font-bold text-sm">{shipment.recipient_name}</div>
              <div className="text-xs text-gray-600">{shipment.recipient_city}</div>
              <div className="text-xs text-gray-600">{shipment.recipient_country}</div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="border-t-2 border-black pt-3 text-xs">
          <div className="flex justify-between mb-1">
            <span className="text-gray-600">Description:</span>
            <span className="font-medium">{shipment.description}</span>
          </div>
          {shipment.weight_kg && (
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">Weight:</span>
              <span className="font-medium">{shipment.weight_kg} kg</span>
            </div>
          )}
          <div className="flex justify-between mb-1">
            <span className="text-gray-600">Status:</span>
            <span className="font-bold uppercase">{shipment.status}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-black pt-2 mt-3 text-center text-xs text-gray-600">
          <div>Track at: {trackingUrl}</div>
          <div className="mt-1">Created: {new Date(shipment.created_date).toLocaleDateString()}</div>
        </div>
      </div>
    </Card>
  );
}