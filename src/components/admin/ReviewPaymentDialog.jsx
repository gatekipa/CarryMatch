
import React, { useState } from "react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle, XCircle, FileText, Key } from "lucide-react";
import { format } from "date-fns";

export default function ReviewPaymentDialog({ payment, onClose, onUpdate }) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  const approveMutation = useMutation({
    mutationFn: async () => {
      setIsGeneratingCode(true);

      // Update payment status
      await base44.entities.SubscriptionPayment.update(payment.id, {
        status: "APPROVED",
        reviewed_by: (await base44.auth.me()).email,
        reviewed_at: new Date().toISOString()
      });

      // Generate redemption code
      const codeString = `CML-${payment.plan_name}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const expiresDate = new Date();
      expiresDate.setDate(expiresDate.getDate() + 30); // 30 days to redeem

      const redemptionCode = await base44.entities.RedemptionCode.create({
        code: codeString,
        vendor_id: payment.vendor_id,
        plan_name: payment.plan_name,
        billing_period: payment.billing_period,
        payment_id: payment.id,
        generated_by: (await base44.auth.me()).email,
        generated_at: new Date().toISOString(),
        status: "SENT",
        sent_at: new Date().toISOString(),
        expires_at: expiresDate.toISOString()
      });

      // Update payment with redemption code reference
      await base44.entities.SubscriptionPayment.update(payment.id, {
        redemption_code_id: redemptionCode.id
      });

      // Get vendor details
      const vendors = await base44.entities.Vendor.list();
      const vendor = vendors.find(v => v.id === payment.vendor_id);

      if (vendor?.primary_contact_email) {
        // Send email with redemption code
        await base44.integrations.Core.SendEmail({
          to: vendor.primary_contact_email,
          subject: "Payment Approved - Redemption Code",
          body: `
            <h2>Payment Approved!</h2>
            <p>Dear ${vendor.display_name},</p>
            <p>Your payment has been verified and approved.</p>
            
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0;">Your Redemption Code:</h3>
              <p style="font-size: 24px; font-weight: bold; color: #2563eb; margin: 0; font-family: monospace;">${codeString}</p>
            </div>

            <p><strong>Plan:</strong> ${payment.plan_name}</p>
            <p><strong>Billing Period:</strong> ${payment.billing_period}</p>
            <p><strong>Amount Paid:</strong> $${payment.amount}</p>
            
            <h3>How to Activate:</h3>
            <ol>
              <li>Log in to your vendor dashboard</li>
              <li>Go to Billing & Subscription</li>
              <li>Click "Redeem Code"</li>
              <li>Enter your code: <strong>${codeString}</strong></li>
            </ol>

            <p style="color: #ef4444;"><strong>Important:</strong> This code expires on ${format(expiresDate, "MMMM d, yyyy")}. Please redeem it before then.</p>

            <p>Thank you for choosing CarryMatch!</p>
            <p>Best regards,<br/>The CarryMatch Team</p>
          `
        });
      }

      return redemptionCode;
    },
    onSuccess: () => {
      toast.success("Payment approved and redemption code sent!");
      onUpdate();
      onClose();
    },
    onError: (error) => {
      toast.error("Error approving payment: " + error.message);
      setIsGeneratingCode(false);
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.SubscriptionPayment.update(payment.id, {
        status: "REJECTED",
        reviewed_by: (await base44.auth.me()).email,
        reviewed_at: new Date().toISOString(),
        rejection_reason: rejectionReason
      });

      // Get vendor details
      const vendors = await base44.entities.Vendor.list();
      const vendor = vendors.find(v => v.id === payment.vendor_id);

      if (vendor?.primary_contact_email) {
        // Send rejection email
        await base44.integrations.Core.SendEmail({
          to: vendor.primary_contact_email,
          subject: "Payment Review - Additional Information Needed",
          body: `
            <h2>Payment Review Update</h2>
            <p>Dear ${vendor.display_name},</p>
            <p>We've reviewed your recent payment submission for the ${payment.plan_name} plan.</p>
            
            <p><strong>Status:</strong> Additional information or clarification needed</p>
            
            <div style="background: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 20px 0;">
              <p style="margin: 0;"><strong>Note from our team:</strong></p>
              <p style="margin: 10px 0 0 0;">${rejectionReason || "Please contact support for more details."}</p>
            </div>

            <p>Please contact us at partners@carrymatch.com or resubmit your payment with the correct information.</p>

            <p>Thank you for your understanding.</p>
            <p>Best regards,<br/>The CarryMatch Team</p>
          `
        });
      }
    },
    onSuccess: () => {
      toast.success("Payment rejected and vendor notified");
      onUpdate();
      onClose();
    }
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a1a2e] border-white/10 max-w-2xl" aria-describedby="review-dialog-description">
        <DialogHeader>
          <DialogTitle className="text-white">Review Payment</DialogTitle>
          <p id="review-dialog-description" className="text-gray-400 text-sm">
            Verify payment details and approve or reject the submission
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payment Details */}
          <div className="p-4 bg-white/5 rounded-lg space-y-2">
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-400">Plan</p>
                <p className="text-white font-bold">{payment.plan_name}</p>
              </div>
              <div>
                <p className="text-gray-400">Billing Period</p>
                <p className="text-white font-bold">{payment.billing_period}</p>
              </div>
              <div>
                <p className="text-gray-400">Amount</p>
                <p className="text-white font-bold">${payment.amount} {payment.currency}</p>
              </div>
              <div>
                <p className="text-gray-400">Payment Method</p>
                <p className="text-white font-bold">{payment.payment_method}</p>
              </div>
              <div>
                <p className="text-gray-400">Reference</p>
                <p className="text-white font-bold">{payment.payment_reference || "N/A"}</p>
              </div>
              <div>
                <p className="text-gray-400">Submitted</p>
                <p className="text-white font-bold">
                  {format(new Date(payment.created_date), "MMM d, yyyy h:mm a")}
                </p>
              </div>
              <div>
                <p className="text-gray-400">Vendor ID</p>
                <p className="text-white font-bold">{payment.vendor_id}</p>
              </div>
              <div>
                <p className="text-gray-400">Submitted By</p>
                <p className="text-white font-bold">{payment.submitted_by}</p>
              </div>
            </div>
          </div>

          {/* Payment Proof */}
          {payment.proof_url && (
            <div>
              <Button
                onClick={() => window.open(payment.proof_url, "_blank")}
                variant="outline"
                className="w-full border-white/10 text-gray-300"
              >
                <FileText className="w-4 h-4 mr-2" />
                View Payment Proof
              </Button>
            </div>
          )}

          {/* Rejection Reason (for reject action) */}
          <div>
            <label className="text-gray-300 text-sm block mb-2">
              Rejection Reason (optional - will be sent to vendor)
            </label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="E.g., Payment proof is unclear, amount doesn't match, etc."
              className="bg-white/5 border-white/10 text-white"
              rows={3}
            />
          </div>

          {/* Actions Info */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-300">
              <strong>Approve:</strong> A unique redemption code will be generated and sent to the vendor via email.
            </p>
            <p className="text-sm text-blue-300 mt-2">
              <strong>Reject:</strong> The vendor will be notified and can resubmit payment.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-white/10 text-gray-300"
          >
            Cancel
          </Button>
          <Button
            onClick={() => rejectMutation.mutate()}
            disabled={rejectMutation.isPending}
            className="bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30"
          >
            <XCircle className="w-4 h-4 mr-2" />
            {rejectMutation.isPending ? "Rejecting..." : "Reject"}
          </Button>
          <Button
            onClick={() => approveMutation.mutate()}
            disabled={approveMutation.isPending || isGeneratingCode}
            className="bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] text-[#1A1A1A] font-bold"
          >
            {isGeneratingCode ? (
              <>Generating Code...</>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve & Generate Code
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
