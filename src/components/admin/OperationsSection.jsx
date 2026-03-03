import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package, Bus, Truck, ArrowUpRight, CheckCircle, Clock,
  AlertTriangle, Users, Settings2, ShieldCheck
} from "lucide-react";
import { motion } from "framer-motion";

export default function OperationsSection({ data }) {
  const { users, trips, requests, matches, orders, disputes, vendors, busOperators, shipments } = data;

  // P2P metrics
  const p2pTrips = trips.filter(t => !t.operator_id);
  const activeP2P = p2pTrips.filter(t => t.status === "active").length;
  const pendingRequests = requests.filter(r => r.status === "open" || r.status === "pending").length;
  const acceptedMatches = matches.filter(m => m.status === "accepted").length;
  const pendingMatches = matches.filter(m => m.status === "pending").length;

  // Bus metrics
  const activeOperators = busOperators.filter(o => o.status === "active").length;
  const pendingOperators = busOperators.filter(o => o.status === "pending").length;
  const busTrips = trips.filter(t => t.operator_id);
  const scheduledBusTrips = busTrips.filter(t => t.trip_status === "scheduled").length;
  const confirmedOrders = orders.filter(o => o.order_status === "confirmed").length;

  // CML metrics
  const activeVendors = vendors.filter(v => v.status === "ACTIVE").length;
  const pendingApps = vendors.filter(v => v.status === "PENDING_REVIEW").length;
  const activeShipments = shipments.filter(s => s.status === "in_transit" || s.status === "pending").length;
  const completedShipments = shipments.filter(s => s.status === "delivered").length;

  const MetricCard = ({ label, value, icon: Icon, color, alert }) => (
    <div className="p-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${color || 'text-gray-400'}`} />
        <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
        {alert && <Badge className="bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 text-[10px]">!</Badge>}
      </div>
      <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Operations</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Monitor all platform verticals</p>
      </div>

      <Tabs defaultValue="p2p" className="w-full">
        <TabsList className="bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 h-auto flex-wrap gap-1 p-1">
          <TabsTrigger value="p2p" className="text-xs"><Package className="w-3.5 h-3.5 mr-1" /> P2P Marketplace</TabsTrigger>
          <TabsTrigger value="bus" className="text-xs">
            <Bus className="w-3.5 h-3.5 mr-1" /> Bus Ticketing
            {pendingOperators > 0 && <Badge className="ml-1 bg-orange-500 text-white text-[10px]">{pendingOperators}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="cml" className="text-xs">
            <Truck className="w-3.5 h-3.5 mr-1" /> CML Logistics
            {pendingApps > 0 && <Badge className="ml-1 bg-orange-500 text-white text-[10px]">{pendingApps}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* P2P Tab */}
        <TabsContent value="p2p">
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricCard label="Active Trips" value={activeP2P} icon={Package} color="text-green-500" />
              <MetricCard label="Pending Requests" value={pendingRequests} icon={Clock} color="text-orange-500" alert={pendingRequests > 10} />
              <MetricCard label="Accepted Matches" value={acceptedMatches} icon={CheckCircle} color="text-blue-500" />
              <MetricCard label="Pending Matches" value={pendingMatches} icon={Clock} color="text-yellow-500" />
            </div>
            <Card className="p-5 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Recent P2P Trips</h3>
              <div className="space-y-2">
                {p2pTrips.slice(0, 8).map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-white/5">
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">{t.departure_city} → {t.arrival_city}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t.departure_date} · {t.created_by}</p>
                    </div>
                    <Badge className={`text-xs ${t.status === 'active' ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400'}`}>{t.status}</Badge>
                  </div>
                ))}
                {p2pTrips.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">No P2P trips</p>}
              </div>
              <Link to={createPageUrl("AdminListings")} className="flex items-center gap-1 text-sm text-[#9EFF00] hover:underline font-medium mt-4">
                View All Listings <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </Card>
          </div>
        </TabsContent>

        {/* Bus Tab */}
        <TabsContent value="bus">
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricCard label="Active Operators" value={activeOperators} icon={Bus} color="text-green-500" />
              <MetricCard label="Pending Approval" value={pendingOperators} icon={Clock} color="text-orange-500" alert={pendingOperators > 0} />
              <MetricCard label="Scheduled Trips" value={scheduledBusTrips} icon={CheckCircle} color="text-blue-500" />
              <MetricCard label="Confirmed Orders" value={confirmedOrders} icon={CheckCircle} color="text-[#9EFF00]" />
            </div>

            {/* Pending Operators */}
            {pendingOperators > 0 && (
              <Card className="p-5 bg-orange-50 dark:bg-orange-500/5 border-orange-200 dark:border-orange-500/20">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" /> Pending Operator Approvals
                </h3>
                <div className="space-y-2">
                  {busOperators.filter(o => o.status === "pending").map(op => (
                    <div key={op.id} className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-white/5">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{op.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{op.hq_city} · {op.email || op.created_by}</p>
                      </div>
                      <Badge className="bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 text-xs">Pending</Badge>
                    </div>
                  ))}
                </div>
                <Link to={createPageUrl("AdminBusApprovals")} className="flex items-center gap-1 text-sm text-[#9EFF00] hover:underline font-medium mt-3">
                  Review Approvals <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </Card>
            )}

            <div className="flex flex-wrap gap-2">
              <Link to={createPageUrl("AdminBusApprovals")}><Button size="sm" variant="outline" className="text-xs">Bus Approvals</Button></Link>
              <Link to={createPageUrl("AdminBusSeatControl")}><Button size="sm" variant="outline" className="text-xs">Seat Control</Button></Link>
              <Link to={createPageUrl("AdminBusSettings")}><Button size="sm" variant="outline" className="text-xs">Bus Settings</Button></Link>
            </div>
          </div>
        </TabsContent>

        {/* CML Tab */}
        <TabsContent value="cml">
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricCard label="Active Vendors" value={activeVendors} icon={Truck} color="text-green-500" />
              <MetricCard label="Pending Apps" value={pendingApps} icon={Clock} color="text-orange-500" alert={pendingApps > 0} />
              <MetricCard label="Active Shipments" value={activeShipments} icon={Package} color="text-blue-500" />
              <MetricCard label="Delivered" value={completedShipments} icon={CheckCircle} color="text-[#9EFF00]" />
            </div>

            <Card className="p-5 bg-white dark:bg-white/5 border-gray-200 dark:border-white/10">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Recent Vendors</h3>
              <div className="space-y-2">
                {vendors.slice(0, 6).map(v => (
                  <div key={v.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-white/5">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{v.business_name || v.name || "—"}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{v.contact_email || v.created_by}</p>
                    </div>
                    <Badge className={`text-xs ${v.status === 'ACTIVE' ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400'}`}>{v.status}</Badge>
                  </div>
                ))}
              </div>
              <Link to={createPageUrl("CarryMatchAdminDashboard")} className="flex items-center gap-1 text-sm text-[#9EFF00] hover:underline font-medium mt-4">
                CML Admin Dashboard <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
