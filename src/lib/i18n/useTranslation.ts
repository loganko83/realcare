/**
 * React hook for translations
 */

import { useState, useEffect, useCallback } from 'react';
import { Language, TranslationKey, translations } from './index';
import { getLanguage, setLanguage as setStoredLanguage } from '../../stores/languageStore';

export function useTranslation() {
  const [lang, setLang] = useState<Language>(() => getLanguage());

  useEffect(() => {
    const handleLanguageChange = (e: CustomEvent<Language>) => {
      setLang(e.detail);
    };

    window.addEventListener('languageChange', handleLanguageChange as EventListener);
    return () => {
      window.removeEventListener('languageChange', handleLanguageChange as EventListener);
    };
  }, []);

  const t = useCallback((key: TranslationKey): string => {
    return translations[lang][key] || key;
  }, [lang]);

  const changeLanguage = useCallback((newLang: Language) => {
    setStoredLanguage(newLang);
    setLang(newLang);
  }, []);

  return { t, lang, changeLanguage };
}
