import React, { useEffect, useMemo, useState } from "react";
import { getCountries } from "libphonenumber-js/min";
import { useNavigate } from "react-router-dom";
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
import {
  formatBranchRowsForOfficeEntries,
  saveSetupWizard,
} from "@/features/cml-core/api/cmlOnboarding";
import { InlineNotice } from "@/features/cml-core/components/CmlStateScreens";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/lib/i18n";

function RequiredLabel({ htmlFor, children }) {
  return (
    <Label htmlFor={htmlFor}>
      {children} <span className="text-red-600">*</span>
    </Label>
  );
}

const AVAILABLE_COUNTRIES = getCountries();
const createOfficeEntry = (overrides = {}) => ({
  id: overrides.id ?? `office-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  officeName: overrides.officeName ?? "",
  countryCode: overrides.countryCode ?? "",
  city: overrides.city ?? "",
  address: overrides.address ?? "",
});

const normalizeCountryMatch = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const getDisplayNames = (language) => {
  if (typeof Intl === "undefined" || typeof Intl.DisplayNames !== "function") {
    return null;
  }

  return new Intl.DisplayNames([language], { type: "region" });
};

const resolveStoredCountryCode = (value) => {
  if (!value) {
    return "";
  }

  const normalizedValue = String(value).trim().toUpperCase();

  if (AVAILABLE_COUNTRIES.includes(normalizedValue)) {
    return normalizedValue;
  }

  const searchValue = normalizeCountryMatch(value);
  const englishNames = getDisplayNames("en");
  const frenchNames = getDisplayNames("fr");

  for (const countryCode of AVAILABLE_COUNTRIES) {
    const candidates = [
      countryCode,
      englishNames?.of(countryCode),
      frenchNames?.of(countryCode),
    ].filter(Boolean);

    if (candidates.some((candidate) => normalizeCountryMatch(candidate) === searchValue)) {
      return countryCode;
    }
  }

  return "";
};

export default function SetupWizardPage() {
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const { user, application, vendor, vendorBranches, authError, refreshAccessState } = useAuth();
  const countryOptions = useMemo(() => {
    const displayNames = getDisplayNames(language);

    return AVAILABLE_COUNTRIES.map((countryCode) => ({
      code: countryCode,
      name: displayNames?.of(countryCode) ?? countryCode,
    })).sort((left, right) => left.name.localeCompare(right.name, language));
  }, [language]);
  const [form, setForm] = useState({
    companyName: "",
    vendorPrefix: "",
    defaultOriginCountry: "",
    defaultOriginCity: "",
    destinationOffices: [createOfficeEntry()],
    pricingModel: "per_kg",
    insuranceModel: "percentage",
    planChoice: "free",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const nextDestinationOffices = formatBranchRowsForOfficeEntries(vendorBranches);

    setForm((current) => ({
      companyName: vendor?.company_name ?? application?.company_name ?? current.companyName,
      vendorPrefix: vendor?.vendor_prefix ?? current.vendorPrefix,
      defaultOriginCountry:
        resolveStoredCountryCode(vendor?.default_origin_country) ||
        current.defaultOriginCountry,
      defaultOriginCity: vendor?.default_origin_city ?? current.defaultOriginCity,
      destinationOffices:
        nextDestinationOffices.length > 0
          ? nextDestinationOffices.map((entry) => createOfficeEntry(entry))
          : current.destinationOffices.length > 0
            ? current.destinationOffices
            : [createOfficeEntry()],
      pricingModel: vendor?.pricing_model ?? current.pricingModel,
      insuranceModel: vendor?.insurance_model ?? current.insuranceModel,
      planChoice: vendor?.plan_tier ?? current.planChoice,
    }));
  }, [application, vendor, vendorBranches]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === "vendorPrefix") {
      setForm((current) => ({
        ...current,
        [name]: value.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase(),
      }));
      setFieldErrors((current) => ({ ...current, vendorPrefix: "" }));
      return;
    }

    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
  };

  const handleSelectChange = (fieldName) => (value) => {
    setForm((current) => ({ ...current, [fieldName]: value }));
    setFieldErrors((current) => ({ ...current, [fieldName]: "" }));
  };

  const handleDestinationOfficeChange = (officeId, fieldName) => (event) => {
    const { value } = event.target;

    setForm((current) => ({
      ...current,
      destinationOffices: current.destinationOffices.map((office) =>
        office.id === officeId ? { ...office, [fieldName]: value } : office,
      ),
    }));

    setFieldErrors((current) => ({
      ...current,
      destinationOffices: "",
      [`destinationOffice:${officeId}:${fieldName}`]: "",
    }));
  };

  const handleDestinationOfficeCountryChange = (officeId) => (value) => {
    setForm((current) => ({
      ...current,
      destinationOffices: current.destinationOffices.map((office) =>
        office.id === officeId ? { ...office, countryCode: value } : office,
      ),
    }));

    setFieldErrors((current) => ({
      ...current,
      destinationOffices: "",
      [`destinationOffice:${officeId}:countryCode`]: "",
    }));
  };

  const handleAddDestinationOffice = () => {
    setForm((current) => ({
      ...current,
      destinationOffices: [...current.destinationOffices, createOfficeEntry()],
    }));
    setFieldErrors((current) => ({ ...current, destinationOffices: "" }));
  };

  const handleRemoveDestinationOffice = (officeId) => {
    setForm((current) => ({
      ...current,
      destinationOffices: current.destinationOffices.filter((office) => office.id !== officeId),
    }));

    setFieldErrors((current) => {
      const nextErrors = { ...current, destinationOffices: "" };

      delete nextErrors[`destinationOffice:${officeId}:officeName`];
      delete nextErrors[`destinationOffice:${officeId}:countryCode`];
      delete nextErrors[`destinationOffice:${officeId}:city`];
      delete nextErrors[`destinationOffice:${officeId}:address`];

      return nextErrors;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");
    setFieldErrors({});

    const nextFieldErrors = {};

    if (!/^[A-Z]{3}$/.test(form.vendorPrefix)) {
      nextFieldErrors.vendorPrefix = t("setup.vendorPrefixError");
    }

    if (!form.defaultOriginCountry) {
      nextFieldErrors.defaultOriginCountry = t("setup.defaultOriginCountryError");
    }

    const destinationOffices = form.destinationOffices
      .map((office) => ({
        id: office.id,
        officeName: office.officeName.trim(),
        countryCode: office.countryCode.trim(),
        city: office.city.trim(),
        address: office.address.trim(),
      }))
      .filter((office) => office.officeName || office.countryCode || office.city || office.address);

    if (destinationOffices.length === 0) {
      nextFieldErrors.destinationOffices = t("setup.destinationOfficesRequired");
    }

    destinationOffices.forEach((office) => {
      if (!office.officeName) {
        nextFieldErrors[`destinationOffice:${office.id}:officeName`] = t(
          "setup.destinationOfficeNameError",
        );
      }

      if (!office.countryCode) {
        nextFieldErrors[`destinationOffice:${office.id}:countryCode`] = t(
          "setup.destinationOfficeCountryError",
        );
      }

      if (!office.city) {
        nextFieldErrors[`destinationOffice:${office.id}:city`] = t(
          "setup.destinationOfficeCityError",
        );
      }

      if (!office.address) {
        nextFieldErrors[`destinationOffice:${office.id}:address`] = t(
          "setup.destinationOfficeAddressError",
        );
      }
    });

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      await saveSetupWizard({
        sessionUser: user,
        application,
        existingVendor: vendor,
        preferredLanguage: language,
        form,
      });
      setSuccessMessage(t("setup.successBody"));
      await refreshAccessState();
      navigate("/dashboard", { replace: true });
    } catch (error) {
      const normalizedMessage =
        error.message === "That vendor prefix is already in use."
          ? t("errors.vendorPrefixInUse")
          : error.message === "An approved application is required before setup can continue."
            ? t("errors.setupRequiresApprovedApplication")
            : error.message || t("errors.setupSaveFailed");
      setErrorMessage(normalizedMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{t("setup.title")}</h1>
        <p className="max-w-2xl text-base leading-7 text-slate-600">{t("setup.description")}</p>
      </section>

      {authError?.type === "config" ? (
        <InlineNotice title={t("common.environmentWarning")} description={t("errors.missingConfig")} tone="warning" />
      ) : (
        <InlineNotice title={t("setup.approvedNoticeTitle")} description={t("setup.approvedNoticeBody")} />
      )}

      {successMessage ? <InlineNotice title={t("setup.successTitle")} description={successMessage} /> : null}
      {errorMessage ? <InlineNotice title={t("errors.title")} description={errorMessage} tone="error" /> : null}

      <form className="grid gap-4 lg:grid-cols-3" onSubmit={handleSubmit}>
        <Card className="border-slate-200 bg-white/95 shadow-lg">
          <CardHeader>
            <CardTitle>{t("setup.sectionOne")}</CardTitle>
            <CardDescription>{t("setup.sectionOneHelp")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <RequiredLabel htmlFor="setup-company-name">{t("setup.companyName")}</RequiredLabel>
              <Input
                id="setup-company-name"
                name="companyName"
                value={form.companyName}
                onChange={handleChange}
                required
              />
              <p className="text-xs text-slate-500">{t("setup.companyNameHelp")}</p>
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor="setup-vendor-prefix">{t("setup.vendorPrefix")}</RequiredLabel>
              <Input
                id="setup-vendor-prefix"
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
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white/95 shadow-lg">
          <CardHeader>
            <CardTitle>{t("setup.sectionTwo")}</CardTitle>
            <CardDescription>{t("setup.sectionTwoHelp")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <RequiredLabel htmlFor="setup-origin-country">{t("setup.defaultOriginCountry")}</RequiredLabel>
              <Select value={form.defaultOriginCountry} onValueChange={handleSelectChange("defaultOriginCountry")}>
                <SelectTrigger id="setup-origin-country" aria-invalid={Boolean(fieldErrors.defaultOriginCountry)}>
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
              <p className={`text-xs ${fieldErrors.defaultOriginCountry ? "text-red-600" : "text-slate-500"}`}>
                {fieldErrors.defaultOriginCountry || t("setup.defaultOriginCountryHelp")}
              </p>
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor="setup-origin-city">{t("setup.defaultOriginCity")}</RequiredLabel>
              <Input
                id="setup-origin-city"
                name="defaultOriginCity"
                value={form.defaultOriginCity}
                onChange={handleChange}
                required
              />
              <p className="text-xs text-slate-500">{t("setup.defaultOriginCityHelp")}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-950">
                    {t("setup.destinationBranches")} <span className="text-red-600">*</span>
                  </p>
                  <p
                    className={`text-xs ${
                      fieldErrors.destinationOffices ? "text-red-600" : "text-slate-500"
                    }`}
                  >
                    {fieldErrors.destinationOffices || t("setup.destinationBranchesHelp")}
                  </p>
                </div>
                <Button type="button" variant="outline" onClick={handleAddDestinationOffice}>
                  {t("setup.destinationOfficeAdd")}
                </Button>
              </div>

              {form.destinationOffices.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {t("setup.destinationOfficesEmpty")}
                </div>
              ) : (
                <div className="space-y-3">
                  {form.destinationOffices.map((office, index) => (
                    <div
                      key={office.id}
                      className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/70 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-slate-900">
                          {t("setup.destinationOfficeCard")} {index + 1}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          className="px-2 text-slate-600"
                          onClick={() => handleRemoveDestinationOffice(office.id)}
                        >
                          {t("setup.destinationOfficeRemove")}
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <RequiredLabel htmlFor={`setup-office-name-${office.id}`}>
                          {t("setup.destinationOfficeName")}
                        </RequiredLabel>
                        <Input
                          id={`setup-office-name-${office.id}`}
                          value={office.officeName}
                          onChange={handleDestinationOfficeChange(office.id, "officeName")}
                          placeholder={t("setup.destinationOfficeNamePlaceholder")}
                        />
                        <p
                          className={`text-xs ${
                            fieldErrors[`destinationOffice:${office.id}:officeName`]
                              ? "text-red-600"
                              : "text-slate-500"
                          }`}
                        >
                          {fieldErrors[`destinationOffice:${office.id}:officeName`] ||
                            t("setup.destinationOfficeNameHelp")}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <RequiredLabel htmlFor={`setup-office-country-${office.id}`}>
                          {t("setup.destinationOfficeCountry")}
                        </RequiredLabel>
                        <Select
                          value={office.countryCode}
                          onValueChange={handleDestinationOfficeCountryChange(office.id)}
                        >
                          <SelectTrigger
                            id={`setup-office-country-${office.id}`}
                            aria-invalid={Boolean(fieldErrors[`destinationOffice:${office.id}:countryCode`])}
                          >
                            <SelectValue placeholder={t("setup.destinationOfficeCountryPlaceholder")} />
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
                            fieldErrors[`destinationOffice:${office.id}:countryCode`]
                              ? "text-red-600"
                              : "text-slate-500"
                          }`}
                        >
                          {fieldErrors[`destinationOffice:${office.id}:countryCode`] ||
                            t("setup.destinationOfficeCountryHelp")}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <RequiredLabel htmlFor={`setup-office-city-${office.id}`}>
                          {t("setup.destinationOfficeCity")}
                        </RequiredLabel>
                        <Input
                          id={`setup-office-city-${office.id}`}
                          value={office.city}
                          onChange={handleDestinationOfficeChange(office.id, "city")}
                          placeholder={t("setup.destinationOfficeCityPlaceholder")}
                        />
                        <p
                          className={`text-xs ${
                            fieldErrors[`destinationOffice:${office.id}:city`]
                              ? "text-red-600"
                              : "text-slate-500"
                          }`}
                        >
                          {fieldErrors[`destinationOffice:${office.id}:city`] ||
                            t("setup.destinationOfficeCityHelp")}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <RequiredLabel htmlFor={`setup-office-address-${office.id}`}>
                          {t("setup.destinationOfficeAddress")}
                        </RequiredLabel>
                        <Input
                          id={`setup-office-address-${office.id}`}
                          value={office.address}
                          onChange={handleDestinationOfficeChange(office.id, "address")}
                          placeholder={t("setup.destinationOfficeAddressPlaceholder")}
                        />
                        <p
                          className={`text-xs ${
                            fieldErrors[`destinationOffice:${office.id}:address`]
                              ? "text-red-600"
                              : "text-slate-500"
                          }`}
                        >
                          {fieldErrors[`destinationOffice:${office.id}:address`] ||
                            t("setup.destinationOfficeAddressHelp")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white/95 shadow-lg">
          <CardHeader>
            <CardTitle>{t("setup.sectionThree")}</CardTitle>
            <CardDescription>{t("setup.sectionThreeHelp")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <InlineNotice title={t("setup.defaultsNoticeTitle")} description={t("setup.defaultsNoticeBody")} />
            <div className="space-y-2">
              <RequiredLabel htmlFor="setup-pricing-model">{t("setup.pricingModel")}</RequiredLabel>
              <Select value={form.pricingModel} onValueChange={handleSelectChange("pricingModel")}>
                <SelectTrigger id="setup-pricing-model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_kg">{t("setup.pricingPerKg")}</SelectItem>
                  <SelectItem value="flat_fee">{t("setup.pricingFlatFee")}</SelectItem>
                  <SelectItem value="manual">{t("setup.pricingManual")}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">{t("setup.pricingModelHelp")}</p>
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor="setup-insurance-model">{t("setup.insuranceModel")}</RequiredLabel>
              <Select value={form.insuranceModel} onValueChange={handleSelectChange("insuranceModel")}>
                <SelectTrigger id="setup-insurance-model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">{t("setup.insurancePercentage")}</SelectItem>
                  <SelectItem value="flat">{t("setup.insuranceFlat")}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">{t("setup.insuranceModelHelp")}</p>
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor="setup-plan-choice">{t("setup.planChoice")}</RequiredLabel>
              <Select value={form.planChoice} onValueChange={handleSelectChange("planChoice")}>
                <SelectTrigger id="setup-plan-choice">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">{t("setup.planFree")}</SelectItem>
                  <SelectItem value="pro">{t("setup.planPro")}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">{t("common.plan")}: {form.planChoice.toUpperCase()}</p>
            </div>
            <Button className="w-full" type="submit" disabled={isSubmitting || authError?.type === "config"}>
              {isSubmitting ? t("common.saving") : t("setup.submit")}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
