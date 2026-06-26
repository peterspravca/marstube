"use client";

import { createContext, useContext, useState, useEffect } from "react";

const translations = {
  sk: {
    "home.subtitle1": "Bez reklám, bez prerušení.",
    "home.subtitle2": "Váš osobný, prémiový zážitok.",
    "home.history": "História sledovania",
    "home.trending": "Trendy",
    "home.noTrending": "Momentálne nie sú dostupné žiadne trendy.",
    // pridáme ďalšie podľa potreby pre ďalšie komponenty neskôr, zatiaľ domovská stránka
  },
  en: {
    "home.subtitle1": "Ad-free, without interruptions.",
    "home.subtitle2": "Your personal, premium experience.",
    "home.history": "Watch History",
    "home.trending": "Trending",
    "home.noTrending": "No trending videos available at the moment.",
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState("sk");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem("language");
    if (savedLang && translations[savedLang]) {
      setLanguage(savedLang);
    } else {
      const browserLang = navigator.language || navigator.userLanguage;
      if (browserLang && browserLang.toLowerCase().startsWith("en")) {
        setLanguage("en");
      }
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("language", language);
      document.documentElement.lang = language;
    }
  }, [language, mounted]);

  const t = (key) => {
    return translations[language]?.[key] || key;
  };

  // Na serveri vyrenderujeme default (slovenčinu), aby sa zamedzilo hydration mismatch, 
  // aj keď sa potom na klientovi prepne do EN.
  const contextValue = mounted 
    ? { language, setLanguage, t }
    : { language: "sk", setLanguage: () => {}, t: (key) => translations["sk"]?.[key] || key };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
