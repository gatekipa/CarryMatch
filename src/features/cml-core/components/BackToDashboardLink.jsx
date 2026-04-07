import React from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export function BackToDashboardLink() {
  const { t } = useI18n();

  return (
    <Button asChild variant="ghost" className="w-fit px-0 text-slate-600 hover:bg-transparent hover:text-slate-900">
      <Link to="/dashboard">
        <ArrowLeft className="h-4 w-4" />
        {t("common.backToDashboard")}
      </Link>
    </Button>
  );
}
