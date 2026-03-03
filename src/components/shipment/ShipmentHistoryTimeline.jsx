import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, User, Building2, Clock } from "lucide-react";
import { format } from "date-fns";

export default function ShipmentHistoryTimeline({ history, vendor }) {
  const formatDateTime = (date) => {
    if (!vendor?.time_zone) {
      return format(new Date(date), "MMM d, yyyy 'at' h:mm a");
    }
    // In production, use date-fns-tz for proper timezone handling
    return format(new Date(date), "MMM d, yyyy 'at' h:mm a");
  };

  return (
    <Card className="p-6 bg-white/5 border-white/10">
      <h3 className="font-bold text-white mb-6 flex items-center gap-2">
        <Clock className="w-5 h-5 text-blue-400" />
        Status History
      </h3>
      
      <div className="space-y-6">
        {history.map((event, index) => (
          <div key={event.id} className="flex gap-4">
            {/* Timeline marker */}
            <div className="flex flex-col items-center">
              <div className={`w-4 h-4 rounded-full border-2 ${
                index === 0 
                  ? "bg-[#9EFF00] border-[#9EFF00]" 
                  : "bg-white/5 border-white/20"
              }`} />
              {index < history.length - 1 && (
                <div className="w-0.5 flex-1 bg-white/10 mt-2" />
              )}
            </div>

            {/* Event content */}
            <div className="flex-1 pb-6">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <Badge className={`${
                    index === 0 ? "bg-[#9EFF00] text-[#1A1A1A]" : "bg-white/10 text-gray-300"
                  } mb-2`}>
                    {event.new_status?.replace(/_/g, " ") || event.action_type?.replace(/_/g, " ")}
                  </Badge>
                  <p className="text-sm text-gray-400">
                    {formatDateTime(event.created_date)}
                  </p>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid gap-2 mt-3">
                {event.staff_name && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <User className="w-3 h-3" />
                    <span>{event.staff_name}</span>
                  </div>
                )}

                {event.branch_id && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Building2 className="w-3 h-3" />
                    <span>Branch: {event.branch_id}</span>
                  </div>
                )}

                {event.location?.address && (
                  <div className="flex items-start gap-2 text-sm text-gray-400">
                    <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>{event.location.address}</span>
                  </div>
                )}

                {event.location?.latitude && event.location?.longitude && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                    <MapPin className="w-3 h-3" />
                    <span>
                      {event.location.latitude.toFixed(6)}, {event.location.longitude.toFixed(6)}
                    </span>
                  </div>
                )}

                {event.note && (
                  <div className="mt-2 p-3 bg-white/5 rounded-lg text-sm text-gray-300">
                    {event.note}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}