import React, { createContext, useContext, useMemo, useState, useCallback } from "react";
import { Language, translate, TKey, ttsLocale, LANGUAGES } from "../i18n";

interface LanguageContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: TKey, vars?: Record<string, string | number>) => string;
  ttsLocale: string;
}

const STORAGE_KEY = "safepit_language";
const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: (k) => String(k),
  ttsLocale: "en-IN",
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "en" || stored === "hi" || stored === "sat") return stored;
    } catch { /* ignore */ }
    return "en";
  });

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch { /* ignore */ }
  }, []);

  const value = useMemo<LanguageContextType>(() => ({
    lang,
    setLang,
    t: (key, vars) => translate(lang, key, vars),
    ttsLocale: ttsLocale(lang),
  }), [lang, setLang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);
export { LANGUAGES };
export type { Language, TKey };
