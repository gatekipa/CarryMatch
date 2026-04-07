import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
  createVendorShipment,
  findVendorCustomerByPhone,
  listVendorDestinationBranches,
} from "@/features/cml-core/api/cmlShipments";
import { BackToDashboardLink } from "@/features/cml-core/components/BackToDashboardLink";
import { InlineNotice } from "@/features/cml-core/components/CmlStateScreens";
import {
  buildCountryOptions,
  resolveStoredCountryCode,
} from "@/features/cml-core/lib/countries";
import { openShipmentLabel } from "@/features/cml-core/lib/shippingLabel";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/lib/i18n";

const SHIPPING_MODES = ["air", "sea", "road-bus"];
const PAYMENT_STATUSES = ["unpaid", "paid"];
const SHIPMENT_CATEGORY_OPTIONS = [
  "Documents",
  "Electronics",
  "Clothing",
  "Food",
  "Fragile",
  "Household",
  "Medical",
  "Other",
];
const OTHER_CATEGORY_VALUE = "Other";
const DEFAULT_CURRENCY = "USD";

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

function normalizeCurrencyCode(value) {
  const normalizedValue = String(value ?? "")
    .trim()
    .toUpperCase();

  return /^[A-Z]{3}$/.test(normalizedValue) ? normalizedValue : DEFAULT_CURRENCY;
}

function parseNumberValue(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function roundCurrencyValue(value) {
  return Math.round(Number(value) * 100) / 100;
}

function formatEditableAmount(value) {
  const numericValue = parseNumberValue(value);

  if (numericValue === null) {
    return "";
  }

  const roundedValue = roundCurrencyValue(numericValue);
  return roundedValue.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}

function formatCurrencyAmount(amount, currencyCode, language) {
  const numericValue = Number.isFinite(Number(amount)) ? Number(amount) : 0;

  try {
    return new Intl.NumberFormat(language, {
      style: "currency",
      currency: normalizeCurrencyCode(currencyCode),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericValue);
  } catch {
    return `${numericValue.toFixed(2)} ${normalizeCurrencyCode(currencyCode)}`;
  }
}

function buildInitialShipmentForm(vendor, defaultPhoneCountry) {
  const preferredPhoneCountry =
    resolveStoredCountryCode(vendor?.default_origin_country) || defaultPhoneCountry;

  return {
    senderPhone: createPhoneNumberValue("", preferredPhoneCountry),
    senderName: "",
    senderWhatsApp: createPhoneNumberValue("", preferredPhoneCountry),
    senderEmail: "",
    receiverPhone: createPhoneNumberValue("", preferredPhoneCountry),
    receiverName: "",
    receiverWhatsApp: createPhoneNumberValue("", preferredPhoneCountry),
    receiverEmail: "",
    originCountry: resolveStoredCountryCode(vendor?.default_origin_country),
    originCity: vendor?.default_origin_city ?? "",
    destinationBranchId: "",
    destinationCountry: "",
    destinationCity: "",
    shippingMode: "road-bus",
    contentsDescription: "",
    weightKg: "",
    quantity: "1",
    categoryPreset: "",
    categoryOther: "",
    basePrice: "",
    discountAmount: "",
    paymentStatus: "unpaid",
    referenceNote: "",
  };
}

function resolveShipmentCategory(form) {
  if (form.categoryPreset === OTHER_CATEGORY_VALUE) {
    return form.categoryOther.trim();
  }

  return String(form.categoryPreset ?? "").trim();
}

function resolveAutoPricing(vendor, form) {
  const pricingModel = vendor?.pricing_model ?? "manual";
  const weightKg = parseNumberValue(form.weightKg);
  const quantity = Number.parseInt(form.quantity || "", 10);
  const ratePerKg = parseNumberValue(vendor?.rate_per_kg);
  const flatFeePerItem = parseNumberValue(vendor?.flat_fee_per_item);

  if (pricingModel === "per_kg") {
    if (!(ratePerKg > 0)) {
      return { mode: pricingModel, canAutoCalculate: false, reason: "missing_default", ratePerKg };
    }

    if (!(weightKg > 0)) {
      return { mode: pricingModel, canAutoCalculate: false, reason: "awaiting_weight", ratePerKg };
    }

    return {
      mode: pricingModel,
      canAutoCalculate: true,
      reason: "auto",
      ratePerKg,
      amount: roundCurrencyValue(weightKg * ratePerKg),
    };
  }

  if (pricingModel === "flat_fee") {
    if (!(flatFeePerItem > 0)) {
      return {
        mode: pricingModel,
        canAutoCalculate: false,
        reason: "missing_default",
        flatFeePerItem,
      };
    }

    if (!(quantity > 0)) {
      return {
        mode: pricingModel,
        canAutoCalculate: false,
        reason: "awaiting_quantity",
        flatFeePerItem,
      };
    }

    return {
      mode: pricingModel,
      canAutoCalculate: true,
      reason: "auto",
      flatFeePerItem,
      amount: roundCurrencyValue(quantity * flatFeePerItem),
    };
  }

  return { mode: "manual", canAutoCalculate: false, reason: "manual" };
}

function getCountryName(countryCode, countryNameByCode) {
  const resolvedCode = resolveStoredCountryCode(countryCode);
  return countryNameByCode[resolvedCode] ?? resolvedCode;
}

function formatRouteLocation(city, countryCode, countryNameByCode) {
  const parts = [String(city ?? "").trim(), getCountryName(countryCode, countryNameByCode)].filter(Boolean);
  return parts.join(", ");
}

function buildBranchOptionLabel(branch, countryNameByCode) {
  const parts = [branch?.branch_name?.trim()];
  const countryName = getCountryName(branch?.country_code, countryNameByCode);
  const cityName = String(branch?.city ?? "").trim();

  if (cityName) {
    parts.push(cityName);
  }

  if (countryName) {
    parts.push(countryName);
  }

  return parts.filter(Boolean).join(" - ");
}

function buildPricingDefaultDescription({ autoPricing, currencyCode, language, t }) {
  if (autoPricing.mode === "per_kg" && autoPricing.ratePerKg > 0) {
    return `${t("shipmentIntake.pricingDefaultLabel")}: ${t("shipmentIntake.pricingRulePerKg")} (${formatCurrencyAmount(
      autoPricing.ratePerKg,
      currencyCode,
      language,
    )}${t("shipmentIntake.perKgSuffix")})`;
  }

  if (autoPricing.mode === "flat_fee" && autoPricing.flatFeePerItem > 0) {
    return `${t("shipmentIntake.pricingDefaultLabel")}: ${t("shipmentIntake.pricingRuleFlatFee")} (${formatCurrencyAmount(
      autoPricing.flatFeePerItem,
      currencyCode,
      language,
    )}${t("shipmentIntake.perItemSuffix")})`;
  }

  if (autoPricing.mode === "manual") {
    return `${t("shipmentIntake.pricingDefaultLabel")}: ${t("shipmentIntake.pricingRuleManual")}`;
  }

  return `${t("shipmentIntake.pricingDefaultLabel")}: ${t("shipmentIntake.pricingDefaultUnavailable")}`;
}

function buildBasePriceHelp({ autoPricing, isManualOverride, t }) {
  if (autoPricing.mode === "manual") {
    return t("shipmentIntake.basePriceManualHelp");
  }

  if (autoPricing.reason === "missing_default") {
    return t("shipmentIntake.basePriceMissingDefaultHelp");
  }

  if (autoPricing.reason === "awaiting_weight") {
    return t("shipmentIntake.basePriceAwaitingWeightHelp");
  }

  if (autoPricing.reason === "awaiting_quantity") {
    return t("shipmentIntake.basePriceAwaitingQuantityHelp");
  }

  if (isManualOverride) {
    return t("shipmentIntake.basePriceOverrideHelp");
  }

  if (autoPricing.mode === "per_kg") {
    return t("shipmentIntake.basePriceAutoPerKgHelp");
  }

  if (autoPricing.mode === "flat_fee") {
    return t("shipmentIntake.basePriceAutoFlatFeeHelp");
  }

  return t("shipmentIntake.basePriceHelp");
}

export default function NewShipmentIntakePage() {
  const { t, language } = useI18n();
  const { vendor } = useAuth();
  const defaultPhoneCountry = useMemo(() => resolveDefaultPhoneCountry(), []);
  const countryOptions = useMemo(() => buildCountryOptions(language), [language]);
  const countryNameByCode = useMemo(
    () => Object.fromEntries(countryOptions.map((countryOption) => [countryOption.code, countryOption.name])),
    [countryOptions],
  );
  const currencyCode = normalizeCurrencyCode(vendor?.default_currency);
  const [form, setForm] = useState(() => buildInitialShipmentForm(vendor, defaultPhoneCountry));
  const [fieldErrors, setFieldErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [createdShipment, setCreatedShipment] = useState(null);
  const [destinationBranches, setDestinationBranches] = useState([]);
  const [isLoadingDestinationBranches, setIsLoadingDestinationBranches] = useState(false);
  const [destinationBranchesError, setDestinationBranchesError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLookingUpSender, setIsLookingUpSender] = useState(false);
  const [isOpeningCreatedLabel, setIsOpeningCreatedLabel] = useState(false);
  const [senderLookupState, setSenderLookupState] = useState(null);
  const [isBasePriceOverridden, setIsBasePriceOverridden] = useState(false);
  const selectedDestinationBranch = useMemo(
    () => destinationBranches.find((branch) => branch.id === form.destinationBranchId) ?? null,
    [destinationBranches, form.destinationBranchId],
  );
  const derivedDestinationCountry = resolveStoredCountryCode(
    selectedDestinationBranch?.country_code || form.destinationCountry,
  );
  const destinationCityHelpText = selectedDestinationBranch?.city
    ? t("shipmentIntake.destinationCityAutoHelp")
    : t("shipmentIntake.destinationCityManualHelp");

  const autoPricing = useMemo(() => resolveAutoPricing(vendor, form), [vendor, form]);
  const defaultPricingDescription = useMemo(
    () => buildPricingDefaultDescription({ autoPricing, currencyCode, language, t }),
    [autoPricing, currencyCode, language, t],
  );
  const basePriceHelpText = useMemo(
    () => buildBasePriceHelp({ autoPricing, isManualOverride: isBasePriceOverridden, t }),
    [autoPricing, isBasePriceOverridden, t],
  );
  const parsedBasePrice = parseNumberValue(form.basePrice);
  const parsedDiscountAmount = parseNumberValue(form.discountAmount) ?? 0;
  const totalPrice = parsedBasePrice === null ? 0 : Math.max(roundCurrencyValue(parsedBasePrice - parsedDiscountAmount), 0);
  const resolvedCategory = resolveShipmentCategory(form);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      originCountry:
        current.originCountry || resolveStoredCountryCode(vendor?.default_origin_country),
      originCity: current.originCity || vendor?.default_origin_city || "",
    }));
  }, [vendor]);

  useEffect(() => {
    let isActive = true;

    const loadDestinationBranches = async () => {
      if (!vendor?.id) {
        if (isActive) {
          setDestinationBranches([]);
          setDestinationBranchesError("");
          setIsLoadingDestinationBranches(false);
        }
        return;
      }

      setIsLoadingDestinationBranches(true);
      setDestinationBranchesError("");

      try {
        const nextBranches = await listVendorDestinationBranches(vendor.id);

        if (isActive) {
          setDestinationBranches(nextBranches);
        }
      } catch (error) {
        if (isActive) {
          setDestinationBranches([]);
          setDestinationBranchesError(error.message || t("errors.shipmentBranchLoadFailed"));
        }
      } finally {
        if (isActive) {
          setIsLoadingDestinationBranches(false);
        }
      }
    };

    void loadDestinationBranches();

    return () => {
      isActive = false;
    };
  }, [vendor?.id, t]);

  useEffect(() => {
    if (isBasePriceOverridden || !autoPricing.canAutoCalculate) {
      return;
    }

    const nextBasePrice = formatEditableAmount(autoPricing.amount);
    setForm((current) =>
      current.basePrice === nextBasePrice ? current : { ...current, basePrice: nextBasePrice },
    );
  }, [autoPricing, isBasePriceOverridden]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === "quantity") {
      setForm((current) => ({ ...current, quantity: value.replace(/\D+/g, "") }));
      setFieldErrors((current) => ({ ...current, quantity: "" }));
      return;
    }

    if (name === "weightKg" || name === "discountAmount") {
      setForm((current) => ({ ...current, [name]: sanitizeDecimalInput(value) }));
      setFieldErrors((current) => ({ ...current, [name]: "" }));
      return;
    }

    if (name === "basePrice") {
      const sanitizedValue = sanitizeDecimalInput(value);
      setForm((current) => ({ ...current, basePrice: sanitizedValue }));
      setFieldErrors((current) => ({ ...current, basePrice: "" }));
      setIsBasePriceOverridden(sanitizedValue !== "");
      return;
    }

    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
  };

  const handlePhoneChange = (fieldName) => (nextValue) => {
    setForm((current) => ({ ...current, [fieldName]: nextValue }));
    setFieldErrors((current) => ({ ...current, [fieldName]: "" }));

    if (fieldName === "senderPhone") {
      setSenderLookupState(null);
    }
  };

  const handleSelectChange = (fieldName) => (value) => {
    setForm((current) => {
      const nextState = { ...current, [fieldName]: value };

      if (fieldName === "categoryPreset" && value !== OTHER_CATEGORY_VALUE) {
        nextState.categoryOther = "";
      }

      return nextState;
    });

    setFieldErrors((current) => ({
      ...current,
      [fieldName]: "",
      ...(fieldName === "categoryPreset" ? { categoryOther: "" } : {}),
    }));
  };

  const handleDestinationBranchChange = (value) => {
    const selectedBranch = destinationBranches.find((branch) => branch.id === value) ?? null;

    setForm((current) => ({
      ...current,
      destinationBranchId: value,
      destinationCountry: resolveStoredCountryCode(selectedBranch?.country_code),
      destinationCity: String(selectedBranch?.city ?? "").trim(),
    }));

    setFieldErrors((current) => ({
      ...current,
      destinationBranchId: "",
      destinationCountry: "",
      destinationCity: "",
    }));
  };

  const resetForm = () => {
    setForm(buildInitialShipmentForm(vendor, defaultPhoneCountry));
    setFieldErrors({});
    setErrorMessage("");
    setSenderLookupState(null);
    setIsBasePriceOverridden(false);
  };

  const handleSenderLookup = async () => {
    if (!vendor?.id) {
      setSenderLookupState({
        tone: "error",
        title: t("shipmentIntake.lookupErrorTitle"),
        description: t("shipmentIntake.noVendorBody"),
      });
      return;
    }

    if (!form.senderPhone.normalizedValue) {
      setFieldErrors((current) => ({ ...current, senderPhone: t("phone.requiredError") }));
      setSenderLookupState({
        tone: "warning",
        title: t("shipmentIntake.lookupPhoneRequiredTitle"),
        description: t("shipmentIntake.lookupPhoneRequiredBody"),
      });
      return;
    }

    setIsLookingUpSender(true);
    setSenderLookupState(null);

    try {
      const existingCustomer = await findVendorCustomerByPhone({
        vendorId: vendor.id,
        phone: form.senderPhone.normalizedValue,
      });

      if (!existingCustomer) {
        setSenderLookupState({
          tone: "warning",
          title: t("shipmentIntake.lookupNotFoundTitle"),
          description: t("shipmentIntake.lookupNotFoundBody"),
        });
        return;
      }

      setForm((current) => ({
        ...current,
        senderName: existingCustomer.full_name ?? "",
        senderWhatsApp: createPhoneNumberValue(
          existingCustomer.whatsapp_number ?? "",
          current.senderPhone.country,
        ),
        senderEmail: existingCustomer.email ?? "",
      }));
      setSenderLookupState({
        tone: "neutral",
        title: t("shipmentIntake.lookupFoundTitle"),
        description: `${t("shipmentIntake.lookupFoundBody")} ${existingCustomer.full_name ?? ""}`.trim(),
      });
    } catch (error) {
      setSenderLookupState({
        tone: "error",
        title: t("shipmentIntake.lookupErrorTitle"),
        description: error.message || t("errors.shipmentLookupFailed"),
      });
    } finally {
      setIsLookingUpSender(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setFieldErrors({});

    const nextFieldErrors = {};

    if (!form.senderPhone.normalizedValue) {
      nextFieldErrors.senderPhone = t("phone.requiredError");
    }
    if (!form.senderName.trim()) {
      nextFieldErrors.senderName = t("shipmentIntake.senderNameError");
    }
    if (form.senderWhatsApp.rawInput && !form.senderWhatsApp.normalizedValue) {
      nextFieldErrors.senderWhatsApp = t("phone.optionalError");
    }
    if (!form.receiverPhone.normalizedValue) {
      nextFieldErrors.receiverPhone = t("phone.requiredError");
    }
    if (!form.receiverName.trim()) {
      nextFieldErrors.receiverName = t("shipmentIntake.receiverNameError");
    }
    if (form.receiverWhatsApp.rawInput && !form.receiverWhatsApp.normalizedValue) {
      nextFieldErrors.receiverWhatsApp = t("phone.optionalError");
    }
    if (!form.originCountry) {
      nextFieldErrors.originCountry = t("shipmentIntake.originCountryError");
    }
    if (!form.originCity.trim()) {
      nextFieldErrors.originCity = t("shipmentIntake.originCityError");
    }
    if (!form.destinationBranchId) {
      nextFieldErrors.destinationBranchId = t("shipmentIntake.destinationBranchError");
    }
    if (!derivedDestinationCountry) {
      nextFieldErrors.destinationBranchId = t("shipmentIntake.destinationBranchCountryError");
    }
    if (!form.destinationCity.trim()) {
      nextFieldErrors.destinationCity = t("shipmentIntake.destinationCityError");
    }
    if (!form.shippingMode) {
      nextFieldErrors.shippingMode = t("shipmentIntake.shippingModeError");
    }
    if (!form.contentsDescription.trim()) {
      nextFieldErrors.contentsDescription = t("shipmentIntake.contentsDescriptionError");
    }
    if (!form.weightKg || Number(form.weightKg) <= 0) {
      nextFieldErrors.weightKg = t("shipmentIntake.weightError");
    }
    if (!form.quantity || Number.parseInt(form.quantity, 10) <= 0) {
      nextFieldErrors.quantity = t("shipmentIntake.quantityError");
    }
    if (!form.categoryPreset) {
      nextFieldErrors.categoryPreset = t("shipmentIntake.categoryError");
    }
    if (form.categoryPreset === OTHER_CATEGORY_VALUE && !form.categoryOther.trim()) {
      nextFieldErrors.categoryOther = t("shipmentIntake.categoryOtherError");
    }

    const effectiveBasePrice = parseNumberValue(form.basePrice);
    if (effectiveBasePrice === null || effectiveBasePrice < 0) {
      nextFieldErrors.basePrice = t("shipmentIntake.basePriceError");
    }

    const effectiveDiscountAmount = parseNumberValue(form.discountAmount);
    if (effectiveDiscountAmount !== null && effectiveDiscountAmount < 0) {
      nextFieldErrors.discountAmount = t("shipmentIntake.discountAmountError");
    }
    if (
      effectiveBasePrice !== null &&
      effectiveDiscountAmount !== null &&
      effectiveDiscountAmount > effectiveBasePrice
    ) {
      nextFieldErrors.discountAmount = t("shipmentIntake.discountAmountExceedsBaseError");
    }

    if (!form.paymentStatus) {
      nextFieldErrors.paymentStatus = t("shipmentIntake.paymentStatusError");
    }

    if (!resolvedCategory) {
      nextFieldErrors.categoryPreset = t("shipmentIntake.categoryError");
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setIsSubmitting(false);
      return;
    }

    if (!vendor) {
      setErrorMessage(t("shipmentIntake.noVendorBody"));
      setIsSubmitting(false);
      return;
    }

    try {
      const nextShipment = await createVendorShipment({
        vendor,
        form: {
          ...form,
          destinationCountry: derivedDestinationCountry || "",
          basePrice: formatEditableAmount(effectiveBasePrice),
          discountAmount: formatEditableAmount(effectiveDiscountAmount ?? 0),
          currencyCode,
        },
      });
      setCreatedShipment(nextShipment);
      setSenderLookupState(null);
      resetForm();
    } catch (error) {
      setErrorMessage(error.message || t("errors.shipmentSaveFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const createdShipmentCurrency = normalizeCurrencyCode(createdShipment?.currency_code || currencyCode);
  const createdShipmentDestinationBranch = createdShipment?.destination_branch_id
    ? destinationBranches.find((branch) => branch.id === createdShipment.destination_branch_id)
    : null;
  const createdShipmentRoute = createdShipment
    ? `${formatRouteLocation(
        createdShipment.origin_city,
        createdShipment.origin_country,
        countryNameByCode,
      )} -> ${formatRouteLocation(
        createdShipment.destination_city,
        createdShipment.destination_country,
        countryNameByCode,
      )}`
    : "";

  const handleOpenCreatedShipmentLabel = async () => {
    if (!createdShipment) {
      return;
    }

    setIsOpeningCreatedLabel(true);
    setErrorMessage("");

    try {
      await openShipmentLabel({
        vendorName: vendor?.company_name,
        trackingNumber: createdShipment.tracking_number,
        senderName: createdShipment.sender_name,
        receiverName: createdShipment.receiver_name,
        destinationBranchName: createdShipmentDestinationBranch?.branch_name,
        destinationLocation: formatRouteLocation(
          createdShipment.destination_city,
          createdShipment.destination_country,
          countryNameByCode,
        ),
        shippingModeLabel: t(`shipmentIntake.shippingModeOptions.${createdShipment.shipping_mode}`),
        weightLabel: `${createdShipment.weight_kg} kg`,
        contentsSummary: createdShipment.contents_description,
        paymentStatusLabel: t(`shipmentIntake.paymentStatusOptions.${createdShipment.payment_status}`),
        t,
      });
    } catch (error) {
      setErrorMessage(error.message || t("errors.labelGenerationFailed"));
    } finally {
      setIsOpeningCreatedLabel(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <BackToDashboardLink />
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          {t("shipmentIntake.title")}
        </h1>
        <p className="max-w-3xl text-base leading-7 text-slate-600">
          {t("shipmentIntake.description")}
        </p>
      </section>

      {createdShipment ? (
        <Card className="border-emerald-200 bg-emerald-50/80 shadow-lg">
          <CardHeader>
            <CardTitle>{t("shipmentIntake.successTitle")}</CardTitle>
            <CardDescription>{t("shipmentIntake.successBody")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-emerald-950">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">
                  {t("shipmentIntake.summaryTracking")}
                </p>
                <p className="mt-1 text-lg font-semibold">{createdShipment.tracking_number}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">
                  {t("shipmentIntake.summaryRoute")}
                </p>
                <p className="mt-1">{createdShipmentRoute}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">
                  {t("shipmentIntake.summaryDestinationBranch")}
                </p>
                <p className="mt-1">
                  {createdShipmentDestinationBranch?.branch_name || t("shipmentIntake.summaryDestinationBranchFallback")}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">
                  {t("shipmentIntake.summaryParties")}
                </p>
                <p className="mt-1">
                  {createdShipment.sender_name} / {createdShipment.receiver_name}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">
                  {t("shipmentIntake.summaryShipment")}
                </p>
                <p className="mt-1">
                  {t(`shipmentIntake.shippingModeOptions.${createdShipment.shipping_mode}`)} /{" "}
                  {createdShipment.category}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">
                  {t("shipmentIntake.summaryWeightQuantity")}
                </p>
                <p className="mt-1">
                  {createdShipment.weight_kg} kg / {createdShipment.quantity}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">
                  {t("shipmentIntake.summaryPaymentStatus")}
                </p>
                <p className="mt-1">
                  {t(`shipmentIntake.paymentStatusOptions.${createdShipment.payment_status}`)}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-emerald-200 bg-white/70 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">
                {t("shipmentIntake.pricingSummaryTitle")}
              </p>
              <div className="mt-3 grid gap-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span>{t("shipmentIntake.summaryBasePrice")}</span>
                  <span className="font-medium">
                    {formatCurrencyAmount(createdShipment.base_price, createdShipmentCurrency, language)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>{t("shipmentIntake.summaryDiscount")}</span>
                  <span className="font-medium">
                    {formatCurrencyAmount(createdShipment.discount_amount, createdShipmentCurrency, language)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-emerald-200 pt-2 text-base font-semibold">
                  <span>{t("shipmentIntake.summaryTotal")}</span>
                  <span>
                    {formatCurrencyAmount(createdShipment.total_price, createdShipmentCurrency, language)}
                  </span>
                </div>
              </div>
            </div>

            {createdShipment.reference_note ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">
                  {t("shipmentIntake.referenceNote")}
                </p>
                <p className="mt-1">{createdShipment.reference_note}</p>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setCreatedShipment(null);
                  }}
                >
                  {t("shipmentIntake.createAnother")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleOpenCreatedShipmentLabel}
                  disabled={isOpeningCreatedLabel}
                >
                  {isOpeningCreatedLabel
                    ? t("shippingLabel.preparingAction")
                    : t("shipmentIntake.openShippingLabel")}
                </Button>
                <Button asChild variant="outline">
                  <Link to={`/shipments/${createdShipment.id}`}>{t("shipmentIntake.openShipmentDetail")}</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/dashboard">{t("common.backToDashboard")}</Link>
                </Button>
              </div>
          </CardContent>
        </Card>
      ) : null}

      {errorMessage ? (
        <InlineNotice title={t("errors.title")} description={errorMessage} tone="error" />
      ) : null}

      {!vendor ? (
        <InlineNotice
          title={t("shipmentIntake.noVendorTitle")}
          description={t("shipmentIntake.noVendorBody")}
          tone="warning"
        />
      ) : null}

      <form className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <Card className="border-slate-200 bg-white/95 shadow-lg">
            <CardHeader>
              <CardTitle>{t("shipmentIntake.lookupTitle")}</CardTitle>
              <CardDescription>{t("shipmentIntake.lookupDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <PhoneNumberField
                id="shipment-sender-phone-lookup"
                label={
                  <>
                    <span>{t("shipmentIntake.senderPhone")}</span> <span className="text-red-600">*</span>
                  </>
                }
                value={form.senderPhone}
                onChange={handlePhoneChange("senderPhone")}
                required
                autoComplete="tel"
                errorMessage={fieldErrors.senderPhone}
              />
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSenderLookup}
                  disabled={isLookingUpSender || !vendor}
                >
                  {isLookingUpSender ? t("common.loadingShort") : t("shipmentIntake.lookupAction")}
                </Button>
              </div>
              {senderLookupState ? (
                <InlineNotice
                  title={senderLookupState.title}
                  description={senderLookupState.description}
                  tone={senderLookupState.tone}
                />
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white/95 shadow-lg">
            <CardHeader>
              <CardTitle>{t("shipmentIntake.senderSection")}</CardTitle>
              <CardDescription>{t("shipmentIntake.senderSectionHelp")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <RequiredLabel htmlFor="shipment-sender-name">{t("shipmentIntake.senderName")}</RequiredLabel>
                <Input
                  id="shipment-sender-name"
                  name="senderName"
                  value={form.senderName}
                  onChange={handleChange}
                  required
                />
                <p className={`text-xs ${fieldErrors.senderName ? "text-red-600" : "text-slate-500"}`}>
                  {fieldErrors.senderName || t("shipmentIntake.senderNameHelp")}
                </p>
              </div>

              <div className="space-y-2">
                <PhoneNumberField
                  id="shipment-sender-whatsapp"
                  label={t("shipmentIntake.senderWhatsApp")}
                  value={form.senderWhatsApp}
                  onChange={handlePhoneChange("senderWhatsApp")}
                  autoComplete="tel"
                  errorMessage={fieldErrors.senderWhatsApp}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="shipment-sender-email">{t("shipmentIntake.senderEmail")}</Label>
                <Input
                  id="shipment-sender-email"
                  name="senderEmail"
                  type="email"
                  value={form.senderEmail}
                  onChange={handleChange}
                />
                <p className="text-xs text-slate-500">{t("shipmentIntake.senderEmailHelp")}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white/95 shadow-lg">
            <CardHeader>
              <CardTitle>{t("shipmentIntake.receiverSection")}</CardTitle>
              <CardDescription>{t("shipmentIntake.receiverSectionHelp")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <PhoneNumberField
                  id="shipment-receiver-phone"
                  label={
                    <>
                      <span>{t("shipmentIntake.receiverPhone")}</span> <span className="text-red-600">*</span>
                    </>
                  }
                  value={form.receiverPhone}
                  onChange={handlePhoneChange("receiverPhone")}
                  required
                  autoComplete="tel"
                  errorMessage={fieldErrors.receiverPhone}
                />
              </div>

              <div className="space-y-2">
                <RequiredLabel htmlFor="shipment-receiver-name">{t("shipmentIntake.receiverName")}</RequiredLabel>
                <Input
                  id="shipment-receiver-name"
                  name="receiverName"
                  value={form.receiverName}
                  onChange={handleChange}
                  required
                />
                <p className={`text-xs ${fieldErrors.receiverName ? "text-red-600" : "text-slate-500"}`}>
                  {fieldErrors.receiverName || t("shipmentIntake.receiverNameHelp")}
                </p>
              </div>

              <div className="space-y-2">
                <PhoneNumberField
                  id="shipment-receiver-whatsapp"
                  label={t("shipmentIntake.receiverWhatsApp")}
                  value={form.receiverWhatsApp}
                  onChange={handlePhoneChange("receiverWhatsApp")}
                  autoComplete="tel"
                  errorMessage={fieldErrors.receiverWhatsApp}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="shipment-receiver-email">{t("shipmentIntake.receiverEmail")}</Label>
                <Input
                  id="shipment-receiver-email"
                  name="receiverEmail"
                  type="email"
                  value={form.receiverEmail}
                  onChange={handleChange}
                />
                <p className="text-xs text-slate-500">{t("shipmentIntake.receiverEmailHelp")}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-slate-200 bg-white/95 shadow-lg">
            <CardHeader>
              <CardTitle>{t("shipmentIntake.shipmentSection")}</CardTitle>
              <CardDescription>{t("shipmentIntake.shipmentSectionHelp")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {destinationBranchesError ? (
                <InlineNotice
                  title={t("shipmentIntake.destinationBranchLoadErrorTitle")}
                  description={destinationBranchesError}
                  tone="error"
                />
              ) : null}

              {!isLoadingDestinationBranches && vendor && destinationBranches.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-950">
                      {t("shipmentIntake.destinationBranchEmptyTitle")}
                    </p>
                    <p className="text-sm leading-6 text-slate-600">
                      {t("shipmentIntake.destinationBranchEmptyBody")}
                    </p>
                  </div>
                  <div className="mt-4">
                    <Button asChild type="button" variant="outline">
                      <Link to="/settings/branches">{t("shipmentIntake.destinationBranchEmptyCta")}</Link>
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <RequiredLabel htmlFor="shipment-origin-country">{t("shipmentIntake.originCountry")}</RequiredLabel>
                  <Select value={form.originCountry} onValueChange={handleSelectChange("originCountry")}>
                    <SelectTrigger id="shipment-origin-country" aria-invalid={Boolean(fieldErrors.originCountry)}>
                      <SelectValue placeholder={t("shipmentIntake.originCountryPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {countryOptions.map((countryOption) => (
                        <SelectItem key={countryOption.code} value={countryOption.code}>
                          {countryOption.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className={`text-xs ${fieldErrors.originCountry ? "text-red-600" : "text-slate-500"}`}>
                    {fieldErrors.originCountry || t("shipmentIntake.originCountryHelp")}
                  </p>
                </div>

                <div className="space-y-2">
                  <RequiredLabel htmlFor="shipment-origin-city">{t("shipmentIntake.originCity")}</RequiredLabel>
                  <Input
                    id="shipment-origin-city"
                    name="originCity"
                    value={form.originCity}
                    onChange={handleChange}
                    required
                  />
                  <p className={`text-xs ${fieldErrors.originCity ? "text-red-600" : "text-slate-500"}`}>
                    {fieldErrors.originCity || t("shipmentIntake.originCityHelp")}
                  </p>
                </div>

                <div className="space-y-2">
                  <RequiredLabel htmlFor="shipment-destination-branch">{t("shipmentIntake.destinationBranch")}</RequiredLabel>
                  <Select
                    value={form.destinationBranchId}
                    onValueChange={handleDestinationBranchChange}
                  >
                    <SelectTrigger
                      id="shipment-destination-branch"
                      aria-invalid={Boolean(fieldErrors.destinationBranchId)}
                      disabled={!vendor || isLoadingDestinationBranches || destinationBranches.length === 0}
                    >
                      <SelectValue placeholder={t("shipmentIntake.destinationBranchPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {destinationBranches.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {buildBranchOptionLabel(branch, countryNameByCode)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className={`text-xs ${fieldErrors.destinationBranchId ? "text-red-600" : "text-slate-500"}`}>
                    {fieldErrors.destinationBranchId ||
                      (isLoadingDestinationBranches
                        ? t("common.loading")
                        : t("shipmentIntake.destinationBranchHelp"))}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shipment-destination-country-derived">{t("shipmentIntake.destinationCountry")}</Label>
                  <Input
                    id="shipment-destination-country-derived"
                    value={derivedDestinationCountry ? getCountryName(derivedDestinationCountry, countryNameByCode) : ""}
                    readOnly
                    placeholder={t("shipmentIntake.destinationCountryPlaceholder")}
                  />
                  <p className="text-xs text-slate-500">{t("shipmentIntake.destinationCountryDerivedHelp")}</p>
                </div>

                <div className="space-y-2">
                  <RequiredLabel htmlFor="shipment-destination-city">{t("shipmentIntake.destinationCity")}</RequiredLabel>
                  <Input
                    id="shipment-destination-city"
                    name="destinationCity"
                    value={form.destinationCity}
                    onChange={handleChange}
                    required
                  />
                  <p className={`text-xs ${fieldErrors.destinationCity ? "text-red-600" : "text-slate-500"}`}>
                    {fieldErrors.destinationCity || destinationCityHelpText}
                  </p>
                </div>
              </div>

              {selectedDestinationBranch ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        {t("shipmentIntake.destinationBranchSummary")}
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-950">
                        {selectedDestinationBranch.branch_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        {t("shipmentIntake.destinationBranchAddress")}
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        {selectedDestinationBranch.address_text || t("shipmentIntake.destinationBranchAddressMissing")}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <RequiredLabel htmlFor="shipment-mode">{t("shipmentIntake.shippingMode")}</RequiredLabel>
                <Select value={form.shippingMode} onValueChange={handleSelectChange("shippingMode")}>
                  <SelectTrigger id="shipment-mode" aria-invalid={Boolean(fieldErrors.shippingMode)}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SHIPPING_MODES.map((shippingMode) => (
                      <SelectItem key={shippingMode} value={shippingMode}>
                        {t(`shipmentIntake.shippingModeOptions.${shippingMode}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className={`text-xs ${fieldErrors.shippingMode ? "text-red-600" : "text-slate-500"}`}>
                  {fieldErrors.shippingMode || t("shipmentIntake.shippingModeHelp")}
                </p>
              </div>

              <div className="space-y-2">
                <RequiredLabel htmlFor="shipment-contents">{t("shipmentIntake.contentsDescription")}</RequiredLabel>
                <Textarea
                  id="shipment-contents"
                  name="contentsDescription"
                  value={form.contentsDescription}
                  onChange={handleChange}
                  placeholder={t("shipmentIntake.contentsDescriptionPlaceholder")}
                />
                <p className={`text-xs ${fieldErrors.contentsDescription ? "text-red-600" : "text-slate-500"}`}>
                  {fieldErrors.contentsDescription || t("shipmentIntake.contentsDescriptionHelp")}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <RequiredLabel htmlFor="shipment-weight">{t("shipmentIntake.weightKg")}</RequiredLabel>
                  <Input
                    id="shipment-weight"
                    name="weightKg"
                    type="text"
                    inputMode="decimal"
                    value={form.weightKg}
                    onChange={handleChange}
                    placeholder={t("shipmentIntake.weightKgPlaceholder")}
                  />
                  <p className={`text-xs ${fieldErrors.weightKg ? "text-red-600" : "text-slate-500"}`}>
                    {fieldErrors.weightKg || t("shipmentIntake.weightKgHelp")}
                  </p>
                </div>

                <div className="space-y-2">
                  <RequiredLabel htmlFor="shipment-quantity">{t("shipmentIntake.quantity")}</RequiredLabel>
                  <Input
                    id="shipment-quantity"
                    name="quantity"
                    type="text"
                    inputMode="numeric"
                    value={form.quantity}
                    onChange={handleChange}
                  />
                  <p className={`text-xs ${fieldErrors.quantity ? "text-red-600" : "text-slate-500"}`}>
                    {fieldErrors.quantity || t("shipmentIntake.quantityHelp")}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <RequiredLabel htmlFor="shipment-category">{t("shipmentIntake.category")}</RequiredLabel>
                <Select value={form.categoryPreset} onValueChange={handleSelectChange("categoryPreset")}>
                  <SelectTrigger id="shipment-category" aria-invalid={Boolean(fieldErrors.categoryPreset)}>
                    <SelectValue placeholder={t("shipmentIntake.categoryPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {SHIPMENT_CATEGORY_OPTIONS.map((categoryOption) => (
                      <SelectItem key={categoryOption} value={categoryOption}>
                        {t(`shipmentIntake.categoryOptions.${categoryOption}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className={`text-xs ${fieldErrors.categoryPreset ? "text-red-600" : "text-slate-500"}`}>
                  {fieldErrors.categoryPreset || t("shipmentIntake.categoryHelp")}
                </p>
              </div>

              {form.categoryPreset === OTHER_CATEGORY_VALUE ? (
                <div className="space-y-2">
                  <RequiredLabel htmlFor="shipment-category-other">{t("shipmentIntake.categoryOther")}</RequiredLabel>
                  <Input
                    id="shipment-category-other"
                    name="categoryOther"
                    value={form.categoryOther}
                    onChange={handleChange}
                    placeholder={t("shipmentIntake.categoryOtherPlaceholder")}
                  />
                  <p className={`text-xs ${fieldErrors.categoryOther ? "text-red-600" : "text-slate-500"}`}>
                    {fieldErrors.categoryOther || t("shipmentIntake.categoryOtherHelp")}
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white/95 shadow-lg">
            <CardHeader>
              <CardTitle>{t("shipmentIntake.pricingSection")}</CardTitle>
              <CardDescription>{t("shipmentIntake.pricingSectionHelp")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <RequiredLabel htmlFor="shipment-base-price">
                    {t("shipmentIntake.basePrice")} ({currencyCode})
                  </RequiredLabel>
                  <Input
                    id="shipment-base-price"
                    name="basePrice"
                    type="text"
                    inputMode="decimal"
                    value={form.basePrice}
                    onChange={handleChange}
                    placeholder={t("shipmentIntake.basePricePlaceholder")}
                  />
                  {fieldErrors.basePrice ? (
                    <p className="text-xs text-red-600">{fieldErrors.basePrice}</p>
                  ) : (
                    <div className="space-y-1 text-xs text-slate-500">
                      <p>{defaultPricingDescription}</p>
                      <p>{basePriceHelpText}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shipment-discount-amount">
                    {t("shipmentIntake.discountAmount")} ({currencyCode})
                  </Label>
                  <Input
                    id="shipment-discount-amount"
                    name="discountAmount"
                    type="text"
                    inputMode="decimal"
                    value={form.discountAmount}
                    onChange={handleChange}
                    placeholder={t("shipmentIntake.discountAmountPlaceholder")}
                  />
                  <p className={`text-xs ${fieldErrors.discountAmount ? "text-red-600" : "text-slate-500"}`}>
                    {fieldErrors.discountAmount || t("shipmentIntake.discountAmountHelp")}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <RequiredLabel htmlFor="shipment-payment-status">{t("shipmentIntake.paymentStatus")}</RequiredLabel>
                <Select value={form.paymentStatus} onValueChange={handleSelectChange("paymentStatus")}>
                  <SelectTrigger id="shipment-payment-status" aria-invalid={Boolean(fieldErrors.paymentStatus)}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STATUSES.map((paymentStatus) => (
                      <SelectItem key={paymentStatus} value={paymentStatus}>
                        {t(`shipmentIntake.paymentStatusOptions.${paymentStatus}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className={`text-xs ${fieldErrors.paymentStatus ? "text-red-600" : "text-slate-500"}`}>
                  {fieldErrors.paymentStatus || t("shipmentIntake.paymentStatusHelp")}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-950">{t("shipmentIntake.pricingSummaryTitle")}</p>
                  <p className="text-xs text-slate-500">{t("shipmentIntake.pricingSummaryHelp")}</p>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-slate-700">
                  <div className="flex items-center justify-between gap-3">
                    <span>{t("shipmentIntake.summaryBasePrice")}</span>
                    <span className="font-medium">
                      {formatCurrencyAmount(parsedBasePrice ?? 0, currencyCode, language)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>{t("shipmentIntake.summaryDiscount")}</span>
                    <span className="font-medium">
                      {formatCurrencyAmount(parsedDiscountAmount, currencyCode, language)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-2 text-base font-semibold text-slate-950">
                    <span>{t("shipmentIntake.summaryTotal")}</span>
                    <span>{formatCurrencyAmount(totalPrice, currencyCode, language)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shipment-reference-note">{t("shipmentIntake.referenceNote")}</Label>
                <Textarea
                  id="shipment-reference-note"
                  name="referenceNote"
                  value={form.referenceNote}
                  onChange={handleChange}
                  placeholder={t("shipmentIntake.referenceNotePlaceholder")}
                />
                <p className="text-xs text-slate-500">{t("shipmentIntake.referenceNoteHelp")}</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={isSubmitting || !vendor}>
                  {isSubmitting ? t("common.saving") : t("shipmentIntake.submit")}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  {t("shipmentIntake.reset")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
