
import React, { useState } from "react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Key, CheckCircle, AlertCircle } from "lucide-react";

export default function RedeemCodeDialog({ vendor, vendorStaff, onClose }) {
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const redeemCodeMutation = useMutation({
    mutationFn: async () => {
      // Find redemption code
      const codes = await base44.entities.RedemptionCode.filter({
        code: code.toUpperCase(),
        vendor_id: vendor.id,
        status: "SENT"
      });

      if (codes.length === 0) {
        throw new Error("Invalid or expired redemption code");
      }

      const redemptionCode = codes[0];

      // Check expiration
      if (redemptionCode.expires_at && new Date(redemptionCode.expires_at) < new Date()) {
        throw new Error("This code has expired");
      }

      // Activate code
      await base44.entities.RedemptionCode.update(redemptionCode.id, {
        status: "ACTIVATED",
        activated_at: new Date().toISOString(),
        activated_by: vendorStaff.email
      });

      // Update vendor subscription
      const startDate = new Date();
      const expiresDate = new Date();
      if (redemptionCode.billing_period === "MONTHLY") {
        expiresDate.setMonth(expiresDate.getMonth() + 1);
      } else {
        expiresDate.setFullYear(expiresDate.getFullYear() + 1);
      }

      await base44.entities.Vendor.update(vendor.id, {
        current_plan: redemptionCode.plan_name,
        billing_period: redemptionCode.billing_period,
        plan_started_at: startDate.toISOString(),
        plan_expires_at: expiresDate.toISOString(),
        shipments_this_period: 0
      });

      return redemptionCode;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-pending-payments'] });
      toast.success("Redemption code activated successfully!");
      onClose();
      window.location.reload();
    },
    onError: (error) => {
      setError(error.message);
    }
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1a2e] border-white/10 max-w-md" aria-describedby="redeem-dialog-description">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Key className="w-5 h-5" />
            Redeem Code
          </DialogTitle>
          <p id="redeem-dialog-description" className="text-gray-400 text-sm">
            Activate your subscription by entering the redemption code
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-[#9EFF00]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Key className="w-8 h-8 text-[#9EFF00]" />
            </div>
            <p className="text-gray-400 text-sm">
              Enter the redemption code you received from CarryMatch support
            </p>
          </div>

          <div>
            <Label className="text-gray-300">Redemption Code</Label>
            <Input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError("");
              }}
              placeholder="CML-GROWTH-XXXXXX"
              className="bg-white/5 border-white/10 text-white text-center font-mono text-lg"
              maxLength={20}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-xs text-blue-300">
              Code format: CML-[PLAN]-[CODE]
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-white/10 text-gray-300">
            Cancel
          </Button>
          <Button
            onClick={() => redeemCodeMutation.mutate()}
            disabled={code.length < 10 || redeemCodeMutation.isPending}
            className="bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] text-[#1A1A1A] font-bold"
          >
            {redeemCodeMutation.isPending ? "Redeeming..." : "Redeem Code"}
            <CheckCircle className="w-4 h-4 ml-2" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
