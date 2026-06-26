"use client";

import { useLanguage } from "./LanguageProvider";
import { useEffect, useState } from "react";

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="lang-toggle-placeholder" />;
  }

  return (
    <button
      onClick={() => setLanguage(language === 'sk' ? 'en' : 'sk')}
      className="lang-toggle-btn"
      aria-label={language === 'sk' ? 'Switch to English' : 'Prepnúť do slovenčiny'}
    >
      <span style={{ opacity: language === 'sk' ? 1 : 0.4 }}>SK</span>
      <span style={{ margin: '0 4px', opacity: 0.3 }}>/</span>
      <span style={{ opacity: language === 'en' ? 1 : 0.4 }}>EN</span>
    </button>
  );
}
