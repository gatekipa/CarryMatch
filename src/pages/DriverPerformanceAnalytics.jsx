import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Clock, AlertTriangle, MapPin, Award, Users } from "lucide-react";
import { format, differenceInMinutes } from "date-fns";

export default function DriverPerformanceAnalytics() {
  const [user, setUser] = useState(null);
  const [selectedDriverId, setSelectedDriverId] = useState("all");
  const [dateRange, setDateRange] = useState("30");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: operator } = useQuery({
    queryKey: ['perf-operator', user?.email],
    queryFn: async () => {
      const ops = await base44.entities.BusOperator.filter({ created_by: user.email });
      return ops[0];
    },
    enabled: !!user
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['perf-drivers', operator?.id],
    queryFn: () => base44.entities.Driver.filter({ operator_id: operator.id }),
    enabled: !!operator
  });

  const { data: trips = [] } = useQuery({
    queryKey: ['perf-trips', operator?.id, dateRange],
    queryFn: async () => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(dateRange));
      
      return await base44.entities.Trip.filter({
        operator_id: operator.id,
        departure_datetime: { $gte: cutoffDate.toISOString() },
        trip_status: { $in: ["departed", "completed"] }
      });
    },
    enabled: !!operator
  });

  const { data: statusUpdates = [] } = useQuery({
    queryKey: ['perf-status-updates', trips.map(t => t.id)],
    queryFn: async () => {
      if (!trips.length) return [];
      return await base44.entities.TripStatusUpdate.filter({
        trip_id: { $in: trips.map(t => t.id) }
      });
    },
    enabled: trips.length > 0
  });

  const { data: locationUpdates = [] } = useQuery({
    queryKey: ['perf-location-updates', trips.map(t => t.id)],
    queryFn: async () => {
      if (!trips.length) return [];
      return await base44.entities.BusLocationUpdate.filter({
        trip_id: { $in: trips.map(t => t.id) }
      });
    },
    enabled: trips.length > 0
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ['perf-tickets', trips.map(t => t.id)],
    queryFn: async () => {
      if (!trips.length) return [];
      const orders = await base44.entities.Order.filter({
        trip_id: { $in: trips.map(t => t.id) },
        order_status: "paid"
      });
      return await base44.entities.Ticket.filter({
        order_id: { $in: orders.map(o => o.id) }
      });
    },
    enabled: trips.length > 0
  });

  // Calculate driver performance metrics
  const driverMetrics = drivers.map(driver => {
    const driverTrips = selectedDriverId === 'all' 
      ? trips.filter(t => t.driver_id === driver.id)
      : trips.filter(t => t.driver_id === selectedDriverId);

    if (driverTrips.length === 0) {
      return {
        driver,
        trips_count: 0,
        on_time_rate: 0,
        avg_delay: 0,
        delays_count: 0,
        location_share_rate: 0,
        checkin_efficiency: 0
      };
    }

    // On-time departures
    const departedUpdates = statusUpdates.filter(u => 
      driverTrips.map(t => t.id).includes(u.trip_id) && u.update_type === 'departed'
    );
    const onTimeCount = departedUpdates.filter(u => {
      const trip = driverTrips.find(t => t.id === u.trip_id);
      const scheduledTime = new Date(trip.departure_datetime);
      const actualTime = new Date(u.created_date);
      const delayMinutes = differenceInMinutes(actualTime, scheduledTime);
      return delayMinutes <= 10;
    }).length;
    const onTimeRate = departedUpdates.length > 0 ? (onTimeCount / departedUpdates.length) * 100 : 0;

    // Delays
    const delays = statusUpdates.filter(u => 
      driverTrips.map(t => t.id).includes(u.trip_id) && u.update_type === 'delayed'
    );
    const avgDelay = delays.length > 0 
      ? delays.reduce((sum, d) => sum + (d.delay_minutes || 0), 0) / delays.length 
      : 0;

    // Location sharing
    const driverLocations = locationUpdates.filter(l => 
      driverTrips.map(t => t.id).includes(l.trip_id)
    );
    const locationShareRate = driverTrips.length > 0 
      ? (driverLocations.length / (driverTrips.length * 10)) * 100 
      : 0;

    return {
      driver,
      trips_count: driverTrips.length,
      on_time_rate: Math.round(onTimeRate),
      avg_delay: Math.round(avgDelay),
      delays_count: delays.length,
      location_share_rate: Math.min(100, Math.round(locationShareRate)),
      checkin_efficiency: 0
    };
  }).filter(m => selectedDriverId === 'all' ? m.trips_count > 0 : m.driver.id === selectedDriverId);

  // Sort by performance score
  driverMetrics.sort((a, b) => {
    const scoreA = a.on_time_rate + a.location_share_rate - (a.avg_delay * 2);
    const scoreB = b.on_time_rate + b.location_share_rate - (b.avg_delay * 2);
    return scoreB - scoreA;
  });

  const topDrivers = driverMetrics.slice(0, 5);

  const chartData = driverMetrics.map(m => ({
    name: m.driver.full_name.split(' ')[0],
    onTime: m.on_time_rate,
    location: m.location_share_rate,
    trips: m.trips_count
  }));

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

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
            <h1 className="text-3xl font-bold text-white mb-2">Driver Performance</h1>
            <p className="text-gray-400">Track driver metrics and performance</p>
          </div>
          <div className="flex gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
              <SelectTrigger className="w-48 bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Drivers</SelectItem>
                {drivers.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Top Performers */}
        <Card className="p-6 bg-white/5 border-white/10 mb-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Award className="w-6 h-6 text-yellow-400" />
            Top Performers
          </h3>
          <div className="grid md:grid-cols-5 gap-4">
            {topDrivers.map((metric, index) => (
              <Card key={metric.driver.id} className="p-4 bg-white/5 border-white/10 text-center">
                <div className={`text-3xl font-bold mb-2 ${
                  index === 0 ? 'text-yellow-400' :
                  index === 1 ? 'text-gray-300' :
                  index === 2 ? 'text-orange-400' :
                  'text-gray-400'
                }`}>
                  #{index + 1}
                </div>
                <p className="text-white font-semibold text-sm mb-1">{metric.driver.full_name}</p>
                <p className="text-xs text-gray-400">{metric.trips_count} trips</p>
                <div className="mt-2 flex justify-center gap-1">
                  {metric.on_time_rate >= 90 && <Badge className="bg-green-500/20 text-green-400 text-xs">⏰</Badge>}
                  {metric.location_share_rate >= 80 && <Badge className="bg-blue-500/20 text-blue-400 text-xs">📍</Badge>}
                </div>
              </Card>
            ))}
          </div>
        </Card>

        {/* Metrics Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {driverMetrics.map(metric => {
            const avgOnTime = driverMetrics.reduce((sum, m) => sum + m.on_time_rate, 0) / driverMetrics.length;
            
            return (
              <Card key={metric.driver.id} className="p-6 bg-white/5 border-white/10">
                <h4 className="font-semibold text-white mb-4">{metric.driver.full_name}</h4>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">On-Time Rate</span>
                      <span className={`text-sm font-bold ${
                        metric.on_time_rate >= 90 ? 'text-green-400' :
                        metric.on_time_rate >= 70 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {metric.on_time_rate}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          metric.on_time_rate >= 90 ? 'bg-green-500' :
                          metric.on_time_rate >= 70 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${metric.on_time_rate}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">Location Sharing</span>
                      <span className={`text-sm font-bold ${
                        metric.location_share_rate >= 80 ? 'text-green-400' :
                        metric.location_share_rate >= 50 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {metric.location_share_rate}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          metric.location_share_rate >= 80 ? 'bg-green-500' :
                          metric.location_share_rate >= 50 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${metric.location_share_rate}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Trips</span>
                      <span className="text-white font-semibold">{metric.trips_count}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="text-gray-400">Delays</span>
                      <span className="text-orange-400 font-semibold">{metric.delays_count}</span>
                    </div>
                    {metric.avg_delay > 0 && (
                      <div className="flex items-center justify-between text-xs mt-1">
                        <span className="text-gray-400">Avg Delay</span>
                        <span className="text-orange-400 font-semibold">{metric.avg_delay} min</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6 bg-white/5 border-white/10">
            <h3 className="text-lg font-bold text-white mb-6">On-Time Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="onTime" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6 bg-white/5 border-white/10">
            <h3 className="text-lg font-bold text-white mb-6">Location Sharing Uptime</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="location" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Summary Stats */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="text-gray-400">Fleet Avg On-Time</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {driverMetrics.length > 0 
                ? Math.round(driverMetrics.reduce((sum, m) => sum + m.on_time_rate, 0) / driverMetrics.length)
                : 0}%
            </div>
          </Card>

          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              <span className="text-gray-400">Total Delays</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {driverMetrics.reduce((sum, m) => sum + m.delays_count, 0)}
            </div>
          </Card>

          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <MapPin className="w-5 h-5 text-blue-400" />
              <span className="text-gray-400">Avg Location Share</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {driverMetrics.length > 0 
                ? Math.round(driverMetrics.reduce((sum, m) => sum + m.location_share_rate, 0) / driverMetrics.length)
                : 0}%
            </div>
          </Card>

          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-purple-400" />
              <span className="text-gray-400">Active Drivers</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {drivers.filter(d => d.status === 'active').length}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}