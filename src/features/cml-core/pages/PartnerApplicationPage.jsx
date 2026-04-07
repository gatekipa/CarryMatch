import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { Textarea } from "@/components/ui/textarea";
import {
  createPhoneNumberValue,
  PhoneNumberField,
  resolveDefaultPhoneCountry,
} from "@/features/cml-core/components/PhoneNumberField";
import {
  formatListForTextarea,
  submitPartnerApplication,
} from "@/features/cml-core/api/cmlOnboarding";
import { InlineNotice } from "@/features/cml-core/components/CmlStateScreens";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/lib/i18n";

const BUSINESS_TYPE_OPTIONS = [
  "Airline Luggage Consolidator",
  "Container / Barrel Shipper",
  "Bus Agency Parcels",
  "Other",
];

function RequiredLabel({ htmlFor, children }) {
  return (
    <Label htmlFor={htmlFor}>
      {children} <span className="text-red-600">*</span>
    </Label>
  );
}

export default function PartnerApplicationPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, application, authError, refreshAccessState } = useAuth();
  const { t, language } = useI18n();
  const defaultPhoneCountry = useMemo(() => resolveDefaultPhoneCountry(), []);
  const isRejectedApplication = application?.status === "rejected";
  const canEditApplication = !application || isRejectedApplication;
  const [form, setForm] = useState({
    fullName: user?.user_metadata?.full_name ?? "",
    companyName: "",
    phone: createPhoneNumberValue("", defaultPhoneCountry),
    whatsAppNumber: createPhoneNumberValue("", defaultPhoneCountry),
    businessTypeSelection: "",
    businessTypeOther: "",
    monthlyVolume: "",
    corridors: "",
    officeAddresses: "",
    notes: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const savedBusinessType = String(application?.business_type ?? "").trim();
    const isPresetBusinessType =
      savedBusinessType && BUSINESS_TYPE_OPTIONS.includes(savedBusinessType) && savedBusinessType !== "Other";

    setForm((current) => ({
      ...current,
      fullName: application?.full_name ?? user?.user_metadata?.full_name ?? current.fullName,
      companyName: application?.company_name ?? current.companyName,
      phone: application?.phone
        ? createPhoneNumberValue(application.phone, current.phone?.country || defaultPhoneCountry)
        : current.phone,
      whatsAppNumber: application?.whatsapp_number
        ? createPhoneNumberValue(
            application.whatsapp_number,
            current.whatsAppNumber?.country || current.phone?.country || defaultPhoneCountry,
          )
        : current.whatsAppNumber,
      businessTypeSelection: savedBusinessType
        ? isPresetBusinessType
          ? savedBusinessType
          : "Other"
        : current.businessTypeSelection,
      businessTypeOther:
        savedBusinessType && !isPresetBusinessType ? savedBusinessType : current.businessTypeOther,
      monthlyVolume: application?.monthly_volume ?? current.monthlyVolume,
      corridors:
        application?.corridors !== undefined
          ? formatListForTextarea(application.corridors)
          : current.corridors,
      officeAddresses:
        application?.office_addresses !== undefined
          ? formatListForTextarea(application.office_addresses)
          : current.officeAddresses,
      notes: application?.notes ?? current.notes,
    }));
  }, [
    application,
    defaultPhoneCountry,
    user?.user_metadata?.full_name,
  ]);

  const existingApplicationDescription = useMemo(() => {
    if (!application) {
      return null;
    }

    const statusLabel =
      application.status === "pending"
        ? t("accessState.application_pending")
        : application.status === "rejected"
          ? t("accessState.application_rejected")
          : t("accessState.setup_required");

    return `${application.company_name} - ${statusLabel}`;
  }, [application, t]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name === "monthlyVolume") {
      setForm((current) => ({ ...current, [name]: value.replace(/\D+/g, "") }));
      setFieldErrors((current) => ({ ...current, [name]: "" }));
      return;
    }

    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
  };

  const handleBusinessTypeChange = (value) => {
    setForm((current) => ({
      ...current,
      businessTypeSelection: value,
      businessTypeOther: value === "Other" ? current.businessTypeOther : "",
    }));
    setFieldErrors((current) => ({ ...current, businessTypeOther: "" }));
  };

  const handlePhoneChange = (fieldName) => (nextValue) => {
    setForm((current) => ({ ...current, [fieldName]: nextValue }));
    setFieldErrors((current) => ({ ...current, [fieldName]: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isAuthenticated) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");
    setFieldErrors({});

    const nextFieldErrors = {};

    if (!form.phone.normalizedValue) {
      nextFieldErrors.phone = t("phone.requiredError");
    }

    if (!form.businessTypeSelection) {
      nextFieldErrors.businessTypeSelection = t("apply.businessTypeRequired");
    }

    if (form.whatsAppNumber.rawInput && !form.whatsAppNumber.normalizedValue) {
      nextFieldErrors.whatsAppNumber = t("phone.optionalError");
    }

    if (form.businessTypeSelection === "Other" && !form.businessTypeOther.trim()) {
      nextFieldErrors.businessTypeOther = t("apply.otherBusinessTypeRequired");
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      await submitPartnerApplication({
        sessionUser: user,
        preferredLanguage: language,
        form: {
          ...form,
          phone: form.phone.normalizedValue,
          whatsAppNumber: form.whatsAppNumber.normalizedValue,
          businessType:
            form.businessTypeSelection === "Other"
              ? form.businessTypeOther.trim()
              : form.businessTypeSelection,
        },
      });
      setSuccessMessage(
        isRejectedApplication ? t("apply.resubmitSuccessBody") : t("apply.successBody"),
      );
      await refreshAccessState();
      navigate("/application-status", { replace: true });
    } catch (error) {
      const normalizedMessage =
        error.message === "An application already exists for this account."
          ? t("errors.applicationAlreadyExists")
          : error.message || t("errors.applicationSubmitFailed");
      setErrorMessage(normalizedMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">{t("apply.title")}</h1>
        <p className="max-w-2xl text-base leading-7 text-slate-600">{t("apply.description")}</p>
      </section>

      {!isAuthenticated ? (
        <InlineNotice title={t("common.deferredDataTitle")} description={t("apply.signInPrompt")} tone="warning" />
      ) : authError?.type === "config" ? (
        <InlineNotice title={t("common.environmentWarning")} description={t("errors.missingConfig")} tone="warning" />
      ) : application && !isRejectedApplication ? (
        <InlineNotice
          title={t("apply.existingApplicationTitle")}
          description={existingApplicationDescription || t("apply.existingApplicationBody")}
          tone="neutral"
        />
      ) : isRejectedApplication ? (
        <InlineNotice
          title={t("apply.rejectedApplicationTitle")}
          description={t("apply.rejectedApplicationBody")}
          tone="warning"
        />
      ) : (
        <InlineNotice title={t("common.sessionDetails")} description={`${t("common.email")}: ${user?.email ?? "-"}`} />
      )}

      <Card className="border-slate-200 bg-white/95 shadow-lg">
        <CardHeader>
          <CardTitle>{t("apply.formTitle")}</CardTitle>
          <CardDescription>{t("apply.helper")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {successMessage ? <InlineNotice title={t("apply.successTitle")} description={successMessage} /> : null}
          {errorMessage ? <InlineNotice title={t("errors.title")} description={errorMessage} tone="error" /> : null}

          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <RequiredLabel htmlFor="application-full-name">{t("common.fullName")}</RequiredLabel>
              <Input
                id="application-full-name"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                disabled={!isAuthenticated || !canEditApplication}
                required
              />
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor="application-company">{t("common.companyName")}</RequiredLabel>
              <Input
                id="application-company"
                name="companyName"
                value={form.companyName}
                onChange={handleChange}
                disabled={!isAuthenticated || !canEditApplication}
                required
              />
            </div>
            <div className="space-y-2">
              <PhoneNumberField
                id="application-phone"
                label={<><span>{t("common.phone")}</span> <span className="text-red-600">*</span></>}
                value={form.phone}
                onChange={handlePhoneChange("phone")}
                disabled={!isAuthenticated || !canEditApplication}
                required
                autoComplete="tel"
                errorMessage={fieldErrors.phone}
              />
            </div>
            <div className="space-y-2">
              <PhoneNumberField
                id="application-whatsapp"
                label={t("common.whatsAppNumber")}
                value={form.whatsAppNumber}
                onChange={handlePhoneChange("whatsAppNumber")}
                disabled={!isAuthenticated || !canEditApplication}
                autoComplete="tel"
                errorMessage={fieldErrors.whatsAppNumber}
              />
            </div>
            <div className="space-y-2">
              <RequiredLabel htmlFor="application-business-type">{t("common.businessType")}</RequiredLabel>
              <Select
                value={form.businessTypeSelection}
                onValueChange={handleBusinessTypeChange}
                disabled={!isAuthenticated || !canEditApplication}
              >
                <SelectTrigger id="application-business-type">
                  <SelectValue placeholder={t("apply.businessTypePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {t(`apply.businessTypeOptions.${option}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.businessTypeSelection ? (
                <p className="text-xs text-red-600">{fieldErrors.businessTypeSelection}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="application-volume">{t("common.monthlyVolume")}</Label>
              <Input
                id="application-volume"
                name="monthlyVolume"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={form.monthlyVolume}
                onChange={handleChange}
                disabled={!isAuthenticated || !canEditApplication}
                placeholder={t("apply.monthlyVolumePlaceholder")}
              />
              <p className="text-xs text-slate-500">{t("apply.monthlyVolumeHelp")}</p>
            </div>

            {form.businessTypeSelection === "Other" ? (
              <div className="space-y-2 md:col-span-2">
                <RequiredLabel htmlFor="application-business-type-other">
                  {t("apply.otherBusinessTypeLabel")}
                </RequiredLabel>
                <Input
                  id="application-business-type-other"
                  name="businessTypeOther"
                  value={form.businessTypeOther}
                  onChange={handleChange}
                  disabled={!isAuthenticated || !canEditApplication}
                  required
                />
                {fieldErrors.businessTypeOther ? (
                  <p className="text-xs text-red-600">{fieldErrors.businessTypeOther}</p>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="application-corridors">{t("common.corridors")}</Label>
              <p className="text-xs text-slate-500">{t("apply.corridorsHelp")}</p>
              <Textarea
                id="application-corridors"
                name="corridors"
                value={form.corridors}
                onChange={handleChange}
                disabled={!isAuthenticated || !canEditApplication}
                placeholder={t("apply.corridorsHint")}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="application-addresses">{t("common.officeAddresses")}</Label>
              <p className="text-xs text-slate-500">{t("apply.officeAddressesHelp")}</p>
              <Textarea
                id="application-addresses"
                name="officeAddresses"
                value={form.officeAddresses}
                onChange={handleChange}
                disabled={!isAuthenticated || !canEditApplication}
                placeholder={t("apply.officeAddressesHint")}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="application-notes">{t("common.notes")}</Label>
              <Textarea
                id="application-notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                disabled={!isAuthenticated || !canEditApplication}
              />
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-3">
              {isAuthenticated ? (
                application && !isRejectedApplication ? (
                  <Button asChild>
                    <Link to="/application-status">{t("apply.existingApplicationCta")}</Link>
                  </Button>
                ) : (
                  <Button type="submit" disabled={isSubmitting || authError?.type === "config"}>
                    {isSubmitting
                      ? t("common.saving")
                      : isRejectedApplication
                        ? t("apply.resubmit")
                        : t("apply.submit")}
                  </Button>
                )
              ) : (
                <Button asChild>
                  <Link to="/signup">{t("apply.accountRequiredCta")}</Link>
                </Button>
              )}
              <Button asChild variant="outline">
                <Link to="/pricing">{t("common.viewPricing")}</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
