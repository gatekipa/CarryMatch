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
import {
  formatBranchRowsForOfficeEntries,
  replaceVendorBranches,
} from "@/features/cml-core/api/cmlOnboarding";
import { BackToDashboardLink } from "@/features/cml-core/components/BackToDashboardLink";
import { InlineNotice } from "@/features/cml-core/components/CmlStateScreens";
import { buildCountryOptions } from "@/features/cml-core/lib/countries";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/lib/i18n";

function RequiredLabel({ htmlFor, children }) {
  return (
    <Label htmlFor={htmlFor}>
      {children} <span className="text-red-600">*</span>
    </Label>
  );
}

const createBranchEntry = (overrides = {}) => ({
  id: overrides.id ?? `branch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  officeName: overrides.officeName ?? "",
  countryCode: overrides.countryCode ?? "",
  city: overrides.city ?? "",
  address: overrides.address ?? "",
});

export default function BranchManagementPage() {
  const { t, language } = useI18n();
  const { vendor, vendorBranches, refreshOnboardingData } = useAuth();
  const countryOptions = useMemo(() => buildCountryOptions(language), [language]);
  const [branches, setBranches] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const destinationBranches = useMemo(
    () => vendorBranches.filter((branch) => branch?.side !== "origin"),
    [vendorBranches],
  );

  useEffect(() => {
    setBranches(formatBranchRowsForOfficeEntries(destinationBranches));
  }, [destinationBranches]);

  const handleBranchChange = (branchId, fieldName) => (event) => {
    const { value } = event.target;

    setBranches((current) =>
      current.map((branch) => (branch.id === branchId ? { ...branch, [fieldName]: value } : branch)),
    );
    setErrorMessage("");
    setFieldErrors((current) => ({
      ...current,
      [`branch:${branchId}:${fieldName}`]: "",
    }));
  };

  const handleAddBranch = () => {
    setBranches((current) => [...current, createBranchEntry()]);
    setErrorMessage("");
  };

  const handleBranchCountryChange = (branchId) => (value) => {
    setBranches((current) =>
      current.map((branch) => (branch.id === branchId ? { ...branch, countryCode: value } : branch)),
    );
    setErrorMessage("");
    setFieldErrors((current) => ({
      ...current,
      [`branch:${branchId}:countryCode`]: "",
    }));
  };

  const handleRemoveBranch = (branchId) => {
    setBranches((current) => current.filter((branch) => branch.id !== branchId));
    setErrorMessage("");
    setFieldErrors((current) => {
      const nextErrors = { ...current };
      delete nextErrors[`branch:${branchId}:officeName`];
      delete nextErrors[`branch:${branchId}:countryCode`];
      delete nextErrors[`branch:${branchId}:city`];
      delete nextErrors[`branch:${branchId}:address`];
      return nextErrors;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});
    setErrorMessage("");
    setSuccessMessage("");

    if (!vendor?.id) {
      setErrorMessage(t("branchManagement.noVendorBody"));
      setIsSubmitting(false);
      return;
    }

    const nextFieldErrors = {};
    const normalizedBranches = branches.map((branch) => ({
      id: branch.id,
      officeName: branch.officeName.trim(),
      countryCode: branch.countryCode.trim(),
      city: branch.city.trim(),
      address: branch.address.trim(),
    }));
    const populatedBranches = normalizedBranches.filter(
      (branch) => branch.officeName || branch.countryCode || branch.city || branch.address,
    );

    if (populatedBranches.length === 0) {
      setErrorMessage(t("branchManagement.minOneBranchError"));
      setIsSubmitting(false);
      return;
    }

    populatedBranches.forEach((branch) => {
      if (!branch.officeName && !branch.countryCode && !branch.city && !branch.address) {
        return;
      }

      if (!branch.officeName) {
        nextFieldErrors[`branch:${branch.id}:officeName`] = t("branchManagement.officeNameError");
      }

      if (!branch.countryCode) {
        nextFieldErrors[`branch:${branch.id}:countryCode`] = t("branchManagement.countryError");
      }

      if (!branch.city) {
        nextFieldErrors[`branch:${branch.id}:city`] = t("branchManagement.cityError");
      }

      if (!branch.address) {
        nextFieldErrors[`branch:${branch.id}:address`] = t("branchManagement.addressError");
      }
    });

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      await replaceVendorBranches({
        vendorId: vendor.id,
        offices: populatedBranches,
      });
      setSuccessMessage(t("branchManagement.successBody"));
      await refreshOnboardingData();
    } catch (error) {
      setErrorMessage(error.message || t("errors.branchSaveFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <BackToDashboardLink />
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          {t("branchManagement.title")}
        </h1>
        <p className="max-w-3xl text-base leading-7 text-slate-600">
          {t("branchManagement.description")}
        </p>
      </section>

      <InlineNotice
        title={t("branchManagement.helperTitle")}
        description={t("branchManagement.helperBody")}
      />

      {successMessage ? (
        <InlineNotice title={t("branchManagement.successTitle")} description={successMessage} />
      ) : null}
      {errorMessage ? (
        <InlineNotice title={t("errors.title")} description={errorMessage} tone="error" />
      ) : null}
      {!vendor ? (
        <InlineNotice
          title={t("branchManagement.noVendorTitle")}
          description={t("branchManagement.noVendorBody")}
          tone="warning"
        />
      ) : null}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">{t("branchManagement.actionsHelp")}</p>
          <div className="flex flex-wrap gap-3">
            <Button type="button" variant="outline" onClick={handleAddBranch}>
              {t("branchManagement.addBranch")}
            </Button>
            <Button type="submit" disabled={isSubmitting || !vendor}>
              {isSubmitting ? t("common.saving") : t("branchManagement.save")}
            </Button>
          </div>
        </div>

        {branches.length === 0 ? (
          <Card className="border-dashed border-slate-300 bg-slate-50/80">
            <CardHeader>
              <CardTitle>{t("branchManagement.emptyTitle")}</CardTitle>
              <CardDescription>{t("branchManagement.emptyBody")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button type="button" variant="outline" onClick={handleAddBranch}>
                {t("branchManagement.addFirstBranch")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {branches.map((branch, index) => (
              <Card key={branch.id} className="border-slate-200 bg-white/95 shadow-lg">
                <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                  <div className="space-y-1">
                    <CardTitle>{t("branchManagement.branchCard")} {index + 1}</CardTitle>
                    <CardDescription>{t("branchManagement.branchCardHelp")}</CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    className="px-2 text-slate-600"
                    onClick={() => handleRemoveBranch(branch.id)}
                  >
                    {t("branchManagement.removeBranch")}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <RequiredLabel htmlFor={`branch-name-${branch.id}`}>
                      {t("setup.destinationOfficeName")}
                    </RequiredLabel>
                    <Input
                      id={`branch-name-${branch.id}`}
                      value={branch.officeName}
                      onChange={handleBranchChange(branch.id, "officeName")}
                      placeholder={t("setup.destinationOfficeNamePlaceholder")}
                    />
                    <p
                      className={`text-xs ${
                        fieldErrors[`branch:${branch.id}:officeName`] ? "text-red-600" : "text-slate-500"
                      }`}
                    >
                      {fieldErrors[`branch:${branch.id}:officeName`] ||
                        t("branchManagement.officeNameHelp")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <RequiredLabel htmlFor={`branch-country-${branch.id}`}>
                      {t("branchManagement.country")}
                    </RequiredLabel>
                    <Select
                      value={branch.countryCode}
                      onValueChange={handleBranchCountryChange(branch.id)}
                    >
                      <SelectTrigger
                        id={`branch-country-${branch.id}`}
                        aria-invalid={Boolean(fieldErrors[`branch:${branch.id}:countryCode`])}
                      >
                        <SelectValue placeholder={t("branchManagement.countryPlaceholder")} />
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
                        fieldErrors[`branch:${branch.id}:countryCode`] ? "text-red-600" : "text-slate-500"
                      }`}
                    >
                      {fieldErrors[`branch:${branch.id}:countryCode`] || t("branchManagement.countryHelp")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <RequiredLabel htmlFor={`branch-city-${branch.id}`}>
                      {t("branchManagement.city")}
                    </RequiredLabel>
                    <Input
                      id={`branch-city-${branch.id}`}
                      value={branch.city}
                      onChange={handleBranchChange(branch.id, "city")}
                      placeholder={t("branchManagement.cityPlaceholder")}
                    />
                    <p
                      className={`text-xs ${
                        fieldErrors[`branch:${branch.id}:city`] ? "text-red-600" : "text-slate-500"
                      }`}
                    >
                      {fieldErrors[`branch:${branch.id}:city`] || t("branchManagement.cityHelp")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <RequiredLabel htmlFor={`branch-address-${branch.id}`}>
                      {t("setup.destinationOfficeAddress")}
                    </RequiredLabel>
                    <Input
                      id={`branch-address-${branch.id}`}
                      value={branch.address}
                      onChange={handleBranchChange(branch.id, "address")}
                      placeholder={t("setup.destinationOfficeAddressPlaceholder")}
                    />
                    <p
                      className={`text-xs ${
                        fieldErrors[`branch:${branch.id}:address`] ? "text-red-600" : "text-slate-500"
                      }`}
                    >
                      {fieldErrors[`branch:${branch.id}:address`] || t("branchManagement.addressHelp")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}
