import React from "react";
import { Link } from "react-router-dom";
import { Check, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useI18n } from "@/lib/i18n";

const plans = [
  {
    nameKey: "pricing.free",
    priceKey: "pricing.freePrice",
    periodKey: "pricing.freePeriod",
    descKey: "pricing.freeDesc",
    ctaKey: "pricing.freeCta",
    ctaLink: "/signup",
    highlighted: false,
    features: [
      { key: "pricing.featShipments50", included: true },
      { key: "pricing.featStaff1", included: true },
      { key: "pricing.featWhatsapp", included: true },
      { key: "pricing.featCustomerLookup", included: true },
      { key: "pricing.featBasicReports", included: true },
      { key: "pricing.featLabels", included: false },
      { key: "pricing.featPhotos", included: false },
      { key: "pricing.featManifest", included: false },
      { key: "pricing.featAdvancedReports", included: false },
    ],
  },
  {
    nameKey: "pricing.pro",
    priceKey: "pricing.proPrice",
    periodKey: "pricing.proPeriod",
    descKey: "pricing.proDesc",
    ctaKey: "pricing.proCta",
    ctaLink: "/signup?plan=pro",
    highlighted: true,
    badgeKey: "pricing.proBadge",
    features: [
      { key: "pricing.featShipmentsUnlimited", included: true },
      { key: "pricing.featStaff5", included: true },
      { key: "pricing.featWhatsapp", included: true },
      { key: "pricing.featCustomerLookup", included: true },
      { key: "pricing.featLabels", included: true },
      { key: "pricing.featPhotos", included: true },
      { key: "pricing.featManifest", included: true },
      { key: "pricing.featAdvancedReports", included: true },
      { key: "pricing.featBranches3", included: true },
      { key: "pricing.featBrandedTracking", included: true },
    ],
  },
  {
    nameKey: "pricing.enterprise",
    priceKey: "pricing.enterprisePrice",
    periodKey: "pricing.enterprisePeriod",
    descKey: "pricing.enterpriseDesc",
    ctaKey: "pricing.enterpriseCta",
    ctaLink: "/signup?plan=enterprise",
    highlighted: false,
    features: [
      { key: "pricing.featShipmentsUnlimited", included: true },
      { key: "pricing.featStaffUnlimited", included: true },
      { key: "pricing.featWhatsapp", included: true },
      { key: "pricing.featCustomerLookup", included: true },
      { key: "pricing.featLabels", included: true },
      { key: "pricing.featPhotos", included: true },
      { key: "pricing.featManifest", included: true },
      { key: "pricing.featAdvancedReports", included: true },
      { key: "pricing.featBranchesUnlimited", included: true },
      { key: "pricing.featBrandedTracking", included: true },
      { key: "pricing.featWhiteLabel", included: true },
      { key: "pricing.featApi", included: true },
      { key: "pricing.featDedicatedSupport", included: true },
    ],
  },
];

const faqs = [
  { qKey: "pricing.faq1Q", aKey: "pricing.faq1A" },
  { qKey: "pricing.faq2Q", aKey: "pricing.faq2A" },
  { qKey: "pricing.faq3Q", aKey: "pricing.faq3A" },
  { qKey: "pricing.faq4Q", aKey: "pricing.faq4A" },
  { qKey: "pricing.faq5Q", aKey: "pricing.faq5A" },
];

export default function PricingPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen">
      {/* ── Header ── */}
      <section className="bg-gradient-to-b from-green-50 to-white pb-4 pt-20 text-center sm:pt-28">
        <div className="mx-auto max-w-3xl px-6">
          <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            {t("pricing.title")}
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">{t("pricing.subtitle")}</p>
        </div>
      </section>

      {/* ── Pricing Cards ── */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid items-start gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.nameKey}
              className={`relative rounded-2xl border bg-white p-8 shadow-sm transition ${
                plan.highlighted
                  ? "border-brand ring-2 ring-brand/20 scale-[1.02] shadow-lg"
                  : "border-slate-200"
              }`}
            >
              {/* Badge */}
              {plan.badgeKey && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-4 py-1 text-xs font-semibold text-white">
                  {t(plan.badgeKey)}
                </span>
              )}

              {/* Plan name & price */}
              <div className="text-center">
                <h3 className="text-lg font-semibold text-slate-900">{t(plan.nameKey)}</h3>
                <div className="mt-4 flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold tracking-tight text-slate-950">
                    {t(plan.priceKey)}
                  </span>
                  <span className="text-base text-slate-500">{t(plan.periodKey)}</span>
                </div>
                <p className="mt-2 text-sm text-slate-500">{t(plan.descKey)}</p>
              </div>

              {/* CTA */}
              <div className="mt-8">
                <Button
                  asChild
                  size="lg"
                  className={`w-full ${
                    plan.highlighted
                      ? "bg-brand hover:bg-brand-hover text-white py-6 text-base"
                      : "border-brand text-brand hover:bg-brand-lighter py-6 text-base"
                  }`}
                  variant={plan.highlighted ? "default" : "outline"}
                >
                  <Link to={plan.ctaLink}>
                    {t(plan.ctaKey)}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>

              {/* Features */}
              <ul className="mt-8 space-y-3">
                {plan.features.map((feat) => (
                  <li key={feat.key} className="flex items-start gap-3">
                    {feat.included ? (
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    ) : (
                      <X className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
                    )}
                    <span
                      className={`text-sm leading-6 ${
                        feat.included ? "text-slate-700" : "text-slate-400"
                      }`}
                    >
                      {t(feat.key)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-3xl px-6 py-20 sm:py-28">
          <h2 className="text-center text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            {t("pricing.faqTitle")}
          </h2>
          <Accordion type="single" collapsible className="mt-12">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-base font-medium text-slate-900">
                  {t(faq.qKey)}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-7 text-slate-600">
                  {t(faq.aKey)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </div>
  );
}
