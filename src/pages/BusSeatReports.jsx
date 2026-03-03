import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, AlertCircle, BarChart3, Users, Globe, Building } from "lucide-react";
import { format, subDays } from "date-fns";

export default function BusSeatReports() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [dateRange, setDateRange] = useState("7days");

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

  const getDateFilter = () => {
    const now = new Date();
    const filters = {
      '7days': subDays(now, 7),
      '30days': subDays(now, 30),
      '90days': subDays(now, 90)
    };
    return filters[dateRange] || filters['7days'];
  };

  const { data: trips = [] } = useQuery({
    queryKey: ['report-trips', operator?.id, dateRange],
    queryFn: async () => {
      return await base44.entities.Trip.filter({
        operator_id: operator.id,
        departure_datetime: { $gte: getDateFilter().toISOString() }
      });
    },
    enabled: !!operator
  });

  const { data: branches = [] } = useQuery({
    queryKey: ['report-branches', operator?.id],
    queryFn: () => base44.entities.OperatorBranch.filter({ operator_id: operator.id }),
    enabled: !!operator
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ['report-inventory', trips.map(t => t.id)],
    queryFn: async () => {
      if (!trips.length) return [];
      return await base44.entities.TripSeatInventory.filter({
        trip_id: { $in: trips.map(t => t.id) }
      });
    },
    enabled: trips.length > 0
  });

  const { data: rebalances = [] } = useQuery({
    queryKey: ['report-rebalances', operator?.id, dateRange],
    queryFn: async () => {
      return await base44.entities.SeatRebalanceEvent.filter({
        operator_id: operator.id,
        created_date: { $gte: getDateFilter().toISOString() }
      });
    },
    enabled: !!operator
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ['report-tickets', trips.map(t => t.id)],
    queryFn: async () => {
      if (!trips.length) return [];
      const orders = await base44.entities.Order.filter({
        trip_id: { $in: trips.map(t => t.id) }
      });
      if (!orders.length) return [];
      return await base44.entities.Ticket.filter({
        order_id: { $in: orders.map(o => o.id) }
      });
    },
    enabled: trips.length > 0
  });

  const { data: offlineSales = [] } = useQuery({
    queryKey: ['report-offline-sales', trips.map(t => t.id)],
    queryFn: async () => {
      if (!trips.length) return [];
      return await base44.entities.OfflineSale.filter({
        trip_id: { $in: trips.map(t => t.id) }
      });
    },
    enabled: trips.length > 0
  });

  // Calculate metrics
  const totalSeats = inventory.length;
  const soldOnline = inventory.filter(s => s.seat_status === 'sold_online').length;
  const soldOffline = inventory.filter(s => s.seat_status === 'sold_offline').length;
  const totalSold = soldOnline + soldOffline;
  const utilization = totalSeats > 0 ? ((totalSold / totalSeats) * 100).toFixed(1) : 0;

  const onlineConversion = soldOnline > 0 ? ((soldOnline / (soldOnline + soldOffline)) * 100).toFixed(1) : 0;
  const totalRebalanced = rebalances.reduce((sum, r) => sum + r.seats_moved_count, 0);

  const noShows = tickets.filter(t => t.checkin_status === 'not_checked_in' && 
    trips.find(tr => tr.id === t.trip_id && tr.trip_status === 'departed')
  ).length;
  const noShowRate = tickets.length > 0 ? ((noShows / tickets.length) * 100).toFixed(1) : 0;

  // Branch performance
  const branchMetrics = branches.map(branch => {
    const branchSales = inventory.filter(s => s.sold_by_branch_id === branch.id);
    const branchRevenue = offlineSales
      .filter(s => s.trip_id && branchSales.find(bs => bs.trip_id === s.trip_id))
      .reduce((sum, s) => sum + s.sale_price_xaf, 0);

    return {
      branch,
      sales: branchSales.length,
      revenue: branchRevenue,
      utilization: branchSales.length > 0 ? ((branchSales.length / totalSeats) * 100).toFixed(1) : 0
    };
  }).sort((a, b) => b.sales - a.sales);

  const avgBranchSales = branchMetrics.length > 0 
    ? branchMetrics.reduce((sum, m) => sum + m.sales, 0) / branchMetrics.length 
    : 0;
  const underperformingBranches = branchMetrics.filter(m => m.sales < avgBranchSales * 0.5);

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
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h3 className="text-2xl font-bold text-white">Loading...</h3>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Seat Allocation Reports</h1>
            <p className="text-gray-400">Performance insights & optimization</p>
          </div>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40 bg-white/5 border-white/10 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <span className="text-gray-400">Overall Utilization</span>
            </div>
            <div className="text-3xl font-bold text-white">{utilization}%</div>
            <p className="text-xs text-gray-500 mt-1">{totalSold} / {totalSeats} seats</p>
          </Card>

          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <Globe className="w-5 h-5 text-green-400" />
              <span className="text-gray-400">Online Conversion</span>
            </div>
            <div className="text-3xl font-bold text-white">{onlineConversion}%</div>
            <p className="text-xs text-gray-500 mt-1">{soldOnline} online / {totalSold} total</p>
          </Card>

          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <span className="text-gray-400">Seats Rebalanced</span>
            </div>
            <div className="text-3xl font-bold text-white">{totalRebalanced}</div>
            <p className="text-xs text-gray-500 mt-1">{rebalances.length} events</p>
          </Card>

          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-gray-400">No-Show Rate</span>
            </div>
            <div className="text-3xl font-bold text-white">{noShowRate}%</div>
            <p className="text-xs text-gray-500 mt-1">{noShows} no-shows</p>
          </Card>
        </div>

        {/* Branch Performance */}
        <Card className="p-6 bg-white/5 border-white/10 mb-8">
          <h2 className="text-xl font-bold text-white mb-6">Branch Performance</h2>
          <div className="space-y-3">
            {branchMetrics.map((metric, idx) => (
              <div key={metric.branch.id} className="flex items-center gap-4 p-4 rounded-lg bg-white/5">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <span className="text-blue-400 font-bold text-sm">#{idx + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold">{metric.branch.branch_name}</p>
                    <p className="text-xs text-gray-400">{metric.branch.city}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">{metric.sales} sales</p>
                    <p className="text-xs text-gray-400">{metric.revenue.toLocaleString()} XAF</p>
                  </div>
                  <div className="w-24">
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-green-500"
                        style={{ width: `${Math.min(metric.utilization, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 text-center mt-1">{metric.utilization}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Insights */}
        {underperformingBranches.length > 0 && (
          <Card className="p-6 bg-yellow-500/10 border-yellow-500/30">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-2">Performance Insights</h3>
                <p className="text-sm text-gray-300 mb-3">
                  {underperformingBranches.length} branch{underperformingBranches.length > 1 ? 'es' : ''} selling below 50% of average:
                </p>
                <div className="space-y-2">
                  {underperformingBranches.map(m => (
                    <div key={m.branch.id} className="flex items-center justify-between text-sm">
                      <span className="text-white">{m.branch.branch_name}</span>
                      <Badge className="bg-orange-500/20 text-orange-400">
                        {m.sales} sales ({m.utilization}%)
                      </Badge>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-4">
                  💡 Suggestion: Consider reducing default allocations for these branches and increasing online pool.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}