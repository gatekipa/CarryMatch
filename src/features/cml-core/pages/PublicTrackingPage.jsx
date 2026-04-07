import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { loadPublicShipmentTracking } from "@/features/cml-core/api/cmlShipments";
import { InlineNotice } from "@/features/cml-core/components/CmlStateScreens";
import {
  getCustomerFacingStatusLabelKey,
  getCustomerFacingUpdateLabelKey,
} from "@/features/cml-core/lib/customerUpdates";
import { buildCountryOptions, resolveStoredCountryCode } from "@/features/cml-core/lib/countries";
import { useI18n } from "@/lib/i18n";

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

function getCountryName(countryCode, countryNameByCode) {
  const resolvedCode = resolveStoredCountryCode(countryCode);
  return countryNameByCode[resolvedCode] ?? resolvedCode;
}

function formatRouteLocation(city, countryCode, countryNameByCode) {
  const parts = [String(city ?? "").trim(), getCountryName(countryCode, countryNameByCode)].filter(Boolean);
  return parts.join(", ");
}

function getShipmentStatusBadgeClasses(status) {
  switch (status) {
    case "pending":
      return "bg-amber-100 text-amber-900 border-amber-200";
    case "in_batch":
      return "bg-emerald-100 text-emerald-900 border-emerald-200";
    case "in_transit":
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
    case "collected":
      return "bg-emerald-100 text-emerald-900 border-emerald-200";
    case "returned":
      return "bg-slate-200 text-slate-900 border-slate-300";
    case "cancelled":
      return "bg-slate-200 text-slate-900 border-slate-300";
    default:
      return "bg-slate-100 text-slate-800 border-slate-200";
  }
}

function DetailField({ label, value, emptyValue }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-sm leading-6 text-slate-900">{value || emptyValue}</p>
    </div>
  );
}

function normalizeTrackingInput(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase();
}

function buildFallbackTimeline(shipment) {
  if (!shipment) {
    return [];
  }

  return [
    {
      id: `public-fallback-${shipment.id}`,
      created_at: shipment.created_at,
      status: shipment.status,
      event_kind: "created",
    },
  ];
}

export default function PublicTrackingPage() {
  const navigate = useNavigate();
  const { trackingNumber = "" } = useParams();
  const { t, language } = useI18n();
  const [trackingInput, setTrackingInput] = useState(normalizeTrackingInput(trackingNumber));
  const [detail, setDetail] = useState({
    shipment: null,
    vendor: null,
    destinationBranch: null,
    statusHistory: [],
    operationalEtaAt: null,
  });
  const [isLoading, setIsLoading] = useState(Boolean(trackingNumber));
  const [errorMessage, setErrorMessage] = useState("");

  const countryOptions = useMemo(() => buildCountryOptions(language), [language]);
  const countryNameByCode = useMemo(
    () => Object.fromEntries(countryOptions.map((countryOption) => [countryOption.code, countryOption.name])),
    [countryOptions],
  );

  useEffect(() => {
    const normalizedTrackingNumber = normalizeTrackingInput(trackingNumber);
    setTrackingInput(normalizedTrackingNumber);

    if (!normalizedTrackingNumber) {
      setDetail({
        shipment: null,
        vendor: null,
        destinationBranch: null,
        statusHistory: [],
        operationalEtaAt: null,
      });
      setErrorMessage("");
      setIsLoading(false);
      return;
    }

    let isActive = true;

    const loadTracking = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const nextDetail = await loadPublicShipmentTracking(normalizedTrackingNumber);

        if (isActive) {
          setDetail(nextDetail);
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(error.message || t("errors.publicTrackingLoadFailed"));
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadTracking();

    return () => {
      isActive = false;
    };
  }, [trackingNumber, t]);

  const shipment = detail.shipment;
  const vendor = detail.vendor;
  const destinationBranch = detail.destinationBranch;
  const statusHistory = detail.statusHistory?.length > 0 ? detail.statusHistory : buildFallbackTimeline(shipment);
  const operationalEta = detail.operationalEtaAt || null;

  const handleSubmit = (event) => {
    event.preventDefault();

    const normalizedTrackingNumber = normalizeTrackingInput(trackingInput);
    if (!normalizedTrackingNumber) {
      return;
    }

    navigate(`/track/${encodeURIComponent(normalizedTrackingNumber)}`);
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-500">
            <Link to="/" className="hover:text-slate-900">
              {t("nav.landing")}
            </Link>
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            {t("publicTracking.title")}
          </h1>
          <p className="max-w-3xl text-base leading-7 text-slate-600">
            {t("publicTracking.description")}
          </p>
        </div>
      </section>

      <Card className="border-slate-200 bg-white/95 shadow-lg">
        <CardHeader>
          <CardTitle>{t("publicTracking.searchTitle")}</CardTitle>
          <CardDescription>{t("publicTracking.searchDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
            <Input
              value={trackingInput}
              onChange={(event) => setTrackingInput(normalizeTrackingInput(event.target.value))}
              placeholder={t("publicTracking.searchPlaceholder")}
              autoComplete="off"
              spellCheck={false}
            />
            <Button type="submit" disabled={!normalizeTrackingInput(trackingInput)} className="bg-brand hover:bg-brand-hover text-white">
              {t("publicTracking.searchAction")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {errorMessage ? (
        <InlineNotice title={t("errors.title")} description={errorMessage} tone="error" />
      ) : null}

      {isLoading ? (
        <Card className="border-slate-200 bg-white/95 shadow-lg">
          <CardContent className="py-8 text-sm text-slate-600">
            {t("publicTracking.loadingBody")}
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !trackingNumber ? (
        <InlineNotice
          title={t("publicTracking.emptyTitle")}
          description={t("publicTracking.emptyBody")}
        />
      ) : null}

      {!isLoading && trackingNumber && !shipment ? (
        <InlineNotice
          title={t("publicTracking.notFoundTitle")}
          description={t("publicTracking.notFoundBody")}
          tone="warning"
        />
      ) : null}

      {!isLoading && shipment ? (
        <>
          <Card className="border-slate-200 bg-white/95 shadow-lg">
            <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl">{shipment.tracking_number}</CardTitle>
                <CardDescription>{t("publicTracking.customerSafeNotice")}</CardDescription>
              </div>
              <span
                className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getShipmentStatusBadgeClasses(shipment.status)}`}
              >
                {t(getCustomerFacingStatusLabelKey(shipment.status))}
              </span>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {t("publicTracking.currentStatus")}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-950">
                  {t(getCustomerFacingStatusLabelKey(shipment.status))}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {t("publicTracking.createdAt")}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-950">
                  {formatDateTime(shipment.created_at, language)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {t("publicTracking.eta")}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-950">
                  {operationalEta ? formatDateTime(operationalEta, language) : t("publicTracking.etaEmpty")}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {t("publicTracking.etaHelp")}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {t("publicTracking.vendorReference")}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-950">
                  {vendor?.company_name || t("publicTracking.vendorReferenceUnavailable")}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <Card className="border-slate-200 bg-white/95 shadow-lg">
              <CardHeader>
                <CardTitle>{t("publicTracking.routeSection")}</CardTitle>
                <CardDescription>{t("publicTracking.routeSectionDescription")}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <DetailField
                  label={t("publicTracking.origin")}
                  value={formatRouteLocation(
                    shipment.origin_city,
                    shipment.origin_country,
                    countryNameByCode,
                  )}
                  emptyValue={t("publicTracking.notAvailable")}
                />
                <DetailField
                  label={t("publicTracking.destination")}
                  value={formatRouteLocation(
                    shipment.destination_city,
                    shipment.destination_country,
                    countryNameByCode,
                  )}
                  emptyValue={t("publicTracking.notAvailable")}
                />
                <DetailField
                  label={t("publicTracking.destinationBranch")}
                  value={
                    destinationBranch
                      ? `${destinationBranch.branch_name}${
                          destinationBranch.city ? ` - ${destinationBranch.city}` : ""
                        }`
                      : ""
                  }
                  emptyValue={t("publicTracking.destinationBranchMissing")}
                />
                <DetailField
                  label={t("publicTracking.shippingMode")}
                  value={t(`shipmentIntake.shippingModeOptions.${shipment.shipping_mode}`)}
                  emptyValue={t("publicTracking.notAvailable")}
                />
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white/95 shadow-lg">
              <CardHeader>
                <CardTitle>{t("publicTracking.summarySection")}</CardTitle>
                <CardDescription>{t("publicTracking.summarySectionDescription")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <DetailField
                  label={t("publicTracking.contentsDescription")}
                  value={shipment.contents_description}
                  emptyValue={t("publicTracking.notAvailable")}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <DetailField
                    label={t("publicTracking.category")}
                    value={shipment.category}
                    emptyValue={t("publicTracking.notAvailable")}
                  />
                  <DetailField
                    label={t("publicTracking.quantity")}
                    value={shipment.quantity ? String(shipment.quantity) : ""}
                    emptyValue={t("publicTracking.notAvailable")}
                  />
                </div>
                <DetailField
                  label={t("publicTracking.weight")}
                  value={shipment.weight_kg ? `${shipment.weight_kg} kg` : ""}
                  emptyValue={t("publicTracking.notAvailable")}
                />
                {destinationBranch?.address_text ? (
                  <DetailField
                    label={t("publicTracking.destinationBranchAddress")}
                    value={destinationBranch.address_text}
                    emptyValue={t("publicTracking.notAvailable")}
                  />
                ) : null}
              </CardContent>
            </Card>
          </div>

          <Card className="border-slate-200 bg-white/95 shadow-lg">
            <CardHeader>
              <CardTitle>{t("publicTracking.timelineTitle")}</CardTitle>
              <CardDescription>{t("publicTracking.timelineDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              {statusHistory.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                  {t("publicTracking.timelineEmpty")}
                </div>
              ) : (
                <div className="space-y-4">
                  {statusHistory.map((entry) => (
                    <div key={entry.id} className="relative pl-6">
                      <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-slate-900" />
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-slate-950">
                              {t(getCustomerFacingUpdateLabelKey(entry))}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-slate-900">
                              {formatDateTime(entry.created_at, language)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
