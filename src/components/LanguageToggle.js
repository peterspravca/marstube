"use client";

import { useLanguage } from "./LanguageProvider";
import { useEffect, useState } from "react";

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div style={{ width: '40px', height: '40px', marginRight: '1rem' }} />;
  }

  return (
    <button
      onClick={() => setLanguage(language === 'sk' ? 'en' : 'sk')}
      style={{
        background: 'var(--bg-glass)',
        border: '1px solid var(--border-glass)',
        color: 'var(--text-primary)',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: '0.9rem',
        fontWeight: 'bold',
        boxShadow: 'var(--shadow-glass)',
        transition: 'all 0.2s',
        marginRight: '1rem',
      }}
      aria-label={language === 'sk' ? 'Switch to English' : 'Prepnúť do slovenčiny'}
    >
      {language.toUpperCase()}
    </button>
  );
}
