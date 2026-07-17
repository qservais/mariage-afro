import { dict, pick, type Locale } from "./i18n";

export function escapeHtml(str: string | null | undefined): string {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Renders a stored "YYYY-MM-DD" (or full ISO) date as European DD/MM/YYYY for emails. */
export function formatEmailDate(iso: string | null | undefined): string | null | undefined {
  if (!iso) return iso;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const [, year, month, day] = m;
  return `${day}/${month}/${year}`;
}

export function row(label: string, value: string | number | null | undefined): string {
  if (value == null || value === "") return "";
  return `<tr><td style="padding:8px 16px;border-bottom:1px solid #eee;font-weight:600;color:#68191e;width:200px;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:8px 16px;border-bottom:1px solid #eee;color:#1f1416;">${escapeHtml(String(value))}</td></tr>`;
}

interface WrapOpts {
  title: string;
  intro?: string;
  rows?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  bodyHtml?: string;
  locale: Locale;
}

export function wrap(opts: WrapOpts): string {
  const { title, intro, rows, ctaLabel, ctaUrl, bodyHtml, locale } = opts;
  const tagline = pick(dict.brandTagline, locale);
  const footer = pick(dict.footer, locale);
  const cta = ctaLabel && ctaUrl
    ? `<div style="margin:24px 0 8px;text-align:left;">
        <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:#68191e;color:#fff4e4;padding:14px 28px;text-decoration:none;font-size:13px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;border:1px solid #c9a96e;">${escapeHtml(ctaLabel)}</a>
      </div>`
    : "";
  return `<!doctype html><html><body style="font-family:Helvetica,Arial,sans-serif;background:#fff4e4;padding:24px;margin:0;">
<div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e8d9bf;">
  <div style="background:#1f1416;color:#fff4e4;padding:28px 32px;border-bottom:3px solid #c9a96e;">
    <div style="font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#c9a96e;">Mariage Afro</div>
    <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#fff4e4;">${escapeHtml(title)}</h1>
  </div>
  <div style="padding:24px 32px;color:#1f1416;line-height:1.6;">
    ${intro ? `<p style="margin:0 0 16px;">${escapeHtml(intro)}</p>` : ""}
    ${bodyHtml ?? ""}
    ${rows ? `<table style="width:100%;border-collapse:collapse;border-top:1px solid #eee;margin-top:16px;">${rows}</table>` : ""}
    ${cta}
  </div>
  <div style="padding:16px 32px;background:#fff4e4;color:#666;font-size:12px;text-align:center;border-top:1px solid #e8d9bf;">
    ${escapeHtml(footer)}<br><span style="font-size:11px;color:#999;">${escapeHtml(pick(dict.brandTagline, locale))}</span><br><span style="font-size:11px;color:#999;">${escapeHtml(pick(dict.footerBy, locale))}</span>
  </div>
</div></body></html>`;
}

export function plainText(opts: { title: string; intro?: string; lines?: string[]; ctaLabel?: string; ctaUrl?: string }): string {
  const out: string[] = [opts.title, ""];
  if (opts.intro) out.push(opts.intro, "");
  if (opts.lines) out.push(...opts.lines, "");
  if (opts.ctaLabel && opts.ctaUrl) out.push(`${opts.ctaLabel}: ${opts.ctaUrl}`);
  out.push("", "— Mariage Afro");
  return out.join("\n");
}
