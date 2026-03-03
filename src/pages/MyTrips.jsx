import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, Plus, Calendar, Weight, DollarSign, ArrowRight, Loader2, Edit, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export default function MyTrips() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {
      base44.auth.redirectToLogin();
    });
  }, []);

  const { data: myTrips = [], isLoading } = useQuery({
    queryKey: ['my-trips', user?.email],
    queryFn: async () => {
      if (!user) return [];
      // Fetch user's P2P trips by creator and traveler email
      const byCreator = await base44.entities.Trip.filter({
        created_by: user.email
      }, "-created_date");
      const byTraveler = await base44.entities.Trip.filter({
        traveler_email: user.email
      }, "-created_date");
      // Merge, deduplicate, and exclude bus trips
      const seen = new Set();
      return [...byCreator, ...byTraveler].filter(trip => {
        if (seen.has(trip.id)) return false;
        seen.add(trip.id);
        return !trip.operator_id;
      });
    },
    enabled: !!user
  });

  if (!user || isLoading) {
    return (
      <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <Card className="p-12 bg-white/5 border-white/10 text-center">
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-[#9EFF00] animate-spin" />
            <h3 className="text-2xl font-bold text-white mb-2">Loading...</h3>
            <p className="text-gray-400">Fetching your trips</p>
          </Card>
        </div>
      </div>
    );
  }

  const activeTrips = myTrips.filter(t => t.status === "active");
  const completedTrips = myTrips.filter(t => t.status === "completed");
  const otherTrips = myTrips.filter(t => t.status !== "active" && t.status !== "completed");

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                My <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9EFF00] to-[#7ACC00]">Trips</span>
              </h1>
              <p className="text-gray-400">Manage your listed travel routes</p>
            </div>
            <Link to={createPageUrl("PostTrip")}>
              <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                List Your Trip
              </Button>
            </Link>
          </div>

          {myTrips.length === 0 ? (
            <Card className="p-12 bg-white/5 border-white/10 text-center backdrop-blur-sm">
              <Plane className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-2xl font-bold text-white mb-2">You have not listed any trips yet</h3>
              <p className="text-gray-400 mb-6">Start earning by sharing your luggage space with travelers</p>
              <Link to={createPageUrl("PostTrip")}>
                <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  List Your First Trip
                </Button>
              </Link>
            </Card>
          ) : (
            <>
              {/* Active Trips */}
              {activeTrips.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    Active Trips ({activeTrips.length})
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <AnimatePresence mode="popLayout">
                      {activeTrips.map((trip) => (
                        <motion.div
                          key={trip.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          layout
                        >
                          <Link to={createPageUrl("TripDetails", `id=${trip.id}`)}>
                            <Card className="p-6 bg-white/5 border-white/10 hover:bg-white/10 transition-all backdrop-blur-sm cursor-pointer">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-white font-semibold">{trip.from_city}</span>
                                    <ArrowRight className="w-4 h-4 text-blue-400" />
                                    <span className="text-white font-semibold">{trip.to_city}</span>
                                  </div>
                                  <p className="text-sm text-gray-400">{trip.from_country} → {trip.to_country}</p>
                                </div>
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                  {trip.status}
                                </Badge>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-gray-300">
                                  <Calendar className="w-4 h-4 text-blue-400" />
                                  Departure: {trip.departure_date ? format(new Date(trip.departure_date), "MMM d, yyyy") : "No date"}
                                </div>
                                <div className="flex items-center gap-2 text-gray-300">
                                  <Weight className="w-4 h-4 text-green-400" />
                                  Available: {trip.available_weight_kg} kg
                                </div>
                                {trip.price_per_kg && (
                                  <div className="flex items-center gap-2 text-gray-300">
                                    <DollarSign className="w-4 h-4 text-yellow-400" />
                                    ${trip.price_per_kg}/kg
                                  </div>
                                )}
                              </div>
                            </Card>
                          </Link>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {/* Completed Trips */}
              {completedTrips.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-4">
                    Completed Trips ({completedTrips.length})
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {completedTrips.map((trip) => (
                      <Link key={trip.id} to={createPageUrl("TripDetails", `id=${trip.id}`)}>
                        <Card className="p-6 bg-white/5 border-white/10 hover:bg-white/10 transition-all backdrop-blur-sm cursor-pointer opacity-75">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-white font-semibold">{trip.from_city}</span>
                                <ArrowRight className="w-4 h-4 text-gray-400" />
                                <span className="text-white font-semibold">{trip.to_city}</span>
                              </div>
                              <p className="text-sm text-gray-400">{trip.from_country} → {trip.to_country}</p>
                            </div>
                            <Badge className="bg-gray-500/20 text-gray-400">
                              {trip.status}
                            </Badge>
                          </div>
                          <div className="space-y-2 text-sm text-gray-400">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {trip.departure_date ? format(new Date(trip.departure_date), "MMM d, yyyy") : "No date"}
                            </div>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Other Trips */}
              {otherTrips.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">
                    Other Trips ({otherTrips.length})
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {otherTrips.map((trip) => (
                      <Link key={trip.id} to={createPageUrl("TripDetails", `id=${trip.id}`)}>
                        <Card className="p-6 bg-white/5 border-white/10 hover:bg-white/10 transition-all backdrop-blur-sm cursor-pointer">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-white font-semibold">{trip.from_city}</span>
                                <ArrowRight className="w-4 h-4 text-gray-400" />
                                <span className="text-white font-semibold">{trip.to_city}</span>
                              </div>
                              <p className="text-sm text-gray-400">{trip.from_country} → {trip.to_country}</p>
                            </div>
                            <Badge className={
                              trip.status === "matched" ? "bg-yellow-500/20 text-yellow-400" :
                              trip.status === "cancelled" ? "bg-red-500/20 text-red-400" :
                              "bg-gray-500/20 text-gray-400"
                            }>
                              {trip.status}
                            </Badge>
                          </div>
                          <div className="space-y-2 text-sm text-gray-400">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {trip.departure_date ? format(new Date(trip.departure_date), "MMM d, yyyy") : "No date"}
                            </div>
                          </div>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}