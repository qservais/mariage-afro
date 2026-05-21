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

// ---- notifyQuoteRequestConfirmation — visitor confirmation after vendor lead ----
export interface NotifyQuoteRequestConfirmationPayload {
  vendorName: string;
  requestType: string;
  name: string;
  email: string;
  phone?: string | null;
  weddingDate?: string | null;
  message?: string | null;
  locale?: string | null;
}

export async function notifyQuoteRequestConfirmation(p: NotifyQuoteRequestConfirmationPayload, log = logger): Promise<void> {
  const locale = normalizeLocale(p.locale);
  const labels: Record<string, Record<Locale, string>> = {
    quote: { fr: "Demande de devis", nl: "Offerte aanvraag", en: "Quote request" },
    availability: { fr: "Demande de disponibilité", nl: "Beschikbaarheidsaanvraag", en: "Availability request" },
    booking: { fr: "Demande de réservation", nl: "Reserveringsaanvraag", en: "Booking request" },
    zoom: { fr: "Demande de Zoom call", nl: "Zoom call aanvraag", en: "Zoom call request" },
    rdv: { fr: "Demande de RDV", nl: "Afspraakaanvraag", en: "Meeting request" },
  };
  const reqLabel = labels[p.requestType]?.[locale] ?? p.requestType;
  const T = dict.adminNewLead;
  const greeting = pick(dict.greeting(p.name), locale);
  const confirmTitle = { fr: "Merci pour votre demande", nl: "Bedankt voor uw aanvraag", en: "Thank you for your request" }[locale];
  const confirmBody = {
    fr: `Nous avons bien reçu votre demande concernant <strong>${esc(p.vendorName)}</strong>. Le prestataire et notre équipe vous répondront dans les plus brefs délais.`,
    nl: `Wij hebben uw aanvraag voor <strong>${esc(p.vendorName)}</strong> goed ontvangen. De leverancier en ons team nemen spoedig contact op.`,
    en: `We received your request regarding <strong>${esc(p.vendorName)}</strong>. The vendor and our team will get back to you shortly.`,
  }[locale];
  const rows =
    row(pick(T.rowVendor, locale), p.vendorName) +
    row("Type", reqLabel) +
    row(pick(T.rowDate, locale), p.weddingDate) +
    row(pick(T.rowPhone, locale), p.phone) +
    row(pick(T.rowMessage, locale), p.message);

  await sendOne({
    to: p.email,
    subject: { fr: `Votre demande pour ${p.vendorName} — Mariage Afro`, nl: `Uw aanvraag voor ${p.vendorName} — Mariage Afro`, en: `Your request for ${p.vendorName} — Mariage Afro` }[locale],
    html: wrap({
      title: confirmTitle,
      bodyHtml: `<p>${esc(greeting)}</p><p>${confirmBody}</p>`,
      rows,
      ctaLabel: { fr: "Découvrir la plateforme", nl: "Ontdek het platform", en: "Discover the platform" }[locale],
      ctaUrl: appUrl(),
      locale,
    }),
    text: plainText({ title: confirmTitle, intro: `${greeting}\n${p.vendorName} — ${reqLabel}` }),
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

// ---- LOT 9. Mood board collaborator invite ----
export interface NotifyMoodBoardInvitePayload {
  to: string;
  locale?: string | null;
  inviterName: string;
  boardTitle: string;
  acceptUrl: string;
}

export async function notifyMoodBoardInvite(p: NotifyMoodBoardInvitePayload, log = logger): Promise<void> {
  const locale = normalizeLocale(p.locale);
  const T = {
    subject: { fr: `${p.inviterName} vous invite sur leur mood board`, nl: `${p.inviterName} nodigt u uit op hun moodboard`, en: `${p.inviterName} invited you to their mood board` }[locale],
    title: { fr: "Invitation mood board", nl: "Moodboard uitnodiging", en: "Mood board invitation" }[locale],
    intro: { fr: `${p.inviterName} vous invite à collaborer sur "${p.boardTitle}".`, nl: `${p.inviterName} nodigt u uit om mee te werken aan "${p.boardTitle}".`, en: `${p.inviterName} invites you to collaborate on "${p.boardTitle}".` }[locale],
    cta: { fr: "Voir le mood board", nl: "Moodboard bekijken", en: "Open mood board" }[locale],
  };
  await sendOne({
    to: p.to, subject: T.subject,
    html: wrap({ title: T.title, intro: T.intro, ctaLabel: T.cta, ctaUrl: p.acceptUrl, locale }),
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

export interface NotifyAdminSubscriptionRequestPayload {
  vendorName: string;
  contactName: string;
  contactEmail: string;
  tier: "basic" | "premium" | "featured";
  notes?: string | null;
}

export async function notifyAdminSubscriptionRequest(p: NotifyAdminSubscriptionRequestPayload, log = logger): Promise<void> {
  const tierLabel = p.tier === "featured" ? "Featured" : p.tier === "premium" ? "Premium" : "Basic";
  const subject = `[Mariage Afro] Demande d'abonnement ${tierLabel} — ${p.vendorName}`;
  const adminLink = `${appUrl()}/admin`;
  const rows =
    row("Prestataire", p.vendorName) +
    row("Contact", `${p.contactName} <${p.contactEmail}>`) +
    row("Formule demandée", tierLabel) +
    (p.notes ? row("Note", p.notes) : "");
  const html = wrap({
    title: "Nouvelle demande d'abonnement",
    intro: `${p.vendorName} souhaite souscrire à la formule ${tierLabel}.`,
    rows,
    ctaLabel: "Ouvrir l'admin",
    ctaUrl: adminLink,
    locale: "fr",
  });
  const text = plainText({
    title: "Nouvelle demande d'abonnement",
    lines: [
      `Prestataire: ${p.vendorName}`,
      `Contact: ${p.contactName} <${p.contactEmail}>`,
      `Formule: ${tierLabel}`,
      ...(p.notes ? [`Note: ${p.notes}`] : []),
    ],
    ctaLabel: "Admin",
    ctaUrl: adminLink,
  });
  await sendOne({ to: ADMIN_TO, subject, html, text }, log);
}

export interface NotifyVendorSubscriptionPayload {
  to: string;
  vendorName: string;
  tier: "basic" | "premium" | "featured";
  status: "active" | "cancelled" | "expired";
  endsAt?: string | null;
  locale?: string | null;
}

export async function notifyVendorSubscriptionActivated(p: NotifyVendorSubscriptionPayload, log = logger): Promise<void> {
  const tierLabel = p.tier === "featured" ? "Featured" : p.tier === "premium" ? "Premium" : "Basic";
  const isActive = p.status === "active";
  const subject = isActive
    ? `Votre formule ${tierLabel} est active — Mariage Afro`
    : p.status === "cancelled"
      ? `Votre abonnement ${tierLabel} a été annulé — Mariage Afro`
      : `Votre abonnement ${tierLabel} a expiré — Mariage Afro`;
  const intro = isActive
    ? `Bonne nouvelle ${p.vendorName} ! Votre formule ${tierLabel} est maintenant active sur la marketplace.`
    : p.status === "cancelled"
      ? `${p.vendorName}, votre abonnement ${tierLabel} a été annulé.`
      : `${p.vendorName}, votre abonnement ${tierLabel} a expiré.`;
  const rows =
    row("Formule", tierLabel) +
    row("Statut", p.status) +
    (p.endsAt ? row("Échéance", p.endsAt.slice(0, 10)) : "");
  await sendOne({
    to: p.to,
    subject,
    html: wrap({
      title: isActive ? "Formule activée" : "Mise à jour de votre abonnement",
      intro,
      rows,
      ctaLabel: "Ouvrir mon Espace Pro",
      ctaUrl: `${appUrl()}/espace-pro/abonnement`,
      locale: "fr",
    }),
    text: plainText({
      title: subject,
      lines: [intro, `Formule: ${tierLabel}`, `Statut: ${p.status}`],
      ctaLabel: "Espace Pro",
      ctaUrl: `${appUrl()}/espace-pro/abonnement`,
    }),
  }, log);
}

export interface NotifyVendorLeadFollowupPayload {
  to: string;
  vendorName: string;
  newCount: number;
  contactedCount: number;
  locale?: string;
}

export async function notifyVendorLeadFollowup(p: NotifyVendorLeadFollowupPayload, log = logger): Promise<void> {
  const subject = `Rappel : ${p.newCount + p.contactedCount} demande(s) en attente — Mariage Afro`;
  const intro = `Bonjour ${p.vendorName}, vous avez encore des demandes sans réponse depuis plusieurs jours. Une réponse rapide augmente nettement vos chances de conversion.`;
  const rows =
    row("Nouvelles non vues", String(p.newCount)) +
    row("Contactées sans relance", String(p.contactedCount));
  await sendOne({
    to: p.to,
    subject,
    html: wrap({
      title: "Demandes en attente",
      intro,
      rows,
      ctaLabel: "Voir mes demandes",
      ctaUrl: `${appUrl()}/espace-pro/demandes`,
      locale: "fr",
    }),
    text: plainText({
      title: subject,
      lines: [intro, `Nouvelles non vues: ${p.newCount}`, `Contactées sans relance: ${p.contactedCount}`, "Vous pouvez désactiver ces rappels dans vos paramètres."],
      ctaLabel: "Espace Pro",
      ctaUrl: `${appUrl()}/espace-pro/demandes`,
    }),
  }, log);
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

// ---- 7. Couple approved ----
export interface NotifyCoupleApprovedPayload {
  to: string;
  locale?: string | null;
  partner1Name: string;
  partner2Name?: string | null;
}

export async function notifyCoupleApproved(p: NotifyCoupleApprovedPayload, log = logger): Promise<void> {
  const locale = normalizeLocale(p.locale);
  const names = [p.partner1Name, p.partner2Name].filter(Boolean).join(" & ");
  const subject = { fr: "Votre compte Mariage Afro est validé", nl: "Uw Mariage Afro-account is goedgekeurd", en: "Your Mariage Afro account is approved" }[locale];
  const title = { fr: "Compte validé", nl: "Account goedgekeurd", en: "Account approved" }[locale];
  const intro = { fr: `Félicitations ${names} ! Votre compte a été validé par notre équipe. Vous pouvez maintenant publier votre mini-site de mariage et envoyer des demandes de devis à nos prestataires.`, nl: `Gefeliciteerd ${names}! Uw account is goedgekeurd door ons team. U kunt nu uw huwelijkswebsite publiceren en offerteaanvragen sturen.`, en: `Congratulations ${names}! Your account has been approved by our team. You can now publish your wedding website and send quote requests.` }[locale];
  const ctaLabel = { fr: "Accéder à mon espace", nl: "Mijn ruimte openen", en: "Open my space" }[locale];
  await sendOne({
    to: p.to,
    subject,
    html: wrap({ title, intro, ctaLabel, ctaUrl: `${appUrl()}/espace-client`, locale }),
  }, log);
}

// ---- 8. Couple rejected ----
export interface NotifyCoupleRejectedPayload {
  to: string;
  locale?: string | null;
  partner1Name: string;
  partner2Name?: string | null;
  reason?: string | null;
}

export async function notifyCoupleRejected(p: NotifyCoupleRejectedPayload, log = logger): Promise<void> {
  const locale = normalizeLocale(p.locale);
  const names = [p.partner1Name, p.partner2Name].filter(Boolean).join(" & ");
  const subject = { fr: "Mise à jour de votre compte Mariage Afro", nl: "Update van uw Mariage Afro-account", en: "Update on your Mariage Afro account" }[locale];
  const title = { fr: "Demande non aboutie", nl: "Aanvraag niet goedgekeurd", en: "Request not approved" }[locale];
  const intro = { fr: `Bonjour ${names}. Après examen de votre dossier, nous ne sommes pas en mesure de valider votre compte pour le moment.`, nl: `Hallo ${names}. Na beoordeling van uw dossier kunnen wij uw account momenteel niet goedkeuren.`, en: `Hello ${names}. After reviewing your file, we are unable to approve your account at this time.` }[locale];
  const reasonHtml = p.reason ? `<p style="margin-top:12px;padding:12px 16px;background:#fff4e4;border-left:3px solid #c9a96e;">${esc(p.reason)}</p>` : "";
  const ctaLabel = { fr: "Nous contacter", nl: "Contact opnemen", en: "Contact us" }[locale];
  await sendOne({
    to: p.to,
    subject,
    html: wrap({ title, intro, bodyHtml: reasonHtml, ctaLabel, ctaUrl: `${appUrl()}/contact`, locale }),
  }, log);
}

// ---- 9. Vendor rejected ----
export interface NotifyVendorRejectedPayload {
  to: string;
  locale?: string | null;
  businessName: string;
  reason?: string | null;
}

export async function notifyVendorRejected(p: NotifyVendorRejectedPayload, log = logger): Promise<void> {
  const locale = normalizeLocale(p.locale);
  const subject = { fr: "Mise à jour de votre candidature Mariage Afro", nl: "Update van uw Mariage Afro-kandidatuur", en: "Update on your Mariage Afro application" }[locale];
  const title = { fr: "Candidature non retenue", nl: "Kandidatuur niet weerhouden", en: "Application not approved" }[locale];
  const intro = { fr: `Bonjour ${p.businessName}. Après examen de votre candidature, nous ne pouvons pas l'approuver pour le moment.`, nl: `Hallo ${p.businessName}. Na beoordeling van uw kandidatuur kunnen wij deze momenteel niet goedkeuren.`, en: `Hello ${p.businessName}. After reviewing your application, we are unable to approve it at this time.` }[locale];
  const reasonHtml = p.reason ? `<p style="margin-top:12px;padding:12px 16px;background:#fff4e4;border-left:3px solid #c9a96e;">${esc(p.reason)}</p>` : "";
  const ctaLabel = { fr: "Nous contacter", nl: "Contact opnemen", en: "Contact us" }[locale];
  await sendOne({
    to: p.to,
    subject,
    html: wrap({ title, intro, bodyHtml: reasonHtml, ctaLabel, ctaUrl: `${appUrl()}/contact`, locale }),
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

// ---- LOT 10. Quote emails ----
export interface NotifyQuoteReceivedPayload {
  to: string;
  locale?: string | null;
  recipientName: string;
  vendorName: string;
  subject: string;
  message: string;
  amountTtc: number;
  validityDays: number;
  quoteId: number;
  /** Pass true only when the recipient is a registered couple with a client space. */
  isRegisteredCouple?: boolean;
}

export async function notifyQuoteReceived(p: NotifyQuoteReceivedPayload, log = logger): Promise<void> {
  const locale = normalizeLocale(p.locale);
  const greeting = p.recipientName ? pick(dict.greeting(p.recipientName), locale) : "";
  const title = { fr: "Vous avez reçu un devis", nl: "U heeft een offerte ontvangen", en: "You received a quote" }[locale];
  const intro = { fr: `${p.vendorName} vous a envoyé un devis.`, nl: `${p.vendorName} heeft u een offerte gestuurd.`, en: `${p.vendorName} sent you a quote.` }[locale];
  const validLabel = { fr: "Valable", nl: "Geldig", en: "Valid for" }[locale];
  const amtLabel = { fr: "Montant TTC", nl: "Bedrag incl. BTW", en: "Amount incl. VAT" }[locale];
  const ctaLabel = { fr: "Voir le devis", nl: "Offerte bekijken", en: "View quote" }[locale];
  const daysLabel = { fr: `${p.validityDays} jours`, nl: `${p.validityDays} dagen`, en: `${p.validityDays} days` }[locale];
  const rows =
    row({ fr: "Prestataire", nl: "Leverancier", en: "Vendor" }[locale], p.vendorName) +
    row({ fr: "Objet", nl: "Onderwerp", en: "Subject" }[locale], p.subject || undefined) +
    row(amtLabel, fmtEur(p.amountTtc / 100)) +
    row(validLabel, daysLabel) +
    row({ fr: "Message", nl: "Bericht", en: "Message" }[locale], p.message || undefined);
  await sendOne({
    to: p.to,
    subject: `[Mariage Afro] ${title} — ${p.vendorName}`,
    html: wrap({
      title,
      intro: greeting ? `${greeting}\n${intro}` : intro,
      rows,
      ctaLabel: p.isRegisteredCouple ? ctaLabel : undefined,
      ctaUrl: p.isRegisteredCouple ? `${appUrl()}/espace-client/devis` : undefined,
      locale,
    }),
  }, log);
}

export interface NotifyQuoteRespondedPayload {
  to: string;
  locale?: string | null;
  vendorName: string;
  recipientName: string;
  action: "accept" | "refuse";
  message: string | null;
  quoteId: number;
}

export async function notifyQuoteResponded(p: NotifyQuoteRespondedPayload, log = logger): Promise<void> {
  const locale = normalizeLocale(p.locale);
  const accepted = p.action === "accept";
  const title = accepted
    ? { fr: "Devis accepté", nl: "Offerte geaccepteerd", en: "Quote accepted" }[locale]
    : { fr: "Devis refusé", nl: "Offerte geweigerd", en: "Quote refused" }[locale];
  const intro = accepted
    ? { fr: `${p.recipientName || "Le couple"} a accepté votre devis.`, nl: `${p.recipientName || "Het koppel"} heeft uw offerte geaccepteerd.`, en: `${p.recipientName || "The couple"} accepted your quote.` }[locale]
    : { fr: `${p.recipientName || "Le couple"} a refusé votre devis.`, nl: `${p.recipientName || "Het koppel"} heeft uw offerte geweigerd.`, en: `${p.recipientName || "The couple"} refused your quote.` }[locale];
  const rows = p.message ? row({ fr: "Message", nl: "Bericht", en: "Message" }[locale], p.message) : "";
  await sendOne({
    to: p.to,
    subject: `[Mariage Afro] ${title}`,
    html: wrap({
      title,
      intro,
      rows,
      ctaLabel: { fr: "Voir mes devis", nl: "Mijn offertes bekijken", en: "View my quotes" }[locale],
      ctaUrl: `${appUrl()}/espace-pro/devis`,
      locale,
    }),
  }, log);
}

export interface NotifyQuoteAcceptedPayload {
  to: string;
  locale?: string | null;
  recipientName: string;
  vendorName: string;
  subject: string;
  amountTtc: number;
  quoteId: number;
}

export async function notifyQuoteAccepted(p: NotifyQuoteAcceptedPayload, log = logger): Promise<void> {
  const locale = normalizeLocale(p.locale);
  const greeting = p.recipientName ? pick(dict.greeting(p.recipientName), locale) : "";
  const title = { fr: "Devis accepté — confirmation", nl: "Offerte geaccepteerd — bevestiging", en: "Quote accepted — confirmation" }[locale];
  const intro = {
    fr: `Votre acceptation du devis de ${p.vendorName} a bien été enregistrée. Le prestataire vous contactera prochainement.`,
    nl: `Uw acceptatie van de offerte van ${p.vendorName} is goed geregistreerd. De leverancier neemt binnenkort contact met u op.`,
    en: `Your acceptance of the quote from ${p.vendorName} has been recorded. The vendor will contact you shortly.`,
  }[locale];
  const rows =
    row({ fr: "Prestataire", nl: "Leverancier", en: "Vendor" }[locale], p.vendorName) +
    row({ fr: "Objet", nl: "Onderwerp", en: "Subject" }[locale], p.subject || undefined) +
    row({ fr: "Montant TTC", nl: "Bedrag incl. BTW", en: "Amount incl. VAT" }[locale], fmtEur(p.amountTtc / 100));
  await sendOne({
    to: p.to,
    subject: `[Mariage Afro] ${title}`,
    html: wrap({
      title,
      intro: greeting ? `${greeting}\n${intro}` : intro,
      rows,
      ctaLabel: { fr: "Voir mes devis", nl: "Mijn offertes bekijken", en: "View my quotes" }[locale],
      ctaUrl: `${appUrl()}/espace-client/devis`,
      locale,
    }),
  }, log);
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

// ---- Personal guest invitation (couple → guest) ----
export interface NotifyPersonalInvitationPayload {
  to: string;
  guestName: string;
  coupleName: string;
  siteUrl: string;
  locale?: string | null;
}

export async function notifyPersonalInvitation(p: NotifyPersonalInvitationPayload, log = logger): Promise<void> {
  const locale = normalizeLocale(p.locale);
  const subject = {
    fr: `${p.coupleName} vous invitent à leur mariage`,
    nl: `${p.coupleName} nodigen u uit voor hun huwelijk`,
    en: `${p.coupleName} invite you to their wedding`,
  }[locale];
  const title = {
    fr: "Invitation au mariage",
    nl: "Huwelijksuitnodiging",
    en: "Wedding invitation",
  }[locale];
  const intro = {
    fr: `Bonjour ${p.guestName},\n\n${p.coupleName} ont le plaisir de vous inviter à leur mariage. Retrouvez toutes les informations et confirmez votre présence via le lien ci-dessous.`,
    nl: `Beste ${p.guestName},\n\n${p.coupleName} nodigen u met plezier uit voor hun huwelijk. Bekijk alle informatie en bevestig uw aanwezigheid via de onderstaande link.`,
    en: `Dear ${p.guestName},\n\n${p.coupleName} are delighted to invite you to their wedding. Find all the details and confirm your attendance via the link below.`,
  }[locale];
  const ctaLabel = {
    fr: "Voir le site mariage",
    nl: "Trouwsite bekijken",
    en: "View wedding site",
  }[locale];
  await sendOne({
    to: p.to,
    subject,
    html: wrap({ title, intro: intro.replace(/\n/g, "<br>"), ctaLabel, ctaUrl: p.siteUrl, locale }),
  }, log);
}

// ---- Vendor invitation (admin → prestataire existant) ----
export interface NotifyVendorInvitationPayload {
  to: string;
  locale?: string | null;
  vendorName: string;
}

export async function notifyVendorInvitation(p: NotifyVendorInvitationPayload, log = logger): Promise<void> {
  const locale = normalizeLocale(p.locale);
  const subject = { fr: "Votre espace prestataire vous attend sur Mariage Afro", nl: "Uw leveranciersruimte wacht op u op Mariage Afro", en: "Your vendor space is ready on Mariage Afro" }[locale];
  const title = { fr: "Rejoignez votre espace pro", nl: "Ga naar uw pro-ruimte", en: "Join your pro space" }[locale];
  const intro = {
    fr: `Bonjour,\n\nL'équipe Mariage Afro a créé une fiche prestataire pour **${p.vendorName}**. Créez votre compte avec cette adresse email pour accéder directement à votre espace professionnel et gérer vos informations.`,
    nl: `Hallo,\n\nHet team van Mariage Afro heeft een leveranciersfiche aangemaakt voor **${p.vendorName}**. Maak een account aan met dit e-mailadres om rechtstreeks toegang te krijgen tot uw professionele ruimte en uw gegevens te beheren.`,
    en: `Hello,\n\nThe Mariage Afro team has created a vendor profile for **${p.vendorName}**. Create your account with this email address to access your professional space and manage your information directly.`,
  }[locale];
  const ctaLabel = { fr: "Créer mon espace pro", nl: "Mijn pro-ruimte aanmaken", en: "Create my pro space" }[locale];
  await sendOne({
    to: p.to,
    subject,
    html: wrap({
      title,
      intro: intro.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
      ctaLabel,
      ctaUrl: `${appUrl()}/espace-pro/register`,
      locale,
    }),
  }, log);
}
