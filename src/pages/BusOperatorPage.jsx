import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bus, MapPin, Phone, Mail, ArrowRight, Calendar, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { format } from "date-fns";
import QRTracker from "../components/bus/QRTracker";

export default function BusOperatorPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get("slug");

  const { data: operator, isLoading } = useQuery({
    queryKey: ['bus-operator-public', slug],
    queryFn: async () => {
      const ops = await base44.entities.BusOperator.filter({ 
        public_slug: slug,
        status: "active"
      });
      return ops[0];
    },
    enabled: !!slug
  });

  const { data: primaryBranch } = useQuery({
    queryKey: ['primary-branch', operator?.id],
    queryFn: async () => {
      const branches = await base44.entities.OperatorBranch.filter({ 
        operator_id: operator.id,
        is_primary: true
      });
      return branches[0];
    },
    enabled: !!operator
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['operator-all-branches', operator?.id],
    queryFn: () => base44.entities.OperatorBranch.filter({ operator_id: operator.id }),
    enabled: !!operator
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['operator-routes', operator?.id],
    queryFn: async () => {
      return await base44.entities.BusRoute.filter({ 
        operator_id: operator.id,
        route_status: "active"
      });
    },
    enabled: !!operator
  });

  const { data: upcomingTrips = [] } = useQuery({
    queryKey: ['operator-upcoming-trips', operator?.id],
    queryFn: async () => {
      const trips = await base44.entities.Trip.filter({ 
        operator_id: operator.id,
        trip_status: "scheduled"
      }, "-departure_datetime", 10);
      return trips.filter(t => new Date(t.departure_datetime) > new Date());
    },
    enabled: !!operator
  });

  const { data: operatorRatings = [] } = useQuery({
    queryKey: ['operator-ratings', operator?.id],
    queryFn: () => base44.entities.TripRating.filter({ operator_id: operator.id }),
    enabled: !!operator
  });

  const averageRating = operatorRatings.length > 0
    ? (operatorRatings.reduce((sum, r) => sum + r.rating, 0) / operatorRatings.length).toFixed(1)
    : null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!operator) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-12 bg-white/5 border-white/10 text-center">
          <h3 className="text-2xl font-bold text-white mb-2">Operator Not Found</h3>
          <p className="text-gray-400">The bus operator you're looking for doesn't exist.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      {operator && <QRTracker qrType="operator" targetId={operator.id} operatorId={operator.id} />}
      
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <Card className="p-8 bg-white/5 border-white/10 backdrop-blur-sm mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {operator.logo_url ? (
                <img 
                  src={operator.logo_url} 
                  alt={operator.name}
                  className="w-24 h-24 rounded-xl object-cover"
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <Bus className="w-12 h-12 text-white" />
                </div>
              )}
              
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-white mb-2">{operator.name}</h1>
                {operator.legal_name && (
                  <p className="text-gray-400 mb-4">{operator.legal_name}</p>
                )}
                
                <div className="flex flex-wrap gap-4 mb-4">
                  {operator.hq_city && (
                    <div className="flex items-center gap-2 text-gray-300">
                      <MapPin className="w-4 h-4" />
                      <span>{operator.hq_city}</span>
                    </div>
                  )}
                  {operator.phone && (
                    <div className="flex items-center gap-2 text-gray-300">
                      <Phone className="w-4 h-4" />
                      <span>{operator.phone}</span>
                    </div>
                  )}
                  {operator.email && (
                    <div className="flex items-center gap-2 text-gray-300">
                      <Mail className="w-4 h-4" />
                      <span>{operator.email}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  {primaryBranch && (
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                      <MapPin className="w-3 h-3 mr-1" />
                      Main Station: {primaryBranch.branch_name}, {primaryBranch.city}
                    </Badge>
                  )}
                  {averageRating && (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                      <Star className="w-3 h-3 mr-1 fill-yellow-400" />
                      {averageRating} ({operatorRatings.length} reviews)
                    </Badge>
                  )}
                </div>
                </div>

              <Link to={createPageUrl("BusTrips", `operator=${operator.id}`)}>
                <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                  Book a Ticket
                </Button>
              </Link>
            </div>
          </Card>

          {/* Branches */}
          {branches.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-6">Our Stations</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {branches.map(branch => (
                  <Card key={branch.id} className="p-5 bg-white/5 border-white/10">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-1">{branch.branch_name}</h3>
                        <p className="text-sm text-gray-400 mb-2">{branch.city}</p>
                        {branch.address_text && (
                          <p className="text-xs text-gray-500 mb-2">{branch.address_text}</p>
                        )}
                        {branch.contact_phone && (
                          <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <Phone className="w-3 h-3" />
                            <span>{branch.contact_phone}</span>
                          </div>
                        )}
                      </div>
                      {branch.is_primary && (
                        <Badge className="bg-blue-500/20 text-blue-400 text-xs">Main</Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Popular Routes */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Our Routes</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {routes.slice(0, 6).map((route) => (
                <Link 
                  key={route.id}
                  to={createPageUrl("BusTrips", `from=${route.origin_city}&to=${route.destination_city}&operator=${operator.id}`)}
                >
                  <Card className="p-6 bg-white/5 border-white/10 hover:bg-white/[0.08] transition-all cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-lg font-bold text-white">{route.origin_city}</div>
                      </div>
                      <ArrowRight className="w-6 h-6 text-blue-400 mx-4" />
                      <div className="flex-1 text-right">
                        <div className="text-lg font-bold text-white">{route.destination_city}</div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Upcoming Trips */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Upcoming Trips</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {upcomingTrips.slice(0, 6).map((trip) => {
                const route = routes.find(r => r.id === trip.route_id);
                return (
                  <Link 
                    key={trip.id}
                    to={createPageUrl("BusTrips", `trip=${trip.id}`)}
                  >
                    <Card className="p-6 bg-white/5 border-white/10 hover:bg-white/[0.08] transition-all cursor-pointer">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="text-xl font-bold text-white mb-1">
                            {route?.origin_city} → {route?.destination_city}
                          </div>
                          <div className="flex items-center gap-2 text-gray-400">
                           <Calendar className="w-4 h-4" />
                           <span>{format(new Date(trip.departure_datetime), "dd/MM/yyyy 'at' HH:mm")}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-400">{trip.base_price_xaf.toLocaleString()} XAF</div>
                          <div className="text-xs text-gray-400">per seat</div>
                        </div>
                      </div>
                      <Badge className={
                        trip.trip_status === "scheduled" ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"
                      }>
                        {trip.trip_status}
                      </Badge>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}