import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TrackingDisplay from "@/components/tracking/TrackingDisplay";
import TrackingFeedbackForm from "@/components/tracking/TrackingFeedbackForm";
import { toast } from "sonner";

export default function PublicTracking() {
  const [trackingCode, setTrackingCode] = useState("");
  const [shipment, setShipment] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [history, setHistory] = useState([]);

  const trackShipmentMutation = useMutation({
    mutationFn: async () => {
      const shipments = await base44.entities.Shipment.filter({
        tracking_code: trackingCode.toUpperCase()
      });

      if (shipments.length === 0) {
        throw new Error("Shipment not found. Please check your tracking code.");
      }

      const foundShipment = shipments[0];

      const vendors = await base44.entities.Vendor.filter({ id: foundShipment.vendor_id });
      const foundVendor = vendors[0];

      const shipmentHistory = await base44.entities.ShipmentHistory.filter({
        shipment_id: foundShipment.id
      }, "-created_date");

      return {
        shipment: foundShipment,
        vendor: foundVendor,
        history: shipmentHistory
      };
    },
    onSuccess: (data) => {
      setShipment(data.shipment);
      setVendor(data.vendor);
      setHistory(data.history);
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const handleTrack = () => {
    if (trackingCode) {
      trackShipmentMutation.mutate();
    }
  };

  const handleReset = () => {
    setShipment(null);
    setVendor(null);
    setHistory([]);
    setTrackingCode("");
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Track Your Shipment</h1>
            <p className="text-gray-400">Enter your tracking code to view real-time status</p>
          </div>

          {!shipment ? (
            <Card className="p-8 bg-white/5 border-white/10">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Enter tracking code (e.g., CM-ABC-123456)"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                    onKeyPress={(e) => e.key === 'Enter' && handleTrack()}
                    className="pl-12 bg-white/5 border-white/10 text-white text-lg h-14 font-mono"
                    autoFocus
                  />
                </div>
                <Button
                  onClick={handleTrack}
                  disabled={!trackingCode || trackShipmentMutation.isPending}
                  className="bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] text-[#1A1A1A] font-bold px-8 h-14"
                >
                  {trackShipmentMutation.isPending ? "Searching..." : "Track"}
                </Button>
              </div>
            </Card>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6"
              >
                <TrackingDisplay
                  shipment={shipment}
                  vendor={vendor}
                  history={history}
                  onReset={handleReset}
                />
                
                <TrackingFeedbackForm
                  shipment={shipment}
                  vendor={vendor}
                />
              </motion.div>
            </AnimatePresence>
          )}

          {/* Info Section */}
          <div className="mt-12 text-center">
            <p className="text-sm text-gray-500">
              Tracking powered by <span className="text-[#9EFF00] font-semibold">CarryMatch</span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}