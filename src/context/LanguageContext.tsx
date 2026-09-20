import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '../types';
import { TRANSLATIONS, Translations, getTranslation } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof Translations) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('resqai_language');
      if (saved === 'bn' || saved === 'hi' || saved === 'en') {
        return saved;
      }
      // Check browser language
      if (typeof navigator !== 'undefined' && navigator.language) {
        if (navigator.language.startsWith('bn')) return 'bn';
        if (navigator.language.startsWith('hi')) return 'hi';
      }
    } catch {
      // ignore
    }
    return 'en';
  });

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem('resqai_language', newLang);
    } catch {
      // ignore
    }
  };

  const t = (key: keyof Translations): string => {
    return getTranslation(key, language);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      language: 'en',
      setLanguage: () => {},
      t: (key: keyof Translations) => TRANSLATIONS.en[key] || String(key),
    };
  }
  return context;
};
