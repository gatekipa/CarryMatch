import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bus, Calendar, Clock, DollarSign, Users, Filter, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { format, parseISO, differenceInHours } from "date-fns";

export default function BusResults() {
  const urlParams = new URLSearchParams(window.location.search);
  const fromCity = urlParams.get("from");
  const toCity = urlParams.get("to");
  const date = urlParams.get("date");
  
  const [timeFilter, setTimeFilter] = useState("all");
  const [operatorFilter, setOperatorFilter] = useState("all");
  const [vipFilter, setVipFilter] = useState(false);

  const { data: routes = [] } = useQuery({
    queryKey: ['search-routes', fromCity, toCity],
    queryFn: async () => {
      return await base44.entities.BusRoute.filter({
        origin_city: fromCity,
        destination_city: toCity,
        route_status: "active"
      });
    },
    enabled: !!fromCity && !!toCity
  });

  const { data: allTrips = [], isLoading } = useQuery({
    queryKey: ['search-trips', routes.map(r => r.id), date],
    queryFn: async () => {
      if (!routes.length) return [];
      
      const dateStart = new Date(date);
      const dateEnd = new Date(date);
      dateEnd.setHours(23, 59, 59);

      return await base44.entities.Trip.filter({
        route_id: { $in: routes.map(r => r.id) },
        trip_status: { $in: ["scheduled", "boarding"] },
        departure_datetime: { $gte: dateStart.toISOString(), $lte: dateEnd.toISOString() }
      }, "departure_datetime");
    },
    enabled: routes.length > 0
  });

  const { data: operators = [] } = useQuery({
    queryKey: ['trip-operators'],
    queryFn: async () => {
      const operatorIds = [...new Set(allTrips.map(t => t.operator_id))];
      if (!operatorIds.length) return [];
      return await base44.entities.BusOperator.filter({
        id: { $in: operatorIds }
      });
    },
    enabled: allTrips.length > 0
  });

  const { data: seatInventories = [] } = useQuery({
    queryKey: ['trip-seats', allTrips.map(t => t.id)],
    queryFn: async () => {
      if (!allTrips.length) return [];
      return await base44.entities.TripSeatInventory.filter({
        trip_id: { $in: allTrips.map(t => t.id) }
      });
    },
    enabled: allTrips.length > 0
  });

  const getAvailableSeats = (tripId) => {
    // Only count seats available for ONLINE channel (not blocked)
    const seats = seatInventories.filter(s => 
      s.trip_id === tripId && 
      s.seat_status === 'available'
    );
    return seats.length;
  };

  const hasOfflineSeats = (tripId) => {
    // Check if trip has any offline-only seats (for "still available at counters" message)
    const allSeats = seatInventories.filter(s => s.trip_id === tripId);
    const availableOffline = allSeats.filter(s => 
      s.seat_status === 'available' || s.seat_status === 'blocked'
    ).length;
    const soldTotal = allSeats.filter(s => 
      s.seat_status === 'sold_online' || s.seat_status === 'sold_offline'
    ).length;
    return soldTotal < allSeats.length && availableOffline > 0;
  };

  const getPriceRange = (tripId) => {
    const seats = seatInventories.filter(s => s.trip_id === tripId);
    if (!seats.length) return { min: 0, max: 0 };
    const prices = seats.map(s => s.price_xaf);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  };

  const hasVipSeats = (tripId) => {
    return seatInventories.some(s => s.trip_id === tripId && s.seat_class === 'vip');
  };

  const getTimeCategory = (datetime) => {
    const hour = new Date(datetime).getHours();
    if (hour >= 5 && hour < 12) return "morning";
    if (hour >= 12 && hour < 17) return "afternoon";
    return "night";
  };

  const filteredTrips = allTrips.filter(trip => {
    if (timeFilter !== "all" && getTimeCategory(trip.departure_datetime) !== timeFilter) return false;
    if (operatorFilter !== "all" && trip.operator_id !== operatorFilter) return false;
    if (vipFilter && !hasVipSeats(trip.id)) return false;
    return true;
  });

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {fromCity} → {toCity}
          </h1>
          <p className="text-gray-400">
            {date && format(parseISO(date), "EEEE, MMMM d, yyyy")} • {filteredTrips.length} trips found
          </p>
        </div>

        {/* Filters */}
        <Card className="p-6 bg-white/5 border-white/10 mb-8">
          <div className="flex items-center gap-4 flex-wrap">
            <Filter className="w-5 h-5 text-gray-400" />
            
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Times</SelectItem>
                <SelectItem value="morning">Morning (5AM-12PM)</SelectItem>
                <SelectItem value="afternoon">Afternoon (12PM-5PM)</SelectItem>
                <SelectItem value="night">Night (5PM-5AM)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={operatorFilter} onValueChange={setOperatorFilter}>
              <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Operators</SelectItem>
                {operators.map(op => (
                  <SelectItem key={op.id} value={op.id}>{op.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={vipFilter}
                onChange={(e) => setVipFilter(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-gray-300">VIP Seats Only</span>
            </label>
          </div>
        </Card>

        {/* Results */}
        {isLoading ? (
          <Card className="p-12 bg-white/5 border-white/10 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
          </Card>
        ) : filteredTrips.length === 0 ? (
          <Card className="p-12 bg-white/5 border-white/10 text-center">
            <Bus className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-xl font-bold text-white mb-2">No Trips Found</h3>
            <p className="text-gray-400">Try adjusting your filters or search criteria</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredTrips.map((trip) => {
              const operator = operators.find(o => o.id === trip.operator_id);
              const route = routes.find(r => r.id === trip.route_id);
              const priceRange = getPriceRange(trip.id);
              const availableSeats = getAvailableSeats(trip.id);
              const hasVip = hasVipSeats(trip.id);
              const departTime = new Date(trip.departure_datetime);
              const arriveTime = trip.arrival_estimate_datetime ? new Date(trip.arrival_estimate_datetime) : null;
              const duration = arriveTime ? differenceInHours(arriveTime, departTime) : null;

              return (
                <Link key={trip.id} to={createPageUrl("BusTripDetails", `id=${trip.id}`)}>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="p-6 bg-white/5 border-white/10 hover:bg-white/[0.08] transition-all cursor-pointer">
                      <div className="flex items-start gap-6">
                        {/* Operator Logo */}
                        <div className="flex-shrink-0">
                          {operator?.logo_url ? (
                            <img src={operator.logo_url} alt={operator.name} className="w-16 h-16 rounded-lg object-cover" />
                          ) : (
                            <div className="w-16 h-16 bg-blue-500/20 rounded-lg flex items-center justify-center">
                              <Bus className="w-8 h-8 text-blue-400" />
                            </div>
                          )}
                          <p className="text-xs text-gray-400 text-center mt-2">{operator?.name}</p>
                        </div>

                        {/* Trip Info */}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                              <div>
                                <div className="text-2xl font-bold text-white">{format(departTime, "h:mm a")}</div>
                                <div className="text-sm text-gray-400">{route?.origin_city}</div>
                              </div>
                              <div className="flex flex-col items-center">
                                <ArrowRight className="w-6 h-6 text-blue-400" />
                                {duration && <span className="text-xs text-gray-500">{duration}h</span>}
                              </div>
                              <div>
                                <div className="text-2xl font-bold text-white">
                                  {arriveTime ? format(arriveTime, "h:mm a") : "TBD"}
                                </div>
                                <div className="text-sm text-gray-400">{route?.destination_city}</div>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-sm text-gray-400">From</div>
                              <div className="text-2xl font-bold text-blue-400">
                                {priceRange.min.toLocaleString()} XAF
                              </div>
                              {priceRange.min !== priceRange.max && (
                                <div className="text-xs text-gray-500">up to {priceRange.max.toLocaleString()}</div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 flex-wrap">
                            {availableSeats > 0 ? (
                              <>
                                <Badge className="bg-green-500/20 text-green-400">
                                  <Users className="w-3 h-3 mr-1" />
                                  {availableSeats} seats available
                                </Badge>
                                {availableSeats <= 5 && (
                                  <Badge className="bg-orange-500/20 text-orange-400">Limited seats</Badge>
                                )}
                              </>
                            ) : hasOfflineSeats(trip.id) ? (
                              <Badge className="bg-yellow-500/20 text-yellow-400">
                                Sold out online - Available at agency counters
                              </Badge>
                            ) : (
                              <Badge className="bg-red-500/20 text-red-400">Sold Out</Badge>
                            )}
                            {hasVip && (
                              <Badge className="bg-purple-500/20 text-purple-400">VIP Available</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}