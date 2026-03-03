import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation, AlertTriangle, Clock, Coffee, RefreshCw } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { format } from "date-fns";

export default function RouteOptimizer({ trip, currentLocation, onETAUpdate }) {
  const [optimization, setOptimization] = useState(null);

  const optimizeMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('optimizeRoute', {
        trip_id: trip.id,
        current_location: currentLocation || null
      });
      return response.data;
    },
    onSuccess: (data) => {
      setOptimization(data);
      if (data.eta_updated) {
        toast.success(`ETA updated: ${data.eta_difference_minutes} min ${data.eta_difference_minutes > 0 ? 'delay' : 'faster'}`);
        if (onETAUpdate) onETAUpdate(data.new_eta);
      }
      if (data.notifications_sent) {
        toast.success("Passengers notified of delay");
      }
    },
    onError: (error) => {
      toast.error("Optimization failed: " + error.message);
    }
  });

  const trafficColors = {
    light: "bg-green-500/20 text-green-400",
    moderate: "bg-yellow-500/20 text-yellow-400",
    heavy: "bg-orange-500/20 text-orange-400",
    severe: "bg-red-500/20 text-red-400"
  };

  return (
    <Card className="bg-white/5 border-white/10">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-white">Route Optimization</h3>
          </div>
          <Button
            onClick={() => optimizeMutation.mutate()}
            disabled={optimizeMutation.isPending}
            size="sm"
            className="bg-blue-500 hover:bg-blue-600"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${optimizeMutation.isPending ? 'animate-spin' : ''}`} />
            {optimizeMutation.isPending ? "Analyzing..." : "Check Traffic"}
          </Button>
        </div>
      </div>

      {optimization && (
        <div className="p-4 space-y-4">
          {/* Traffic Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Traffic Condition:</span>
            <Badge className={trafficColors[optimization.optimization.traffic_condition]}>
              {optimization.optimization.traffic_condition.toUpperCase()}
            </Badge>
          </div>

          {/* ETA */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Estimated Travel Time:</span>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-white font-semibold">
                {Math.floor(optimization.optimization.estimated_travel_minutes / 60)}h {optimization.optimization.estimated_travel_minutes % 60}m
              </span>
            </div>
          </div>

          {/* New ETA */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Expected Arrival:</span>
            <span className="text-white font-semibold">
              {format(new Date(optimization.new_eta), "HH:mm")}
            </span>
          </div>

          {/* Delay Indicator */}
          {optimization.eta_difference_minutes > 15 && (
            <Card className="p-3 bg-orange-500/10 border-orange-500/30">
              <div className="flex items-center gap-2 text-orange-300">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-semibold">
                  {optimization.eta_difference_minutes} min delay expected
                </span>
              </div>
            </Card>
          )}

          {/* Incidents */}
          {optimization.optimization.incidents?.length > 0 && (
            <div>
              <p className="text-sm text-gray-400 mb-2">⚠️ Incidents Ahead:</p>
              <div className="space-y-2">
                {optimization.optimization.incidents.map((incident, idx) => (
                  <Card key={idx} className="p-3 bg-red-500/10 border-red-500/30">
                    <p className="text-sm text-red-300 font-semibold">{incident.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{incident.location}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Alternative Routes */}
          {optimization.optimization.alternative_routes?.length > 0 && (
            <div>
              <p className="text-sm text-gray-400 mb-2">🗺️ Alternative Routes:</p>
              <div className="space-y-2">
                {optimization.optimization.alternative_routes.map((alt, idx) => (
                  <Card key={idx} className="p-3 bg-blue-500/10 border-blue-500/30">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm text-blue-300 font-semibold">{alt.description}</p>
                      <Badge className="bg-blue-500/20 text-blue-400">
                        {alt.estimated_time_minutes} min
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400">{alt.notes}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Rest Stops */}
          {optimization.optimization.rest_stops?.length > 0 && (
            <div>
              <p className="text-sm text-gray-400 mb-2">☕ Recommended Rest Stops:</p>
              <div className="space-y-2">
                {optimization.optimization.rest_stops.map((stop, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-white/5 rounded">
                    <div className="flex items-center gap-2">
                      <Coffee className="w-4 h-4 text-amber-400" />
                      <span className="text-sm text-gray-300">{stop.location}</span>
                    </div>
                    <span className="text-xs text-gray-500">{stop.suggested_duration_minutes} min</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Last Update */}
          <p className="text-xs text-gray-500 text-center">
            Last checked: {format(new Date(), "HH:mm:ss")}
          </p>
        </div>
      )}
    </Card>
  );
}