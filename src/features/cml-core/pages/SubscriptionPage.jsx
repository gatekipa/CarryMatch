import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/lib/i18n";
import { InlineNotice } from "@/features/cml-core/components/CmlStateScreens";
import { loadSubscriptionStatus, activateCouponCode } from "@/features/cml-core/api/cmlSubscription";

function formatDate(dateStr) {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default function SubscriptionPage() {
  const { vendor, refreshOnboardingData } = useAuth();
  const { t } = useI18n();

  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState(null);
  const [couponSuccess, setCouponSuccess] = useState(null);

  const fetchSubscription = useCallback(async () => {
    if (!vendor?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const data = await loadSubscriptionStatus(vendor.id);
      setSubscriptionInfo(data);
    } catch (err) {
      setLoadError(err?.message || t("subscription.loadFailed"));
    } finally {
      setIsLoading(false);
    }
  }, [vendor?.id, t]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const handleActivateCoupon = async () => {
    if (!couponCode.trim() || !vendor?.id) return;

    setCouponLoading(true);
    setCouponError(null);
    setCouponSuccess(null);

    try {
      const result = await activateCouponCode(vendor.id, couponCode);
      setCouponSuccess(
        `${t("subscription.couponActivated")} ${t("subscription.planNow")}: ${result.planTier.toUpperCase()} — ${t("subscription.expiresLabel")}: ${formatDate(result.expiresAt)}`
      );
      setCouponCode("");
      await fetchSubscription();
      await refreshOnboardingData();
    } catch (err) {
      setCouponError(err?.message || t("subscription.couponFailed"));
    } finally {
      setCouponLoading(false);
    }
  };

  if (!vendor) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          {t("subscription.title")}
        </h1>
        <InlineNotice
          title={t("subscription.noVendorTitle")}
          description={t("subscription.noVendorBody")}
          tone="warning"
        />
      </div>
    );
  }

  const effectivePlan = subscriptionInfo?.planTier || vendor?.plan_tier || "free";
  const isProActive = effectivePlan === "pro" && !subscriptionInfo?.isExpired;

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          {t("subscription.title")}
        </h1>
        <p className="max-w-3xl text-base leading-7 text-slate-600">
          {t("subscription.description")}
        </p>
      </section>

      {couponSuccess ? <InlineNotice title={couponSuccess} tone="success" /> : null}

      {/* Current plan card */}
      <Card className="border-slate-200 bg-white/95 shadow-lg">
        <CardHeader>
          <CardTitle>{t("subscription.currentPlanTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-sm text-slate-500">{t("common.loadingShort")}</p>
          ) : loadError ? (
            <p className="text-sm text-red-600">{loadError}</p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-bold ${
                    isProActive
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {effectivePlan.toUpperCase()}
                </span>
                {subscriptionInfo?.isExpired ? (
                  <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                    {t("subscription.expired")}
                  </span>
                ) : null}
              </div>

              {subscriptionInfo?.subscriptionExpiresAt ? (
                <p className="text-sm text-slate-600">
                  {t("subscription.expiresLabel")}:{" "}
                  <span className="font-medium">{formatDate(subscriptionInfo.subscriptionExpiresAt)}</span>
                </p>
              ) : null}

              {subscriptionInfo?.subscriptionSource ? (
                <p className="text-sm text-slate-500">
                  {t("subscription.sourceLabel")}:{" "}
                  <span className="font-medium">{subscriptionInfo.subscriptionSource}</span>
                </p>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Coupon activation */}
      <Card className="border-slate-200 bg-white/95 shadow-lg">
        <CardHeader>
          <CardTitle>{t("subscription.couponTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">{t("subscription.couponDescription")}</p>
          <div className="flex gap-3">
            <Input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder={t("subscription.couponPlaceholder")}
              className="max-w-xs font-mono uppercase"
            />
            <Button
              onClick={handleActivateCoupon}
              disabled={couponLoading || !couponCode.trim()}
            >
              {couponLoading ? t("common.saving") : t("subscription.activateBtn")}
            </Button>
          </div>
          {couponError ? <p className="text-sm text-red-600">{couponError}</p> : null}
        </CardContent>
      </Card>

      {/* Feature comparison */}
      <Card className="border-slate-200 bg-white/95 shadow-lg">
        <CardHeader>
          <CardTitle>{t("subscription.comparisonTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-3 pr-4 text-left font-semibold text-slate-900">
                    {t("subscription.featureColumn")}
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-900">
                    {t("subscription.freeColumn")}
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-emerald-800">
                    {t("subscription.proColumn")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { key: "featureShipments", free: t("subscription.freeShipmentLimit"), pro: t("subscription.proUnlimited") },
                  { key: "featureBranches", free: "1", pro: t("subscription.proUnlimited") },
                  { key: "featureLabels", free: "-", pro: t("subscription.checkMark") },
                  { key: "featureBatchPrint", free: "-", pro: t("subscription.checkMark") },
                  { key: "featurePhotoUpload", free: "-", pro: t("subscription.checkMark") },
                  { key: "featureAdvancedReports", free: "-", pro: t("subscription.checkMark") },
                  { key: "featureImportCustomers", free: "-", pro: t("subscription.checkMark") },
                ].map((row) => (
                  <tr key={row.key}>
                    <td className="py-2.5 pr-4 text-slate-700">{t(`subscription.${row.key}`)}</td>
                    <td className="px-4 py-2.5 text-center text-slate-500">{row.free}</td>
                    <td className="px-4 py-2.5 text-center font-medium text-emerald-700">{row.pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Stripe placeholder notice */}
      <InlineNotice
        title={t("subscription.stripePlaceholderTitle")}
        description={t("subscription.stripePlaceholderBody")}
        tone="neutral"
      />
    </div>
  );
}
