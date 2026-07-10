import { Router } from "express";
import { eq, sql, desc, and, inArray, isNull, ne, isNotNull, gte } from "drizzle-orm";
import {
  db,
  leadsTable,
  vendorRequestsTable,
  venueRequestsTable,
  partnerApplicationsTable,
  vendorReviewsTable,
  marketplaceVendorsTable,
  couplesTable,
  vendorSubscriptionsTable,
  vendorAccountsTable,
  weddingWebsitesTable,
  conversationsTable,
  vendorLeadsTable,
} from "@workspace/db";
import { adminAuth, ADMIN_COOKIE, isAuthed } from "../middlewares/adminAuth";
import { generateCsrfToken, requireCsrf, CSRF_FIELD } from "../middlewares/adminCsrf";
import {
  notifyVendorSubscriptionActivated,
  notifyVendorApproved,
  notifyVendorRejected,
  notifyCoupleApproved,
  notifyCoupleRejected,
} from "../lib/email";
import { adminLayout as layout } from "../lib/adminLayout";

const router = Router();
// CSRF validation on all admin POST routes (JSON and upload-photo endpoints are excluded inside requireCsrf)
router.use(requireCsrf);

const STATUSES = ["new", "in_progress", "done"] as const;
type Status = (typeof STATUSES)[number];
const STATUS_LABEL: Record<Status, string> = {
  new: "Nouveau",
  in_progress: "En cours",
  done: "Traité",
};

const TYPES = [
  "lead",
  "lead_budget",
  "lead_quiz",
  "lead_magnet",
  "lead_multi_devis",
  "vendor",
  "venue",
  "partner",
] as const;
type LeadType = (typeof TYPES)[number];

const TYPE_LABEL: Record<LeadType, string> = {
  lead: "Lead général",
  lead_budget: "Calculateur budget",
  lead_quiz: "Quiz style",
  lead_magnet: "Lead magnet (PDF)",
  lead_multi_devis: "Multi-devis",
  vendor: "Prestataire",
  venue: "Lieu",
  partner: "Partenaire",
};

// Map a "type" filter value to the underlying lead category column when applicable.
const LEAD_CATEGORY_FOR_TYPE: Partial<Record<LeadType, string>> = {
  lead_budget: "budget_calc",
  lead_quiz: "quiz_result",
  lead_magnet: "lead_magnet",
  lead_multi_devis: "multi_devis",
};

function tableFor(type: LeadType) {
  switch (type) {
    case "vendor": return vendorRequestsTable;
    case "venue": return venueRequestsTable;
    case "partner": return partnerApplicationsTable;
    default: return leadsTable; // lead, lead_budget, lead_quiz, lead_magnet, lead_multi_devis
  }
}

function csrfInput(token: string): string {
  return `<input type="hidden" name="${CSRF_FIELD}" value="${escapeHtml(token)}">`;
}

function escapeHtml(str: unknown): string {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const COOKIE_OPTS = {
  httpOnly: true,
  signed: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

async function getPendingCount(): Promise<number> {
  const [[cp], [va]] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` })
      .from(couplesTable)
      .where(and(isNull(couplesTable.validatedAt), ne(couplesTable.status, "rejected"))),
    db.select({ count: sql<number>`count(*)::int` })
      .from(vendorAccountsTable)
      .where(and(eq(vendorAccountsTable.status, "pending"), isNotNull(vendorAccountsTable.onboardedAt))),
  ]);
  return (cp?.count ?? 0) + (va?.count ?? 0);
}

// ---------- Reviews moderation ----------
const REVIEW_STATUSES = ["pending", "published", "rejected"] as const;
type ReviewStatus = (typeof REVIEW_STATUSES)[number];
const REVIEW_STATUS_LABEL: Record<ReviewStatus, string> = {
  pending: "En attente",
  published: "Publié",
  rejected: "Rejeté",
};

router.get("/reviews", adminAuth, async (req, res) => {
  const filterStatus = REVIEW_STATUSES.includes(req.query.status as ReviewStatus)
    ? (req.query.status as ReviewStatus)
    : "pending";

  const conds = [eq(vendorReviewsTable.status, filterStatus)];
  const rows = await db
    .select({
      id: vendorReviewsTable.id,
      vendorId: vendorReviewsTable.vendorId,
      coupleId: vendorReviewsTable.coupleId,
      rating: vendorReviewsTable.rating,
      title: vendorReviewsTable.title,
      comment: vendorReviewsTable.comment,
      status: vendorReviewsTable.status,
      createdAt: vendorReviewsTable.createdAt,
      vendorName: marketplaceVendorsTable.name,
      coupleEmail: couplesTable.email,
      partner1Name: couplesTable.partner1Name,
      partner2Name: couplesTable.partner2Name,
    })
    .from(vendorReviewsTable)
    .leftJoin(marketplaceVendorsTable, eq(vendorReviewsTable.vendorId, marketplaceVendorsTable.id))
    .leftJoin(couplesTable, eq(vendorReviewsTable.coupleId, couplesTable.id))
    .where(and(...conds))
    .orderBy(desc(vendorReviewsTable.createdAt));

  const counts = await db
    .select({ status: vendorReviewsTable.status, count: sql<number>`count(*)::int` })
    .from(vendorReviewsTable)
    .groupBy(vendorReviewsTable.status);
  const countByStatus: Record<ReviewStatus, number> = { pending: 0, published: 0, rejected: 0 };
  for (const c of counts) {
    if ((REVIEW_STATUSES as readonly string[]).includes(c.status)) {
      countByStatus[c.status as ReviewStatus] = c.count;
    }
  }

  const tabs = REVIEW_STATUSES.map((s) => `
    <a href="/admin/reviews?status=${s}" class="badge status-${s === "published" ? "done" : s === "rejected" ? "new" : "in_progress"}" style="${s === filterStatus ? "outline:2px solid #68191e;" : ""}">
      ${REVIEW_STATUS_LABEL[s]} (${countByStatus[s]})
    </a>
  `).join("");

  const stars = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

  const pendingBadge = await getPendingCount();
  const csrfToken = generateCsrfToken(req, res);

  const tableBody = rows.length === 0
    ? `<tr><td colspan="6" class="empty">Aucun avis ${REVIEW_STATUS_LABEL[filterStatus].toLowerCase()}.</td></tr>`
    : rows.map((r) => `
        <tr>
          <td>${escapeHtml(new Date(r.createdAt as Date).toISOString().slice(0, 10))}</td>
          <td><strong>${escapeHtml(r.vendorName ?? `Vendor #${r.vendorId}`)}</strong></td>
          <td>
            <div style="font-weight:600;">${escapeHtml([r.partner1Name, r.partner2Name].filter(Boolean).join(" & ") || "Couple anonyme")}</div>
            <div style="color:#888;font-size:11px;">${escapeHtml(r.coupleEmail ?? "")}</div>
          </td>
          <td style="color:#c9a96e;font-size:18px;letter-spacing:2px;">${stars(r.rating)}</td>
          <td>
            ${r.title ? `<div style="font-weight:600;margin-bottom:4px;">${escapeHtml(r.title)}</div>` : ""}
            <div style="white-space:pre-wrap;max-width:400px;">${escapeHtml(r.comment)}</div>
          </td>
          <td style="white-space:nowrap;">
            ${r.status !== "published" ? `<form method="POST" action="/admin/reviews/${r.id}/status" style="display:inline;margin:0 4px 4px 0;">${csrfInput(csrfToken)}<input type="hidden" name="status" value="published"/><button class="btn primary" type="submit">Publier</button></form>` : ""}
            ${r.status !== "rejected" ? `<form method="POST" action="/admin/reviews/${r.id}/status" style="display:inline;margin:0 4px 4px 0;">${csrfInput(csrfToken)}<input type="hidden" name="status" value="rejected"/><button class="btn" type="submit">Rejeter</button></form>` : ""}
            ${r.status !== "pending" ? `<form method="POST" action="/admin/reviews/${r.id}/status" style="display:inline;margin:0 4px 4px 0;">${csrfInput(csrfToken)}<input type="hidden" name="status" value="pending"/><button class="btn" type="submit">Re-modérer</button></form>` : ""}
          </td>
        </tr>`).join("");

  res.type("html").send(layout("Avis", `
    <div class="container">
      <h2 style="margin-bottom:16px;font-size:22px;color:#68191e;">Modération des avis couples</h2>
      <div class="filters" style="display:flex;gap:12px;align-items:center;">
        <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:#666;">Statut :</span>
        ${tabs}
      </div>
      <table>
        <thead><tr><th>Date</th><th>Prestataire</th><th>Couple</th><th>Note</th><th>Avis</th><th>Actions</th></tr></thead>
        <tbody>${tableBody}</tbody>
      </table>
    </div>
  `, true, pendingBadge, csrfToken, "reviews"));
});

router.post("/reviews/:id/status", adminAuth, async (req, res) => {
  const id = Number(req.params.id);
  const status = String(req.body?.status ?? "");
  if (!Number.isFinite(id)) { res.status(400).send("Invalid id"); return; }
  if (!REVIEW_STATUSES.includes(status as ReviewStatus)) { res.status(400).send("Invalid status"); return; }
  await db.update(vendorReviewsTable)
    .set({ status, updatedAt: new Date() })
    .where(eq(vendorReviewsTable.id, id));
  res.redirect(`/admin/reviews?status=${status}`);
});

router.get("/login", (req, res) => {
  if (!process.env.ADMIN_PASSWORD) {
    res.status(503).type("html").send(layout("Configuration", `<div class="login-page"><div class="login-card"><h1>Admin non configuré</h1><p>La variable <code>ADMIN_PASSWORD</code> doit être définie côté serveur.</p></div></div>`, false));
    return;
  }
  if (isAuthed(req)) {
    res.redirect("/admin");
    return;
  }
  const csrfToken = generateCsrfToken(req, res);
  const err = req.query.err === "1" ? `<div class="err">Mot de passe incorrect.</div>` : "";
  res.type("html").send(layout("Connexion", `
    <div class="login-page"><div class="login-card">
      <h1>Connexion Admin</h1>
      ${err}
      <form method="POST" action="/admin/login">
        <input type="password" name="password" placeholder="Mot de passe" autocomplete="current-password" required autofocus />
        <input type="hidden" name="${CSRF_FIELD}" value="${escapeHtml(csrfToken)}">
        <button type="submit" class="btn primary">Se connecter</button>
      </form>
    </div></div>
  `, false, 0, csrfToken));
});

router.post("/login", (req, res) => {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    res.redirect("/admin/login");
    return;
  }
  const provided = String(req.body?.password ?? "");
  if (provided === expected) {
    res.cookie(ADMIN_COOKIE, "ok", COOKIE_OPTS);
    res.redirect("/admin");
    return;
  }
  res.redirect("/admin/login?err=1");
});

router.post("/logout", (_req, res) => {
  res.clearCookie(ADMIN_COOKIE, { path: "/" });
  res.redirect("/admin/login");
});

type FeedRow = {
  type: LeadType;
  id: number;
  name: string;
  email: string;
  phone: string | null;
  weddingDate: string | null;
  services: string | null;
  subject: string;
  status: Status;
  createdAt: Date;
};

async function loadFeed(opts: {
  filterType?: LeadType;
  filterStatus?: Status;
  page: number;
  perPage: number;
}): Promise<{ rows: FeedRow[]; total: number; totals: Record<LeadType, number> }> {
  const { filterType, filterStatus, page, perPage } = opts;
  const offset = (page - 1) * perPage;

  // Unified feed across the 4 lead tables, paginated and ordered at the DB level.
  // Each subquery exposes the same column shape so UNION ALL works.
  // For leads, the "type" reflects the conversion-tool category so admins can filter precisely.
  const unionSql = sql`
    SELECT
      CASE category
        WHEN 'budget_calc' THEN 'lead_budget'
        WHEN 'quiz_result' THEN 'lead_quiz'
        WHEN 'lead_magnet' THEN 'lead_magnet'
        WHEN 'multi_devis' THEN 'lead_multi_devis'
        ELSE 'lead'
      END AS type,
      id, name, email, phone, wedding_date,
      COALESCE(array_to_string(ARRAY(SELECT jsonb_array_elements_text(services)), ', '), '') AS services_text,
      CASE category
        WHEN 'service-request' THEN 'Demande services'
        WHEN 'budget_calc' THEN 'Calculateur budget'
        WHEN 'quiz_result' THEN 'Quiz style mariage'
        WHEN 'lead_magnet' THEN 'Téléchargement guide PDF'
        WHEN 'multi_devis' THEN COALESCE('Multi-devis · ' || (payload->>'vendorName'), 'Multi-devis')
        ELSE 'Lead général'
      END AS subject,
      status, created_at
      FROM leads
    UNION ALL
    SELECT 'vendor'::text, id, name, email, phone, wedding_date, '' AS services_text,
           vendor_name || ' · ' || request_type AS subject, status, created_at
      FROM vendor_requests
    UNION ALL
    SELECT 'venue'::text, id, name, email, phone, wedding_date, '' AS services_text,
           venue_name || ' · ' || request_type AS subject, status, created_at
      FROM venue_requests
    UNION ALL
    SELECT 'partner'::text, id, contact_name AS name, email, phone, NULL::text AS wedding_date, '' AS services_text,
           business_name || ' · ' || category AS subject, status, created_at
      FROM partner_applications
  `;

  const filters = sql`
    ${filterType ? sql`AND type = ${filterType}` : sql``}
    ${filterStatus ? sql`AND status = ${filterStatus}` : sql``}
  `;

  const rowsRes = await db.execute<{
    type: string;
    id: number;
    name: string;
    email: string;
    phone: string | null;
    wedding_date: string | null;
    services_text: string | null;
    subject: string;
    status: string;
    created_at: Date;
  }>(sql`
    SELECT * FROM (${unionSql}) feed
    WHERE 1=1 ${filters}
    ORDER BY created_at DESC
    LIMIT ${perPage} OFFSET ${offset}
  `);

  const countRes = await db.execute<{ count: string }>(sql`
    SELECT COUNT(*)::text AS count FROM (${unionSql}) feed
    WHERE 1=1 ${filters}
  `);

  const totalsRes = await db.execute<{ type: string; count: string }>(sql`
    SELECT type, COUNT(*)::text AS count FROM (${unionSql}) feed GROUP BY type
  `);

  const totals: Record<LeadType, number> = {
    lead: 0,
    lead_budget: 0,
    lead_quiz: 0,
    lead_magnet: 0,
    lead_multi_devis: 0,
    vendor: 0,
    venue: 0,
    partner: 0,
  };
  for (const r of totalsRes.rows) totals[r.type as LeadType] = Number(r.count);

  const rows: FeedRow[] = rowsRes.rows.map((r) => ({
    type: r.type as LeadType,
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    weddingDate: r.wedding_date,
    services: r.services_text,
    subject: r.subject,
    status: r.status as Status,
    createdAt: r.created_at instanceof Date ? r.created_at : new Date(r.created_at),
  }));

  return { rows, total: Number(countRes.rows[0]?.count ?? 0), totals };
}

router.get("/", adminAuth, async (req, res) => {
  const filterType = TYPES.includes(req.query.type as LeadType) ? (req.query.type as LeadType) : undefined;
  const filterStatus = STATUSES.includes(req.query.status as Status) ? (req.query.status as Status) : undefined;
  const page = Math.max(1, Number(req.query.page) || 1);
  const perPage = 25;

  const { rows: pageRows, total, totals } = await loadFeed({ filterType, filterStatus, page, perPage });
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [[couplesCount], [vendorsActiveCount], [pendingCouplesCount], [pendingVendorsCount], [devisEnvoyesCount], [devisThisMonthCount], [leadsThisMonthCount]] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(couplesTable).where(isNotNull(couplesTable.onboardedAt)),
    db.select({ count: sql<number>`count(*)::int` }).from(marketplaceVendorsTable).where(eq(marketplaceVendorsTable.active, true)),
    db.select({ count: sql<number>`count(*)::int` }).from(couplesTable).where(and(isNull(couplesTable.validatedAt), ne(couplesTable.status, "rejected"))),
    db.select({ count: sql<number>`count(*)::int` }).from(vendorAccountsTable).where(and(eq(vendorAccountsTable.status, "pending"), isNotNull(vendorAccountsTable.onboardedAt))),
    db.select({ count: sql<number>`count(*)::int` }).from(vendorLeadsTable),
    db.select({ count: sql<number>`count(*)::int` }).from(vendorLeadsTable).where(gte(vendorLeadsTable.createdAt, thirtyDaysAgo)),
    db.select({ count: sql<number>`count(*)::int` }).from(leadsTable).where(gte(leadsTable.createdAt, thirtyDaysAgo)),
  ]);

  const pendingTotal = (pendingCouplesCount?.count ?? 0) + (pendingVendorsCount?.count ?? 0);
  const devisTotal = devisEnvoyesCount?.count ?? 0;
  const devisMonth = devisThisMonthCount?.count ?? 0;
  const couplesTotal = couplesCount?.count ?? 0;
  const convRate = couplesTotal > 0 ? Math.round((devisTotal / couplesTotal) * 100) : 0;

  const platformStats = `
    <div style="margin-bottom:8px;font-size:11px;text-transform:uppercase;letter-spacing:0.2em;color:#888;font-weight:600;">Vue globale de la plateforme</div>
    <div class="stats" style="margin-bottom:8px;">
      <div class="stat"><div class="lbl">Couples inscrits</div><div class="val"><a href="/admin/couples" style="color:inherit;text-decoration:none;">${couplesTotal}</a></div></div>
      <div class="stat"><div class="lbl">Prestataires actifs</div><div class="val"><a href="/admin/content/vendors" style="color:inherit;text-decoration:none;">${vendorsActiveCount?.count ?? 0}</a></div></div>
      <div class="stat"><div class="lbl">Devis envoyés</div><div class="val"><a href="/admin/devis" style="color:inherit;text-decoration:none;">${devisTotal}</a></div></div>
      <div class="stat"><div class="lbl">Devis ce mois</div><div class="val">${devisMonth}</div></div>
      <div class="stat"><div class="lbl">Leads ce mois</div><div class="val">${leadsThisMonthCount?.count ?? 0}</div></div>
      <div class="stat"><div class="lbl">Taux contact/couple</div><div class="val">${convRate}%</div></div>
      <div class="stat" style="${pendingTotal > 0 ? "border-left:3px solid #c08800;" : ""}"><div class="lbl">En attente validation</div><div class="val" style="${pendingTotal > 0 ? "color:#c08800;" : ""}"><a href="/admin/accounts" style="color:inherit;text-decoration:none;">${pendingTotal}</a></div></div>
    </div>
    <div style="margin-bottom:8px;font-size:11px;text-transform:uppercase;letter-spacing:0.2em;color:#888;font-weight:600;margin-top:24px;">Demandes entrantes</div>`;

  const stats = `
    ${platformStats}
    <div class="stats">
      <div class="stat"><div class="lbl">Leads généraux</div><div class="val">${totals.lead}</div></div>
      <div class="stat"><div class="lbl">Calc. budget</div><div class="val">${totals.lead_budget}</div></div>
      <div class="stat"><div class="lbl">Quiz</div><div class="val">${totals.lead_quiz}</div></div>
      <div class="stat"><div class="lbl">Lead magnet</div><div class="val">${totals.lead_magnet}</div></div>
      <div class="stat"><div class="lbl">Multi-devis</div><div class="val">${totals.lead_multi_devis}</div></div>
      <div class="stat"><div class="lbl">Prestataires</div><div class="val">${totals.vendor}</div></div>
      <div class="stat"><div class="lbl">Lieux</div><div class="val">${totals.venue}</div></div>
      <div class="stat"><div class="lbl">Partenaires</div><div class="val">${totals.partner}</div></div>
    </div>`;

  const typeOpts = ["", ...TYPES].map(t => `<option value="${t}"${t === (filterType ?? "") ? " selected" : ""}>${t ? TYPE_LABEL[t as LeadType] : "Tous"}</option>`).join("");
  const statusOpts = ["", ...STATUSES].map(s => `<option value="${s}"${s === (filterStatus ?? "") ? " selected" : ""}>${s ? STATUS_LABEL[s as Status] : "Tous"}</option>`).join("");

  const filters = `
    <form method="GET" action="/admin" class="filters">
      <div><label>Type</label><select name="type" onchange="this.form.submit()">${typeOpts}</select></div>
      <div><label>Statut</label><select name="status" onchange="this.form.submit()">${statusOpts}</select></div>
      ${filterType || filterStatus ? `<a href="/admin" class="reset">Réinitialiser</a>` : ""}
    </form>`;

  const tableBody = pageRows.length === 0
    ? `<tr><td colspan="9" class="empty">Aucune demande.</td></tr>`
    : pageRows.map(r => `
        <tr>
          <td>${escapeHtml(r.createdAt.toISOString().slice(0, 10))}</td>
          <td><span class="badge type-${r.type}">${TYPE_LABEL[r.type]}</span></td>
          <td><a href="/admin/leads/${r.type}/${r.id}">${escapeHtml(r.name)}</a></td>
          <td>${escapeHtml(r.email)}</td>
          <td>${escapeHtml(r.phone ?? "")}</td>
          <td>${escapeHtml(r.weddingDate ?? "—")}</td>
          <td>${escapeHtml(r.services ?? "")}</td>
          <td>${escapeHtml(r.subject)}</td>
          <td><span class="badge status-${r.status}">${STATUS_LABEL[r.status as Status] ?? r.status}</span></td>
        </tr>`).join("");

  const pagination = totalPages > 1 ? `
    <div class="pagination">
      ${Array.from({ length: totalPages }).map((_, i) => {
        const p = i + 1;
        const qs = new URLSearchParams();
        if (filterType) qs.set("type", filterType);
        if (filterStatus) qs.set("status", filterStatus);
        qs.set("page", String(p));
        return p === page ? `<span class="current">${p}</span>` : `<a href="/admin?${qs}">${p}</a>`;
      }).join("")}
    </div>` : "";

  const csrfToken = generateCsrfToken(req, res);
  res.type("html").send(layout("Tableau de bord", `
    <div class="container">
      ${stats}
      ${filters}
      <table>
        <thead><tr><th>Date</th><th>Type</th><th>Nom</th><th>Email</th><th>Téléphone</th><th>Date mariage</th><th>Services</th><th>Sujet</th><th>Statut</th></tr></thead>
        <tbody>${tableBody}</tbody>
      </table>
      ${pagination}
    </div>
  `, true, pendingTotal, csrfToken, "leads"));
});

router.get("/leads/:type/:id", adminAuth, async (req, res) => {
  const type = req.params.type as LeadType;
  if (!TYPES.includes(type)) { res.status(404).send("Not found"); return; }
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) { res.status(404).send("Not found"); return; }

  const table = tableFor(type);
  const expectedCategory = LEAD_CATEGORY_FOR_TYPE[type];
  const [row] = await db.select().from(table as typeof leadsTable).where(eq(table.id, id)).limit(1);
  if (!row) { res.status(404).type("html").send(layout("Introuvable", `<div class="container"><p>Demande introuvable.</p></div>`)); return; }
  // Enforce category alignment for lead subtypes so URLs cannot mislabel rows.
  if (expectedCategory && (row as { category?: string }).category !== expectedCategory) {
    res.status(404).type("html").send(layout("Introuvable", `<div class="container"><p>Demande introuvable.</p></div>`));
    return;
  }

  const r = row as Record<string, unknown>;
  const fields: Array<[string, unknown]> = [];
  fields.push(["Date", new Date(r.createdAt as string | Date).toLocaleString("fr-BE")]);
  fields.push(["Type", TYPE_LABEL[type]]);
  // All lead subtypes share the same row shape — render common lead fields, then payload details.
  const isLeadSubtype = type === "lead" || type === "lead_budget" || type === "lead_quiz" || type === "lead_magnet" || type === "lead_multi_devis";
  if (isLeadSubtype) {
    fields.push(["Catégorie", r.category]);
    fields.push(["Nom", r.name]); fields.push(["Email", r.email]); fields.push(["Téléphone", r.phone]);
    fields.push(["Date du mariage", r.weddingDate]);
    fields.push(["Nombre d'invités", r.guestCount]);
    fields.push(["Budget", r.budget]);
    fields.push(["Type de mariage", r.weddingType]);
    fields.push(["Services souhaités", Array.isArray(r.services) ? (r.services as string[]).join(", ") : ""]);
    fields.push(["Message", r.message]);
    // Subtype-specific payload extracts.
    const payload = (r.payload ?? null) as Record<string, unknown> | null;
    if (payload && typeof payload === "object") {
      if (type === "lead_budget") {
        const result = (payload.result ?? {}) as { totalMin?: number; totalMax?: number; breakdown?: Array<{ label: string; min: number; max: number }> };
        const inputs = (payload.inputs ?? {}) as { region?: string; standing?: string; weddingMonth?: string };
        if (result.totalMin != null && result.totalMax != null) {
          fields.push(["Estimation", `${result.totalMin} € – ${result.totalMax} €`]);
        }
        if (inputs.region) fields.push(["Région", inputs.region]);
        if (inputs.standing) fields.push(["Standing", inputs.standing]);
        if (inputs.weddingMonth) fields.push(["Mois", inputs.weddingMonth]);
        if (Array.isArray(result.breakdown)) {
          const lines = result.breakdown.map((b) => `${b.label}: ${b.min} € – ${b.max} €`).join(" · ");
          if (lines) fields.push(["Ventilation", lines]);
        }
      } else if (type === "lead_quiz") {
        const profile = (payload.profile ?? {}) as { name?: string; description?: string };
        if (profile.name) fields.push(["Profil", profile.name]);
        if (profile.description) fields.push(["Description profil", profile.description]);
        const reco = (payload.recommendedVendors ?? []) as Array<{ name: string; category?: string }>;
        if (reco.length) fields.push(["Prestataires recommandés", reco.map((v) => `${v.name}${v.category ? ` (${v.category})` : ""}`).join(", ")]);
        const answers = (payload.answers ?? {}) as Record<string, string>;
        const answerLines = Object.entries(answers).map(([k, v]) => `${k}=${v}`).join(" · ");
        if (answerLines) fields.push(["Réponses", answerLines]);
      } else if (type === "lead_magnet") {
        if (payload.magnetTitle) fields.push(["Lead magnet", payload.magnetTitle]);
        if (payload.magnetId) fields.push(["Magnet ID", payload.magnetId]);
      } else if (type === "lead_multi_devis") {
        if (payload.vendorName) fields.push(["Prestataire", payload.vendorName]);
        const allNames = (payload.allVendorNames ?? []) as string[];
        if (allNames.length) fields.push(["Tous les prestataires de la demande", allNames.join(", ")]);
      }
    }
  } else if (type === "vendor") {
    fields.push(["Prestataire", r.vendorName]);
    fields.push(["Type de demande", r.requestType]);
    fields.push(["Nom", r.name]); fields.push(["Email", r.email]); fields.push(["Téléphone", r.phone]);
    fields.push(["Date du mariage", r.weddingDate]);
    fields.push(["Message", r.message]);
  } else if (type === "venue") {
    fields.push(["Lieu", r.venueName]);
    fields.push(["Type de demande", r.requestType]);
    fields.push(["Nom", r.name]); fields.push(["Email", r.email]); fields.push(["Téléphone", r.phone]);
    fields.push(["Date du mariage", r.weddingDate]);
    fields.push(["Nombre d'invités", r.guestCount]);
    fields.push(["Message", r.message]);
  } else if (type === "partner") {
    fields.push(["Entreprise", r.businessName]);
    fields.push(["Contact", r.contactName]);
    fields.push(["Email", r.email]); fields.push(["Téléphone", r.phone]);
    fields.push(["Catégorie", r.category]);
    fields.push(["Site web", r.website]);
    fields.push(["Présentation", r.description]);
  }

  const fieldsHtml = fields
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => `<div class="field"><div class="field-lbl">${escapeHtml(k)}</div><div class="field-val">${escapeHtml(v)}</div></div>`)
    .join("");

  const csrfToken = generateCsrfToken(req, res);

  const statusButtons = STATUSES.map(s => `
    <form method="POST" action="/admin/leads/${type}/${id}/status" style="display:inline;margin:0;">
      ${csrfInput(csrfToken)}
      <input type="hidden" name="status" value="${s}" />
      <button class="btn ${s === r.status ? "primary" : ""}" type="submit">${STATUS_LABEL[s]}</button>
    </form>`).join("");

  res.type("html").send(layout(`Demande #${id}`, `
    <div class="container">
      <p style="margin-bottom:16px;"><a href="/admin">← Retour</a></p>
      <div class="detail-card">
        <h2>Demande #${id} <span class="badge status-${r.status}" style="vertical-align:middle;margin-left:8px;">${STATUS_LABEL[r.status as Status] ?? r.status}</span></h2>
        ${fieldsHtml}
        <div class="actions">${statusButtons}</div>
      </div>
      <div class="detail-card">
        <h2 style="font-size:16px;">Note interne</h2>
        <form method="POST" action="/admin/leads/${type}/${id}/note">
          ${csrfInput(csrfToken)}
          <textarea name="internalNote" placeholder="Note privée…">${escapeHtml(r.internalNote)}</textarea>
          <div class="actions"><button type="submit" class="btn primary">Enregistrer la note</button></div>
        </form>
      </div>
    </div>
  `, true, 0, csrfToken, "leads"));
});

router.post("/leads/:type/:id/status", adminAuth, async (req, res) => {
  const type = req.params.type as LeadType;
  if (!TYPES.includes(type)) { res.status(404).send("Not found"); return; }
  const id = Number(req.params.id);
  const status = String(req.body?.status ?? "");
  if (!STATUSES.includes(status as Status)) { res.status(400).send("Invalid status"); return; }
  const table = tableFor(type);
  const expectedCategory = LEAD_CATEGORY_FOR_TYPE[type];
  if (expectedCategory) {
    await db.update(leadsTable).set({ status })
      .where(and(eq(leadsTable.id, id), eq(leadsTable.category, expectedCategory)));
  } else {
    await db.update(table).set({ status }).where(eq(table.id, id));
  }
  res.redirect(`/admin/leads/${type}/${id}`);
});

router.post("/leads/:type/:id/note", adminAuth, async (req, res) => {
  const type = req.params.type as LeadType;
  if (!TYPES.includes(type)) { res.status(404).send("Not found"); return; }
  const id = Number(req.params.id);
  const internalNote = String(req.body?.internalNote ?? "");
  const table = tableFor(type);
  const expectedCategory = LEAD_CATEGORY_FOR_TYPE[type];
  if (expectedCategory) {
    await db.update(leadsTable).set({ internalNote })
      .where(and(eq(leadsTable.id, id), eq(leadsTable.category, expectedCategory)));
  } else {
    await db.update(table).set({ internalNote }).where(eq(table.id, id));
  }
  res.redirect(`/admin/leads/${type}/${id}`);
});

// ---------- LOT 8 — Subscription management (JSON API) ----------
router.get("/subscriptions", adminAuth, async (_req, res, next) => {
  // If browser asks for HTML, defer to the HTML handler below.
  if (_req.accepts(["json", "html"]) === "html") return next();
  const rows = await db
    .select({
      sub: vendorSubscriptionsTable,
      account: vendorAccountsTable,
    })
    .from(vendorSubscriptionsTable)
    .leftJoin(vendorAccountsTable, eq(vendorAccountsTable.id, vendorSubscriptionsTable.vendorAccountId))
    .orderBy(desc(vendorSubscriptionsTable.requestedAt));
  res.json(rows.map((r) => ({ ...r.sub, account: r.account })));
});

router.post("/subscriptions/:id/activate", adminAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const tier = String(req.body?.tier ?? "");
  if (!["basic", "premium", "featured"].includes(tier)) {
    res.status(400).json({ error: "Invalid tier" }); return;
  }
  let endsAt: Date | null = null;
  if (req.body?.endsAt) {
    const d = new Date(String(req.body.endsAt));
    if (isNaN(d.getTime())) { res.status(400).json({ error: "Invalid endsAt" }); return; }
    endsAt = d;
  }
  const [updated] = await db
    .update(vendorSubscriptionsTable)
    .set({
      tier,
      status: "active",
      startedAt: new Date(),
      endsAt,
      updatedAt: new Date(),
    })
    .where(eq(vendorSubscriptionsTable.id, id))
    .returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  const [account] = await db
    .select()
    .from(vendorAccountsTable)
    .where(eq(vendorAccountsTable.id, updated.vendorAccountId))
    .limit(1);
  if (account?.email) {
    void notifyVendorSubscriptionActivated({
      to: account.email,
      vendorName: account.businessName || account.contactName || "Prestataire",
      tier: updated.tier as "basic" | "premium" | "featured",
      status: "active",
      endsAt: updated.endsAt ? updated.endsAt.toISOString() : null,
      locale: account.locale,
    }).catch(() => undefined);
  }
  res.json(updated);
});

router.post("/subscriptions/:id/cancel", adminAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [updated] = await db
    .update(vendorSubscriptionsTable)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(vendorSubscriptionsTable.id, id))
    .returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  const [account] = await db
    .select()
    .from(vendorAccountsTable)
    .where(eq(vendorAccountsTable.id, updated.vendorAccountId))
    .limit(1);
  if (account?.email) {
    void notifyVendorSubscriptionActivated({
      to: account.email,
      vendorName: account.businessName || account.contactName || "Prestataire",
      tier: updated.tier as "basic" | "premium" | "featured",
      status: "cancelled",
      locale: account.locale,
    }).catch(() => undefined);
  }
  res.json(updated);
});

// ---------- Admin HTML pages — Subscriptions / vendor tier management ----------
const TIER_LABEL: Record<string, string> = {
  basic: "Basic",
  premium: "Premium",
  featured: "Featured",
};

router.get("/subscriptions", adminAuth, async (_req, res, next) => {
  // Distinguish JSON (XHR) from HTML by Accept header. JSON callers above stay JSON.
  if (_req.accepts(["html", "json"]) === "json") return next();
  const rows = await db
    .select({ sub: vendorSubscriptionsTable, account: vendorAccountsTable })
    .from(vendorSubscriptionsTable)
    .leftJoin(vendorAccountsTable, eq(vendorAccountsTable.id, vendorSubscriptionsTable.vendorAccountId))
    .orderBy(desc(vendorSubscriptionsTable.requestedAt));
  const tabRows = rows.length === 0
    ? `<tr><td colspan="6" class="empty">Aucun abonnement.</td></tr>`
    : rows.map((r) => `
        <tr>
          <td>${escapeHtml(new Date(r.sub.requestedAt as Date).toISOString().slice(0,10))}</td>
          <td><strong>${escapeHtml(r.account?.businessName ?? r.account?.contactName ?? `#${r.sub.vendorAccountId}`)}</strong><div style="color:#888;font-size:11px;">${escapeHtml(r.account?.email ?? "")}</div></td>
          <td>${escapeHtml(TIER_LABEL[r.sub.tier] ?? r.sub.tier)}</td>
          <td>${escapeHtml(r.sub.status)}</td>
          <td>${r.sub.endsAt ? escapeHtml(new Date(r.sub.endsAt as Date).toISOString().slice(0,10)) : "—"}</td>
          <td><a class="btn" href="/admin/vendors/${r.sub.vendorAccountId}/subscription">Gérer</a></td>
        </tr>`).join("");
  const csrfToken = generateCsrfToken(_req, res);
  res.type("html").send(layout("Abonnements", `
    <div class="container">
      <h2>Abonnements vendeurs</h2>
      <table><thead><tr><th>Demandé</th><th>Vendeur</th><th>Tier</th><th>Statut</th><th>Fin</th><th></th></tr></thead><tbody>${tabRows}</tbody></table>
    </div>
  `, true, 0, csrfToken, "subscriptions"));
});

router.get("/vendors/:accountId/subscription", adminAuth, async (req, res) => {
  const accountId = Number(req.params.accountId);
  if (!Number.isFinite(accountId)) { res.status(400).type("html").send(layout("Erreur", `<div class="container"><p>ID invalide.</p></div>`)); return; }
  const [account] = await db.select().from(vendorAccountsTable).where(eq(vendorAccountsTable.id, accountId)).limit(1);
  if (!account) { res.status(404).type("html").send(layout("Introuvable", `<div class="container"><p>Vendeur introuvable.</p></div>`)); return; }
  const subs = await db.select().from(vendorSubscriptionsTable).where(eq(vendorSubscriptionsTable.vendorAccountId, accountId)).orderBy(desc(vendorSubscriptionsTable.requestedAt));
  const current = subs[0];
  const history = subs.length === 0
    ? `<tr><td colspan="4" class="empty">Aucun historique.</td></tr>`
    : subs.map((s) => `<tr><td>${escapeHtml(new Date(s.requestedAt as Date).toISOString().slice(0,10))}</td><td>${escapeHtml(TIER_LABEL[s.tier] ?? s.tier)}</td><td>${escapeHtml(s.status)}</td><td>${s.endsAt ? escapeHtml(new Date(s.endsAt as Date).toISOString().slice(0,10)) : "—"}</td></tr>`).join("");
  const csrfToken = generateCsrfToken(req, res);
  res.type("html").send(layout(`Abonnement — ${account.businessName ?? account.contactName ?? "#"+accountId}`, `
    <div class="container">
      <p><a href="/admin/subscriptions">← Abonnements</a></p>
      <h2>${escapeHtml(account.businessName ?? account.contactName ?? `Vendeur #${accountId}`)}</h2>
      <p style="color:#666;">${escapeHtml(account.email ?? "")}</p>
      <h3>Activer / mettre à jour le tier</h3>
      <form method="POST" action="/admin/vendors/${accountId}/subscription/activate" style="display:flex;gap:8px;align-items:end;flex-wrap:wrap;">
        ${csrfInput(csrfToken)}
        <label>Tier
          <select name="tier" required>
            <option value="basic" ${current?.tier==="basic"?"selected":""}>Basic</option>
            <option value="premium" ${current?.tier==="premium"?"selected":""}>Premium</option>
            <option value="featured" ${current?.tier==="featured"?"selected":""}>Featured</option>
          </select>
        </label>
        <label>Fin (YYYY-MM-DD, optionnel)
          <input type="date" name="endsAt" value="${current?.endsAt ? new Date(current.endsAt as Date).toISOString().slice(0,10) : ""}"/>
        </label>
        <button class="btn primary" type="submit">Activer</button>
      </form>
      ${current ? `<form method="POST" action="/admin/subscriptions/${current.id}/cancel-html" style="margin-top:12px;">${csrfInput(csrfToken)}<button class="btn" type="submit">Annuler l'abonnement actuel</button></form>` : ""}
      <h3 style="margin-top:24px;">Historique</h3>
      <table><thead><tr><th>Demandé</th><th>Tier</th><th>Statut</th><th>Fin</th></tr></thead><tbody>${history}</tbody></table>
    </div>
  `, true, 0, csrfToken, "subscriptions"));
});

router.post("/vendors/:accountId/subscription/activate", adminAuth, async (req, res) => {
  const accountId = Number(req.params.accountId);
  if (!Number.isFinite(accountId)) { res.status(400).send("Invalid id"); return; }
  const tier = String(req.body?.tier ?? "");
  if (!["basic","premium","featured"].includes(tier)) { res.status(400).send("Invalid tier"); return; }
  let endsAt: Date | null = null;
  if (req.body?.endsAt) {
    const d = new Date(String(req.body.endsAt));
    if (!isNaN(d.getTime())) endsAt = d;
  }
  const subs = await db.select().from(vendorSubscriptionsTable).where(eq(vendorSubscriptionsTable.vendorAccountId, accountId)).orderBy(desc(vendorSubscriptionsTable.requestedAt)).limit(1);
  let updated;
  if (subs[0]) {
    [updated] = await db.update(vendorSubscriptionsTable).set({ tier, status: "active", startedAt: new Date(), endsAt, updatedAt: new Date() }).where(eq(vendorSubscriptionsTable.id, subs[0].id)).returning();
  } else {
    [updated] = await db.insert(vendorSubscriptionsTable).values({ vendorAccountId: accountId, tier, status: "active", startedAt: new Date(), endsAt }).returning();
  }
  const [account] = await db.select().from(vendorAccountsTable).where(eq(vendorAccountsTable.id, accountId)).limit(1);
  if (account?.email && updated) {
    void notifyVendorSubscriptionActivated({
      to: account.email,
      vendorName: account.businessName || account.contactName || "Prestataire",
      tier: updated.tier as "basic" | "premium" | "featured",
      status: "active",
      endsAt: updated.endsAt ? updated.endsAt.toISOString() : null,
      locale: account.locale,
    }).catch(() => undefined);
  }
  res.redirect(`/admin/vendors/${accountId}/subscription`);
});

router.post("/subscriptions/:id/cancel-html", adminAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) { res.status(400).send("Invalid id"); return; }
  const [updated] = await db.update(vendorSubscriptionsTable).set({ status: "cancelled", updatedAt: new Date() }).where(eq(vendorSubscriptionsTable.id, id)).returning();
  if (!updated) { res.status(404).send("Not found"); return; }
  const [account] = await db.select().from(vendorAccountsTable).where(eq(vendorAccountsTable.id, updated.vendorAccountId)).limit(1);
  if (account?.email) {
    void notifyVendorSubscriptionActivated({
      to: account.email,
      vendorName: account.businessName || account.contactName || "Prestataire",
      tier: updated.tier as "basic" | "premium" | "featured",
      status: "cancelled",
      locale: account.locale,
    }).catch(() => undefined);
  }
  res.redirect(`/admin/vendors/${updated.vendorAccountId}/subscription`);
});

// ---------- LOT 10 — Compte management (Couples & Vendors) ----------

router.get("/accounts", adminAuth, async (req, res) => {
  const couples = await db
    .select({
      id: couplesTable.id,
      partner1Name: couplesTable.partner1Name,
      partner2Name: couplesTable.partner2Name,
      email: couplesTable.email,
      weddingDate: couplesTable.weddingDate,
      locale: couplesTable.locale,
      status: couplesTable.status,
      createdAt: couplesTable.createdAt,
      validatedAt: couplesTable.validatedAt,
    })
    .from(couplesTable)
    .where(and(isNull(couplesTable.validatedAt), ne(couplesTable.status, "rejected")))
    .orderBy(desc(couplesTable.createdAt));

  const vendors = await db
    .select({
      id: vendorAccountsTable.id,
      businessName: vendorAccountsTable.businessName,
      contactName: vendorAccountsTable.contactName,
      email: vendorAccountsTable.email,
      category: vendorAccountsTable.category,
      city: vendorAccountsTable.city,
      locale: vendorAccountsTable.locale,
      status: vendorAccountsTable.status,
      onboardedAt: vendorAccountsTable.onboardedAt,
      validatedAt: vendorAccountsTable.validatedAt,
      vendorId: vendorAccountsTable.vendorId,
    })
    .from(vendorAccountsTable)
    .where(and(isNull(vendorAccountsTable.validatedAt), ne(vendorAccountsTable.status, "rejected"), sql`${vendorAccountsTable.onboardedAt} IS NOT NULL`))
    .orderBy(desc(vendorAccountsTable.onboardedAt));

  const pendingBadge = couples.length + vendors.length;
  const csrfToken = generateCsrfToken(req, res);

  const coupleRows = couples.length === 0
    ? `<tr><td colspan="7" class="empty">Aucun couple en attente.</td></tr>`
    : couples.map((c) => `
      <tr>
        <td>${escapeHtml(new Date(c.createdAt as Date).toISOString().slice(0, 10))}</td>
        <td><strong>${escapeHtml([c.partner1Name, c.partner2Name].filter(Boolean).join(" & ") || "—")}</strong></td>
        <td>${escapeHtml(c.email)}</td>
        <td>${escapeHtml(c.weddingDate ?? "—")}</td>
        <td>${escapeHtml(c.locale)}</td>
        <td><span class="badge status-${c.status === "planning" ? "in_progress" : "new"}">${escapeHtml(c.status)}</span></td>
        <td style="white-space:nowrap;">
          <form method="POST" action="/admin/accounts/couples/${c.id}/approve" style="display:inline;margin:0 4px 4px 0;">
            ${csrfInput(csrfToken)}
            <button class="btn primary" type="submit">Approuver</button>
          </form>
          <form method="POST" action="/admin/accounts/couples/${c.id}/reject" style="display:inline;margin:0 4px 4px 0;" onsubmit="return confirmReject()">
            ${csrfInput(csrfToken)}
            <input type="hidden" name="reason" value="" />
            <button class="btn" type="submit">Rejeter</button>
          </form>
        </td>
      </tr>`).join("");

  const vendorRows = vendors.length === 0
    ? `<tr><td colspan="7" class="empty">Aucun prestataire en attente.</td></tr>`
    : vendors.map((v) => `
      <tr>
        <td>${v.onboardedAt ? escapeHtml(new Date(v.onboardedAt as Date).toISOString().slice(0, 10)) : "—"}</td>
        <td><strong>${escapeHtml(v.businessName || "—")}</strong><div style="color:#888;font-size:11px;">${escapeHtml(v.contactName)}</div></td>
        <td>${escapeHtml(v.email)}</td>
        <td>${escapeHtml(v.category)}</td>
        <td>${escapeHtml(v.city)}</td>
        <td><span class="badge status-in_progress">${escapeHtml(v.status)}</span></td>
        <td style="white-space:nowrap;">
          <form method="POST" action="/admin/accounts/vendors/${v.id}/approve" style="display:inline;margin:0 4px 4px 0;">
            ${csrfInput(csrfToken)}
            <button class="btn primary" type="submit">Approuver</button>
          </form>
          <form method="POST" action="/admin/accounts/vendors/${v.id}/reject" style="display:inline;margin:0 4px 4px 0;">
            ${csrfInput(csrfToken)}
            <button class="btn" type="submit">Rejeter</button>
          </form>
        </td>
      </tr>`).join("");
  res.type("html").send(layout("Comptes en attente", `
    <div class="container">
      <h2 style="margin-bottom:24px;font-size:22px;color:#68191e;">Validation des comptes</h2>

      <h3 style="margin-bottom:12px;font-size:16px;color:#68191e;">Couples (${couples.length} en attente)</h3>
      <table style="margin-bottom:32px;">
        <thead><tr><th>Inscrit le</th><th>Couple</th><th>Email</th><th>Date mariage</th><th>Langue</th><th>Statut</th><th>Actions</th></tr></thead>
        <tbody>${coupleRows}</tbody>
      </table>

      <h3 style="margin-bottom:12px;font-size:16px;color:#68191e;">Prestataires (${vendors.length} en attente)</h3>
      <table>
        <thead><tr><th>Inscrit le</th><th>Entreprise</th><th>Email</th><th>Catégorie</th><th>Ville</th><th>Statut</th><th>Actions</th></tr></thead>
        <tbody>${vendorRows}</tbody>
      </table>
    </div>
    <script>function confirmReject(){return confirm("Confirmer le rejet de ce compte ?");}</script>
  `, true, pendingBadge, csrfToken, "accounts"));
});

router.post("/accounts/couples/:id/approve", adminAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) { res.status(400).send("Invalid id"); return; }
  const [couple] = await db
    .update(couplesTable)
    .set({ validatedAt: new Date(), validatedBy: process.env.ADMIN_EMAIL || "admin" })
    .where(eq(couplesTable.id, id))
    .returning();
  if (!couple) { res.status(404).send("Couple not found"); return; }
  if (couple.email) {
    void notifyCoupleApproved({
      to: couple.email,
      locale: couple.locale,
      partner1Name: couple.partner1Name,
      partner2Name: couple.partner2Name,
    }).catch(() => undefined);
  }
  res.redirect("/admin/accounts");
});

router.post("/accounts/couples/:id/reject", adminAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) { res.status(400).send("Invalid id"); return; }
  const reason = String(req.body?.reason ?? "").trim() || null;
  const [couple] = await db
    .update(couplesTable)
    .set({ status: "rejected" })
    .where(eq(couplesTable.id, id))
    .returning();
  if (!couple) { res.status(404).send("Couple not found"); return; }
  if (couple.email) {
    void notifyCoupleRejected({
      to: couple.email,
      locale: couple.locale,
      partner1Name: couple.partner1Name,
      partner2Name: couple.partner2Name,
      reason,
    }).catch(() => undefined);
  }
  res.redirect("/admin/accounts");
});

router.post("/accounts/vendors/:id/approve", adminAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) { res.status(400).send("Invalid id"); return; }
  const [account] = await db
    .update(vendorAccountsTable)
    .set({ validatedAt: new Date(), validatedBy: process.env.ADMIN_EMAIL || "admin", status: "approved" })
    .where(eq(vendorAccountsTable.id, id))
    .returning();
  if (!account) { res.status(404).send("Vendor account not found"); return; }
  if (account.vendorId) {
    await db
      .update(marketplaceVendorsTable)
      .set({ active: true })
      .where(eq(marketplaceVendorsTable.id, account.vendorId));
  }
  if (account.email) {
    void notifyVendorApproved({
      to: account.email,
      locale: account.locale,
      businessName: account.businessName || account.contactName || "Prestataire",
    }).catch(() => undefined);
  }
  res.redirect("/admin/accounts");
});

router.post("/accounts/vendors/:id/reject", adminAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) { res.status(400).send("Invalid id"); return; }
  const reason = String(req.body?.reason ?? "").trim() || null;
  const [account] = await db
    .update(vendorAccountsTable)
    .set({ status: "rejected" })
    .where(eq(vendorAccountsTable.id, id))
    .returning();
  if (!account) { res.status(404).send("Vendor account not found"); return; }
  if (account.email) {
    void notifyVendorRejected({
      to: account.email,
      locale: account.locale,
      businessName: account.businessName || account.contactName || "Prestataire",
      reason,
    }).catch(() => undefined);
  }
  res.redirect("/admin/accounts");
});

// ============ COUPLES ============

router.get("/couples", adminAuth, async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const perPage = 30;
  const offset = (page - 1) * perPage;
  const filterStatus = typeof req.query.status === "string" ? req.query.status : "";

  const baseCond = (() => {
    if (filterStatus === "validated") return isNotNull(couplesTable.validatedAt);
    if (filterStatus === "pending") return and(isNull(couplesTable.validatedAt), ne(couplesTable.status, "rejected"));
    if (filterStatus === "rejected") return eq(couplesTable.status, "rejected");
    return undefined;
  })();

  const [totalRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(couplesTable)
    .where(baseCond);

  const rows = await db
    .select({
      id: couplesTable.id,
      partner1Name: couplesTable.partner1Name,
      partner2Name: couplesTable.partner2Name,
      email: couplesTable.email,
      weddingDate: couplesTable.weddingDate,
      status: couplesTable.status,
      createdAt: couplesTable.createdAt,
      onboardedAt: couplesTable.onboardedAt,
      validatedAt: couplesTable.validatedAt,
      budget: couplesTable.budget,
      guestEstimate: couplesTable.guestEstimate,
      websiteActive: weddingWebsitesTable.active,
      websiteSlug: weddingWebsitesTable.slug,
    })
    .from(couplesTable)
    .leftJoin(weddingWebsitesTable, eq(weddingWebsitesTable.coupleId, couplesTable.id))
    .where(baseCond)
    .orderBy(desc(couplesTable.createdAt))
    .limit(perPage)
    .offset(offset);

  const count = totalRow?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(count / perPage));

  const statusBadge = (r: typeof rows[0]) => {
    if (r.validatedAt) return `<span class="badge status-done">Validé</span>`;
    if (r.status === "rejected") return `<span class="badge" style="background:#fde;color:#c33;border:1px solid #c33;">Rejeté</span>`;
    if (r.onboardedAt) return `<span class="badge status-in_progress">En attente</span>`;
    return `<span class="badge status-new">Inscription</span>`;
  };

  const tableBody = rows.length === 0
    ? `<tr><td colspan="8" class="empty">Aucun couple trouvé.</td></tr>`
    : rows.map(r => `
      <tr>
        <td>${escapeHtml(r.createdAt.toISOString().slice(0, 10))}</td>
        <td><strong>${escapeHtml(r.partner1Name)} & ${escapeHtml(r.partner2Name)}</strong></td>
        <td>${escapeHtml(r.email)}</td>
        <td>${escapeHtml(r.weddingDate ?? "—")}</td>
        <td>${r.guestEstimate != null ? r.guestEstimate : "—"}</td>
        <td>${r.budget != null ? `${r.budget.toLocaleString("fr-BE")} €` : "—"}</td>
        <td>${statusBadge(r)}</td>
        <td>${r.websiteSlug
          ? `<a href="https://${req.hostname}/mariage/${escapeHtml(r.websiteSlug)}" target="_blank" style="color:#68191e;">
              ${r.websiteActive ? "🌐 Publié" : "Brouillon"}
            </a>`
          : `<span style="color:#bbb;">—</span>`
        }</td>
      </tr>`).join("");

  const pagination = totalPages > 1 ? `
    <div class="pagination">
      ${Array.from({ length: totalPages }).map((_, i) => {
        const p = i + 1;
        const qs = new URLSearchParams();
        if (filterStatus) qs.set("status", filterStatus);
        qs.set("page", String(p));
        return p === page ? `<span class="current">${p}</span>` : `<a href="/admin/couples?${qs}">${p}</a>`;
      }).join("")}
    </div>` : "";

  const filterOpts = [
    ["", "Tous les couples"],
    ["pending", "En attente validation"],
    ["validated", "Validés"],
    ["rejected", "Rejetés"],
  ].map(([val, lbl]) => `<option value="${val}"${filterStatus === val ? " selected" : ""}>${lbl}</option>`).join("");

  const pendingBadge = await getPendingCount();

  const csrfToken = generateCsrfToken(req, res);
  res.type("html").send(layout("Couples", `
    <div class="container">
      <h2 style="font-size:22px;font-weight:700;color:#68191e;margin-bottom:24px;">Couples (${count})</h2>
      <form method="GET" action="/admin/couples" class="filters" style="margin-bottom:16px;">
        <div><label>Statut</label><select name="status" onchange="this.form.submit()">${filterOpts}</select></div>
        ${filterStatus ? `<a href="/admin/couples" class="reset">Réinitialiser</a>` : ""}
      </form>
      <table>
        <thead><tr>
          <th>Inscription</th>
          <th>Couple</th>
          <th>Email</th>
          <th>Date mariage</th>
          <th>Invités</th>
          <th>Budget</th>
          <th>Statut</th>
          <th>Site web</th>
        </tr></thead>
        <tbody>${tableBody}</tbody>
      </table>
      ${pagination}
    </div>
  `, true, pendingBadge, csrfToken, "couples"));
});

// ============ DEVIS (vendor_leads agrégés) ============

/**
 * Split the message field into the couple's free-text message and the
 * structured category-specific fields that were appended by the API.
 * Format appended by leads.ts:
 *   \n\n--- Informations spécifiques ---\nkey: value\nkey2: value2
 */
function parseCategoryFields(message: string | null): {
  mainMessage: string | null;
  fields: Array<[string, string]>;
} {
  if (!message) return { mainMessage: null, fields: [] };
  const SEP = "--- Informations spécifiques ---";
  const idx = message.indexOf(SEP);
  if (idx === -1) return { mainMessage: message.trim() || null, fields: [] };
  const mainMessage = message.slice(0, idx).trim() || null;
  const fieldsPart = message.slice(idx + SEP.length).trim();
  const fields: Array<[string, string]> = fieldsPart
    .split("\n")
    .filter(Boolean)
    .flatMap((line) => {
      const colon = line.indexOf(": ");
      if (colon === -1) return [];
      return [[line.slice(0, colon).trim(), line.slice(colon + 2).trim()] as [string, string]];
    });
  return { mainMessage, fields };
}

/** Human-readable French labels for category field keys (all categories combined). */
const CATEGORY_FIELD_LABELS: Record<string, string> = {
  hours: "Nombre d'heures",
  photoStyle: "Style photographique",
  videoAlso: "Vidéo souhaitée ?",
  videoFormat: "Format vidéo",
  drone: "Drone souhaité ?",
  musicStyle: "Style musical",
  ceremony: "Sonorisation cérémonie ?",
  guestCount: "Nombre d'invités/couverts",
  decoStyle: "Style de décoration",
  colorPalette: "Palette de couleurs",
  serviceType: "Type de service",
  allergies: "Allergies / régimes",
  personsCount: "Nombre de personnes",
  trialNeeded: "Essai souhaité ?",
  hairType: "Type de cheveux",
  robeStyle: "Style de robe",
  budget: "Budget indicatif",
  vehicleType: "Type de véhicule",
  quantity: "Quantité estimée",
  printOrDigital: "Format",
};

const DEVIS_STATUS_LABEL: Record<string, string> = {
  new: "Envoyé",
  in_progress: "En discussion",
  done: "Traité",
  accepted: "Accepté",
  refused: "Refusé",
};
const DEVIS_STATUS_CSS: Record<string, string> = {
  new: "background:#fff4e4;color:#68191e;border:1px solid #68191e",
  in_progress: "background:#fff8e1;color:#c08800;border:1px solid #c08800",
  done: "background:#eef0ff;color:#3a3f8a;border:1px solid #3a3f8a",
  accepted: "background:#e8f5e9;color:#2e7d32;border:1px solid #2e7d32",
  refused: "background:#fde;color:#c33;border:1px solid #c33",
};

router.get("/devis", adminAuth, async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const perPage = 30;
  const offset = (page - 1) * perPage;
  const ALLOWED_STATUSES = ["new", "in_progress", "done", "accepted", "refused"];
  const rawStatus = typeof req.query.status === "string" ? req.query.status : "";
  const filterStatus = ALLOWED_STATUSES.includes(rawStatus) ? rawStatus : "";
  const filterVendorId = Number(req.query.vendor_id) || 0;

  const conds: ReturnType<typeof eq>[] = [];
  if (filterStatus) conds.push(eq(vendorLeadsTable.status, filterStatus) as ReturnType<typeof eq>);
  if (filterVendorId) conds.push(eq(vendorLeadsTable.vendorId, filterVendorId) as ReturnType<typeof eq>);
  const where = conds.length > 0 ? and(...conds) : undefined;

  const [totalRow, vendors, pendingBadge] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(vendorLeadsTable).where(where).then(r => r[0]),
    db.select({ id: marketplaceVendorsTable.id, name: marketplaceVendorsTable.name })
      .from(marketplaceVendorsTable)
      .where(eq(marketplaceVendorsTable.active, true))
      .orderBy(marketplaceVendorsTable.name),
    getPendingCount(),
  ]);

  const rows = await db
    .select({
      id: vendorLeadsTable.id,
      vendorId: vendorLeadsTable.vendorId,
      requestType: vendorLeadsTable.requestType,
      name: vendorLeadsTable.name,
      email: vendorLeadsTable.email,
      phone: vendorLeadsTable.phone,
      weddingDate: vendorLeadsTable.weddingDate,
      message: vendorLeadsTable.message,
      status: vendorLeadsTable.status,
      internalNote: vendorLeadsTable.internalNote,
      seenAt: vendorLeadsTable.seenAt,
      createdAt: vendorLeadsTable.createdAt,
      vendorName: marketplaceVendorsTable.name,
      vendorCategory: marketplaceVendorsTable.category,
    })
    .from(vendorLeadsTable)
    .leftJoin(marketplaceVendorsTable, eq(marketplaceVendorsTable.id, vendorLeadsTable.vendorId))
    .where(where)
    .orderBy(desc(vendorLeadsTable.createdAt))
    .limit(perPage)
    .offset(offset);

  const count = totalRow?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(count / perPage));

  const tableBody = rows.length === 0
    ? `<tr><td colspan="8" class="empty">Aucun devis pour l'instant.</td></tr>`
    : rows.map(r => {
        const statusLabel = DEVIS_STATUS_LABEL[r.status] ?? r.status;
        const statusCss = DEVIS_STATUS_CSS[r.status] ?? "";
        const { mainMessage, fields } = parseCategoryFields(r.message);
        const detailsCell = (() => {
          const fieldRows = fields.map(([k, v]) =>
            `<tr>
              <td style="padding:2px 10px 2px 0;color:#777;font-weight:500;white-space:nowrap;font-size:11px;">${escapeHtml(CATEGORY_FIELD_LABELS[k] ?? k)}</td>
              <td style="padding:2px 0;color:#222;font-size:11px;">${escapeHtml(v)}</td>
            </tr>`
          ).join("");
          const msgSnippet = mainMessage
            ? `<p style="font-size:11px;color:#555;margin-bottom:${fields.length > 0 ? "8px" : "0"};white-space:pre-wrap;max-width:260px;">${escapeHtml(mainMessage.length > 120 ? mainMessage.slice(0, 120) + "…" : mainMessage)}</p>`
            : "";
          if (fields.length === 0 && !mainMessage) return `<span style="color:#bbb;">—</span>`;
          if (fields.length === 0) return msgSnippet;
          return `
            ${msgSnippet}
            <details style="margin-top:${mainMessage ? "2px" : "0"}">
              <summary style="cursor:pointer;font-size:11px;color:#68191e;font-weight:600;list-style:none;display:inline-flex;align-items:center;gap:4px;">
                <span style="font-size:10px;">▸</span> ${fields.length} info${fields.length > 1 ? "s" : ""} spécifique${fields.length > 1 ? "s" : ""}
              </summary>
              <table style="margin-top:6px;border-collapse:collapse;">${fieldRows}</table>
            </details>`;
        })();
        return `
      <tr>
        <td>${escapeHtml(r.createdAt.toISOString().slice(0, 10))}</td>
        <td>
          <strong>${escapeHtml(r.name)}</strong><br>
          <span style="font-size:11px;color:#888;">${escapeHtml(r.email)}</span>
          ${r.phone ? `<br><span style="font-size:11px;color:#888;">${escapeHtml(r.phone)}</span>` : ""}
        </td>
        <td>
          ${escapeHtml(r.vendorName ?? "—")}
          ${r.vendorCategory ? `<br><span style="font-size:10px;color:#888;">${escapeHtml(r.vendorCategory)}</span>` : ""}
        </td>
        <td>${escapeHtml(r.requestType)}</td>
        <td>${escapeHtml(r.weddingDate ?? "—")}</td>
        <td style="max-width:300px;">${detailsCell}</td>
        <td><span style="display:inline-block;padding:2px 8px;font-size:10px;font-weight:700;${statusCss}">${statusLabel}</span></td>
        <td>${r.seenAt ? "✓" : `<span style="color:#c08800;">Non vu</span>`}</td>
      </tr>`;
      }).join("");

  const qs = (extra: Record<string, string>) => {
    const p = new URLSearchParams();
    if (filterStatus) p.set("status", filterStatus);
    if (filterVendorId) p.set("vendor_id", String(filterVendorId));
    Object.entries(extra).forEach(([k, v]) => p.set(k, v));
    return p.toString();
  };

  const pagination = totalPages > 1 ? `
    <div class="pagination">
      ${Array.from({ length: totalPages }).map((_, i) => {
        const p = i + 1;
        return p === page
          ? `<span class="current">${p}</span>`
          : `<a href="/admin/devis?${qs({ page: String(p) })}">${p}</a>`;
      }).join("")}
    </div>` : "";

  const statusOpts = [["", "Tous statuts"], ["new", "Envoyé"], ["in_progress", "En discussion"], ["done", "Traité"], ["accepted", "Accepté"], ["refused", "Refusé"]]
    .map(([val, lbl]) => `<option value="${val}"${filterStatus === val ? " selected" : ""}>${lbl}</option>`).join("");

  const vendorOpts = `<option value="">Tous les prestataires</option>` +
    vendors.map(v => `<option value="${v.id}"${filterVendorId === v.id ? " selected" : ""}>${escapeHtml(v.name)}</option>`).join("");

  const csrfToken = generateCsrfToken(req, res);
  res.type("html").send(layout("Devis prestataires", `
    <div class="container">
      <h2 style="font-size:22px;font-weight:700;color:#68191e;margin-bottom:8px;">Devis prestataires (${count})</h2>
      <p style="font-size:13px;color:#888;margin-bottom:16px;">
        Toutes les demandes de devis adressées aux prestataires via la marketplace (statuts : <strong>Envoyé</strong> = reçu, <strong>En discussion</strong> = pris en charge, <strong>Traité</strong> = clôturé).
        Les statuts <em>Accepté / Refusé</em> et le montant seront disponibles avec la plateforme de devis formelle (tâche ultérieure).
      </p>
      <form method="GET" action="/admin/devis" class="filters" style="margin-bottom:16px;">
        <div><label>Statut</label><select name="status" onchange="this.form.submit()">${statusOpts}</select></div>
        <div><label>Prestataire</label><select name="vendor_id" onchange="this.form.submit()">${vendorOpts}</select></div>
        ${filterStatus || filterVendorId ? `<a href="/admin/devis" class="reset">Réinitialiser</a>` : ""}
      </form>
      <table>
        <thead><tr>
          <th>Date envoi</th>
          <th>Contact (couple/client)</th>
          <th>Prestataire</th>
          <th>Type demande</th>
          <th>Date mariage</th>
          <th>Message &amp; Détails</th>
          <th>Statut</th>
          <th>Lu</th>
        </tr></thead>
        <tbody>${tableBody}</tbody>
      </table>
      ${pagination}
    </div>
  `, true, pendingBadge, csrfToken, "devis"));
});

export default router;
