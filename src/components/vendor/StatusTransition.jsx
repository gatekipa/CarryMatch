import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch"; // Added Switch import
// Removed Badge, ArrowRight, CheckCircle as they are no longer used
import { logAudit, getChangedFields } from "./AuditLogger"; // getChangedFields is used, but its output format is simplified in the mutation

const STATUS_TRANSITIONS = {
  PENDING: ["RECEIVED"],
  RECEIVED: ["PACKED", "ON_HOLD"],
  PACKED: ["MANIFESTED"],
  MANIFESTED: ["SHIPPED"],
  SHIPPED: ["IN_TRANSIT", "DELAYED"],
  IN_TRANSIT: ["ARRIVED", "DELAYED", "ON_HOLD"],
  ARRIVED: ["CUSTOMS", "READY_PICKUP"],
  CUSTOMS: ["READY_PICKUP", "ON_HOLD"],
  READY_PICKUP: ["OUT_FOR_DELIVERY", "DELIVERED", "ON_HOLD"],
  OUT_FOR_DELIVERY: ["DELIVERED", "DELAYED"],
  ON_HOLD: ["RECEIVED", "IN_TRANSIT"],
  DELAYED: ["IN_TRANSIT", "ARRIVED"]
};

export default function StatusTransition({
  shipment,
  vendorStaff,
  vendor,
  branch,
  location,
  permissions, // Kept permissions as it's used for restrictedStatuses
  onSuccess
}) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [sendNotification, setSendNotification] = useState(true);
  const [gpsCoords, setGpsCoords] = useState(null);

  // Auto-capture GPS on component mount
  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setGpsCoords(null),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);
  const availableTransitions = STATUS_TRANSITIONS[shipment.status] || [];

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus) => { // newStatus is now passed as an argument
      const updateData = { status: newStatus };

      // Capture current location for tracking
      if (gpsCoords) {
        updateData.current_location = `${gpsCoords.lat.toFixed(6)},${gpsCoords.lng.toFixed(6)}`;
      }

      // Generate OTP if transitioning to READY_PICKUP and no OTP exists
      if (newStatus === "READY_PICKUP" && !shipment.pickup_otp) {
        const otp = Math.floor(1000 + Math.random() * 9000).toString(); // Simplified OTP generation
        updateData.pickup_otp = otp;
        updateData.pickup_otp_generated_at = new Date().toISOString();
      }

      // We no longer need to track oldShipment in detail if logAudit uses simplified changed_fields
      // const oldShipment = { ...shipment }; // Removed as per outline's logAudit change
      const updatedShipment = await base44.entities.Shipment.update(shipment.id, updateData);

      // Log history
      await base44.entities.ShipmentHistory.create({
        shipment_id: shipment.id,
        vendor_id: vendor?.id || shipment.vendor_id, // Added fallbacks
        branch_id: branch?.id || shipment.branch_id, // Added fallbacks
        staff_id: vendorStaff?.id, // Added fallback
        staff_name: vendorStaff?.full_name, // Added fallback
        old_status: shipment.status,
        new_status: newStatus, // Use newStatus directly
        action_type: "STATUS_CHANGE",
        location: gpsCoords ? `${gpsCoords.lat.toFixed(6)},${gpsCoords.lng.toFixed(6)}` : (location || undefined),
        note: note || undefined // Added fallback
      });

      // Log audit - simplified changed_fields as per outline
      // The original getChangedFields function is still imported, but the call here is simplified
      await logAudit({
        entity_type: "SHIPMENT",
        entity_id: shipment.id,
        action: "UPDATE",
        changed_fields: ["status"], // Simplified as per outline
        old_values: { status: shipment.status }, // Simplified as per outline
        new_values: { status: newStatus }, // Simplified as per outline
        vendor_id: vendor?.id || shipment.vendor_id, // Added fallbacks
        branch_id: branch?.id || shipment.branch_id // Added fallbacks
        // Removed metadata as per outline
      });

      // Send automatic notification if enabled
      if (sendNotification) {
        try {
          await base44.functions.invoke('sendShipmentNotification', {
            shipment_id: shipment.id,
            template_type: {
              'RECEIVED': 'shipment_received',
              'IN_TRANSIT': 'in_transit',
              'SHIPPED': 'in_transit',
              'OUT_FOR_DELIVERY': 'out_for_delivery',
              'DELIVERED': 'delivered',
              'DELAYED': 'delayed',
              'ON_HOLD': 'on_hold',
              'CUSTOMS': 'customs_clearance',
              'READY_PICKUP': 'ready_pickup'
            }[newStatus],
            manual_trigger: false
          });
        } catch (error) {
          console.error('Notification error:', error);
        }
      }

      return updatedShipment; // Return updatedShipment, not just newStatus, for potential use in onSuccess if needed
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipment-details'] }); // Changed query key
      queryClient.invalidateQueries({ queryKey: ['vendor-shipments'] }); // Added new query key
      // Removed alert
      if (onSuccess) onSuccess();
    }
  });

  const restrictedStatuses = {
    DELIVERED: !permissions.hasPermission('can_update_to_delivered'), // Adjusted permission check based on context
    CUSTOMS: !permissions.hasPermission('can_update_to_customs') // Adjusted permission check based on context
  };

  const filteredTransitions = availableTransitions.filter(status =>
    restrictedStatuses[status] === undefined || !restrictedStatuses[status] // Logic for filtering
  );

  return (
    <div className="space-y-4">
      {filteredTransitions.length === 0 ? (
        <p className="text-sm text-gray-500">No available status transitions</p>
      ) : (
        <>
          <div className="space-y-2">
            <Label className="text-gray-300 mb-1 block">Update Status</Label>
            {filteredTransitions.map((status) => (
              <Button
                key={status}
                onClick={() => updateStatusMutation.mutate(status)} // Directly call mutate with the status
                disabled={updateStatusMutation.isPending}
                variant="outline"
                className="w-full justify-start border-white/10 text-gray-300 hover:bg-white/10"
              >
                {status.replace(/_/g, " ")}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300 text-sm">Add Note (Optional)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Additional details about status update..."
              className="bg-white/5 border-white/10 text-white"
              rows={2}
            />
          </div>

          <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <Switch
              checked={sendNotification}
              onCheckedChange={setSendNotification}
              className="data-[state=checked]:bg-[#9EFF00]"
            />
            <p className="text-sm text-blue-300">Auto-send notification to customer</p>
          </div>

          {gpsCoords && (
            <p className="text-xs text-gray-500 text-center">
              📍 GPS captured: {gpsCoords.lat.toFixed(4)}, {gpsCoords.lng.toFixed(4)}
            </p>
          )}
        </>
      )}
    </div>
  );
}