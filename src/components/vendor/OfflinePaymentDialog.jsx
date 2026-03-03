
import React, { useState } from "react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Upload, CheckCircle } from "lucide-react";

export default function OfflinePaymentDialog({ plan, vendor, vendorStaff, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    billing_period: "MONTHLY",
    payment_method: "BANK_TRANSFER",
    payment_reference: "",
    proof_url: ""
  });
  const [uploading, setUploading] = useState(false);

  const amount = formData.billing_period === "MONTHLY" ? plan.monthly_price : plan.annual_price;

  const submitPaymentMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.SubscriptionPayment.create({
        vendor_id: vendor.id,
        plan_name: plan.name,
        billing_period: formData.billing_period,
        amount,
        currency: "USD",
        payment_method: formData.payment_method,
        payment_reference: formData.payment_reference,
        proof_url: formData.proof_url,
        submitted_by: vendorStaff.email,
        status: "AWAITING_VERIFICATION"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-pending-payments'] });
      toast.success("Payment submitted for verification!");
      onClose();
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, proof_url: file_url });
    } catch (error) {
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1a2e] border-white/10 max-w-lg" aria-describedby="payment-dialog-description">
        <DialogHeader>
          <DialogTitle className="text-white">Offline Payment</DialogTitle>
          <p id="payment-dialog-description" className="text-gray-400 text-sm">
            Submit your payment details for verification
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-white/5 rounded-lg">
            <p className="text-sm text-gray-400 mb-1">Plan</p>
            <p className="text-lg font-bold text-white">{plan.display_name}</p>
          </div>

          <div>
            <Label className="text-gray-300">Billing Period</Label>
            <Select value={formData.billing_period} onValueChange={(v) => setFormData({...formData, billing_period: v})}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MONTHLY">Monthly - ${plan.monthly_price}</SelectItem>
                <SelectItem value="ANNUAL">Annual - ${plan.annual_price} (Save {Math.round((1 - plan.annual_price / (plan.monthly_price * 12)) * 100)}%)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-gray-300">Payment Method</Label>
            <Select value={formData.payment_method} onValueChange={(v) => setFormData({...formData, payment_method: v})}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="MOMO">Mobile Money</SelectItem>
                <SelectItem value="ZELLE">Zelle</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-gray-300">Payment Reference</Label>
            <Input
              value={formData.payment_reference}
              onChange={(e) => setFormData({...formData, payment_reference: e.target.value})}
              placeholder="Transaction ID or receipt number"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div>
            <Label className="text-gray-300 mb-2 block">Upload Payment Proof *</Label>
            <Input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              className="hidden"
              id="proof-upload"
            />
            <label
              htmlFor="proof-upload"
              className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:bg-white/5 transition-all"
            >
              {uploading ? (
                <span className="text-gray-400">Uploading...</span>
              ) : formData.proof_url ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-green-400">Proof Uploaded</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-400">Click to upload receipt or proof</span>
                </>
              )}
            </label>
          </div>

          {/* Payment Instructions */}
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg space-y-3">
            <p className="text-sm font-semibold text-amber-300">Payment Instructions</p>
            {formData.payment_method === "BANK_TRANSFER" && (
              <div className="text-xs text-gray-300 space-y-1">
                <p><span className="text-gray-500">Bank:</span> Wells Fargo</p>
                <p><span className="text-gray-500">Account Name:</span> CarryMatch Logistics LLC</p>
                <p><span className="text-gray-500">Account #:</span> 4521-XXXX-XXXX</p>
                <p><span className="text-gray-500">Routing #:</span> 121000248</p>
                <p><span className="text-gray-500">Reference:</span> INV-{vendor?.id?.substring(0, 6)?.toUpperCase()}-{plan.name}</p>
              </div>
            )}
            {formData.payment_method === "MOMO" && (
              <div className="text-xs text-gray-300 space-y-1">
                <p><span className="text-gray-500">MTN MoMo:</span> +237 6XX XXX XXX</p>
                <p><span className="text-gray-500">Orange Money:</span> +237 6XX XXX XXX</p>
                <p><span className="text-gray-500">Name:</span> CarryMatch SARL</p>
                <p><span className="text-gray-500">Reference:</span> {plan.name}-{vendor?.display_name?.substring(0, 8)}</p>
              </div>
            )}
            {formData.payment_method === "ZELLE" && (
              <div className="text-xs text-gray-300 space-y-1">
                <p><span className="text-gray-500">Zelle to:</span> payments@carrymatch.com</p>
                <p><span className="text-gray-500">Memo:</span> {plan.name} - {vendor?.display_name}</p>
              </div>
            )}
            {formData.payment_method === "CASH" && (
              <p className="text-xs text-gray-300">Please arrange cash payment at one of our partner locations. Contact support for nearest drop-off.</p>
            )}
          </div>

          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-300">
              Total Amount: <span className="font-bold">${amount}</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Your payment will be reviewed by our team. You'll receive a redemption code once approved.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-white/10 text-gray-300">
            Cancel
          </Button>
          <Button
            onClick={() => submitPaymentMutation.mutate()}
            disabled={!formData.proof_url || submitPaymentMutation.isPending}
            className="bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] text-[#1A1A1A] font-bold"
          >
            {submitPaymentMutation.isPending ? "Submitting..." : "Submit for Verification"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
