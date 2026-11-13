import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSettings } from '../services/settingsService';
import { translations } from '../utils/translations';
import type { SupportedLanguages } from '../utils/translations';

interface LanguageContextType {
  language: SupportedLanguages;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<SupportedLanguages>(() => {
    return (getSettings("language", "English") as SupportedLanguages) || "English";
  });

  useEffect(() => {
    const handleSettingsUpdate = () => {
      const newLang = getSettings("language", "English") as SupportedLanguages;
      setLanguage(newLang || "English");
    };

    window.addEventListener("clinergy-settings-update", handleSettingsUpdate);
    window.addEventListener("storage", handleSettingsUpdate);
    
    return () => {
      window.removeEventListener("clinergy-settings-update", handleSettingsUpdate);
      window.removeEventListener("storage", handleSettingsUpdate);
    };
  }, []);

  const t = useCallback((key: string): string => {
    const dict = translations[language] || translations["English"];
    // Fallback to English if translation is missing
    return dict[key] || translations["English"][key] || key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
