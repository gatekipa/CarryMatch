import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Plane, ArrowRightLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

export default function P2PComingSoonPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");

  const handleSignup = (e) => {
    e.preventDefault();
    if (email.trim()) {
      toast.success(t("p2p.signupSuccess"));
      setEmail("");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-12 text-center">
      <div className="flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
          <ArrowRightLeft className="h-8 w-8 text-blue-600" />
        </div>
      </div>

      <div>
        <span className="mb-3 inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          {t("p2p.badge")}
        </span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950">
          {t("p2p.title")}
        </h1>
        <p className="mt-4 text-lg leading-8 text-slate-600">
          {t("p2p.description")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Users, titleKey: "p2p.feature1Title", descKey: "p2p.feature1Desc" },
          { icon: Plane, titleKey: "p2p.feature2Title", descKey: "p2p.feature2Desc" },
          { icon: ArrowRightLeft, titleKey: "p2p.feature3Title", descKey: "p2p.feature3Desc" },
        ].map((feat, i) => (
          <Card key={i} className="border-slate-200 bg-white/95 text-left shadow-sm">
            <CardContent className="p-5">
              <feat.icon className="mb-3 h-6 w-6 text-blue-600" />
              <p className="text-sm font-semibold text-slate-900">{t(feat.titleKey)}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{t(feat.descKey)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-slate-200 bg-white/95 shadow-sm">
        <CardContent className="p-6">
          <p className="mb-3 text-sm font-semibold text-slate-900">{t("p2p.signupTitle")}</p>
          <form onSubmit={handleSignup} className="mx-auto flex max-w-sm gap-2">
            <Input
              type="email"
              placeholder={t("p2p.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit">{t("p2p.signupButton")}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
