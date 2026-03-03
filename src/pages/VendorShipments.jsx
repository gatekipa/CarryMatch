import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Package,
  Search,
  Filter,
  Download,
  Plus,
  MapPin,
  Clock,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useVendorPermissions } from "@/components/vendor/useVendorPermissions";

export default function VendorShipments() {
  const [user, setUser] = useState(null);
  const [vendorStaff, setVendorStaff] = useState(null);
  const [vendor, setVendor] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMode, setFilterMode] = useState("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: vendorStaffData } = useQuery({
    queryKey: ['vendor-staff-me', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const staff = await base44.entities.VendorStaff.filter({ email: user.email, status: "ACTIVE" });
      return staff[0] || null;
    },
    enabled: !!user
  });

  useEffect(() => {
    if (vendorStaffData) {
      setVendorStaff(vendorStaffData);
      // Auto-scope Ops roles to their assigned branch
      if ((vendorStaffData.role === "OPS_ORIGIN" || vendorStaffData.role === "OPS_DEST") && vendorStaffData.branch_id) {
        setSelectedBranch(vendorStaffData.branch_id);
      }
    }
  }, [vendorStaffData]);

  const { data: vendorData } = useQuery({
    queryKey: ['vendor', vendorStaff?.vendor_id],
    queryFn: async () => {
      if (!vendorStaff) return null;
      const vendors = await base44.entities.Vendor.filter({ id: vendorStaff.vendor_id });
      return vendors[0] || null;
    },
    enabled: !!vendorStaff
  });

  useEffect(() => {
    if (vendorData) setVendor(vendorData);
  }, [vendorData]);

  const { data: branches = [] } = useQuery({
    queryKey: ['vendor-branches', vendorStaff?.vendor_id],
    queryFn: async () => {
      if (!vendorStaff) return [];
      return await base44.entities.Branch.filter({ vendor_id: vendorStaff.vendor_id, active: true });
    },
    enabled: !!vendorStaff
  });

  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ['vendor-shipments-all', vendorStaff?.vendor_id, filterStatus, filterMode, selectedBranch],
    queryFn: async () => {
      if (!vendorStaff) return [];
      let query = { vendor_id: vendorStaff.vendor_id };
      if (filterStatus !== "all") query.status = filterStatus;
      if (filterMode !== "all") query.mode = filterMode;
      if (selectedBranch !== "all") query.branch_id = selectedBranch;
      return await base44.entities.Shipment.filter(query, '-created_date', 500);
    },
    enabled: !!vendorStaff,
    refetchInterval: 30000 // Real-time updates every 30 seconds
  });

  const permissions = useVendorPermissions(vendorStaff);

  const filteredShipments = shipments.filter(s => {
    const matchesSearch = !searchQuery || 
      s.tracking_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.sender_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.recipient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.sender_city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.recipient_city?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDateFrom = !filterDateFrom || new Date(s.created_date) >= new Date(filterDateFrom);
    const matchesDateTo = !filterDateTo || new Date(s.created_date) <= new Date(filterDateTo);
    
    return matchesSearch && matchesDateFrom && matchesDateTo;
  });

  const statusColors = {
    PENDING: "bg-gray-500/20 text-gray-300",
    RECEIVED: "bg-blue-500/20 text-blue-300",
    PACKED: "bg-purple-500/20 text-purple-300",
    MANIFESTED: "bg-indigo-500/20 text-indigo-300",
    SHIPPED: "bg-cyan-500/20 text-cyan-300",
    IN_TRANSIT: "bg-orange-500/20 text-orange-300",
    ARRIVED: "bg-teal-500/20 text-teal-300",
    CUSTOMS: "bg-yellow-500/20 text-yellow-300",
    READY_PICKUP: "bg-green-500/20 text-green-300",
    OUT_FOR_DELIVERY: "bg-lime-500/20 text-lime-300",
    DELIVERED: "bg-emerald-500/20 text-emerald-300",
    ON_HOLD: "bg-red-500/20 text-red-300",
    DELAYED: "bg-amber-500/20 text-amber-300",
    RETURNED: "bg-pink-500/20 text-pink-300",
    LOST: "bg-rose-500/20 text-rose-300",
    DAMAGED: "bg-red-600/20 text-red-400"
  };

  const stats = {
    total: filteredShipments.length,
    inTransit: filteredShipments.filter(s => ["SHIPPED", "IN_TRANSIT"].includes(s.status)).length,
    delivered: filteredShipments.filter(s => s.status === "DELIVERED").length,
    issues: filteredShipments.filter(s => ["ON_HOLD", "DELAYED", "RETURNED", "LOST", "DAMAGED"].includes(s.status)).length
  };

  const exportToCSV = () => {
    const headers = ["Tracking Code", "Sender", "Recipient", "Status", "Origin", "Destination", "Created", "Amount"];
    const rows = filteredShipments.map(s => [
      s.tracking_code,
      s.sender_name,
      s.recipient_name,
      s.status,
      `${s.sender_city}, ${s.sender_country}`,
      `${s.recipient_city}, ${s.recipient_country}`,
      format(new Date(s.created_date), "yyyy-MM-dd"),
      s.total_amount
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shipments-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  if (!user || !vendorStaff || !vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-12 bg-white/5 border-white/10 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h3 className="text-2xl font-bold text-white mb-2">Vendor Access Required</h3>
          <p className="text-gray-400">You need to be a registered vendor staff member</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Shipments</h1>
              <p className="text-gray-400">Manage and track all shipments</p>
            </div>
            <div className="flex gap-3">
              {permissions.hasPermission('can_create_shipment') && (
                <Link to={createPageUrl("VendorShipmentIntake")}>
                  <Button className="bg-gradient-to-r from-[#9EFF00] to-[#7ACC00] text-[#1A1A1A] font-bold">
                    <Plus className="w-4 h-4 mr-2" />
                    New Shipment
                  </Button>
                </Link>
              )}
              <Button variant="outline" onClick={exportToCSV} className="border-white/10 text-gray-300">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 bg-white/5 border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Shipments</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
                <Package className="w-8 h-8 text-blue-400" />
              </div>
            </Card>
            <Card className="p-4 bg-white/5 border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">In Transit</p>
                  <p className="text-2xl font-bold text-white">{stats.inTransit}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-orange-400" />
              </div>
            </Card>
            <Card className="p-4 bg-white/5 border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Delivered</p>
                  <p className="text-2xl font-bold text-white">{stats.delivered}</p>
                </div>
                <MapPin className="w-8 h-8 text-green-400" />
              </div>
            </Card>
            <Card className="p-4 bg-white/5 border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Issues</p>
                  <p className="text-2xl font-bold text-white">{stats.issues}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
            </Card>
          </div>

          {/* Advanced Filters */}
          <Card className="p-4 bg-white/5 border-white/10 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-[#9EFF00]" />
              <h3 className="font-bold text-white">Advanced Filters</h3>
            </div>
            <div className="grid md:grid-cols-6 gap-3">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search tracking, sender, recipient..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="RECEIVED">Received</SelectItem>
                  <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="ON_HOLD">On Hold</SelectItem>
                  <SelectItem value="DELAYED">Delayed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterMode} onValueChange={setFilterMode}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  <SelectItem value="AIR">Air</SelectItem>
                  <SelectItem value="SEA">Sea</SelectItem>
                  <SelectItem value="ROAD">Road</SelectItem>
                  <SelectItem value="BUS">Bus</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedBranch} onValueChange={setSelectedBranch} disabled={vendorStaff?.role === "OPS_ORIGIN" || vendorStaff?.role === "OPS_DEST"}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
                placeholder="From"
              />
            </div>
          </Card>

          {/* Shipments List */}
          {isLoading ? (
            <Card className="p-12 bg-white/5 border-white/10 text-center">
              <p className="text-gray-400">Loading shipments...</p>
            </Card>
          ) : filteredShipments.length === 0 ? (
            <Card className="p-12 bg-white/5 border-white/10 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <p className="text-gray-400">No shipments found</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredShipments.map((shipment, index) => (
                <motion.div
                  key={shipment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Link to={createPageUrl("VendorShipmentDetails", `id=${shipment.id}`)}>
                    <Card className="p-4 bg-white/5 border-white/10 hover:bg-white/10 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Package className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <p className="font-bold text-white">{shipment.tracking_code}</p>
                              <Badge className={statusColors[shipment.status]}>
                                {shipment.status.replace(/_/g, " ")}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <span>{shipment.sender_name} → {shipment.recipient_name}</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {shipment.sender_city} → {shipment.recipient_city}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(shipment.created_date), "MMM d, yyyy")}
                              </span>
                            </div>
                          </div>
                        </div>
                        {permissions.hasPermission('can_view_amounts') && (
                          <div className="text-right">
                            <p className="text-sm text-gray-400">Amount</p>
                            <p className="font-bold text-white">${shipment.total_amount}</p>
                          </div>
                        )}
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}