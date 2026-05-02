import { Resend } from "resend";
import { logger } from "./logger";
import { dict, normalizeLocale, pick, type Locale } from "./email/i18n";
import { escapeHtml as esc, plainText, row, wrap } from "./email/templates";

export { escapeHtml } from "./email/templates";
export type { Locale } from "./email/i18n";

const FROM = process.env.EMAIL_FROM || "Mariage Afro <noreply@mariage-afro.com>";
const ADMIN_TO = process.env.ADMIN_EMAIL || process.env.ADMIN_NOTIFY_EMAIL || "info@mariage-afro.com";

export function appUrl(): string {
  const explicit = process.env.PUBLIC_APP_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const dom = process.env.REPLIT_DEPLOYMENT_DOMAIN || process.env.REPLIT_DEV_DOMAIN;
  if (dom) return `https://${dom}`;
  return "https://mariage-afro.be";
}

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

async function sendOne({ to, subject, html, text }: SendArgs, log = logger): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    log.warn({ to, subject }, "RESEND_API_KEY is not configured — email skipped");
    return;
  }
  if (!to || !/^.+@.+\..+$/.test(to)) {
    log.warn({ to, subject }, "Skipping email — invalid recipient");
    return;
  }
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({ from: FROM, to, subject, html, text });
  if (error) {
    log.error({ error, to, subject }, "Failed to send email via Resend");
    throw new Error("Failed to send email");
  }
}

// =====================================================================
// LEGACY/EXISTING — kept for backward compatibility with current routes
// =====================================================================

export interface LeadEmailPayload {
  category: "general" | "service-request";
  name: string;
  email: string;
  phone?: string | null;
  weddingDate?: string | null;
  guestCount?: number | null;
  budget?: string | null;
  weddingType?: string | null;
  services?: string[] | null;
  message?: string | null;
  locale?: string | null;
}

export async function sendLeadEmails(payload: LeadEmailPayload, log = logger): Promise<void> {
  const locale = normalizeLocale(payload.locale);
  const services = (payload.services ?? []).join(", ");
  const isService = payload.category === "service-request";
  const T = dict.adminNewLead;
  const adminTitle = isService
    ? { fr: "Nouvelle demande de services", nl: "Nieuwe dienstaanvraag", en: "New service request" }[locale]
    : pick(T.title, locale);
  const rows =
    row(pick(T.rowName, locale), payload.name) +
    row(pick(T.rowEmail, locale), payload.email) +
    row(pick(T.rowPhone, locale), payload.phone) +
    row(pick(T.rowDate, locale), payload.weddingDate) +
    row(pick(T.rowGuests, locale), payload.guestCount ?? undefined) +
    row(pick(T.rowBudget, locale), payload.budget) +
    row(pick(T.rowType, locale), payload.weddingType) +
    row(pick(T.rowServices, locale), services) +
    row(pick(T.rowMessage, locale), payload.message);

  const adminSubject = pick(T.subject(payload.name), "fr");

  await sendOne({
    to: ADMIN_TO,
    subject: `[Mariage Afro] ${adminTitle} — ${payload.name}`,
    html: wrap({ title: adminTitle, intro: pick(T.intro, "fr"), rows, locale: "fr" }),
    text: plainText({ title: adminSubject, intro: pick(T.intro, "fr"), lines: [`${payload.email}`, payload.phone ?? ""] }),
  }, log);

  const greeting = pick(dict.greeting(payload.name), locale);
  const confirmTitle = { fr: "Merci pour votre message", nl: "Bedankt voor uw bericht", en: "Thank you for your message" }[locale];
  const confirmIntro = { fr: "Nous avons bien reçu votre demande et reviendrons vers vous très vite.", nl: "Wij hebben uw aanvraag goed ontvangen en nemen snel contact op.", en: "We have received your request and will get back to you shortly." }[locale];
  await sendOne({
    to: payload.email,
    subject: { fr: "Votre demande a bien été reçue — Mariage Afro", nl: "Uw aanvraag is goed ontvangen — Mariage Afro", en: "Your request has been received — Mariage Afro" }[locale],
    html: wrap({ title: confirmTitle, bodyHtml: `<p>${esc(greeting)}</p><p>${esc(confirmIntro)}</p>`, rows, locale }),
    text: plainText({ title: confirmTitle, intro: `${greeting}\n${confirmIntro}` }),
  }, log);
}

export interface VendorRequestEmailPayload {
  vendorName: string;
  requestType: string;
  name: string;
  email: string;
  phone?: string | null;
  weddingDate?: string | null;
  message?: string | null;
  locale?: string | null;
}

export async function sendVendorRequestEmails(p: VendorRequestEmailPayload, log = logger): Promise<void> {
  const locale = normalizeLocale(p.locale);
  const labels: Record<string, Record<Locale, string>> = {
    quote: { fr: "Demande de devis", nl: "Offerte aanvraag", en: "Quote request" },
    availability: { fr: "Demande de disponibilité", nl: "Beschikbaarheid aanvraag", en: "Availability request" },
    booking: { fr: "Demande de réservation", nl: "Reserveringsaanvraag", en: "Booking request" },
    zoom: { fr: "Demande de Zoom call", nl: "Zoom call aanvraag", en: "Zoom call request" },
    rdv: { fr: "Demande de RDV", nl: "Afspraakaanvraag", en: "Meeting request" },
  };
  const reqLabel = labels[p.requestType]?.[locale] ?? p.requestType;
  const reqLabelFR = labels[p.requestType]?.fr ?? p.requestType;
  const T = dict.adminNewLead;
  const rows =
    row(pick(T.rowVendor, "fr"), p.vendorName) +
    row("Type", reqLabelFR) +
    row(pick(T.rowName, "fr"), p.name) +
    row(pick(T.rowEmail, "fr"), p.email) +
    row(pick(T.rowPhone, "fr"), p.phone) +
    row(pick(T.rowDate, "fr"), p.weddingDate) +
    row(pick(T.rowMessage, "fr"), p.message);

  await sendOne({
    to: ADMIN_TO,
    subject: `[Mariage Afro] ${reqLabelFR} pour ${p.vendorName} — ${p.name}`,
    html: wrap({ title: `${reqLabelFR} — ${p.vendorName}`, rows, locale: "fr" }),
  }, log);

  const greeting = pick(dict.greeting(p.name), locale);
  const confirmTitle = { fr: "Merci pour votre demande", nl: "Bedankt voor uw aanvraag", en: "Thank you for your request" }[locale];
  await sendOne({
    to: p.email,
    subject: `${reqLabel} — Mariage Afro`,
    html: wrap({
      title: confirmTitle,
      bodyHtml: `<p>${esc(greeting)}</p><p>${esc({ fr: `Nous avons bien reçu votre demande concernant ${p.vendorName}. Notre équipe vous répondra rapidement.`, nl: `Wij hebben uw aanvraag voor ${p.vendorName} goed ontvangen. Ons team neemt snel contact op.`, en: `We received your request regarding ${p.vendorName}. Our team will reply shortly.` }[locale])}</p>`,
      rows: row(pick(T.rowVendor, locale), p.vendorName) + row("Type", reqLabel),
      locale,
    }),
  }, log);
}

export interface VenueRequestEmailPayload {
  venueName: string;
  requestType: string;
  name: string;
  email: string;
  phone?: string | null;
  weddingDate?: string | null;
  guestCount?: number | null;
  message?: string | null;
  locale?: string | null;
}

export async function sendVenueRequestEmails(p: VenueRequestEmailPayload, log = logger): Promise<void> {
  const locale = normalizeLocale(p.locale);
  const labels: Record<string, Record<Locale, string>> = {
    visit: { fr: "Demande de visite", nl: "Bezoekaanvraag", en: "Visit request" },
    quote: { fr: "Demande de devis", nl: "Offerte aanvraag", en: "Quote request" },
  };
  const reqLabel = labels[p.requestType]?.[locale] ?? p.requestType;
  const reqLabelFR = labels[p.requestType]?.fr ?? p.requestType;
  const T = dict.adminNewLead;
  const venueLabel = { fr: "Lieu", nl: "Locatie", en: "Venue" }[locale];
  const typeLabel = { fr: "Type de demande", nl: "Type aanvraag", en: "Request type" }[locale];
  const rowsAdmin =
    row("Lieu", p.venueName) +
    row("Type de demande", reqLabelFR) +
    row(pick(T.rowName, "fr"), p.name) +
    row(pick(T.rowEmail, "fr"), p.email) +
    row(pick(T.rowPhone, "fr"), p.phone) +
    row(pick(T.rowDate, "fr"), p.weddingDate) +
    row(pick(T.rowGuests, "fr"), p.guestCount ?? undefined) +
    row(pick(T.rowMessage, "fr"), p.message);

  await sendOne({
    to: ADMIN_TO,
    subject: `[Mariage Afro] ${reqLabelFR} pour ${p.venueName} — ${p.name}`,
    html: wrap({ title: `${reqLabelFR} — ${p.venueName}`, rows: rowsAdmin, locale: "fr" }),
  }, log);

  const rowsClient =
    row(venueLabel, p.venueName) +
    row(typeLabel, reqLabel) +
    row(pick(T.rowDate, locale), p.weddingDate) +
    row(pick(T.rowGuests, locale), p.guestCount ?? undefined) +
    row(pick(T.rowMessage, locale), p.message);
  const greeting = pick(dict.greeting(p.name), locale);
  const confirmTitle = { fr: "Merci pour votre demande", nl: "Bedankt voor uw aanvraag", en: "Thank you for your request" }[locale];
  const confirmBody = { fr: `Nous avons bien reçu votre demande concernant ${p.venueName}.`, nl: `Wij hebben uw aanvraag voor ${p.venueName} goed ontvangen.`, en: `We received your request regarding ${p.venueName}.` }[locale];
  await sendOne({
    to: p.email,
    subject: `${reqLabel} — Mariage Afro`,
    html: wrap({
      title: confirmTitle,
      bodyHtml: `<p>${esc(greeting)}</p><p>${esc(confirmBody)}</p>`,
      rows: rowsClient,
      locale,
    }),
  }, log);
}

// =====================================================================
// NEW NOTIFY* FUNCTIONS — i18n, throttled, fire-and-forget friendly
// =====================================================================

// ---- 1. Admin new lead (alias of sendLeadEmails admin part, standalone) ----
export interface NotifyAdminLeadPayload {
  source: "general" | "service-request" | "vendor-request" | "venue-request";
  name: string;
  email: string;
  phone?: string | null;
  weddingDate?: string | null;
  guestCount?: number | null;
  budget?: string | null;
  weddingType?: string | null;
  services?: string[] | null;
  message?: string | null;
  vendorName?: string | null;
  venueName?: string | null;
}

export async function notifyAdminNewLead(p: NotifyAdminLeadPayload, log = logger): Promise<void> {
  const T = dict.adminNewLead;
  const sourceLabel: Record<NotifyAdminLeadPayload["source"], string> = {
    "general": "Lead général",
    "service-request": "Demande services",
    "vendor-request": `Demande prestataire (${p.vendorName ?? "?"})`,
    "venue-request": `Demande lieu (${p.venueName ?? "?"})`,
  };
  const services = (p.services ?? []).join(", ");
  const rows =
    row("Source", sourceLabel[p.source]) +
    row(pick(T.rowVendor, "fr"), p.vendorName) +
    row("Lieu", p.venueName) +
    row(pick(T.rowName, "fr"), p.name) +
    row(pick(T.rowEmail, "fr"), p.email) +
    row(pick(T.rowPhone, "fr"), p.phone) +
    row(pick(T.rowDate, "fr"), p.weddingDate) +
    row(pick(T.rowGuests, "fr"), p.guestCount ?? undefined) +
    row(pick(T.rowBudget, "fr"), p.budget) +
    row(pick(T.rowType, "fr"), p.weddingType) +
    row(pick(T.rowServices, "fr"), services) +
    row(pick(T.rowMessage, "fr"), p.message);

  await sendOne({
    to: ADMIN_TO,
    subject: `[Mariage Afro] ${sourceLabel[p.source]} — ${p.name}`,
    html: wrap({
      title: pick(T.title, "fr"),
      intro: pick(T.intro, "fr"),
      rows,
      ctaLabel: "Voir dans l'admin",
      ctaUrl: `${appUrl()}/admin`,
      locale: "fr",
    }),
  }, log);
}

// ---- 2. Vendor new lead ----
export interface NotifyVendorLeadPayload {
  to: string;
  locale?: string | null;
  vendorName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string | null;
  requestType?: string | null;
  weddingDate?: string | null;
  message?: string | null;
}

export async function notifyVendorNewLead(p: NotifyVendorLeadPayload, log = logger): Promise<void> {
  const locale = normalizeLocale(p.locale);
  const T = dict.vendorNewLead;
  const adminT = dict.adminNewLead;
  const rows =
    row(pick(adminT.rowName, locale), p.contactName) +
    row(pick(adminT.rowEmail, locale), p.contactEmail) +
    row(pick(adminT.rowPhone, locale), p.contactPhone) +
    row(pick(adminT.rowDate, locale), p.weddingDate) +
    row("Type", p.requestType) +
    row(pick(adminT.rowMessage, locale), p.message);

  await sendOne({
    to: p.to,
    subject: pick(T.subject(p.vendorName), locale),
    html: wrap({
      title: pick(T.title, locale),
      intro: pick(T.intro(p.vendorName), locale),
      rows,
      ctaLabel: pick(T.cta, locale),
      ctaUrl: `${appUrl()}/espace-pro/dashboard`,
      locale,
    }),
  }, log);
}

// ---- 3. Conversation message (with 15min throttle) ----
const CONVERSATION_THROTTLE_MS = 15 * 60 * 1000;
const conversationCache = new Map<string, number>();

function shouldThrottle(key: string): boolean {
  const last = conversationCache.get(key);
  const now = Date.now();
  if (last && now - last < CONVERSATION_THROTTLE_MS) return true;
  conversationCache.set(key, now);
  // light cleanup
  if (conversationCache.size > 500) {
    for (const [k, ts] of conversationCache) {
      if (now - ts > CONVERSATION_THROTTLE_MS) conversationCache.delete(k);
    }
  }
  return false;
}

export interface NotifyConversationPayload {
  to: string;
  locale?: string | null;
  senderLabel: string;
  preview?: string | null;
  conversationKey: string;
  ctaUrl?: string | null;
}

export async function notifyConversationMessage(p: NotifyConversationPayload, log = logger): Promise<void> {
  const throttleKey = `${p.conversationKey}:${p.to.toLowerCase()}`;
  if (shouldThrottle(throttleKey)) {
    log.info({ to: p.to, key: throttleKey }, "Conversation email throttled");
    return;
  }
  const locale = normalizeLocale(p.locale);
  const T = dict.conversation;
  const previewHtml = p.preview
    ? `<blockquote style="margin:16px 0;padding:12px 16px;background:#fff4e4;border-left:3px solid #c9a96e;color:#1f1416;font-style:italic;">${esc(p.preview.slice(0, 280))}${p.preview.length > 280 ? "…" : ""}</blockquote>`
    : "";
  await sendOne({
    to: p.to,
    subject: pick(T.subject(p.senderLabel), locale),
    html: wrap({
      title: pick(T.title, locale),
      intro: pick(T.intro(p.senderLabel), locale),
      bodyHtml: previewHtml,
      ctaLabel: pick(T.cta, locale),
      ctaUrl: p.ctaUrl ?? `${appUrl()}/`,
      locale,
    }),
  }, log);
}

export function _resetConversationThrottleForTests(): void {
  conversationCache.clear();
}

// ---- 4. New RSVP for couple ----
export interface NotifyRsvpPayload {
  to: string;
  locale?: string | null;
  guestName: string;
  guestEmail?: string | null;
  attending: boolean;
  guestCount: number;
  message?: string | null;
  weddingSlug?: string | null;
}

export async function notifyCoupleNewRsvp(p: NotifyRsvpPayload, log = logger): Promise<void> {
  const locale = normalizeLocale(p.locale);
  const T = dict.rsvp;
  const rows =
    row(pick(T.rowName, locale), p.guestName) +
    row(pick(T.rowEmail, locale), p.guestEmail) +
    row(pick(T.rowAttending, locale), p.attending ? pick(T.yes, locale) : pick(T.no, locale)) +
    row(pick(T.rowGuests, locale), p.attending ? p.guestCount : undefined) +
    row(pick(T.rowMessage, locale), p.message);
  await sendOne({
    to: p.to,
    subject: pick(T.subject(p.guestName), locale),
    html: wrap({
      title: pick(T.title, locale),
      intro: pick(T.intro(p.guestName, p.attending, p.guestCount), locale),
      rows,
      ctaLabel: { fr: "Voir mes invités", nl: "Mijn gasten bekijken", en: "View my guests" }[locale],
      ctaUrl: `${appUrl()}/espace-client/site`,
      locale,
    }),
  }, log);
}

// ---- 5. Vendor approved ----
export interface NotifyVendorApprovedPayload {
  to: string;
  locale?: string | null;
  businessName: string;
}

export async function notifyVendorApproved(p: NotifyVendorApprovedPayload, log = logger): Promise<void> {
  const locale = normalizeLocale(p.locale);
  const T = dict.vendorApproved;
  await sendOne({
    to: p.to,
    subject: pick(T.subject, locale),
    html: wrap({
      title: pick(T.title, locale),
      intro: pick(T.intro(p.businessName), locale),
      bodyHtml: `<p>${esc(pick(T.body, locale))}</p>`,
      ctaLabel: pick(T.cta, locale),
      ctaUrl: `${appUrl()}/espace-pro/login`,
      locale,
    }),
  }, log);
}

// ---- 6. Partner application received (couple/candidate) ----
export interface NotifyPartnerApplicationPayload {
  to: string;
  locale?: string | null;
  contactName: string;
  businessName: string;
  category?: string | null;
}

export async function notifyPartnerApplicationReceived(p: NotifyPartnerApplicationPayload, log = logger): Promise<void> {
  const locale = normalizeLocale(p.locale);
  const T = dict.partnerReceived;
  await sendOne({
    to: p.to,
    subject: pick(T.subject, locale),
    html: wrap({
      title: pick(T.title, locale),
      intro: pick(T.intro(p.contactName), locale),
      bodyHtml: `<p>${esc(pick(T.body, locale))}</p>`,
      rows: row("Business", p.businessName) + row({ fr: "Catégorie", nl: "Categorie", en: "Category" }[locale], p.category ?? undefined),
      locale,
    }),
  }, log);
}

// =====================================================================
// LOT 6 — Conversion tools & lead magnets
// =====================================================================

const LEAD_MAGNET_PDF_URL = process.env.LEAD_MAGNET_PDF_URL || `${appUrl()}/guide-mariage-afro.pdf`;
const BUDGET_GUIDE_PDF_URL = process.env.BUDGET_GUIDE_PDF_URL || `${appUrl()}/guide-budget-mariage.pdf`;

export interface NotifyBudgetResultPayload {
  to: string;
  locale?: string | null;
  name: string;
  totalMin: number;
  totalMax: number;
  breakdown: Array<{ label: string; min: number; max: number }>;
  guestCount?: number | null;
  region?: string | null;
  standing?: string | null;
}

function fmtEur(n: number): string {
  return new Intl.NumberFormat("fr-BE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

export async function notifyBudgetResult(p: NotifyBudgetResultPayload, log = logger): Promise<void> {
  const locale = normalizeLocale(p.locale);
  const T = dict.budgetResult;
  const totalLabel = { fr: "Fourchette totale", nl: "Totaalbereik", en: "Total range" }[locale];
  const guestsLabel = { fr: "Nombre d'invités", nl: "Aantal gasten", en: "Guest count" }[locale];
  const regionLabel = { fr: "Région", nl: "Regio", en: "Region" }[locale];
  const standingLabel = { fr: "Standing", nl: "Standing", en: "Standing" }[locale];
  const breakdownLabel = { fr: "Ventilation par poste", nl: "Verdeling per post", en: "Breakdown by item" }[locale];

  const breakdownRows = p.breakdown
    .map((b) => row(b.label, `${fmtEur(b.min)} – ${fmtEur(b.max)}`))
    .join("");

  const adminBreakdown = `<h3 style="margin:20px 0 8px;color:#68191e;font-size:14px;">${esc(breakdownLabel)}</h3><table style="width:100%;border-collapse:collapse;border-top:1px solid #eee;">${breakdownRows}</table>`;

  const headerRows =
    row(totalLabel, `${fmtEur(p.totalMin)} – ${fmtEur(p.totalMax)}`) +
    row(guestsLabel, p.guestCount ?? undefined) +
    row(regionLabel, p.region) +
    row(standingLabel, p.standing);

  await sendOne({
    to: p.to,
    subject: pick(T.subject, locale),
    html: wrap({
      title: pick(T.title, locale),
      intro: pick(T.intro(p.name), locale),
      bodyHtml: `<p>${esc(pick(T.body, locale))}</p>${adminBreakdown}`,
      rows: headerRows,
      ctaLabel: pick(T.cta, locale),
      ctaUrl: BUDGET_GUIDE_PDF_URL,
      locale,
    }),
  }, log);

  // Admin copy
  await sendOne({
    to: ADMIN_TO,
    subject: `[Mariage Afro] Calculateur budget — ${p.name}`,
    html: wrap({
      title: "Lead calculateur budget",
      intro: `${p.name} (${p.to}) a complété le calculateur de budget.`,
      rows: row("Email", p.to) + headerRows,
      bodyHtml: adminBreakdown,
      locale: "fr",
    }),
  }, log);
}

export interface NotifyQuizResultPayload {
  to: string;
  locale?: string | null;
  name: string;
  profileName: string;
  profileDescription?: string | null;
  recommendedVendors?: Array<{ name: string; category?: string | null; url?: string | null }>;
}

export async function notifyQuizResult(p: NotifyQuizResultPayload, log = logger): Promise<void> {
  const locale = normalizeLocale(p.locale);
  const T = dict.quizResult;
  const profileBody = p.profileDescription
    ? `<blockquote style="margin:16px 0;padding:12px 16px;background:#fff4e4;border-left:3px solid #c9a96e;color:#1f1416;">${esc(p.profileDescription)}</blockquote>`
    : "";
  const recoLabel = { fr: "Prestataires recommandés", nl: "Aanbevolen leveranciers", en: "Recommended vendors" }[locale];
  const recoHtml = (p.recommendedVendors ?? []).length
    ? `<h3 style="margin:20px 0 8px;color:#68191e;font-size:14px;">${esc(recoLabel)}</h3><ul style="padding-left:20px;color:#1f1416;">${(p.recommendedVendors ?? [])
        .map((v) =>
          `<li style="margin:6px 0;"><strong>${esc(v.name)}</strong>${v.category ? ` <span style="color:#888;">— ${esc(v.category)}</span>` : ""}${v.url ? ` <a href="${esc(v.url)}" style="color:#68191e;">Voir →</a>` : ""}</li>`,
        )
        .join("")}</ul>`
    : "";

  await sendOne({
    to: p.to,
    subject: pick(T.subject(p.profileName), locale),
    html: wrap({
      title: pick(T.title, locale),
      intro: pick(T.intro(p.name, p.profileName), locale),
      bodyHtml: `${profileBody}<p>${esc(pick(T.body, locale))}</p>${recoHtml}`,
      ctaLabel: pick(T.cta, locale),
      ctaUrl: `${appUrl()}/partenaires`,
      locale,
    }),
  }, log);

  await sendOne({
    to: ADMIN_TO,
    subject: `[Mariage Afro] Quiz — ${p.name} (${p.profileName})`,
    html: wrap({
      title: "Lead quiz mariage",
      intro: `${p.name} (${p.to}) a complété le quiz. Profil : ${p.profileName}.`,
      rows: row("Profil", p.profileName) + row("Email", p.to),
      locale: "fr",
    }),
  }, log);
}

export interface NotifyLeadMagnetPayload {
  to: string;
  locale?: string | null;
  name: string;
  magnetTitle?: string | null;
}

export async function notifyLeadMagnet(p: NotifyLeadMagnetPayload, log = logger): Promise<void> {
  const locale = normalizeLocale(p.locale);
  const T = dict.leadMagnet;
  await sendOne({
    to: p.to,
    subject: pick(T.subject, locale),
    html: wrap({
      title: pick(T.title, locale),
      intro: pick(T.intro(p.name), locale),
      bodyHtml: `<p>${esc(pick(T.body, locale))}</p>`,
      ctaLabel: pick(T.cta, locale),
      ctaUrl: LEAD_MAGNET_PDF_URL,
      locale,
    }),
  }, log);

  await sendOne({
    to: ADMIN_TO,
    subject: `[Mariage Afro] Lead magnet téléchargé — ${p.name}`,
    html: wrap({
      title: "Téléchargement lead magnet",
      intro: `${p.name} (${p.to}) a téléchargé "${p.magnetTitle ?? "Mon mariage afro en 12 étapes"}".`,
      rows: row("Email", p.to),
      locale: "fr",
    }),
  }, log);
}

export interface NotifyMultiDevisPayload {
  to: string;
  locale?: string | null;
  name: string;
  vendorNames: string[];
}

export async function notifyMultiDevisConfirmation(p: NotifyMultiDevisPayload, log = logger): Promise<void> {
  const locale = normalizeLocale(p.locale);
  const T = dict.multiDevis;
  await sendOne({
    to: p.to,
    subject: pick(T.subject, locale),
    html: wrap({
      title: pick(T.title, locale),
      intro: pick(T.intro(p.name, p.vendorNames.length), locale),
      bodyHtml: `<p>${esc(pick(T.body, locale))}</p>`,
      rows: row(pick(T.rowVendors, locale), p.vendorNames.join(", ")),
      ctaLabel: pick(dict.ctaOpen, locale),
      ctaUrl: `${appUrl()}/partenaires`,
      locale,
    }),
  }, log);
}

// =====================================================================
// LEGACY partner / contact emails (kept)
// =====================================================================

export interface PartnerApplicationEmailPayload {
  businessName: string;
  contactName: string;
  email: string;
  phone?: string | null;
  category: string;
  website?: string | null;
  description?: string | null;
}

export async function sendPartnerApplicationEmails(p: PartnerApplicationEmailPayload, log = logger): Promise<void> {
  const rows =
    row("Entreprise", p.businessName) +
    row("Contact", p.contactName) +
    row("Email", p.email) +
    row("Téléphone", p.phone) +
    row("Catégorie", p.category) +
    row("Site web", p.website) +
    row("Présentation", p.description);

  await sendOne({
    to: ADMIN_TO,
    subject: `[Mariage Afro] Candidature partenaire — ${p.businessName}`,
    html: wrap({ title: "Nouvelle candidature partenaire", rows, locale: "fr" }),
  }, log);

  // Confirmation to applicant via the i18n notify function (defaults to FR)
  await notifyPartnerApplicationReceived({
    to: p.email,
    contactName: p.contactName,
    businessName: p.businessName,
    category: p.category,
  }, log);
}

// ---- Generic contact form (used by routes/contact.ts) ----
export interface ContactFormPayload {
  name: string;
  email: string;
  phone?: string | null;
  date?: string | null;
  type?: string | null;
  message: string;
}

export async function sendContactFormEmail(p: ContactFormPayload, log = logger): Promise<void> {
  const rows =
    row("Nom", p.name) +
    row("Email", p.email) +
    row("Téléphone", p.phone) +
    row("Date envisagée", p.date) +
    row("Type de mariage", p.type) +
    row("Message", p.message);
  await sendOne({
    to: ADMIN_TO,
    subject: `[Mariage Afro] Nouvelle demande de RDV — ${p.name}`,
    html: wrap({ title: "Nouvelle demande de rendez-vous", rows, locale: "fr" }),
  }, log);
}
