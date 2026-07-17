/**
 * Render-time translation of admin-entered free text (Task 2).
 *
 * Decision (confirmed, do not change): translate at render time only —
 * nothing persisted to the DB. This module keeps only an ephemeral
 * in-memory TTL cache to protect page-load latency; it must never become a
 * second source of truth requiring manual sync.
 *
 * Reuses the same AI integration this project already has provisioned
 * (lib/translate.ts's vendor-description translator uses the identical
 * env vars) rather than introducing a new DeepL dependency whose API key
 * was not confirmed to exist in this environment.
 */
import { logger } from "./logger";

const OPENAI_BASE = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
const OPENAI_KEY = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;

const CACHE_TTL_MS = 30 * 60 * 1000; // 30min — purely a perf cache, safe to lose
const cache = new Map<string, { value: string; expiresAt: number }>();

const LOCALE_NAMES: Record<string, string> = {
  fr: "French",
  nl: "Belgian Dutch",
  en: "English",
};

function cacheKey(text: string, targetLocale: string): string {
  return `${targetLocale}::${text}`;
}

/**
 * Translates `text` to `targetLocale` if needed, auto-detecting the source
 * language (no assumption that French is always the source). Falls back to
 * the original text on any failure — a slow/missing translation must never
 * break the page.
 */
export async function translateContent(
  text: string | null | undefined,
  targetLocale: string,
  log = logger,
): Promise<string> {
  const trimmed = (text ?? "").trim();
  if (!trimmed) return "";
  const locale = LOCALE_NAMES[targetLocale] ? targetLocale : "fr";
  const targetName = LOCALE_NAMES[locale];

  const key = cacheKey(trimmed, locale);
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value;

  if (!OPENAI_BASE || !OPENAI_KEY) return trimmed;

  try {
    const resp = await fetch(`${OPENAI_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5-nano",
        messages: [
          {
            role: "system",
            content:
              `You translate wedding-marketplace content for a website. Detect the ` +
              `source language automatically and translate it to ${targetName}. ` +
              `If the text is already in ${targetName}, return it unchanged. Preserve ` +
              `tone, proper nouns, and formatting. Return ONLY the translated text, ` +
              `no quotes, no explanation.`,
          },
          { role: "user", content: trimmed },
        ],
        max_tokens: 2000,
      }),
    });
    if (!resp.ok) {
      log.warn({ status: resp.status }, "On-the-fly translation: API returned non-200");
      return trimmed;
    }
    const body = (await resp.json()) as { choices?: { message?: { content?: string } }[] };
    const translated = body.choices?.[0]?.message?.content?.trim();
    if (!translated) return trimmed;
    cache.set(key, { value: translated, expiresAt: Date.now() + CACHE_TTL_MS });
    return translated;
  } catch (err) {
    log.error({ err }, "On-the-fly translation failed");
    return trimmed;
  }
}
