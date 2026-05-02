import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import frTranslations from './locales/fr.json';
import enTranslations from './locales/en.json';
import nlTranslations from './locales/nl.json';

const STORAGE_KEY = 'mariage-afro-lang';
const COOKIE_NAME = 'ma-lang';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year
export const SUPPORTED_LANGS = ['fr', 'nl', 'en'] as const;
export type SupportedLang = typeof SUPPORTED_LANGS[number];

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string): void {
  if (typeof document === 'undefined') return;
  try {
    document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

function normalize(raw: string | null | undefined): SupportedLang | null {
  if (!raw) return null;
  const code = raw.toLowerCase().split(/[-_]/)[0];
  return (SUPPORTED_LANGS as readonly string[]).includes(code) ? (code as SupportedLang) : null;
}

function detectFromBrowser(): SupportedLang | null {
  if (typeof navigator === 'undefined') return null;
  const langs: string[] = [];
  if (Array.isArray(navigator.languages)) langs.push(...navigator.languages);
  if (navigator.language) langs.push(navigator.language);
  for (const l of langs) {
    const n = normalize(l);
    if (n) return n;
  }
  return null;
}

function getInitialLang(): SupportedLang {
  if (typeof window === 'undefined') return 'fr';
  // 1. Explicit ?lang= URL param wins (and persists)
  try {
    const url = new URL(window.location.href);
    const fromUrl = normalize(url.searchParams.get('lang'));
    if (fromUrl) {
      try { window.localStorage.setItem(STORAGE_KEY, fromUrl); } catch { /* ignore */ }
      writeCookie(COOKIE_NAME, fromUrl);
      return fromUrl;
    }
  } catch {
    /* ignore */
  }
  // 2. Stored preference (localStorage > cookie)
  try {
    const stored = normalize(window.localStorage.getItem(STORAGE_KEY));
    if (stored) return stored;
  } catch {
    /* ignore */
  }
  const cookie = normalize(readCookie(COOKIE_NAME));
  if (cookie) return cookie;
  // 3. Browser Accept-Language
  const browser = detectFromBrowser();
  if (browser) return browser;
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
    } catch {
      /* ignore */
    }
    writeCookie(COOKIE_NAME, lng);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lng;
    }
  }
});

if (typeof document !== 'undefined') {
  document.documentElement.lang = i18n.language;
}

export default i18n;
