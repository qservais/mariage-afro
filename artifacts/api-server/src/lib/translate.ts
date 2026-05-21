import { logger } from "./logger";

const OPENAI_BASE = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
const OPENAI_KEY = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;

export interface DescriptionTranslations { fr: string; nl: string; en: string }

export async function translateDescription(
  description: string,
  log = logger,
): Promise<DescriptionTranslations | null> {
  if (!description.trim() || !OPENAI_BASE || !OPENAI_KEY) return null;
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
              "You are a professional translator for wedding vendor profiles. Translate the given text to French (fr), Belgian Dutch (nl), and English (en). Return ONLY a valid JSON object with exactly three keys: fr, nl, en. Preserve the marketing tone and proper nouns. No additional text or explanation.",
          },
          { role: "user", content: description },
        ],
        response_format: { type: "json_object" },
        max_tokens: 2000,
      }),
    });
    if (!resp.ok) {
      log.warn({ status: resp.status }, "Translation API returned non-200");
      return null;
    }
    const body = await resp.json() as { choices?: { message?: { content?: string } }[] };
    const content = body.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content) as Record<string, unknown>;
    if (typeof parsed.fr === "string" && typeof parsed.nl === "string" && typeof parsed.en === "string") {
      return { fr: parsed.fr, nl: parsed.nl, en: parsed.en };
    }
    log.warn({ parsed }, "Unexpected translation response shape");
    return null;
  } catch (err) {
    log.error({ err }, "Failed to translate vendor description");
    return null;
  }
}
