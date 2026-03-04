import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/components/hooks/useCurrentUser";
import { useVendorStaff } from "@/components/hooks/useVendorStaff";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Package,
  Plus,
  QrCode,
  Layers,
  Bell,
  DollarSign,
  MessageSquare,
  TrendingUp,
  Clock,
  CheckCircle,
  Truck,
  Plane,
  Ship,
  Bus,
  MapPin,
  Users,
  Activity,
  ArrowUpRight,
  AlertTriangle,
  AlertCircle,
  LayoutGrid,
  X,
  GripVertical,
  Settings,
  FileText,
  Route,
  Search,
  Filter
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useVendorPermissions } from "@/components/vendor/useVendorPermissions";
import DashboardWidget from "@/components/vendor/DashboardWidget";
import QuickActionsPanel from "@/components/vendor/QuickActionsPanel";
import DashboardShipmentMap from "@/components/shipment/DashboardShipmentMap";
import LoadingCard from "@/components/shared/LoadingCard";
import EmptyState from "@/components/shared/EmptyState";
import QueryErrorFallback from "@/components/shared/QueryErrorFallback";

export default function VendorDashboard() {
  const queryClient = useQueryClient();
  const { user, loading: userLoading } = useCurrentUser();
  const { data: vendorStaff, isLoading: staffLoading } = useVendorStaff(user?.email);
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedMode, setSelectedMode] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [destinationFilter, setDestinationFilter] = useState("");
  const [showShipmentFilters, setShowShipmentFilters] = useState(false);
  const [widgetLayout, setWidgetLayout] = useState(() => {
    try {
      const saved = localStorage.getItem('vendor-widget-layout');
      return saved ? JSON.parse(saved) : ['cutoffs', 'batches', 'inTransit', 'delivered', 'alerts', 'revenue'];
    } catch {
      return ['cutoffs', 'batches', 'inTransit', 'delivered', 'alerts', 'revenue'];
    }
  });
  const [isCustomizing, setIsCustomizing] = useState(false);

  const { data: vendor, isLoading: vendorLoading, error: vendorError, refetch: refetchVendor } = useQuery({
    queryKey: ['vendor', vendorStaff?.vendor_id],
    queryFn: async () => {
      if (!vendorStaff?.vendor_id) return null;
      try {
        const vendors = await base44.entities.Vendor.filter({ id: vendorStaff.vendor_id });
        return vendors[0] || null; // return null (not undefined) to avoid React Query error
      } catch (err) {
        console.error("[VendorDashboard] Vendor fetch failed for", vendorStaff.vendor_id, err);
        // If vendor_id is invalid, clear stale localStorage cache so next load retries properly
        try { localStorage.removeItem("carrymatch_vendor_staff"); } catch {}
        return null;
      }
    },
    enabled: !!vendorStaff?.vendor_id,
    staleTime: 5 * 60 * 1000,
    retry: 1
  });

  const { data: branches = [], error: branchesError } = useQuery({
    queryKey: ['vendor-branches', vendorStaff?.vendor_id],
    queryFn: async () => {
      if (!vendorStaff) return [];
      return await base44.entities.Branch.filter({
        vendor_id: vendorStaff.vendor_id,
        active: true
      });
    },
    enabled: !!vendorStaff,
    staleTime: 10 * 60 * 1000,
    retry: 2
  });

  const { data: shipments = [], error: shipmentsError, refetch: refetchShipments } = useQuery({
    queryKey: ['vendor-shipments', vendorStaff?.vendor_id],
    queryFn: async () => {
      if (!vendorStaff) return [];
      return await base44.entities.Shipment.filter({
        vendor_id: vendorStaff.vendor_id
      }, '-created_date', 100);
    },
    enabled: !!vendorStaff,
    refetchInterval: 30000,
    retry: 2
  });

  const { data: batches = [] } = useQuery({
    queryKey: ['vendor-batches', vendorStaff?.vendor_id],
    queryFn: async () => {
      if (!vendorStaff) return [];
      return await base44.entities.Batch.filter({
        vendor_id: vendorStaff.vendor_id
      }, '-created_date', 50);
    },
    enabled: !!vendorStaff,
    refetchInterval: 30000
  });

  const permissions = useVendorPermissions(vendorStaff);

  // Memoize stats calculation to prevent re-computation on every render
  const stats = React.useMemo(() => ({
    todayCutoffs: batches.filter(b => {
      if (!b.cutoff_at) return false;
      const cutoff = new Date(b.cutoff_at);
      const today = new Date();
      return cutoff.toDateString() === today.toDateString();
    }).length,
    activeBatches: {
      open: batches.filter(b => b.status === 'OPEN').length,
      locked: batches.filter(b => b.status === 'LOCKED').length,
      inTransit: batches.filter(b => b.status === 'IN_TRANSIT').length,
      arrived: batches.filter(b => b.status === 'ARRIVED').length
    },
    shipments: {
      received: shipments.filter(s => s.status === 'RECEIVED').length,
      readyForPickup: shipments.filter(s => s.status === 'READY_PICKUP').length,
      inTransit: shipments.filter(s => ['IN_TRANSIT', 'SHIPPED'].includes(s.status)).length,
      delivered: shipments.filter(s => s.status === 'DELIVERED').length,
      onHold: shipments.filter(s => s.status === 'ON_HOLD').length,
      delayed: shipments.filter(s => s.status === 'DELAYED').length
    },
    revenue: {
      total: shipments.reduce((sum, s) => sum + (s.total_amount || 0), 0),
      thisMonth: shipments.filter(s => {
        const created = new Date(s.created_date);
        const now = new Date();
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
      }).reduce((sum, s) => sum + (s.total_amount || 0), 0)
    },
    alerts: {
      delayed: shipments.filter(s => s.status === 'DELAYED').length,
      onHold: shipments.filter(s => s.status === 'ON_HOLD').length,
      pendingPayment: shipments.filter(s => s.payment_status === 'PENDING').length
    }
  }), [shipments, batches]);

  // Filter shipments based on search and filters
  const filteredShipments = React.useMemo(() => {
    return shipments.filter(s => {
      const matchSearch = !searchQuery || 
        s.tracking_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.sender_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.recipient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.sender_city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.recipient_city?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      
      const matchDateFrom = !dateFrom || new Date(s.created_date) >= new Date(dateFrom);
      const matchDateTo = !dateTo || new Date(s.created_date) <= new Date(dateTo);
      
      const matchDestination = !destinationFilter || 
        s.recipient_city?.toLowerCase().includes(destinationFilter.toLowerCase()) ||
        s.recipient_country?.toLowerCase().includes(destinationFilter.toLowerCase());
      
      return matchSearch && matchStatus && matchDateFrom && matchDateTo && matchDestination;
    });
  }, [shipments, searchQuery, statusFilter, dateFrom, dateTo, destinationFilter]);

  const recentActivity = React.useMemo(() => filteredShipments
    .slice(0, 10)
    .map(s => ({
      id: s.id,
      type: "shipment",
      action: `Shipment ${s.status.toLowerCase().replace('_', ' ')}`,
      user: s.created_by_staff_id || "System",
      branch: s.branch_id,
      time: new Date(s.created_date),
      details: `${s.tracking_code} • ${s.sender_city} → ${s.recipient_city}`
    })), [filteredShipments]);

  const saveWidgetLayout = (layout) => {
    setWidgetLayout(layout);
    try { localStorage.setItem('vendor-widget-layout', JSON.stringify(layout)); } catch {}
  };

  const removeWidget = (widgetId) => {
    const newLayout = widgetLayout.filter(w => w !== widgetId);
    saveWidgetLayout(newLayout);
  };

  const availableWidgets = {
    cutoffs: {
      id: 'cutoffs',
      title: "Today's Cut-offs",
      icon: Clock,
      color: 'blue',
      value: stats.todayCutoffs,
      subtitle: `Across ${branches.length} branches`
    },
    batches: {
      id: 'batches',
      title: "Active Batches",
      icon: Layers,
      color: 'purple',
      value: Object.values(stats.activeBatches).reduce((a, b) => a + b, 0),
      badges: [
        { label: `${stats.activeBatches.open} Open`, color: 'blue' },
        { label: `${stats.activeBatches.locked} Locked`, color: 'yellow' }
      ]
    },
    inTransit: {
      id: 'inTransit',
      title: "In Transit",
      icon: Truck,
      color: 'orange',
      value: stats.shipments.inTransit,
      subtitle: `${stats.shipments.readyForPickup} ready for pickup`
    },
    delivered: {
      id: 'delivered',
      title: "Delivered This Month",
      icon: CheckCircle,
      color: 'green',
      value: stats.shipments.delivered,
      trend: '+12%',
      trendLabel: 'vs last month'
    },
    alerts: {
      id: 'alerts',
      title: "Alerts & Issues",
      icon: AlertTriangle,
      color: 'red',
      value: stats.alerts.delayed + stats.alerts.onHold,
      badges: [
        { label: `${stats.alerts.delayed} Delayed`, color: 'orange' },
        { label: `${stats.alerts.onHold} On Hold`, color: 'red' }
      ]
    },
    revenue: {
      id: 'revenue',
      title: "Revenue (This Month)",
      icon: DollarSign,
      color: 'green',
      value: `$${stats.revenue.thisMonth.toLocaleString()}`,
      subtitle: `Total: $${stats.revenue.total.toLocaleString()}`,
      requiresPermission: 'can_view_amounts'
    }
  };

  if (userLoading || !user || staffLoading) {
    return <LoadingCard />;
  }

  if (!vendorStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="p-8 bg-white/5 border-white/10 text-center max-w-md">
          <Package className="w-14 h-14 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold text-white mb-2">Vendor Access Required</h2>
          <p className="text-gray-400 text-sm mb-6">
            No active partner account was found for <span className="text-white font-medium">{user?.email}</span>.
            If you just submitted an application, try refreshing the page.
          </p>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
            >
              Refresh Page
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = createPageUrl("PartnerSignup")}
              className="w-full border-white/10 text-gray-300 hover:text-white"
            >
              Apply as Partner
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Vendor still loading
  if (vendorLoading) {
    return <LoadingCard />;
  }

  // Vendor fetch failed or vendor_id was invalid — clear cache and let user retry
  if (vendorError || (!vendor && vendorStaff)) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="p-8 bg-white/5 border-white/10 text-center max-w-md">
          <AlertCircle className="w-14 h-14 mx-auto mb-4 text-amber-400" />
          <h2 className="text-2xl font-bold text-white mb-2">Loading Issue</h2>
          <p className="text-gray-400 text-sm mb-6">
            Your partner account was found but the vendor data could not be loaded.
            This can happen with new accounts — please try refreshing.
          </p>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => {
                try { localStorage.removeItem("carrymatch_vendor_staff"); } catch {}
                window.location.reload();
              }}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
            >
              Refresh Page
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (shipmentsError) {
    return <QueryErrorFallback error={shipmentsError} onRetry={refetchShipments} title="Failed to load shipments" />;
  }

  const activeShipments = shipments.filter(s => ['RECEIVED', 'IN_TRANSIT', 'SHIPPED'].includes(s.status));

  return (
    <div className="min-h-screen py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-0 sm:justify-between mb-6">
            <div className="flex items-center gap-3 sm:gap-4">
              {vendor?.logo_url ? (
                <img src={vendor.logo_url} alt={vendor.display_name} className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl object-cover" />
              ) : (
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Truck className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{vendor?.display_name}</h1>
                <p className="text-sm sm:text-base text-gray-400">Welcome back, {vendorStaff.full_name}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCustomizing(!isCustomizing)}
                className={`border-white/10 ${isCustomizing ? 'bg-[#9EFF00]/20 text-[#9EFF00]' : 'text-gray-300'}`}
              >
                <Settings className="w-4 h-4 mr-2" />
                {isCustomizing ? 'Done' : 'Customize'}
              </Button>

              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="w-full sm:w-48 bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map(branch => (
                    <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedMode} onValueChange={setSelectedMode}>
                <SelectTrigger className="w-full sm:w-32 bg-white/5 border-white/10 text-white">
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
          </div>

          {/* Customizable Widgets */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {widgetLayout.map((widgetId, index) => {
              const widget = availableWidgets[widgetId];
              if (!widget) return null;
              
              // Check permissions
              if (widget.requiresPermission && !permissions.hasPermission(widget.requiresPermission)) {
                return null;
              }

              return (
                <DashboardWidget
                  key={widgetId}
                  widget={widget}
                  isCustomizing={isCustomizing}
                  onRemove={() => removeWidget(widgetId)}
                  delay={index * 0.05}
                />
              );
            })}
          </div>

          {isCustomizing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-4"
            >
              <Card className="p-4 bg-white/5 border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <LayoutGrid className="w-4 h-4 text-[#9EFF00]" />
                  <p className="text-sm text-gray-300 font-medium">Available Widgets</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.values(availableWidgets).map(widget => {
                    if (widgetLayout.includes(widget.id)) return null;
                    if (widget.requiresPermission && !permissions.hasPermission(widget.requiresPermission)) return null;
                    
                    return (
                      <Button
                        key={widget.id}
                        variant="outline"
                        size="sm"
                        onClick={() => saveWidgetLayout([...widgetLayout, widget.id])}
                        className="border-white/10 text-gray-300 hover:bg-white/10"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        {widget.title}
                      </Button>
                    );
                  })}
                </div>
              </Card>
            </motion.div>
          )}
        </motion.div>

        {/* Plan Expiry Warning */}
        {vendor?.plan_expires_at && (() => {
          const expiresAt = new Date(vendor.plan_expires_at);
          const now = new Date();
          const daysLeft = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
          if (daysLeft <= 0) {
            return (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <Card className="p-4 bg-red-500/20 border-red-500/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-500/30 rounded-lg flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-red-400" />
                      </div>
                      <div>
                        <p className="text-red-300 font-bold">Plan Expired</p>
                        <p className="text-xs text-red-400">Your {vendor.current_plan || "subscription"} plan has expired. Renew to continue using all features.</p>
                      </div>
                    </div>
                    <Link to={createPageUrl("VendorBilling")}>
                      <Button size="sm" className="bg-red-500 text-white">Renew Now</Button>
                    </Link>
                  </div>
                </Card>
              </motion.div>
            );
          } else if (daysLeft <= 7) {
            return (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <Card className="p-4 bg-amber-500/15 border-amber-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-amber-300 font-bold">Plan Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}</p>
                        <p className="text-xs text-amber-400">Your {vendor.current_plan || "subscription"} plan expires on {expiresAt.toLocaleDateString()}. Renew to avoid interruption.</p>
                      </div>
                    </div>
                    <Link to={createPageUrl("VendorBilling")}>
                      <Button size="sm" className="bg-amber-500 text-black font-bold">Renew</Button>
                    </Link>
                  </div>
                </Card>
              </motion.div>
            );
          }
          return null;
        })()}

        {/* Quick Actions Panel */}
        <QuickActionsPanel permissions={permissions} vendorStaff={vendorStaff} stats={stats} />

        {/* Shipment Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <Card className="p-4 sm:p-6 bg-white/5 border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Search className="w-5 h-5 text-[#9EFF00]" />
                Search Shipments
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowShipmentFilters(!showShipmentFilters)}
                className="text-gray-300 hover:text-white"
              >
                <Filter className="w-4 h-4 mr-2" />
                {showShipmentFilters ? "Hide" : "Show"} Filters
              </Button>
            </div>

            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search by tracking code, sender, recipient, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                />
              </div>

              {/* Filters */}
              {showShipmentFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-white/10"
                >
                  <div>
                    <Label className="text-gray-300 mb-2 block text-sm">Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="RECEIVED">Received</SelectItem>
                        <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                        <SelectItem value="SHIPPED">Shipped</SelectItem>
                        <SelectItem value="READY_PICKUP">Ready for Pickup</SelectItem>
                        <SelectItem value="DELIVERED">Delivered</SelectItem>
                        <SelectItem value="ON_HOLD">On Hold</SelectItem>
                        <SelectItem value="DELAYED">Delayed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

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

                  <div>
                    <Label className="text-gray-300 mb-2 block text-sm">Destination</Label>
                    <Input
                      placeholder="City or country..."
                      value={destinationFilter}
                      onChange={(e) => setDestinationFilter(e.target.value)}
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                    />
                  </div>
                </motion.div>
              )}

              {/* Results Summary */}
              <div className="flex items-center justify-between text-sm">
                <p className="text-gray-400">
                  {filteredShipments.length} shipment{filteredShipments.length !== 1 ? 's' : ''} found
                </p>
                {(searchQuery || statusFilter !== "all" || dateFrom || dateTo || destinationFilter) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                      setDateFrom("");
                      setDateTo("");
                      setDestinationFilter("");
                    }}
                    className="border-white/10 text-gray-300 hover:text-white"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Shipment Map */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mb-6"
        >
          <DashboardShipmentMap shipments={filteredShipments.filter(s => ['RECEIVED', 'IN_TRANSIT', 'SHIPPED'].includes(s.status))} branches={branches} />
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Batch Status Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-6 bg-white/5 border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-purple-400" />
                    Batch Status Details
                  </h2>
                  <Link to={createPageUrl("VendorBatchManagement")}>
                    <Button variant="outline" size="sm" className="border-white/10 text-gray-300">
                      Manage
                      <ArrowUpRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <p className="text-2xl font-bold text-blue-300">{stats.activeBatches.open}</p>
                    <p className="text-sm text-gray-400">Open</p>
                  </div>
                  <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <p className="text-2xl font-bold text-yellow-300">{stats.activeBatches.locked}</p>
                    <p className="text-sm text-gray-400">Locked</p>
                  </div>
                  <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
                    <p className="text-2xl font-bold text-orange-300">{stats.activeBatches.inTransit}</p>
                    <p className="text-sm text-gray-400">In Transit</p>
                  </div>
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                    <p className="text-2xl font-bold text-green-300">{stats.activeBatches.arrived}</p>
                    <p className="text-sm text-gray-400">Arrived</p>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Shipments by Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="p-6 bg-white/5 border-white/10">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-400" />
                  Shipments Overview
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(stats.shipments).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                      <span className="text-gray-300 capitalize text-sm">{status.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <Badge className="bg-white/10 text-white">{count}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar - Activity Feed */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="p-6 bg-white/5 border-white/10">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#9EFF00]" />
                  Recent Activity
                </h2>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {recentActivity.length > 0 ? recentActivity.map((activity) => (
                    <div key={activity.id} className="border-l-2 border-white/10 pl-4 py-2">
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-sm font-medium text-white">{activity.action}</p>
                        <span className="text-xs text-gray-500">
                          {format(activity.time, "h:mm a")}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mb-1">{activity.details}</p>
                    </div>
                  )) : (
                    <p className="text-gray-500 text-sm text-center py-4">No recent activity</p>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Branch Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Card className="p-6 bg-white/5 border-white/10">
                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-400" />
                  Your Branches
                </h2>
                <div className="space-y-3">
                  {branches.slice(0, 3).map((branch) => (
                    <div key={branch.id} className="p-3 rounded-lg bg-white/5">
                      <p className="text-sm font-medium text-white mb-1">{branch.name}</p>
                      <p className="text-xs text-gray-400">{branch.city}, {branch.country}</p>
                    </div>
                  ))}
                  {branches.length > 3 && (
                    <p className="text-xs text-gray-500 text-center pt-2">
                      +{branches.length - 3} more branches
                    </p>
                  )}
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}