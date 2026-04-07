import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BackToDashboardLink } from "@/features/cml-core/components/BackToDashboardLink";
import { InlineNotice } from "@/features/cml-core/components/CmlStateScreens";
import { markBatchShipmentCollected } from "@/features/cml-core/api/cmlBatches";
import { findVendorShipmentByTrackingNumber } from "@/features/cml-core/api/cmlShipments";
import { buildCountryOptions, resolveStoredCountryCode } from "@/features/cml-core/lib/countries";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/lib/i18n";

const QUICK_COLLECTABLE_STATUSES = ["ready_for_pickup", "out_for_last_mile_delivery"];

function normalizeTrackingLookupValue(value) {
  const rawValue = String(value ?? "").trim();

  if (!rawValue) {
    return "";
  }

  const directMatch = rawValue.match(/\/track\/([^/?#]+)/i);

  if (directMatch?.[1]) {
    return decodeURIComponent(directMatch[1]).trim().toUpperCase();
  }

  try {
    const parsedUrl = new URL(rawValue);
    const pathMatch = parsedUrl.pathname.match(/\/track\/([^/?#]+)/i);

    if (pathMatch?.[1]) {
      return decodeURIComponent(pathMatch[1]).trim().toUpperCase();
    }
  } catch {
    // Fall back to treating the input as a tracking number.
  }

  return rawValue.toUpperCase();
}

function formatRouteLocation(city, countryCode, countryNameByCode) {
  const parts = [
    String(city ?? "").trim(),
    countryNameByCode[resolveStoredCountryCode(countryCode)] ?? resolveStoredCountryCode(countryCode),
  ].filter(Boolean);

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
    default:
      return "bg-slate-100 text-slate-800 border-slate-200";
  }
}

function DetailField({ label, value }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-sm leading-6 text-slate-900">{value}</p>
    </div>
  );
}

export default function ScanUpdatePage() {
  const { vendor } = useAuth();
  const { t, language } = useI18n();
  const [trackingInput, setTrackingInput] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isQuickUpdating, setIsQuickUpdating] = useState(false);
  const [scannerSupported, setScannerSupported] = useState(false);
  const [scannerChecked, setScannerChecked] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [scanResult, setScanResult] = useState({
    shipment: null,
    destinationBranch: null,
    batch: null,
  });
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const detectorRef = useRef(null);
  const scanFrameRef = useRef(null);

  const countryOptions = useMemo(() => buildCountryOptions(language), [language]);
  const countryNameByCode = useMemo(
    () => Object.fromEntries(countryOptions.map((countryOption) => [countryOption.code, countryOption.name])),
    [countryOptions],
  );

  const clearScannerResources = () => {
    if (scanFrameRef.current) {
      window.cancelAnimationFrame(scanFrameRef.current);
      scanFrameRef.current = null;
    }

    detectorRef.current = null;

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsScannerActive(false);
  };

  useEffect(() => {
    let isMounted = true;

    const checkScannerSupport = async () => {
      if (typeof window === "undefined" || typeof window.BarcodeDetector === "undefined") {
        if (isMounted) {
          setScannerSupported(false);
          setScannerChecked(true);
        }
        return;
      }

      try {
        const supportedFormats = typeof window.BarcodeDetector.getSupportedFormats === "function"
          ? await window.BarcodeDetector.getSupportedFormats()
          : null;

        if (!isMounted) {
          return;
        }

        setScannerSupported(!supportedFormats || supportedFormats.includes("qr_code"));
      } catch {
        if (!isMounted) {
          return;
        }

        setScannerSupported(true);
      } finally {
        if (isMounted) {
          setScannerChecked(true);
        }
      }
    };

    void checkScannerSupport();

    return () => {
      isMounted = false;
      clearScannerResources();
    };
  }, []);

  const lookupShipment = async (trackingValue) => {
    const normalizedTrackingNumber = normalizeTrackingLookupValue(trackingValue);

    if (!normalizedTrackingNumber) {
      setLookupError(t("scanUpdate.trackingRequired"));
      setScanResult({ shipment: null, destinationBranch: null, batch: null });
      return null;
    }

    if (!vendor?.id) {
      setLookupError(t("scanUpdate.noVendorBody"));
      setScanResult({ shipment: null, destinationBranch: null, batch: null });
      return null;
    }

    setTrackingInput(normalizedTrackingNumber);
    setIsLookingUp(true);
    setLookupError("");
    setSuccessMessage("");

    try {
      const nextResult = await findVendorShipmentByTrackingNumber({
        vendorId: vendor.id,
        trackingNumber: normalizedTrackingNumber,
      });

      if (!nextResult.shipment) {
        setScanResult({ shipment: null, destinationBranch: null, batch: null });
        setLookupError(t("scanUpdate.notFoundBody"));
        return null;
      }

      setScanResult(nextResult);
      return nextResult;
    } catch (error) {
      setScanResult({ shipment: null, destinationBranch: null, batch: null });
      setLookupError(error.message || t("errors.scanLookupFailed"));
      return null;
    } finally {
      setIsLookingUp(false);
    }
  };

  const processDetectedTrackingValue = async (detectedValue) => {
    clearScannerResources();
    const normalizedTrackingNumber = normalizeTrackingLookupValue(detectedValue);

    if (!normalizedTrackingNumber) {
      setScannerError(t("scanUpdate.scanInvalidResult"));
      return;
    }

    setScannerError("");
    setTrackingInput(normalizedTrackingNumber);
    await lookupShipment(normalizedTrackingNumber);
  };

  const runScannerFrame = async () => {
    if (!detectorRef.current || !videoRef.current) {
      return;
    }

    try {
      const barcodeResults = await detectorRef.current.detect(videoRef.current);
      const qrResult = barcodeResults.find((result) => String(result.rawValue ?? "").trim());

      if (qrResult?.rawValue) {
        await processDetectedTrackingValue(qrResult.rawValue);
        return;
      }
    } catch (error) {
      setScannerError(error.message || t("scanUpdate.scannerReadFailed"));
      clearScannerResources();
      return;
    }

    scanFrameRef.current = window.requestAnimationFrame(() => {
      void runScannerFrame();
    });
  };

  const handleStartScanner = async () => {
    if (!scannerSupported || typeof window === "undefined" || typeof window.BarcodeDetector === "undefined") {
      setScannerError(t("scanUpdate.scannerUnavailableBody"));
      return;
    }

    try {
      setScannerError("");
      setSuccessMessage("");
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
        },
        audio: false,
      });

      mediaStreamRef.current = mediaStream;
      detectorRef.current = new window.BarcodeDetector({ formats: ["qr_code"] });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      setIsScannerActive(true);
      scanFrameRef.current = window.requestAnimationFrame(() => {
        void runScannerFrame();
      });
    } catch (error) {
      setScannerError(error.message || t("scanUpdate.scannerStartFailed"));
      clearScannerResources();
    }
  };

  const handleLookupSubmit = async (event) => {
    event.preventDefault();
    await lookupShipment(trackingInput);
  };

  const handleQuickCollect = async () => {
    const { shipment } = scanResult;

    if (!shipment?.id || !shipment.batch_id || !vendor?.id) {
      return;
    }

    setIsQuickUpdating(true);
    setLookupError("");
    setSuccessMessage("");

    try {
      await markBatchShipmentCollected({
        vendorId: vendor.id,
        batchId: shipment.batch_id,
        shipmentId: shipment.id,
      });
      await lookupShipment(shipment.tracking_number);
      setSuccessMessage(t("scanUpdate.quickCollectSuccess"));
    } catch (error) {
      setLookupError(error.message || t("errors.scanQuickUpdateFailed"));
    } finally {
      setIsQuickUpdating(false);
    }
  };

  const shipment = scanResult.shipment;
  const destinationBranch = scanResult.destinationBranch;
  const canQuickCollect =
    Boolean(shipment?.batch_id) && QUICK_COLLECTABLE_STATUSES.includes(shipment?.status);
  const routeSummary = shipment
    ? `${formatRouteLocation(shipment.origin_city, shipment.origin_country, countryNameByCode)} -> ${formatRouteLocation(
        shipment.destination_city,
        shipment.destination_country,
        countryNameByCode,
      )}`
    : "";

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <BackToDashboardLink />
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          {t("scanUpdate.title")}
        </h1>
        <p className="max-w-3xl text-base leading-7 text-slate-600">
          {t("scanUpdate.description")}
        </p>
      </section>

      {!vendor ? (
        <InlineNotice
          title={t("scanUpdate.noVendorTitle")}
          description={t("scanUpdate.noVendorBody")}
          tone="warning"
        />
      ) : null}

      {successMessage ? (
        <InlineNotice title={t("scanUpdate.successTitle")} description={successMessage} />
      ) : null}

      {lookupError ? (
        <InlineNotice title={t("errors.title")} description={lookupError} tone="error" />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-slate-200 bg-white/95 shadow-lg">
          <CardHeader>
            <CardTitle>{t("scanUpdate.lookupTitle")}</CardTitle>
            <CardDescription>{t("scanUpdate.lookupDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-4" onSubmit={handleLookupSubmit}>
              <div className="space-y-2">
                <label
                  htmlFor="scan-update-tracking"
                  className="text-sm font-medium text-slate-950"
                >
                  {t("scanUpdate.trackingLabel")}
                </label>
                <Input
                  id="scan-update-tracking"
                  value={trackingInput}
                  onChange={(event) => setTrackingInput(event.target.value)}
                  placeholder={t("scanUpdate.trackingPlaceholder")}
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                />
                <p className="text-xs text-slate-500">{t("scanUpdate.trackingHelp")}</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={!vendor || isLookingUp}>
                  {isLookingUp ? t("common.loadingShort") : t("scanUpdate.lookupAction")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!trackingInput || isLookingUp}
                  onClick={() => {
                    setTrackingInput(normalizeTrackingLookupValue(trackingInput));
                  }}
                >
                  {t("scanUpdate.normalizeAction")}
                </Button>
              </div>
            </form>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-950">{t("scanUpdate.scannerTitle")}</p>
                <p className="text-sm leading-6 text-slate-600">
                  {t("scanUpdate.scannerDescription")}
                </p>
              </div>

              {!scannerChecked ? (
                <p className="mt-4 text-sm text-slate-600">{t("common.loadingShort")}</p>
              ) : null}

              {scannerChecked && !scannerSupported ? (
                <InlineNotice
                  title={t("scanUpdate.scannerUnavailableTitle")}
                  description={t("scanUpdate.scannerUnavailableBody")}
                  tone="neutral"
                />
              ) : null}

              {scannerChecked && scannerSupported ? (
                <div className="mt-4 space-y-4">
                  {scannerError ? (
                    <InlineNotice
                      title={t("scanUpdate.scannerErrorTitle")}
                      description={scannerError}
                      tone="error"
                    />
                  ) : null}

                  <div className="flex flex-wrap gap-3">
                    {!isScannerActive ? (
                      <Button type="button" variant="outline" onClick={handleStartScanner}>
                        {t("scanUpdate.startScanner")}
                      </Button>
                    ) : (
                      <Button type="button" variant="outline" onClick={clearScannerResources}>
                        {t("scanUpdate.stopScanner")}
                      </Button>
                    )}
                  </div>

                  {isScannerActive ? (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-900">
                      <video
                        ref={videoRef}
                        className="aspect-[4/3] w-full object-cover"
                        muted
                        playsInline
                      />
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white/95 shadow-lg">
          <CardHeader>
            <CardTitle>{t("scanUpdate.resultTitle")}</CardTitle>
            <CardDescription>{t("scanUpdate.resultDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!shipment ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
                <p className="font-medium text-slate-900">{t("scanUpdate.emptyTitle")}</p>
                <p className="mt-1">{t("scanUpdate.emptyBody")}</p>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      {t("scanUpdate.trackingLabel")}
                    </p>
                    <p className="text-xl font-semibold text-slate-950">{shipment.tracking_number}</p>
                    <p className="text-sm text-slate-600">{routeSummary}</p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getShipmentStatusBadgeClasses(shipment.status)}`}
                  >
                    {t(`batches.shipmentStatusOptions.${shipment.status}`)}
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <DetailField
                    label={t("scanUpdate.senderReceiver")}
                    value={`${shipment.sender_name || t("scanUpdate.notAvailable")} / ${shipment.receiver_name || t("scanUpdate.notAvailable")}`}
                  />
                  <DetailField
                    label={t("scanUpdate.destinationBranch")}
                    value={destinationBranch?.branch_name || t("scanUpdate.destinationBranchMissing")}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <DetailField
                    label={t("scanUpdate.destination")}
                    value={formatRouteLocation(
                      shipment.destination_city,
                      shipment.destination_country,
                      countryNameByCode,
                    ) || t("scanUpdate.notAvailable")}
                  />
                  <DetailField
                    label={t("scanUpdate.shippingMode")}
                    value={t(`shipmentIntake.shippingModeOptions.${shipment.shipping_mode}`)}
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button asChild>
                    <Link to={`/shipments/${shipment.id}`}>{t("scanUpdate.openShipmentDetail")}</Link>
                  </Button>
                  {canQuickCollect ? (
                    <Button type="button" variant="outline" disabled={isQuickUpdating} onClick={handleQuickCollect}>
                      {isQuickUpdating ? t("common.saving") : t("scanUpdate.quickCollectAction")}
                    </Button>
                  ) : null}
                </div>

                {shipment.batch_id && !canQuickCollect ? (
                  <p className="text-xs text-slate-500">{t("scanUpdate.quickActionHelp")}</p>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
