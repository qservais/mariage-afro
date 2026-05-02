import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
// Namespace-split locale files (LOT 7). Single monolithic JSON deprecated.
import frCommon from './locales/fr/common.json';
import frPublic from './locales/fr/public.json';
import frClient from './locales/fr/client.json';
import frVendor from './locales/fr/vendor.json';
import frForms from './locales/fr/forms.json';
import frEmails from './locales/fr/emails.json';
import nlCommon from './locales/nl/common.json';
import nlPublic from './locales/nl/public.json';
import nlClient from './locales/nl/client.json';
import nlVendor from './locales/nl/vendor.json';
import nlForms from './locales/nl/forms.json';
import nlEmails from './locales/nl/emails.json';
import enCommon from './locales/en/common.json';
import enPublic from './locales/en/public.json';
import enClient from './locales/en/client.json';
import enVendor from './locales/en/vendor.json';
import enForms from './locales/en/forms.json';
import enEmails from './locales/en/emails.json';

export const NAMESPACES = ['common', 'public', 'client', 'vendor', 'forms', 'emails'] as const;

const STORAGE_KEY = 'mariage-afro-lang';
const COOKIE_NAME = 'lang';
const LEGACY_COOKIE_NAMES = ['ma-lang'];
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
  // 1. Explicit /nl, /en, /fr URL prefix or ?lang= URL param wins (and persists)
  try {
    const url = new URL(window.location.href);
    const fromQuery = normalize(url.searchParams.get('lang'));
    const pathFirst = url.pathname.split('/').filter(Boolean)[0];
    const fromPath = pathFirst && pathFirst.length === 2 ? normalize(pathFirst) : null;
    const fromUrl = fromQuery || fromPath;
    if (fromUrl) {
      try { window.localStorage.setItem(STORAGE_KEY, fromUrl); } catch { /* ignore */ }
      writeCookie(COOKIE_NAME, fromUrl);
      return fromUrl;
    }
  } catch {
    /* ignore */
  }
  // 2. Stored preference (localStorage > cookie > legacy cookies)
  try {
    const stored = normalize(window.localStorage.getItem(STORAGE_KEY));
    if (stored) return stored;
  } catch {
    /* ignore */
  }
  const cookie = normalize(readCookie(COOKIE_NAME));
  if (cookie) return cookie;
  for (const legacy of LEGACY_COOKIE_NAMES) {
    const v = normalize(readCookie(legacy));
    if (v) {
      writeCookie(COOKIE_NAME, v);
      return v;
    }
  }
  // 3. Browser Accept-Language
  const browser = detectFromBrowser();
  if (browser) return browser;
  return 'fr';
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      fr: {
        common: frCommon, public: frPublic, client: frClient,
        vendor: frVendor, forms: frForms, emails: frEmails,
      },
      nl: {
        common: nlCommon, public: nlPublic, client: nlClient,
        vendor: nlVendor, forms: nlForms, emails: nlEmails,
      },
      en: {
        common: enCommon, public: enPublic, client: enClient,
        vendor: enVendor, forms: enForms, emails: enEmails,
      },
    },
    ns: NAMESPACES as unknown as string[],
    defaultNS: 'common',
    fallbackNS: ['public', 'client', 'vendor', 'forms', 'emails'],
    lng: getInitialLang(),
    fallbackLng: 'fr',
    interpolation: { escapeValue: false },
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
