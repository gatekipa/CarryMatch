import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Package, Loader2, CheckCircle, Camera, Navigation } from "lucide-react";
import { motion } from "framer-motion";

const STATUS_TRANSITIONS = {
  PENDING: ['RECEIVED'],
  RECEIVED: ['PACKED', 'ON_HOLD'],
  PACKED: ['MANIFESTED', 'ON_HOLD'],
  MANIFESTED: ['SHIPPED', 'ON_HOLD'],
  SHIPPED: ['IN_TRANSIT', 'ON_HOLD'],
  IN_TRANSIT: ['ARRIVED', 'CUSTOMS', 'DELAYED', 'ON_HOLD'],
  ARRIVED: ['READY_PICKUP', 'OUT_FOR_DELIVERY'],
  CUSTOMS: ['ARRIVED', 'ON_HOLD'],
  READY_PICKUP: ['DELIVERED', 'ON_HOLD'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'DELAYED', 'ON_HOLD'],
  DELAYED: ['IN_TRANSIT', 'OUT_FOR_DELIVERY'],
  ON_HOLD: ['RECEIVED', 'PACKED', 'IN_TRANSIT']
};

const STATUS_LABELS = {
  PENDING: "Pending",
  RECEIVED: "Received at Origin",
  PACKED: "Packed",
  MANIFESTED: "Manifested",
  SHIPPED: "Shipped",
  IN_TRANSIT: "In Transit",
  ARRIVED: "Arrived at Destination",
  CUSTOMS: "At Customs",
  READY_PICKUP: "Ready for Pickup",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  DELAYED: "Delayed",
  ON_HOLD: "On Hold",
  RETURNED: "Returned",
  LOST: "Lost",
  DAMAGED: "Damaged"
};

export default function RealTimeStatusUpdate({ shipment, vendorStaff, branch, onSuccess }) {
  const queryClient = useQueryClient();
  const [newStatus, setNewStatus] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [proofPhoto, setProofPhoto] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [autoLocation, setAutoLocation] = useState(true);

  useEffect(() => {
    if (autoLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          
          // Reverse geocode to get address
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`)
            .then(res => res.json())
            .then(data => {
              if (data.display_name) {
                setLocation(data.display_name);
              }
            })
            .catch(() => {});
        },
        (error) => {
          console.log("Location access denied");
          setAutoLocation(false);
        }
      );
    }
  }, [autoLocation]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      let proofUrl = null;

      if (proofPhoto) {
        const uploadResult = await base44.integrations.Core.UploadFile({ file: proofPhoto });
        proofUrl = uploadResult.file_url;
      }

      const historyEntry = {
        status: data.status,
        location: data.location || branch?.city || "Unknown",
        notes: data.notes,
        updated_by: vendorStaff.full_name || vendorStaff.email,
        branch_id: branch?.id,
        latitude: currentLocation?.latitude,
        longitude: currentLocation?.longitude,
        timestamp: new Date().toISOString()
      };

      const updates = {
        status: data.status,
        current_location: currentLocation ? {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          address: data.location
        } : shipment.current_location
      };

      if (data.status === 'DELIVERED') {
        updates.delivered_at = new Date().toISOString();
        if (proofUrl) {
          updates.proof_of_delivery_url = proofUrl;
        }
      }

      await base44.entities.Shipment.update(shipment.id, updates);

      await base44.entities.ShipmentHistory.create({
        shipment_id: shipment.id,
        vendor_id: shipment.vendor_id,
        tracking_code: shipment.tracking_code,
        ...historyEntry
      });

      // Send automated notifications
      await Promise.all([
        base44.integrations.Core.SendEmail({
          to: shipment.sender_email,
          subject: `Shipment Update: ${shipment.tracking_code}`,
          body: `
            <h2>Shipment Status Update</h2>
            <p>Your shipment <strong>${shipment.tracking_code}</strong> has been updated.</p>
            <p><strong>New Status:</strong> ${STATUS_LABELS[data.status]}</p>
            <p><strong>Location:</strong> ${data.location || 'In Transit'}</p>
            ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
            <p>Track your shipment at: ${window.location.origin}/tracking/${shipment.tracking_code}</p>
          `
        }),
        base44.integrations.Core.SendEmail({
          to: shipment.recipient_email,
          subject: `Shipment Update: ${shipment.tracking_code}`,
          body: `
            <h2>Shipment Status Update</h2>
            <p>A shipment addressed to you (<strong>${shipment.tracking_code}</strong>) has been updated.</p>
            <p><strong>New Status:</strong> ${STATUS_LABELS[data.status]}</p>
            <p><strong>Location:</strong> ${data.location || 'In Transit'}</p>
            ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
            <p>Track your shipment at: ${window.location.origin}/tracking/${shipment.tracking_code}</p>
          `
        })
      ]);

      await base44.entities.ShipmentNotification.create({
        shipment_id: shipment.id,
        tracking_code: shipment.tracking_code,
        recipient_email: shipment.sender_email,
        recipient_phone: shipment.sender_phone,
        status: data.status,
        message: `Status updated to ${STATUS_LABELS[data.status]}`,
        sent_at: new Date().toISOString()
      });

      return updates;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['shipments']);
      queryClient.invalidateQueries(['shipment-history']);
      onSuccess?.();
    }
  });

  const availableStatuses = STATUS_TRANSITIONS[shipment.status] || [];

  return (
    <Card className="p-6 bg-white/5 border-white/10">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Package className="w-5 h-5 text-[#9EFF00]" />
        Update Status
      </h3>

      <form onSubmit={(e) => {
        e.preventDefault();
        if (!newStatus) {
          toast.error("Please select a new status");
          return;
        }
        updateMutation.mutate({ status: newStatus, location, notes });
      }} className="space-y-4">
        
        {/* Current Status */}
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-xs text-gray-400 mb-1">Current Status</p>
          <Badge className="bg-blue-500/20 text-blue-300">
            {STATUS_LABELS[shipment.status]}
          </Badge>
        </div>

        {/* New Status */}
        <div>
          <Label className="text-gray-300 mb-2">New Status *</Label>
          <Select value={newStatus} onValueChange={setNewStatus}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Select new status..." />
            </SelectTrigger>
            <SelectContent>
              {availableStatuses.map(status => (
                <SelectItem key={status} value={status}>
                  {STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Location */}
        <div>
          <Label className="text-gray-300 mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Location
            {currentLocation && (
              <Badge className="bg-green-500/20 text-green-300 text-xs">
                <Navigation className="w-3 h-3 mr-1" />
                GPS Active
              </Badge>
            )}
          </Label>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Current location..."
            className="bg-white/5 border-white/10 text-white"
          />
        </div>

        {/* Notes */}
        <div>
          <Label className="text-gray-300 mb-2">Notes (Optional)</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional details..."
            rows={3}
            className="bg-white/5 border-white/10 text-white"
          />
        </div>

        {/* Proof Photo */}
        {newStatus === 'DELIVERED' && (
          <div>
            <Label className="text-gray-300 mb-2">Proof of Delivery *</Label>
            <input
              type="file"
              id="proof"
              accept="image/*"
              capture="environment"
              onChange={(e) => setProofPhoto(e.target.files[0])}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('proof').click()}
              className="w-full border-white/10"
            >
              {proofPhoto ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                  Photo Selected: {proofPhoto.name}
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4 mr-2" />
                  Take Photo
                </>
              )}
            </Button>
          </div>
        )}

        {/* Submit */}
        <Button
          type="submit"
          disabled={updateMutation.isPending || !newStatus}
          className="w-full bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] hover:from-[#7ACC00] hover:to-[#9EFF00] text-[#1A1A1A] font-bold"
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Update Status & Notify
            </>
          )}
        </Button>
      </form>
    </Card>
  );
}