import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package,
  MapPin,
  Calendar,
  ArrowRight,
  CheckCircle,
  Clock,
  Truck,
  Building2
} from "lucide-react";
import { format, parseISO } from "date-fns";
import RealTimeTrackingMap from "@/components/shipment/RealTimeTrackingMap";

export default function TrackingDisplay({ shipment, vendor, history, onReset }) {
  const statusColors = {
    PENDING: "bg-gray-500/20 text-gray-300",
    RECEIVED: "bg-blue-500/20 text-blue-300",
    PACKED: "bg-purple-500/20 text-purple-300",
    MANIFESTED: "bg-indigo-500/20 text-indigo-300",
    SHIPPED: "bg-orange-500/20 text-orange-300",
    IN_TRANSIT: "bg-yellow-500/20 text-yellow-300",
    ARRIVED: "bg-cyan-500/20 text-cyan-300",
    CUSTOMS: "bg-pink-500/20 text-pink-300",
    READY_PICKUP: "bg-green-500/20 text-green-300",
    OUT_FOR_DELIVERY: "bg-teal-500/20 text-teal-300",
    DELIVERED: "bg-emerald-500/20 text-emerald-300",
    ON_HOLD: "bg-red-500/20 text-red-300",
    DELAYED: "bg-amber-500/20 text-amber-300"
  };

  const getStatusIcon = (status) => {
    if (status === "DELIVERED") return CheckCircle;
    if (["SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(status)) return Truck;
    return Clock;
  };

  const StatusIcon = getStatusIcon(shipment.status);

  // Fetch branch data for mapping
  const { data: branch } = useQuery({
    queryKey: ['branch', shipment.branch_id],
    queryFn: async () => {
      if (!shipment.branch_id) return null;
      const branches = await base44.entities.Branch.filter({ id: shipment.branch_id });
      return branches[0] || null;
    },
    enabled: !!shipment.branch_id
  });

  const { data: destinationBranch } = useQuery({
    queryKey: ['destination-branch', shipment.destination_branch_id],
    queryFn: async () => {
      if (!shipment.destination_branch_id) return null;
      const branches = await base44.entities.Branch.filter({ id: shipment.destination_branch_id });
      return branches[0] || null;
    },
    enabled: !!shipment.destination_branch_id
  });

  return (
    <div className="space-y-6">
      {/* Vendor Header */}
      <Card className="p-6 bg-white/5 border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            {vendor?.logo_url ? (
              <img src={vendor.logo_url} alt={vendor.display_name} className="h-12" />
            ) : (
              <div className="flex items-center gap-2">
                <Building2 className="w-6 h-6 text-gray-400" />
                <span className="text-lg font-bold text-white">{vendor?.display_name}</span>
              </div>
            )}
          </div>
          <Button
            onClick={onReset}
            variant="outline"
            size="sm"
            className="border-white/10 text-gray-300"
          >
            New Search
          </Button>
        </div>
      </Card>

      {/* Current Status */}
      <Card className="p-8 bg-white/5 border-white/10 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <StatusIcon className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2 font-mono">{shipment.tracking_code}</h2>
        <Badge className={`${statusColors[shipment.status]} text-lg px-4 py-2`}>
          {shipment.status.replace(/_/g, " ")}
        </Badge>
        
        {shipment.status === "DELIVERED" && (
          <p className="text-green-400 mt-4 font-semibold">
            ✓ Package delivered successfully
          </p>
        )}
        
        {shipment.status === "READY_PICKUP" && (
          <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
            <p className="text-green-400 font-semibold mb-1">Ready for Pickup!</p>
            <p className="text-sm text-gray-300">Please bring your OTP code when collecting your package</p>
          </div>
        )}
      </Card>

      {/* Shipment Details */}
      <Card className="p-6 bg-white/5 border-white/10">
        <h3 className="font-bold text-white mb-4">Shipment Details</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
            <Package className="w-5 h-5 text-blue-400" />
            <div className="flex-1">
              <p className="text-xs text-gray-400">Description</p>
              <p className="text-white">{shipment.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
            <MapPin className="w-5 h-5 text-purple-400" />
            <div className="flex-1">
              <p className="text-xs text-gray-400">Route</p>
              <p className="text-white flex items-center gap-2">
                {shipment.sender_city}, {shipment.sender_country}
                <ArrowRight className="w-4 h-4 text-gray-500" />
                {shipment.recipient_city}, {shipment.recipient_country}
              </p>
            </div>
          </div>

          {/* Branch / Hub Info */}
          {(branch || destinationBranch) && (
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <MapPin className="w-5 h-5 text-cyan-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-400">Handling Locations</p>
                <div className="text-white text-sm space-y-1">
                  {branch && <p>Origin: <span className="text-gray-300">{branch.name} — {branch.city}, {branch.country}</span></p>}
                  {destinationBranch && <p>Destination: <span className="text-gray-300">{destinationBranch.name} — {destinationBranch.city}, {destinationBranch.country}</span></p>}
                </div>
              </div>
            </div>
          )}

          {/* Estimated Delivery / ETA */}
          {shipment.pickup_eta && (
            <div className="flex items-center gap-3 p-3 bg-[#9EFF00]/10 border border-[#9EFF00]/20 rounded-lg">
              <Clock className="w-5 h-5 text-[#9EFF00]" />
              <div className="flex-1">
                <p className="text-xs text-gray-400">Estimated Delivery</p>
                <p className="text-[#9EFF00] font-semibold">
                  {(() => {
                    try {
                      const d = parseISO(shipment.pickup_eta);
                      return isNaN(d.getTime())
                        ? "N/A"
                        : d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                    } catch {
                      return "N/A";
                    }
                  })()}
                </p>
              </div>
            </div>
          )}

          {shipment.weight_kg && (
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <Package className="w-5 h-5 text-green-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-400">Weight</p>
                <p className="text-white">{shipment.weight_kg} kg</p>
              </div>
            </div>
          )}

          {shipment.current_location && (
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <MapPin className="w-5 h-5 text-orange-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-400">Last Known Location</p>
                <p className="text-white">
                  {shipment.current_location.address || 
                   `${shipment.current_location.latitude?.toFixed(4)}, ${shipment.current_location.longitude?.toFixed(4)}`}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Timeline */}
      {history.length > 0 && (
        <Card className="p-6 bg-white/5 border-white/10">
          <h3 className="font-bold text-white mb-4">Tracking History</h3>
          <div className="space-y-4">
            {history.map((event, index) => (
              <div key={event.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${
                    index === 0 ? "bg-[#9EFF00]" : "bg-gray-600"
                  }`} />
                  {index < history.length - 1 && (
                    <div className="w-0.5 h-full bg-gray-700 mt-1" />
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-white font-medium">
                      {event.new_status?.replace(/_/g, " ") || event.action_type?.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-gray-400">
                      {format(new Date(event.created_date), "MMM d, h:mm a")}
                    </p>
                  </div>
                  {event.note && (
                    <p className="text-sm text-gray-400">{event.note}</p>
                  )}
                  {event.location?.address && (
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {event.location.address}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Real-Time Tracking Map */}
      <RealTimeTrackingMap 
        shipment={shipment} 
        branch={branch} 
        destinationBranch={destinationBranch}
        history={history}
        compact={false}
      />
    </div>
  );
}