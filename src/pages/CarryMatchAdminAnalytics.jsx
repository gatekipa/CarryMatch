import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Building2,
  MapPin,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, LineChart, Line, PieChart as RePieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function CarryMatchAdminAnalytics() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(user => {
      if (user.role !== "admin") navigate(createPageUrl("Home"));
      setUser(user);
    }).catch(() => navigate(createPageUrl("CarryMatchAdminLogin")));
  }, [navigate]);

  const { data: vendors = [] } = useQuery({
    queryKey: ['admin-analytics-vendors'],
    queryFn: async () => await base44.entities.Vendor.list(),
    enabled: !!user
  });

  const { data: shipments = [] } = useQuery({
    queryKey: ['admin-analytics-shipments'],
    queryFn: async () => await base44.entities.Shipment.list("-created_date", 500),
    enabled: !!user
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['admin-analytics-payments'],
    queryFn: async () => await base44.entities.SubscriptionPayment.list("-created_date", 100),
    enabled: !!user
  });

  // Calculate metrics
  const metrics = {
    totalRevenue: shipments.reduce((sum, s) => sum + (s.total_amount || 0), 0),
    subscriptionRevenue: payments.filter(p => p.status === "APPROVED").reduce((sum, p) => sum + (p.amount || 0), 0),
    totalShipments: shipments.length,
    activeVendors: vendors.filter(v => v.status === "ACTIVE").length,
    avgShipmentValue: shipments.length > 0 ? shipments.reduce((sum, s) => sum + (s.total_amount || 0), 0) / shipments.length : 0,
    insuranceAdoption: shipments.length > 0 ? (shipments.filter(s => s.insurance_enabled).length / shipments.length) * 100 : 0
  };

  // Status distribution
  const statusData = [
    { name: "Delivered", value: shipments.filter(s => s.status === "DELIVERED").length, color: "#10b981" },
    { name: "In Transit", value: shipments.filter(s => ["SHIPPED", "IN_TRANSIT"].includes(s.status)).length, color: "#3b82f6" },
    { name: "Pending", value: shipments.filter(s => ["PENDING", "RECEIVED"].includes(s.status)).length, color: "#f59e0b" },
    { name: "Issues", value: shipments.filter(s => ["ON_HOLD", "DELAYED", "RETURNED"].includes(s.status)).length, color: "#ef4444" }
  ];

  // Vendor plan distribution
  const planData = [
    { name: "Starter", value: vendors.filter(v => v.current_plan === "STARTER").length, color: "#8b5cf6" },
    { name: "Growth", value: vendors.filter(v => v.current_plan === "GROWTH").length, color: "#3b82f6" },
    { name: "Pro", value: vendors.filter(v => v.current_plan === "PRO").length, color: "#10b981" },
    { name: "Enterprise", value: vendors.filter(v => v.current_plan === "ENTERPRISE").length, color: "#f59e0b" }
  ];

  // Monthly revenue trend (last 6 months)
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const month = date.toLocaleString('default', { month: 'short' });
    const shipmentsInMonth = shipments.filter(s => {
      const created = new Date(s.created_date);
      return created.getMonth() === date.getMonth() && created.getFullYear() === date.getFullYear();
    });
    monthlyData.push({
      month,
      revenue: shipmentsInMonth.reduce((sum, s) => sum + (s.total_amount || 0), 0),
      shipments: shipmentsInMonth.length
    });
  }

  // Top routes
  const routeCounts = {};
  shipments.forEach(s => {
    const route = `${s.sender_city} → ${s.recipient_city}`;
    routeCounts[route] = (routeCounts[route] || 0) + 1;
  });
  const topRoutes = Object.entries(routeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([route, count]) => ({ route, count }));

  if (!user) return null;

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">System Analytics</h1>
              <p className="text-gray-400">Platform-wide metrics and insights</p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate(createPageUrl("CarryMatchAdminDashboard"))}
              className="border-white/10 text-gray-300"
            >
              Back to Dashboard
            </Button>
          </div>

          {/* Key Metrics */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="p-6 bg-white/5 border-white/10">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-8 h-8 text-green-400" />
                <Badge className="bg-green-500/20 text-green-300">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Revenue
                </Badge>
              </div>
              <p className="text-2xl font-bold text-white">${(metrics.totalRevenue / 1000).toFixed(1)}k</p>
              <p className="text-sm text-gray-400">Shipping revenue</p>
            </Card>

            <Card className="p-6 bg-white/5 border-white/10">
              <div className="flex items-center justify-between mb-2">
                <Package className="w-8 h-8 text-blue-400" />
                <Badge className="bg-blue-500/20 text-blue-300">
                  {metrics.totalShipments}
                </Badge>
              </div>
              <p className="text-2xl font-bold text-white">{metrics.totalShipments}</p>
              <p className="text-sm text-gray-400">Total shipments</p>
            </Card>

            <Card className="p-6 bg-white/5 border-white/10">
              <div className="flex items-center justify-between mb-2">
                <Building2 className="w-8 h-8 text-purple-400" />
                <Badge className="bg-purple-500/20 text-purple-300">
                  {metrics.activeVendors}
                </Badge>
              </div>
              <p className="text-2xl font-bold text-white">{metrics.activeVendors}</p>
              <p className="text-sm text-gray-400">Active vendors</p>
            </Card>

            <Card className="p-6 bg-white/5 border-white/10">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-8 h-8 text-orange-400" />
                <Badge className="bg-orange-500/20 text-orange-300">
                  ${metrics.avgShipmentValue.toFixed(0)}
                </Badge>
              </div>
              <p className="text-2xl font-bold text-white">${metrics.avgShipmentValue.toFixed(2)}</p>
              <p className="text-sm text-gray-400">Avg shipment value</p>
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* Revenue Trend */}
            <Card className="p-6 bg-white/5 border-white/10">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-400" />
                Revenue Trend (Last 6 Months)
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#f3f4f6' }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Shipment Volume */}
            <Card className="p-6 bg-white/5 border-white/10">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-400" />
                Shipment Volume (Last 6 Months)
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#f3f4f6' }}
                  />
                  <Bar dataKey="shipments" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* Status Distribution */}
            <Card className="p-6 bg-white/5 border-white/10">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-purple-400" />
                Shipment Status Distribution
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <RePieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            </Card>

            {/* Plan Distribution */}
            <Card className="p-6 bg-white/5 border-white/10">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-orange-400" />
                Vendor Plan Distribution
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <RePieChart>
                  <Pie
                    data={planData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {planData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Top Routes */}
          <Card className="p-6 bg-white/5 border-white/10">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-400" />
              Top Shipping Routes
            </h3>
            <div className="space-y-3">
              {topRoutes.map((route, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-[#9EFF00]/20 text-[#9EFF00]">#{idx + 1}</Badge>
                    <span className="text-white font-medium">{route.route}</span>
                  </div>
                  <Badge className="bg-blue-500/20 text-blue-300">
                    {route.count} shipments
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}