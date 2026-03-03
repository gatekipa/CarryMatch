import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, Calendar, Bus, UserCheck } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function TodayManifests() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: operator } = useQuery({
    queryKey: ['today-manifest-operator', user?.email],
    queryFn: async () => {
      const ops = await base44.entities.BusOperator.filter({ created_by: user.email });
      return ops[0];
    },
    enabled: !!user
  });

  const { data: todayTrips = [] } = useQuery({
    queryKey: ['today-trips', operator?.id],
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
        }
      }, "departure_datetime");
    },
    enabled: !!operator
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['today-routes', operator?.id],
    queryFn: () => base44.entities.BusRoute.filter({ operator_id: operator.id }),
    enabled: !!operator
  });

  const printAllManifests = () => {
    todayTrips.forEach((trip, index) => {
      setTimeout(() => {
        window.open(createPageUrl("TripManifest", `id=${trip.id}`), '_blank');
      }, index * 300);
    });
  };

  if (!user || !operator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Group by route
  const tripsByRoute = routes.map(route => {
    const routeTrips = todayTrips.filter(t => t.route_id === route.id);
    return {
      route,
      trips: routeTrips
    };
  }).filter(group => group.trips.length > 0);

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Today's Departures</h1>
            <p className="text-gray-400">{format(new Date(), "EEEE, dd/MM/yyyy")}</p>
          </div>
          <Button onClick={printAllManifests} className="bg-blue-500">
            <Printer className="w-4 h-4 mr-2" />
            Print All
          </Button>
        </div>

        {todayTrips.length === 0 ? (
          <Card className="p-12 bg-white/5 border-white/10 text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-xl font-bold text-white mb-2">No Trips Today</h3>
            <p className="text-gray-400">No scheduled trips for today</p>
          </Card>
        ) : (
          <div className="space-y-8">
            {tripsByRoute.map(({ route, trips }) => (
              <Card key={route.id} className="p-6 bg-white/5 border-white/10">
                <div className="flex items-center gap-3 mb-6">
                  <Bus className="w-6 h-6 text-blue-400" />
                  <h2 className="text-2xl font-bold text-white">
                    {route.origin_city} → {route.destination_city}
                  </h2>
                  <Badge className="bg-blue-500/20 text-blue-400">{trips.length} trips</Badge>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {trips.map(trip => (
                    <Card key={trip.id} className="p-4 bg-white/5 border-white/10 hover:bg-white/[0.08] transition-all">
                      <div className="flex items-center gap-3 mb-3">
                        <Calendar className="w-4 h-4 text-purple-400" />
                        <span className="font-semibold text-white text-lg">
                          {format(new Date(trip.departure_datetime), "HH:mm")}
                        </span>
                        <Badge className={
                          trip.trip_status === 'scheduled' ? 'bg-green-500/20 text-green-400' :
                          trip.trip_status === 'boarding' ? 'bg-blue-500/20 text-blue-400' :
                          trip.trip_status === 'departed' ? 'bg-purple-500/20 text-purple-400' :
                          trip.trip_status === 'delayed' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-gray-500/20 text-gray-400'
                        }>
                          {trip.trip_status}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Link to={createPageUrl("VendorBoardingDashboard", `id=${trip.id}`)} className="flex-1">
                          <Button size="lg" className="w-full bg-gradient-to-r from-green-500 to-emerald-600">
                            <UserCheck className="w-5 h-5 mr-2" />
                            Boarding
                          </Button>
                        </Link>
                        <Link to={createPageUrl("TripManifest", `id=${trip.id}`)}>
                          <Button size="lg" variant="outline" className="border-white/10">
                            <Printer className="w-5 h-5" />
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}