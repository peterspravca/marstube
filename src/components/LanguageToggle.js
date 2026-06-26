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
      className="lang-toggle-btn notranslate"
      aria-label={language === 'sk' ? 'Switch to English' : 'Prepnúť do slovenčiny'}
      translate="no"
    >
      <span style={{ opacity: language === 'sk' ? 1 : 0.4 }} translate="no">SK</span>
      <span style={{ margin: '0 4px', opacity: 0.3 }} translate="no">/</span>
      <span style={{ opacity: language === 'en' ? 1 : 0.4 }} translate="no">EN</span>
    </button>
  );
}
