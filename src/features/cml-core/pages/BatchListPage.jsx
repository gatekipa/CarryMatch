import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Boxes } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonTable } from "@/components/ui/SkeletonTable";
import { listVendorBatches } from "@/features/cml-core/api/cmlBatches";
import { BackToDashboardLink } from "@/features/cml-core/components/BackToDashboardLink";
import { InlineNotice } from "@/features/cml-core/components/CmlStateScreens";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/lib/i18n";

function getBatchStatusBadgeClasses(status) {
  switch (status) {
    case "open":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "locked":
      return "bg-amber-100 text-amber-900 border-amber-200";
    case "shipped":
      return "bg-sky-100 text-sky-900 border-sky-200";
    case "delayed":
      return "bg-orange-100 text-orange-900 border-orange-200";
    case "customs_hold":
      return "bg-rose-100 text-rose-900 border-rose-200";
    case "arrived":
      return "bg-violet-100 text-violet-900 border-violet-200";
    case "ready_for_pickup":
      return "bg-indigo-100 text-indigo-900 border-indigo-200";
    case "out_for_last_mile_delivery":
      return "bg-cyan-100 text-cyan-900 border-cyan-200";
    default:
      return "bg-slate-100 text-slate-800 border-slate-200";
  }
}

function formatDateTime(value, language) {
  if (!value) {
    return null;
  }

  try {
    return new Intl.DateTimeFormat(language, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function BatchListPage() {
  const { t, language } = useI18n();
  const { vendor } = useAuth();
  const [batches, setBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const hasBatches = batches.length > 0;
  const formattedBatches = useMemo(
    () =>
      batches.map((batch) => ({
        ...batch,
        createdLabel: formatDateTime(batch.created_at, language),
        etaLabel: formatDateTime(batch.eta_at, language),
      })),
    [batches, language],
  );
  const listSummary = useMemo(() => {
    const editableBatchCount = batches.filter(
      (batch) => batch.status === "open" || batch.status === "locked",
    ).length;
    const groupedShipmentCount = batches.reduce(
      (total, batch) => total + Number(batch.shipment_count || 0),
      0,
    );

    return {
      totalBatchCount: batches.length,
      editableBatchCount,
      groupedShipmentCount,
    };
  }, [batches]);

  useEffect(() => {
    let isActive = true;

    const loadBatches = async () => {
      if (!vendor?.id) {
        if (isActive) {
          setBatches([]);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const nextBatches = await listVendorBatches(vendor.id);

        if (isActive) {
          setBatches(nextBatches);
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(error.message || t("errors.batchLoadFailed"));
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadBatches();

    return () => {
      isActive = false;
    };
  }, [vendor, t]);

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <BackToDashboardLink />
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            {t("batches.listTitle")}
          </h1>
          <p className="max-w-3xl text-base leading-7 text-slate-600">
            {t("batches.listDescription")}
          </p>
        </div>
      </section>

      {errorMessage ? (
        <InlineNotice title={t("errors.title")} description={errorMessage} tone="error" />
      ) : null}

      {!vendor ? (
        <InlineNotice
          title={t("batches.noVendorTitle")}
          description={t("batches.noVendorBody")}
          tone="warning"
        />
      ) : null}

      {!isLoading && vendor ? (
        <Card className="border-slate-200 bg-gradient-to-br from-white via-slate-50 to-sky-50 shadow-sm">
          <CardContent className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-950">{t("batches.summaryTitle")}</p>
                <p className="max-w-3xl text-sm leading-6 text-slate-600">
                  {hasBatches ? t("batches.summaryBody") : t("batches.emptyBody")}
                </p>
              </div>

              {hasBatches ? (
                <div className="flex flex-wrap gap-3">
                  <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm">
                    {listSummary.totalBatchCount} {t("batches.summaryTotalBatches")}
                  </div>
                  <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm text-emerald-900 shadow-sm">
                    {listSummary.editableBatchCount} {t("batches.summaryEditableBatches")}
                  </div>
                  <div className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-sm text-sky-900 shadow-sm">
                    {listSummary.groupedShipmentCount} {t("batches.summaryGroupedShipments")}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col items-stretch gap-2 sm:items-end">
              <Button asChild disabled={!vendor}>
                <Link to="/batches/new">
                  {hasBatches ? t("batches.createBatch") : t("batches.createFirstBatch")}
                </Link>
              </Button>
              <p className="text-xs text-slate-500 sm:max-w-xs sm:text-right">
                {t("batches.summaryCreateHint")}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {isLoading ? (
        <Card className="border-slate-200 bg-white/95 shadow-lg">
          <CardContent className="p-0">
            <SkeletonTable columns={4} rows={5} />
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !hasBatches && vendor ? (
        <Card className="border-slate-200 bg-white/95 shadow-lg">
          <CardContent className="p-0">
            <EmptyState
              icon={Boxes}
              title={t("batches.emptyTitle")}
              description={t("batches.emptyBody")}
              action={<Button asChild><Link to="/batches/new">{t("batches.createFirstBatch")}</Link></Button>}
            />
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && hasBatches ? (
        <Card className="border-slate-200 bg-white/95 shadow-lg">
          <CardHeader>
            <CardTitle>{t("batches.existingTitle")}</CardTitle>
            <CardDescription>{t("batches.existingDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formattedBatches.map((batch) => (
              <div
                key={batch.id}
                className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-semibold text-slate-950">{batch.batch_name}</h2>
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getBatchStatusBadgeClasses(batch.status)}`}
                      >
                        {t(`batches.statusOptions.${batch.status}`)}
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          {t("batches.eta")}
                        </p>
                        <p className="mt-1 text-sm text-slate-700">
                          {batch.etaLabel || t("batches.noEta")}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          {t("batches.shipmentCount")}
                        </p>
                        <p className="mt-1 text-sm text-slate-700">{batch.shipment_count}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          {t("batches.createdDate")}
                        </p>
                        <p className="mt-1 text-sm text-slate-700">{batch.createdLabel}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 xl:justify-end">
                    <Button asChild variant="outline">
                      <Link to={`/batches/${batch.id}`}>{t("batches.openBatch")}</Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
