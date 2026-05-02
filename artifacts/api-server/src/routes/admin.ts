import { Router } from "express";
import { eq, sql, desc, and, inArray } from "drizzle-orm";
import {
  db,
  leadsTable,
  vendorRequestsTable,
  venueRequestsTable,
  partnerApplicationsTable,
  vendorReviewsTable,
  marketplaceVendorsTable,
  couplesTable,
} from "@workspace/db";
import { adminAuth, ADMIN_COOKIE, isAuthed } from "../middlewares/adminAuth";

const router = Router();

const STATUSES = ["new", "in_progress", "done"] as const;
type Status = (typeof STATUSES)[number];
const STATUS_LABEL: Record<Status, string> = {
  new: "Nouveau",
  in_progress: "En cours",
  done: "Traité",
};

const TYPES = ["lead", "vendor", "venue", "partner"] as const;
type LeadType = (typeof TYPES)[number];

const TYPE_LABEL: Record<LeadType, string> = {
  lead: "Lead",
  vendor: "Prestataire",
  venue: "Lieu",
  partner: "Partenaire",
};

function tableFor(type: LeadType) {
  switch (type) {
    case "lead": return leadsTable;
    case "vendor": return vendorRequestsTable;
    case "venue": return venueRequestsTable;
    case "partner": return partnerApplicationsTable;
  }
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

const css = `
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#fff4e4;color:#141414;min-height:100vh}
  a{color:#68191e;text-decoration:none}
  a:hover{text-decoration:underline}
  .topbar{background:#68191e;color:#fff4e4;padding:16px 32px;display:flex;justify-content:space-between;align-items:center}
  .topbar h1{font-size:18px;font-weight:700;letter-spacing:0.05em}
  .topbar a,.topbar form button{color:#fff4e4;background:none;border:1px solid rgba(255,244,228,0.3);padding:6px 14px;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;cursor:pointer;font-family:inherit}
  .topbar a:hover,.topbar form button:hover{background:rgba(255,244,228,0.1);text-decoration:none}
  .container{max-width:1200px;margin:0 auto;padding:32px}
  .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:32px}
  .stat{background:#fff;border:1px solid #e8d9bf;padding:20px}
  .stat .lbl{font-size:11px;text-transform:uppercase;letter-spacing:0.2em;color:#888;margin-bottom:8px}
  .stat .val{font-size:32px;font-weight:700;color:#68191e}
  .filters{background:#fff;border:1px solid #e8d9bf;padding:16px 20px;margin-bottom:16px;display:flex;gap:24px;flex-wrap:wrap;align-items:center}
  .filters label{font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:#666;font-weight:600;margin-right:8px}
  .filters select,.filters input{padding:6px 10px;border:1px solid #ddd;font-family:inherit;font-size:13px;background:#fff}
  .filters .reset{margin-left:auto;font-size:12px;color:#68191e}
  table{width:100%;background:#fff;border:1px solid #e8d9bf;border-collapse:collapse}
  th,td{padding:12px 16px;text-align:left;font-size:13px;border-bottom:1px solid #f0e7d4}
  th{background:#fff4e4;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:#666;font-weight:700}
  tr:hover td{background:#fffaf2}
  .badge{display:inline-block;padding:3px 10px;font-size:10px;text-transform:uppercase;letter-spacing:0.1em;font-weight:700;border-radius:0}
  .badge.type-lead{background:#fff4e4;color:#68191e;border:1px solid #68191e}
  .badge.type-vendor{background:#eef0ff;color:#3a3f8a;border:1px solid #3a3f8a}
  .badge.type-venue{background:#e9f4ec;color:#2e6b3f;border:1px solid #2e6b3f}
  .badge.type-partner{background:#f8e9eb;color:#a02335;border:1px solid #a02335}
  .badge.status-new{background:#fff;color:#68191e;border:1px solid #68191e}
  .badge.status-in_progress{background:#fff8e1;color:#c08800;border:1px solid #c08800}
  .badge.status-done{background:#e8f5e9;color:#2e7d32;border:1px solid #2e7d32}
  .empty{text-align:center;padding:48px;color:#888}
  .pagination{margin-top:20px;display:flex;justify-content:center;gap:12px;font-size:13px}
  .pagination a,.pagination span{padding:6px 12px;border:1px solid #e8d9bf;background:#fff}
  .pagination .current{background:#68191e;color:#fff4e4;border-color:#68191e}
  .detail-card{background:#fff;border:1px solid #e8d9bf;padding:32px;margin-bottom:24px}
  .detail-card h2{font-size:22px;color:#68191e;margin-bottom:16px}
  .field{margin-bottom:14px}
  .field-lbl{font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:#888;font-weight:600;margin-bottom:4px}
  .field-val{font-size:14px;line-height:1.5;white-space:pre-wrap;word-break:break-word}
  .actions{display:flex;gap:12px;flex-wrap:wrap;margin-top:24px}
  .btn{padding:10px 20px;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;font-weight:700;border:1px solid #68191e;background:#fff;color:#68191e;cursor:pointer;font-family:inherit}
  .btn:hover{background:#68191e;color:#fff}
  .btn.primary{background:#68191e;color:#fff}
  .btn.primary:hover{background:#4d1216}
  textarea{width:100%;padding:10px;border:1px solid #ddd;font-family:inherit;font-size:13px;min-height:80px;resize:vertical}
  .login-page{display:flex;align-items:center;justify-content:center;min-height:100vh}
  .login-card{background:#fff;border:1px solid #e8d9bf;padding:40px;width:100%;max-width:380px}
  .login-card h1{color:#68191e;margin-bottom:24px;font-size:22px;text-align:center}
  .login-card input{width:100%;padding:12px;border:1px solid #ddd;font-family:inherit;font-size:14px;margin-bottom:16px}
  .login-card .btn{width:100%}
  .err{color:#c01a1a;font-size:13px;margin-bottom:12px;text-align:center}
`;

function layout(title: string, body: string, showNav = true): string {
  const nav = showNav ? `
    <div class="topbar">
      <h1><a href="/admin" style="color:inherit;">Mariage Afro · Admin</a></h1>
      <div style="display:flex;gap:8px;align-items:center;">
        <a href="/admin">Demandes</a>
        <a href="/admin/reviews">Avis</a>
        <form method="POST" action="/admin/logout" style="margin:0;">
          <button type="submit">Déconnexion</button>
        </form>
      </div>
    </div>` : "";
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)} — Mariage Afro Admin</title><style>${css}</style></head><body>${nav}${body}</body></html>`;
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
            ${r.status !== "published" ? `<form method="POST" action="/admin/reviews/${r.id}/status" style="display:inline;margin:0 4px 4px 0;"><input type="hidden" name="status" value="published"/><button class="btn primary" type="submit">Publier</button></form>` : ""}
            ${r.status !== "rejected" ? `<form method="POST" action="/admin/reviews/${r.id}/status" style="display:inline;margin:0 4px 4px 0;"><input type="hidden" name="status" value="rejected"/><button class="btn" type="submit">Rejeter</button></form>` : ""}
            ${r.status !== "pending" ? `<form method="POST" action="/admin/reviews/${r.id}/status" style="display:inline;margin:0 4px 4px 0;"><input type="hidden" name="status" value="pending"/><button class="btn" type="submit">Re-modérer</button></form>` : ""}
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
  `));
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
  const err = req.query.err === "1" ? `<div class="err">Mot de passe incorrect.</div>` : "";
  res.type("html").send(layout("Connexion", `
    <div class="login-page"><div class="login-card">
      <h1>Connexion Admin</h1>
      ${err}
      <form method="POST" action="/admin/login">
        <input type="password" name="password" placeholder="Mot de passe" required autofocus />
        <button type="submit" class="btn primary">Se connecter</button>
      </form>
    </div></div>
  `, false));
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
  const unionSql = sql`
    SELECT 'lead'::text AS type, id, name, email, phone, wedding_date,
           COALESCE(array_to_string(ARRAY(SELECT jsonb_array_elements_text(services)), ', '), '') AS services_text,
           CASE WHEN category = 'service-request' THEN 'Demande services' ELSE 'Lead général' END AS subject,
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

  const totals: Record<LeadType, number> = { lead: 0, vendor: 0, venue: 0, partner: 0 };
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

  const stats = `
    <div class="stats">
      <div class="stat"><div class="lbl">Leads</div><div class="val">${totals.lead}</div></div>
      <div class="stat"><div class="lbl">Demandes Prestataires</div><div class="val">${totals.vendor}</div></div>
      <div class="stat"><div class="lbl">Demandes Lieux</div><div class="val">${totals.venue}</div></div>
      <div class="stat"><div class="lbl">Candidatures Partenaires</div><div class="val">${totals.partner}</div></div>
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
  `));
});

router.get("/leads/:type/:id", adminAuth, async (req, res) => {
  const type = req.params.type as LeadType;
  if (!TYPES.includes(type)) { res.status(404).send("Not found"); return; }
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) { res.status(404).send("Not found"); return; }

  const table = tableFor(type);
  const [row] = await db.select().from(table as typeof leadsTable).where(eq(table.id, id)).limit(1);
  if (!row) { res.status(404).type("html").send(layout("Introuvable", `<div class="container"><p>Demande introuvable.</p></div>`)); return; }

  const r = row as Record<string, unknown>;
  const fields: Array<[string, unknown]> = [];
  fields.push(["Date", new Date(r.createdAt as string | Date).toLocaleString("fr-BE")]);
  fields.push(["Type", TYPE_LABEL[type]]);
  if (type === "lead") {
    fields.push(["Catégorie", r.category]);
    fields.push(["Nom", r.name]); fields.push(["Email", r.email]); fields.push(["Téléphone", r.phone]);
    fields.push(["Date du mariage", r.weddingDate]);
    fields.push(["Nombre d'invités", r.guestCount]);
    fields.push(["Budget", r.budget]);
    fields.push(["Type de mariage", r.weddingType]);
    fields.push(["Services souhaités", Array.isArray(r.services) ? (r.services as string[]).join(", ") : ""]);
    fields.push(["Message", r.message]);
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

  const statusButtons = STATUSES.map(s => `
    <form method="POST" action="/admin/leads/${type}/${id}/status" style="display:inline;margin:0;">
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
          <textarea name="internalNote" placeholder="Note privée…">${escapeHtml(r.internalNote)}</textarea>
          <div class="actions"><button type="submit" class="btn primary">Enregistrer la note</button></div>
        </form>
      </div>
    </div>
  `));
});

router.post("/leads/:type/:id/status", adminAuth, async (req, res) => {
  const type = req.params.type as LeadType;
  if (!TYPES.includes(type)) { res.status(404).send("Not found"); return; }
  const id = Number(req.params.id);
  const status = String(req.body?.status ?? "");
  if (!STATUSES.includes(status as Status)) { res.status(400).send("Invalid status"); return; }
  const table = tableFor(type);
  await db.update(table).set({ status }).where(eq(table.id, id));
  res.redirect(`/admin/leads/${type}/${id}`);
});

router.post("/leads/:type/:id/note", adminAuth, async (req, res) => {
  const type = req.params.type as LeadType;
  if (!TYPES.includes(type)) { res.status(404).send("Not found"); return; }
  const id = Number(req.params.id);
  const internalNote = String(req.body?.internalNote ?? "");
  const table = tableFor(type);
  await db.update(table).set({ internalNote }).where(eq(table.id, id));
  res.redirect(`/admin/leads/${type}/${id}`);
});

export default router;
