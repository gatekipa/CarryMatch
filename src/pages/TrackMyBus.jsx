import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Bus, Search, MapPin, Clock, Phone, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import LiveBusMap from "../components/bus/LiveBusMap";

export default function TrackMyBus() {
  const urlParams = new URLSearchParams(window.location.search);
  const ticketCode = urlParams.get("ticket");
  
  const [user, setUser] = useState(null);
  const [searchCode, setSearchCode] = useState(ticketCode || "");
  const [searchedTicket, setSearchedTicket] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: ticket } = useQuery({
    queryKey: ['track-ticket', searchCode],
    queryFn: async () => {
      const tickets = await base44.entities.Ticket.filter({ ticket_code: searchCode });
      return tickets[0];
    },
    enabled: !!searchCode && searchCode.length >= 6
  });

  const { data: order } = useQuery({
    queryKey: ['track-order', ticket?.order_id],
    queryFn: async () => {
      const orders = await base44.entities.Order.filter({ id: ticket.order_id });
      return orders[0];
    },
    enabled: !!ticket
  });

  const { data: trip } = useQuery({
    queryKey: ['track-trip', order?.trip_id],
    queryFn: async () => {
      const trips = await base44.entities.Trip.filter({ id: order.trip_id });
      return trips[0];
    },
    enabled: !!order
  });

  const { data: route } = useQuery({
    queryKey: ['track-route', trip?.route_id],
    queryFn: async () => {
      const routes = await base44.entities.BusRoute.filter({ id: trip.route_id });
      return routes[0];
    },
    enabled: !!trip
  });

  const { data: operator } = useQuery({
    queryKey: ['track-operator', trip?.operator_id],
    queryFn: async () => {
      const ops = await base44.entities.BusOperator.filter({ id: trip.operator_id });
      return ops[0];
    },
    enabled: !!trip
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchCode) {
      setSearchedTicket(searchCode);
    }
  };

  const canTrack = trip && trip.trip_status === 'departed';

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Track My Bus</h1>
          <p className="text-gray-400">See your bus location in real-time</p>
        </div>

        {/* Search */}
        <Card className="p-6 bg-white/5 border-white/10 mb-8">
          <form onSubmit={handleSearch}>
            <Label className="text-gray-300 mb-2 block">Enter Your Ticket Code</Label>
            <div className="flex gap-3">
              <Input
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                placeholder="e.g., ABC123XY"
                className="bg-white/5 border-white/10 text-white text-lg"
              />
              <Button type="submit" className="bg-blue-500">
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </Card>

        {/* Results */}
        {searchedTicket && !ticket && (
          <Card className="p-8 bg-red-500/10 border-red-500/30 text-center">
            <p className="text-red-400">Ticket not found. Please check your code.</p>
          </Card>
        )}

        {ticket && order && trip && route && operator && (
          <div className="space-y-6">
            {/* Trip Info */}
            <Card className="p-6 bg-white/5 border-white/10">
              <div className="flex items-start gap-4 mb-4">
                {operator.logo_url && (
                  <img src={operator.logo_url} alt={operator.name} className="w-12 h-12 rounded-lg object-cover" />
                )}
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white mb-1">{operator.name}</h2>
                  <p className="text-gray-400">{route.origin_city} → {route.destination_city}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 mb-1">Departure</p>
                  <p className="text-white font-semibold">
                    {format(new Date(trip.departure_datetime), "dd/MM/yyyy HH:mm")}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Passenger</p>
                  <p className="text-white font-semibold">{order.passenger_name}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Seat</p>
                  <p className="text-white font-semibold text-lg">{ticket.ticket_code.slice(-2)}</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Status</p>
                  <Badge className={
                    trip.trip_status === 'departed' ? 'bg-purple-500/20 text-purple-400' :
                    trip.trip_status === 'completed' ? 'bg-green-500/20 text-green-400' :
                    'bg-blue-500/20 text-blue-400'
                  }>
                    {trip.trip_status}
                  </Badge>
                </div>
              </div>
            </Card>

            {/* Live Tracking */}
            {canTrack ? (
              <LiveBusMap trip={trip} route={route} operator={operator} />
            ) : trip.trip_status === 'completed' ? (
              <Card className="p-8 bg-green-500/10 border-green-500/30 text-center">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-white mb-2">Trip Completed</h3>
                <p className="text-gray-300">This bus has arrived at the destination.</p>
              </Card>
            ) : (
              <Card className="p-8 bg-blue-500/10 border-blue-500/30 text-center">
                <Bus className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                <h3 className="text-xl font-bold text-white mb-2">Tracking Not Yet Available</h3>
                <p className="text-gray-300">Live tracking will be available once the bus departs.</p>
              </Card>
            )}

            {/* Contact */}
            {operator.phone && (
              <Card className="p-4 bg-white/5 border-white/10">
                <div className="flex items-center gap-2 text-gray-300">
                  <Phone className="w-4 h-4 text-blue-400" />
                  <span className="text-sm">Need help? Call {operator.name}:</span>
                  <a href={`tel:${operator.phone}`} className="text-blue-400 font-semibold ml-auto">
                    {operator.phone}
                  </a>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}