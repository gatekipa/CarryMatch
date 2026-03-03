import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, Package, Clock, CheckCircle, AlertTriangle, Calendar } from "lucide-react";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ['#9EFF00', '#7ACC00', '#3b82f6', '#f59e0b', '#ef4444'];

export default function VendorPerformance() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [vendorStaff, setVendorStaff] = useState(null);
  const [vendor, setVendor] = useState(null);

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

  const { data: shipments = [] } = useQuery({
    queryKey: ['all-shipments', vendor?.id],
    queryFn: () => base44.entities.Shipment.filter({ vendor_id: vendor.id }),
    enabled: !!vendor
  });

  const metrics = React.useMemo(() => {
    if (!shipments.length) return null;

    const totalShipments = shipments.length;
    const deliveredShipments = shipments.filter(s => s.status === 'DELIVERED');
    const delayedShipments = shipments.filter(s => s.status === 'DELAYED');
    const onTimeShipments = deliveredShipments.filter(s => {
      if (!s.estimated_delivery_date || !s.delivered_at) return false;
      return new Date(s.delivered_at) <= new Date(s.estimated_delivery_date);
    });

    const onTimeRate = deliveredShipments.length > 0 ? (onTimeShipments.length / deliveredShipments.length) * 100 : 0;

    const transitTimes = deliveredShipments.filter(s => s.created_date && s.delivered_at).map(s => {
      const created = new Date(s.created_date);
      const delivered = new Date(s.delivered_at);
      return (delivered - created) / (1000 * 60 * 60 * 24);
    });
    const avgTransitTime = transitTimes.length > 0 ? transitTimes.reduce((a, b) => a + b, 0) / transitTimes.length : 0;

    const statusBreakdown = shipments.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {});

    const monthlyData = shipments.reduce((acc, s) => {
      const month = new Date(s.created_date).toLocaleString('default', { month: 'short' });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    return {
      totalShipments,
      deliveredShipments: deliveredShipments.length,
      delayedShipments: delayedShipments.length,
      onTimeRate: onTimeRate.toFixed(1),
      avgTransitTime: avgTransitTime.toFixed(1),
      statusBreakdown,
      monthlyData,
      successRate: ((deliveredShipments.length / totalShipments) * 100).toFixed(1)
    };
  }, [shipments]);

  const statusChartData = metrics ? Object.entries(metrics.statusBreakdown).map(([name, value]) => ({
    name: name.replace(/_/g, ' '),
    value
  })) : [];

  const monthlyChartData = metrics ? Object.entries(metrics.monthlyData).map(([name, value]) => ({
    name,
    shipments: value
  })) : [];

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

  return (
    <div className="min-h-screen py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Button variant="ghost" onClick={() => navigate(createPageUrl("VendorDashboard"))} className="mb-6 text-gray-300 hover:text-white">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-[#9EFF00]" />
            Performance Metrics
          </h1>
          <p className="text-gray-400">{vendor.display_name}</p>
        </div>

        {metrics && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6 bg-white/5 border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <Package className="w-8 h-8 text-blue-400" />
                  <Badge className="bg-blue-500/20 text-blue-300">Total</Badge>
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">{metrics.totalShipments}</h3>
                <p className="text-gray-400 text-sm">Total Shipments</p>
              </Card>

              <Card className="p-6 bg-white/5 border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                  <Badge className="bg-green-500/20 text-green-300">{metrics.onTimeRate}%</Badge>
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">{metrics.onTimeRate}%</h3>
                <p className="text-gray-400 text-sm">On-Time Delivery Rate</p>
              </Card>

              <Card className="p-6 bg-white/5 border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="w-8 h-8 text-purple-400" />
                  <Badge className="bg-purple-500/20 text-purple-300">Avg</Badge>
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">{metrics.avgTransitTime}</h3>
                <p className="text-gray-400 text-sm">Days Average Transit Time</p>
              </Card>

              <Card className="p-6 bg-white/5 border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <CheckCircle className="w-8 h-8 text-[#9EFF00]" />
                  <Badge className="bg-[#9EFF00]/20 text-[#9EFF00]">{metrics.successRate}%</Badge>
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">{metrics.deliveredShipments}</h3>
                <p className="text-gray-400 text-sm">Successful Deliveries</p>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-2 gap-6">
              
              {/* Status Breakdown Pie Chart */}
              <Card className="p-6 bg-white/5 border-white/10">
                <h3 className="text-xl font-bold text-white mb-4">Shipments by Status</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={statusChartData} cx="50%" cy="50%" labelLine={false} label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={100} fill="#8884d8" dataKey="value">
                      {statusChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              {/* Monthly Trend Line Chart */}
              <Card className="p-6 bg-white/5 border-white/10">
                <h3 className="text-xl font-bold text-white mb-4">Monthly Shipments Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #ffffff20' }} />
                    <Legend />
                    <Line type="monotone" dataKey="shipments" stroke="#9EFF00" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* Performance Insights */}
            <Card className="p-6 bg-white/5 border-white/10">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                Performance Insights
              </h3>
              <div className="space-y-3">
                {parseFloat(metrics.onTimeRate) >= 90 && (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="text-green-300 text-sm">✓ Excellent on-time delivery performance! Keep up the great work.</p>
                  </div>
                )}
                {parseFloat(metrics.onTimeRate) < 90 && parseFloat(metrics.onTimeRate) >= 70 && (
                  <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <p className="text-yellow-300 text-sm">⚠ Good performance, but there's room for improvement in on-time deliveries.</p>
                  </div>
                )}
                {parseFloat(metrics.onTimeRate) < 70 && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-red-300 text-sm">⚠ On-time delivery rate needs attention. Consider reviewing operational processes.</p>
                  </div>
                )}
                {metrics.delayedShipments > 0 && (
                  <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <p className="text-orange-300 text-sm">📦 {metrics.delayedShipments} delayed shipments need attention.</p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}