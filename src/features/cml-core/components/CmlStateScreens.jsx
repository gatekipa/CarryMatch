import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";

export function FullscreenLoader({ titleKey = "common.loading", bodyKey = "common.loadingMessage" }) {
  const { t } = useI18n();

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <Card className="w-full max-w-md border-slate-200/80 bg-white/95 shadow-xl">
        <CardHeader className="items-center text-center">
          <LoaderCircle className="h-8 w-8 animate-spin text-slate-700" />
          <CardTitle>{t(titleKey)}</CardTitle>
          <CardDescription>{t(bodyKey)}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

export function FullscreenError({ title, description, actionLabel, actionHref = "/" }) {
  const { t } = useI18n();

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <Card className="w-full max-w-lg border-red-200 bg-white/95 shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3 text-red-600">
            <AlertTriangle className="h-6 w-6" />
            <CardTitle>{title ?? t("errors.title")}</CardTitle>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to={actionHref}>{actionLabel ?? t("common.backHome")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function InlineNotice({ title, description, tone = "neutral" }) {
  const toneClasses = {
    neutral: "border-slate-200 bg-slate-50 text-slate-700",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    error: "border-red-200 bg-red-50 text-red-800",
  };

  return (
    <div className={`rounded-xl border px-4 py-3 ${toneClasses[tone] ?? toneClasses.neutral}`}>
      <p className="text-sm font-semibold">{title}</p>
      {description ? <p className="mt-1 text-sm opacity-90">{description}</p> : null}
    </div>
  );
}
