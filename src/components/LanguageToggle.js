"use client";

import { useLanguage } from "./LanguageProvider";
import { useEffect, useState } from "react";

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div style={{ width: '70px', height: '36px' }} />;
  }

  return (
    <button
      onClick={() => setLanguage(language === 'sk' ? 'en' : 'sk')}
      style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        zIndex: 1000,
        background: 'var(--bg-glass)',
        border: '1px solid var(--border-glass)',
        color: 'var(--text-primary)',
        padding: '0.4rem 0.8rem',
        borderRadius: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: '0.85rem',
        fontWeight: 'bold',
        boxShadow: 'var(--shadow-glass)',
        transition: 'all 0.2s',
      }}
      aria-label={language === 'sk' ? 'Switch to English' : 'Prepnúť do slovenčiny'}
    >
      <span style={{ opacity: language === 'sk' ? 1 : 0.4 }}>SK</span>
      <span style={{ margin: '0 4px', opacity: 0.3 }}>/</span>
      <span style={{ opacity: language === 'en' ? 1 : 0.4 }}>EN</span>
    </button>
  );
}
