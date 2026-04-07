import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Users } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { BackToDashboardLink } from "@/features/cml-core/components/BackToDashboardLink";
import { InlineNotice } from "@/features/cml-core/components/CmlStateScreens";
import { listVendorCustomers } from "@/features/cml-core/api/cmlCustomers";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/lib/i18n";

export default function CustomerListPage() {
  const { vendor } = useAuth();
  const { t, language } = useI18n();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    if (!vendor?.id) return;
    let isActive = true;
    setIsLoading(true);
    setErrorMessage("");

    listVendorCustomers(vendor.id, { search, page, pageSize })
      .then((result) => {
        if (!isActive) return;
        setCustomers(result.customers);
        setTotalCount(result.totalCount);
      })
      .catch((error) => {
        if (!isActive) return;
        setErrorMessage(error?.message || "Failed to load customers.");
      })
      .finally(() => { if (isActive) setIsLoading(false); });

    return () => { isActive = false; };
  }, [vendor?.id, search, page]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const formatDate = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(language === "fr" ? "fr-FR" : "en-US", {
      year: "numeric", month: "short", day: "numeric",
    });
    return (dateString) => {
      if (!dateString) return "\u2014";
      try { return fmt.format(new Date(dateString)); } catch { return dateString; }
    };
  }, [language]);

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <BackToDashboardLink />
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          {t("customerList.title")}
        </h1>
        <p className="max-w-3xl text-base leading-7 text-slate-600">
          {t("customerList.description")}
        </p>
      </section>

      {errorMessage ? (
        <InlineNotice title={t("errors.title")} description={errorMessage} tone="error" />
      ) : null}

      <Card className="border-slate-200 bg-white/95 shadow-lg">
        <CardContent className="pt-6">
          <Input
            placeholder={t("customerList.searchPlaceholder")}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white/95 shadow-lg">
        <CardContent className="p-0">
          {isLoading ? (
            <SkeletonTable columns={5} rows={5} />
          ) : customers.length === 0 ? (
            <EmptyState
              icon={Users}
              title={t("customerList.emptyTitle")}
              description={t("customerList.emptyBody")}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("customerList.columns.name")}</TableHead>
                    <TableHead>{t("customerList.columns.phone")}</TableHead>
                    <TableHead>{t("customerList.columns.email")}</TableHead>
                    <TableHead>{t("customerList.columns.role")}</TableHead>
                    <TableHead>{t("customerList.columns.lastUpdated")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow
                      key={customer.id}
                      className="cursor-pointer hover:bg-slate-50"
                      onClick={() => navigate(`/customers/${customer.id}`)}
                    >
                      <TableCell className="text-sm font-medium">{customer.full_name || "\u2014"}</TableCell>
                      <TableCell className="font-mono text-sm">{customer.phone || "\u2014"}</TableCell>
                      <TableCell className="text-sm">{customer.email || "\u2014"}</TableCell>
                      <TableCell className="text-sm capitalize">{customer.last_role || "\u2014"}</TableCell>
                      <TableCell className="text-sm text-slate-500">{formatDate(customer.updated_at)}</TableCell>
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
              {t("customerList.showing")} {(page - 1) * pageSize + 1}\u2013{Math.min(page * pageSize, totalCount)} {t("customerList.of")} {totalCount}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                {t("customerList.prev")}
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                {t("customerList.next")}
              </Button>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
