import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Building2,
  TrendingUp,
  DollarSign,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Package,
  Settings,
  ArrowLeft
} from "lucide-react";
import { motion } from "framer-motion";

export default function CarryMatchAdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    base44.auth.me().then(user => {
      if (user.role !== "admin") {
        navigate(createPageUrl("Home"));
      }
      setUser(user);
    }).catch(() => navigate(createPageUrl("CarryMatchAdminLogin")));
  }, [navigate]);

  const { data: vendors = [] } = useQuery({
    queryKey: ['admin-all-vendors'],
    queryFn: async () => await base44.entities.Vendor.list(),
    enabled: !!user
  });

  const { data: applications = [] } = useQuery({
    queryKey: ['admin-vendor-applications'],
    queryFn: async () => await base44.entities.VendorApplication.list('-created_date', 10),
    enabled: !!user
  });

  const { data: shipments = [] } = useQuery({
    queryKey: ['admin-all-shipments'],
    queryFn: async () => await base44.entities.Shipment.list("-created_date", 100),
    enabled: !!user
  });

  const stats = {
    vendors: {
      total: vendors.length,
      pending: vendors.filter(v => v.status === "PENDING_REVIEW").length,
      active: vendors.filter(v => v.status === "ACTIVE").length,
      suspended: vendors.filter(v => v.status === "SUSPENDED").length
    },
    applications: {
      pending: applications.filter(a => a.status === "PENDING").length,
      underReview: applications.filter(a => a.status === "UNDER_REVIEW").length
    },
    shipments: {
      total: shipments.length,
      delivered: shipments.filter(s => s.status === "DELIVERED").length,
      inTransit: shipments.filter(s => ["SHIPPED", "IN_TRANSIT"].includes(s.status)).length,
      pending: shipments.filter(s => ["PENDING", "RECEIVED"].includes(s.status)).length
    },
    revenue: {
      total: shipments.reduce((sum, s) => sum + (s.total_amount || 0), 0),
      insurance: shipments.filter(s => s.insurance_enabled).length
    }
  };

  const quickLinks = [
    {
      title: "Vendor Applications",
      description: "Review and approve partner applications",
      icon: AlertCircle,
      href: createPageUrl("CarryMatchAdminApplications"),
      color: "from-yellow-500 to-orange-500",
      badge: stats.applications.pending > 0 ? `${stats.applications.pending} pending` : null
    },
    {
      title: "Vendor Management",
      description: "Manage active vendors and settings",
      icon: Building2,
      href: createPageUrl("CarryMatchAdminVendors"),
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "Analytics",
      description: "Global metrics and performance",
      icon: TrendingUp,
      href: createPageUrl("CarryMatchAdminAnalytics"),
      color: "from-purple-500 to-pink-500"
    },
    {
      title: "Billing & Plans",
      description: "Subscriptions and payment management",
      icon: DollarSign,
      href: createPageUrl("CarryMatchAdminBilling"),
      color: "from-green-500 to-emerald-500"
    },
    {
      title: "Audit Logs",
      description: "Shipment history and system logs",
      icon: FileText,
      href: createPageUrl("CarryMatchAdminAudit"),
      color: "from-orange-500 to-red-500"
    },
    {
      title: "Dispute Center",
      description: "Handle complaints and feedback",
      icon: AlertCircle,
      href: createPageUrl("CarryMatchAdminDisputes"),
      color: "from-red-500 to-pink-500"
    },
    {
      title: "System Config",
      description: "FX rates, insurance limits, notifications",
      icon: Settings,
      href: createPageUrl("CarryMatchAdminSystemConfig"),
      color: "from-gray-500 to-zinc-600"
    }
  ];

  if (authChecked && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center max-w-md">
          <h3 className="text-xl font-bold text-white mb-2">Sign In Required</h3>
          <p className="text-gray-400 text-sm mb-5">Sign in with your admin account to access this dashboard.</p>
          <button onClick={() => base44.auth.redirectToLogin()} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <Button variant="ghost" onClick={() => navigate(createPageUrl("SuperAdminDashboard"))} className="text-gray-400 hover:text-white mb-2 -ml-2">
                <ArrowLeft className="w-4 h-4 mr-2" /> Platform Admin
              </Button>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">CarryMatch Admin</h1>
                  <p className="text-gray-400">Global Vendor Management Portal</p>
                </div>
              </div>
            </div>
            <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
              <Shield className="w-3 h-3 mr-1" />
              Admin Access
            </Badge>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="p-6 bg-white/5 border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="w-8 h-8 text-yellow-400" />
                <div>
                  <p className="text-sm text-gray-400">Pending Applications</p>
                  <p className="text-2xl font-bold text-white">{stats.applications.pending}</p>
                </div>
              </div>
              <div className="text-xs text-gray-400 mt-2">
                {stats.applications.underReview} under review
              </div>
            </Card>

            <Card className="p-6 bg-white/5 border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <Building2 className="w-8 h-8 text-blue-400" />
                <div>
                  <p className="text-sm text-gray-400">Total Vendors</p>
                  <p className="text-2xl font-bold text-white">{stats.vendors.total}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs mt-2">
                <span className="text-green-400">{stats.vendors.active} active</span>
                <span className="text-red-400">{stats.vendors.suspended} suspended</span>
              </div>
            </Card>

            <Card className="p-6 bg-white/5 border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <Package className="w-8 h-8 text-purple-400" />
                <div>
                  <p className="text-sm text-gray-400">Total Shipments</p>
                  <p className="text-2xl font-bold text-white">{stats.shipments.total}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs mt-2">
                <span className="text-green-400">{stats.shipments.delivered} delivered</span>
                <span className="text-blue-400">{stats.shipments.inTransit} in transit</span>
              </div>
            </Card>

            <Card className="p-6 bg-white/5 border-white/10">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-8 h-8 text-green-400" />
                <div>
                  <p className="text-sm text-gray-400">Total Revenue</p>
                  <p className="text-2xl font-bold text-white">
                    ${(stats.revenue.total / 1000).toFixed(1)}k
                  </p>
                </div>
              </div>
              <div className="text-xs text-gray-400 mt-2">
                {stats.revenue.insurance} insured shipments
              </div>
            </Card>
          </div>

          {/* Quick Links */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {quickLinks.map((link, index) => (
              <motion.div
                key={link.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={link.href}>
                  <Card className="p-6 bg-white/5 border-white/10 hover:bg-white/10 transition-all group">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${link.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <link.icon className="w-6 h-6 text-white" />
                      </div>
                      {link.badge && (
                        <Badge className="bg-red-500/20 text-red-300">
                          {link.badge}
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{link.title}</h3>
                    <p className="text-sm text-gray-400">{link.description}</p>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Recent Activity */}
          <Card className="p-6 bg-white/5 border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">Recent Vendor Applications</h3>
              <Link to={createPageUrl("CarryMatchAdminApplications")}>
                <Button size="sm" variant="outline" className="border-white/10 text-gray-300">
                  View All
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {applications
                .filter(a => a.status === "PENDING")
                .slice(0, 5)
                .map((app, index) => (
                  <div key={app.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-yellow-400" />
                      <div>
                        <p className="text-white font-medium">{app.display_name}</p>
                        <p className="text-xs text-gray-400">{app.vendor_type} • {app.hq_country}</p>
                      </div>
                    </div>
                    <Link to={createPageUrl("CarryMatchAdminApplications")}>
                      <Button size="sm" variant="outline" className="border-white/10 text-gray-300">
                        Review
                      </Button>
                    </Link>
                  </div>
                ))}
              {applications.filter(a => a.status === "PENDING").length === 0 && (
                <p className="text-center text-gray-500 py-4">No pending applications</p>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}