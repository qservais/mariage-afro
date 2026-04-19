import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import frTranslations from './locales/fr.json';
import enTranslations from './locales/en.json';
import nlTranslations from './locales/nl.json';

const STORAGE_KEY = 'mariage-afro-lang';
const SUPPORTED = ['fr', 'nl', 'en'];

function getInitialLang(): string {
  if (typeof window === 'undefined') return 'fr';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED.includes(stored)) return stored;
  } catch {
    /* localStorage may be unavailable */
  }
  return 'fr';
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: frTranslations },
      en: { translation: enTranslations },
      nl: { translation: nlTranslations }
    },
    lng: getInitialLang(),
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false
    }
  });

i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, lng);
      document.documentElement.lang = lng;
    } catch {
      /* ignore */
    }
  }
});

if (typeof document !== 'undefined') {
  document.documentElement.lang = i18n.language;
}

export default i18n;
