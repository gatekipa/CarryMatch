import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { BusOperator, Trip } from "@/api/entities";
import { sendTripNotification, updateBusLocation } from "@/api/functions";
import { useCurrentUser } from "@/components/hooks/useCurrentUser";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bus, MapPin, Navigation, Send, AlertTriangle, CheckCircle, Coffee, Clock, Plane } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const getLegacyBusRouteEntity = () => {
  // Legacy Base44 entity compatibility: this collection is still accessed
  // directly until src/api/entities.js exposes a stable named export for it.
  return base44.entities.BusRoute;
};

const getLegacyBusLocationUpdateEntity = () => {
  // Legacy Base44 entity compatibility: this collection is still accessed
  // directly until src/api/entities.js exposes a stable named export for it.
  return base44.entities.BusLocationUpdate;
};

export default function DriverTripControl() {
  const urlParams = new URLSearchParams(window.location.search);
  const tripId = urlParams.get("id");
  const queryClient = useQueryClient();
  const { user } = useCurrentUser();
  
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [updateType, setUpdateType] = useState("departed");
  const [customMessage, setCustomMessage] = useState("");
  const [delayMinutes, setDelayMinutes] = useState("");

  // Request GPS permission and start tracking
  useEffect(() => {
    if (!gpsEnabled || !tripId) return;

    if (!navigator.geolocation) {
      toast.error("GPS not supported on this device");
      setGpsEnabled(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentPosition({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          speed_kmh: position.coords.speed ? (position.coords.speed * 3.6).toFixed(1) : 0,
          heading_degrees: position.coords.heading || 0
        });
      },
      (error) => {
        console.error("GPS error:", error);
        toast.error("GPS tracking failed");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [gpsEnabled, tripId]);

  // Auto-update location every 30 seconds when GPS is enabled
  useEffect(() => {
    if (!gpsEnabled || !currentPosition || !tripId) return;

    const interval = setInterval(async () => {
      try {
        await updateBusLocation({
          trip_id: tripId,
          latitude: currentPosition.latitude,
          longitude: currentPosition.longitude,
          speed_kmh: parseFloat(currentPosition.speed_kmh),
          heading_degrees: currentPosition.heading_degrees,
          update_source: 'driver_gps'
        });
      } catch (error) {
        console.error("Auto location update failed:", error);
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [gpsEnabled, currentPosition, tripId]);

  const { data: trip } = useQuery({
    queryKey: ['driver-trip', tripId],
    queryFn: async () => {
      const trips = await Trip.filter({ id: tripId });
      return trips[0];
    },
    enabled: !!tripId
  });

  const { data: route } = useQuery({
    queryKey: ['driver-route', trip?.route_id],
    queryFn: async () => {
      const routes = await getLegacyBusRouteEntity().filter({ id: trip.route_id });
      return routes[0];
    },
    enabled: !!trip
  });

  const { data: operator } = useQuery({
    queryKey: ['driver-operator', trip?.operator_id],
    queryFn: async () => {
      const ops = await BusOperator.filter({ id: trip.operator_id });
      return ops[0];
    },
    enabled: !!trip
  });

  const { data: latestLocation } = useQuery({
    queryKey: ['latest-location', tripId],
    queryFn: async () => {
      const locs = await getLegacyBusLocationUpdateEntity().filter({ trip_id: tripId }, "-created_date", 1);
      return locs[0];
    },
    enabled: !!tripId,
    refetchInterval: 10000
  });

  const updateLocationMutation = useMutation({
    mutationFn: async () => {
      return await updateBusLocation({
        trip_id: tripId,
        latitude: currentPosition.latitude,
        longitude: currentPosition.longitude,
        speed_kmh: parseFloat(currentPosition.speed_kmh),
        heading_degrees: currentPosition.heading_degrees,
        update_source: 'driver_manual'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['latest-location'] });
      toast.success("Location updated!");
    },
    onError: (error) => {
      toast.error("Failed to update location: " + error.message);
    }
  });

  const sendNotificationMutation = useMutation({
    mutationFn: async (data) => {
      return await sendTripNotification({
        trip_id: tripId,
        update_type: data.update_type,
        message: data.message || undefined,
        delay_minutes: data.delay_minutes ? parseInt(data.delay_minutes) : undefined,
        new_eta: data.new_eta || undefined
      });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['trip-status-updates'] });
      toast.success(`Notification sent to ${response.data.notifications_sent.email} passengers!`);
      setCustomMessage("");
      setDelayMinutes("");
    },
    onError: (error) => {
      toast.error("Failed to send notification: " + error.message);
    }
  });

  const handleSendNotification = () => {
    if (updateType === 'delayed' && !delayMinutes) {
      toast.error("Please enter delay duration");
      return;
    }

    sendNotificationMutation.mutate({
      update_type: updateType,
      message: customMessage,
      delay_minutes: delayMinutes
    });
  };

  if (!user || !trip || !route || !operator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Driver Controls</h1>
          <div className="flex items-center gap-3">
            <Badge className="bg-blue-500/20 text-blue-400">
              {route.origin_city} → {route.destination_city}
            </Badge>
            <Badge className={
              trip.trip_status === 'boarding' ? 'bg-green-500/20 text-green-400' :
              trip.trip_status === 'departed' ? 'bg-purple-500/20 text-purple-400' :
              'bg-gray-500/20 text-gray-400'
            }>
              {trip.trip_status}
            </Badge>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* GPS Tracking */}
          <Card className="p-6 bg-white/5 border-white/10">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-blue-400" />
              GPS Tracking
            </h3>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gpsEnabled}
                    onChange={(e) => setGpsEnabled(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-white">Enable Auto GPS Tracking</span>
                </label>
              </div>

              {gpsEnabled && currentPosition && (
                <Card className="p-3 bg-green-500/10 border-green-500/30">
                  <p className="text-xs text-green-300 mb-2">✓ GPS Active - Auto updating every 30s</p>
                  <div className="text-xs text-gray-400 space-y-1">
                    <p>Speed: {currentPosition.speed_kmh} km/h</p>
                    <p>Location: {currentPosition.latitude.toFixed(5)}, {currentPosition.longitude.toFixed(5)}</p>
                  </div>
                </Card>
              )}

              {!gpsEnabled && latestLocation && (
                <Card className="p-3 bg-gray-500/10 border-gray-500/30">
                  <p className="text-xs text-gray-300">Last Update:</p>
                  <p className="text-xs text-gray-400">{format(new Date(latestLocation.created_date), "HH:mm:ss")}</p>
                </Card>
              )}

              {!gpsEnabled && (
                <Button
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (position) => {
                          setCurrentPosition({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                            speed_kmh: 0,
                            heading_degrees: 0
                          });
                          updateLocationMutation.mutate();
                        },
                        (error) => {
                          toast.error("Could not get GPS location");
                        }
                      );
                    }
                  }}
                  disabled={updateLocationMutation.isPending}
                  variant="outline"
                  className="w-full border-blue-500/30 text-blue-400"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  {updateLocationMutation.isPending ? "Updating..." : "Update Location Now"}
                </Button>
              )}
            </div>
          </Card>

          {/* Passenger Notifications */}
          <Card className="p-6 bg-white/5 border-white/10">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Send className="w-5 h-5 text-purple-400" />
              Notify Passengers
            </h3>

            <div className="space-y-4">
              <div>
                <Label className="text-gray-300 mb-2 block">Notification Type</Label>
                <Select value={updateType} onValueChange={setUpdateType}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boarding_open">🚪 Boarding Open</SelectItem>
                    <SelectItem value="departed">🚌 Departed</SelectItem>
                    <SelectItem value="delayed">⏰ Delayed</SelectItem>
                    <SelectItem value="rest_stop">☕ Rest Stop</SelectItem>
                    <SelectItem value="arriving_soon">📍 Arriving Soon</SelectItem>
                    <SelectItem value="arrived">✅ Arrived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {updateType === 'delayed' && (
                <div>
                  <Label className="text-gray-300 mb-2 block">Delay (minutes)</Label>
                  <Input
                    type="number"
                    value={delayMinutes}
                    onChange={(e) => setDelayMinutes(e.target.value)}
                    placeholder="30"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              )}

              <div>
                <Label className="text-gray-300 mb-2 block">Custom Message (Optional)</Label>
                <Textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Add additional details for passengers..."
                  className="bg-white/5 border-white/10 text-white h-24"
                />
              </div>

              <Button
                onClick={handleSendNotification}
                disabled={sendNotificationMutation.isPending}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600"
              >
                {sendNotificationMutation.isPending ? "Sending..." : "Send Notification"}
              </Button>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="p-6 bg-white/5 border-white/10 mt-6">
          <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Button
              onClick={() => {
                setUpdateType("boarding_open");
                handleSendNotification();
              }}
              disabled={sendNotificationMutation.isPending}
              variant="outline"
              className="border-green-500/30 text-green-400"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Open Boarding
            </Button>
            <Button
              onClick={() => {
                setUpdateType("departed");
                handleSendNotification();
              }}
              disabled={sendNotificationMutation.isPending}
              variant="outline"
              className="border-blue-500/30 text-blue-400"
            >
              <Bus className="w-4 h-4 mr-2" />
              We Departed
            </Button>
            <Button
              onClick={() => {
                setUpdateType("rest_stop");
                handleSendNotification();
              }}
              disabled={sendNotificationMutation.isPending}
              variant="outline"
              className="border-yellow-500/30 text-yellow-400"
            >
              <Coffee className="w-4 h-4 mr-2" />
              Rest Stop
            </Button>
            <Button
              onClick={() => {
                setUpdateType("arriving_soon");
                handleSendNotification();
              }}
              disabled={sendNotificationMutation.isPending}
              variant="outline"
              className="border-purple-500/30 text-purple-400"
            >
              <Clock className="w-4 h-4 mr-2" />
              Arriving Soon
            </Button>
            <Button
              onClick={() => {
                setUpdateType("arrived");
                handleSendNotification();
              }}
              disabled={sendNotificationMutation.isPending}
              variant="outline"
              className="border-green-500/30 text-green-400"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Arrived
            </Button>
            <Button
              onClick={() => {
                setUpdateType("delayed");
                setDelayMinutes("30");
              }}
              variant="outline"
              className="border-orange-500/30 text-orange-400"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Report Delay
            </Button>
          </div>
        </Card>

        {/* GPS Info Display */}
        {currentPosition && (
          <Card className="p-6 bg-blue-500/10 border-blue-500/30 mt-6">
            <div className="flex items-start gap-3">
              <Navigation className="w-6 h-6 text-blue-400 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-white font-semibold mb-2">Current GPS Position</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-400">Speed:</span>
                    <span className="text-white font-semibold ml-2">{currentPosition.speed_kmh} km/h</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Heading:</span>
                    <span className="text-white font-semibold ml-2">{currentPosition.heading_degrees}°</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Auto-updating passengers every 30 seconds
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
