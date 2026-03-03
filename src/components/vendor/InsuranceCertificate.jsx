import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shield, Download } from "lucide-react";
import { format } from "date-fns";

export default function InsuranceCertificate({ shipment, vendor, onClose }) {
  const certRef = React.useRef(null);

  const policyId = shipment.insurance_policy_id || `POL-${shipment.tracking_code}-${Date.now().toString().slice(-6)}`;
  
  const coverageText = shipment.insurance_coverage_text || 
    `This certificate provides insurance coverage for the shipment described below against loss or damage during transit. Coverage is valid from pickup to final delivery. Claims must be filed within 30 days of delivery. Maximum coverage limited to declared value. Exclusions apply for prohibited items, improper packaging, and acts of God.`;

  const handleDownloadPDF = () => {
    const printWindow = window.open("", "_blank");
    const content = certRef.current.innerHTML;
    printWindow.document.write(`
      <html>
        <head>
          <title>Insurance Certificate - ${shipment.tracking_code}</title>
          <style>
            body { font-family: Arial; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px; }
            .section { margin: 20px 0; }
            .section-title { font-weight: bold; margin-bottom: 10px; font-size: 14px; color: #333; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
            .info-item { padding: 10px; background: #f5f5f5; border-radius: 4px; }
            .label { font-size: 11px; color: #666; margin-bottom: 3px; }
            .value { font-size: 13px; font-weight: bold; }
            .coverage { background: #e3f2fd; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 10px; color: #666; }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1a2e] border-white/10 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Insurance Certificate
          </DialogTitle>
        </DialogHeader>

        <Button
          onClick={handleDownloadPDF}
          className="mb-4 bg-blue-500 hover:bg-blue-600"
        >
          <Download className="w-4 h-4 mr-2" />
          Download PDF
        </Button>

        <div ref={certRef} className="bg-white p-8 rounded-lg">
          <div className="header">
            <div className="flex items-center justify-between mb-4">
              {vendor?.logo_url ? (
                <img src={vendor.logo_url} alt={vendor.display_name} className="h-12" />
              ) : (
                <h2 className="text-xl font-bold">{vendor?.display_name}</h2>
              )}
              <div className="text-right">
                <p className="text-lg font-bold">INSURANCE CERTIFICATE</p>
                <p className="text-sm text-gray-600">Policy ID: {policyId}</p>
              </div>
            </div>
          </div>

          <div className="section">
            <div className="section-title">Shipment Information</div>
            <div className="info-grid">
              <div className="info-item">
                <div className="label">Tracking Code</div>
                <div className="value">{shipment.tracking_code}</div>
              </div>
              <div className="info-item">
                <div className="label">Insurance Date</div>
                <div className="value">{format(new Date(shipment.created_date), "MMMM d, yyyy")}</div>
              </div>
              <div className="info-item">
                <div className="label">Description</div>
                <div className="value">{shipment.description}</div>
              </div>
              <div className="info-item">
                <div className="label">Weight</div>
                <div className="value">{shipment.weight_kg || "N/A"} kg</div>
              </div>
            </div>
          </div>

          <div className="section">
            <div className="section-title">Route Information</div>
            <div className="info-grid">
              <div className="info-item">
                <div className="label">Origin</div>
                <div className="value">{shipment.sender_city}, {shipment.sender_country}</div>
              </div>
              <div className="info-item">
                <div className="label">Destination</div>
                <div className="value">{shipment.recipient_city}, {shipment.recipient_country}</div>
              </div>
            </div>
          </div>

          <div className="section">
            <div className="section-title">Coverage Details</div>
            <div className="info-grid">
              <div className="info-item">
                <div className="label">Declared Value</div>
                <div className="value">{shipment.currency} {shipment.declared_value?.toFixed(2)}</div>
              </div>
              <div className="info-item">
                <div className="label">Insurance Premium</div>
                <div className="value">{shipment.currency} {shipment.insurance_premium?.toFixed(2)}</div>
              </div>
              <div className="info-item">
                <div className="label">Coverage Rate</div>
                <div className="value">{vendor?.insurance_default_rate_pct || 2}%</div>
              </div>
              <div className="info-item">
                <div className="label">Maximum Coverage</div>
                <div className="value">{shipment.currency} {vendor?.max_insured_value?.toLocaleString() || "10,000"}</div>
              </div>
            </div>
          </div>

          <div className="coverage">
            <div className="section-title">Terms & Conditions</div>
            <p style={{ fontSize: "11px", lineHeight: "1.6", color: "#333" }}>
              {coverageText}
            </p>
          </div>

          <div className="section">
            <div className="section-title">Insured Parties</div>
            <div className="info-grid">
              <div className="info-item">
                <div className="label">Sender</div>
                <div className="value">{shipment.sender_name}</div>
                <div className="label" style={{ marginTop: "5px" }}>Contact</div>
                <div style={{ fontSize: "11px" }}>{shipment.sender_phone}</div>
              </div>
              <div className="info-item">
                <div className="label">Recipient</div>
                <div className="value">{shipment.recipient_name}</div>
                <div className="label" style={{ marginTop: "5px" }}>Contact</div>
                <div style={{ fontSize: "11px" }}>{shipment.recipient_phone}</div>
              </div>
            </div>
          </div>

          <div className="footer">
            <p><strong>Issued by:</strong> {vendor?.display_name}</p>
            <p><strong>Date:</strong> {format(new Date(), "MMMM d, yyyy")}</p>
            <p style={{ marginTop: "10px" }}>
              This is a computer-generated certificate. For claims or inquiries, contact {vendor?.primary_contact_email || "support@vendor.com"}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}