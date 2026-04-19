import { Router } from "express";
import { desc, eq, and, type SQL } from "drizzle-orm";
import {
  db,
  leadsTable,
  vendorRequestsTable,
  venueRequestsTable,
  partnerApplicationsTable,
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
      <form method="POST" action="/admin/logout" style="margin:0;">
        <button type="submit">Déconnexion</button>
      </form>
    </div>` : "";
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)} — Mariage Afro Admin</title><style>${css}</style></head><body>${nav}${body}</body></html>`;
}

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

async function loadAll(filterType?: LeadType, filterStatus?: Status) {
  const conds: SQL[] = [];
  if (filterStatus) conds.push(eq(leadsTable.status, filterStatus));
  const where = conds.length ? and(...conds) : undefined;

  const [leads, vendors, venues, partners] = await Promise.all([
    db.select().from(leadsTable).where(where).orderBy(desc(leadsTable.createdAt)).limit(500),
    filterStatus
      ? db.select().from(vendorRequestsTable).where(eq(vendorRequestsTable.status, filterStatus)).orderBy(desc(vendorRequestsTable.createdAt)).limit(500)
      : db.select().from(vendorRequestsTable).orderBy(desc(vendorRequestsTable.createdAt)).limit(500),
    filterStatus
      ? db.select().from(venueRequestsTable).where(eq(venueRequestsTable.status, filterStatus)).orderBy(desc(venueRequestsTable.createdAt)).limit(500)
      : db.select().from(venueRequestsTable).orderBy(desc(venueRequestsTable.createdAt)).limit(500),
    filterStatus
      ? db.select().from(partnerApplicationsTable).where(eq(partnerApplicationsTable.status, filterStatus)).orderBy(desc(partnerApplicationsTable.createdAt)).limit(500)
      : db.select().from(partnerApplicationsTable).orderBy(desc(partnerApplicationsTable.createdAt)).limit(500),
  ]);

  type Row = {
    type: LeadType; id: number; name: string; email: string; phone: string | null;
    weddingDate: string | null; subject: string; status: string; createdAt: Date;
  };
  const all: Row[] = [
    ...leads.map((l: typeof leads[number]): Row => ({ type: "lead", id: l.id, name: l.name, email: l.email, phone: l.phone, weddingDate: l.weddingDate, subject: (l.services ?? []).join(", ") || (l.category === "service-request" ? "Services" : "Lead général"), status: l.status, createdAt: l.createdAt })),
    ...vendors.map((v: typeof vendors[number]): Row => ({ type: "vendor", id: v.id, name: v.name, email: v.email, phone: v.phone, weddingDate: v.weddingDate, subject: `${v.vendorName} · ${v.requestType}`, status: v.status, createdAt: v.createdAt })),
    ...venues.map((v: typeof venues[number]): Row => ({ type: "venue", id: v.id, name: v.name, email: v.email, phone: v.phone, weddingDate: v.weddingDate, subject: `${v.venueName} · ${v.requestType}`, status: v.status, createdAt: v.createdAt })),
    ...partners.map((p: typeof partners[number]): Row => ({ type: "partner", id: p.id, name: p.contactName, email: p.email, phone: p.phone, weddingDate: null, subject: `${p.businessName} · ${p.category}`, status: p.status, createdAt: p.createdAt })),
  ];
  all.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const filtered = filterType ? all.filter(r => r.type === filterType) : all;
  return { rows: filtered, totals: { lead: leads.length, vendor: vendors.length, venue: venues.length, partner: partners.length } };
}

router.get("/", adminAuth, async (req, res) => {
  const filterType = TYPES.includes(req.query.type as LeadType) ? (req.query.type as LeadType) : undefined;
  const filterStatus = STATUSES.includes(req.query.status as Status) ? (req.query.status as Status) : undefined;
  const page = Math.max(1, Number(req.query.page) || 1);
  const perPage = 25;

  const { rows, totals } = await loadAll(filterType, filterStatus);
  const totalPages = Math.max(1, Math.ceil(rows.length / perPage));
  const pageRows = rows.slice((page - 1) * perPage, page * perPage);

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
    ? `<tr><td colspan="7" class="empty">Aucune demande.</td></tr>`
    : pageRows.map(r => `
        <tr>
          <td>${escapeHtml(r.createdAt.toISOString().slice(0, 10))}</td>
          <td><span class="badge type-${r.type}">${TYPE_LABEL[r.type]}</span></td>
          <td><a href="/admin/leads/${r.type}/${r.id}">${escapeHtml(r.name)}</a></td>
          <td>${escapeHtml(r.email)}</td>
          <td>${escapeHtml(r.phone ?? "")}</td>
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
        <thead><tr><th>Date</th><th>Type</th><th>Nom</th><th>Email</th><th>Téléphone</th><th>Sujet</th><th>Statut</th></tr></thead>
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
