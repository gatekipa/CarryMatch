import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Users, Package, Bus, DollarSign, Activity, AlertTriangle,
  Truck, Tag, TrendingUp, ArrowUpRight, ShieldCheck, Loader2
} from "lucide-react";

export default function OverviewSection({ data, onNavigate }) {
  const { users, trips, requests, matches, orders, disputes, vendors, busOperators, promoCodes, shipments } = data;

  const totalRevenue = orders.filter(o => o.order_status === "confirmed").reduce((s, o) => s + (o.amount_xaf || 0), 0);
  const totalFees = orders.filter(o => o.order_status === "confirmed").reduce((s, o) => s + (o.fee_xaf || 0), 0);
  const activeTrips = trips.filter(t => t.status === "active" && !t.operator_id).length;
  const activeBusTrips = trips.filter(t => t.operator_id && t.trip_status === "scheduled").length;
  const openDisputes = disputes.filter(d => d.status === "open" || d.status === "in_review").length;
  const activePromos = promoCodes.filter(p => p.is_active).length;
  const activeShipments = shipments.filter(s => s.status === "in_transit" || s.status === "pending").length;
  const acceptedMatches = matches.filter(m => m.status === "accepted").length;

  const kpiCards = [
    { label: "Total Users",    value: users.length,                 icon: Users,          color: "bg-blue-500",   sub: `${users.filter(u => u.is_verified).length} verified` },
    { label: "P2P Trips",      value: activeTrips,                  icon: Package,        color: "bg-purple-500", sub: `${requests.length} requests` },
    { label: "Bus Trips",      value: activeBusTrips,               icon: Bus,            color: "bg-green-500",  sub: `${busOperators.filter(o => o.status === "active").length} operators` },
    { label: "Shipments",      value: activeShipments,              icon: Truck,          color: "bg-cyan-500",   sub: `${shipments.length} total` },
    { label: "Revenue (XAF)",  value: totalRevenue.toLocaleString(),icon: DollarSign,     color: "bg-[#9EFF00]",  sub: `${totalFees.toLocaleString()} fees`, dark: true },
    { label: "Matches",        value: matches.length,               icon: Activity,       color: "bg-orange-500", sub: `${acceptedMatches} accepted` },
    { label: "Open Disputes",  value: openDisputes,                 icon: AlertTriangle,  color: openDisputes > 0 ? "bg-red-500" : "bg-gray-400", sub: `${disputes.length} total` },
    { label: "Active Promos",  value: activePromos,                 icon: Tag,            color: "bg-fuchsia-500", sub: `${promoCodes.length} total` },
  ];

  const verticalCards = [
    {
      title: "P2P Marketplace", icon: Package, color: "from-purple-500 to-indigo-500",
      metrics: [
        { label: "Active Trips", value: activeTrips },
        { label: "Requests", value: requests.length },
        { label: "Match Rate", value: requests.length > 0 ? `${((acceptedMatches / requests.length) * 100).toFixed(0)}%` : "0%" },
      ],
      link: { path: createPageUrl("AdminDashboard"), label: "P2P Admin" }
    },
    {
      title: "Bus Ticketing", icon: Bus, color: "from-green-500 to-emerald-500",
      metrics: [
        { label: "Operators", value: busOperators.filter(o => o.status === "active").length },
        { label: "Bus Trips", value: activeBusTrips },
        { label: "Orders", value: orders.length },
      ],
      link: { path: createPageUrl("AdminBusApprovals"), label: "Bus Admin" }
    },
    {
      title: "CML Logistics", icon: Truck, color: "from-cyan-500 to-teal-500",
      metrics: [
        { label: "Vendors", value: vendors.filter(v => v.status === "ACTIVE").length },
        { label: "Shipments", value: shipments.length },
        { label: "Active", value: activeShipments },
      ],
      link: { path: createPageUrl("CarryMatchAdminDashboard"), label: "CML Admin" }
    },
  ];

  return (
    <div className="space-y-8">
      {/* KPI Grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Platform Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {kpiCards.map((kpi, i) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="p-4 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 hover:shadow-md dark:hover:border-white/20 transition-all">
                <div className={`w-9 h-9 rounded-lg ${kpi.color} flex items-center justify-center mb-3`}>
                  <kpi.icon className={`w-4 h-4 ${kpi.dark ? 'text-[#1A1A1A]' : 'text-white'}`} />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{kpi.label}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{kpi.value}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{kpi.sub}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Vertical Health Cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Business Verticals</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {verticalCards.map((v, i) => {
            const Icon = v.icon;
            return (
              <motion.div key={v.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08 }}>
                <Card className="p-5 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${v.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{v.title}</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {v.metrics.map(m => (
                      <div key={m.label} className="text-center">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{m.value}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">{m.label}</p>
                      </div>
                    ))}
                  </div>
                  <Link to={v.link.path} className="flex items-center gap-1 text-sm text-[#9EFF00] hover:underline font-medium">
                    {v.link.label} <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Quick Action Tiles */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Manage Team",      icon: Users,          section: "team" },
            { label: "Customer Lookup",   icon: Users,          section: "customers" },
            { label: "Promo Codes",       icon: Tag,            section: "promos" },
            { label: "View Analytics",    icon: TrendingUp,     section: "analytics" },
          ].map(tile => {
            const Icon = tile.icon;
            return (
              <button
                key={tile.label}
                onClick={() => onNavigate(tile.section)}
                className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 hover:border-[#9EFF00]/40 transition-all text-left group"
              >
                <Icon className="w-5 h-5 text-gray-400 group-hover:text-[#9EFF00] transition-colors mb-2" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">{tile.label}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
