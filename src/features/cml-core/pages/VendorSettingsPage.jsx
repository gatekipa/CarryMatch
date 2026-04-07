import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveVendorProfile } from "@/features/cml-core/api/cmlOnboarding";
import { BackToDashboardLink } from "@/features/cml-core/components/BackToDashboardLink";
import {
  buildCountryOptions,
  resolveStoredCountryCode,
} from "@/features/cml-core/lib/countries";
import { InlineNotice } from "@/features/cml-core/components/CmlStateScreens";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/lib/i18n";
import { canEditSettings } from "@/features/cml-core/lib/permissions";

const PRICING_MODE_OPTIONS = ["per_kg", "flat_fee", "manual"];
const DEFAULT_CURRENCY_OPTIONS = ["USD", "XAF", "NGN", "GHS", "EUR", "GBP"];

function RequiredLabel({ htmlFor, children }) {
  return (
    <Label htmlFor={htmlFor}>
      {children} <span className="text-red-600">*</span>
    </Label>
  );
}

function sanitizeDecimalInput(value) {
  const sanitized = String(value ?? "").replace(/[^\d.]/g, "");
  const [wholePart, ...decimalParts] = sanitized.split(".");

  if (decimalParts.length === 0) {
    return wholePart;
  }

  return `${wholePart}.${decimalParts.join("")}`;
}

export default function VendorSettingsPage() {
  const { t, language } = useI18n();
  const { vendor, vendorStaff, refreshOnboardingData } = useAuth();
  const staffRole = vendorStaff?.role ?? "staff";
  const canEdit = canEditSettings(staffRole);
  const countryOptions = useMemo(() => buildCountryOptions(language), [language]);
  const currencyOptions = useMemo(() => {
    const nextOptions = DEFAULT_CURRENCY_OPTIONS.map((currencyCode) => ({
      code: currencyCode,
      label: t(`vendorSettings.currencyOptions.${currencyCode}`),
    }));

    const savedCurrencyCode = String(vendor?.default_currency ?? "")
      .trim()
      .toUpperCase();

    if (
      savedCurrencyCode &&
      !DEFAULT_CURRENCY_OPTIONS.includes(savedCurrencyCode) &&
      /^[A-Z]{3}$/.test(savedCurrencyCode)
    ) {
      nextOptions.push({
        code: savedCurrencyCode,
        label: savedCurrencyCode,
      });
    }

    return nextOptions;
  }, [t, vendor?.default_currency]);
  const [form, setForm] = useState({
    companyName: "",
    vendorPrefix: "",
    defaultOriginCountry: "",
    defaultOriginCity: "",
    pricingModel: "manual",
    ratePerKg: "",
    flatFeePerItem: "",
    defaultCurrency: "USD",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setForm((current) => ({
      companyName: vendor?.company_name ?? current.companyName,
      vendorPrefix: vendor?.vendor_prefix ?? current.vendorPrefix,
      defaultOriginCountry:
        resolveStoredCountryCode(vendor?.default_origin_country) || current.defaultOriginCountry,
      defaultOriginCity: vendor?.default_origin_city ?? current.defaultOriginCity,
      pricingModel: vendor?.pricing_model ?? current.pricingModel,
      ratePerKg:
        vendor?.rate_per_kg === null || vendor?.rate_per_kg === undefined
          ? current.ratePerKg
          : String(vendor.rate_per_kg),
      flatFeePerItem:
        vendor?.flat_fee_per_item === null || vendor?.flat_fee_per_item === undefined
          ? current.flatFeePerItem
          : String(vendor.flat_fee_per_item),
      defaultCurrency: vendor?.default_currency ?? current.defaultCurrency,
    }));
  }, [vendor]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "vendorPrefix") {
      setForm((current) => ({
        ...current,
        vendorPrefix: value.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase(),
      }));
      setFieldErrors((current) => ({ ...current, vendorPrefix: "" }));
      return;
    }

    if (name === "ratePerKg" || name === "flatFeePerItem") {
      setForm((current) => ({ ...current, [name]: sanitizeDecimalInput(value) }));
      setFieldErrors((current) => ({ ...current, [name]: "" }));
      return;
    }

    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
  };

  const handleSelectChange = (fieldName) => (value) => {
    setForm((current) => ({ ...current, [fieldName]: value }));
    setFieldErrors((current) => ({
      ...current,
      [fieldName]: "",
      ...(fieldName === "pricingModel"
        ? {
            ratePerKg: "",
            flatFeePerItem: "",
          }
        : {}),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});
    setErrorMessage("");
    setSuccessMessage("");

    const nextFieldErrors = {};

    if (!form.companyName.trim()) {
      nextFieldErrors.companyName = t("vendorSettings.companyNameError");
    }

    if (!/^[A-Z]{3}$/.test(form.vendorPrefix)) {
      nextFieldErrors.vendorPrefix = t("setup.vendorPrefixError");
    }

    if (!form.defaultOriginCountry) {
      nextFieldErrors.defaultOriginCountry = t("setup.defaultOriginCountryError");
    }

    if (!form.defaultOriginCity.trim()) {
      nextFieldErrors.defaultOriginCity = t("vendorSettings.defaultOriginCityError");
    }

    if (!form.pricingModel) {
      nextFieldErrors.pricingModel = t("vendorSettings.pricingModelError");
    }

    if (!/^[A-Z]{3}$/.test(form.defaultCurrency)) {
      nextFieldErrors.defaultCurrency = t("vendorSettings.defaultCurrencyError");
    }

    if (form.pricingModel === "per_kg") {
      if (form.ratePerKg === "" || Number(form.ratePerKg) <= 0) {
        nextFieldErrors.ratePerKg = t("vendorSettings.ratePerKgError");
      }
    }

    if (form.pricingModel === "flat_fee") {
      if (form.flatFeePerItem === "" || Number(form.flatFeePerItem) <= 0) {
        nextFieldErrors.flatFeePerItem = t("vendorSettings.flatFeePerItemError");
      }
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setIsSubmitting(false);
      return;
    }

    if (!vendor?.id) {
      setErrorMessage(t("vendorSettings.noVendorBody"));
      setIsSubmitting(false);
      return;
    }

    try {
      await saveVendorProfile({
        vendorId: vendor.id,
        preferredLanguage: language,
        form,
      });
      setSuccessMessage(t("vendorSettings.successBody"));
      await refreshOnboardingData();
    } catch (error) {
      const normalizedMessage =
        error.message === "That vendor prefix is already in use."
          ? t("errors.vendorPrefixInUse")
          : error.message || t("errors.vendorProfileSaveFailed");
      setErrorMessage(normalizedMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <BackToDashboardLink />
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          {t("vendorSettings.title")}
        </h1>
        <p className="max-w-3xl text-base leading-7 text-slate-600">
          {t("vendorSettings.description")}
        </p>
      </section>

      {!canEdit ? (
        <InlineNotice
          title={t("permissions.restrictedSection")}
          description={t("permissions.noSettingsAccess")}
          tone="warning"
        />
      ) : null}

      {successMessage ? (
        <InlineNotice title={t("vendorSettings.successTitle")} description={successMessage} />
      ) : null}
      {errorMessage ? (
        <InlineNotice title={t("errors.title")} description={errorMessage} tone="error" />
      ) : null}

      {!vendor ? (
        <InlineNotice
          title={t("vendorSettings.noVendorTitle")}
          description={t("vendorSettings.noVendorBody")}
          tone="warning"
        />
      ) : null}

      <form className="max-w-3xl" onSubmit={handleSubmit}>
        <Card className="border-slate-200 bg-white/95 shadow-lg">
          <CardHeader>
            <CardTitle>{t("vendorSettings.cardTitle")}</CardTitle>
            <CardDescription>{t("vendorSettings.cardDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <RequiredLabel htmlFor="vendor-settings-company-name">
                {t("setup.companyName")}
              </RequiredLabel>
              <Input
                id="vendor-settings-company-name"
                name="companyName"
                value={form.companyName}
                onChange={handleChange}
                required
              />
              <p className={`text-xs ${fieldErrors.companyName ? "text-red-600" : "text-slate-500"}`}>
                {fieldErrors.companyName || t("vendorSettings.companyNameHelp")}
              </p>
            </div>

            <div className="space-y-2">
              <RequiredLabel htmlFor="vendor-settings-prefix">
                {t("setup.vendorPrefix")}
              </RequiredLabel>
              <Input
                id="vendor-settings-prefix"
                name="vendorPrefix"
                value={form.vendorPrefix}
                onChange={handleChange}
                autoCapitalize="characters"
                maxLength={3}
                required
              />
              <p className={`text-xs ${fieldErrors.vendorPrefix ? "text-red-600" : "text-slate-500"}`}>
                {fieldErrors.vendorPrefix || t("setup.vendorPrefixHelp")}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <RequiredLabel htmlFor="vendor-settings-origin-country">
                  {t("setup.defaultOriginCountry")}
                </RequiredLabel>
                <Select
                  value={form.defaultOriginCountry}
                  onValueChange={handleSelectChange("defaultOriginCountry")}
                >
                  <SelectTrigger
                    id="vendor-settings-origin-country"
                    aria-invalid={Boolean(fieldErrors.defaultOriginCountry)}
                  >
                    <SelectValue placeholder={t("setup.defaultOriginCountryPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {countryOptions.map((countryOption) => (
                      <SelectItem key={countryOption.code} value={countryOption.code}>
                        {countryOption.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p
                  className={`text-xs ${
                    fieldErrors.defaultOriginCountry ? "text-red-600" : "text-slate-500"
                  }`}
                >
                  {fieldErrors.defaultOriginCountry || t("setup.defaultOriginCountryHelp")}
                </p>
              </div>

              <div className="space-y-2">
                <RequiredLabel htmlFor="vendor-settings-origin-city">
                  {t("setup.defaultOriginCity")}
                </RequiredLabel>
                <Input
                  id="vendor-settings-origin-city"
                  name="defaultOriginCity"
                  value={form.defaultOriginCity}
                  onChange={handleChange}
                  required
                />
                <p
                  className={`text-xs ${
                    fieldErrors.defaultOriginCity ? "text-red-600" : "text-slate-500"
                  }`}
                >
                  {fieldErrors.defaultOriginCity || t("setup.defaultOriginCityHelp")}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-950">
                  {t("vendorSettings.pricingDefaultsTitle")}
                </p>
                <p className="text-xs text-slate-500">
                  {t("vendorSettings.pricingDefaultsDescription")}
                </p>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <RequiredLabel htmlFor="vendor-settings-pricing-model">
                    {t("vendorSettings.pricingModel")}
                  </RequiredLabel>
                  <Select value={form.pricingModel} onValueChange={handleSelectChange("pricingModel")}>
                    <SelectTrigger
                      id="vendor-settings-pricing-model"
                      aria-invalid={Boolean(fieldErrors.pricingModel)}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRICING_MODE_OPTIONS.map((pricingModel) => (
                        <SelectItem key={pricingModel} value={pricingModel}>
                          {t(`vendorSettings.pricingModelOptions.${pricingModel}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className={`text-xs ${fieldErrors.pricingModel ? "text-red-600" : "text-slate-500"}`}>
                    {fieldErrors.pricingModel || t("vendorSettings.pricingModelHelp")}
                  </p>
                </div>

                <div className="space-y-2">
                  <RequiredLabel htmlFor="vendor-settings-default-currency">
                    {t("vendorSettings.defaultCurrency")}
                  </RequiredLabel>
                  <Select
                    value={form.defaultCurrency}
                    onValueChange={handleSelectChange("defaultCurrency")}
                  >
                    <SelectTrigger
                      id="vendor-settings-default-currency"
                      aria-invalid={Boolean(fieldErrors.defaultCurrency)}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencyOptions.map((currencyOption) => (
                        <SelectItem key={currencyOption.code} value={currencyOption.code}>
                          {currencyOption.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className={`text-xs ${fieldErrors.defaultCurrency ? "text-red-600" : "text-slate-500"}`}>
                    {fieldErrors.defaultCurrency || t("vendorSettings.defaultCurrencyHelp")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendor-settings-rate-per-kg">
                    {t("vendorSettings.ratePerKg")} ({form.defaultCurrency || "USD"})
                  </Label>
                  <Input
                    id="vendor-settings-rate-per-kg"
                    name="ratePerKg"
                    type="text"
                    inputMode="decimal"
                    value={form.ratePerKg}
                    onChange={handleChange}
                    placeholder={t("vendorSettings.ratePerKgPlaceholder")}
                  />
                  <p className={`text-xs ${fieldErrors.ratePerKg ? "text-red-600" : "text-slate-500"}`}>
                    {fieldErrors.ratePerKg || t("vendorSettings.ratePerKgHelp")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendor-settings-flat-fee">
                    {t("vendorSettings.flatFeePerItem")} ({form.defaultCurrency || "USD"})
                  </Label>
                  <Input
                    id="vendor-settings-flat-fee"
                    name="flatFeePerItem"
                    type="text"
                    inputMode="decimal"
                    value={form.flatFeePerItem}
                    onChange={handleChange}
                    placeholder={t("vendorSettings.flatFeePerItemPlaceholder")}
                  />
                  <p className={`text-xs ${fieldErrors.flatFeePerItem ? "text-red-600" : "text-slate-500"}`}>
                    {fieldErrors.flatFeePerItem || t("vendorSettings.flatFeePerItemHelp")}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting || !vendor}>
                {isSubmitting ? t("common.saving") : t("vendorSettings.submit")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
