import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { BackToDashboardLink } from "@/features/cml-core/components/BackToDashboardLink";
import { InlineNotice } from "@/features/cml-core/components/CmlStateScreens";
import { listVendorShipments } from "@/features/cml-core/api/cmlShipments";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/lib/i18n";

const SHIPMENT_STATUSES = [
  "pending", "in_batch", "in_transit", "delayed", "customs_hold",
  "arrived", "ready_for_pickup", "out_for_last_mile_delivery",
  "collected", "returned", "cancelled",
];

const PAYMENT_STATUSES = ["paid", "partial", "unpaid"];

function getStatusBadgeClasses(status) {
  switch (status) {
    case "collected": return "border-green-200 bg-green-50 text-green-700";
    case "in_transit": case "shipped": return "border-blue-200 bg-blue-50 text-blue-700";
    case "arrived": case "ready_for_pickup": return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "delayed": case "customs_hold": return "border-amber-200 bg-amber-50 text-amber-700";
    case "cancelled": case "returned": return "border-red-200 bg-red-50 text-red-700";
    default: return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function getPaymentBadgeClasses(status) {
  switch (status) {
    case "paid": return "border-green-200 bg-green-50 text-green-700";
    case "partial": return "border-amber-200 bg-amber-50 text-amber-700";
    case "unpaid": return "border-red-200 bg-red-50 text-red-700";
    default: return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export default function ShipmentListPage() {
  const { vendor } = useAuth();
  const { t, language } = useI18n();
  const navigate = useNavigate();

  const [shipments, setShipments] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    if (!vendor?.id) return;

    let isActive = true;
    setIsLoading(true);
    setErrorMessage("");

    listVendorShipments(vendor.id, {
      search,
      statusFilter,
      paymentFilter,
      page,
      pageSize,
    })
      .then((result) => {
        if (!isActive) return;
        setShipments(result.shipments);
        setTotalCount(result.totalCount);
      })
      .catch((error) => {
        if (!isActive) return;
        setErrorMessage(error?.message || "Failed to load shipments.");
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => { isActive = false; };
  }, [vendor?.id, search, statusFilter, paymentFilter, page]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const formatDate = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(language === "fr" ? "fr-FR" : "en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
    return (dateString) => {
      if (!dateString) return "\u2014";
      try { return fmt.format(new Date(dateString)); }
      catch { return dateString; }
    };
  }, [language]);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value === "all" ? "" : value);
    setPage(1);
  };

  const handlePaymentFilterChange = (value) => {
    setPaymentFilter(value === "all" ? "" : value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <BackToDashboardLink />
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              {t("shipmentList.title")}
            </h1>
            <p className="mt-1 max-w-3xl text-base leading-7 text-slate-600">
              {t("shipmentList.description")}
            </p>
          </div>
          <Button asChild>
            <Link to="/shipments/new">{t("shipmentList.newShipment")}</Link>
          </Button>
        </div>
      </section>

      {errorMessage ? (
        <InlineNotice title={t("errors.title")} description={errorMessage} tone="error" />
      ) : null}

      <Card className="border-slate-200 bg-white/95 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1">
              <Input
                placeholder={t("shipmentList.searchPlaceholder")}
                value={search}
                onChange={handleSearchChange}
              />
            </div>
            <div className="w-[160px]">
              <Select value={statusFilter || "all"} onValueChange={handleStatusFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder={t("shipmentList.filterStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("shipmentList.filterAll")}</SelectItem>
                  {SHIPMENT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`shipmentList.statuses.${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-[160px]">
              <Select value={paymentFilter || "all"} onValueChange={handlePaymentFilterChange}>
                <SelectTrigger>
                  <SelectValue placeholder={t("shipmentList.filterPayment")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("shipmentList.filterAll")}</SelectItem>
                  {PAYMENT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`shipmentIntake.paymentStatusOptions.${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white/95 shadow-lg">
        <CardContent className="p-0">
          {isLoading ? (
            <SkeletonTable columns={7} rows={5} />
          ) : shipments.length === 0 ? (
            <EmptyState
              icon={Package}
              title={t("shipmentList.emptyTitle")}
              description={t("shipmentList.emptyBody")}
              action={<Button asChild><Link to="/shipments/new">{t("shipmentList.newShipment")}</Link></Button>}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("shipmentList.columns.tracking")}</TableHead>
                    <TableHead>{t("shipmentList.columns.sender")}</TableHead>
                    <TableHead>{t("shipmentList.columns.receiver")}</TableHead>
                    <TableHead>{t("shipmentList.columns.route")}</TableHead>
                    <TableHead>{t("shipmentList.columns.status")}</TableHead>
                    <TableHead>{t("shipmentList.columns.payment")}</TableHead>
                    <TableHead>{t("shipmentList.columns.date")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shipments.map((shipment) => (
                    <TableRow
                      key={shipment.id}
                      className="cursor-pointer hover:bg-slate-50"
                      onClick={() => navigate(`/shipments/${shipment.id}`)}
                    >
                      <TableCell className="font-mono text-sm font-medium">
                        {shipment.tracking_number}
                      </TableCell>
                      <TableCell className="text-sm">{shipment.sender_name || "\u2014"}</TableCell>
                      <TableCell className="text-sm">{shipment.receiver_name || "\u2014"}</TableCell>
                      <TableCell className="text-sm">
                        {shipment.origin_city || "\u2014"} \u2192 {shipment.destination_city || "\u2014"}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getStatusBadgeClasses(shipment.status)}`}>
                          {t(`shipmentList.statuses.${shipment.status}`)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getPaymentBadgeClasses(shipment.payment_status)}`}>
                          {t(`shipmentIntake.paymentStatusOptions.${shipment.payment_status}`)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {formatDate(shipment.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>

        {totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
            <p className="text-sm text-slate-600">
              {t("shipmentList.showing")} {(page - 1) * pageSize + 1}\u2013{Math.min(page * pageSize, totalCount)} {t("shipmentList.of")} {totalCount}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                {t("shipmentList.prev")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                {t("shipmentList.next")}
              </Button>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
