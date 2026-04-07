import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bus,
  Package,
  Ship,
  Phone,
  MessageSquare,
  QrCode,
  Layers,
  Languages,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

const whoCards = [
  { icon: Bus, titleKey: "landing.whoBusTitle", descKey: "landing.whoBusDesc" },
  { icon: Package, titleKey: "landing.whoForwardersTitle", descKey: "landing.whoForwardersDesc" },
  { icon: Ship, titleKey: "landing.whoContainersTitle", descKey: "landing.whoContainersDesc" },
];

const steps = [
  { num: "01", titleKey: "landing.howStep1Title", descKey: "landing.howStep1Desc" },
  { num: "02", titleKey: "landing.howStep2Title", descKey: "landing.howStep2Desc" },
  { num: "03", titleKey: "landing.howStep3Title", descKey: "landing.howStep3Desc" },
  { num: "04", titleKey: "landing.howStep4Title", descKey: "landing.howStep4Desc" },
];

const features = [
  { icon: Phone, titleKey: "landing.feat1Title", descKey: "landing.feat1Desc" },
  { icon: MessageSquare, titleKey: "landing.feat2Title", descKey: "landing.feat2Desc" },
  { icon: QrCode, titleKey: "landing.feat3Title", descKey: "landing.feat3Desc" },
  { icon: Layers, titleKey: "landing.feat4Title", descKey: "landing.feat4Desc" },
  { icon: Languages, titleKey: "landing.feat5Title", descKey: "landing.feat5Desc" },
  { icon: Building2, titleKey: "landing.feat6Title", descKey: "landing.feat6Desc" },
];

export default function LandingPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen">
      {/* ── Hero Section ── */}
      <section className="relative isolate overflow-hidden bg-gradient-to-b from-green-50 via-white to-white">
        {/* Decorative blobs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-green-100/60 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 right-0 -z-10 h-[400px] w-[400px] rounded-full bg-green-200/40 blur-3xl"
        />

        <div className="mx-auto max-w-7xl px-6 pb-20 pt-24 text-center sm:pt-32 lg:pt-40">
          <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
            {t("landing.headline")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
            {t("landing.subheadline")}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" className="bg-brand hover:bg-brand-hover text-white px-8 py-6 text-base">
              <Link to="/signup">
                {t("landing.ctaStartFree")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-brand text-brand hover:bg-brand-lighter px-8 py-6 text-base">
              <Link to="/pricing">{t("landing.ctaViewPricing")}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Social Proof Bar ── */}
      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-8 px-6 py-10 sm:flex-row sm:gap-16">
          {[
            { value: "landing.statShipments", label: "landing.statShipmentsLabel" },
            { value: "landing.statVendors", label: "landing.statVendorsLabel" },
            { value: "landing.statCountries", label: "landing.statCountriesLabel" },
          ].map((stat) => (
            <div key={stat.value} className="text-center">
              <p className="text-3xl font-bold text-brand sm:text-4xl">{t(stat.value)}</p>
              <p className="mt-1 text-sm font-medium text-slate-500">{t(stat.label)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Who It's For ── */}
      <section className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
        <h2 className="text-center text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          {t("landing.whoTitle")}
        </h2>
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {whoCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.titleKey}
                className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:shadow-md"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-lighter">
                  <Icon className="h-6 w-6 text-brand" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{t(card.titleKey)}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{t(card.descKey)}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-4xl px-6 py-20 sm:py-28">
          <h2 className="text-center text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            {t("landing.howTitle")}
          </h2>
          <div className="relative mt-14 space-y-0">
            {/* Connecting line */}
            <div
              aria-hidden="true"
              className="absolute left-6 top-0 hidden h-full w-px bg-green-200 sm:block"
            />
            {steps.map((step, i) => (
              <div key={step.num} className="relative flex gap-6 pb-12 last:pb-0">
                <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white shadow-md">
                  {step.num}
                </div>
                <div className="pt-2">
                  <h3 className="text-lg font-semibold text-slate-900">{t(step.titleKey)}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{t(step.descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="mx-auto max-w-7xl px-6 py-20 sm:py-28">
        <h2 className="text-center text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          {t("landing.featuresTitle")}
        </h2>
        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div key={feat.titleKey} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-lighter">
                  <Icon className="h-5 w-5 text-brand" />
                </div>
                <h3 className="font-semibold text-slate-900">{t(feat.titleKey)}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{t(feat.descKey)}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-slate-900">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center sm:py-28">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {t("landing.ctaTitle")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-300">
            {t("landing.ctaSubtitle")}
          </p>
          <div className="mt-10">
            <Button asChild size="lg" className="bg-brand hover:bg-brand-hover text-white px-10 py-6 text-base">
              <Link to="/signup">
                {t("landing.ctaButton")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
