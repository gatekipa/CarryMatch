import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/lib/i18n";
import { InlineNotice } from "@/features/cml-core/components/CmlStateScreens";

export default function VendorDashboardPage() {
  const { accessState, user, vendor } = useAuth();
  const { t, language } = useI18n();

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{t("dashboard.title")}</h1>
        <p className="max-w-3xl text-base leading-7 text-slate-600">{t("dashboard.description")}</p>
        {vendor?.company_name ? (
          <p className="text-sm text-slate-500">
            {t("dashboard.activeVendorLabel")}: <span className="font-medium text-slate-700">{vendor.company_name}</span>
          </p>
        ) : null}
      </section>

      <InlineNotice title={t("dashboard.todoTitle")} description={t("dashboard.todoBody")} tone="warning" />

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-200 bg-white/95 shadow-lg">
          <CardHeader>
            <CardTitle>{t("dashboard.statOne")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">{t(`accessState.${accessState}`)}</CardContent>
        </Card>

        <Card className="border-slate-200 bg-white/95 shadow-lg">
          <CardHeader>
            <CardTitle>{t("dashboard.statTwo")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">{language.toUpperCase()}</CardContent>
        </Card>

        <Card className="border-slate-200 bg-white/95 shadow-lg">
          <CardHeader>
            <CardTitle>{t("dashboard.statThree")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">{user?.email ?? "-"}</CardContent>
        </Card>
      </section>

      <Card className="border-slate-200 bg-white/95 shadow-lg">
        <CardHeader>
          <CardTitle>{t("dashboard.shipmentIntakeTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">{t("dashboard.shipmentIntakeBody")}</p>
          <Button asChild>
            <Link to="/shipments/new">{t("dashboard.startNewShipment")}</Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white/95 shadow-lg">
        <CardHeader>
          <CardTitle>{t("dashboard.scanUpdateTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">{t("dashboard.scanUpdateBody")}</p>
          <Button asChild variant="outline">
            <Link to="/scan-update">{t("dashboard.openScanUpdate")}</Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white/95 shadow-lg">
        <CardHeader>
          <CardTitle>{t("dashboard.batchManagementTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">{t("dashboard.batchManagementBody")}</p>
          <Button asChild variant="outline">
            <Link to="/batches">{t("dashboard.manageBatches")}</Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white/95 shadow-lg">
        <CardHeader>
          <CardTitle>{t("dashboard.businessManagementTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">{t("dashboard.businessManagementBody")}</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/settings/company-profile">{t("dashboard.manageCompanyProfile")}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/settings/branches">{t("dashboard.manageBranches")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white/95 shadow-lg">
        <CardHeader>
          <CardTitle>{t("dashboard.notificationLogTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">{t("dashboard.notificationLogBody")}</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/notifications/log">{t("dashboard.viewNotificationLog")}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/notifications/settings">{t("dashboard.manageNotificationSettings")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 bg-white/95 shadow-lg">
        <CardHeader>
          <CardTitle>{t("dashboard.nextStepsTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-600">
          <p>1. {t("dashboard.nextStepOne")}</p>
          <p>2. {t("dashboard.nextStepTwo")}</p>
          <p>3. {t("dashboard.nextStepThree")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
