/**
 * Language Store using localStorage
 */

import { Language } from '../lib/i18n';

const STORAGE_KEY = 'realcare_language';

export function getLanguage(): Language {
  if (typeof window === 'undefined') return 'ko';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'en' || stored === 'ko') {
    return stored;
  }
  return 'ko'; // Default to Korean
}

export function setLanguage(lang: Language): void {
  localStorage.setItem(STORAGE_KEY, lang);
  // Dispatch event for components to react
  window.dispatchEvent(new CustomEvent('languageChange', { detail: lang }));
}
