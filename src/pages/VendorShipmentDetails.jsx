import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Vendor, VendorStaff } from "@/api/entities";
import { suggestOptimalRoute } from "@/api/functions";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  ArrowLeft,
  MapPin,
  User,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  FileText,
  Clock,
  AlertCircle,
  CheckCircle,
  Truck,
  Bell
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import ShipmentMap from "@/components/shipment/ShipmentMap";
import ShipmentHistoryTimeline from "@/components/shipment/ShipmentHistoryTimeline";
import StatusTransition from "@/components/vendor/StatusTransition";
import ShipmentMessaging from "@/components/shipment/ShipmentMessaging";
import { useVendorPermissions } from "@/components/vendor/useVendorPermissions";
import NotificationTrigger from "@/components/vendor/NotificationTrigger";
import { useCurrentUser } from "@/components/hooks/useCurrentUser";

const getLegacyShipmentEntity = () => {
  // Legacy Base44 entity compatibility: this collection is still accessed
  // directly until src/api/entities.js exposes a stable named export for it.
  return base44.entities.Shipment;
};

const getLegacyBranchEntity = () => {
  // Legacy Base44 entity compatibility: this collection is still accessed
  // directly until src/api/entities.js exposes a stable named export for it.
  return base44.entities.Branch;
};

const getLegacyInsuranceClaimEntity = () => {
  // Legacy Base44 entity compatibility: this collection is still accessed
  // directly until src/api/entities.js exposes a stable named export for it.
  return base44.entities.InsuranceClaim;
};

export default function VendorShipmentDetails() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const shipmentId = urlParams.get("id");

  const { user } = useCurrentUser();
  const [vendorStaff, setVendorStaff] = useState(null);

  const { data: vendorStaffData } = useQuery({
    queryKey: ['vendor-staff-me', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const staff = await VendorStaff.filter({ email: user.email, status: "ACTIVE" });
      return staff[0] || null;
    },
    enabled: !!user
  });

  useEffect(() => {
    if (vendorStaffData) setVendorStaff(vendorStaffData);
  }, [vendorStaffData]);

  const { data: shipment, isLoading, refetch } = useQuery({
    queryKey: ['shipment-details', shipmentId],
    queryFn: async () => {
      const shipments = await getLegacyShipmentEntity().filter({ id: shipmentId });
      return shipments[0] || null;
    },
    enabled: !!shipmentId,
    refetchInterval: 30000 // Real-time updates
  });

  const { data: vendor } = useQuery({
    queryKey: ['vendor', shipment?.vendor_id],
    queryFn: async () => {
      if (!shipment) return null;
      const vendors = await Vendor.filter({ id: shipment.vendor_id });
      return vendors[0] || null;
    },
    enabled: !!shipment
  });

  const { data: branch } = useQuery({
    queryKey: ['branch', shipment?.branch_id],
    queryFn: async () => {
      if (!shipment) return null;
      const branches = await getLegacyBranchEntity().filter({ id: shipment.branch_id });
      return branches[0] || null;
    },
    enabled: !!shipment
  });

  const { data: insuranceClaim } = useQuery({
    queryKey: ['insurance-claim', shipment?.id],
    queryFn: async () => {
      if (!shipment?.insurance_enabled) return null;
      const claims = await getLegacyInsuranceClaimEntity().filter({ shipment_id: shipment.id });
      return claims[0] || null;
    },
    enabled: !!shipment
  });

  const { data: optimizedRoute } = useQuery({
    queryKey: ['optimized-route', shipment?.id],
    queryFn: async () => {
      const response = await suggestOptimalRoute({
        shipment_id: shipment.id
      });
      return response.data;
    },
    enabled: !!shipment
  });

  const permissions = useVendorPermissions(vendorStaff);

  const statusColors = {
    PENDING: "bg-gray-500/20 text-gray-300",
    RECEIVED: "bg-blue-500/20 text-blue-300",
    IN_TRANSIT: "bg-orange-500/20 text-orange-300",
    DELIVERED: "bg-emerald-500/20 text-emerald-300",
    ON_HOLD: "bg-red-500/20 text-red-300",
    DELAYED: "bg-amber-500/20 text-amber-300"
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading shipment details...</p>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-12 bg-white/5 border-white/10 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h3 className="text-2xl font-bold text-white mb-2">Shipment Not Found</h3>
          <p className="text-gray-400 mb-6">The shipment you're looking for doesn't exist</p>
          <Button onClick={() => navigate(createPageUrl("VendorShipments"))}>
            Back to Shipments
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("VendorShipments"))}
            className="mb-6 text-gray-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Shipments
          </Button>

          {/* Header */}
          <Card className="p-6 bg-white/5 border-white/10 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Package className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white mb-2">{shipment.tracking_code}</h1>
                  <div className="flex items-center gap-3">
                    <Badge className={statusColors[shipment.status]}>
                      {shipment.status.replace(/_/g, " ")}
                    </Badge>
                    {shipment.mode && (
                      <Badge className="bg-blue-500/20 text-blue-300">
                        {shipment.mode}
                      </Badge>
                    )}
                    {shipment.insurance_enabled && (
                      <Badge className="bg-green-500/20 text-green-300">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Insured
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              {permissions.hasPermission('can_view_amounts') && (
                <div className="text-right">
                  <p className="text-sm text-gray-400 mb-1">Total Amount</p>
                  <p className="text-2xl font-bold text-white">${shipment.total_amount}</p>
                  <Badge className={
                    shipment.payment_status === "PAID" ? "bg-green-500/20 text-green-300" :
                    shipment.payment_status === "PARTIAL" ? "bg-yellow-500/20 text-yellow-300" :
                    "bg-red-500/20 text-red-300"
                  }>
                    {shipment.payment_status}
                  </Badge>
                </div>
              )}
            </div>
          </Card>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Real-Time Tracking Map */}
              <Card className="p-6 bg-white/5 border-white/10">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#9EFF00]" />
                  Real-Time Location Tracking
                </h3>
                {optimizedRoute?.matched && (
                  <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Truck className="w-4 h-4 text-blue-400" />
                      <p className="text-sm font-semibold text-blue-300">Optimized Route: {optimizedRoute.route.name}</p>
                    </div>
                    <div className="text-xs text-gray-400">
                      {optimizedRoute.route.estimated_distance_km && `${optimizedRoute.route.estimated_distance_km} km`}
                      {optimizedRoute.route.estimated_duration_hours && ` • ${optimizedRoute.route.estimated_duration_hours} hours`}
                    </div>
                  </div>
                )}
                <ShipmentMap shipment={shipment} optimizedRoute={optimizedRoute} />
              </Card>

              {/* Sender & Recipient Details */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6 bg-white/5 border-white/10">
                  <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-400" />
                    Sender
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-400">Name</p>
                      <p className="text-white">{shipment.sender_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Phone</p>
                      <p className="text-white flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {shipment.sender_phone}
                      </p>
                    </div>
                    {shipment.sender_email && (
                      <div>
                        <p className="text-sm text-gray-400">Email</p>
                        <p className="text-white flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {shipment.sender_email}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-400">Location</p>
                      <p className="text-white flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {shipment.sender_city}, {shipment.sender_country}
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-white/5 border-white/10">
                  <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-green-400" />
                    Recipient
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-400">Name</p>
                      <p className="text-white">{shipment.recipient_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Phone</p>
                      <p className="text-white flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {shipment.recipient_phone}
                      </p>
                    </div>
                    {shipment.recipient_email && (
                      <div>
                        <p className="text-sm text-gray-400">Email</p>
                        <p className="text-white flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {shipment.recipient_email}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-400">Location</p>
                      <p className="text-white flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {shipment.recipient_city}, {shipment.recipient_country}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Shipment History */}
              <Card className="p-6 bg-white/5 border-white/10">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-400" />
                  Shipment History
                </h3>
                <ShipmentHistoryTimeline shipmentId={shipment.id} />
              </Card>

              {/* Messaging */}
              <Card className="p-6 bg-white/5 border-white/10">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-orange-400" />
                  Customer Communication
                </h3>
                <ShipmentMessaging 
                  shipment={shipment} 
                  vendor={vendor}
                  vendorStaff={vendorStaff}
                />
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status Update */}
              {permissions.hasPermission('can_update_status') && (
                <Card className="p-6 bg-white/5 border-white/10">
                  <h3 className="font-bold text-white mb-4">Update Status</h3>
                  <StatusTransition
                    shipment={shipment}
                    vendorStaff={vendorStaff}
                    vendor={vendor}
                    branch={branch}
                    onSuccess={refetch}
                  />
                </Card>
              )}

              {/* Manual Notification */}
              {permissions.hasPermission('can_bulk_notify') && (
                <Card className="p-6 bg-white/5 border-white/10">
                  <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                    <Bell className="w-5 h-5 text-blue-400" />
                    Notify Customer
                  </h3>
                  <NotificationTrigger shipment={shipment} />
                </Card>
              )}

              {/* Insurance Claim Status */}
              {shipment.insurance_enabled && (
                <Card className="p-6 bg-white/5 border-white/10">
                  <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-400" />
                    Insurance Claim
                  </h3>
                  {insuranceClaim ? (
                    <div className="space-y-3">
                      <Badge className={
                        insuranceClaim.status === 'approved' || insuranceClaim.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                        insuranceClaim.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                        insuranceClaim.status === 'under_review' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400'
                      }>
                        {insuranceClaim.status.replace(/_/g, ' ').toUpperCase()}
                      </Badge>
                      <div>
                        <p className="text-xs text-gray-400">Claim Amount</p>
                        <p className="text-white font-semibold">${insuranceClaim.claim_amount}</p>
                      </div>
                      {insuranceClaim.approved_amount && (
                        <div>
                          <p className="text-xs text-gray-400">Approved Amount</p>
                          <p className="text-green-400 font-semibold">${insuranceClaim.approved_amount}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-400 mb-3">No claim filed</p>
                      <Button size="sm" variant="outline" className="border-white/10">
                        File Claim
                      </Button>
                    </div>
                  )}
                </Card>
              )}

              {/* Package Details */}
              <Card className="p-6 bg-white/5 border-white/10">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Package Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-400">Description</p>
                    <p className="text-white">{shipment.description}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Weight</p>
                    <p className="text-white">{shipment.weight_kg} kg</p>
                  </div>
                  {shipment.length_cm && (
                    <div>
                      <p className="text-sm text-gray-400">Dimensions</p>
                      <p className="text-white">
                        {shipment.length_cm} × {shipment.width_cm} × {shipment.height_cm} cm
                      </p>
                    </div>
                  )}
                </div>
              </Card>

              {/* Timeline */}
              <Card className="p-6 bg-white/5 border-white/10">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Timeline
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-400">Created</p>
                    <p className="text-white">{format(new Date(shipment.created_date), "MMM d, yyyy h:mm a")}</p>
                  </div>
                  {shipment.updated_date && (
                    <div>
                      <p className="text-sm text-gray-400">Last Updated</p>
                      <p className="text-white">{format(new Date(shipment.updated_date), "MMM d, yyyy h:mm a")}</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
