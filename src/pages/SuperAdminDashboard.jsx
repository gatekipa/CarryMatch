import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { usePermissions } from "@/components/permissions/usePermissions";
import { Card } from "@/components/ui/card";
import { Loader2, ShieldCheck } from "lucide-react";

// Section components
import AdminSidebar from "@/components/admin/AdminSidebar";
import OverviewSection from "@/components/admin/OverviewSection";
import TeamSection from "@/components/admin/TeamSection";
import CustomerSection from "@/components/admin/CustomerSection";
import PromoSection from "@/components/admin/PromoSection";
import AnalyticsSection from "@/components/admin/AnalyticsSection";
import OperationsSection from "@/components/admin/OperationsSection";
import DisputeSection from "@/components/admin/DisputeSection";
import AuditSection from "@/components/admin/AuditSection";

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const activeSection = searchParams.get("section") || "overview";
  const permissions = usePermissions(user);

  // Auth check
  useEffect(() => {
    base44.auth.me().then(u => setUser(u)).catch(() => navigate(createPageUrl("Home")));
  }, [navigate]);

  // Redirect non-staff
  useEffect(() => {
    if (user !== null && !permissions.isStaff) {
      navigate(createPageUrl("Home"));
    }
  }, [user, permissions, navigate]);

  // ── Data Queries ─────────────────────────────────────────────────
  const isAuthorized = permissions.isStaff;

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

  const { data: shipments = [] } = useQuery({
    queryKey: ["sa-shipments"],
    queryFn: () => base44.entities.Shipment.list("-created_date", 500),
    enabled: isAuthorized
  });

  // ── Loading / Auth Gates ───────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#9EFF00]" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-center max-w-md">
          <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-500 dark:text-gray-400">You don't have permission to access the admin dashboard.</p>
        </Card>
      </div>
    );
  }

  // ── Shared Data Object ─────────────────────────────────────────
  const allData = { users, trips, requests, matches, disputes, orders, vendors, busOperators, promoCodes, reviews, shipments };

  // Badge counts for sidebar
  const openDisputes = disputes.filter(d => d.status === "open" || d.status === "in_review").length;
  const pendingOperators = busOperators.filter(o => o.status === "pending").length;
  const badges = {
    disputes: openDisputes,
    operations: pendingOperators,
  };

  const handleSectionChange = (section) => {
    setSearchParams({ section });
  };

  // ── Render Active Section ──────────────────────────────────────
  const renderSection = () => {
    switch (activeSection) {
      case "overview":
        return <OverviewSection data={allData} onNavigate={handleSectionChange} />;
      case "team":
        return permissions.hasPermission("can_manage_team")
          ? <TeamSection users={users} currentUser={user} />
          : <AccessDeniedSection />;
      case "customers":
        return <CustomerSection users={users} allData={allData} />;
      case "promos":
        return permissions.hasPermission("can_manage_promos")
          ? <PromoSection promoCodes={promoCodes} />
          : <AccessDeniedSection />;
      case "analytics":
        return permissions.hasPermission("can_view_analytics")
          ? <AnalyticsSection data={allData} />
          : <AccessDeniedSection />;
      case "operations":
        return <OperationsSection data={allData} />;
      case "disputes":
        return permissions.hasPermission("can_handle_disputes")
          ? <DisputeSection disputes={disputes} users={users} />
          : <AccessDeniedSection />;
      case "audit":
        return permissions.hasPermission("can_view_audit_log")
          ? <AuditSection isAuthorized={isAuthorized} />
          : <AccessDeniedSection />;
      default:
        return <OverviewSection data={allData} onNavigate={handleSectionChange} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#0a0a0a]" data-testid="super-admin-dashboard">
      {/* Sidebar */}
      <AdminSidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        permissions={permissions}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        badges={badges}
      />

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-[1440px] mx-auto p-6 lg:p-8">
          {usersLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-[#9EFF00]" />
            </div>
          ) : (
            renderSection()
          )}
        </div>
      </main>
    </div>
  );
}

function AccessDeniedSection() {
  return (
    <div className="flex items-center justify-center py-24">
      <Card className="p-8 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30 text-center max-w-md">
        <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-orange-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Limited Access</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Your role doesn't have access to this section. Contact a super admin to request access.</p>
      </Card>
    </div>
  );
}
