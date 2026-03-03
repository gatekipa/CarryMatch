import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "../components/hooks/useCurrentUser";
import LoadingCard from "../components/shared/LoadingCard";
import EmptyState from "../components/shared/EmptyState";
import QueryErrorFallback from "../components/shared/QueryErrorFallback";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bus, MapPin, Clock, Users, Phone, AlertTriangle, CheckCircle, Navigation, Menu, LogOut, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useOfflineSync } from "../components/driver/useOfflineSync";
import RouteOptimizer from "../components/driver/RouteOptimizer";

export default function DriverApp() {
  const { user, loading: userLoading } = useCurrentUser();
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const { isOnline, pendingSync, isSyncing, addToQueue, syncPendingData } = useOfflineSync();

  const queryClient = useQueryClient();

  // Get driver profile
  const { data: driver, error: driverError, refetch: refetchDriver } = useQuery({
    queryKey: ['driver-profile', user?.email],
    queryFn: async () => {
      // Try finding by email first (any status)
      const drivers = await base44.entities.Driver.filter({ 
        email: user.email
      });
      if (drivers.length > 0) return drivers[0];
      return null;
    },
    enabled: !!user,
    retry: 2
  });

  // Get today's and upcoming assigned trips
  const { data: assignedTrips = [] } = useQuery({
    queryKey: ['driver-trips', driver?.id],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const trips = await base44.entities.Trip.filter({
        driver_id: driver.id,
        departure_datetime: { $gte: today.toISOString() },
        trip_status: { $in: ["scheduled", "boarding", "departed", "delayed"] }
      }, "departure_datetime");

      // Cache for offline
      localStorage.setItem('driver-trips-cache', JSON.stringify(trips));
      return trips;
    },
    enabled: !!driver && isOnline,
    refetchInterval: 30000,
    initialData: () => {
      const cached = localStorage.getItem('driver-trips-cache');
      return cached ? JSON.parse(cached) : [];
    }
  });

  // Get routes for trips
  const { data: routes = [] } = useQuery({
    queryKey: ['driver-routes'],
    queryFn: async () => {
      if (!assignedTrips.length) return [];
      const routeIds = [...new Set(assignedTrips.map(t => t.route_id))];
      const routes = await base44.entities.BusRoute.filter({
        id: { $in: routeIds }
      });
      localStorage.setItem('driver-routes-cache', JSON.stringify(routes));
      return routes;
    },
    enabled: assignedTrips.length > 0 && isOnline,
    initialData: () => {
      const cached = localStorage.getItem('driver-routes-cache');
      return cached ? JSON.parse(cached) : [];
    }
  });

  // Get operators
  const { data: operators = [] } = useQuery({
    queryKey: ['driver-operators'],
    queryFn: async () => {
      if (!assignedTrips.length) return [];
      const operatorIds = [...new Set(assignedTrips.map(t => t.operator_id))];
      return await base44.entities.BusOperator.filter({
        id: { $in: operatorIds }
      });
    },
    enabled: assignedTrips.length > 0
  });

  // Get passengers for selected trip (offline-capable)
  const { data: tripPassengers = [] } = useQuery({
    queryKey: ['trip-passengers', selectedTrip?.id],
    queryFn: async () => {
      if (!selectedTrip) return [];

      const orders = await base44.entities.Order.filter({
        trip_id: selectedTrip.id,
        order_status: "paid"
      });

      const offlineSales = await base44.entities.OfflineSale.filter({
        trip_id: selectedTrip.id
      });

      const passengers = [];
      
      orders.forEach(order => {
        passengers.push({
          name: order.passenger_name,
          phone: order.passenger_phone,
          channel: "Online"
        });
      });

      offlineSales.forEach(sale => {
        passengers.push({
          name: sale.passenger_name,
          phone: sale.passenger_phone,
          channel: "Counter"
        });
      });

      // Cache for offline
      const cacheKey = `driver-passengers-${selectedTrip.id}`;
      localStorage.setItem(cacheKey, JSON.stringify(passengers));
      
      return passengers;
    },
    enabled: !!selectedTrip && isOnline,
    initialData: () => {
      if (!selectedTrip) return [];
      const cacheKey = `driver-passengers-${selectedTrip.id}`;
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : [];
    }
  });

  // Update trip status mutation (offline-capable)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ tripId, status, message }) => {
      if (!isOnline) {
        addToQueue({
          type: 'status_update',
          trip_id: tripId,
          status,
          message,
          user_email: user.email
        });
        toast.success("Status queued for sync");
        return { tripId, status, offline: true };
      }

      await base44.entities.Trip.update(tripId, { trip_status: status });
      await base44.entities.TripStatusUpdate.create({
        trip_id: tripId,
        update_type: status === 'departed' ? 'departed' : 
                     status === 'delayed' ? 'delayed' : 
                     status === 'completed' ? 'arrived' : 'departed',
        message: message || `Trip ${status}`,
        updated_by_user: user.email,
        notifications_sent: false
      });

      return { tripId, status };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['driver-trips']);
      if (!data.offline) {
        toast.success("Status updated!");
      }
    }
  });

  // Share location mutation (offline-capable)
  const shareLocationMutation = useMutation({
    mutationFn: async ({ tripId, latitude, longitude, speed, heading }) => {
      if (!isOnline) {
        addToQueue({
          type: 'location_update',
          trip_id: tripId,
          latitude,
          longitude,
          speed_kmh: speed || 0,
          heading_degrees: heading || 0
        });
        return { offline: true };
      }

      const response = await base44.functions.invoke('updateBusLocation', {
        trip_id: tripId,
        latitude,
        longitude,
        speed_kmh: speed || 0,
        heading_degrees: heading || 0,
        update_source: "driver_gps"
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (!data.offline) {
        toast.success("📍 Location shared");
      }
    }
  });

  // Auto-share location for departed trips
  useEffect(() => {
    if (!driver || !locationEnabled) return;

    const departedTrips = assignedTrips.filter(t => t.trip_status === 'departed');
    if (departedTrips.length === 0) return;

    const shareLocation = () => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            };
            setCurrentLocation(location);

            departedTrips.forEach(trip => {
              shareLocationMutation.mutate({
                tripId: trip.id,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                speed: position.coords.speed ? position.coords.speed * 3.6 : 0,
                heading: position.coords.heading || 0
              });
            });
          },
          (error) => {
            console.error('Location error:', error);
          }
        );
      }
    };

    // Share immediately
    shareLocation();

    // Then every 30 seconds
    const interval = setInterval(shareLocation, 30000);
    return () => clearInterval(interval);
  }, [driver, assignedTrips, locationEnabled]);

  const handleShareLocation = (trip) => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          shareLocationMutation.mutate({
            tripId: trip.id,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            speed: position.coords.speed ? position.coords.speed * 3.6 : 0,
            heading: position.coords.heading || 0
          });
        },
        (error) => {
          toast.error("Location access denied");
        }
      );
    } else {
      toast.error("Geolocation not supported");
    }
  };

  if (userLoading) {
    return <LoadingCard message="Loading driver app..." />;
  }

  if (!user) {
    return (
      <EmptyState
        icon={Bus}
        title="Driver App"
        actionLabel="Sign In"
        onAction={() => base44.auth.redirectToLogin()}
      />
    );
  }

  if (driverError) {
    return <QueryErrorFallback error={driverError} onRetry={refetchDriver} title="Failed to load driver profile" />;
  }

  if (driver === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-12 bg-white/5 border-white/10 text-center max-w-md">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
          <h3 className="text-2xl font-bold text-white mb-2">Driver Profile Not Found</h3>
          <p className="text-gray-400 mb-4">No driver account is linked to your email ({user?.email})</p>
          <p className="text-sm text-gray-500 mb-6">Your bus operator needs to add you as a driver using this email address.</p>
          <Button onClick={refetchDriver} variant="outline" className="border-white/10 text-gray-300">
            <RefreshCw className="w-4 h-4 mr-2" /> Retry
          </Button>
        </Card>
      </div>
    );
  }

  if (driver && driver.status !== "active") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-12 bg-white/5 border-white/10 text-center max-w-md">
          <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-orange-400" />
          <h3 className="text-2xl font-bold text-white mb-2">Account {driver.status === "suspended" ? "Suspended" : "Inactive"}</h3>
          <p className="text-gray-400 mb-4">Your driver account status is: <span className="text-white font-semibold">{driver.status}</span></p>
          <p className="text-sm text-gray-500">Contact your bus operator to reactivate your account.</p>
        </Card>
      </div>
    );
  }

  if (!driver) {
    return <LoadingCard message="Loading driver data..." />;
  }

  const todayTrips = assignedTrips.filter(t => {
    const tripDate = new Date(t.departure_datetime);
    const today = new Date();
    return tripDate.toDateString() === today.toDateString();
  });

  const upcomingTrips = assignedTrips.filter(t => {
    const tripDate = new Date(t.departure_datetime);
    const today = new Date();
    return tripDate.toDateString() !== today.toDateString();
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] pb-20">
      {/* Offline/Sync Indicator */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white px-4 py-2 text-center text-sm font-semibold">
          <WifiOff className="w-4 h-4 inline mr-2" />
          Offline Mode - {pendingSync.length} items queued for sync
        </div>
      )}
      
      {isSyncing && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-green-500 text-white px-4 py-2 text-center text-sm font-semibold">
          <RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
          Syncing {pendingSync.length} items...
        </div>
      )}

      {/* Header */}
      <div className={`sticky z-40 bg-[#1a1a2e]/95 backdrop-blur-lg border-b border-white/10 ${!isOnline || isSyncing ? 'top-8' : 'top-0'}`}>
        <div className="px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Driver App</h1>
              <div className="flex items-center gap-2">
                <p className="text-xs sm:text-sm text-gray-400 truncate max-w-[150px] sm:max-w-none">{driver.full_name}</p>
                {isOnline ? (
                  <Wifi className="w-3 h-3 text-green-400" />
                ) : (
                  <WifiOff className="w-3 h-3 text-orange-400" />
                )}
              </div>
            </div>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-[#0F1D35] border-white/10">
                <SheetTitle className="text-white mb-6">Menu</SheetTitle>
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Driver ID</p>
                    <p className="text-white font-mono text-sm">{driver.id.slice(0, 8)}</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">License</p>
                    <p className="text-white">{driver.license_number || "Not set"}</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Phone</p>
                    <p className="text-white">{driver.phone_number}</p>
                  </div>
                  <Button 
                    onClick={() => base44.auth.logout()} 
                    variant="outline" 
                    className="w-full border-red-500/30 text-red-400"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
        {/* Sync Status */}
        {pendingSync.length > 0 && (
          <Card className="p-4 bg-blue-500/20 border-blue-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RefreshCw className={`w-5 h-5 text-blue-400 ${isSyncing ? 'animate-spin' : ''}`} />
                <div>
                  <p className="font-semibold text-white">{pendingSync.length} Updates Pending</p>
                  <p className="text-xs text-gray-400">
                    {isOnline ? 'Syncing...' : 'Will sync when online'}
                  </p>
                </div>
              </div>
              {isOnline && (
                <Button onClick={syncPendingData} size="sm" className="bg-blue-500">
                  Sync Now
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Auto Location Toggle */}
        {todayTrips.some(t => t.trip_status === 'departed') && (
          <Card className="p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Navigation className="w-5 h-5 text-green-400" />
                <div>
                  <p className="font-semibold text-white">Auto Location Sharing</p>
                  <p className="text-xs text-gray-400">
                    Updates every 30s {!isOnline && '(queued offline)'}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setLocationEnabled(!locationEnabled)}
                className={locationEnabled ? "bg-green-500" : "bg-gray-600"}
              >
                {locationEnabled ? "ON" : "OFF"}
              </Button>
            </div>
          </Card>
        )}

        {/* Today's Trips */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Today's Trips ({todayTrips.length})</h2>
          {todayTrips.length === 0 ? (
            <Card className="p-8 bg-white/5 border-white/10 text-center">
              <Clock className="w-12 h-12 mx-auto mb-2 text-gray-500" />
              <p className="text-gray-400">No trips assigned today</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {todayTrips.map(trip => {
                const route = routes.find(r => r.id === trip.route_id);
                const operator = operators.find(o => o.id === trip.operator_id);
                
                return (
                  <Card key={trip.id} className="p-4 bg-white/5 border-white/10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Bus className="w-5 h-5 text-blue-400" />
                          <h3 className="text-lg font-bold text-white">
                            {route?.origin_city} → {route?.destination_city}
                          </h3>
                        </div>
                            {operator && <p className="text-sm text-gray-400 mb-1">{operator.name}</p>}
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex items-center gap-1 text-gray-300">
                            <Clock className="w-4 h-4" />
                            <span>{format(new Date(trip.departure_datetime), "HH:mm")}</span>
                          </div>
                          <Badge className={
                            trip.trip_status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' :
                            trip.trip_status === 'boarding' ? 'bg-green-500/20 text-green-400' :
                            trip.trip_status === 'departed' ? 'bg-purple-500/20 text-purple-400' :
                            trip.trip_status === 'delayed' ? 'bg-orange-500/20 text-orange-400' :
                            'bg-gray-500/20 text-gray-400'
                          }>
                            {trip.trip_status}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {trip.trip_status === 'scheduled' && (
                        <Button
                          onClick={() => updateStatusMutation.mutate({ 
                            tripId: trip.id, 
                            status: 'boarding',
                            message: 'Boarding started'
                          })}
                          disabled={updateStatusMutation.isPending}
                          className="bg-green-500 hover:bg-green-600"
                          size="lg"
                        >
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Start Boarding
                        </Button>
                      )}
                      {trip.trip_status === 'boarding' && (
                        <Button
                          onClick={() => updateStatusMutation.mutate({ 
                            tripId: trip.id, 
                            status: 'departed',
                            message: 'Bus departed'
                          })}
                          disabled={updateStatusMutation.isPending}
                          className="bg-purple-500 hover:bg-purple-600"
                          size="lg"
                        >
                          <Bus className="w-5 h-5 mr-2" />
                          Depart
                        </Button>
                      )}
                      {trip.trip_status === 'departed' && (
                        <Button
                          onClick={() => updateStatusMutation.mutate({ 
                            tripId: trip.id, 
                            status: 'completed',
                            message: 'Trip completed'
                          })}
                          disabled={updateStatusMutation.isPending}
                          className="bg-gray-600 hover:bg-gray-700"
                          size="lg"
                        >
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Arrive
                        </Button>
                      )}
                      {['scheduled', 'boarding'].includes(trip.trip_status) && (
                        <Button
                          onClick={() => updateStatusMutation.mutate({ 
                            tripId: trip.id, 
                            status: 'delayed',
                            message: 'Trip delayed'
                          })}
                          disabled={updateStatusMutation.isPending}
                          variant="outline"
                          className="border-orange-500/30 text-orange-400"
                          size="lg"
                        >
                          <AlertTriangle className="w-5 h-5 mr-2" />
                          Delay
                        </Button>
                      )}
                      {trip.trip_status === 'departed' && (
                        <Button
                          onClick={() => handleShareLocation(trip)}
                          disabled={shareLocationMutation.isPending}
                          variant="outline"
                          className="border-blue-500/30 text-blue-400"
                          size="lg"
                        >
                          <MapPin className="w-5 h-5 mr-2" />
                          Share Location
                        </Button>
                      )}
                    </div>

                    {/* Passengers */}
                    <Button
                      onClick={() => setSelectedTrip(selectedTrip?.id === trip.id ? null : trip)}
                      variant="outline"
                      className="w-full border-white/10"
                      size="lg"
                    >
                      <Users className="w-5 h-5 mr-2" />
                      View Passengers
                    </Button>

                    {selectedTrip?.id === trip.id && (
                      <div className="mt-4 space-y-4">
                        {/* Route Optimizer */}
                        {(trip.trip_status === 'scheduled' || trip.trip_status === 'boarding' || trip.trip_status === 'departed') && (
                          <RouteOptimizer 
                            trip={trip} 
                            currentLocation={currentLocation}
                            onETAUpdate={(newETA) => {
                              queryClient.invalidateQueries(['driver-trips']);
                            }}
                          />
                        )}

                        {/* Passenger List */}
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <h4 className="font-semibold text-white mb-3">Passenger List</h4>
                          {tripPassengers.length === 0 ? (
                            <p className="text-gray-400 text-sm">No passengers yet</p>
                          ) : (
                            <div className="space-y-2">
                              {tripPassengers.map((passenger, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 bg-white/5 rounded">
                                  <div>
                                    <p className="text-white font-medium text-sm">{passenger.name}</p>
                                    <p className="text-xs text-gray-400">{passenger.channel}</p>
                                  </div>
                                  {passenger.phone && (
                                    <a href={`tel:${passenger.phone}`}>
                                      <Button size="sm" className="bg-green-500 hover:bg-green-600">
                                        <Phone className="w-4 h-4" />
                                      </Button>
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming Trips */}
        {upcomingTrips.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Upcoming ({upcomingTrips.length})</h2>
            <div className="space-y-3">
              {upcomingTrips.map(trip => {
                const route = routes.find(r => r.id === trip.route_id);
                const operator = operators.find(o => o.id === trip.operator_id);
                
                return (
                  <Card key={trip.id} className="p-4 bg-white/5 border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-semibold">
                          {route?.origin_city} → {route?.destination_city}
                        </p>
                        <p className="text-xs text-gray-400">{operator?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-semibold">
                          {format(new Date(trip.departure_datetime), "MMM d")}
                        </p>
                        <p className="text-sm text-gray-400">
                          {format(new Date(trip.departure_datetime), "HH:mm")}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}