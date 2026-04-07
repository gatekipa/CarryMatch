import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Globe2, ShieldCheck, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";

const featureIcons = [Workflow, ShieldCheck, Globe2];

export default function LandingPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 shadow-xl">
        <div className="grid gap-8 px-6 py-10 sm:px-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">
              {t("landing.eyebrow")}
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              {t("landing.title")}
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-600">{t("landing.description")}</p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/signup">
                  {t("landing.primaryCta")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/pricing">{t("landing.secondaryCta")}</Link>
              </Button>
            </div>
          </div>

          <Card className="border-slate-200 bg-slate-50/90">
            <CardHeader>
              <CardTitle>{t("common.accessRoutingNote")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-600">
              <p>{t("common.deferredDataDescription")}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((index) => {
          const Icon = featureIcons[index - 1];
          return (
            <Card key={index} className="border-slate-200 bg-white/90">
              <CardHeader className="space-y-4">
                <div className="w-fit rounded-2xl bg-slate-900 p-3 text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle>{t(`landing.card${index}Title`)}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-7 text-slate-600">
                {t(`landing.card${index}Body`)}
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
