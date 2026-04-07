import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Printer, Tag, Lock } from "lucide-react";
import {
  BATCH_STATUS_TRANSITIONS,
  addShipmentToBatch,
  changeVendorBatchStatus,
  createVendorBatch,
  loadBatchDetail,
  markBatchShipmentCollected,
  removeShipmentFromBatch,
  updateVendorBatchDelayEta,
  updateVendorBatchBasics,
} from "@/features/cml-core/api/cmlBatches";
import { BackToDashboardLink } from "@/features/cml-core/components/BackToDashboardLink";
import { CollectionPhotoCapture } from "@/features/cml-core/components/CollectionPhotoCapture";
import { InlineNotice } from "@/features/cml-core/components/CmlStateScreens";
import { openBatchManifest } from "@/features/cml-core/lib/batchManifest";
import { openBatchLabels } from "@/features/cml-core/lib/batchLabels";
import { useSubscriptionGate } from "@/features/cml-core/lib/subscriptionGate";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/lib/i18n";

function RequiredLabel({ htmlFor, children }) {
  return (
    <Label htmlFor={htmlFor}>
      {children} <span className="text-red-600">*</span>
    </Label>
  );
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

function getShipmentRowClasses(tone) {
  if (tone === "available") {
    return "border-sky-200 bg-sky-50/70";
  }

  return "border-slate-200 bg-white";
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

const RECEIVING_STAGE_STATUSES = ["arrived", "ready_for_pickup", "out_for_last_mile_delivery"];
const COLLECTIBLE_SHIPMENT_STATUSES = ["ready_for_pickup", "out_for_last_mile_delivery"];
const ETA_DRIVEN_BATCH_STATUSES = ["delayed", "customs_hold"];

function getReceivingShipmentSortWeight(status) {
  switch (status) {
    case "ready_for_pickup":
      return 0;
    case "out_for_last_mile_delivery":
      return 1;
    case "arrived":
      return 2;
    case "collected":
      return 3;
    default:
      return 4;
  }
}

function ShipmentRow({ shipment, action, actionLabel, actionVariant = "outline", disabled, t, tone = "neutral" }) {
  const destinationBranchName =
    shipment.destination_branch?.branch_name || t("batches.shipmentDestinationBranchMissing");
  const destinationBranchLocation = shipment.destination_branch?.city || shipment.destination_city;
  const destinationLabel = shipment.destination_city || t("batches.shipmentDestinationMissing");

  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm sm:p-5 ${getShipmentRowClasses(tone)}`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {t("batches.shipmentTracking")}
                </p>
                <Link
                  to={`/shipments/${shipment.id}`}
                  className="text-base font-semibold text-slate-950 underline decoration-slate-300 underline-offset-4 hover:text-slate-700"
                >
                  {shipment.tracking_number}
                </Link>
              </div>
            <span
              className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getShipmentStatusBadgeClasses(shipment.status)}`}
            >
              {t(`batches.shipmentStatusOptions.${shipment.status}`)}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-white/70 bg-white/80 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {t("batches.shipmentReceiver")}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-700">{shipment.receiver_name}</p>
              <p className="mt-1 text-xs text-slate-500">
                {t("batches.shipmentSender")}: {shipment.sender_name}
              </p>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/80 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {t("batches.shipmentDestinationBranch")}
              </p>
              <p className="mt-1 text-sm text-slate-700">{destinationBranchName}</p>
              <p className="mt-1 text-xs text-slate-500">
                {destinationBranchLocation || t("batches.shipmentDestinationBranchLocationMissing")}
              </p>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/80 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {t("batches.shipmentDestination")}
              </p>
              <p className="mt-1 text-sm text-slate-700">{destinationLabel}</p>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/80 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {t("batches.shipmentMode")}
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {t(`shipmentIntake.shippingModeOptions.${shipment.shipping_mode}`)}
              </p>
            </div>
          </div>
        </div>

        {action ? (
          <div className="flex shrink-0 items-start lg:pl-4">
            <Button type="button" variant={actionVariant} disabled={disabled} onClick={action}>
              {actionLabel}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function BatchDetailPage() {
  const navigate = useNavigate();
  const { batchId } = useParams();
  const isCreateMode = !batchId || batchId === "new";
  const { t, language } = useI18n();
  const { vendor } = useAuth();
  const { canUseBatchPrint, canUsePhotoUpload } = useSubscriptionGate();
  const [batch, setBatch] = useState(null);
  const [batchShipments, setBatchShipments] = useState([]);
  const [pendingShipments, setPendingShipments] = useState([]);
  const [isLoading, setIsLoading] = useState(!isCreateMode);
  const [isSaving, setIsSaving] = useState(false);
  const [activeShipmentId, setActiveShipmentId] = useState("");
  const [activeStatus, setActiveStatus] = useState("");
  const [activeEtaAction, setActiveEtaAction] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [form, setForm] = useState({
    batchName: "",
    etaDate: "",
    etaTime: "",
  });
  const [delayEtaForm, setDelayEtaForm] = useState({
    etaDate: "",
    etaTime: "",
  });

  const isExistingBatchOpen = !isCreateMode && batch?.status === "open";
  const isExistingBatchLocked = !isCreateMode && batch?.status === "locked";
  const isReceivingStage = !isCreateMode && RECEIVING_STAGE_STATUSES.includes(batch?.status ?? "");
  const isBatchDetailsEditable = isCreateMode || isExistingBatchOpen;
  const isAssignmentEditable = !isCreateMode && batch?.status === "open";
  const nextStatusOptions = useMemo(
    () => (batch?.status ? BATCH_STATUS_TRANSITIONS[batch.status] ?? [] : []),
    [batch],
  );
  const reopenActionAvailable = isExistingBatchLocked && nextStatusOptions.includes("open");
  const standardNextStatusOptions = useMemo(
    () => nextStatusOptions.filter((status) => !(isExistingBatchLocked && status === "open")),
    [isExistingBatchLocked, nextStatusOptions],
  );
  const etaDrivenStatusOptions = useMemo(
    () => standardNextStatusOptions.filter((status) => ETA_DRIVEN_BATCH_STATUSES.includes(status)),
    [standardNextStatusOptions],
  );
  const regularNextStatusOptions = useMemo(
    () => standardNextStatusOptions.filter((status) => !ETA_DRIVEN_BATCH_STATUSES.includes(status)),
    [standardNextStatusOptions],
  );
  const canReviseDelayEta = !isCreateMode && ETA_DRIVEN_BATCH_STATUSES.includes(batch?.status ?? "");
  const draftEtaLabel = useMemo(() => {
    const nextEtaValue = buildEtaValue(form.etaDate, form.etaTime);
    return nextEtaValue ? formatDateTime(nextEtaValue, language) : null;
  }, [form.etaDate, form.etaTime, language]);
  const delayEtaPreviewLabel = useMemo(() => {
    const nextEtaValue = buildEtaValue(delayEtaForm.etaDate, delayEtaForm.etaTime);
    return nextEtaValue ? formatDateTime(nextEtaValue, language) : null;
  }, [delayEtaForm.etaDate, delayEtaForm.etaTime, language]);
  const sortedBatchShipments = useMemo(() => {
    if (!isReceivingStage) {
      return batchShipments;
    }

    return [...batchShipments].sort((left, right) => {
      const weightDifference =
        getReceivingShipmentSortWeight(left.status) - getReceivingShipmentSortWeight(right.status);

      if (weightDifference !== 0) {
        return weightDifference;
      }

      return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
    });
  }, [batchShipments, isReceivingStage]);
  const receivingCounts = useMemo(
    () =>
      batchShipments.reduce(
        (counts, shipment) => {
          counts[shipment.status] = (counts[shipment.status] ?? 0) + 1;
          return counts;
        },
        {
          arrived: 0,
          ready_for_pickup: 0,
          out_for_last_mile_delivery: 0,
          collected: 0,
        },
      ),
    [batchShipments],
  );

  const refreshBatchDetail = async () => {
    if (!vendor?.id || isCreateMode || !batchId) {
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const snapshot = await loadBatchDetail({ vendorId: vendor.id, batchId });

      setBatch(snapshot.batch);
      setBatchShipments(snapshot.batchShipments);
      setPendingShipments(snapshot.pendingShipments);

      if (snapshot.batch) {
        const nextEtaFields = splitEtaFields(snapshot.batch.eta_at);
        setForm({
          batchName: snapshot.batch.batch_name ?? "",
          ...nextEtaFields,
        });
        setDelayEtaForm(nextEtaFields);
      }
    } catch (error) {
      setErrorMessage(error.message || t("errors.batchLoadFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isCreateMode) {
      setBatch(null);
      setBatchShipments([]);
      setPendingShipments([]);
      setForm({ batchName: "", etaDate: "", etaTime: "" });
      setDelayEtaForm({ etaDate: "", etaTime: "" });
      setIsLoading(false);
      return;
    }

    void refreshBatchDetail();
  }, [vendor, batchId, isCreateMode]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
  };

  const handleDelayEtaChange = (event) => {
    const { name, value } = event.target;
    setDelayEtaForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({
      ...current,
      delayEtaDate: "",
      delayEtaTime: "",
    }));
  };

  const handleSaveBatch = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setFieldErrors({});

    const nextFieldErrors = {};

    if (!form.batchName.trim()) {
      nextFieldErrors.batchName = t("batches.batchNameError");
    }

    if (form.etaTime && !form.etaDate) {
      nextFieldErrors.etaDate = t("batches.etaDateError");
    }

    if (form.etaDate && !form.etaTime) {
      nextFieldErrors.etaTime = t("batches.etaTimeError");
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    if (!vendor?.id) {
      setErrorMessage(t("batches.noVendorBody"));
      return;
    }

    setIsSaving(true);

    try {
      const etaAt = buildEtaValue(form.etaDate, form.etaTime);

      if (isCreateMode) {
        const createdBatch = await createVendorBatch({
          vendorId: vendor.id,
          batchName: form.batchName,
          etaAt,
        });
        navigate(`/batches/${createdBatch.id}`, { replace: true });
        return;
      }

      const updatedBatch = await updateVendorBatchBasics({
        vendorId: vendor.id,
        batchId,
        batchName: form.batchName,
        etaAt,
      });

      setBatch(updatedBatch);
      setSuccessMessage(t("batches.saveSuccess"));
      await refreshBatchDetail();
    } catch (error) {
      setErrorMessage(error.message || t("errors.batchSaveFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (nextStatus) => {
    if (!vendor?.id || !batch) {
      return;
    }

    setActiveStatus(nextStatus);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const updatedBatch = await changeVendorBatchStatus({
        vendorId: vendor.id,
        batchId: batch.id,
        currentStatus: batch.status,
        nextStatus,
      });
      setBatch(updatedBatch);
      setSuccessMessage(
        batch.status === "locked" && nextStatus === "open"
          ? t("batches.reopenSuccess")
          : t("batches.statusSuccess"),
      );
      await refreshBatchDetail();
    } catch (error) {
      setErrorMessage(error.message || t("errors.batchStatusFailed"));
    } finally {
      setActiveStatus("");
    }
  };

  const handleDelayEtaAction = async (nextStatus) => {
    if (!vendor?.id || !batch?.id) {
      return;
    }

    const nextFieldErrors = {};

    if (delayEtaForm.etaTime && !delayEtaForm.etaDate) {
      nextFieldErrors.delayEtaDate = t("batches.delayEtaDateError");
    }

    if (delayEtaForm.etaDate && !delayEtaForm.etaTime) {
      nextFieldErrors.delayEtaTime = t("batches.delayEtaTimeError");
    }

    const nextEtaAt = buildEtaValue(delayEtaForm.etaDate, delayEtaForm.etaTime);

    if (!nextEtaAt) {
      nextFieldErrors.delayEtaDate = t("batches.delayEtaRequired");
      nextFieldErrors.delayEtaTime = t("batches.delayEtaRequired");
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors((current) => ({ ...current, ...nextFieldErrors }));
      return;
    }

    setActiveEtaAction(nextStatus);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const updatedBatch =
        nextStatus === batch.status
          ? await updateVendorBatchDelayEta({
              vendorId: vendor.id,
              batchId: batch.id,
              currentStatus: batch.status,
              etaAt: nextEtaAt,
            })
          : await changeVendorBatchStatus({
              vendorId: vendor.id,
              batchId: batch.id,
              currentStatus: batch.status,
              nextStatus,
              etaAt: nextEtaAt,
            });

      setBatch(updatedBatch);
      setSuccessMessage(
        nextStatus === batch.status ? t("batches.delayEtaUpdateSuccess") : t("batches.delayStatusSuccess"),
      );
      await refreshBatchDetail();
    } catch (error) {
      setErrorMessage(error.message || t("errors.batchStatusFailed"));
    } finally {
      setActiveEtaAction("");
    }
  };

  const handleAddShipment = async (shipmentId) => {
    if (!vendor?.id || !batch?.id) {
      return;
    }

    setActiveShipmentId(shipmentId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await addShipmentToBatch({ vendorId: vendor.id, batchId: batch.id, shipmentId });
      setSuccessMessage(t("batches.addShipmentSuccess"));
      await refreshBatchDetail();
    } catch (error) {
      setErrorMessage(error.message || t("errors.batchAssignmentFailed"));
    } finally {
      setActiveShipmentId("");
    }
  };

  const handleRemoveShipment = async (shipmentId) => {
    if (!vendor?.id || !batch?.id) {
      return;
    }

    setActiveShipmentId(shipmentId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await removeShipmentFromBatch({ vendorId: vendor.id, batchId: batch.id, shipmentId });
      setSuccessMessage(t("batches.removeShipmentSuccess"));
      await refreshBatchDetail();
    } catch (error) {
      setErrorMessage(error.message || t("errors.batchAssignmentFailed"));
    } finally {
      setActiveShipmentId("");
    }
  };

  const handleMarkCollected = async (shipmentId) => {
    if (!vendor?.id || !batch?.id) {
      return;
    }

    setActiveShipmentId(shipmentId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await markBatchShipmentCollected({ vendorId: vendor.id, batchId: batch.id, shipmentId });
      setSuccessMessage(t("batches.markCollectedSuccess"));
      await refreshBatchDetail();
    } catch (error) {
      setErrorMessage(error.message || t("errors.shipmentCollectionFailed"));
    } finally {
      setActiveShipmentId("");
    }
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <BackToDashboardLink />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-500">
              <Link to="/batches" className="hover:text-slate-900">
                {t("batches.listTitle")}
              </Link>
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              {isCreateMode ? t("batches.createTitle") : t("batches.detailTitle")}
            </h1>
            {!isCreateMode && batch ? (
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getBatchStatusBadgeClasses(batch.status)}`}
              >
                {t(`batches.statusOptions.${batch.status}`)}
              </span>
            ) : null}
            <p className="max-w-3xl text-base leading-7 text-slate-600">
              {isCreateMode ? t("batches.createDescription") : t("batches.detailDescription")}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {!isCreateMode ? (
              <Button asChild variant="outline">
                <Link to="/batches">{t("batches.backToList")}</Link>
              </Button>
            ) : null}
            {!isCreateMode ? (
              <Button asChild variant="outline">
                <Link to="/batches/new">{t("batches.createBatch")}</Link>
              </Button>
            ) : null}
            {!isCreateMode && batchShipments.length > 0 && canUseBatchPrint ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    openBatchManifest({
                      batchName: batch?.batch_name || "",
                      etaAt: batch?.eta_at,
                      shipments: batchShipments,
                      vendorName: vendor?.company_name || "",
                      t,
                      language,
                    })
                  }
                >
                  <Printer className="mr-1.5 h-4 w-4" /> {t("batchManifest.printManifest")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    openBatchLabels({
                      shipments: batchShipments,
                      vendor,
                      destinationBranches: batchShipments
                        .map((s) => s.destination_branch)
                        .filter(Boolean),
                      t,
                    })
                  }
                >
                  <Tag className="mr-1.5 h-4 w-4" /> {t("batchManifest.printLabels")}
                </Button>
              </>
            ) : null}
            {!isCreateMode && batchShipments.length > 0 && !canUseBatchPrint ? (
              <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2">
                <Lock className="h-4 w-4 text-slate-400" />
                <p className="text-xs text-slate-500">{t("batchManifest.proRequired")}</p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {successMessage ? <InlineNotice title={t("batches.successTitle")} description={successMessage} /> : null}
      {errorMessage ? <InlineNotice title={t("errors.title")} description={errorMessage} tone="error" /> : null}

      {!vendor ? (
        <InlineNotice
          title={t("batches.noVendorTitle")}
          description={t("batches.noVendorBody")}
          tone="warning"
        />
      ) : null}

      {isLoading ? (
        <Card className="border-slate-200 bg-white/95 shadow-lg">
          <CardContent className="py-8 text-sm text-slate-600">{t("common.loading")}</CardContent>
        </Card>
      ) : null}

      {!isLoading && !isCreateMode && !batch ? (
        <InlineNotice
          title={t("batches.notFoundTitle")}
          description={t("batches.notFoundBody")}
          tone="warning"
        />
      ) : null}

      {!isLoading && (isCreateMode || batch) ? (
        <>
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
            <form className="space-y-4" onSubmit={handleSaveBatch}>
              <Card className="border-slate-200 bg-white/95 shadow-lg">
                <CardHeader className="space-y-4">
                  <div className="space-y-2">
                    <CardTitle>{t("batches.batchDetailsTitle")}</CardTitle>
                    <CardDescription>{t("batches.batchDetailsDescription")}</CardDescription>
                  </div>

                  {isCreateMode ? (
                    <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4">
                      <p className="text-sm font-semibold text-sky-950">{t("batches.createPanelTitle")}</p>
                      <p className="mt-1 text-sm leading-6 text-sky-900">
                        {t("batches.createPanelBody")}
                      </p>
                    </div>
                  ) : null}
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_220px_180px]">
                    <div className="space-y-2 xl:col-span-1">
                      <RequiredLabel htmlFor="batch-name">{t("batches.batchName")}</RequiredLabel>
                      <Input
                        id="batch-name"
                        name="batchName"
                        value={form.batchName}
                        onChange={handleChange}
                        placeholder={t("batches.batchNamePlaceholder")}
                        disabled={!vendor || !isBatchDetailsEditable}
                      />
                      <p className={`text-xs ${fieldErrors.batchName ? "text-red-600" : "text-slate-500"}`}>
                        {fieldErrors.batchName || t("batches.batchNameHelp")}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="batch-eta-date">{t("batches.etaDate")}</Label>
                      <Input
                        id="batch-eta-date"
                        name="etaDate"
                        type="date"
                        value={form.etaDate}
                        onChange={handleChange}
                        disabled={!vendor || !isBatchDetailsEditable}
                      />
                      <p className={`text-xs ${fieldErrors.etaDate ? "text-red-600" : "text-slate-500"}`}>
                        {fieldErrors.etaDate || t("batches.etaDateHelp")}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="batch-eta-time">{t("batches.etaTime")}</Label>
                      <Input
                        id="batch-eta-time"
                        name="etaTime"
                        type="time"
                        step="900"
                        value={form.etaTime}
                        onChange={handleChange}
                        disabled={!vendor || !isBatchDetailsEditable}
                      />
                      <p className={`text-xs ${fieldErrors.etaTime ? "text-red-600" : "text-slate-500"}`}>
                        {fieldErrors.etaTime || t("batches.etaTimeHelp")}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      {t("batches.etaPreviewTitle")}
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      {draftEtaLabel || t("batches.etaPreviewEmpty")}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {t("batches.etaPropagationHelp")}
                    </p>
                  </div>

                  {!isCreateMode && !isBatchDetailsEditable ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm leading-6 text-amber-900">
                      {isExistingBatchLocked
                        ? t("batches.detailsLockedNotice")
                        : t("batches.detailsReadOnlyNotice")}
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="max-w-2xl text-sm leading-6 text-slate-500">
                      {isCreateMode
                        ? t("batches.saveCreateHint")
                        : isBatchDetailsEditable
                          ? t("batches.saveEditHint")
                          : isExistingBatchLocked
                            ? t("batches.reopenBody")
                            : t("batches.detailsReadOnlyNotice")}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {!isCreateMode ? (
                        <Button asChild type="button" variant="outline">
                          <Link to="/batches">{t("batches.backToList")}</Link>
                        </Button>
                      ) : null}
                      {isBatchDetailsEditable ? (
                        <Button type="submit" disabled={isSaving || !vendor}>
                          {isSaving
                            ? t("common.saving")
                            : isCreateMode
                              ? t("batches.createBatch")
                              : t("batches.saveBatch")}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </form>

            <Card className="border-slate-200 bg-white/95 shadow-lg">
              <CardHeader>
                <CardTitle>
                  {isCreateMode ? t("batches.createPanelTitle") : t("batches.statusSectionTitle")}
                </CardTitle>
                <CardDescription>
                  {isCreateMode ? t("batches.createPanelNext") : t("batches.statusSectionDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {isCreateMode ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          {t("common.status")}
                        </p>
                        <p className="mt-1 text-sm text-slate-900">{t("batches.statusOptions.open")}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          {t("batches.eta")}
                        </p>
                        <p className="mt-1 text-sm text-slate-900">
                          {draftEtaLabel || t("batches.noEta")}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-700">
                      <p>{t("batches.createPanelStepOne")}</p>
                      <p>{t("batches.createPanelStepTwo")}</p>
                      <p>{t("batches.createPanelStepThree")}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          {t("common.status")}
                        </p>
                        <div className="mt-2">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getBatchStatusBadgeClasses(batch.status)}`}
                          >
                            {t(`batches.statusOptions.${batch.status}`)}
                          </span>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          {t("batches.shipmentCount")}
                        </p>
                        <p className="mt-1 text-sm text-slate-900">{batchShipments.length}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          {t("batches.createdDate")}
                        </p>
                        <p className="mt-1 text-sm text-slate-900">
                          {formatDateTime(batch.created_at, language)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          {t("batches.eta")}
                        </p>
                        <p className="mt-1 text-sm text-slate-900">
                          {batch.eta_at ? formatDateTime(batch.eta_at, language) : t("batches.noEta")}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-950">
                          {t("batches.statusActionsTitle")}
                        </p>
                        <p className="text-sm leading-6 text-slate-600">
                          {t("batches.statusActionsDescription")}
                        </p>
                      </div>

                      {isReceivingStage ? (
                        <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4">
                          <p className="text-sm font-semibold text-sky-950">
                            {t("batches.receivingStageTitle")}
                          </p>
                          <p className="mt-1 text-sm leading-6 text-sky-900">
                            {t(`batches.receivingStageDescriptions.${batch.status}`)}
                          </p>
                        </div>
                      ) : null}

                      {etaDrivenStatusOptions.length > 0 || canReviseDelayEta ? (
                        <div className="rounded-2xl border border-orange-200 bg-orange-50/80 p-4">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-orange-950">
                              {t("batches.delayEtaTitle")}
                            </p>
                            <p className="text-sm leading-6 text-orange-900">
                              {canReviseDelayEta
                                ? t(`batches.delayEtaDescriptions.${batch.status}`)
                                : t("batches.delayEtaDescription")}
                            </p>
                          </div>

                          <div className="mt-4 grid gap-4 sm:grid-cols-[220px_180px]">
                            <div className="space-y-2">
                              <Label htmlFor="batch-delay-eta-date">{t("batches.etaDate")}</Label>
                              <Input
                                id="batch-delay-eta-date"
                                name="etaDate"
                                type="date"
                                value={delayEtaForm.etaDate}
                                onChange={handleDelayEtaChange}
                                disabled={!vendor}
                              />
                              <p className={`text-xs ${fieldErrors.delayEtaDate ? "text-red-600" : "text-slate-500"}`}>
                                {fieldErrors.delayEtaDate || t("batches.delayEtaDateHelp")}
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="batch-delay-eta-time">{t("batches.etaTime")}</Label>
                              <Input
                                id="batch-delay-eta-time"
                                name="etaTime"
                                type="time"
                                step="900"
                                value={delayEtaForm.etaTime}
                                onChange={handleDelayEtaChange}
                                disabled={!vendor}
                              />
                              <p className={`text-xs ${fieldErrors.delayEtaTime ? "text-red-600" : "text-slate-500"}`}>
                                {fieldErrors.delayEtaTime || t("batches.delayEtaTimeHelp")}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 rounded-2xl border border-white/70 bg-white/80 p-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                              {t("batches.delayEtaPreviewTitle")}
                            </p>
                            <p className="mt-1 text-sm text-slate-700">
                              {delayEtaPreviewLabel || t("batches.etaPreviewEmpty")}
                            </p>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-3">
                            {etaDrivenStatusOptions.map((nextStatus) => (
                              <Button
                                key={nextStatus}
                                type="button"
                                variant="outline"
                                disabled={activeEtaAction === nextStatus}
                                onClick={() => handleDelayEtaAction(nextStatus)}
                              >
                                {activeEtaAction === nextStatus
                                  ? t("common.saving")
                                  : `${t("batches.saveEtaAndChangePrefix")} ${t(`batches.statusOptions.${nextStatus}`)}`}
                              </Button>
                            ))}

                            {canReviseDelayEta ? (
                              <Button
                                type="button"
                                disabled={activeEtaAction === batch.status}
                                onClick={() => handleDelayEtaAction(batch.status)}
                              >
                                {activeEtaAction === batch.status
                                  ? t("common.saving")
                                  : t("batches.updateEtaOnly")}
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      ) : null}

                      {reopenActionAvailable ? (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-amber-950">
                              {t("batches.reopenTitle")}
                            </p>
                            <p className="text-sm leading-6 text-amber-900">
                              {t("batches.reopenBody")}
                            </p>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-3">
                            <Button
                              type="button"
                              variant="outline"
                              disabled={activeStatus === "open"}
                              onClick={() => handleStatusChange("open")}
                            >
                              {activeStatus === "open" ? t("common.saving") : t("batches.reopenBatch")}
                            </Button>
                          </div>
                        </div>
                      ) : null}

                      <div className="flex flex-wrap gap-3">
                        {regularNextStatusOptions.length === 0 ? (
                          <p className="text-sm text-slate-500">{t("batches.noFurtherStatusActions")}</p>
                        ) : (
                          regularNextStatusOptions.map((nextStatus) => (
                            <Button
                              key={nextStatus}
                              type="button"
                              variant="outline"
                              disabled={activeStatus === nextStatus}
                              onClick={() => handleStatusChange(nextStatus)}
                            >
                              {activeStatus === nextStatus
                                ? t("common.saving")
                                : `${t("batches.changeStatusPrefix")} ${t(`batches.statusOptions.${nextStatus}`)}`}
                            </Button>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {!isCreateMode && batch ? (
            <>
              {isReceivingStage ? (
                <div className="space-y-6">
                  <Card className="border-slate-200 bg-white/95 shadow-lg">
                    <CardHeader>
                      <CardTitle>{t("batches.receivingSummaryTitle")}</CardTitle>
                      <CardDescription>{t("batches.receivingSummaryDescription")}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          {t("batches.statusOptions.arrived")}
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-slate-950">
                          {receivingCounts.arrived}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          {t("batches.statusOptions.ready_for_pickup")}
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-slate-950">
                          {receivingCounts.ready_for_pickup}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          {t("batches.statusOptions.out_for_last_mile_delivery")}
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-slate-950">
                          {receivingCounts.out_for_last_mile_delivery}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          {t("batches.shipmentStatusOptions.collected")}
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-slate-950">
                          {receivingCounts.collected}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-200 bg-white/95 shadow-lg">
                    <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <CardTitle>{t("batches.pickupManagementTitle")}</CardTitle>
                        <CardDescription>{t("batches.pickupManagementDescription")}</CardDescription>
                      </div>
                      <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                        {batchShipments.length} {t("batches.shipmentCount")}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {sortedBatchShipments.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
                          {t("batches.inBatchEmpty")}
                        </div>
                      ) : (
                        sortedBatchShipments.map((shipment) => {
                          const canMarkCollected =
                            COLLECTIBLE_SHIPMENT_STATUSES.includes(batch.status) &&
                            COLLECTIBLE_SHIPMENT_STATUSES.includes(shipment.status);

                          return (
                            <div key={shipment.id} className="space-y-3">
                              <ShipmentRow
                                shipment={shipment}
                                t={t}
                                tone="neutral"
                                action={canMarkCollected ? () => handleMarkCollected(shipment.id) : undefined}
                                actionLabel={t("batches.markCollected")}
                                actionVariant="default"
                                disabled={activeShipmentId === shipment.id}
                              />
                              {canMarkCollected ? (
                                <div className="ml-4">
                                  <CollectionPhotoCapture
                                    vendorId={vendor?.id}
                                    shipmentId={shipment.id}
                                    existingPhotoUrl={shipment.collection_photo_url}
                                    canUsePhotoUpload={canUsePhotoUpload}
                                    onPhotoUploaded={() => refreshBatchDetail()}
                                  />
                                </div>
                              ) : null}
                            </div>
                          );
                        })
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="grid gap-6 xl:grid-cols-2">
                  <Card className="border-slate-200 bg-white/95 shadow-lg">
                    <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <CardTitle>{t("batches.inBatchTitle")}</CardTitle>
                        <CardDescription>{t("batches.inBatchDescription")}</CardDescription>
                      </div>
                      <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                        {batchShipments.length} {t("batches.shipmentCount")}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {batchShipments.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
                          {t("batches.inBatchEmpty")}
                        </div>
                      ) : (
                        batchShipments.map((shipment) => (
                          <ShipmentRow
                            key={shipment.id}
                            shipment={shipment}
                            t={t}
                            tone="neutral"
                            action={
                              isAssignmentEditable
                                ? () => handleRemoveShipment(shipment.id)
                                : undefined
                            }
                            actionLabel={t("batches.removeShipment")}
                            actionVariant="outline"
                            disabled={activeShipmentId === shipment.id}
                          />
                        ))
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border-slate-200 bg-white/95 shadow-lg">
                    <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <CardTitle>{t("batches.availableShipmentsTitle")}</CardTitle>
                        <CardDescription>{t("batches.availableShipmentsDescription")}</CardDescription>
                      </div>
                      <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                        {pendingShipments.length} {t("batches.shipmentCount")}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {!isAssignmentEditable ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
                          {t("batches.assignmentLockedNotice")}
                        </div>
                      ) : null}

                      {pendingShipments.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
                          {t("batches.availableShipmentsEmpty")}
                        </div>
                      ) : (
                        pendingShipments.map((shipment) => (
                          <ShipmentRow
                            key={shipment.id}
                            shipment={shipment}
                            t={t}
                            tone="available"
                            action={
                              isAssignmentEditable
                                ? () => handleAddShipment(shipment.id)
                                : undefined
                            }
                            actionLabel={t("batches.addShipment")}
                            actionVariant="default"
                            disabled={!isAssignmentEditable || activeShipmentId === shipment.id}
                          />
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
