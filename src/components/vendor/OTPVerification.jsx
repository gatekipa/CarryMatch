import React, { useState } from "react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Shield, CheckCircle, AlertTriangle, Upload } from "lucide-react";

export default function OTPVerification({ shipment, vendorStaff, vendor, branch, location, onSuccess }) {
  const [otpInput, setOtpInput] = useState("");
  const [useFallback, setUseFallback] = useState(false);
  const [fallbackData, setFallbackData] = useState({
    signature_url: "",
    photo_url: "",
    note: ""
  });
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const verifyOTPMutation = useMutation({
    mutationFn: async () => {
      if (otpInput !== shipment.pickup_otp) {
        throw new Error("Invalid OTP code");
      }

      // Update shipment
      await base44.entities.Shipment.update(shipment.id, {
        status: "DELIVERED",
        pickup_otp_verified: true,
        current_location: location || undefined
      });

      // Log history
      await base44.entities.ShipmentHistory.create({
        shipment_id: shipment.id,
        vendor_id: vendor.id,
        branch_id: branch?.id,
        staff_id: vendorStaff.id,
        staff_name: vendorStaff.full_name,
        old_status: shipment.status,
        new_status: "DELIVERED",
        action_type: "OTP_VERIFIED",
        location: location || undefined,
        metadata: { otp_verified: true }
      });

      // Send delivery confirmation
      console.log("Sending delivery confirmation to:", {
        sender: shipment.sender_phone,
        recipient: shipment.recipient_phone
      });
    },
    onSuccess: () => {
      toast.success("OTP verified! Shipment marked as delivered.");
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const fallbackDeliveryMutation = useMutation({
    mutationFn: async () => {
      if (!fallbackData.signature_url && !fallbackData.photo_url) {
        throw new Error("Please provide signature or ID photo");
      }

      // Update shipment
      await base44.entities.Shipment.update(shipment.id, {
        status: "DELIVERED",
        pickup_fallback_signature: fallbackData.signature_url || undefined,
        pickup_fallback_photo: fallbackData.photo_url || undefined,
        pickup_fallback_note: fallbackData.note || undefined,
        current_location: location || undefined
      });

      // Log history
      await base44.entities.ShipmentHistory.create({
        shipment_id: shipment.id,
        vendor_id: vendor.id,
        branch_id: branch?.id,
        staff_id: vendorStaff.id,
        staff_name: vendorStaff.full_name,
        old_status: shipment.status,
        new_status: "DELIVERED",
        action_type: "DELIVERED_FALLBACK",
        location: location || undefined,
        note: fallbackData.note,
        metadata: {
          fallback_used: true,
          has_signature: !!fallbackData.signature_url,
          has_photo: !!fallbackData.photo_url
        }
      });
    },
    onSuccess: () => {
      toast.success("Shipment marked as delivered with fallback verification.");
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (type === "signature") setUploadingSignature(true);
    if (type === "photo") setUploadingPhoto(true);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (type === "signature") {
        setFallbackData({ ...fallbackData, signature_url: file_url });
      } else {
        setFallbackData({ ...fallbackData, photo_url: file_url });
      }
    } catch (error) {
      toast.error("Failed to upload file");
    } finally {
      if (type === "signature") setUploadingSignature(false);
      if (type === "photo") setUploadingPhoto(false);
    }
  };

  return (
    <div className="space-y-4">
      {!useFallback ? (
        <Card className="p-6 bg-white/5 border-white/10">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[#9EFF00]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-[#9EFF00]" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">OTP Verification Required</h3>
            <p className="text-gray-400 text-sm">
              Ask recipient for their 4-digit OTP code
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Enter OTP Code</Label>
              <Input
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="0000"
                className="bg-white/5 border-white/10 text-white text-center text-2xl font-mono tracking-wider"
                maxLength={4}
                autoFocus
              />
            </div>

            <Button
              onClick={() => verifyOTPMutation.mutate()}
              disabled={otpInput.length !== 4 || verifyOTPMutation.isPending}
              className="w-full bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] text-[#1A1A1A] font-bold text-lg py-6"
            >
              {verifyOTPMutation.isPending ? "Verifying..." : "Verify & Deliver"}
              <CheckCircle className="w-5 h-5 ml-2" />
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-[#1a1a2e] text-gray-500">OR</span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => setUseFallback(true)}
              className="w-full border-white/10 text-gray-300"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Use Fallback Verification
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-6 bg-white/5 border-white/10">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              Fallback Verification
            </h3>
            <p className="text-gray-400 text-sm">
              Use when recipient doesn't have OTP
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-gray-300 mb-2">Signature or Acknowledgment</Label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, "signature")}
                  className="hidden"
                  id="signature-upload"
                />
                <label
                  htmlFor="signature-upload"
                  className="flex-1 flex items-center justify-center gap-2 p-3 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:bg-white/5"
                >
                  {uploadingSignature ? (
                    <span className="text-gray-400">Uploading...</span>
                  ) : fallbackData.signature_url ? (
                    <span className="text-[#9EFF00]">✓ Signature Uploaded</span>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-400">Upload Signature</span>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div>
              <Label className="text-gray-300 mb-2">ID Photo (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, "photo")}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="flex-1 flex items-center justify-center gap-2 p-3 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:bg-white/5"
                >
                  {uploadingPhoto ? (
                    <span className="text-gray-400">Uploading...</span>
                  ) : fallbackData.photo_url ? (
                    <span className="text-[#9EFF00]">✓ Photo Uploaded</span>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-400">Upload ID Photo</span>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div>
              <Label className="text-gray-300">Notes</Label>
              <Textarea
                value={fallbackData.note}
                onChange={(e) => setFallbackData({ ...fallbackData, note: e.target.value })}
                placeholder="Reason for fallback, ID details checked, etc..."
                className="bg-white/5 border-white/10 text-white"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setUseFallback(false)}
                className="flex-1 border-white/10 text-gray-300"
              >
                Back to OTP
              </Button>
              <Button
                onClick={() => fallbackDeliveryMutation.mutate()}
                disabled={(!fallbackData.signature_url && !fallbackData.photo_url) || fallbackDeliveryMutation.isPending}
                className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold"
              >
                {fallbackDeliveryMutation.isPending ? "Processing..." : "Confirm Delivery"}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}