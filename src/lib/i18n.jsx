import React from "react";
import i18n from "i18next";
import { I18nextProvider, useTranslation, initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "@/locales/en.json";
import fr from "@/locales/fr.json";

const STORAGE_KEY = "carrymatch-cml-language";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
    },
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: STORAGE_KEY,
      caches: ["localStorage"],
    },
  });

export function I18nProvider({ children }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

export function useI18n() {
  const { t, i18n: i18nInstance } = useTranslation();

  return {
    language: i18nInstance.language?.substring(0, 2) || "en",
    setLanguage: (lang) => {
      i18nInstance.changeLanguage(lang);
      window.localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    },
    t,
    supportedLanguages: ["en", "fr"],
  };
}

export default i18n;
