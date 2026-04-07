import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BackToDashboardLink } from "@/features/cml-core/components/BackToDashboardLink";
import { InlineNotice } from "@/features/cml-core/components/CmlStateScreens";
import { openShipmentLabel } from "@/features/cml-core/lib/shippingLabel";
import { loadVendorShipmentDetail, updateVendorShipmentPayment } from "@/features/cml-core/api/cmlShipments";
import {
  addShipmentToBatch,
  createVendorBatch,
  listVendorAssignableBatches,
  removeShipmentFromBatch,
} from "@/features/cml-core/api/cmlBatches";
import { buildCountryOptions, resolveStoredCountryCode } from "@/features/cml-core/lib/countries";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/lib/i18n";

const DEFAULT_CURRENCY = "USD";
const PAYMENT_METHOD_OPTIONS = ["cash", "zelle", "cashapp", "mobile_money", "card", "other"];

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

function normalizeCurrencyCode(value) {
  const normalizedValue = String(value ?? "")
    .trim()
    .toUpperCase();

  return /^[A-Z]{3}$/.test(normalizedValue) ? normalizedValue : DEFAULT_CURRENCY;
}

function formatCurrencyAmount(amount, currencyCode, language) {
  const numericValue = Number.isFinite(Number(amount)) ? Number(amount) : 0;

  try {
    return new Intl.NumberFormat(language, {
      style: "currency",
      currency: normalizeCurrencyCode(currencyCode),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericValue);
  } catch {
    return `${numericValue.toFixed(2)} ${normalizeCurrencyCode(currencyCode)}`;
  }
}

function normalizeMoneyAmount(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? Number(numericValue.toFixed(2)) : 0;
}

function calculateAmountDue(totalPrice, amountPaid) {
  return Math.max(normalizeMoneyAmount(totalPrice) - normalizeMoneyAmount(amountPaid), 0);
}

function derivePaymentStatus(totalPrice, amountPaid) {
  const normalizedTotalPrice = normalizeMoneyAmount(totalPrice);
  const normalizedAmountPaid = normalizeMoneyAmount(amountPaid);

  if (normalizedTotalPrice <= 0) {
    return "paid";
  }

  if (normalizedAmountPaid <= 0) {
    return "unpaid";
  }

  if (normalizedAmountPaid >= normalizedTotalPrice) {
    return "paid";
  }

  return "partial";
}

function normalizePaymentMethodValue(value) {
  return PAYMENT_METHOD_OPTIONS.includes(value) ? value : "";
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

function getPaymentStatusBadgeClasses(status) {
  switch (status) {
    case "paid":
      return "bg-emerald-100 text-emerald-900 border-emerald-200";
    case "partial":
      return "bg-amber-100 text-amber-900 border-amber-200";
    case "unpaid":
    default:
      return "bg-slate-100 text-slate-800 border-slate-200";
  }
}

function RequiredLabel({ htmlFor, children }) {
  return (
    <Label htmlFor={htmlFor}>
      {children} <span className="text-red-600">*</span>
    </Label>
  );
}

function splitEtaFields(value) {
  if (!value) {
    return { etaDate: "", etaTime: "" };
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { etaDate: "", etaTime: "" };
  }

  const timezoneAdjustedDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  const normalizedValue = timezoneAdjustedDate.toISOString();

  return {
    etaDate: normalizedValue.slice(0, 10),
    etaTime: normalizedValue.slice(11, 16),
  };
}

function buildEtaValue(etaDate, etaTime) {
  if (!etaDate || !etaTime) {
    return null;
  }

  return `${etaDate}T${etaTime}`;
}

function DetailField({ label, value, emptyValue }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-sm leading-6 text-slate-900">{value || emptyValue}</p>
    </div>
  );
}

function ContactCard({ title, name, phone, whatsAppNumber, email, t }) {
  return (
    <Card className="border-slate-200 bg-white/95 shadow-lg">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <DetailField label={t("common.fullName")} value={name} emptyValue={t("shipmentDetail.notAvailable")} />
        <DetailField label={t("common.phone")} value={phone} emptyValue={t("shipmentDetail.notAvailable")} />
        <DetailField
          label={t("common.whatsAppNumber")}
          value={whatsAppNumber}
          emptyValue={t("shipmentDetail.notAvailable")}
        />
        <DetailField label={t("common.email")} value={email} emptyValue={t("shipmentDetail.notAvailable")} />
      </CardContent>
    </Card>
  );
}

function buildFallbackTimeline(shipment) {
  if (!shipment) {
    return [];
  }

  return [
    {
      id: `fallback-created-${shipment.id}`,
      created_at: shipment.created_at,
      status: shipment.status,
      event_kind: "created",
      batch: null,
    },
  ];
}

export default function ShipmentDetailPage() {
  const { shipmentId } = useParams();
  const { vendor } = useAuth();
  const { t, language } = useI18n();
  const [detail, setDetail] = useState({
    shipment: null,
    destinationBranch: null,
    batch: null,
    statusHistory: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [assignableBatches, setAssignableBatches] = useState([]);
  const [isLoadingAssignableBatches, setIsLoadingAssignableBatches] = useState(false);
  const [activeBatchAction, setActiveBatchAction] = useState("");
  const [activePaymentAction, setActivePaymentAction] = useState("");
  const [isOpeningLabel, setIsOpeningLabel] = useState(false);
  const [createBatchForm, setCreateBatchForm] = useState({
    batchName: "",
    etaDate: "",
    etaTime: "",
  });
  const [createBatchErrors, setCreateBatchErrors] = useState({});
  const [paymentForm, setPaymentForm] = useState({
    amountPaid: "0.00",
    paymentMethod: "",
    paymentNote: "",
  });
  const [paymentErrors, setPaymentErrors] = useState({});

  const countryOptions = useMemo(() => buildCountryOptions(language), [language]);
  const countryNameByCode = useMemo(
    () => Object.fromEntries(countryOptions.map((countryOption) => [countryOption.code, countryOption.name])),
    [countryOptions],
  );

  const refreshAssignableBatches = async ({ shipment: nextShipment, batch: nextBatch } = {}) => {
    const shipmentForRules = nextShipment ?? detail.shipment;
    const batchForRules = nextBatch ?? detail.batch;
    const shouldLoadAssignableBatches =
      vendor?.id && shipmentForRules && !shipmentForRules.batch_id && shipmentForRules.status === "pending" && !batchForRules;

    if (!shouldLoadAssignableBatches) {
      setAssignableBatches([]);
      setIsLoadingAssignableBatches(false);
      return;
    }

    setIsLoadingAssignableBatches(true);

    try {
      const nextAssignableBatches = await listVendorAssignableBatches(vendor.id);
      setAssignableBatches(nextAssignableBatches);
    } catch (error) {
      setErrorMessage(error.message || t("errors.batchLoadFailed"));
      setAssignableBatches([]);
    } finally {
      setIsLoadingAssignableBatches(false);
    }
  };

  const refreshShipmentDetail = async () => {
    if (!vendor?.id || !shipmentId) {
      setDetail({
        shipment: null,
        destinationBranch: null,
        batch: null,
        statusHistory: [],
      });
      setAssignableBatches([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const nextDetail = await loadVendorShipmentDetail({
        vendorId: vendor.id,
        shipmentId,
      });

      setDetail(nextDetail);
      await refreshAssignableBatches(nextDetail);
    } catch (error) {
      setErrorMessage(error.message || t("errors.shipmentDetailLoadFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isActive = true;

    const loadDetail = async () => {
      if (!vendor?.id || !shipmentId) {
        if (isActive) {
          setDetail({
            shipment: null,
            destinationBranch: null,
            batch: null,
            statusHistory: [],
          });
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      try {
        const nextDetail = await loadVendorShipmentDetail({
          vendorId: vendor.id,
          shipmentId,
        });

        if (isActive) {
          setDetail(nextDetail);
          const shouldLoadAssignableBatches =
            nextDetail.shipment &&
            !nextDetail.shipment.batch_id &&
            nextDetail.shipment.status === "pending" &&
            !nextDetail.batch;

          if (shouldLoadAssignableBatches) {
            setIsLoadingAssignableBatches(true);
            try {
              const nextAssignableBatches = await listVendorAssignableBatches(vendor.id);
              if (isActive) {
                setAssignableBatches(nextAssignableBatches);
              }
            } catch (batchError) {
              if (isActive) {
                setAssignableBatches([]);
                setErrorMessage(batchError.message || t("errors.batchLoadFailed"));
              }
            } finally {
              if (isActive) {
                setIsLoadingAssignableBatches(false);
              }
            }
          } else {
            setAssignableBatches([]);
            setIsLoadingAssignableBatches(false);
          }
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(error.message || t("errors.shipmentDetailLoadFailed"));
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadDetail();

    return () => {
      isActive = false;
    };
  }, [shipmentId, vendor?.id, t]);

  useEffect(() => {
    if (!detail.shipment) {
      setPaymentForm({
        amountPaid: "0.00",
        paymentMethod: "",
        paymentNote: "",
      });
      setPaymentErrors({});
      return;
    }

    setPaymentForm({
      amountPaid: normalizeMoneyAmount(detail.shipment.amount_paid).toFixed(2),
      paymentMethod: normalizePaymentMethodValue(detail.shipment.payment_method),
      paymentNote: detail.shipment.payment_note ?? "",
    });
    setPaymentErrors({});
  }, [
    detail.shipment?.id,
    detail.shipment?.amount_paid,
    detail.shipment?.payment_method,
    detail.shipment?.payment_note,
  ]);

  const shipment = detail.shipment;
  const destinationBranch = detail.destinationBranch;
  const linkedBatch = detail.batch;
  const statusHistory = detail.statusHistory?.length > 0 ? detail.statusHistory : buildFallbackTimeline(shipment);
  const currencyCode = normalizeCurrencyCode(shipment?.currency_code);
  const totalPriceAmount = normalizeMoneyAmount(shipment?.total_price);
  const currentAmountPaidValue = normalizeMoneyAmount(shipment?.amount_paid);
  const currentAmountDueValue = calculateAmountDue(totalPriceAmount, currentAmountPaidValue);
  const draftAmountPaidValue = Number.isFinite(Number(paymentForm.amountPaid))
    ? normalizeMoneyAmount(paymentForm.amountPaid)
    : null;
  const draftPaymentStatus =
    shipment && draftAmountPaidValue !== null
      ? derivePaymentStatus(totalPriceAmount, draftAmountPaidValue)
      : shipment?.payment_status ?? "unpaid";
  const draftAmountDueValue =
    shipment && draftAmountPaidValue !== null
      ? calculateAmountDue(totalPriceAmount, draftAmountPaidValue)
      : currentAmountDueValue;
  const operationalEta = linkedBatch?.eta_at || null;
  const isShipmentEligibleForBatchAssignment =
    Boolean(shipment && !shipment.batch_id && shipment.status === "pending");
  const canRemoveFromLinkedBatch = Boolean(linkedBatch?.id && linkedBatch.status === "open");
  const hasAssignableBatches = assignableBatches.length > 0;

  const routeSummary = shipment
    ? `${formatRouteLocation(
        shipment.origin_city,
        shipment.origin_country,
        countryNameByCode,
      )} -> ${formatRouteLocation(
        shipment.destination_city,
        shipment.destination_country,
        countryNameByCode,
      )}`
      : "";

  const handleOpenShippingLabel = async () => {
    if (!shipment) {
      return;
    }

    setIsOpeningLabel(true);
    setErrorMessage("");

    try {
      await openShipmentLabel({
        vendorName: vendor?.company_name,
        trackingNumber: shipment.tracking_number,
        senderName: shipment.sender_name,
        receiverName: shipment.receiver_name,
        destinationBranchName: destinationBranch?.branch_name,
        destinationLocation: formatRouteLocation(
          shipment.destination_city,
          shipment.destination_country,
          countryNameByCode,
        ),
        shippingModeLabel: t(`shipmentIntake.shippingModeOptions.${shipment.shipping_mode}`),
        weightLabel: `${shipment.weight_kg} kg`,
        contentsSummary: shipment.contents_description,
        paymentStatusLabel: t(`shipmentIntake.paymentStatusOptions.${shipment.payment_status}`),
        t,
      });
    } catch (error) {
      setErrorMessage(error.message || t("errors.labelGenerationFailed"));
    } finally {
      setIsOpeningLabel(false);
    }
  };

  const handleAssignToBatch = async (batchId) => {
    if (!vendor?.id || !shipment?.id) {
      return;
    }

    setActiveBatchAction(`assign:${batchId}`);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await addShipmentToBatch({
        vendorId: vendor.id,
        batchId,
        shipmentId: shipment.id,
      });
      setSuccessMessage(t("shipmentDetail.assignSuccess"));
      await refreshShipmentDetail();
    } catch (error) {
      setErrorMessage(error.message || t("errors.batchAssignmentFailed"));
    } finally {
      setActiveBatchAction("");
    }
  };

  const handleUnassignFromBatch = async () => {
    if (!vendor?.id || !shipment?.id || !linkedBatch?.id) {
      return;
    }

    setActiveBatchAction("unassign");
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await removeShipmentFromBatch({
        vendorId: vendor.id,
        batchId: linkedBatch.id,
        shipmentId: shipment.id,
      });
      setSuccessMessage(t("shipmentDetail.unassignSuccess"));
      await refreshShipmentDetail();
    } catch (error) {
      setErrorMessage(error.message || t("errors.batchAssignmentFailed"));
    } finally {
      setActiveBatchAction("");
    }
  };

  const handleCreateBatchChange = (event) => {
    const { name, value } = event.target;
    setCreateBatchForm((current) => ({ ...current, [name]: value }));
    setCreateBatchErrors((current) => ({ ...current, [name]: "" }));
  };

  const handlePaymentInputChange = (event) => {
    const { name, value } = event.target;
    setPaymentForm((current) => ({ ...current, [name]: value }));
    setPaymentErrors((current) => ({ ...current, [name]: "" }));
  };

  const handlePaymentMethodChange = (value) => {
    setPaymentForm((current) => ({ ...current, paymentMethod: value }));
  };

  const submitPaymentUpdate = async ({ nextAmountPaid, actionKey }) => {
    if (!vendor?.id || !shipment?.id) {
      return;
    }

    const nextErrors = {};
    const normalizedAmountPaid = Number(nextAmountPaid);

    if (!Number.isFinite(normalizedAmountPaid) || normalizedAmountPaid < 0) {
      nextErrors.amountPaid = t("shipmentDetail.amountPaidError");
    } else if (normalizedAmountPaid > totalPriceAmount + 0.0001) {
      nextErrors.amountPaid = t("shipmentDetail.amountPaidExceedsTotalError");
    }

    if (Object.keys(nextErrors).length > 0) {
      setPaymentErrors(nextErrors);
      return;
    }

    setActivePaymentAction(actionKey);
    setPaymentErrors({});
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await updateVendorShipmentPayment({
        vendorId: vendor.id,
        shipmentId: shipment.id,
        amountPaid: normalizedAmountPaid,
        paymentMethod: paymentForm.paymentMethod,
        paymentNote: paymentForm.paymentNote,
      });

      setSuccessMessage(t("shipmentDetail.paymentUpdateSuccess"));
      await refreshShipmentDetail();
    } catch (error) {
      setErrorMessage(error.message || t("errors.paymentUpdateFailed"));
    } finally {
      setActivePaymentAction("");
    }
  };

  const handleSavePaymentUpdate = async (event) => {
    event.preventDefault();
    await submitPaymentUpdate({
      nextAmountPaid: paymentForm.amountPaid,
      actionKey: "save",
    });
  };

  const handleMarkFullyPaid = async () => {
    await submitPaymentUpdate({
      nextAmountPaid: totalPriceAmount,
      actionKey: "mark-paid",
    });
  };

  const handleCreateBatchAndAssign = async (event) => {
    event.preventDefault();

    if (!vendor?.id || !shipment?.id) {
      return;
    }

    const nextErrors = {};

    if (!createBatchForm.batchName.trim()) {
      nextErrors.batchName = t("shipmentDetail.batchNameError");
    }

    if (createBatchForm.etaTime && !createBatchForm.etaDate) {
      nextErrors.etaDate = t("shipmentDetail.etaDateError");
    }

    if (createBatchForm.etaDate && !createBatchForm.etaTime) {
      nextErrors.etaTime = t("shipmentDetail.etaTimeError");
    }

    if (Object.keys(nextErrors).length > 0) {
      setCreateBatchErrors(nextErrors);
      return;
    }

    setActiveBatchAction("create");
    setCreateBatchErrors({});
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const createdBatch = await createVendorBatch({
        vendorId: vendor.id,
        batchName: createBatchForm.batchName,
        etaAt: buildEtaValue(createBatchForm.etaDate, createBatchForm.etaTime),
      });

      await addShipmentToBatch({
        vendorId: vendor.id,
        batchId: createdBatch.id,
        shipmentId: shipment.id,
      });

      setSuccessMessage(t("shipmentDetail.createAndAssignSuccess"));
      setCreateBatchForm({
        batchName: "",
        etaDate: "",
        etaTime: "",
      });
      await refreshShipmentDetail();
    } catch (error) {
      setErrorMessage(error.message || t("errors.batchSaveFailed"));
    } finally {
      setActiveBatchAction("");
    }
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <BackToDashboardLink />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-500">
              <Link to="/dashboard" className="hover:text-slate-900">
                {t("nav.dashboard")}
              </Link>
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              {t("shipmentDetail.title")}
            </h1>
            <p className="max-w-3xl text-base leading-7 text-slate-600">
              {t("shipmentDetail.description")}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {shipment ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleOpenShippingLabel}
                disabled={isOpeningLabel}
              >
                {isOpeningLabel ? t("shippingLabel.preparingAction") : t("shipmentDetail.openShippingLabel")}
              </Button>
            ) : null}
            {linkedBatch?.id ? (
              <Button asChild variant="outline">
                <Link to={`/batches/${linkedBatch.id}`}>{t("shipmentDetail.openLinkedBatch")}</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      {errorMessage ? (
        <InlineNotice title={t("errors.title")} description={errorMessage} tone="error" />
      ) : null}
      {successMessage ? (
        <InlineNotice title={t("shipmentDetail.successTitle")} description={successMessage} />
      ) : null}

      {!vendor ? (
        <InlineNotice
          title={t("shipmentDetail.noVendorTitle")}
          description={t("shipmentDetail.noVendorBody")}
          tone="warning"
        />
      ) : null}

      {isLoading ? (
        <Card className="border-slate-200 bg-white/95 shadow-lg">
          <CardContent className="py-8 text-sm text-slate-600">
            {t("shipmentDetail.loadingBody")}
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && vendor && !shipment ? (
        <InlineNotice
          title={t("shipmentDetail.notFoundTitle")}
          description={t("shipmentDetail.notFoundBody")}
          tone="warning"
        />
      ) : null}

      {!isLoading && shipment ? (
        <>
          <Card className="border-slate-200 bg-white/95 shadow-lg">
            <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl">{shipment.tracking_number}</CardTitle>
                <CardDescription>{routeSummary}</CardDescription>
              </div>
              <span
                className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getShipmentStatusBadgeClasses(shipment.status)}`}
              >
                {t(`batches.shipmentStatusOptions.${shipment.status}`)}
              </span>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {t("shipmentDetail.currentStatus")}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-950">
                  {t(`batches.shipmentStatusOptions.${shipment.status}`)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {t("shipmentDetail.createdAt")}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-950">
                  {formatDateTime(shipment.created_at, language)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {t("shipmentDetail.eta")}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-950">
                  {operationalEta ? formatDateTime(operationalEta, language) : t("shipmentDetail.etaEmpty")}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {t("shipmentDetail.etaHelp")}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {t("shipmentDetail.linkedBatch")}
                </p>
                {linkedBatch?.id ? (
                  <div className="mt-1 space-y-3">
                    <Link to={`/batches/${linkedBatch.id}`} className="inline-block text-sm font-medium text-slate-950 underline decoration-slate-300 underline-offset-4 hover:text-slate-700">
                      {linkedBatch.batch_name}
                    </Link>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700">
                        {t(`batches.statusOptions.${linkedBatch.status}`)}
                      </span>
                      {canRemoveFromLinkedBatch ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={activeBatchAction === "unassign"}
                          onClick={handleUnassignFromBatch}
                        >
                          {activeBatchAction === "unassign"
                            ? t("common.saving")
                            : t("shipmentDetail.removeFromBatch")}
                        </Button>
                      ) : null}
                    </div>
                    {!canRemoveFromLinkedBatch ? (
                      <p className="text-xs text-slate-500">
                        {t("shipmentDetail.removeFromBatchLocked")}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-1 text-sm font-medium text-slate-950">
                    {t("shipmentDetail.noLinkedBatch")}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            <ContactCard
              title={t("shipmentDetail.senderSection")}
              name={shipment.sender_name}
              phone={shipment.sender_phone}
              whatsAppNumber={shipment.sender_whatsapp_number}
              email={shipment.sender_email}
              t={t}
            />
            <ContactCard
              title={t("shipmentDetail.receiverSection")}
              name={shipment.receiver_name}
              phone={shipment.receiver_phone}
              whatsAppNumber={shipment.receiver_whatsapp_number}
              email={shipment.receiver_email}
              t={t}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <Card className="border-slate-200 bg-white/95 shadow-lg">
              <CardHeader>
                <CardTitle>{t("shipmentDetail.routeSection")}</CardTitle>
                <CardDescription>{t("shipmentDetail.routeSectionHelp")}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <DetailField
                  label={t("shipmentDetail.origin")}
                  value={formatRouteLocation(
                    shipment.origin_city,
                    shipment.origin_country,
                    countryNameByCode,
                  )}
                  emptyValue={t("shipmentDetail.notAvailable")}
                />
                <DetailField
                  label={t("shipmentDetail.destination")}
                  value={formatRouteLocation(
                    shipment.destination_city,
                    shipment.destination_country,
                    countryNameByCode,
                  )}
                  emptyValue={t("shipmentDetail.notAvailable")}
                />
                <DetailField
                  label={t("shipmentDetail.destinationBranch")}
                  value={
                    destinationBranch
                      ? `${destinationBranch.branch_name}${
                          destinationBranch.address_text ? ` - ${destinationBranch.address_text}` : ""
                        }`
                      : ""
                  }
                  emptyValue={t("shipmentDetail.destinationBranchMissing")}
                />
                <DetailField
                  label={t("shipmentDetail.shippingMode")}
                  value={t(`shipmentIntake.shippingModeOptions.${shipment.shipping_mode}`)}
                  emptyValue={t("shipmentDetail.notAvailable")}
                />
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white/95 shadow-lg">
              <CardHeader>
                <CardTitle>{t("shipmentDetail.parcelSection")}</CardTitle>
                <CardDescription>{t("shipmentDetail.parcelSectionHelp")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <DetailField
                  label={t("shipmentDetail.contentsDescription")}
                  value={shipment.contents_description}
                  emptyValue={t("shipmentDetail.notAvailable")}
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <DetailField
                    label={t("shipmentDetail.weight")}
                    value={shipment.weight_kg ? `${shipment.weight_kg} kg` : ""}
                    emptyValue={t("shipmentDetail.notAvailable")}
                  />
                  <DetailField
                    label={t("shipmentDetail.quantity")}
                    value={shipment.quantity ? String(shipment.quantity) : ""}
                    emptyValue={t("shipmentDetail.notAvailable")}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <DetailField
                    label={t("shipmentDetail.category")}
                    value={shipment.category}
                    emptyValue={t("shipmentDetail.notAvailable")}
                  />
                  <DetailField
                    label={t("shipmentDetail.referenceNote")}
                    value={shipment.reference_note}
                    emptyValue={t("shipmentDetail.referenceNoteEmpty")}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <Card className="border-slate-200 bg-white/95 shadow-lg">
              <CardHeader>
                <CardTitle>{t("shipmentDetail.pricingSection")}</CardTitle>
                <CardDescription>{t("shipmentDetail.pricingSectionHelp")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-600">{t("shipmentIntake.summaryBasePrice")}</span>
                  <span className="text-sm font-medium text-slate-950">
                    {formatCurrencyAmount(shipment.base_price, currencyCode, language)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-600">{t("shipmentIntake.summaryDiscount")}</span>
                  <span className="text-sm font-medium text-slate-950">
                    {formatCurrencyAmount(shipment.discount_amount, currencyCode, language)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
                  <span className="text-sm font-semibold text-slate-900">{t("shipmentIntake.summaryTotal")}</span>
                  <span className="text-sm font-semibold text-slate-950">
                    {formatCurrencyAmount(shipment.total_price, currencyCode, language)}
                  </span>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <DetailField
                      label={t("shipmentDetail.amountPaid")}
                      value={formatCurrencyAmount(currentAmountPaidValue, currencyCode, language)}
                      emptyValue={t("shipmentDetail.notAvailable")}
                    />
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <DetailField
                      label={t("shipmentDetail.amountDue")}
                      value={formatCurrencyAmount(currentAmountDueValue, currencyCode, language)}
                      emptyValue={t("shipmentDetail.notAvailable")}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      {t("shipmentDetail.paymentStatus")}
                    </p>
                    <div className="mt-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getPaymentStatusBadgeClasses(shipment.payment_status)}`}
                      >
                        {t(`shipmentIntake.paymentStatusOptions.${shipment.payment_status}`)}
                      </span>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <DetailField
                      label={t("shipmentDetail.paymentMethod")}
                      value={
                        normalizePaymentMethodValue(shipment.payment_method)
                          ? t(`shipmentDetail.paymentMethodOptions.${normalizePaymentMethodValue(shipment.payment_method)}`)
                          : ""
                      }
                      emptyValue={t("shipmentDetail.paymentMethodEmpty")}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <DetailField
                    label={t("shipmentDetail.paymentNote")}
                    value={shipment.payment_note}
                    emptyValue={t("shipmentDetail.paymentNoteEmpty")}
                  />
                </div>

                <form className="space-y-4 border-t border-slate-200 pt-6" onSubmit={handleSavePaymentUpdate}>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-950">
                      {t("shipmentDetail.paymentActionTitle")}
                    </p>
                    <p className="text-sm leading-6 text-slate-600">
                      {t("shipmentDetail.paymentActionDescription")}
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <RequiredLabel htmlFor="shipment-payment-amount-paid">
                        {t("shipmentDetail.amountPaidInput")}
                      </RequiredLabel>
                      <Input
                        id="shipment-payment-amount-paid"
                        name="amountPaid"
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        value={paymentForm.amountPaid}
                        onChange={handlePaymentInputChange}
                        aria-invalid={Boolean(paymentErrors.amountPaid)}
                      />
                      <p className={`text-xs ${paymentErrors.amountPaid ? "text-red-600" : "text-slate-500"}`}>
                        {paymentErrors.amountPaid || t("shipmentDetail.amountPaidHelp")}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="shipment-payment-method">{t("shipmentDetail.paymentMethod")}</Label>
                      <Select
                        value={paymentForm.paymentMethod || undefined}
                        onValueChange={handlePaymentMethodChange}
                      >
                        <SelectTrigger id="shipment-payment-method">
                          <SelectValue placeholder={t("shipmentDetail.paymentMethodPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_METHOD_OPTIONS.map((paymentMethod) => (
                            <SelectItem key={paymentMethod} value={paymentMethod}>
                              {t(`shipmentDetail.paymentMethodOptions.${paymentMethod}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-slate-500">{t("shipmentDetail.paymentMethodHelp")}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shipment-payment-note">{t("shipmentDetail.paymentNote")}</Label>
                    <Textarea
                      id="shipment-payment-note"
                      name="paymentNote"
                      value={paymentForm.paymentNote}
                      onChange={handlePaymentInputChange}
                      placeholder={t("shipmentDetail.paymentNotePlaceholder")}
                      rows={3}
                    />
                    <p className="text-xs text-slate-500">{t("shipmentDetail.paymentNoteHelp")}</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        {t("shipmentDetail.paymentStatus")}
                      </p>
                      <div className="mt-2">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getPaymentStatusBadgeClasses(draftPaymentStatus)}`}
                        >
                          {t(`shipmentIntake.paymentStatusOptions.${draftPaymentStatus}`)}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">{t("shipmentDetail.paymentStatusAutoHelp")}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        {t("shipmentDetail.amountDue")}
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-950">
                        {formatCurrencyAmount(draftAmountDueValue, currencyCode, language)}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">{t("shipmentDetail.amountDueHelp")}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button type="submit" disabled={Boolean(activePaymentAction)}>
                      {activePaymentAction === "save" ? t("common.saving") : t("shipmentDetail.savePaymentUpdate")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={Boolean(activePaymentAction)}
                      onClick={handleMarkFullyPaid}
                    >
                      {activePaymentAction === "mark-paid"
                        ? t("common.saving")
                        : t("shipmentDetail.markFullyPaid")}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white/95 shadow-lg">
              <CardHeader>
                <CardTitle>{t("shipmentDetail.timelineTitle")}</CardTitle>
                <CardDescription>{t("shipmentDetail.timelineDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                {statusHistory.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                    {t("shipmentDetail.timelineEmpty")}
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
                                {t(`shipmentDetail.timelineEventKinds.${entry.event_kind}`)}
                              </p>
                              <p className="text-xs text-slate-500">
                                {formatDateTime(entry.created_at, language)}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <span
                                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getShipmentStatusBadgeClasses(entry.status)}`}
                              >
                                {t(`batches.shipmentStatusOptions.${entry.status}`)}
                              </span>
                              {entry.batch?.id ? (
                                <Link
                                  to={`/batches/${entry.batch.id}`}
                                  className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                                >
                                  {t("shipmentDetail.timelineBatch")} {entry.batch.batch_name}
                                </Link>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-slate-200 bg-white/95 shadow-lg">
            <CardHeader>
              <CardTitle>{t("shipmentDetail.batchActionsTitle")}</CardTitle>
              <CardDescription>{t("shipmentDetail.batchActionsDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {linkedBatch?.id ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-sm font-medium text-slate-950">
                    {t("shipmentDetail.alreadyLinkedTitle")}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {canRemoveFromLinkedBatch
                      ? t("shipmentDetail.alreadyLinkedBodyEditable")
                      : t("shipmentDetail.alreadyLinkedBodyLocked")}
                  </p>
                </div>
              ) : null}

              {!linkedBatch?.id && !isShipmentEligibleForBatchAssignment ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-sm font-medium text-slate-950">
                    {t("shipmentDetail.notEligibleTitle")}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {t("shipmentDetail.notEligibleBody")}
                  </p>
                </div>
              ) : null}

              {!linkedBatch?.id && isShipmentEligibleForBatchAssignment ? (
                <>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-950">
                        {t("shipmentDetail.assignToExistingTitle")}
                      </p>
                      <p className="text-sm leading-6 text-slate-600">
                        {t("shipmentDetail.assignToExistingBody")}
                      </p>
                    </div>

                    {isLoadingAssignableBatches ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm text-slate-600">
                        {t("common.loading")}
                      </div>
                    ) : hasAssignableBatches ? (
                      <div className="grid gap-3 lg:grid-cols-2">
                        {assignableBatches.map((batchOption) => {
                          const { etaDate, etaTime } = splitEtaFields(batchOption.eta_at);
                          const etaPreview = buildEtaValue(etaDate, etaTime);

                          return (
                            <div
                              key={batchOption.id}
                              className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4"
                            >
                              <div className="space-y-1">
                                <p className="text-sm font-semibold text-slate-950">
                                  {batchOption.batch_name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {batchOption.shipment_count} {t("batches.shipmentCount")}
                                </p>
                              </div>
                              <div className="mt-3 grid gap-2 text-sm text-slate-700">
                                <div className="flex items-center justify-between gap-3">
                                  <span>{t("common.status")}</span>
                                  <span>{t(`batches.statusOptions.${batchOption.status}`)}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3">
                                  <span>{t("batches.eta")}</span>
                                  <span>{etaPreview ? formatDateTime(etaPreview, language) : t("batches.noEta")}</span>
                                </div>
                              </div>
                              <div className="mt-4 flex flex-wrap gap-3">
                                <Button
                                  type="button"
                                  disabled={activeBatchAction === `assign:${batchOption.id}`}
                                  onClick={() => handleAssignToBatch(batchOption.id)}
                                >
                                  {activeBatchAction === `assign:${batchOption.id}`
                                    ? t("common.saving")
                                    : t("shipmentDetail.assignToThisBatch")}
                                </Button>
                                <Button asChild type="button" variant="outline">
                                  <Link to={`/batches/${batchOption.id}`}>{t("shipmentDetail.openBatch")}</Link>
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                        {t("shipmentDetail.noAssignableBatches")}
                      </div>
                    )}
                  </div>

                  <form className="space-y-4 border-t border-slate-200 pt-6" onSubmit={handleCreateBatchAndAssign}>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-950">
                        {t("shipmentDetail.createBatchTitle")}
                      </p>
                      <p className="text-sm leading-6 text-slate-600">
                        {t("shipmentDetail.createBatchBody")}
                      </p>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_220px_180px_auto]">
                      <div className="space-y-2">
                        <RequiredLabel htmlFor="shipment-detail-batch-name">
                          {t("batches.batchName")}
                        </RequiredLabel>
                        <Input
                          id="shipment-detail-batch-name"
                          name="batchName"
                          value={createBatchForm.batchName}
                          onChange={handleCreateBatchChange}
                          placeholder={t("batches.batchNamePlaceholder")}
                        />
                        <p className={`text-xs ${createBatchErrors.batchName ? "text-red-600" : "text-slate-500"}`}>
                          {createBatchErrors.batchName || t("shipmentDetail.createBatchNameHelp")}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="shipment-detail-batch-eta-date">{t("batches.etaDate")}</Label>
                        <Input
                          id="shipment-detail-batch-eta-date"
                          name="etaDate"
                          type="date"
                          value={createBatchForm.etaDate}
                          onChange={handleCreateBatchChange}
                        />
                        <p className={`text-xs ${createBatchErrors.etaDate ? "text-red-600" : "text-slate-500"}`}>
                          {createBatchErrors.etaDate || t("batches.etaDateHelp")}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="shipment-detail-batch-eta-time">{t("batches.etaTime")}</Label>
                        <Input
                          id="shipment-detail-batch-eta-time"
                          name="etaTime"
                          type="time"
                          step="900"
                          value={createBatchForm.etaTime}
                          onChange={handleCreateBatchChange}
                        />
                        <p className={`text-xs ${createBatchErrors.etaTime ? "text-red-600" : "text-slate-500"}`}>
                          {createBatchErrors.etaTime || t("batches.etaTimeHelp")}
                        </p>
                      </div>

                      <div className="flex items-end">
                        <Button type="submit" disabled={activeBatchAction === "create"}>
                          {activeBatchAction === "create"
                            ? t("common.saving")
                            : t("shipmentDetail.createBatchAndAssign")}
                        </Button>
                      </div>
                    </div>
                  </form>
                </>
              ) : null}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
