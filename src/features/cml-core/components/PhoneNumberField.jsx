import React, { useMemo } from "react";
import { AsYouType, getCountries, getCountryCallingCode, parsePhoneNumberFromString } from "libphonenumber-js/min";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";

const AVAILABLE_COUNTRIES = getCountries();
const FALLBACK_COUNTRY = "CM";

const getDisplayNames = (language) => {
  if (typeof Intl === "undefined" || typeof Intl.DisplayNames !== "function") {
    return null;
  }

  return new Intl.DisplayNames([language], { type: "region" });
};

const getSupportedCountry = (country) =>
  country && AVAILABLE_COUNTRIES.includes(country) ? country : FALLBACK_COUNTRY;

const extractLocaleRegion = (locale) => {
  if (!locale) {
    return null;
  }

  return locale
    .replace("_", "-")
    .split("-")
    .find((part) => /^[A-Za-z]{2}$/.test(part))?.toUpperCase();
};

export const resolveDefaultPhoneCountry = () => {
  if (typeof window !== "undefined") {
    const localeCandidates = [
      ...(window.navigator.languages ?? []),
      window.navigator.language,
    ].filter(Boolean);

    for (const locale of localeCandidates) {
      const region = extractLocaleRegion(locale);
      if (region && AVAILABLE_COUNTRIES.includes(region)) {
        return region;
      }
    }
  }

  return FALLBACK_COUNTRY;
};

const buildPhoneValue = ({ country, rawInput = "" }) => {
  let nextCountry = getSupportedCountry(country);
  let nextRawInput = String(rawInput ?? "");

  if (nextRawInput.trim().startsWith("+")) {
    const parsedInternational = parsePhoneNumberFromString(nextRawInput);
    if (parsedInternational?.country) {
      nextCountry = getSupportedCountry(parsedInternational.country);
      nextRawInput = parsedInternational.nationalNumber ?? nextRawInput;
    }
  }

  const formatter = new AsYouType(nextCountry);
  const displayValue = formatter.input(nextRawInput);
  const parsedNumber =
    formatter.getNumber() ?? parsePhoneNumberFromString(displayValue || nextRawInput, nextCountry);

  const normalizedValue = parsedNumber?.isPossible() ? parsedNumber.number : "";

  return {
    country: nextCountry,
    rawInput: nextRawInput,
    displayValue,
    normalizedValue,
    isValid: parsedNumber?.isValid() ?? false,
    isPossible: parsedNumber?.isPossible() ?? false,
    callingCode: `+${getCountryCallingCode(nextCountry)}`,
  };
};

export const createPhoneNumberValue = (initialValue = "", initialCountry = resolveDefaultPhoneCountry()) => {
  if (initialValue) {
    const parsedStoredValue = parsePhoneNumberFromString(initialValue);
    if (parsedStoredValue) {
      return buildPhoneValue({
        country: parsedStoredValue.country ?? initialCountry,
        rawInput: parsedStoredValue.nationalNumber ?? initialValue,
      });
    }
  }

  return buildPhoneValue({ country: initialCountry, rawInput: "" });
};

export function PhoneNumberField({
  id,
  label,
  value,
  onChange,
  disabled = false,
  required = false,
  autoComplete = "tel-national",
  errorMessage = "",
}) {
  const { t, language } = useI18n();

  const countryOptions = useMemo(() => {
    const displayNames = getDisplayNames(language);

    return AVAILABLE_COUNTRIES.map((countryCode) => ({
      code: countryCode,
      name: displayNames?.of(countryCode) ?? countryCode,
      callingCode: `+${getCountryCallingCode(countryCode)}`,
    })).sort((left, right) => left.name.localeCompare(right.name, language));
  }, [language]);

  const phoneValue = value ?? createPhoneNumberValue();

  const handleCountryChange = (country) => {
    onChange?.(buildPhoneValue({ country, rawInput: phoneValue.rawInput }));
  };

  const handleInputChange = (event) => {
    onChange?.(buildPhoneValue({ country: phoneValue.country, rawInput: event.target.value }));
  };

  const helperMessage = errorMessage
    ? errorMessage
    : phoneValue.normalizedValue
      ? `${t("phone.savedAs")} ${phoneValue.normalizedValue}`
      : `${t("phone.callingCode")} ${phoneValue.callingCode}`;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,0.48fr)_minmax(0,0.52fr)]">
        <div className="space-y-2">
          <Select value={phoneValue.country} onValueChange={handleCountryChange} disabled={disabled}>
            <SelectTrigger id={`${id}-country`}>
              <SelectValue placeholder={t("phone.countryPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {countryOptions.map((countryOption) => (
                <SelectItem key={countryOption.code} value={countryOption.code}>
                  {countryOption.name} ({countryOption.callingCode})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Input
            id={id}
            type="tel"
            inputMode="tel"
            autoComplete={autoComplete}
            placeholder={t("phone.numberPlaceholder")}
            value={phoneValue.displayValue}
            onChange={handleInputChange}
            disabled={disabled}
            required={required}
            aria-invalid={Boolean(errorMessage)}
          />
        </div>
      </div>
      <p className={`text-xs ${errorMessage ? "text-red-600" : "text-slate-500"}`}>{helperMessage}</p>
    </div>
  );
}
