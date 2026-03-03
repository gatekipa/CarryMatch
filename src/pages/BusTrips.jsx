import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bus, MapPin, Clock, Star, Users, ArrowRight, Filter, Building2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";

export default function BusTrips() {
  const urlParams = new URLSearchParams(window.location.search);
  const operatorId = urlParams.get("operator");
  const branchId = urlParams.get("branch");
  const fromCity = urlParams.get("from");
  const toCity = urlParams.get("to");
  const travelDate = urlParams.get("date");

  const [filterAgency, setFilterAgency] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterTime, setFilterTime] = useState("all");
  const [filterVipOnly, setFilterVipOnly] = useState(false);

  // Fetch operators
  const { data: operators = [] } = useQuery({
    queryKey: ['trip-operators'],
    queryFn: () => base44.entities.BusOperator.filter({ status: "active" })
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['trip-routes'],
    queryFn: () => base44.entities.BusRoute.filter({ route_status: "active" })
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['operator-branches', operators.map(o => o.id).join(',')],
    queryFn: async () => {
      if (operators.length === 0) return [];
      // Fetch branches only for active operators
      const results = await Promise.all(
        operators.map(op => base44.entities.OperatorBranch.filter({ operator_id: op.id }))
      );
      return results.flat();
    },
    enabled: operators.length > 0
  });

  // Build trip filters
  const tripFilter = {};
  if (operatorId) {
    tripFilter.operator_id = operatorId;
  } else if (fromCity && toCity) {
    const matchingRoutes = routes.filter(r => 
      r.origin_city === fromCity && r.destination_city === toCity
    );
    if (matchingRoutes.length > 0) {
      tripFilter.route_id = { $in: matchingRoutes.map(r => r.id) };
    }
  }

  if (branchId && branchId !== 'any') {
    tripFilter.departure_branch_id = branchId;
  }

  if (travelDate) {
    const dateStart = new Date(travelDate);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(travelDate);
    dateEnd.setHours(23, 59, 59, 999);
    tripFilter.departure_datetime = {
      $gte: dateStart.toISOString(),
      $lte: dateEnd.toISOString()
    };
  } else {
    tripFilter.departure_datetime = { $gte: new Date().toISOString() };
  }

  tripFilter.trip_status = { $in: ["scheduled", "boarding"] };

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ['search-trips', tripFilter],
    queryFn: () => base44.entities.Trip.filter(tripFilter, "departure_datetime", 100)
  });

  const { data: seatInventories = [] } = useQuery({
    queryKey: ['trip-seats', trips.map(t => t.id)],
    queryFn: async () => {
      if (!trips.length) return [];
      return await base44.entities.TripSeatInventory.filter({
        trip_id: { $in: trips.map(t => t.id) }
      });
    },
    enabled: trips.length > 0
  });

  const { data: ratings = [] } = useQuery({
    queryKey: ['trip-ratings', operators.map(o => o.id).join(',')],
    queryFn: async () => {
      if (operators.length === 0) return [];
      const results = await Promise.all(
        operators.map(op => base44.entities.TripRating.filter({ operator_id: op.id }, "-created_date", 100))
      );
      return results.flat();
    },
    enabled: operators.length > 0
  });

  const getAvailableSeats = (tripId) => {
    return seatInventories.filter(s => 
      s.trip_id === tripId && s.seat_status === 'available'
    ).length;
  };

  const hasVipSeats = (tripId) => {
    return seatInventories.some(s => 
      s.trip_id === tripId && s.seat_class === 'vip' && s.seat_status === 'available'
    );
  };

  const hasOfflineSeats = (tripId) => {
    const allSeats = seatInventories.filter(s => s.trip_id === tripId);
    const soldTotal = allSeats.filter(s => 
      s.seat_status === 'sold_online' || s.seat_status === 'sold_offline'
    ).length;
    return soldTotal < allSeats.length && getAvailableSeats(tripId) === 0;
  };

  const getOperatorRating = (opId) => {
    const opRatings = ratings.filter(r => r.operator_id === opId);
    if (opRatings.length === 0) return null;
    return (opRatings.reduce((sum, r) => sum + r.rating, 0) / opRatings.length).toFixed(1);
  };

  const getTimeOfDay = (datetime) => {
    const hour = new Date(datetime).getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'night';
  };

  // Filter trips
  let filteredTrips = trips;

  if (filterAgency) {
    filteredTrips = filteredTrips.filter(t => t.operator_id === filterAgency);
  }

  if (filterBranch) {
    filteredTrips = filteredTrips.filter(t => t.departure_branch_id === filterBranch);
  }

  if (filterTime !== 'all') {
    filteredTrips = filteredTrips.filter(t => getTimeOfDay(t.departure_datetime) === filterTime);
  }

  if (filterVipOnly) {
    filteredTrips = filteredTrips.filter(t => hasVipSeats(t.id));
  }

  // Group trips by operator, then branch
  const groupedTrips = {};
  filteredTrips.forEach(trip => {
    if (!groupedTrips[trip.operator_id]) {
      groupedTrips[trip.operator_id] = {};
    }
    const branchKey = trip.departure_branch_id || 'unassigned';
    if (!groupedTrips[trip.operator_id][branchKey]) {
      groupedTrips[trip.operator_id][branchKey] = [];
    }
    groupedTrips[trip.operator_id][branchKey].push(trip);
  });

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {operatorId 
              ? `${operators.find(o => o.id === operatorId)?.name || 'Agency'} Departures`
              : fromCity && toCity 
                ? `${fromCity} → ${toCity}`
                : 'Available Trips'}
          </h1>
          <p className="text-gray-400">
            {filteredTrips.length} trip{filteredTrips.length !== 1 ? 's' : ''} found
            {travelDate && ` for ${format(parseISO(travelDate), 'dd/MM/yyyy')}`}
          </p>
        </div>

        {/* Filters */}
        <Card className="p-4 bg-white/5 border-white/10 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-300 font-medium">Filters</span>
          </div>
          <div className="grid md:grid-cols-4 gap-3">
            {!operatorId && (
              <Select value={filterAgency} onValueChange={setFilterAgency}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="All agencies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>All agencies</SelectItem>
                  {operators.map(op => (
                    <SelectItem key={op.id} value={op.id}>{op.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            <Select value={filterBranch} onValueChange={setFilterBranch}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="All branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>All branches</SelectItem>
                {branches.map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.branch_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterTime} onValueChange={setFilterTime}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="All times" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All times</SelectItem>
                <SelectItem value="morning">Morning (6am-12pm)</SelectItem>
                <SelectItem value="afternoon">Afternoon (12pm-6pm)</SelectItem>
                <SelectItem value="night">Night (6pm-6am)</SelectItem>
              </SelectContent>
            </Select>

            <label className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={filterVipOnly}
                onChange={(e) => setFilterVipOnly(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-white text-sm">VIP only</span>
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
            <h3 className="text-xl font-bold text-white mb-2">No trips found</h3>
            <p className="text-gray-400">Try adjusting your search or filters</p>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedTrips).map(([opId, branchGroups]) => {
              const operator = operators.find(o => o.id === opId);
              if (!operator) return null;
              const rating = getOperatorRating(opId);

              return (
                <motion.div key={opId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  {/* Operator Header */}
                  <div className="flex items-center gap-4 mb-4">
                    {operator.logo_url ? (
                      <img src={operator.logo_url} alt={operator.name} onError={(e) => { e.target.style.display="none" }} className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <Bus className="w-6 h-6 text-blue-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-white">{operator.name}</h2>
                      <div className="flex items-center gap-3 text-sm">
                        {rating && (
                          <div className="flex items-center gap-1 text-gray-400">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <span>{rating}</span>
                          </div>
                        )}
                        {operator.phone && (
                          <span className="text-gray-400">{operator.phone}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Branch Groups */}
                  {Object.entries(branchGroups).map(([branchKey, branchTrips]) => {
                    const branch = branches.find(b => b.id === branchKey);
                    const branchName = branch ? `${branch.branch_name}, ${branch.city}` : "Main Station";

                    return (
                      <div key={branchKey} className="mb-6">
                        <div className="flex items-center gap-2 mb-3 ml-2 p-3 bg-white/5 rounded-lg">
                          <Building2 className="w-4 h-4 text-blue-400" />
                          <h3 className="text-lg font-semibold text-white">{branchName}</h3>
                        </div>

                        <div className="space-y-3">
                          {branchTrips.map(trip => {
                            const route = routes.find(r => r.id === trip.route_id);
                            const availableSeats = getAvailableSeats(trip.id);
                            const hasVip = hasVipSeats(trip.id);
                            const offlineAvailable = hasOfflineSeats(trip.id);

                            return (
                              <Card key={trip.id} className="p-5 bg-white/5 border-white/10 hover:bg-white/[0.08] transition-all">
                                <div className="flex flex-col md:flex-row md:items-center gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <div className="text-2xl font-bold text-white">
                                        {format(new Date(trip.departure_datetime), 'HH:mm')}
                                      </div>
                                      <ArrowRight className="w-5 h-5 text-gray-500" />
                                      <div className="text-lg text-gray-300">
                                        {route?.origin_city} → {route?.destination_city}
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 text-sm">
                                      <div className="flex items-center gap-1 text-gray-400">
                                        <Clock className="w-3 h-3" />
                                        <span>{format(new Date(trip.departure_datetime), 'dd/MM/yyyy')}</span>
                                      </div>
                                      
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
                                      ) : offlineAvailable ? (
                                        <Badge className="bg-yellow-500/20 text-yellow-400">
                                          Available at agency counter
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-red-500/20 text-red-400">Sold Out</Badge>
                                      )}

                                      {hasVip && (
                                        <Badge className="bg-purple-500/20 text-purple-400">VIP Available</Badge>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-4">
                                    <div className="text-right">
                                      <div className="text-sm text-gray-400">From</div>
                                      <div className="text-2xl font-bold text-blue-400">
                                        {trip.base_price_xaf.toLocaleString()} XAF
                                      </div>
                                    </div>
                                    
                                    <Link to={createPageUrl("BusTripDetails", `id=${trip.id}`)}>
                                      <Button 
                                        disabled={availableSeats === 0 && !offlineAvailable}
                                        className="bg-gradient-to-r from-blue-500 to-indigo-600"
                                      >
                                        Select Seats
                                      </Button>
                                    </Link>
                                  </div>
                                </div>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}