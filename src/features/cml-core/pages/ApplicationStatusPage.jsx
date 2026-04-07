import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InlineNotice } from "@/features/cml-core/components/CmlStateScreens";
import { useAuth } from "@/lib/AuthContext";
import { ACCESS_STATES } from "@/lib/cmlAccessState";
import { useI18n } from "@/lib/i18n";

const statusContentMap = {
  [ACCESS_STATES.APPLICATION_PENDING]: {
    titleKey: "applicationStatus.pendingTitle",
    bodyKey: "applicationStatus.pendingBody",
  },
  [ACCESS_STATES.APPLICATION_REJECTED]: {
    titleKey: "applicationStatus.rejectedTitle",
    bodyKey: "applicationStatus.rejectedBody",
  },
  [ACCESS_STATES.SUSPENDED_VENDOR]: {
    titleKey: "applicationStatus.suspendedTitle",
    bodyKey: "applicationStatus.suspendedBody",
  },
};

function formatDateTime(value, language) {
  if (!value) {
    return "-";
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

export default function ApplicationStatusPage() {
  const { accessState, user, application, vendor, authError, profileWarning } = useAuth();
  const { t, language } = useI18n();

  const statusContent = statusContentMap[accessState] ?? {
    titleKey: "applicationStatus.defaultTitle",
    bodyKey: "applicationStatus.defaultBody",
  };

  const rejectionReason = application?.rejection_reason ?? null;
  const nextStepsKey =
    accessState === ACCESS_STATES.APPLICATION_PENDING
      ? "applicationStatus.pendingNextStep"
      : accessState === ACCESS_STATES.APPLICATION_REJECTED
        ? "applicationStatus.rejectedNextStep"
        : accessState === ACCESS_STATES.SUSPENDED_VENDOR
          ? "applicationStatus.suspendedNextStep"
          : "applicationStatus.defaultNextStep";

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          {t("applicationStatus.title")}
        </h1>
        <p className="max-w-2xl text-base leading-7 text-slate-600">
          {t("applicationStatus.description")}
        </p>
      </section>

      {authError?.type === "config" ? (
        <InlineNotice
          title={t("common.environmentWarning")}
          description={t("errors.missingConfig")}
          tone="warning"
        />
      ) : null}

      {profileWarning ? (
        <InlineNotice
          title={t("errors.title")}
          description={t("errors.profileWarning")}
          tone="warning"
        />
      ) : null}

      {!application && accessState !== ACCESS_STATES.SUSPENDED_VENDOR ? (
        <InlineNotice
          title={t("applicationStatus.noApplicationTitle")}
          description={t("applicationStatus.noApplicationBody")}
          tone="warning"
        />
      ) : null}

      <Card className="border-slate-200 bg-white/95 shadow-lg">
        <CardHeader>
          <CardTitle>{t(statusContent.titleKey)}</CardTitle>
          <CardDescription>{t(statusContent.bodyKey)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-600">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">{t("common.status")}</p>
              <p className="mt-1">{t(`accessState.${accessState}`)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">{t("common.email")}</p>
              <p className="mt-1">{user?.email ?? "-"}</p>
            </div>
          </div>

          {application ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">{t("applicationStatus.detailsTitle")}</p>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t("common.companyName")}
                  </p>
                  <p className="mt-1 text-slate-700">{application.company_name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t("common.fullName")}
                  </p>
                  <p className="mt-1 text-slate-700">{application.full_name}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t("common.phone")}
                  </p>
                  <p className="mt-1 text-slate-700">{application.phone}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {t("common.submittedAt")}
                  </p>
                  <p className="mt-1 text-slate-700">
                    {formatDateTime(application.created_at, language)}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {vendor ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">{t("common.companyName")}</p>
              <p className="mt-1 text-slate-700">
                {vendor.company_name} - {vendor.vendor_prefix}
              </p>
            </div>
          ) : null}

          {rejectionReason ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">{t("common.reason")}</p>
              <p className="mt-1">{rejectionReason}</p>
            </div>
          ) : null}

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="font-semibold text-slate-900">{t("applicationStatus.nextStepsTitle")}</p>
            <p className="mt-1">{t(nextStepsKey)}</p>
            {accessState === ACCESS_STATES.APPLICATION_REJECTED ? (
              <div className="mt-4">
                <Button asChild variant="outline">
                  <Link to="/partners/apply">{t("applicationStatus.reapplyCta")}</Link>
                </Button>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
