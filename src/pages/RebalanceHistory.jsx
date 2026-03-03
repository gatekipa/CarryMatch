import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Calendar, TrendingUp, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function RebalanceHistory() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setAuthChecked(true); }).catch(() => { setUser(null); setAuthChecked(true); });
  }, []);

  const { data: operator } = useQuery({
    queryKey: ['my-bus-operator', user?.email],
    queryFn: async () => {
      const ops = await base44.entities.BusOperator.filter({ created_by: user.email });
      return ops[0];
    },
    enabled: !!user
  });

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['rebalance-events', operator?.id],
    queryFn: () => base44.entities.SeatRebalanceEvent.filter({ 
      operator_id: operator.id 
    }, "-created_date"),
    enabled: !!operator
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['branches-for-history', operator?.id],
    queryFn: () => base44.entities.OperatorBranch.filter({ operator_id: operator.id }),
    enabled: !!operator
  });

  const { data: trips = [] } = useQuery({
    queryKey: ['trips-for-history', operator?.id],
    queryFn: async () => {
      const tripIds = [...new Set(events.map(e => e.trip_id))];
      if (!tripIds.length) return [];
      return await base44.entities.Trip.filter({
        id: { $in: tripIds }
      });
    },
    enabled: !!operator && events.length > 0
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['routes-for-history', operator?.id],
    queryFn: async () => {
      const routeIds = [...new Set(trips.map(t => t.route_id))];
      if (!routeIds.length) return [];
      return await base44.entities.BusRoute.filter({
        id: { $in: routeIds }
      });
    },
    enabled: trips.length > 0
  });

  const getBranchName = (branchId) => {
    if (!branchId) return "Online Pool";
    const branch = branches.find(b => b.id === branchId);
    return branch ? `${branch.branch_name}, ${branch.city}` : "Unknown Branch";
  };

  const getTripInfo = (tripId) => {
    const trip = trips.find(t => t.id === tripId);
    if (!trip) return "Unknown Trip";
    const route = routes.find(r => r.id === trip.route_id);
    return route ? `${route.origin_city} → ${route.destination_city}` : "Unknown Route";
  };

  const totalSeatsRebalanced = events.reduce((sum, e) => sum + e.seats_moved_count, 0);
  const systemTriggered = events.filter(e => e.triggered_by === 'system').length;
  const adminTriggered = events.filter(e => e.triggered_by === 'admin').length;

  if (authChecked && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center max-w-md">
          <h3 className="text-xl font-bold text-white mb-2">Sign In Required</h3>
          <p className="text-gray-400 text-sm mb-5">Sign in to access this page.</p>
          <button onClick={() => base44.auth.redirectToLogin()} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (!user || !operator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-12 bg-white/5 border-white/10 text-center">
          <RefreshCw className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h3 className="text-2xl font-bold text-white">Loading...</h3>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Seat Rebalancing History</h1>
          <p className="text-gray-400">View all automatic and manual seat reallocations</p>
        </div>

        {/* Summary Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <RefreshCw className="w-5 h-5 text-blue-400" />
              <span className="text-gray-400">Total Events</span>
            </div>
            <div className="text-3xl font-bold text-white">{events.length}</div>
          </Card>

          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="text-gray-400">Seats Rebalanced</span>
            </div>
            <div className="text-3xl font-bold text-white">{totalSeatsRebalanced}</div>
          </Card>

          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-5 h-5 text-purple-400" />
              <span className="text-gray-400">Auto / Manual</span>
            </div>
            <div className="text-3xl font-bold text-white">{systemTriggered} / {adminTriggered}</div>
          </Card>
        </div>

        {/* Events List */}
        {isLoading ? (
          <Card className="p-12 bg-white/5 border-white/10 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
          </Card>
        ) : events.length === 0 ? (
          <Card className="p-12 bg-white/5 border-white/10 text-center">
            <RefreshCw className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-xl font-bold text-white mb-2">No Rebalance Events Yet</h3>
            <p className="text-gray-400">Seat reallocations will appear here when triggered</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <motion.div key={event.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="p-6 bg-white/5 border-white/10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      <RefreshCw className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-white">{getTripInfo(event.trip_id)}</h3>
                          <Badge className={
                            event.triggered_by === 'system' 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-purple-500/20 text-purple-400'
                          }>
                            {event.triggered_by === 'system' ? 'Automatic' : 'Manual'}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                          <span className="font-semibold text-blue-400">{getBranchName(event.from_branch_id)}</span>
                          <ArrowRight className="w-4 h-4" />
                          <span className="font-semibold text-green-400">{getBranchName(event.to_branch_id)}</span>
                          <Badge className="bg-orange-500/20 text-orange-400 ml-2">
                            {event.seats_moved_count} seat{event.seats_moved_count > 1 ? 's' : ''}
                          </Badge>
                        </div>

                        <p className="text-xs text-gray-400 mb-1">{event.reason}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(event.created_date), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}