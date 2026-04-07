import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/lib/i18n";
import { FullscreenLoader } from "@/features/cml-core/components/CmlStateScreens";
import { InlineNotice } from "@/features/cml-core/components/CmlStateScreens";
import {
  listApplications,
  approveApplication,
  rejectApplication,
  requestInfoApplication,
} from "@/features/cml-core/api/cmlAdmin";

const STATUS_FILTERS = ["", "pending", "info_requested", "approved", "rejected"];

function statusBadgeColor(status) {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "info_requested":
      return "bg-blue-100 text-blue-800";
    case "approved":
      return "bg-green-100 text-green-800";
    case "rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-slate-100 text-slate-800";
  }
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function AdminDashboardPage() {
  const { adminUser } = useAuth();
  const { t } = useI18n();

  const [applications, setApplications] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Action state per application
  const [actionAppId, setActionAppId] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  const fetchApplications = useCallback(async () => {
    let isActive = true;
    setIsLoading(true);
    setLoadError(null);

    try {
      const data = await listApplications(statusFilter);
      if (isActive) {
        setApplications(data);
      }
    } catch (err) {
      if (isActive) {
        setLoadError(err?.message || t("admin.loadFailed"));
      }
    } finally {
      if (isActive) {
        setIsLoading(false);
      }
    }

    return () => {
      isActive = false;
    };
  }, [statusFilter, t]);

  useEffect(() => {
    const cleanup = fetchApplications();
    return () => {
      if (typeof cleanup === "function") cleanup();
    };
  }, [fetchApplications]);

  const openAction = (appId, type) => {
    setActionAppId(appId);
    setActionType(type);
    setRejectionReason("");
    setActionError(null);
    setActionSuccess(null);
  };

  const cancelAction = () => {
    setActionAppId(null);
    setActionType(null);
    setRejectionReason("");
    setActionError(null);
  };

  const executeAction = async () => {
    if (!actionAppId || !actionType) return;

    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      if (actionType === "approve") {
        await approveApplication(actionAppId);
        setActionSuccess(t("admin.approveSuccess"));
      } else if (actionType === "reject") {
        if (!rejectionReason.trim()) {
          setActionError(t("admin.rejectionReasonRequired"));
          setActionLoading(false);
          return;
        }
        await rejectApplication(actionAppId, rejectionReason.trim());
        setActionSuccess(t("admin.rejectSuccess"));
      } else if (actionType === "request_info") {
        await requestInfoApplication(actionAppId);
        setActionSuccess(t("admin.requestInfoSuccess"));
      }

      cancelAction();
      await fetchApplications();
    } catch (err) {
      setActionError(err?.message || t("admin.actionFailed"));
    } finally {
      setActionLoading(false);
    }
  };

  if (!adminUser) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{t("admin.title")}</h1>
        <InlineNotice
          title={t("admin.noAccessTitle")}
          description={t("admin.noAccessBody")}
          tone="warning"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{t("admin.title")}</h1>
        <p className="max-w-3xl text-base leading-7 text-slate-600">{t("admin.description")}</p>
        <p className="text-sm text-slate-500">
          {t("admin.loggedInAs")}: <span className="font-medium text-slate-700">{adminUser.email}</span>
          {" "} ({adminUser.role})
        </p>
      </section>

      {actionSuccess ? (
        <InlineNotice title={actionSuccess} tone="success" />
      ) : null}

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter || "all"}
            type="button"
            onClick={() => setStatusFilter(filter)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              statusFilter === filter
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            {filter ? t(`admin.filter_${filter}`) : t("admin.filterAll")}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading ? <FullscreenLoader /> : null}

      {/* Load error */}
      {loadError ? (
        <InlineNotice title={t("admin.loadFailed")} description={loadError} tone="warning" />
      ) : null}

      {/* Empty state */}
      {!isLoading && !loadError && applications.length === 0 ? (
        <InlineNotice title={t("admin.emptyTitle")} description={t("admin.emptyBody")} tone="neutral" />
      ) : null}

      {/* Application cards */}
      {!isLoading && applications.length > 0 ? (
        <div className="grid gap-4">
          {applications.map((app) => (
            <Card key={app.id} className="border-slate-200 bg-white/95 shadow-lg">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {app.company_name || t("admin.unnamedCompany")}
                    </CardTitle>
                    <p className="text-sm text-slate-500">
                      {app.full_name || "-"} &middot; {app.email || "-"}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeColor(app.status)}`}
                  >
                    {app.status || "-"}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <span className="font-medium text-slate-700">{t("common.businessType")}:</span>{" "}
                    <span className="text-slate-600">{app.business_type || "-"}</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">{t("common.corridors")}:</span>{" "}
                    <span className="text-slate-600">{app.corridors || "-"}</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">{t("common.monthlyVolume")}:</span>{" "}
                    <span className="text-slate-600">{app.monthly_volume || "-"}</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">{t("common.submittedAt")}:</span>{" "}
                    <span className="text-slate-600">{formatDate(app.created_at)}</span>
                  </div>
                </div>

                {app.corridors ? (
                  <div className="text-sm">
                    <span className="font-medium text-slate-700">{t("common.corridors")}:</span>
                    <p className="mt-1 whitespace-pre-line text-slate-600">{app.corridors}</p>
                  </div>
                ) : null}

                {app.office_addresses ? (
                  <div className="text-sm">
                    <span className="font-medium text-slate-700">{t("common.officeAddresses")}:</span>
                    <p className="mt-1 whitespace-pre-line text-slate-600">{app.office_addresses}</p>
                  </div>
                ) : null}

                {app.rejection_reason ? (
                  <div className="text-sm">
                    <span className="font-medium text-red-700">{t("common.reason")}:</span>
                    <p className="mt-1 text-red-600">{app.rejection_reason}</p>
                  </div>
                ) : null}

                {app.notes ? (
                  <div className="text-sm">
                    <span className="font-medium text-slate-700">{t("common.notes")}:</span>
                    <p className="mt-1 text-slate-600">{app.notes}</p>
                  </div>
                ) : null}

                {/* Action panel inline */}
                {actionAppId === app.id ? (
                  <div className="rounded-lg border border-slate-300 bg-slate-50 p-4 space-y-3">
                    <p className="text-sm font-semibold text-slate-900">
                      {actionType === "approve"
                        ? t("admin.confirmApprove")
                        : actionType === "reject"
                          ? t("admin.confirmReject")
                          : t("admin.confirmRequestInfo")}
                    </p>

                    {actionType === "reject" ? (
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">
                          {t("admin.rejectionReasonLabel")}
                        </label>
                        <Textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder={t("admin.rejectionReasonPlaceholder")}
                          rows={3}
                        />
                      </div>
                    ) : null}

                    {actionError ? (
                      <p className="text-sm text-red-600">{actionError}</p>
                    ) : null}

                    <div className="flex gap-2">
                      <Button
                        onClick={executeAction}
                        disabled={actionLoading}
                        variant={actionType === "reject" ? "destructive" : "default"}
                      >
                        {actionLoading ? t("common.saving") : t("admin.confirmAction")}
                      </Button>
                      <Button variant="outline" onClick={cancelAction} disabled={actionLoading}>
                        {t("admin.cancelAction")}
                      </Button>
                    </div>
                  </div>
                ) : null}

                {/* Action buttons */}
                {actionAppId !== app.id &&
                (app.status === "pending" || app.status === "info_requested") ? (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                    <Button size="sm" onClick={() => openAction(app.id, "approve")}>
                      {t("admin.approveBtn")}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => openAction(app.id, "reject")}
                    >
                      {t("admin.rejectBtn")}
                    </Button>
                    {app.status === "pending" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openAction(app.id, "request_info")}
                      >
                        {t("admin.requestInfoBtn")}
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
