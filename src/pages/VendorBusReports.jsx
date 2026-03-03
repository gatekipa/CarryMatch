import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, TrendingUp, DollarSign, Users, Percent } from "lucide-react";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths } from "date-fns";

export default function VendorBusReports() {
  const [user, setUser] = useState(null);
  const [dateRange, setDateRange] = useState("today");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: operator } = useQuery({
    queryKey: ['my-bus-operator', user?.email],
    queryFn: async () => {
      const ops = await base44.entities.BusOperator.filter({ created_by: user.email });
      return ops[0];
    },
    enabled: !!user
  });

  const getDateRangeFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case "today":
        return { $gte: startOfDay(now).toISOString(), $lte: endOfDay(now).toISOString() };
      case "yesterday":
        return { $gte: startOfDay(subDays(now, 1)).toISOString(), $lte: endOfDay(subDays(now, 1)).toISOString() };
      case "this_week":
        return { $gte: startOfWeek(now).toISOString(), $lte: endOfWeek(now).toISOString() };
      case "last_week":
        return { $gte: startOfWeek(subWeeks(now, 1)).toISOString(), $lte: endOfWeek(subWeeks(now, 1)).toISOString() };
      case "this_month":
        return { $gte: startOfMonth(now).toISOString(), $lte: endOfMonth(now).toISOString() };
      case "last_month":
        return { $gte: startOfMonth(subMonths(now, 1)).toISOString(), $lte: endOfMonth(subMonths(now, 1)).toISOString() };
      default:
        return { $gte: startOfDay(now).toISOString(), $lte: endOfDay(now).toISOString() };
    }
  };

  const { data: onlineOrders = [] } = useQuery({
    queryKey: ['report-online-orders', operator?.id, dateRange],
    queryFn: async () => {
      const trips = await base44.entities.Trip.filter({ operator_id: operator.id });
      const tripIds = trips.map(t => t.id);
      
      return await base44.entities.Order.filter({
        trip_id: { $in: tripIds },
        order_status: "paid",
        paid_at: getDateRangeFilter()
      });
    },
    enabled: !!operator
  });

  const { data: offlineSales = [] } = useQuery({
    queryKey: ['report-offline-sales', operator?.id, dateRange],
    queryFn: () => base44.entities.OfflineSale.filter({
      operator_id: operator.id,
      created_date: getDateRangeFilter()
    }),
    enabled: !!operator
  });

  const { data: trips = [] } = useQuery({
    queryKey: ['report-trips', operator?.id, dateRange],
    queryFn: () => base44.entities.Trip.filter({
      operator_id: operator.id,
      departure_datetime: getDateRangeFilter()
    }),
    enabled: !!operator
  });

  const { data: routes = [] } = useQuery({
    queryKey: ['report-routes', operator?.id],
    queryFn: () => base44.entities.BusRoute.filter({ operator_id: operator.id }),
    enabled: !!operator
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ['report-vehicles', operator?.id],
    queryFn: () => base44.entities.Vehicle.filter({ operator_id: operator.id }),
    enabled: !!operator
  });

  const calculateMetrics = () => {
    const onlineRevenue = onlineOrders.reduce((sum, order) => sum + (order.amount_xaf || 0), 0);
    const offlineRevenue = offlineSales.reduce((sum, sale) => sum + (sale.sale_price_xaf || 0), 0);
    const totalRevenue = onlineRevenue + offlineRevenue;

    const platformFees = onlineOrders.reduce((sum, order) => sum + (order.fee_xaf || 0), 0);
    const netRevenue = totalRevenue - platformFees;

    const totalTickets = onlineOrders.length + offlineSales.length;

    return {
      totalRevenue,
      onlineRevenue,
      offlineRevenue,
      platformFees,
      netRevenue,
      totalTickets,
      onlineTickets: onlineOrders.length,
      offlineTickets: offlineSales.length
    };
  };

  const calculateRouteBreakdown = () => {
    const routeStats = {};

    trips.forEach(trip => {
      const route = routes.find(r => r.id === trip.route_id);
      if (!route) return;

      const routeKey = `${route.origin_city} → ${route.destination_city}`;
      if (!routeStats[routeKey]) {
        routeStats[routeKey] = {
          trips: 0,
          revenue: 0,
          tickets: 0
        };
      }

      routeStats[routeKey].trips += 1;

      const tripOnlineOrders = onlineOrders.filter(o => o.trip_id === trip.id);
      const tripOfflineSales = offlineSales.filter(s => s.trip_id === trip.id);

      routeStats[routeKey].revenue += tripOnlineOrders.reduce((sum, o) => sum + o.amount_xaf, 0);
      routeStats[routeKey].revenue += tripOfflineSales.reduce((sum, s) => sum + s.sale_price_xaf, 0);
      routeStats[routeKey].tickets += tripOnlineOrders.length + tripOfflineSales.length;
    });

    return Object.entries(routeStats).map(([route, stats]) => ({
      route,
      ...stats
    }));
  };

  const calculateTripOccupancy = async () => {
    const occupancyData = [];

    for (const trip of trips) {
      const route = routes.find(r => r.id === trip.route_id);
      const vehicle = vehicles.find(v => v.id === trip.vehicle_id);

      const tripOnlineOrders = onlineOrders.filter(o => o.trip_id === trip.id);
      const tripOfflineSales = offlineSales.filter(s => s.trip_id === trip.id);
      const soldSeats = tripOnlineOrders.length + tripOfflineSales.length;

      const inventory = await base44.entities.TripSeatInventory.filter({ trip_id: trip.id });
      const totalSeats = inventory.length;
      const occupancy = totalSeats > 0 ? (soldSeats / totalSeats) * 100 : 0;

      occupancyData.push({
        tripId: trip.id,
        route: route ? `${route.origin_city} → ${route.destination_city}` : "Unknown",
        vehicle: vehicle?.nickname || "Unknown",
        departure: format(new Date(trip.departure_datetime), "MMM d, yyyy h:mm a"),
        soldSeats,
        totalSeats,
        occupancy: occupancy.toFixed(1)
      });
    }

    return occupancyData.sort((a, b) => new Date(b.departure) - new Date(a.departure));
  };

  const { data: occupancyData = [] } = useQuery({
    queryKey: ['trip-occupancy', trips.map(t => t.id)],
    queryFn: calculateTripOccupancy,
    enabled: trips.length > 0
  });

  const exportCSV = () => {
    const metrics = calculateMetrics();
    const routeBreakdown = calculateRouteBreakdown();

    let csv = "CarryMatch Bus Operator Report\n";
    csv += `Generated: ${format(new Date(), "MMM d, yyyy h:mm a")}\n`;
    csv += `Period: ${dateRange}\n\n`;

    csv += "Summary Metrics\n";
    csv += "Metric,Value\n";
    csv += `Total Revenue,${metrics.totalRevenue} XAF\n`;
    csv += `Online Revenue,${metrics.onlineRevenue} XAF\n`;
    csv += `Offline Revenue,${metrics.offlineRevenue} XAF\n`;
    csv += `Platform Fees,${metrics.platformFees} XAF\n`;
    csv += `Net Revenue,${metrics.netRevenue} XAF\n`;
    csv += `Total Tickets,${metrics.totalTickets}\n`;
    csv += `Online Tickets,${metrics.onlineTickets}\n`;
    csv += `Offline Tickets,${metrics.offlineTickets}\n\n`;

    csv += "Route Breakdown\n";
    csv += "Route,Trips,Revenue (XAF),Tickets\n";
    routeBreakdown.forEach(r => {
      csv += `"${r.route}",${r.trips},${r.revenue},${r.tickets}\n`;
    });

    csv += "\nTrip Occupancy\n";
    csv += "Route,Vehicle,Departure,Sold Seats,Total Seats,Occupancy %\n";
    occupancyData.forEach(t => {
      csv += `"${t.route}","${t.vehicle}","${t.departure}",${t.soldSeats},${t.totalSeats},${t.occupancy}%\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bus-report-${dateRange}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  if (!user || !operator) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const metrics = calculateMetrics();
  const routeBreakdown = calculateRouteBreakdown();

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Sales Reports</h1>
            <p className="text-gray-400">View your revenue and performance metrics</p>
          </div>
          <div className="flex gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="this_week">This Week</SelectItem>
                <SelectItem value="last_week">Last Week</SelectItem>
                <SelectItem value="this_month">This Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportCSV} variant="outline" className="border-white/10">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              <span className="text-gray-400 text-sm">Total Revenue</span>
            </div>
            <div className="text-3xl font-bold text-white">{metrics.totalRevenue.toLocaleString()} XAF</div>
          </Card>

          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <span className="text-gray-400 text-sm">Net Revenue</span>
            </div>
            <div className="text-3xl font-bold text-white">{metrics.netRevenue.toLocaleString()} XAF</div>
            <div className="text-xs text-gray-500 mt-1">After {metrics.platformFees.toLocaleString()} XAF fees</div>
          </Card>

          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-purple-400" />
              <span className="text-gray-400 text-sm">Tickets Sold</span>
            </div>
            <div className="text-3xl font-bold text-white">{metrics.totalTickets}</div>
            <div className="text-xs text-gray-500 mt-1">
              {metrics.onlineTickets} online, {metrics.offlineTickets} offline
            </div>
          </Card>

          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <Percent className="w-5 h-5 text-yellow-400" />
              <span className="text-gray-400 text-sm">Avg Occupancy</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {occupancyData.length > 0 
                ? (occupancyData.reduce((sum, t) => sum + parseFloat(t.occupancy), 0) / occupancyData.length).toFixed(1)
                : 0}%
            </div>
          </Card>
        </div>

        {/* Revenue Split */}
        <Card className="p-6 bg-white/5 border-white/10 mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Revenue Breakdown</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-gray-300">Online Sales</span>
              <span className="text-white font-bold">{metrics.onlineRevenue.toLocaleString()} XAF</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-gray-300">Counter Sales</span>
              <span className="text-white font-bold">{metrics.offlineRevenue.toLocaleString()} XAF</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/30">
              <span className="text-red-400">Platform Fees</span>
              <span className="text-red-400 font-bold">-{metrics.platformFees.toLocaleString()} XAF</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/30">
              <span className="text-green-400 font-semibold">Net to Operator</span>
              <span className="text-green-400 font-bold text-xl">{metrics.netRevenue.toLocaleString()} XAF</span>
            </div>
          </div>
        </Card>

        {/* Route Breakdown */}
        <Card className="p-6 bg-white/5 border-white/10 mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Sales by Route</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-2 text-gray-300 font-semibold">Route</th>
                  <th className="text-right py-3 px-2 text-gray-300 font-semibold">Trips</th>
                  <th className="text-right py-3 px-2 text-gray-300 font-semibold">Revenue (XAF)</th>
                  <th className="text-right py-3 px-2 text-gray-300 font-semibold">Tickets</th>
                </tr>
              </thead>
              <tbody>
                {routeBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-8 text-gray-500">No sales data for this period</td>
                  </tr>
                ) : (
                  routeBreakdown.map((route, index) => (
                    <tr key={index} className="border-b border-white/10">
                      <td className="py-3 px-2 text-white">{route.route}</td>
                      <td className="py-3 px-2 text-right text-gray-300">{route.trips}</td>
                      <td className="py-3 px-2 text-right text-green-400 font-semibold">{route.revenue.toLocaleString()}</td>
                      <td className="py-3 px-2 text-right text-gray-300">{route.tickets}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Trip Occupancy */}
        <Card className="p-6 bg-white/5 border-white/10">
          <h3 className="text-xl font-bold text-white mb-4">Trip Occupancy</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-2 text-gray-300 font-semibold">Route</th>
                  <th className="text-left py-3 px-2 text-gray-300 font-semibold">Vehicle</th>
                  <th className="text-left py-3 px-2 text-gray-300 font-semibold">Departure</th>
                  <th className="text-right py-3 px-2 text-gray-300 font-semibold">Sold</th>
                  <th className="text-right py-3 px-2 text-gray-300 font-semibold">Total</th>
                  <th className="text-right py-3 px-2 text-gray-300 font-semibold">Occupancy</th>
                </tr>
              </thead>
              <tbody>
                {occupancyData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-500">No trips in this period</td>
                  </tr>
                ) : (
                  occupancyData.map((trip, index) => (
                    <tr key={index} className="border-b border-white/10">
                      <td className="py-3 px-2 text-white">{trip.route}</td>
                      <td className="py-3 px-2 text-gray-300">{trip.vehicle}</td>
                      <td className="py-3 px-2 text-gray-400 text-xs">{trip.departure}</td>
                      <td className="py-3 px-2 text-right text-white">{trip.soldSeats}</td>
                      <td className="py-3 px-2 text-right text-gray-400">{trip.totalSeats}</td>
                      <td className="py-3 px-2 text-right">
                        <span className={`font-bold ${
                          parseFloat(trip.occupancy) >= 80 ? 'text-green-400' :
                          parseFloat(trip.occupancy) >= 50 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {trip.occupancy}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}