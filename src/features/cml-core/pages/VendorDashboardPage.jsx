import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Boxes, Truck, CheckCircle, DollarSign, Plus, ScanLine, Settings } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabaseClient";

async function loadDashboardStats(vendorId) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [shipmentsRes, batchesRes, transitRes, collectedRes, unpaidRes] = await Promise.all([
    supabase.from("vendor_shipments").select("id", { count: "exact", head: true }).eq("vendor_id", vendorId),
    supabase.from("vendor_batches").select("id", { count: "exact", head: true }).eq("vendor_id", vendorId).not("status", "in", '("arrived","ready_for_pickup","out_for_last_mile_delivery")'),
    supabase.from("vendor_shipments").select("id", { count: "exact", head: true }).eq("vendor_id", vendorId).eq("status", "in_transit"),
    supabase.from("vendor_shipments").select("id", { count: "exact", head: true }).eq("vendor_id", vendorId).eq("status", "collected").gte("updated_at", monthStart),
    supabase.from("vendor_shipments").select("id", { count: "exact", head: true }).eq("vendor_id", vendorId).eq("payment_status", "unpaid"),
  ]);

  return {
    totalShipments: shipmentsRes.count ?? 0,
    activeBatches: batchesRes.count ?? 0,
    inTransit: transitRes.count ?? 0,
    collectedThisMonth: collectedRes.count ?? 0,
    unpaidShipments: unpaidRes.count ?? 0,
  };
}

export default function VendorDashboardPage() {
  const { vendor } = useAuth();
  const { t } = useI18n();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!vendor?.id) return;
    let isActive = true;
    loadDashboardStats(vendor.id)
      .then((data) => { if (isActive) setStats(data); })
      .catch(() => {})
      .finally(() => { if (isActive) setIsLoading(false); });
    return () => { isActive = false; };
  }, [vendor?.id]);

  const kpiCards = [
    { key: "totalShipments", icon: Package, label: t("dashboard.kpiTotal"), color: "text-blue-600 bg-blue-50" },
    { key: "activeBatches", icon: Boxes, label: t("dashboard.kpiBatches"), color: "text-purple-600 bg-purple-50" },
    { key: "inTransit", icon: Truck, label: t("dashboard.kpiTransit"), color: "text-amber-600 bg-amber-50" },
    { key: "collectedThisMonth", icon: CheckCircle, label: t("dashboard.kpiCollected"), color: "text-emerald-600 bg-emerald-50" },
    { key: "unpaidShipments", icon: DollarSign, label: t("dashboard.kpiUnpaid"), color: "text-red-600 bg-red-50" },
  ];

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          {t("dashboard.title")}
        </h1>
        <p className="mt-1 text-base leading-7 text-slate-600">
          {vendor?.company_name ?? t("dashboard.description")}
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpiCards.map((kpi) => (
          <Card key={kpi.key} className="border-slate-200 bg-white/95 shadow-sm transition hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${kpi.color}`}>
                <kpi.icon className="h-5 w-5" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="mb-1 h-7 w-12 rounded" />
                ) : (
                  <p className="text-2xl font-bold tracking-tight text-slate-950">
                    {stats?.[kpi.key] ?? 0}
                  </p>
                )}
                <p className="text-xs font-medium text-slate-500">{kpi.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { href: "/shipments/new", icon: Plus, labelKey: "dashboard.quickNewShipment", descKey: "dashboard.quickNewShipmentDesc" },
          { href: "/scan-update", icon: ScanLine, labelKey: "dashboard.quickScan", descKey: "dashboard.quickScanDesc" },
          { href: "/batches", icon: Boxes, labelKey: "dashboard.quickBatches", descKey: "dashboard.quickBatchesDesc" },
          { href: "/shipments", icon: Package, labelKey: "dashboard.quickShipments", descKey: "dashboard.quickShipmentsDesc" },
          { href: "/customers", icon: Package, labelKey: "dashboard.quickCustomers", descKey: "dashboard.quickCustomersDesc" },
          { href: "/settings/company-profile", icon: Settings, labelKey: "dashboard.quickSettings", descKey: "dashboard.quickSettingsDesc" },
        ].map((item) => (
          <Link key={item.href} to={item.href} className="group">
            <Card className="border-slate-200 bg-white/95 shadow-sm transition hover:border-slate-300 hover:shadow-md">
              <CardContent className="flex items-start gap-4 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition group-hover:bg-slate-900 group-hover:text-white">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{t(item.labelKey)}</p>
                  <p className="mt-0.5 text-xs leading-5 text-slate-500">{t(item.descKey)}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  );
}
