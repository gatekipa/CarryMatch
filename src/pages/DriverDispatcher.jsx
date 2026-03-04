import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Bus, Clock, Phone, User, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import "leaflet/dist/leaflet.css";

export default function DriverDispatcher() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [assignTripDialog, setAssignTripDialog] = useState(null);
  const [selectedTripForAssignment, setSelectedTripForAssignment] = useState("");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: operator } = useQuery({
    queryKey: ['dispatch-operator', user?.email],
    queryFn: async () => {
      const ops = await base44.entities.BusOperator.filter({ created_by: user.email });
      return ops[0];
    },
    enabled: !!user
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['dispatch-drivers', operator?.id],
    queryFn: () => base44.entities.Driver.filter({ operator_id: operator.id, status: "active" }),
    enabled: !!operator,
    refetchInterval: 30000
  });

  const { data: todayTrips = [] } = useQuery({
    queryKey: ['dispatch-trips', operator?.id],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      return await base44.entities.Trip.filter({
        operator_id: operator.id,
        departure_datetime: {
          $gte: today.toISOString(),
          $lt: tomorrow.toISOString()
        },
        trip_status: { $in: ["scheduled", "boarding", "departed", "delayed"] }
      }, "departure_datetime");
    },
    enabled: !!operator,
    refetchInterval: 10000
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['dispatch-routes', operator?.id],
    queryFn: () => base44.entities.BusRoute.filter({ operator_id: operator.id }),
    enabled: !!operator
  });

  const { data: locationUpdates = [] } = useQuery({
    queryKey: ['dispatch-locations', todayTrips.map(t => t.id)],
    queryFn: async () => {
      if (!todayTrips.length) return [];
      
      const allUpdates = await base44.entities.BusLocationUpdate.filter({
        trip_id: { $in: todayTrips.map(t => t.id) }
      }, "-created_date");

      // Get latest per trip
      const latestByTrip = {};
      allUpdates.forEach(update => {
        if (!latestByTrip[update.trip_id] || 
            new Date(update.created_date) > new Date(latestByTrip[update.trip_id].created_date)) {
          latestByTrip[update.trip_id] = update;
        }
      });

      return Object.values(latestByTrip);
    },
    enabled: todayTrips.length > 0,
    refetchInterval: 10000
  });

  const assignDriverMutation = useMutation({
    mutationFn: async ({ tripId, driverId }) => {
      await base44.entities.Trip.update(tripId, { driver_id: driverId });
      
      // Send notification to driver
      const driver = drivers.find(d => d.id === driverId);
      const trip = todayTrips.find(t => t.id === tripId);
      const route = routes.find(r => r.id === trip.route_id);
      
      await base44.integrations.Core.SendEmail({
        to: driver.email,
        subject: `New Trip Assignment - ${route.origin_city} → ${route.destination_city}`,
        from_name: operator.name,
        body: `
          <h2>${operator.name}</h2>
          <p>Hi ${driver.full_name},</p>
          <p>You have been assigned to a new trip:</p>
          <ul>
            <li><strong>Route:</strong> ${route.origin_city} → ${route.destination_city}</li>
            <li><strong>Departure:</strong> ${format(new Date(trip.departure_datetime), "MMM d, yyyy 'at' HH:mm")}</li>
          </ul>
          <p>Please check your Driver App for full details.</p>
        `
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatch-trips'] });
      toast.success("Driver assigned!");
      setAssignTripDialog(null);
      setSelectedTripForAssignment("");
    }
  });

  // Build driver status
  const driverStatuses = drivers.map(driver => {
    const driverTrips = todayTrips.filter(t => t.driver_id === driver.id);
    const activeTrip = driverTrips.find(t => ['boarding', 'departed'].includes(t.trip_status));
    const location = activeTrip ? locationUpdates.find(l => l.trip_id === activeTrip.id) : null;

    return {
      driver,
      activeTrip,
      location,
      todayTripsCount: driverTrips.length,
      status: activeTrip ? activeTrip.trip_status : 'idle'
    };
  });

  const unassignedTrips = todayTrips.filter(t => !t.driver_id);

  if (!user || !operator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Driver Dispatcher</h1>
            <p className="text-gray-400">Real-time driver tracking & assignment</p>
          </div>
        </div>

        {/* Map View */}
        <Card className="p-6 bg-white/5 border-white/10 mb-6">
          <h3 className="text-lg font-bold text-white mb-4">Live Driver Locations</h3>
          <div className="h-96 rounded-lg overflow-hidden">
            <MapContainer
              center={[3.8480, 11.5021]}
              zoom={10}
              style={{ height: "100%", width: "100%" }}
              className="z-0"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              {locationUpdates.map(loc => {
                const trip = todayTrips.find(t => t.id === loc.trip_id);
                const driver = drivers.find(d => d.id === trip?.driver_id);
                const route = routes.find(r => r.id === trip?.route_id);

                return (
                  <Marker key={loc.id} position={[loc.latitude, loc.longitude]}>
                    <Popup>
                      <div className="text-sm">
                        <p className="font-bold">{driver?.full_name}</p>
                        <p>{route?.origin_city} → {route?.destination_city}</p>
                        <p className="text-xs text-gray-600">Speed: {loc.speed_kmh} km/h</p>
                        <p className="text-xs text-gray-600">
                          {format(new Date(loc.created_date), "HH:mm:ss")}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Active Drivers */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xl font-bold text-white">Active Drivers ({driverStatuses.length})</h3>
            {driverStatuses.map(({ driver, activeTrip, location, todayTripsCount, status }) => {
              const route = activeTrip ? routes.find(r => r.id === activeTrip.route_id) : null;
              
              return (
                <Card key={driver.id} className="p-4 bg-white/5 border-white/10">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">
                            {driver.full_name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-white">{driver.full_name}</h4>
                          <p className="text-xs text-gray-400">{driver.phone_number}</p>
                        </div>
                        <Badge className={
                          status === 'departed' ? 'bg-purple-500/20 text-purple-400' :
                          status === 'boarding' ? 'bg-green-500/20 text-green-400' :
                          status === 'delayed' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-gray-500/20 text-gray-400'
                        }>
                          {status}
                        </Badge>
                      </div>

                      {activeTrip && route && (
                        <div className="mt-3 p-3 bg-white/5 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Bus className="w-4 h-4 text-blue-400" />
                            <span className="text-white text-sm font-medium">
                              {route.origin_city} → {route.destination_city}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <span>Departs: {format(new Date(activeTrip.departure_datetime), "HH:mm")}</span>
                            {location && (
                              <span className="text-green-400">
                                📍 Live - {format(new Date(location.created_date), "HH:mm:ss")}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="mt-3 text-xs text-gray-400">
                        Today's trips: {todayTripsCount}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <a href={`tel:${driver.phone_number}`}>
                        <Button size="sm" variant="outline" className="border-green-500/30 text-green-400">
                          <Phone className="w-4 h-4" />
                        </Button>
                      </a>
                      <Button
                        size="sm"
                        onClick={() => setSelectedDriver(driver)}
                        variant="outline"
                        className="border-white/10"
                      >
                        <User className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Unassigned Trips */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">
              Unassigned ({unassignedTrips.length})
            </h3>
            {unassignedTrips.length === 0 ? (
              <Card className="p-6 bg-white/5 border-white/10 text-center">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-400" />
                <p className="text-gray-400 text-sm">All trips assigned!</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {unassignedTrips.map(trip => {
                  const route = routes.find(r => r.id === trip.route_id);
                  
                  return (
                    <Card key={trip.id} className="p-4 bg-orange-500/10 border-orange-500/30">
                      <div className="mb-3">
                        <p className="text-white font-semibold text-sm">
                          {route?.origin_city} → {route?.destination_city}
                        </p>
                        <p className="text-xs text-gray-400">
                          {format(new Date(trip.departure_datetime), "HH:mm")}
                        </p>
                      </div>
                      <Button
                        onClick={() => setAssignTripDialog(trip)}
                        className="w-full bg-blue-500 hover:bg-blue-600"
                        size="sm"
                      >
                        Assign Driver
                      </Button>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Assign Driver Dialog */}
        {assignTripDialog && (
          <Dialog open={!!assignTripDialog} onOpenChange={() => setAssignTripDialog(null)}>
            <DialogContent className="bg-[#0F1D35] border-white/10">
              <DialogHeader>
                <DialogTitle className="text-white">Assign Driver</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Card className="p-3 bg-white/5 border-white/10">
                  <p className="text-sm text-gray-400 mb-1">Trip:</p>
                  <p className="text-white font-semibold">
                    {routes.find(r => r.id === assignTripDialog.route_id)?.origin_city} → {routes.find(r => r.id === assignTripDialog.route_id)?.destination_city}
                  </p>
                  <p className="text-xs text-gray-400">
                    {format(new Date(assignTripDialog.departure_datetime), "MMM d, yyyy 'at' HH:mm")}
                  </p>
                </Card>

                <div>
                  <Label className="text-gray-300 mb-2 block">Select Driver</Label>
                  <Select value={selectedTripForAssignment} onValueChange={setSelectedTripForAssignment}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Choose a driver..." />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.map(d => {
                        const driverTrips = todayTrips.filter(t => t.driver_id === d.id);
                        return (
                          <SelectItem key={d.id} value={d.id}>
                            {d.full_name} ({driverTrips.length} trips today)
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setAssignTripDialog(null)}
                    className="flex-1 border-white/10"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => assignDriverMutation.mutate({
                      tripId: assignTripDialog.id,
                      driverId: selectedTripForAssignment
                    })}
                    disabled={!selectedTripForAssignment || assignDriverMutation.isPending}
                    className="flex-1 bg-blue-500 hover:bg-blue-600"
                  >
                    {assignDriverMutation.isPending ? "Assigning..." : "Assign & Notify"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Driver Detail Dialog */}
        {selectedDriver && (
          <Dialog open={!!selectedDriver} onOpenChange={() => setSelectedDriver(null)}>
            <DialogContent className="bg-[#0F1D35] border-white/10">
              <DialogHeader>
                <DialogTitle className="text-white">{selectedDriver.full_name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-400 text-xs">Phone</p>
                    <p className="text-white">{selectedDriver.phone_number}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">License</p>
                    <p className="text-white">{selectedDriver.license_number || "—"}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Status</p>
                    <Badge className="bg-green-500/20 text-green-400">{selectedDriver.status}</Badge>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Today's Trips</p>
                    <p className="text-white font-bold">
                      {todayTrips.filter(t => t.driver_id === selectedDriver.id).length}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-gray-400 text-xs mb-2">Assigned Trips Today:</p>
                  <div className="space-y-2">
                    {todayTrips.filter(t => t.driver_id === selectedDriver.id).map(trip => {
                      const route = routes.find(r => r.id === trip.route_id);
                      return (
                        <div key={trip.id} className="p-2 bg-white/5 rounded text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-white">{route?.origin_city} → {route?.destination_city}</span>
                            <Badge className="bg-blue-500/20 text-blue-400 text-xs">
                              {format(new Date(trip.departure_datetime), "HH:mm")}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <a href={`tel:${selectedDriver.phone_number}`}>
                  <Button className="w-full bg-green-500 hover:bg-green-600">
                    <Phone className="w-4 h-4 mr-2" />
                    Call Driver
                  </Button>
                </a>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}