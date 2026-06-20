"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Zabezpečí, že komponent sa nenačíta na serveri pre mismatch témy
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div style={{ width: '40px', height: '40px' }} />;
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
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
        fontSize: '1.2rem',
        boxShadow: 'var(--shadow-glass)',
        transition: 'all 0.2s',
      }}
      aria-label="Prepnúť tému"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
