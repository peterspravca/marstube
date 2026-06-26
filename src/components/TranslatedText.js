"use client";

import { useLanguage } from "./LanguageProvider";

export default function TranslatedText({ id }) {
  const { t } = useLanguage();
  return <>{t(id)}</>;
}
