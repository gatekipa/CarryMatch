import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Users, TrendingUp, ShieldCheck, Bus, Package, AlertTriangle, Search,
  Ban, Trash2, CheckCircle, XCircle, Loader2, Plus, Tag, BarChart3,
  DollarSign, Activity, Globe, Eye, RotateCcw, Truck, ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

// Admin access is determined by server-side role assignment (user.role === "admin")

export default function SuperAdminDashboard() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [showPromoDialog, setShowPromoDialog] = useState(false);
  const [showUserDetail, setShowUserDetail] = useState(null);

  // Auth check
  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setIsAuthorized(u.role === "admin");
    }).catch(() => setIsAuthorized(false));
  }, []);

  // ── Data Queries ─────────────────────────────────────────────────
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["sa-users"],
    queryFn: () => base44.entities.User.list(),
    enabled: isAuthorized
  });

  const { data: trips = [] } = useQuery({
    queryKey: ["sa-trips"],
    queryFn: () => base44.entities.Trip.list("-created_date", 500),
    enabled: isAuthorized
  });

  const { data: requests = [] } = useQuery({
    queryKey: ["sa-requests"],
    queryFn: () => base44.entities.ShipmentRequest.list("-created_date", 500),
    enabled: isAuthorized
  });

  const { data: matches = [] } = useQuery({
    queryKey: ["sa-matches"],
    queryFn: () => base44.entities.Match.list("-created_date", 500),
    enabled: isAuthorized
  });

  const { data: disputes = [] } = useQuery({
    queryKey: ["sa-disputes"],
    queryFn: () => base44.entities.Dispute.list("-created_date", 200),
    enabled: isAuthorized
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["sa-orders"],
    queryFn: () => base44.entities.Order.list("-created_date", 500),
    enabled: isAuthorized
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ["sa-vendors"],
    queryFn: () => base44.entities.Vendor.list(),
    enabled: isAuthorized
  });

  const { data: busOperators = [] } = useQuery({
    queryKey: ["sa-bus-operators"],
    queryFn: () => base44.entities.BusOperator.list(),
    enabled: isAuthorized
  });

  const { data: promoCodes = [] } = useQuery({
    queryKey: ["sa-promos"],
    queryFn: () => base44.entities.PromoCode.list("-created_date", 200),
    enabled: isAuthorized
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["sa-reviews"],
    queryFn: () => base44.entities.Review.list("-created_date", 200),
    enabled: isAuthorized
  });

  // ── Mutations ────────────────────────────────────────────────────
  const restrictUser = useMutation({
    mutationFn: async ({ userId, reason, restrict }) => {
      await base44.entities.User.update(userId, {
        is_restricted: restrict,
        restriction_reason: restrict ? reason : "",
        admin_flags: restrict ? ["admin-restricted"] : []
      });
    },
    onSuccess: () => { queryClient.invalidateQueries(["sa-users"]); toast.success("User updated"); },
    onError: (e) => toast.error("Failed: " + e.message)
  });

  const deleteUser = useMutation({
    mutationFn: async (userId) => {
      await base44.entities.User.delete(userId);
    },
    onSuccess: () => { queryClient.invalidateQueries(["sa-users"]); toast.success("User deleted"); },
    onError: (e) => toast.error("Failed: " + e.message)
  });

  const updateOperatorStatus = useMutation({
    mutationFn: async ({ opId, status }) => {
      await base44.entities.BusOperator.update(opId, { status });
    },
    onSuccess: () => { queryClient.invalidateQueries(["sa-bus-operators"]); toast.success("Operator updated"); },
    onError: (e) => toast.error("Failed: " + e.message)
  });

  const deleteOperator = useMutation({
    mutationFn: async (opId) => {
      await base44.entities.BusOperator.delete(opId);
    },
    onSuccess: () => { queryClient.invalidateQueries(["sa-bus-operators"]); toast.success("Operator deleted"); },
    onError: (e) => toast.error("Failed: " + e.message)
  });

  const [newPromo, setNewPromo] = useState({
    code: "", discount_type: "percentage", discount_value: 10,
    max_uses: 100, valid_until: "", operator_id: "PLATFORM"
  });

  const createPromo = useMutation({
    mutationFn: async () => {
      if (!newPromo.code.trim()) throw new Error("Code is required");
      await base44.entities.PromoCode.create({
        ...newPromo,
        code: newPromo.code.toUpperCase().trim(),
        is_active: true,
        current_uses: 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["sa-promos"]);
      toast.success("Promo code created");
      setShowPromoDialog(false);
      setNewPromo({ code: "", discount_type: "percentage", discount_value: 10, max_uses: 100, valid_until: "", operator_id: "PLATFORM" });
    },
    onError: (e) => toast.error("Failed: " + e.message)
  });

  const togglePromo = useMutation({
    mutationFn: async ({ promoId, active }) => {
      await base44.entities.PromoCode.update(promoId, { is_active: active });
    },
    onSuccess: () => { queryClient.invalidateQueries(["sa-promos"]); toast.success("Promo updated"); }
  });

  const deletePromo = useMutation({
    mutationFn: async (promoId) => { await base44.entities.PromoCode.delete(promoId); },
    onSuccess: () => { queryClient.invalidateQueries(["sa-promos"]); toast.success("Promo deleted"); }
  });

  // ── Auth Gate ────────────────────────────────────────────────────
  if (!user) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#9EFF00]" /></div>;
  if (!isAuthorized) return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="p-8 bg-red-500/10 border-red-500/30 text-center max-w-md">
        <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-red-400" />
        <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-gray-400">Platform admin access required.</p>
      </Card>
    </div>
  );

  // ── Computed Metrics ─────────────────────────────────────────────
  const totalRevenue = orders.filter(o => o.order_status === "confirmed").reduce((s, o) => s + (o.amount_xaf || 0), 0);
  const totalFees = orders.filter(o => o.order_status === "confirmed").reduce((s, o) => s + (o.fee_xaf || 0), 0);
  const activeTrips = trips.filter(t => t.status === "active" && !t.operator_id).length;
  const activeBusTrips = trips.filter(t => t.operator_id && t.trip_status === "scheduled").length;
  const openDisputes = disputes.filter(d => d.status === "open" || d.status === "in_review").length;
  const restrictedUsers = users.filter(u => u.is_restricted).length;
  const pendingOperators = busOperators.filter(o => o.status === "pending").length;

  // ── Filtered lists ───────────────────────────────────────────────
  const filteredUsers = users.filter(u => {
    const matchesSearch = !searchTerm || 
      (u.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || u.created_by || "").toLowerCase().includes(searchTerm.toLowerCase());
    if (userFilter === "restricted") return matchesSearch && u.is_restricted;
    if (userFilter === "verified") return matchesSearch && u.is_verified;
    return matchesSearch;
  });

  const filteredOperators = busOperators.filter(o => {
    if (vendorFilter === "pending") return o.status === "pending";
    if (vendorFilter === "active") return o.status === "active";
    if (vendorFilter === "suspended") return o.status === "suspended";
    return true;
  });

  const kpiCards = [
    { label: "Total Users", value: users.length, icon: Users, color: "from-blue-500 to-blue-600", sub: `${restrictedUsers} restricted` },
    { label: "P2P Trips", value: activeTrips, icon: Package, color: "from-purple-500 to-purple-600", sub: `${requests.length} requests` },
    { label: "Bus Trips", value: activeBusTrips, icon: Bus, color: "from-green-500 to-green-600", sub: `${busOperators.filter(o => o.status === "active").length} operators` },
    { label: "Revenue (XAF)", value: totalRevenue.toLocaleString(), icon: DollarSign, color: "from-[#9EFF00] to-[#7ACC00]", sub: `${totalFees.toLocaleString()} fees`, dark: true },
    { label: "Matches", value: matches.length, icon: Activity, color: "from-orange-500 to-orange-600", sub: `${matches.filter(m => m.status === "accepted").length} accepted` },
    { label: "Open Disputes", value: openDisputes, icon: AlertTriangle, color: openDisputes > 0 ? "from-red-500 to-red-600" : "from-gray-500 to-gray-600", sub: `${disputes.length} total` },
  ];

  return (
    <div className="min-h-screen py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-[#9EFF00] to-[#7ACC00] rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#1A1A1A]" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Platform Admin</h1>
              <p className="text-gray-400 text-sm">CarryMatch SaaS Control Center</p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {kpiCards.map((kpi, i) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="p-4 bg-white/5 border-white/10 hover:border-white/20 transition-colors">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${kpi.color} flex items-center justify-center mb-2`}>
                  <kpi.icon className={`w-4 h-4 ${kpi.dark ? 'text-[#1A1A1A]' : 'text-white'}`} />
                </div>
                <p className="text-xs text-gray-400">{kpi.label}</p>
                <p className="text-xl font-bold text-white">{kpi.value}</p>
                <p className="text-xs text-gray-500">{kpi.sub}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Admin Module Links */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Link to={createPageUrl("CarryMatchAdminDashboard")}>
            <Card className="p-5 bg-gradient-to-r from-[#9EFF00]/10 to-emerald-500/10 border-[#9EFF00]/30 hover:border-[#9EFF00]/60 transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#9EFF00] to-emerald-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Truck className="w-6 h-6 text-[#1A1A1A]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">CML Logistics Admin</h3>
                    <p className="text-sm text-gray-400">Vendors, shipments, billing, system config</p>
                  </div>
                </div>
                <ExternalLink className="w-5 h-5 text-gray-500 group-hover:text-[#9EFF00] transition-colors" />
              </div>
            </Card>
          </Link>
          <Link to={createPageUrl("AdminDashboard")}>
            <Card className="p-5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30 hover:border-blue-500/60 transition-all cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Bus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Bus & P2P Admin</h3>
                    <p className="text-sm text-gray-400">Operators, routes, trips, approvals</p>
                  </div>
                </div>
                <ExternalLink className="w-5 h-5 text-gray-500 group-hover:text-blue-400 transition-colors" />
              </div>
            </Card>
          </Link>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="bg-white/5 border border-white/10 mb-6 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="users" className="text-xs sm:text-sm"><Users className="w-4 h-4 mr-1" /> Users</TabsTrigger>
            <TabsTrigger value="operators" className="text-xs sm:text-sm"><Bus className="w-4 h-4 mr-1" /> Operators {pendingOperators > 0 && <Badge className="ml-1 bg-orange-500 text-xs">{pendingOperators}</Badge>}</TabsTrigger>
            <TabsTrigger value="promos" className="text-xs sm:text-sm"><Tag className="w-4 h-4 mr-1" /> Promos</TabsTrigger>
            <TabsTrigger value="disputes" className="text-xs sm:text-sm"><AlertTriangle className="w-4 h-4 mr-1" /> Disputes {openDisputes > 0 && <Badge className="ml-1 bg-red-500 text-xs">{openDisputes}</Badge>}</TabsTrigger>
            <TabsTrigger value="revenue" className="text-xs sm:text-sm"><BarChart3 className="w-4 h-4 mr-1" /> Revenue</TabsTrigger>
          </TabsList>

          {/* ── USERS TAB ─────────────────────────────────────── */}
          <TabsContent value="users">
            <Card className="p-4 sm:p-6 bg-white/5 border-white/10">
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search users by name or email..." className="pl-10 bg-white/5 border-white/10 text-white" />
                </div>
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#1A1A2E] border-white/10">
                    <SelectItem value="all" className="text-white">All Users</SelectItem>
                    <SelectItem value="verified" className="text-white">Verified</SelectItem>
                    <SelectItem value="restricted" className="text-white">Restricted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <p className="text-xs text-gray-500 mb-3">{filteredUsers.length} users</p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400 text-xs">
                      <th className="text-left py-2 px-2">User</th>
                      <th className="text-left py-2 px-2 hidden sm:table-cell">Email</th>
                      <th className="text-left py-2 px-2 hidden md:table-cell">Trust</th>
                      <th className="text-left py-2 px-2">Status</th>
                      <th className="text-right py-2 px-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.slice(0, 50).map(u => (
                      <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-2">
                            {u.profile_picture_url ? (
                              <img src={u.profile_picture_url} alt="" className="w-8 h-8 rounded-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><User className="w-4 h-4 text-gray-400" /></div>
                            )}
                            <span className="text-white text-sm truncate max-w-[120px]">{u.full_name || "—"}</span>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-gray-400 text-xs hidden sm:table-cell truncate max-w-[180px]">{u.email || u.created_by}</td>
                        <td className="py-2 px-2 hidden md:table-cell">
                          <span className={`text-xs font-mono ${(u.trust_score || 0) >= 80 ? 'text-green-400' : (u.trust_score || 0) >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>{u.trust_score || 0}</span>
                        </td>
                        <td className="py-2 px-2">
                          {u.is_restricted ? <Badge className="bg-red-500/20 text-red-400 text-xs">Restricted</Badge>
                            : u.is_verified ? <Badge className="bg-green-500/20 text-green-400 text-xs">Verified</Badge>
                            : <Badge className="bg-gray-500/20 text-gray-400 text-xs">Active</Badge>}
                        </td>
                        <td className="py-2 px-2 text-right">
                          <div className="flex justify-end gap-1">
                            {u.is_restricted ? (
                              <Button size="sm" variant="ghost" onClick={() => restrictUser.mutate({ userId: u.id, reason: "", restrict: false })} className="h-7 px-2 text-green-400 hover:text-green-300 text-xs">
                                <RotateCcw className="w-3 h-3 mr-1" /> Unblock
                              </Button>
                            ) : (
                              <Button size="sm" variant="ghost" onClick={() => {
                                const reason = window.prompt("Restriction reason:");
                                if (reason) restrictUser.mutate({ userId: u.id, reason, restrict: true });
                              }} className="h-7 px-2 text-orange-400 hover:text-orange-300 text-xs">
                                <Ban className="w-3 h-3 mr-1" /> Restrict
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => {
                              if (window.confirm(`Delete user ${u.full_name || u.email}? This cannot be undone.`)) deleteUser.mutate(u.id);
                            }} className="h-7 px-2 text-red-400 hover:text-red-300 text-xs">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredUsers.length > 50 && <p className="text-xs text-gray-500 mt-2 text-center">Showing first 50 of {filteredUsers.length}</p>}
            </Card>
          </TabsContent>

          {/* ── OPERATORS TAB ─────────────────────────────────── */}
          <TabsContent value="operators">
            <Card className="p-4 sm:p-6 bg-white/5 border-white/10">
              <div className="flex gap-3 mb-4">
                <Select value={vendorFilter} onValueChange={setVendorFilter}>
                  <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#1A1A2E] border-white/10">
                    <SelectItem value="all" className="text-white">All ({busOperators.length})</SelectItem>
                    <SelectItem value="pending" className="text-white">Pending ({busOperators.filter(o => o.status === "pending").length})</SelectItem>
                    <SelectItem value="active" className="text-white">Active ({busOperators.filter(o => o.status === "active").length})</SelectItem>
                    <SelectItem value="suspended" className="text-white">Suspended ({busOperators.filter(o => o.status === "suspended").length})</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                {filteredOperators.map(op => (
                  <div key={op.id} className="p-4 bg-white/5 rounded-lg border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      {op.logo_url ? (
                        <img src={op.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" onError={(e) => { e.target.style.display = "none"; }} />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center"><Bus className="w-5 h-5 text-gray-400" /></div>
                      )}
                      <div>
                        <p className="text-white font-medium text-sm">{op.name}</p>
                        <p className="text-xs text-gray-400">{op.hq_city} · {op.email || op.created_by}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${op.status === "active" ? "bg-green-500/20 text-green-400" : op.status === "pending" ? "bg-orange-500/20 text-orange-400" : "bg-red-500/20 text-red-400"}`}>{op.status}</Badge>
                      {op.status === "pending" && (
                        <Button size="sm" onClick={() => updateOperatorStatus.mutate({ opId: op.id, status: "active" })} className="h-7 bg-green-600 hover:bg-green-700 text-white text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" /> Approve
                        </Button>
                      )}
                      {op.status === "active" && (
                        <Button size="sm" variant="ghost" onClick={() => updateOperatorStatus.mutate({ opId: op.id, status: "suspended" })} className="h-7 text-orange-400 text-xs">
                          <Ban className="w-3 h-3 mr-1" /> Suspend
                        </Button>
                      )}
                      {op.status === "suspended" && (
                        <Button size="sm" variant="ghost" onClick={() => updateOperatorStatus.mutate({ opId: op.id, status: "active" })} className="h-7 text-green-400 text-xs">
                          <RotateCcw className="w-3 h-3 mr-1" /> Reactivate
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => {
                        if (window.confirm(`Delete operator "${op.name}"? This cannot be undone.`)) deleteOperator.mutate(op.id);
                      }} className="h-7 text-red-400 text-xs">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {filteredOperators.length === 0 && <p className="text-center text-gray-500 py-8">No operators found</p>}
              </div>
            </Card>
          </TabsContent>

          {/* ── PROMOS TAB ────────────────────────────────────── */}
          <TabsContent value="promos">
            <Card className="p-4 sm:p-6 bg-white/5 border-white/10">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-white font-semibold">Promo Codes & Vouchers</h3>
                <Button onClick={() => setShowPromoDialog(true)} size="sm" className="bg-[#9EFF00] hover:bg-[#7ACC00] text-[#1A1A1A] text-xs">
                  <Plus className="w-4 h-4 mr-1" /> Create Promo
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400 text-xs">
                      <th className="text-left py-2 px-2">Code</th>
                      <th className="text-left py-2 px-2">Discount</th>
                      <th className="text-left py-2 px-2 hidden sm:table-cell">Usage</th>
                      <th className="text-left py-2 px-2 hidden md:table-cell">Expires</th>
                      <th className="text-left py-2 px-2">Status</th>
                      <th className="text-right py-2 px-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {promoCodes.map(p => (
                      <tr key={p.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-2 px-2"><span className="font-mono text-[#9EFF00] text-sm">{p.code}</span></td>
                        <td className="py-2 px-2 text-white text-xs">
                          {p.discount_type === "percentage" ? `${p.discount_value}%` : `${p.discount_value} XAF`}
                        </td>
                        <td className="py-2 px-2 text-gray-400 text-xs hidden sm:table-cell">
                          {p.current_uses || 0}/{p.max_uses || "∞"}
                        </td>
                        <td className="py-2 px-2 text-xs hidden md:table-cell">
                          {p.valid_until ? (
                            <span className={new Date(p.valid_until) < new Date() ? "text-red-400" : "text-gray-400"}>{p.valid_until}</span>
                          ) : <span className="text-gray-500">No expiry</span>}
                        </td>
                        <td className="py-2 px-2">
                          <Badge className={`text-xs ${p.is_active ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>
                            {p.is_active ? "Active" : "Disabled"}
                          </Badge>
                        </td>
                        <td className="py-2 px-2 text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => togglePromo.mutate({ promoId: p.id, active: !p.is_active })} className="h-7 px-2 text-xs text-gray-300">
                              {p.is_active ? <XCircle className="w-3 h-3 mr-1" /> : <CheckCircle className="w-3 h-3 mr-1" />}
                              {p.is_active ? "Disable" : "Enable"}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => {
                              if (window.confirm(`Delete promo "${p.code}"?`)) deletePromo.mutate(p.id);
                            }} className="h-7 px-2 text-red-400 text-xs">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {promoCodes.length === 0 && <p className="text-center text-gray-500 py-8">No promo codes yet</p>}
            </Card>
          </TabsContent>

          {/* ── DISPUTES TAB ──────────────────────────────────── */}
          <TabsContent value="disputes">
            <Card className="p-4 sm:p-6 bg-white/5 border-white/10">
              <h3 className="text-white font-semibold mb-4">Disputes ({disputes.length})</h3>
              <div className="space-y-3">
                {disputes.slice(0, 30).map(d => (
                  <div key={d.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`text-xs ${d.status === "open" ? "bg-red-500/20 text-red-400" : d.status === "in_review" ? "bg-orange-500/20 text-orange-400" : "bg-green-500/20 text-green-400"}`}>{d.status}</Badge>
                          <span className="text-xs text-gray-500">{d.dispute_type || "General"}</span>
                        </div>
                        <p className="text-white text-sm">{d.description?.slice(0, 150) || "No description"}</p>
                        <p className="text-xs text-gray-500 mt-1">By: {d.complainant_email} → {d.respondent_email}</p>
                      </div>
                      <div className="flex gap-1">
                        {d.status === "open" && (
                          <Button size="sm" variant="ghost" onClick={async () => {
                            await base44.entities.Dispute.update(d.id, { status: "in_review" });
                            queryClient.invalidateQueries(["sa-disputes"]);
                            toast.success("Marked as in review");
                          }} className="h-7 text-orange-400 text-xs">Review</Button>
                        )}
                        {(d.status === "open" || d.status === "in_review") && (
                          <Button size="sm" variant="ghost" onClick={async () => {
                            const resolution = window.prompt("Resolution note:");
                            if (!resolution) return;
                            await base44.entities.Dispute.update(d.id, { status: "resolved", resolution_notes: resolution });
                            queryClient.invalidateQueries(["sa-disputes"]);
                            toast.success("Dispute resolved");
                          }} className="h-7 text-green-400 text-xs">Resolve</Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {disputes.length === 0 && <p className="text-center text-gray-500 py-8">No disputes</p>}
              </div>
            </Card>
          </TabsContent>

          {/* ── REVENUE TAB ───────────────────────────────────── */}
          <TabsContent value="revenue">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="p-6 bg-white/5 border-white/10">
                <p className="text-xs text-gray-400 mb-1">Total Orders</p>
                <p className="text-3xl font-bold text-white">{orders.length}</p>
                <p className="text-xs text-gray-500">{orders.filter(o => o.order_status === "confirmed").length} confirmed</p>
              </Card>
              <Card className="p-6 bg-white/5 border-white/10">
                <p className="text-xs text-gray-400 mb-1">Gross Revenue</p>
                <p className="text-3xl font-bold text-[#9EFF00]">{totalRevenue.toLocaleString()} XAF</p>
                <p className="text-xs text-gray-500">From confirmed orders</p>
              </Card>
              <Card className="p-6 bg-white/5 border-white/10">
                <p className="text-xs text-gray-400 mb-1">Platform Fees Earned</p>
                <p className="text-3xl font-bold text-blue-400">{totalFees.toLocaleString()} XAF</p>
                <p className="text-xs text-gray-500">{totalRevenue > 0 ? ((totalFees / totalRevenue) * 100).toFixed(1) : 0}% take rate</p>
              </Card>
            </div>

            <Card className="p-4 sm:p-6 bg-white/5 border-white/10">
              <h3 className="text-white font-semibold mb-4">Recent Orders</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400 text-xs">
                      <th className="text-left py-2 px-2">Passenger</th>
                      <th className="text-left py-2 px-2">Amount</th>
                      <th className="text-left py-2 px-2 hidden sm:table-cell">Fee</th>
                      <th className="text-left py-2 px-2 hidden md:table-cell">Channel</th>
                      <th className="text-left py-2 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 30).map(o => (
                      <tr key={o.id} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-2 px-2 text-white text-xs">{o.passenger_name || o.user_id || "—"}</td>
                        <td className="py-2 px-2 text-white font-mono text-xs">{(o.amount_xaf || 0).toLocaleString()}</td>
                        <td className="py-2 px-2 text-gray-400 text-xs hidden sm:table-cell">{(o.fee_xaf || 0).toLocaleString()}</td>
                        <td className="py-2 px-2 text-gray-400 text-xs hidden md:table-cell">{o.channel || "online"}</td>
                        <td className="py-2 px-2">
                          <Badge className={`text-xs ${o.order_status === "confirmed" ? "bg-green-500/20 text-green-400" : o.order_status === "canceled" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}>{o.order_status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Create Promo Dialog ─────────────────────────────────── */}
      <Dialog open={showPromoDialog} onOpenChange={setShowPromoDialog}>
        <DialogContent className="bg-[#0F1D35] border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2"><Tag className="w-5 h-5 text-[#9EFF00]" /> Create Promo Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label className="text-gray-300 text-sm">Code *</Label>
              <Input value={newPromo.code} onChange={(e) => setNewPromo(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="e.g. LAUNCH25" className="bg-white/5 border-white/10 text-white font-mono" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-300 text-sm">Type</Label>
                <Select value={newPromo.discount_type} onValueChange={(v) => setNewPromo(p => ({ ...p, discount_type: v }))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#1A1A2E] border-white/10">
                    <SelectItem value="percentage" className="text-white">Percentage (%)</SelectItem>
                    <SelectItem value="fixed" className="text-white">Fixed (XAF)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-300 text-sm">Value</Label>
                <Input type="number" value={newPromo.discount_value} onChange={(e) => setNewPromo(p => ({ ...p, discount_value: parseInt(e.target.value) || 0 }))} className="bg-white/5 border-white/10 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-gray-300 text-sm">Max Uses</Label>
                <Input type="number" value={newPromo.max_uses} onChange={(e) => setNewPromo(p => ({ ...p, max_uses: parseInt(e.target.value) || 0 }))} className="bg-white/5 border-white/10 text-white" />
              </div>
              <div>
                <Label className="text-gray-300 text-sm">Expires</Label>
                <Input type="date" value={newPromo.valid_until} onChange={(e) => setNewPromo(p => ({ ...p, valid_until: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
              </div>
            </div>
            <Button onClick={() => createPromo.mutate()} disabled={createPromo.isPending || !newPromo.code.trim()} className="w-full bg-[#9EFF00] hover:bg-[#7ACC00] text-[#1A1A1A] font-semibold">
              {createPromo.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : "Create Promo Code"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
