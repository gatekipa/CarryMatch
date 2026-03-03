import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { QrCode, Package, MapPin, User, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useVendorPermissions } from "@/components/vendor/useVendorPermissions";
import StatusTransition from "@/components/vendor/StatusTransition";
import OTPVerification from "@/components/vendor/OTPVerification";
import { toast } from "sonner";

export default function VendorScanUpdate() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [vendorStaff, setVendorStaff] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [branch, setBranch] = useState(null);
  const [trackingInput, setTrackingInput] = useState("");
  const [scannedShipment, setScannedShipment] = useState(null);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setAuthChecked(true); }).catch(() => { setUser(null); setAuthChecked(true); });
  }, []);

  useEffect(() => {
    if (user) {
      base44.entities.VendorStaff.filter({ email: user.email, status: "ACTIVE" })
        .then(staff => {
          if (staff[0]) {
            setVendorStaff(staff[0]);
            return Promise.all([
              base44.entities.Vendor.filter({ id: staff[0].vendor_id }),
              base44.entities.Branch.filter({ vendor_id: staff[0].vendor_id })
            ]);
          }
        })
        .then((result) => {
          if (result) {
            const [vendors, branches] = result;
            setVendor(vendors?.[0]);
            setBranch(branches?.[0]);
          }
        });
    }
  }, [user]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        () => console.log("Location denied")
      );
    }
  }, []);

  const permissions = useVendorPermissions(vendorStaff);

  const searchShipmentMutation = useMutation({
    mutationFn: async () => {
      const shipments = await base44.entities.Shipment.filter({
        tracking_code: trackingInput.toUpperCase(),
        vendor_id: vendor.id
      });
      if (shipments.length === 0) throw new Error("Not found");
      return shipments[0];
    },
    onSuccess: (shipment) => {
      setScannedShipment(shipment);
    },
    onError: () => {
      toast.error("Shipment not found");
    }
  });

  const handleScan = useCallback(() => {
    if (trackingInput) {
      searchShipmentMutation.mutate();
    }
  }, [trackingInput]);

  const handleReset = useCallback(() => {
    setScannedShipment(null);
    setTrackingInput("");
  }, []);

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

  if (!permissions.hasPermission('can_update_status')) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-12 bg-white/5 border-white/10 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h3 className="text-2xl font-bold text-white mb-2">Access Denied</h3>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <QrCode className="w-6 h-6 text-[#9EFF00]" />
          Scan & Update
        </h1>

        {!scannedShipment ? (
          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Scan or enter tracking..."
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleScan()}
                className="bg-white/5 border-white/10 text-white font-mono"
                autoFocus
              />
              <Button
                onClick={handleScan}
                disabled={!trackingInput || searchShipmentMutation.isPending}
                className="bg-[#9EFF00] text-[#1A1A1A] font-bold"
              >
                {searchShipmentMutation.isPending ? "..." : "Scan"}
              </Button>
            </div>
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Card className="p-4 bg-white/5 border-white/10 mb-4">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-bold text-white font-mono">{scannedShipment.tracking_code}</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="border-white/10"
                >
                  New
                </Button>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <Package className="w-4 h-4" />
                  <span className="text-white">{scannedShipment.description}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span className="text-white">{scannedShipment.sender_city} → {scannedShipment.recipient_city}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <User className="w-4 h-4" />
                  <span className="text-white">{scannedShipment.sender_name} → {scannedShipment.recipient_name}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-white/10">
                <Badge className="bg-blue-500/20 text-blue-300">
                  {scannedShipment.status}
                </Badge>
              </div>
            </Card>

            {scannedShipment.status === "READY_PICKUP" && !scannedShipment.pickup_otp_verified ? (
              <OTPVerification
                shipment={scannedShipment}
                vendorStaff={vendorStaff}
                vendor={vendor}
                branch={branch}
                location={location}
                onSuccess={() => {
                  handleReset();
                  queryClient.invalidateQueries({ queryKey: ['batch-shipments'] });
                }}
              />
            ) : (
              <StatusTransition
                shipment={scannedShipment}
                vendorStaff={vendorStaff}
                vendor={vendor}
                branch={branch}
                location={location}
                permissions={permissions}
                onSuccess={() => {
                  handleReset();
                  queryClient.invalidateQueries({ queryKey: ['batch-shipments'] });
                }}
              />
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}