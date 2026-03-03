import React, { useState } from "react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DollarSign, Receipt, CheckCircle } from "lucide-react";
import { format } from "date-fns";

export default function PaymentRecordDialog({ shipment, vendor, vendorStaff, onClose }) {
  const queryClient = useQueryClient();
  const isPaid = shipment.payment_status === "PAID";

  const [paymentData, setPaymentData] = useState({
    payment_method: shipment.payment_method || "CASH",
    payment_reference: shipment.payment_reference || "",
    amount_paid: shipment.amount_paid || shipment.total_amount
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async () => {
      const updates = {
        payment_method: paymentData.payment_method,
        payment_reference: paymentData.payment_reference,
        amount_paid: parseFloat(paymentData.amount_paid),
        payment_recorded_by: vendorStaff.id,
        payment_recorded_at: new Date().toISOString(),
        payment_status: parseFloat(paymentData.amount_paid) >= shipment.total_amount ? "PAID" : "PARTIAL"
      };

      await base44.entities.Shipment.update(shipment.id, updates);

      // Log history
      await base44.entities.ShipmentHistory.create({
        shipment_id: shipment.id,
        vendor_id: vendor.id,
        branch_id: shipment.branch_id,
        staff_id: vendorStaff.id,
        staff_name: vendorStaff.full_name,
        action_type: "PAYMENT_RECORDED",
        note: `Payment recorded: ${paymentData.payment_method} - ${vendor.base_currency} ${paymentData.amount_paid}`,
        metadata: {
          payment_method: paymentData.payment_method,
          amount: paymentData.amount_paid,
          reference: paymentData.payment_reference
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-shipments-payments'] });
      toast.success("Payment recorded successfully!");
      onClose();
    }
  });

  const calculateBreakdown = () => {
    const items = [];
    
    items.push({ label: "Base Shipping", amount: shipment.base_price });
    
    if (shipment.insurance_enabled && shipment.insurance_premium) {
      items.push({ label: "Insurance Premium", amount: shipment.insurance_premium });
    }

    if (shipment.line_items && shipment.line_items.length > 0) {
      shipment.line_items.forEach(item => {
        items.push({ label: item.label, amount: item.amount });
      });
    }

    return items;
  };

  const breakdown = calculateBreakdown();

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1a2e] border-white/10 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            {isPaid ? "Payment Receipt" : "Record Payment"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Shipment Info */}
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-400">Tracking Code</p>
              <p className="text-white font-mono font-bold">{shipment.tracking_code}</p>
            </div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-400">Description</p>
              <p className="text-white">{shipment.description}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">Customer</p>
              <p className="text-white">{shipment.sender_name}</p>
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="p-4 bg-white/5 rounded-lg border border-white/10">
            <h3 className="font-bold text-white mb-3">Payment Breakdown</h3>
            <div className="space-y-2">
              {breakdown.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">{item.label}</span>
                  <span className="text-white">{shipment.currency} {item.amount.toFixed(2)}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-white/10 mt-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Total Amount</span>
                  <span className="font-bold text-[#9EFF00] text-lg">
                    {shipment.currency} {shipment.total_amount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {!isPaid ? (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Payment Method *</Label>
                <Select value={paymentData.payment_method} onValueChange={(value) => setPaymentData({...paymentData, payment_method: value})}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="ZELLE">Zelle</SelectItem>
                    <SelectItem value="MOMO">Mobile Money</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-300">Amount Collected *</Label>
                <div className="flex gap-2">
                  <span className="flex items-center px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white">
                    {shipment.currency}
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    value={paymentData.amount_paid}
                    onChange={(e) => setPaymentData({...paymentData, amount_paid: e.target.value})}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>

              <div>
                <Label className="text-gray-300">Reference / Receipt Number</Label>
                <Input
                  value={paymentData.payment_reference}
                  onChange={(e) => setPaymentData({...paymentData, payment_reference: e.target.value})}
                  placeholder="Transaction ID, receipt number, etc."
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>
          ) : (
            <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <h3 className="font-bold text-green-400">Payment Recorded</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Method:</span>
                  <span className="text-white">{shipment.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount Paid:</span>
                  <span className="text-white">{shipment.currency} {shipment.amount_paid?.toFixed(2)}</span>
                </div>
                {shipment.payment_reference && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Reference:</span>
                    <span className="text-white">{shipment.payment_reference}</span>
                  </div>
                )}
                {shipment.payment_recorded_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Recorded:</span>
                    <span className="text-white">
                      {format(new Date(shipment.payment_recorded_at), "MMM d, yyyy h:mm a")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-white/10 text-gray-300"
          >
            Close
          </Button>
          {!isPaid && (
            <Button
              onClick={() => recordPaymentMutation.mutate()}
              disabled={recordPaymentMutation.isPending || !paymentData.amount_paid}
              className="bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] text-[#1A1A1A] font-bold"
            >
              {recordPaymentMutation.isPending ? "Recording..." : "Record Payment"}
              <DollarSign className="w-4 h-4 ml-2" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}