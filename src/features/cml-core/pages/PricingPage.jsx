import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";

const planKeys = ["free", "pro"];

export default function PricingPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{t("pricing.title")}</h1>
        <p className="max-w-2xl text-base leading-7 text-slate-600">{t("pricing.description")}</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {planKeys.map((plan) => (
          <Card key={plan} className="border-slate-200 bg-white/90">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{t(`pricing.${plan}Title`)}</span>
                <span className="text-sm font-medium text-slate-500">{t(`pricing.${plan}Price`)}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <p>{t(`pricing.${plan}FeatureOne`)}</p>
              <p>{t(`pricing.${plan}FeatureTwo`)}</p>
              <p>{t(`pricing.${plan}FeatureThree`)}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="border-slate-200 bg-slate-50/90">
        <CardContent className="p-6 text-sm leading-7 text-slate-600">{t("pricing.footer")}</CardContent>
      </Card>
    </div>
  );
}
