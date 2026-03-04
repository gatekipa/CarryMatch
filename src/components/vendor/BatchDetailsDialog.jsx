
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Lock,
  Download,
  Bell,
  Package,
  QrCode,
  Plus,
  X,
  Truck,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import BatchManifest from "./BatchManifest";
import BulkNotifyDialog from "./BulkNotifyDialog";

export default function BatchDetailsDialog({ batch, vendor, vendorStaff, permissions, onClose, onUpdate }) {
  const queryClient = useQueryClient();
  const [scanMode, setScanMode] = useState(false);
  const [scanInput, setScanInput] = useState("");
  const [showManifest, setShowManifest] = useState(false);
  const [showBulkNotify, setShowBulkNotify] = useState(false);
  const [bulkStatusUpdate, setBulkStatusUpdate] = useState("");

  const { data: shipments = [], refetch: refetchShipments } = useQuery({
    queryKey: ['batch-shipments', batch.id],
    queryFn: async () => {
      return await base44.entities.Shipment.filter({ batch_id: batch.id }, "-created_date");
    }
  });

  const { data: availableShipments = [] } = useQuery({
    queryKey: ['available-shipments', vendor.id],
    queryFn: async () => {
      return await base44.entities.Shipment.filter({
        vendor_id: vendor.id,
        batch_id: null,
        status: { $in: ["PENDING", "RECEIVED", "PACKED"] }
      }, "-created_date");
    },
    enabled: batch.status === "OPEN"
  });

  const addShipmentMutation = useMutation({
    mutationFn: async (shipmentId) => {
      // Find shipment either from availableShipments (if selecting) or by tracking_code (if scanning)
      let shipment;
      if (shipmentId) {
        shipment = availableShipments.find(s => s.id === shipmentId);
      } else if (scanInput) {
        const result = await base44.entities.Shipment.filter({ tracking_code: scanInput });
        shipment = result.length > 0 ? result[0] : null;
      }
      
      if (!shipment) throw new Error("Shipment not found or already in a batch");
      
      await base44.entities.Shipment.update(shipment.id, {
        batch_id: batch.id,
        status: "IN_BATCH"
      });

      const newCount = (batch.shipment_count || 0) + 1;
      const newWeight = (batch.total_weight_kg || 0) + (shipment.weight_kg || 0);
      const newRevenue = (batch.total_revenue || 0) + (shipment.total_amount || 0);

      await base44.entities.Batch.update(batch.id, {
        shipment_count: newCount,
        total_weight_kg: newWeight,
        total_revenue: newRevenue
      });
    },
    onSuccess: () => {
      refetchShipments();
      onUpdate(); // Propagate batch update to parent
      setScanInput("");
      queryClient.invalidateQueries({ queryKey: ['available-shipments', vendor.id] }); // Refresh available shipments
    }
  });

  const removeShipmentMutation = useMutation({
    mutationFn: async (shipment) => {
      await base44.entities.Shipment.update(shipment.id, {
        batch_id: null,
        status: "RECEIVED"
      });

      const newCount = Math.max(0, (batch.shipment_count || 0) - 1);
      const newWeight = Math.max(0, (batch.total_weight_kg || 0) - (shipment.weight_kg || 0));
      const newRevenue = Math.max(0, (batch.total_revenue || 0) - (shipment.total_amount || 0));

      await base44.entities.Batch.update(batch.id, {
        shipment_count: newCount,
        total_weight_kg: newWeight,
        total_revenue: newRevenue
      });
    },
    onSuccess: () => {
      refetchShipments();
      onUpdate(); // Propagate batch update to parent
      queryClient.invalidateQueries({ queryKey: ['available-shipments', vendor.id] }); // Refresh available shipments
    }
  });

  const lockBatchMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Batch.update(batch.id, {
        status: "LOCKED",
        locked_by_staff_id: vendorStaff.id,
        locked_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      onUpdate();
      toast.success("Batch locked successfully!");
    }
  });

  const bulkStatusMutation = useMutation({
    mutationFn: async () => {
      const updatePromises = shipments.map(s => 
        base44.entities.Shipment.update(s.id, { status: bulkStatusUpdate })
      );
      await Promise.all(updatePromises);

      if (bulkStatusUpdate === "IN_TRANSIT") {
        await base44.entities.Batch.update(batch.id, { status: "IN_TRANSIT" });
      } else if (bulkStatusUpdate === "ARRIVED_DESTINATION") {
        await base44.entities.Batch.update(batch.id, { status: "ARRIVED" });
      }
    },
    onSuccess: () => {
      refetchShipments();
      onUpdate();
      setBulkStatusUpdate("");
      toast.success("Status updated for all shipments!");
    }
  });

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="bg-[#1a1a2e] border-white/10 max-w-5xl max-h-[90vh] overflow-y-auto" aria-describedby="batch-dialog-description">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-white text-2xl">{batch.code}</DialogTitle>
                <p id="batch-dialog-description" className="text-gray-400 text-sm">{batch.route}</p>
              </div>
              <Badge className={
                batch.status === "OPEN" ? "bg-blue-500/20 text-blue-300" :
                batch.status === "LOCKED" ? "bg-yellow-500/20 text-yellow-300" :
                batch.status === "IN_TRANSIT" ? "bg-orange-500/20 text-orange-300" :
                batch.status === "ARRIVED" ? "bg-green-500/20 text-green-300" :
                "bg-gray-500/20 text-gray-300"
              }>
                {batch.status}
              </Badge>
            </div>
          </DialogHeader>

          {/* Summary Cards */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <Card className="p-4 bg-white/5 border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{batch.shipment_count || 0}</p>
                  <p className="text-xs text-gray-400">Shipments</p>
                </div>
              </div>
            </Card>

            {batch.total_weight_kg > 0 && (
              <Card className="p-4 bg-white/5 border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Truck className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{batch.total_weight_kg}</p>
                    <p className="text-xs text-gray-400">kg Total</p>
                  </div>
                </div>
              </Card>
            )}

            {permissions.canViewMoney && batch.total_revenue > 0 && (
              <Card className="p-4 bg-white/5 border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-green-400 font-bold">$</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{batch.currency} {batch.total_revenue.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">Revenue</p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 mb-6">
            {batch.status === "OPEN" && permissions.hasPermission('can_lock_batch') && (
              <Button
                onClick={() => lockBatchMutation.mutate()}
                disabled={lockBatchMutation.isPending || shipments.length === 0}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
              >
                <Lock className="w-4 h-4 mr-2" />
                Lock Batch
              </Button>
            )}

            {permissions.hasPermission('can_export_manifest') && (
              <Button
                onClick={() => setShowManifest(true)}
                variant="outline"
                className="border-white/10 text-gray-300"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Manifest
              </Button>
            )}

            {permissions.hasPermission('can_bulk_notify') && shipments.length > 0 && (
              <Button
                onClick={() => setShowBulkNotify(true)}
                variant="outline"
                className="border-white/10 text-gray-300"
              >
                <Bell className="w-4 h-4 mr-2" />
                Bulk Notify
              </Button>
            )}

            {permissions.hasPermission('can_update_status') && shipments.length > 0 && (
              <div className="flex gap-2">
                <Select value={bulkStatusUpdate} onValueChange={setBulkStatusUpdate}>
                  <SelectTrigger className="w-48 bg-white/5 border-white/10 text-white">
                    <span className="text-gray-400">Bulk Status Update...</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IN_TRANSIT">Mark All In Transit</SelectItem>
                    <SelectItem value="ARRIVED_DESTINATION">Mark All Arrived</SelectItem>
                  </SelectContent>
                </Select>
                {bulkStatusUpdate && (
                  <Button
                    onClick={() => bulkStatusMutation.mutate()}
                    disabled={bulkStatusMutation.isPending}
                    className="bg-[#9EFF00] text-black font-bold"
                  >
                    Apply
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Add Shipments Section */}
          {batch.status === "OPEN" && (
            <Card className="p-4 bg-white/5 border-white/10 mb-6">
              <h3 className="font-bold text-white mb-3">Add Shipments</h3>
              
              <div className="flex gap-2 mb-4">
                <Button
                  variant={scanMode ? "default" : "outline"}
                  onClick={() => setScanMode(true)}
                  className={scanMode ? "bg-[#9EFF00] text-black" : "border-white/10"}
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Scan
                </Button>
                <Button
                  variant={!scanMode ? "default" : "outline"}
                  onClick={() => setScanMode(false)}
                  className={!scanMode ? "bg-[#9EFF00] text-black" : "border-white/10"}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Select
                </Button>
              </div>

              {scanMode ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="Scan or enter tracking code..."
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && scanInput) {
                        addShipmentMutation.mutate();
                      }
                    }}
                    className="bg-white/5 border-white/10 text-white"
                    autoFocus
                  />
                  <Button
                    onClick={() => addShipmentMutation.mutate()}
                    disabled={!scanInput || addShipmentMutation.isPending}
                    className="bg-[#9EFF00] text-black"
                  >
                    Add
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableShipments.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No available shipments</p>
                  ) : (
                    availableShipments.map(shipment => (
                      <div
                        key={shipment.id}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10"
                      >
                        <div>
                          <p className="text-white font-medium">{shipment.tracking_code}</p>
                          <p className="text-xs text-gray-400">{shipment.description}</p>
                        </div>
                        <Button
                          onClick={() => addShipmentMutation.mutate(shipment.id)}
                          size="sm"
                          className="bg-[#9EFF00] text-black"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </Card>
          )}

          {/* Shipments List */}
          <div>
            <h3 className="font-bold text-white mb-3">
              Shipments in Batch ({shipments.length})
            </h3>
            {shipments.length === 0 ? (
              <Card className="p-8 bg-white/5 border-white/10 text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-500" />
                <p className="text-gray-400">No shipments in this batch yet</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {shipments.map(shipment => (
                  <Card key={shipment.id} className="p-4 bg-white/5 border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="text-white font-mono font-medium">{shipment.tracking_code}</p>
                          <Badge className="bg-white/10 text-gray-300 text-xs">
                            {shipment.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-400 mb-1">{shipment.description}</p>
                        <div className="flex gap-4 text-xs text-gray-500">
                          <span>{shipment.sender_name} → {shipment.recipient_name}</span>
                          {shipment.weight_kg && <span>{shipment.weight_kg} kg</span>}
                          {permissions.canViewMoney && <span>{shipment.currency} {shipment.total_amount}</span>}
                        </div>
                      </div>
                      {batch.status === "OPEN" && (
                        <Button
                          onClick={() => removeShipmentMutation.mutate(shipment)}
                          variant="ghost"
                          size="icon"
                          className="text-red-400 hover:bg-red-500/20"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={onClose} variant="outline" className="border-white/10 text-gray-300">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manifest Dialog */}
      {showManifest && (
        <BatchManifest
          batch={batch}
          shipments={shipments}
          vendor={vendor}
          onClose={() => setShowManifest(false)}
        />
      )}

      {/* Bulk Notify Dialog */}
      {showBulkNotify && (
        <BulkNotifyDialog
          batch={batch}
          shipments={shipments}
          vendor={vendor}
          onClose={() => setShowBulkNotify(false)}
        />
      )}
    </>
  );
}
