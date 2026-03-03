import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, BarChart3, Package, TrendingUp, Clock, AlertCircle, DollarSign, Calendar, MapPin, Star, Zap, Plane, Ship, Truck, Bus, Filter, X, Download } from "lucide-react";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { PlanGate } from "@/components/vendor/PlanLimitEnforcer";

export default function VendorAnalytics() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [vendorStaff, setVendorStaff] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [timeRange, setTimeRange] = useState("30");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedMode, setSelectedMode] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => navigate(createPageUrl("PartnerLogin")));
  }, []);

  useEffect(() => {
    if (user) {
      base44.entities.VendorStaff.filter({ email: user.email, status: "ACTIVE" })
        .then(staff => {
          if (staff[0]) {
            setVendorStaff(staff[0]);
            return base44.entities.Vendor.filter({ id: staff[0].vendor_id });
          }
        })
        .then(vendors => {
          if (vendors) {
            setVendor(vendors?.[0]);
          }
        });
    }
  }, [user]);

  const { data: branches = [] } = useQuery({
    queryKey: ['vendor-branches', vendor?.id],
    queryFn: async () => {
      if (!vendor) return [];
      return await base44.entities.Branch.filter({ vendor_id: vendor.id, active: true });
    },
    enabled: !!vendor,
    staleTime: 10 * 60 * 1000
  });

  const { data: allShipments = [] } = useQuery({
    queryKey: ['analytics-shipments', vendor?.id],
    queryFn: async () => {
      return await base44.entities.Shipment.filter({ vendor_id: vendor.id }, '-created_date', 1000);
    },
    enabled: !!vendor
  });

  // Apply filters
  const shipments = React.useMemo(() => {
    return allShipments.filter(s => {
      // Date range filter
      let matchDate = true;
      if (dateFrom || dateTo || timeRange !== "all") {
        const shipmentDate = new Date(s.created_date);
        
        if (timeRange !== "all") {
          const days = parseInt(timeRange);
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - days);
          matchDate = shipmentDate >= startDate;
        }
        
        if (dateFrom) {
          matchDate = matchDate && shipmentDate >= new Date(dateFrom);
        }
        
        if (dateTo) {
          const endDate = new Date(dateTo);
          endDate.setHours(23, 59, 59, 999);
          matchDate = matchDate && shipmentDate <= endDate;
        }
      }

      // Branch filter
      const matchBranch = selectedBranch === "all" || s.branch_id === selectedBranch;

      // Mode filter
      const matchMode = selectedMode === "all" || s.mode === selectedMode;

      return matchDate && matchBranch && matchMode;
    });
  }, [allShipments, dateFrom, dateTo, timeRange, selectedBranch, selectedMode]);

  const analytics = React.useMemo(() => {
    if (!shipments.length) return null;

    const totalShipments = shipments.length;
    const deliveredShipments = shipments.filter(s => s.status === 'DELIVERED');
    const delayedShipments = shipments.filter(s => s.status === 'DELAYED');
    const inTransitShipments = shipments.filter(s => ['IN_TRANSIT', 'SHIPPED', 'ARRIVED'].includes(s.status));

    // Delivery Success Metrics
    const onTimeShipments = deliveredShipments.filter(s => {
      if (!s.estimated_delivery_date || !s.delivered_at) return false;
      return new Date(s.delivered_at) <= new Date(s.estimated_delivery_date);
    });
    const onTimeRate = deliveredShipments.length > 0 ? (onTimeShipments.length / deliveredShipments.length) * 100 : 0;
    const successRate = totalShipments > 0 ? (deliveredShipments.length / totalShipments) * 100 : 0;

    // Transit Time Analysis
    const transitTimes = deliveredShipments.filter(s => s.created_date && s.delivered_at).map(s => {
      const created = new Date(s.created_date);
      const delivered = new Date(s.delivered_at);
      return (delivered - created) / (1000 * 60 * 60 * 24);
    });
    const avgDeliveryTime = transitTimes.length > 0 ? transitTimes.reduce((a, b) => a + b, 0) / transitTimes.length : 0;

    // Revenue Analysis
    const totalRevenue = shipments.reduce((sum, s) => sum + (s.total_amount || 0), 0);
    const avgRevenue = totalShipments > 0 ? totalRevenue / totalShipments : 0;

    // Revenue by Mode
    const revenueByMode = shipments.reduce((acc, s) => {
      const mode = s.mode || 'OTHER';
      if (!acc[mode]) acc[mode] = { mode, revenue: 0, count: 0 };
      acc[mode].revenue += s.total_amount || 0;
      acc[mode].count++;
      return acc;
    }, {});
    const modeRevenueData = Object.values(revenueByMode).map(m => ({
      name: m.mode,
      revenue: parseFloat(m.revenue.toFixed(2)),
      avgPerShipment: parseFloat((m.revenue / m.count).toFixed(2)),
      count: m.count
    }));

    // Popular Routes Analysis
    const routesMap = shipments.reduce((acc, s) => {
      const route = `${s.sender_city || 'Unknown'} → ${s.recipient_city || 'Unknown'}`;
      if (!acc[route]) acc[route] = { route, count: 0, revenue: 0 };
      acc[route].count++;
      acc[route].revenue += s.total_amount || 0;
      return acc;
    }, {});
    const popularRoutes = Object.values(routesMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Customer Ratings (simulated - would need actual rating entity)
    const ratingsData = shipments
      .filter(s => s.customer_rating)
      .reduce((acc, s) => {
        const rating = Math.round(s.customer_rating);
        if (!acc[rating]) acc[rating] = 0;
        acc[rating]++;
        return acc;
      }, {});
    const ratingChartData = [1, 2, 3, 4, 5].map(star => ({
      star: `${star}⭐`,
      count: ratingsData[star] || 0
    }));
    const avgRating = shipments.filter(s => s.customer_rating).length > 0
      ? shipments.filter(s => s.customer_rating).reduce((sum, s) => sum + s.customer_rating, 0) / shipments.filter(s => s.customer_rating).length
      : 0;

    // Daily Trends
    const dailyData = shipments.reduce((acc, s) => {
      const date = new Date(s.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!acc[date]) acc[date] = { date, shipments: 0, delivered: 0, delayed: 0, revenue: 0 };
      acc[date].shipments++;
      acc[date].revenue += s.total_amount || 0;
      if (s.status === 'DELIVERED') acc[date].delivered++;
      if (s.status === 'DELAYED') acc[date].delayed++;
      return acc;
    }, {});

    // Status Distribution
    const statusData = [
      { name: 'Delivered', value: deliveredShipments.length, color: '#22c55e' },
      { name: 'In Transit', value: inTransitShipments.length, color: '#3b82f6' },
      { name: 'Delayed', value: delayedShipments.length, color: '#f59e0b' },
      { name: 'Other', value: totalShipments - deliveredShipments.length - inTransitShipments.length - delayedShipments.length, color: '#6b7280' }
    ];

    // Operational Efficiency
    const shipmentsPerDay = totalShipments / Math.max(1, Object.keys(dailyData).length);
    const revenuePerDay = totalRevenue / Math.max(1, Object.keys(dailyData).length);
    const utilizationRate = deliveredShipments.length > 0 ? ((deliveredShipments.length + inTransitShipments.length) / totalShipments) * 100 : 0;

    return {
      totalShipments,
      onTimeRate: onTimeRate.toFixed(1),
      successRate: successRate.toFixed(1),
      avgDeliveryTime: avgDeliveryTime.toFixed(1),
      delayedShipments: delayedShipments.length,
      deliveredShipments: deliveredShipments.length,
      totalRevenue: totalRevenue.toFixed(2),
      avgRevenue: avgRevenue.toFixed(2),
      avgRating: avgRating.toFixed(1),
      shipmentsPerDay: shipmentsPerDay.toFixed(1),
      revenuePerDay: revenuePerDay.toFixed(2),
      utilizationRate: utilizationRate.toFixed(1),
      dailyChartData: Object.values(dailyData).slice(-30),
      statusData,
      modeRevenueData,
      popularRoutes,
      ratingChartData
    };
  }, [shipments]);

  if (authChecked && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center max-w-md">
          <h3 className="text-xl font-bold text-white mb-2">Sign In Required</h3>
          <p className="text-gray-400 text-sm mb-5">Sign in with your vendor account to access this page.</p>
          <button onClick={() => base44.auth.redirectToLogin()} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (!user || !vendorStaff || !vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  const exportToCSV = () => {
    if (!shipments.length) {
      toast.error('No shipments to export');
      return;
    }

    const exportData = shipments.map(s => ({
      'Tracking Code': s.tracking_code || '',
      'Sender Name': s.sender_name || '',
      'Sender City': s.sender_city || '',
      'Recipient Name': s.recipient_name || '',
      'Recipient City': s.recipient_city || '',
      'Mode': s.mode || '',
      'Status': s.status || '',
      'Weight (kg)': s.weight_kg || '',
      'Amount': s.total_amount || 0,
      'Insurance': s.insurance_amount || 0,
      'Created Date': new Date(s.created_date).toLocaleString(),
      'Est. Delivery': s.estimated_delivery_date ? new Date(s.estimated_delivery_date).toLocaleDateString() : '',
      'Delivered At': s.delivered_at ? new Date(s.delivered_at).toLocaleString() : '',
      'Rating': s.customer_rating || '',
      'Branch': branches.find(b => b.id === s.branch_id)?.name || 'N/A'
    }));

    const headers = Object.keys(exportData[0]);
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${vendor.display_name || 'vendor'}-shipments-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    toast.success(`${shipments.length} shipments exported successfully`);
  };

  const modeIcons = {
    AIR: Plane,
    SEA: Ship,
    ROAD: Truck,
    BUS: Bus,
    RAIL: Truck
  };

  return (
    <PlanGate vendor={vendor} feature="analytics" featureLabel="Analytics Dashboard">
    <div className="min-h-screen py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(createPageUrl("VendorDashboard"))} className="text-gray-300 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-[#9EFF00]" />
              Analytics Dashboard
            </h1>
            <Button
              onClick={exportToCSV}
              className="bg-[#9EFF00] text-[#1A1A1A] hover:bg-[#7ACC00]"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Filters */}
          <Card className="p-4 bg-white/5 border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="text-gray-300"
              >
                {showFilters ? "Hide" : "Show"} Advanced
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label className="text-gray-300 mb-2 block text-sm">Time Range</Label>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="365">Last year</SelectItem>
                    <SelectItem value="all">All time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-300 mb-2 block text-sm">Branch</Label>
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {branches.map(branch => (
                      <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-gray-300 mb-2 block text-sm">Mode</Label>
                <Select value={selectedMode} onValueChange={setSelectedMode}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Modes</SelectItem>
                    <SelectItem value="AIR">Air</SelectItem>
                    <SelectItem value="SEA">Sea</SelectItem>
                    <SelectItem value="ROAD">Road</SelectItem>
                    <SelectItem value="BUS">Bus</SelectItem>
                    <SelectItem value="RAIL">Rail</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTimeRange("30");
                    setSelectedBranch("all");
                    setSelectedMode("all");
                    setDateFrom("");
                    setDateTo("");
                  }}
                  className="w-full border-white/10 text-gray-300 hover:text-white"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/10"
                >
                  <div>
                    <Label className="text-gray-300 mb-2 block text-sm">Date From</Label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300 mb-2 block text-sm">Date To</Label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>

        {analytics && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            
            {/* Key Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
                <div className="flex items-center justify-between mb-2">
                  <Package className="w-8 h-8 text-blue-400" />
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">{analytics.totalShipments}</h3>
                <p className="text-sm text-gray-400">Total Shipments</p>
                <p className="text-xs text-blue-300 mt-1">{analytics.shipmentsPerDay}/day avg</p>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-8 h-8 text-green-400" />
                  <Badge className="bg-green-500/20 text-green-300 text-xs">{analytics.successRate}%</Badge>
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">{analytics.onTimeRate}%</h3>
                <p className="text-sm text-gray-400">On-Time Delivery</p>
                <p className="text-xs text-green-300 mt-1">{analytics.deliveredShipments} delivered</p>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="w-8 h-8 text-purple-400" />
                  <Zap className="w-4 h-4 text-purple-400" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">{analytics.avgDeliveryTime}</h3>
                <p className="text-sm text-gray-400">Avg Delivery Days</p>
                <p className="text-xs text-purple-300 mt-1">{analytics.utilizationRate}% utilization</p>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-500/20">
                <div className="flex items-center justify-between mb-2">
                  <Star className="w-8 h-8 text-yellow-400" />
                  <Badge className="bg-yellow-500/20 text-yellow-300 text-xs">{analytics.avgRating}⭐</Badge>
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">{analytics.avgRating}</h3>
                <p className="text-sm text-gray-400">Customer Rating</p>
                <p className="text-xs text-yellow-300 mt-1">Average score</p>
              </Card>
            </div>

            {/* Revenue Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 bg-white/5 border-white/10">
                <DollarSign className="w-6 h-6 text-[#9EFF00] mb-2" />
                <h3 className="text-2xl font-bold text-white mb-1">${analytics.totalRevenue}</h3>
                <p className="text-sm text-gray-400">Total Revenue</p>
                <p className="text-xs text-[#9EFF00] mt-1">${analytics.revenuePerDay}/day</p>
              </Card>

              <Card className="p-4 bg-white/5 border-white/10">
                <DollarSign className="w-6 h-6 text-blue-400 mb-2" />
                <h3 className="text-2xl font-bold text-white mb-1">${analytics.avgRevenue}</h3>
                <p className="text-sm text-gray-400">Avg per Shipment</p>
              </Card>

              <Card className="p-4 bg-white/5 border-white/10">
                <AlertCircle className="w-6 h-6 text-orange-400 mb-2" />
                <h3 className="text-2xl font-bold text-white mb-1">{analytics.delayedShipments}</h3>
                <p className="text-sm text-gray-400">Delayed Shipments</p>
                <p className="text-xs text-orange-300 mt-1">{((analytics.delayedShipments / analytics.totalShipments) * 100).toFixed(1)}% of total</p>
              </Card>
            </div>

            {/* Comprehensive Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
              
              {/* Volume & Revenue Trends */}
              <Card className="p-6 bg-white/5 border-white/10">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#9EFF00]" />
                  Volume & Revenue Trends
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.dailyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                    <XAxis dataKey="date" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" stroke="#9ca3af" />
                    <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #ffffff20' }} />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="shipments" stroke="#9EFF00" strokeWidth={2} dot={{ r: 3 }} />
                    <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              {/* Status Distribution */}
              <Card className="p-6 bg-white/5 border-white/10">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-400" />
                  Status Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics.statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #ffffff20' }} />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              {/* Revenue by Shipment Type */}
              <Card className="p-6 bg-white/5 border-white/10">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  Revenue by Mode
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.modeRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #ffffff20' }} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#9EFF00" name="Total Revenue" />
                    <Bar dataKey="avgPerShipment" fill="#3b82f6" name="Avg/Shipment" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* Customer Ratings */}
              <Card className="p-6 bg-white/5 border-white/10">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  Customer Ratings
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.ratingChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                    <XAxis type="number" stroke="#9ca3af" />
                    <YAxis dataKey="star" type="category" stroke="#9ca3af" />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #ffffff20' }} />
                    <Bar dataKey="count" fill="#fbbf24" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* Popular Routes */}
            <Card className="p-6 bg-white/5 border-white/10">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-400" />
                Top 10 Popular Routes
              </h3>
              <div className="space-y-3">
                {analytics.popularRoutes.map((route, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-[#9EFF00]/20 text-[#9EFF00]">#{index + 1}</Badge>
                      <span className="text-white font-medium">{route.route}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-400">{route.count} shipments</span>
                      <span className="text-green-400 font-semibold">${route.revenue.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Operational Efficiency Indicators */}
            <div className="grid lg:grid-cols-4 gap-4">
              <Card className="p-4 bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 border-cyan-500/20">
                <Zap className="w-6 h-6 text-cyan-400 mb-2" />
                <h3 className="text-xl font-bold text-white">{analytics.shipmentsPerDay}</h3>
                <p className="text-sm text-gray-400">Shipments/Day</p>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border-emerald-500/20">
                <DollarSign className="w-6 h-6 text-emerald-400 mb-2" />
                <h3 className="text-xl font-bold text-white">${analytics.revenuePerDay}</h3>
                <p className="text-sm text-gray-400">Revenue/Day</p>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-violet-500/10 to-violet-600/10 border-violet-500/20">
                <TrendingUp className="w-6 h-6 text-violet-400 mb-2" />
                <h3 className="text-xl font-bold text-white">{analytics.utilizationRate}%</h3>
                <p className="text-sm text-gray-400">Utilization Rate</p>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-rose-500/10 to-rose-600/10 border-rose-500/20">
                <Clock className="w-6 h-6 text-rose-400 mb-2" />
                <h3 className="text-xl font-bold text-white">{analytics.successRate}%</h3>
                <p className="text-sm text-gray-400">Success Rate</p>
              </Card>
            </div>
          </motion.div>
        )}
      </div>
    </div>
    </PlanGate>
  );
}