import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bus, MapPin, Ticket } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

export default function BusTicketingComingSoonPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");

  const handleSignup = (e) => {
    e.preventDefault();
    if (email.trim()) {
      toast.success(t("busTickets.signupSuccess"));
      setEmail("");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-12 text-center">
      <div className="flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-lighter">
          <Bus className="h-8 w-8 text-brand" />
        </div>
      </div>

      <div>
        <span className="mb-3 inline-flex items-center rounded-full border border-green-200 bg-brand-lighter px-3 py-1 text-xs font-semibold text-brand">
          {t("busTickets.badge")}
        </span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950">
          {t("busTickets.title")}
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">
          {t("busTickets.description")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Ticket, titleKey: "busTickets.feature1Title", descKey: "busTickets.feature1Desc" },
          { icon: MapPin, titleKey: "busTickets.feature2Title", descKey: "busTickets.feature2Desc" },
          { icon: Bus, titleKey: "busTickets.feature3Title", descKey: "busTickets.feature3Desc" },
        ].map((feat, i) => (
          <Card key={i} className="border-slate-200 bg-white/95 text-left shadow-sm">
            <CardContent className="p-5">
              <feat.icon className="mb-3 h-6 w-6 text-brand" />
              <p className="text-sm font-semibold text-slate-900">{t(feat.titleKey)}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{t(feat.descKey)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-slate-200 bg-white/95 shadow-sm">
        <CardContent className="p-6">
          <p className="mb-3 text-sm font-semibold text-slate-900">{t("busTickets.signupTitle")}</p>
          <form onSubmit={handleSignup} className="mx-auto flex max-w-sm gap-2">
            <Input
              type="email"
              placeholder={t("busTickets.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" className="bg-brand hover:bg-brand-hover text-white">{t("busTickets.signupButton")}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
