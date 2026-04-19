import { Resend } from "resend";
import { logger } from "./logger";

const FROM = "Mariage Afro <noreply@mariage-afro.com>";
const ADMIN_TO = process.env.ADMIN_NOTIFY_EMAIL || "info@mariage-afro.com";

export function escapeHtml(str: string | null | undefined): string {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function row(label: string, value: string | number | null | undefined): string {
  if (value == null || value === "") return "";
  return `<tr><td style="padding:8px 16px;border-bottom:1px solid #eee;font-weight:600;color:#68191e;width:180px;">${escapeHtml(label)}</td><td style="padding:8px 16px;border-bottom:1px solid #eee;">${escapeHtml(String(value))}</td></tr>`;
}

function wrap(title: string, bodyRows: string, intro?: string): string {
  return `<!doctype html><html><body style="font-family:Helvetica,Arial,sans-serif;background:#fff4e4;padding:24px;margin:0;">
<div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e8d9bf;">
  <div style="background:#68191e;color:#fff4e4;padding:24px 32px;">
    <div style="font-size:11px;letter-spacing:0.3em;text-transform:uppercase;opacity:0.85;">Mariage Afro</div>
    <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;">${escapeHtml(title)}</h1>
  </div>
  <div style="padding:24px 32px;color:#141414;">
    ${intro ? `<p style="margin:0 0 16px;line-height:1.6;">${escapeHtml(intro)}</p>` : ""}
    <table style="width:100%;border-collapse:collapse;border-top:1px solid #eee;">${bodyRows}</table>
  </div>
  <div style="padding:16px 32px;background:#fff4e4;color:#666;font-size:12px;text-align:center;">
    Mariage Afro — Plateforme premium pour mariages afro et mixtes en Belgique
  </div>
</div></body></html>`;
}

interface SendArgs {
  to: string;
  subject: string;
  html: string;
}

async function sendOne({ to, subject, html }: SendArgs, log = logger): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    log.warn({ to, subject }, "RESEND_API_KEY is not configured — email skipped");
    return;
  }
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({ from: FROM, to, subject, html });
  if (error) {
    log.error({ error, to, subject }, "Failed to send email via Resend");
    throw new Error("Failed to send email");
  }
}

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
}

export async function sendLeadEmails(payload: LeadEmailPayload, log = logger): Promise<void> {
  const services = (payload.services ?? []).join(", ");
  const isService = payload.category === "service-request";
  const adminTitle = isService ? "Nouvelle demande de services" : "Nouveau lead reçu";
  const rows =
    row("Nom", payload.name) +
    row("Email", payload.email) +
    row("Téléphone", payload.phone) +
    row("Date du mariage", payload.weddingDate) +
    row("Nombre d'invités", payload.guestCount ?? undefined) +
    row("Budget estimé", payload.budget) +
    row("Type de mariage", payload.weddingType) +
    row("Services souhaités", services) +
    row("Message", payload.message);

  await sendOne({
    to: ADMIN_TO,
    subject: `[Mariage Afro] ${adminTitle} — ${payload.name}`,
    html: wrap(adminTitle, rows, `Une nouvelle demande vient d'arriver via le formulaire ${isService ? "services" : "contact"}.`),
  }, log);

  await sendOne({
    to: payload.email,
    subject: "Votre demande a bien été reçue — Mariage Afro",
    html: wrap("Merci pour votre message", rows, `Bonjour ${payload.name}, nous avons bien reçu votre demande et reviendrons vers vous dans les plus brefs délais.`),
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
}

export async function sendVendorRequestEmails(p: VendorRequestEmailPayload, log = logger): Promise<void> {
  const labels: Record<string, string> = {
    quote: "Demande de devis",
    availability: "Demande de disponibilité",
    booking: "Demande de réservation",
    zoom: "Demande de Zoom call",
    rdv: "Demande de RDV",
  };
  const reqLabel = labels[p.requestType] ?? p.requestType;
  const rows =
    row("Prestataire", p.vendorName) +
    row("Type de demande", reqLabel) +
    row("Nom", p.name) +
    row("Email", p.email) +
    row("Téléphone", p.phone) +
    row("Date du mariage", p.weddingDate) +
    row("Message", p.message);

  await sendOne({
    to: ADMIN_TO,
    subject: `[Mariage Afro] ${reqLabel} pour ${p.vendorName} — ${p.name}`,
    html: wrap(`${reqLabel} pour ${p.vendorName}`, rows),
  }, log);

  await sendOne({
    to: p.email,
    subject: `Votre ${reqLabel.toLowerCase()} a bien été reçue — Mariage Afro`,
    html: wrap("Merci pour votre demande", rows, `Bonjour ${p.name}, nous avons bien reçu votre demande concernant ${p.vendorName}. Notre équipe vous répondra rapidement.`),
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
}

export async function sendVenueRequestEmails(p: VenueRequestEmailPayload, log = logger): Promise<void> {
  const labels: Record<string, string> = { visit: "Demande de visite", quote: "Demande de devis" };
  const reqLabel = labels[p.requestType] ?? p.requestType;
  const rows =
    row("Lieu", p.venueName) +
    row("Type de demande", reqLabel) +
    row("Nom", p.name) +
    row("Email", p.email) +
    row("Téléphone", p.phone) +
    row("Date du mariage", p.weddingDate) +
    row("Nombre d'invités", p.guestCount ?? undefined) +
    row("Message", p.message);

  await sendOne({
    to: ADMIN_TO,
    subject: `[Mariage Afro] ${reqLabel} pour ${p.venueName} — ${p.name}`,
    html: wrap(`${reqLabel} pour ${p.venueName}`, rows),
  }, log);

  await sendOne({
    to: p.email,
    subject: `Votre ${reqLabel.toLowerCase()} a bien été reçue — Mariage Afro`,
    html: wrap("Merci pour votre demande", rows, `Bonjour ${p.name}, nous avons bien reçu votre demande concernant ${p.venueName}.`),
  }, log);
}

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
    html: wrap("Nouvelle candidature partenaire", rows),
  }, log);

  await sendOne({
    to: p.email,
    subject: "Votre candidature partenaire a bien été reçue — Mariage Afro",
    html: wrap("Merci pour votre candidature", rows, `Bonjour ${p.contactName}, merci de votre intérêt pour rejoindre le réseau Mariage Afro. Nous étudions votre dossier et reviendrons vers vous prochainement.`),
  }, log);
}
