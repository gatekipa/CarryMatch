import React, { useState } from "react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Upload, Loader2, MapPin } from "lucide-react";
import { TRACKING_STAGES } from "./ShipmentTracker";

export default function StatusUpdateModal({ match, isOpen, onClose, currentUser }) {
  const queryClient = useQueryClient();
  const [newStatus, setNewStatus] = useState(match.tracking_status || "awaiting_pickup");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [proofPhoto, setProofPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);

  const updateStatusMutation = useMutation({
    mutationFn: async (data) => {
      let proofUrl = match.proof_of_delivery_url;

      // Upload proof photo if provided
      if (proofPhoto) {
        setUploading(true);
        const result = await base44.integrations.Core.UploadFile({ file: proofPhoto });
        proofUrl = result.file_url;
        setUploading(false);
      }

      // Create tracking update entry
      const trackingUpdate = {
        status: data.status,
        timestamp: new Date().toISOString(),
        updated_by: currentUser.email,
        location: data.location,
        notes: data.notes
      };

      const updates = {
        tracking_status: data.status,
        tracking_updates: [...(match.tracking_updates || []), trackingUpdate]
      };

      // If delivered, add delivery timestamp and proof
      if (data.status === "delivered") {
        updates.status = "delivered";
        updates.delivered_at = new Date().toISOString();
        updates.can_leave_review = true;
        if (proofUrl) {
          updates.proof_of_delivery_url = proofUrl;
        }
      }

      // Update the match
      await base44.entities.Match.update(match.id, updates);

      // Send notifications to both parties
      const statusLabel = TRACKING_STAGES.find(s => s.id === data.status)?.label || data.status;
      
      await base44.entities.Notification.create({
        user_email: match.traveler_email,
        type: "system",
        title: "📦 Shipment Status Updated",
        message: `Status changed to: ${statusLabel}`,
        priority: "normal",
        related_id: match.id,
        related_entity_type: "match"
      });

      await base44.entities.Notification.create({
        user_email: match.requester_email,
        type: "system",
        title: "📦 Shipment Status Updated",
        message: `Status changed to: ${statusLabel}`,
        priority: data.status === "delivered" ? "high" : "normal",
        related_id: match.id,
        related_entity_type: "match"
      });

      return updates;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['match'] });
      queryClient.invalidateQueries({ queryKey: ['user-matches'] });
      onClose();
      setLocation("");
      setNotes("");
      setProofPhoto(null);
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate: only the traveler can update tracking status
    if (currentUser.email !== match.traveler_email) {
      toast.error("Only the traveler/carrier can update the shipment status.");
      return;
    }

    // Validate: forward-only transitions
    const newIndex = TRACKING_STAGES.findIndex(s => s.id === newStatus);
    if (newIndex < currentStageIndex) {
      toast.error("Cannot move status backward. Select a later stage.");
      return;
    }

    if (newStatus === "delivered" && !proofPhoto && !match.proof_of_delivery_url) {
      toast.error("Please upload proof of delivery photo");
      return;
    }

    await updateStatusMutation.mutateAsync({
      status: newStatus,
      location,
      notes
    });
  };

  const currentStageIndex = TRACKING_STAGES.findIndex(s => s.id === match.tracking_status);
  const availableStatuses = TRACKING_STAGES.filter((_, index) => 
    index >= currentStageIndex
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0F1D35] border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            Update Shipment Status
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Change the current status of the shipment and add details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Status Select */}
          <div>
            <Label className="text-gray-300">New Status *</Label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableStatuses.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div>
            <Label className="text-gray-300">Current Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., JFK Airport, New York"
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-gray-300">Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional details..."
              rows={3}
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            />
          </div>

          {/* Proof of Delivery (for delivered status) */}
          {newStatus === "delivered" && (
            <div>
              <Label className="text-gray-300">Proof of Delivery Photo *</Label>
              <input
                type="file"
                id="proof-photo"
                accept="image/*"
                onChange={(e) => setProofPhoto(e.target.files[0])}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('proof-photo').click()}
                className="w-full border-white/10 text-gray-300 hover:text-white"
              >
                {proofPhoto ? (
                  <>
                    ✓ Photo selected: {proofPhoto.name}
                  </>
                ) : match.proof_of_delivery_url ? (
                  <>
                    ✓ Already uploaded
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Photo
                  </>
                )}
              </Button>
              <p className="text-xs text-gray-500 mt-1">
                Required for delivery confirmation
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-white/10 text-gray-300 hover:text-white"
              disabled={updateStatusMutation.isPending || uploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateStatusMutation.isPending || uploading}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {updateStatusMutation.isPending || uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {uploading ? "Uploading..." : "Updating..."}
                </>
              ) : (
                "Update Status"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}