import React from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Package, 
  MapPin, 
  Plane, 
  Truck, 
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";

const TRACKING_STAGES = [
  { 
    id: "awaiting_pickup", 
    label: "Awaiting Pickup", 
    icon: Clock,
    color: "text-gray-400"
  },
  { 
    id: "picked_up", 
    label: "Picked Up", 
    icon: Package,
    color: "text-blue-400"
  },
  { 
    id: "at_departure_airport", 
    label: "At Departure Airport", 
    icon: MapPin,
    color: "text-purple-400"
  },
  { 
    id: "in_flight", 
    label: "In Flight", 
    icon: Plane,
    color: "text-indigo-400"
  },
  { 
    id: "at_arrival_airport", 
    label: "At Arrival Airport", 
    icon: MapPin,
    color: "text-cyan-400"
  },
  { 
    id: "out_for_delivery", 
    label: "Out for Delivery", 
    icon: Truck,
    color: "text-orange-400"
  },
  { 
    id: "delivered", 
    label: "Delivered", 
    icon: CheckCircle2,
    color: "text-green-400"
  }
];

export default function ShipmentTracker({ match, showTimeline = true }) {
  const currentStageIndex = match.tracking_status 
    ? TRACKING_STAGES.findIndex(s => s.id === match.tracking_status)
    : -1;

  const getStageStatus = (index) => {
    if (index < currentStageIndex) return "completed";
    if (index === currentStageIndex) return "current";
    return "upcoming";
  };

  const latestUpdate = match.tracking_updates && match.tracking_updates.length > 0
    ? match.tracking_updates[match.tracking_updates.length - 1]
    : null;

  return (
    <div className="space-y-6">
      {/* Current Status Card */}
      <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">
              Shipment Status
            </h3>
            {latestUpdate && (
              <p className="text-sm text-gray-400">
                Last updated {format(new Date(latestUpdate.timestamp), "MMM d 'at' h:mm a")}
              </p>
            )}
          </div>
          {match.tracking_status ? (
            <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              {TRACKING_STAGES.find(s => s.id === match.tracking_status)?.label || "In Progress"}
            </Badge>
          ) : (
            <Badge className="bg-gray-500/20 text-gray-400">
              Not Started
            </Badge>
          )}
        </div>

        {/* Progress Bar */}
        <div className="relative">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500"
              initial={{ width: 0 }}
              animate={{ 
                width: currentStageIndex >= 0 
                  ? `${((currentStageIndex + 1) / TRACKING_STAGES.length) * 100}%` 
                  : "0%"
              }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <div className="mt-2 text-sm text-gray-400 text-center">
            {currentStageIndex >= 0 && (
              <span>
                Step {currentStageIndex + 1} of {TRACKING_STAGES.length}
              </span>
            )}
          </div>
        </div>

        {/* Estimated Delivery */}
        {match.estimated_delivery_date && (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
            <Clock className="w-4 h-4" />
            <span>
              Estimated delivery: {format(new Date(match.estimated_delivery_date), "MMM d, yyyy")}
            </span>
          </div>
        )}

        {/* Latest Update Details */}
        {latestUpdate && (
          <div className="mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                {React.createElement(
                  TRACKING_STAGES.find(s => s.id === latestUpdate.status)?.icon || Package,
                  { className: "w-4 h-4 text-white" }
                )}
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">
                  {TRACKING_STAGES.find(s => s.id === latestUpdate.status)?.label}
                </p>
                {latestUpdate.location && (
                  <p className="text-sm text-gray-400 mt-1">
                    📍 {latestUpdate.location}
                  </p>
                )}
                {latestUpdate.notes && (
                  <p className="text-sm text-gray-300 mt-1">
                    {latestUpdate.notes}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Timeline */}
      {showTimeline && (
        <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-4">
            Tracking Timeline
          </h3>
          <div className="space-y-4">
            {TRACKING_STAGES.map((stage, index) => {
              const status = getStageStatus(index);
              const Icon = stage.icon;
              const stageUpdate = match.tracking_updates?.find(u => u.status === stage.id);

              return (
                <div key={stage.id} className="relative">
                  <div className="flex items-start gap-4">
                    {/* Timeline Line */}
                    {index < TRACKING_STAGES.length - 1 && (
                      <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-white/10" />
                    )}

                    {/* Icon */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        status === "completed"
                          ? "bg-gradient-to-br from-green-500 to-emerald-600"
                          : status === "current"
                          ? "bg-gradient-to-br from-blue-500 to-purple-600 ring-4 ring-blue-500/20"
                          : "bg-white/10"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${
                        status === "upcoming" ? "text-gray-500" : "text-white"
                      }`} />
                    </motion.div>

                    {/* Content */}
                    <div className="flex-1 pb-8">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`font-medium ${
                          status === "upcoming" ? "text-gray-500" : "text-white"
                        }`}>
                          {stage.label}
                        </h4>
                        {status === "current" && (
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                            Current
                          </Badge>
                        )}
                        {status === "completed" && stageUpdate && (
                          <span className="text-xs text-gray-400">
                            {format(new Date(stageUpdate.timestamp), "MMM d, h:mm a")}
                          </span>
                        )}
                      </div>
                      {stageUpdate && (
                        <div className="text-sm text-gray-400 mt-2">
                          {stageUpdate.location && (
                            <p className="mb-1">📍 {stageUpdate.location}</p>
                          )}
                          {stageUpdate.notes && (
                            <p>{stageUpdate.notes}</p>
                          )}
                          {stageUpdate.updated_by && (
                            <p className="text-xs mt-1">
                              Updated by {stageUpdate.updated_by}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Proof of Delivery */}
      {match.proof_of_delivery_url && (
        <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            Proof of Delivery
          </h3>
          <img
            src={match.proof_of_delivery_url}
            alt="Proof of delivery"
            className="w-full rounded-lg border border-white/10"
          />
          {match.delivered_at && (
            <p className="text-sm text-gray-400 mt-3 text-center">
              Delivered on {format(new Date(match.delivered_at), "MMM d, yyyy 'at' h:mm a")}
            </p>
          )}
        </Card>
      )}
    </div>
  );
}

export { TRACKING_STAGES };