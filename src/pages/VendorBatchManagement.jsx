import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Layers,
  Plus,
  Lock,
  Download,
  Bell,
  Package,
  Plane,
  Ship,
  Bus,
  Truck,
  MapPin,
  Calendar,
  Weight,
  DollarSign,
  FileText,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useVendorPermissions } from "@/components/vendor/useVendorPermissions";
import BatchDetailsDialog from "@/components/vendor/BatchDetailsDialog";
import CreateBatchDialog from "@/components/vendor/CreateBatchDialog";
import { PlanGate } from "@/components/vendor/PlanLimitEnforcer";

export default function VendorBatchManagement() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [vendorStaff, setVendorStaff] = useState(null);
  const [vendor, setVendor] = useState(null);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMode, setFilterMode] = useState("all");

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setAuthChecked(true); }).catch(() => { setUser(null); setAuthChecked(true); });
  }, []);

  useEffect(() => {
    if (user) {
      base44.entities.VendorStaff.filter({ email: user.email, status: "ACTIVE" })
        .then(staff => {
          if (staff[0]) {
            setVendorStaff(staff[0]);
            return base44.entities.Vendor.filter({ id: staff[0].vendor_id });
          }
        })
        .then(vendors => {
          if (vendors) {
            setVendor(vendors?.[0]);
          }
        });
    }
  }, [user]);

  const permissions = useVendorPermissions(vendorStaff);

  const { data: batches = [], isLoading } = useQuery({
    queryKey: ['vendor-batches', vendor?.id, filterStatus, filterMode],
    queryFn: async () => {
      if (!vendor) return [];
      let query = { vendor_id: vendor.id };
      if (filterStatus !== "all") query.status = filterStatus;
      if (filterMode !== "all") query.mode = filterMode;
      return await base44.entities.Batch.filter(query, "-created_date");
    },
    enabled: !!vendor
  });

  const modeIcons = {
    AIR: Plane,
    SEA: Ship,
    BUS: Bus,
    ROAD: Truck,
    RAIL: Truck
  };

  const statusColors = {
    OPEN: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    LOCKED: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    IN_TRANSIT: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    ARRIVED: "bg-green-500/20 text-green-300 border-green-500/30",
    CLOSED: "bg-gray-500/20 text-gray-300 border-gray-500/30"
  };

  if (authChecked && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center max-w-md">
          <h3 className="text-xl font-bold text-white mb-2">Sign In Required</h3>
          <p className="text-gray-400 text-sm mb-5">Sign in with your vendor account to access this page.</p>
          <button onClick={() => base44.auth.redirectToLogin()} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (!user || !vendorStaff || !vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-12 bg-white/5 border-white/10 text-center">
          <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </Card>
      </div>
    );
  }

  if (!permissions.hasPermission('can_add_batch')) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-12 bg-white/5 border-white/10 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h3 className="text-2xl font-bold text-white mb-2">Access Denied</h3>
          <p className="text-gray-400">You don't have permission to manage batches</p>
        </Card>
      </div>
    );
  }

  return (
    <PlanGate vendor={vendor} feature="bulk_operations" featureLabel="Batch / Bulk Operations">
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Batch Management</h1>
              <p className="text-gray-400">Group shipments for departure</p>
            </div>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] text-[#1A1A1A] font-bold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Batch
            </Button>
          </div>

          {/* Filters */}
          <Card className="p-4 bg-white/5 border-white/10 mb-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label className="text-gray-300 mb-2">Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="LOCKED">Locked</SelectItem>
                    <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                    <SelectItem value="ARRIVED">Arrived</SelectItem>
                    <SelectItem value="CLOSED">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label className="text-gray-300 mb-2">Mode</Label>
                <Select value={filterMode} onValueChange={setFilterMode}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Modes</SelectItem>
                    <SelectItem value="AIR">Air</SelectItem>
                    <SelectItem value="SEA">Sea</SelectItem>
                    <SelectItem value="ROAD">Road</SelectItem>
                    <SelectItem value="BUS">Bus</SelectItem>
                    <SelectItem value="RAIL">Rail</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Batch List */}
          {isLoading ? (
            <Card className="p-12 bg-white/5 border-white/10 text-center">
              <p className="text-gray-400">Loading batches...</p>
            </Card>
          ) : batches.length === 0 ? (
            <Card className="p-12 bg-white/5 border-white/10 text-center">
              <Layers className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-bold text-white mb-2">No batches yet</h3>
              <p className="text-gray-400 mb-6">Create your first batch to group shipments</p>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] text-[#1A1A1A] font-bold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Batch
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {batches.map((batch, index) => {
                const ModeIcon = modeIcons[batch.mode] || Truck;
                return (
                  <motion.div
                    key={batch.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className="p-6 bg-white/5 border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                      onClick={() => setSelectedBatch(batch)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <ModeIcon className="w-6 h-6 text-purple-400" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-bold text-white">{batch.code}</h3>
                              <Badge className={statusColors[batch.status]}>
                                {batch.status}
                              </Badge>
                              {batch.mode && (
                                <Badge className="bg-white/10 text-gray-300">
                                  {batch.mode}
                                </Badge>
                              )}
                            </div>
                            
                            {batch.route && (
                              <p className="text-sm text-gray-400 mb-2">{batch.route}</p>
                            )}
                            
                            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                              <div className="flex items-center gap-1">
                                <Package className="w-4 h-4" />
                                {batch.shipment_count || 0} shipments
                              </div>
                              {batch.total_weight_kg > 0 && (
                                <div className="flex items-center gap-1">
                                  <Weight className="w-4 h-4" />
                                  {batch.total_weight_kg} kg
                                </div>
                              )}
                              {permissions.canViewMoney && batch.total_revenue > 0 && (
                                <div className="flex items-center gap-1">
                                  <DollarSign className="w-4 h-4" />
                                  {batch.currency} {batch.total_revenue.toLocaleString()}
                                </div>
                              )}
                              {batch.cutoff_at && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  Cut-off: {format(new Date(batch.cutoff_at), "MMM d, h:mm a")}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {batch.status === "OPEN" && permissions.hasPermission('can_lock_batch') && (
                            <Badge className="bg-blue-500/20 text-blue-300">
                              <Lock className="w-3 h-3 mr-1" />
                              Can Lock
                            </Badge>
                          )}
                        </div>
                      </div>

                      {(batch.flight_number || batch.carrier) && (
                        <div className="pt-3 border-t border-white/10">
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            {batch.carrier && <span>Carrier: {batch.carrier}</span>}
                            {batch.flight_number && <span>#{batch.flight_number}</span>}
                          </div>
                        </div>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Create Batch Dialog */}
      <CreateBatchDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        vendor={vendor}
        vendorStaff={vendorStaff}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['vendor-batches'] });
          setShowCreateDialog(false);
        }}
      />

      {/* Batch Details Dialog */}
      {selectedBatch && (
        <BatchDetailsDialog
          batch={selectedBatch}
          vendor={vendor}
          vendorStaff={vendorStaff}
          permissions={permissions}
          onClose={() => setSelectedBatch(null)}
          onUpdate={() => {
            queryClient.invalidateQueries({ queryKey: ['vendor-batches'] });
          }}
        />
      )}
    </div>
    </PlanGate>
  );
}