import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, MapPin, Package, Clock, TrendingUp } from "lucide-react";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import RealTimeTrackingMap from "@/components/shipment/RealTimeTrackingMap";
import RealTimeStatusUpdate from "@/components/vendor/RealTimeStatusUpdate";
import { useVendorPermissions } from "@/components/vendor/useVendorPermissions";

export default function VendorRealTimeTracking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const trackingCode = searchParams.get('tracking');
  
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [vendorStaff, setVendorStaff] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [searchInput, setSearchInput] = useState(trackingCode || "");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => navigate(createPageUrl("PartnerLogin")));
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

  const { data: shipment, refetch } = useQuery({
    queryKey: ['shipment-tracking', searchInput, vendor?.id],
    queryFn: async () => {
      if (!searchInput || !vendor) return null;
      const shipments = await base44.entities.Shipment.filter({
        tracking_code: searchInput.toUpperCase(),
        vendor_id: vendor.id
      });
      return shipments[0] || null;
    },
    enabled: !!searchInput && !!vendor,
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  const { data: branches } = useQuery({
    queryKey: ['branches', vendor?.id],
    queryFn: () => base44.entities.Branch.filter({ vendor_id: vendor.id }),
    enabled: !!vendor
  });

  const { data: history } = useQuery({
    queryKey: ['shipment-history', shipment?.id],
    queryFn: () => base44.entities.ShipmentHistory.filter({ shipment_id: shipment.id }),
    enabled: !!shipment,
    refetchInterval: 30000
  });

  const originBranch = branches?.find(b => b.id === shipment?.branch_id);
  const destinationBranch = branches?.find(b => b.id === shipment?.destination_branch_id);

  const handleSearch = () => {
    if (searchInput) {
      navigate(createPageUrl("VendorRealTimeTracking", `tracking=${searchInput}`));
      refetch();
    }
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("VendorDashboard"))}
            className="text-gray-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
          <MapPin className="w-8 h-8 text-[#9EFF00]" />
          Real-Time Tracking
        </h1>

        {/* Search Bar */}
        <Card className="p-6 bg-white/5 border-white/10 mb-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter tracking code..."
                className="pl-10 bg-white/5 border-white/10 text-white font-mono text-lg"
              />
            </div>
            <Button
              onClick={handleSearch}
              className="bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] text-[#1A1A1A] font-bold px-8"
            >
              Track
            </Button>
          </div>
        </Card>

        {shipment ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid lg:grid-cols-3 gap-6"
          >
            {/* Left Column - Map & Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipment Info Card */}
              <Card className="p-6 bg-white/5 border-white/10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white font-mono mb-2">
                      {shipment.tracking_code}
                    </h2>
                    <p className="text-gray-400">{shipment.description}</p>
                  </div>
                  <Badge className="bg-blue-500/20 text-blue-300 text-sm">
                    {shipment.status.replace(/_/g, ' ')}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400 mb-1">Sender</p>
                    <p className="text-white font-medium">{shipment.sender_name}</p>
                    <p className="text-gray-400 text-xs">{shipment.sender_city}, {shipment.sender_country}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 mb-1">Recipient</p>
                    <p className="text-white font-medium">{shipment.recipient_name}</p>
                    <p className="text-gray-400 text-xs">{shipment.recipient_city}, {shipment.recipient_country}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/10">
                  <div className="text-center">
                    <Package className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                    <p className="text-xs text-gray-400">Weight</p>
                    <p className="text-white font-bold">{shipment.weight_kg} kg</p>
                  </div>
                  <div className="text-center">
                    <Clock className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                    <p className="text-xs text-gray-400">Created</p>
                    <p className="text-white font-bold">
                      {new Date(shipment.created_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <TrendingUp className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                    <p className="text-xs text-gray-400">Updates</p>
                    <p className="text-white font-bold">{history?.length || 0}</p>
                  </div>
                </div>
              </Card>

              {/* Real-Time Map */}
              <RealTimeTrackingMap
                shipment={shipment}
                branch={originBranch}
                destinationBranch={destinationBranch}
              />

              {/* History Timeline */}
              {history && history.length > 0 && (
                <Card className="p-6 bg-white/5 border-white/10">
                  <h3 className="text-xl font-bold text-white mb-4">Tracking History</h3>
                  <div className="space-y-4">
                    {history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map((entry, index) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex gap-4"
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <Badge className="bg-white/10 text-white">
                              {entry.status.replace(/_/g, ' ')}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(entry.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-white text-sm">{entry.location}</p>
                          {entry.notes && (
                            <p className="text-gray-400 text-xs mt-1">{entry.notes}</p>
                          )}
                          <p className="text-gray-500 text-xs mt-1">
                            Updated by {entry.updated_by}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* Right Column - Status Update */}
            <div className="lg:col-span-1">
              {permissions.hasPermission('can_update_status') && (
                <RealTimeStatusUpdate
                  shipment={shipment}
                  vendorStaff={vendorStaff}
                  branch={originBranch}
                  onSuccess={() => refetch()}
                />
              )}
            </div>
          </motion.div>
        ) : searchInput && (
          <Card className="p-12 bg-white/5 border-white/10 text-center">
            <Package className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <p className="text-gray-400">No shipment found with tracking code: <span className="font-mono text-white">{searchInput}</span></p>
          </Card>
        )}
      </div>
    </div>
  );
}