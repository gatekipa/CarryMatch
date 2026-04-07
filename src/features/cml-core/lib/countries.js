import { getCountries } from "libphonenumber-js/min";

export const AVAILABLE_COUNTRIES = getCountries();

const normalizeCountryMatch = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export const getDisplayNames = (language) => {
  if (typeof Intl === "undefined" || typeof Intl.DisplayNames !== "function") {
    return null;
  }

  return new Intl.DisplayNames([language], { type: "region" });
};

export const resolveStoredCountryCode = (value) => {
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
    const candidates = [countryCode, englishNames?.of(countryCode), frenchNames?.of(countryCode)].filter(Boolean);

    if (candidates.some((candidate) => normalizeCountryMatch(candidate) === searchValue)) {
      return countryCode;
    }
  }

  return "";
};

export const buildCountryOptions = (language) => {
  const displayNames = getDisplayNames(language);

  return AVAILABLE_COUNTRIES.map((countryCode) => ({
    code: countryCode,
    name: displayNames?.of(countryCode) ?? countryCode,
  })).sort((left, right) => left.name.localeCompare(right.name, language));
};
