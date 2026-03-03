import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { TrendingUp, Users, DollarSign, Activity, Package, Bus, Truck } from "lucide-react";
import { motion } from "framer-motion";

const COLORS = ["#9EFF00", "#6366f1", "#06b6d4", "#f59e0b", "#ef4444", "#8b5cf6", "#10b981"];

function groupByMonth(items, dateField = "created_date") {
  const map = {};
  items.forEach(item => {
    const d = item[dateField];
    if (!d) return;
    const month = d.substring(0, 7); // "YYYY-MM"
    map[month] = (map[month] || 0) + 1;
  });
  return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12)
    .map(([month, count]) => ({ month: month.slice(5), count }));
}

function groupRevenueByMonth(orders) {
  const map = {};
  orders.filter(o => o.order_status === "confirmed").forEach(o => {
    const d = o.created_date;
    if (!d) return;
    const month = d.substring(0, 7);
    if (!map[month]) map[month] = { revenue: 0, fees: 0 };
    map[month].revenue += (o.amount_xaf || 0);
    map[month].fees += (o.fee_xaf || 0);
  });
  return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12)
    .map(([month, data]) => ({ month: month.slice(5), ...data }));
}

export default function AnalyticsSection({ data }) {
  const { users, trips, requests, matches, orders, disputes, vendors, busOperators, shipments } = data;
  const [period, setPeriod] = useState("12m");

  const totalRevenue = orders.filter(o => o.order_status === "confirmed").reduce((s, o) => s + (o.amount_xaf || 0), 0);
  const totalFees = orders.filter(o => o.order_status === "confirmed").reduce((s, o) => s + (o.fee_xaf || 0), 0);
  const verifiedUsers = users.filter(u => u.is_verified).length;
  const matchRate = requests.length > 0 ? ((matches.filter(m => m.status === "accepted").length / requests.length) * 100).toFixed(1) : 0;
  const disputeRate = (matches.length > 0 ? ((disputes.length / matches.length) * 100).toFixed(1) : 0);

  // Charts data
  const userGrowth = useMemo(() => groupByMonth(users), [users]);
  const revenueByMonth = useMemo(() => groupRevenueByMonth(orders), [orders]);
  const tripsByMonth = useMemo(() => groupByMonth(trips), [trips]);
  const matchesByMonth = useMemo(() => groupByMonth(matches), [matches]);

  // Trust score distribution
  const trustDistribution = useMemo(() => {
    const buckets = { "0-20": 0, "21-40": 0, "41-60": 0, "61-80": 0, "81-100": 0 };
    users.forEach(u => {
      const s = u.trust_score || 0;
      if (s <= 20) buckets["0-20"]++;
      else if (s <= 40) buckets["21-40"]++;
      else if (s <= 60) buckets["41-60"]++;
      else if (s <= 80) buckets["61-80"]++;
      else buckets["81-100"]++;
    });
    return Object.entries(buckets).map(([range, count]) => ({ range, count }));
  }, [users]);

  // Revenue by vertical (pie)
  const busRevenue = orders.filter(o => o.order_status === "confirmed").reduce((s, o) => s + (o.amount_xaf || 0), 0);
  const p2pRevenue = matches.filter(m => m.fee_amount).reduce((s, m) => s + (m.fee_amount || 0), 0);
  const cmlRevenue = shipments.filter(s => s.amount).reduce((s, sh) => s + (sh.amount || 0), 0);
  const revenuePie = [
    { name: "Bus Tickets", value: busRevenue },
    { name: "P2P Fees", value: p2pRevenue },
    { name: "CML Shipping", value: cmlRevenue },
  ].filter(d => d.value > 0);

  const kpis = [
    { label: "Total Revenue", value: `${totalRevenue.toLocaleString()} XAF`, icon: DollarSign, color: "text-[#9EFF00]" },
    { label: "Platform Fees", value: `${totalFees.toLocaleString()} XAF`, icon: TrendingUp, color: "text-blue-500" },
    { label: "Total Users", value: users.length, icon: Users, color: "text-purple-500", sub: `${verifiedUsers} verified` },
    { label: "Match Rate", value: `${matchRate}%`, icon: Activity, color: "text-orange-500", sub: `${disputeRate}% dispute rate` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Analytics</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Platform-wide metrics and performance</p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="p-4 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                <span className="text-xs text-gray-500 dark:text-gray-400">{kpi.label}</span>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{kpi.value}</p>
              {kpi.sub && <p className="text-xs text-gray-400 mt-0.5">{kpi.sub}</p>}
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="revenue" className="w-full">
        <TabsList className="bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 h-auto flex-wrap gap-1 p-1">
          <TabsTrigger value="revenue" className="text-xs">Revenue</TabsTrigger>
          <TabsTrigger value="users" className="text-xs">Users</TabsTrigger>
          <TabsTrigger value="operations" className="text-xs">Operations</TabsTrigger>
          <TabsTrigger value="quality" className="text-xs">Quality</TabsTrigger>
        </TabsList>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Trend */}
            <Card className="col-span-2 p-5 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Monthly Revenue</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" fontSize={12} tick={{ fill: '#9ca3af' }} />
                  <YAxis fontSize={12} tick={{ fill: '#9ca3af' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Bar dataKey="revenue" fill="#9EFF00" radius={[4,4,0,0]} name="Revenue" />
                  <Bar dataKey="fees" fill="#6366f1" radius={[4,4,0,0]} name="Fees" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Revenue Pie */}
            <Card className="p-5 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Revenue by Vertical</h3>
              {revenuePie.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={revenuePie} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                      {revenuePie.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-gray-400 text-sm">No revenue data yet</div>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-5 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">User Growth</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" fontSize={12} tick={{ fill: '#9ca3af' }} />
                  <YAxis fontSize={12} tick={{ fill: '#9ca3af' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Line type="monotone" dataKey="count" stroke="#9EFF00" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-5 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Trust Score Distribution</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={trustDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="range" fontSize={12} tick={{ fill: '#9ca3af' }} />
                  <YAxis fontSize={12} tick={{ fill: '#9ca3af' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Bar dataKey="count" radius={[4,4,0,0]}>
                    {trustDistribution.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* User Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-3 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10">
              <p className="text-xs text-gray-500 dark:text-gray-400">Verification Rate</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{users.length > 0 ? ((verifiedUsers / users.length) * 100).toFixed(1) : 0}%</p>
            </Card>
            <Card className="p-3 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10">
              <p className="text-xs text-gray-500 dark:text-gray-400">Avg Trust Score</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{users.length > 0 ? (users.reduce((s, u) => s + (u.trust_score || 0), 0) / users.length).toFixed(0) : 0}</p>
            </Card>
            <Card className="p-3 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10">
              <p className="text-xs text-gray-500 dark:text-gray-400">Restricted Users</p>
              <p className="text-xl font-bold text-red-500">{users.filter(u => u.is_restricted).length}</p>
            </Card>
            <Card className="p-3 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10">
              <p className="text-xs text-gray-500 dark:text-gray-400">Staff Members</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{users.filter(u => u.role === "admin" || (u.additional_roles || []).length > 0).length}</p>
            </Card>
          </div>
        </TabsContent>

        {/* Operations Tab */}
        <TabsContent value="operations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-5 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Trips & Requests</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={tripsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" fontSize={12} tick={{ fill: '#9ca3af' }} />
                  <YAxis fontSize={12} tick={{ fill: '#9ca3af' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Bar dataKey="count" fill="#9EFF00" radius={[4,4,0,0]} name="Trips" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-5 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Matches Over Time</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={matchesByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" fontSize={12} tick={{ fill: '#9ca3af' }} />
                  <YAxis fontSize={12} tick={{ fill: '#9ca3af' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Line type="monotone" dataKey="count" stroke="#06b6d4" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "P2P Trips", value: trips.filter(t => !t.operator_id).length },
              { label: "Bus Trips", value: trips.filter(t => t.operator_id).length },
              { label: "Total Matches", value: matches.length },
              { label: "Active Vendors", value: vendors.filter(v => v.status === "ACTIVE").length },
              { label: "Active Operators", value: busOperators.filter(o => o.status === "active").length },
            ].map(s => (
              <Card key={s.label} className="p-3 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10">
                <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Quality Tab */}
        <TabsContent value="quality" className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Dispute Rate", value: `${disputeRate}%`, color: Number(disputeRate) > 5 ? "text-red-500" : "text-green-500" },
              { label: "Open Disputes", value: disputes.filter(d => d.status === "open").length },
              { label: "Resolved", value: disputes.filter(d => d.status === "resolved").length },
              { label: "Match Rate", value: `${matchRate}%` },
            ].map(s => (
              <Card key={s.label} className="p-4 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10">
                <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color || 'text-gray-900 dark:text-white'}`}>{s.value}</p>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
