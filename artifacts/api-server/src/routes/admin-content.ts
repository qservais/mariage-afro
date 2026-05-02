import { Router, Request, Response } from "express";
import { db } from "@workspace/db";
import {
  marketplaceVendorsTable,
  marketplaceVenuesTable,
  realisationsTable,
  messagesTable,
  weddingWebsitesTable,
  couplesTable,
  vendorAccountsTable,
} from "@workspace/db";
import { eq, desc, asc, sql } from "drizzle-orm";
import { adminAuth } from "../middlewares/adminAuth";
import { notifyVendorApproved, notifyConversationMessage } from "../lib/email";

const router = Router();
router.use(adminAuth);

function escHtml(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function contentLayout(title: string, body: string): string {
  return `<!DOCTYPE html><html lang="fr"><head>
<meta charset="utf-8"><title>${escHtml(title)} — Admin</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,sans-serif;background:#f5f4f0;color:#1a1a1a;min-height:100vh}
.topbar{background:#1a1a1a;color:#fff;padding:14px 24px;display:flex;align-items:center;gap:24px}
.topbar a{color:#e8c88a;text-decoration:none;font-size:13px;opacity:.9}
.topbar a:hover{opacity:1}
.topbar .sep{color:#555}
.container{max-width:1100px;margin:32px auto;padding:0 16px}
h1{font-size:22px;font-weight:700;margin-bottom:24px}
h2{font-size:16px;font-weight:600;margin-bottom:16px}
.card{background:#fff;border:1px solid #e5e5e5;padding:24px;margin-bottom:24px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;margin-bottom:24px}
.item{background:#fff;border:1px solid #e5e5e5;padding:16px}
.item h3{font-size:15px;font-weight:600;margin-bottom:6px}
.item p{font-size:13px;color:#555;margin-bottom:8px}
.item .meta{font-size:12px;color:#888;margin-bottom:12px}
.actions{display:flex;gap:8px;flex-wrap:wrap}
.btn{display:inline-block;padding:8px 16px;font-size:13px;font-weight:500;cursor:pointer;border:none;text-decoration:none}
.btn.primary{background:#1a1a1a;color:#fff}
.btn.danger{background:#c0392b;color:#fff}
.btn.secondary{background:#e5e5e5;color:#1a1a1a}
.btn.sm{padding:5px 12px;font-size:12px}
.btn.success{background:#27ae60;color:#fff}
form{display:flex;flex-direction:column;gap:12px}
label{font-size:13px;font-weight:500;display:flex;flex-direction:column;gap:4px}
input,textarea,select{padding:8px 10px;border:1px solid #ccc;font-size:14px;font-family:inherit;background:#fff;width:100%}
textarea{resize:vertical;min-height:80px}
.err{background:#fde;border:1px solid #c33;padding:10px 14px;font-size:13px;margin-bottom:16px;color:#c33}
.ok{background:#dfd;border:1px solid #3a3;padding:10px 14px;font-size:13px;margin-bottom:16px;color:#1a6e1a}
.badge{display:inline-block;padding:2px 8px;font-size:11px;font-weight:600;border-radius:2px}
.badge.active{background:#dff0d8;color:#3c763d}
.badge.inactive{background:#fdf2f8;color:#999}
table{width:100%;border-collapse:collapse;font-size:13px}
th,td{text-align:left;padding:10px 12px;border-bottom:1px solid #f0f0f0}
th{font-weight:600;background:#fafafa;font-size:12px;text-transform:uppercase;letter-spacing:.04em}
tr:last-child td{border-bottom:none}
.thread{display:flex;flex-direction:column;gap:12px}
.msg{padding:12px 16px;max-width:75%}
.msg.couple{background:#f0f0f0;align-self:flex-start}
.msg.admin{background:#1a1a1a;color:#fff;align-self:flex-end}
.msg .meta{font-size:11px;opacity:.6;margin-top:4px}
.couples-select{margin-bottom:16px}
.tabs{display:flex;gap:0;margin-bottom:24px;border-bottom:2px solid #e5e5e5}
.tab{padding:10px 20px;font-size:14px;font-weight:500;cursor:pointer;text-decoration:none;color:#555;border-bottom:2px solid transparent;margin-bottom:-2px}
.tab.active{color:#1a1a1a;border-bottom-color:#e8c88a}
</style>
</head><body>
<div class="topbar">
  <a href="/admin">← Leads</a>
  <span class="sep">|</span>
  <a href="/admin/content/vendors">Partenaires</a>
  <span class="sep">|</span>
  <a href="/admin/content/venues">Lieux</a>
  <span class="sep">|</span>
  <a href="/admin/content/realisations">Réalisations</a>
  <span class="sep">|</span>
  <a href="/admin/content/messages">Messages</a>
  <span class="sep">|</span>
  <a href="/admin/content/wedding-websites">Sites mariages</a>
  <span class="sep">|</span>
  <a href="/admin/content/vendor-accounts">Comptes Pro</a>
</div>
<div class="container">${body}</div>
</body></html>`;
}

// ============ MARKETPLACE VENDORS ============

router.get("/content/vendors", async (_req: Request, res: Response) => {
  const vendors = await db.select().from(marketplaceVendorsTable).orderBy(asc(marketplaceVendorsTable.name));
  const listHtml = vendors.length === 0
    ? `<p style="color:#888">Aucun partenaire. Cliquez sur "Ajouter" pour commencer.</p>`
    : `<div class="grid">${vendors.map(v => `
      <div class="item">
        <h3>${escHtml(v.name)} ${v.verified ? "✓" : ""}</h3>
        <p>${escHtml(v.category)} · ${escHtml(v.city)}</p>
        <p>${escHtml(v.tagline)}</p>
        <div class="meta">
          <span class="badge ${v.active ? "active" : "inactive"}">${v.active ? "Actif" : "Inactif"}</span>
          &nbsp;${v.services.length} services · Note: ${v.rating}/5
        </div>
        <div class="actions">
          <a class="btn sm secondary" href="/admin/content/vendors/${v.id}/edit">Modifier</a>
          <form method="post" action="/admin/content/vendors/${v.id}/toggle" style="display:inline">
            <button class="btn sm ${v.active ? "danger" : "success"}" type="submit">${v.active ? "Désactiver" : "Activer"}</button>
          </form>
          <form method="post" action="/admin/content/vendors/${v.id}/delete" style="display:inline" onsubmit="return confirm('Supprimer ?')">
            <button class="btn sm danger" type="submit">Supprimer</button>
          </form>
        </div>
      </div>`).join("")}</div>`;

  const body = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">
      <h1>Partenaires Marketplace (${vendors.length})</h1>
      <a class="btn primary" href="/admin/content/vendors/new">+ Ajouter un partenaire</a>
    </div>
    ${listHtml}`;
  res.type("html").send(contentLayout("Partenaires", body));
});

function vendorForm(v: Partial<{name:string;category:string;city:string;tagline:string;description:string;services:string[];images:string[];website:string|null;phone:string|null;email:string|null;verified:boolean;active:boolean;rating:number}> = {}, error = ""): string {
  const cats = ["Photographie","Vidéo","DJ & Animation","Décoration","Traiteur","Coiffure & Maquillage","Robe de mariée","Transport","Invitations","Autre"];
  return `
    ${error ? `<div class="err">${escHtml(error)}</div>` : ""}
    <div class="card">
    <form method="post">
      <label>Nom *<input name="name" required value="${escHtml(v.name)}"></label>
      <label>Catégorie *
        <select name="category" required>
          ${cats.map(c => `<option value="${escHtml(c)}" ${v.category===c?"selected":""}>${escHtml(c)}</option>`).join("")}
        </select>
      </label>
      <label>Ville *<input name="city" required value="${escHtml(v.city)}"></label>
      <label>Tagline (résumé court)<input name="tagline" value="${escHtml(v.tagline)}"></label>
      <label>Description<textarea name="description">${escHtml(v.description)}</textarea></label>
      <label>Services (un par ligne)<textarea name="services">${(v.services ?? []).join("\n")}</textarea></label>
      <label>URLs photos (une par ligne)<textarea name="images">${(v.images ?? []).join("\n")}</textarea></label>
      <label>Site web<input name="website" type="url" value="${escHtml(v.website)}"></label>
      <label>Téléphone<input name="phone" value="${escHtml(v.phone)}"></label>
      <label>Email<input name="email" type="email" value="${escHtml(v.email)}"></label>
      <label>Note (1–5)<input name="rating" type="number" min="1" max="5" value="${v.rating ?? 5}"></label>
      <label style="flex-direction:row;align-items:center;gap:8px">
        <input type="checkbox" name="verified" value="1" ${v.verified?"checked":""}> Vérifié
      </label>
      <label style="flex-direction:row;align-items:center;gap:8px">
        <input type="checkbox" name="active" value="1" ${v.active!==false?"checked":""}> Actif
      </label>
      <div class="actions">
        <button class="btn primary" type="submit">Enregistrer</button>
        <a class="btn secondary" href="/admin/content/vendors">Annuler</a>
      </div>
    </form>
    </div>`;
}

router.get("/content/vendors/new", (_req: Request, res: Response) => {
  res.type("html").send(contentLayout("Nouveau partenaire", `<h1>Nouveau partenaire</h1>${vendorForm({active:true})}`));
});

router.post("/content/vendors/new", async (req: Request, res: Response) => {
  const b = req.body as Record<string, string>;
  if (!b.name || !b.city || !b.category) {
    res.type("html").send(contentLayout("Nouveau partenaire", `<h1>Nouveau partenaire</h1>${vendorForm(b, "Nom, ville et catégorie sont requis.")}`));
    return;
  }
  await db.insert(marketplaceVendorsTable).values({
    name: b.name, category: b.category, city: b.city,
    tagline: b.tagline ?? "", description: b.description ?? "",
    services: b.services ? b.services.split("\n").map(s=>s.trim()).filter(Boolean) : [],
    images: b.images ? b.images.split("\n").map(s=>s.trim()).filter(Boolean) : [],
    website: b.website || null, phone: b.phone || null, email: b.email || null,
    rating: Number(b.rating) || 5,
    verified: b.verified === "1",
    active: b.active === "1",
  });
  res.redirect("/admin/content/vendors");
});

router.get("/content/vendors/:id/edit", async (req: Request, res: Response) => {
  const [v] = await db.select().from(marketplaceVendorsTable).where(eq(marketplaceVendorsTable.id, Number(req.params.id)));
  if (!v) { res.status(404).type("html").send(contentLayout("Introuvable","<p>Introuvable</p>")); return; }
  res.type("html").send(contentLayout("Modifier partenaire", `<h1>Modifier "${escHtml(v.name)}"</h1>${vendorForm(v)}`));
});

router.post("/content/vendors/:id/edit", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const b = req.body as Record<string, string>;
  await db.update(marketplaceVendorsTable).set({
    name: b.name, category: b.category, city: b.city,
    tagline: b.tagline ?? "", description: b.description ?? "",
    services: b.services ? b.services.split("\n").map(s=>s.trim()).filter(Boolean) : [],
    images: b.images ? b.images.split("\n").map(s=>s.trim()).filter(Boolean) : [],
    website: b.website || null, phone: b.phone || null, email: b.email || null,
    rating: Number(b.rating) || 5,
    verified: b.verified === "1",
    active: b.active === "1",
  }).where(eq(marketplaceVendorsTable.id, id));
  res.redirect("/admin/content/vendors");
});

router.post("/content/vendors/:id/toggle", async (req: Request, res: Response) => {
  const [v] = await db.select().from(marketplaceVendorsTable).where(eq(marketplaceVendorsTable.id, Number(req.params.id)));
  if (!v) { res.redirect("/admin/content/vendors"); return; }
  await db.update(marketplaceVendorsTable).set({ active: !v.active }).where(eq(marketplaceVendorsTable.id, v.id));
  res.redirect("/admin/content/vendors");
});

router.post("/content/vendors/:id/delete", async (req: Request, res: Response) => {
  await db.delete(marketplaceVendorsTable).where(eq(marketplaceVendorsTable.id, Number(req.params.id)));
  res.redirect("/admin/content/vendors");
});

// ============ VENUES ============

router.get("/content/venues", async (_req: Request, res: Response) => {
  const venues = await db.select().from(marketplaceVenuesTable).orderBy(asc(marketplaceVenuesTable.name));
  const listHtml = venues.length === 0
    ? `<p style="color:#888">Aucun lieu. Cliquez sur "Ajouter" pour commencer.</p>`
    : `<div class="grid">${venues.map(v => `
      <div class="item">
        <h3>${escHtml(v.name)}</h3>
        <p>${escHtml(v.city)} · ${escHtml(v.capacity)} personnes · ${escHtml(v.style)}</p>
        <p>${escHtml(v.description)}</p>
        <div class="meta"><span class="badge ${v.active ? "active" : "inactive"}">${v.active ? "Actif" : "Inactif"}</span></div>
        <div class="actions">
          <a class="btn sm secondary" href="/admin/content/venues/${v.id}/edit">Modifier</a>
          <form method="post" action="/admin/content/venues/${v.id}/toggle" style="display:inline">
            <button class="btn sm ${v.active ? "danger" : "success"}" type="submit">${v.active ? "Désactiver" : "Activer"}</button>
          </form>
          <form method="post" action="/admin/content/venues/${v.id}/delete" style="display:inline" onsubmit="return confirm('Supprimer ?')">
            <button class="btn sm danger" type="submit">Supprimer</button>
          </form>
        </div>
      </div>`).join("")}</div>`;

  const body = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">
      <h1>Lieux (${venues.length})</h1>
      <a class="btn primary" href="/admin/content/venues/new">+ Ajouter un lieu</a>
    </div>
    ${listHtml}`;
  res.type("html").send(contentLayout("Lieux", body));
});

function venueForm(v: Partial<{name:string;city:string;capacity:string;style:string;description:string;options:string[];images:string[];active:boolean}> = {}, error = ""): string {
  return `
    ${error ? `<div class="err">${escHtml(error)}</div>` : ""}
    <div class="card">
    <form method="post">
      <label>Nom *<input name="name" required value="${escHtml(v.name)}"></label>
      <label>Ville *<input name="city" required value="${escHtml(v.city)}"></label>
      <label>Capacité (ex: 50–500)<input name="capacity" value="${escHtml(v.capacity)}"></label>
      <label>Style (ex: Moderne, Château, Industriel)<input name="style" value="${escHtml(v.style)}"></label>
      <label>Description<textarea name="description">${escHtml(v.description)}</textarea></label>
      <label>Options (une par ligne)<textarea name="options">${(v.options ?? []).join("\n")}</textarea></label>
      <label>URLs photos (une par ligne)<textarea name="images">${(v.images ?? []).join("\n")}</textarea></label>
      <label style="flex-direction:row;align-items:center;gap:8px">
        <input type="checkbox" name="active" value="1" ${v.active!==false?"checked":""}> Actif
      </label>
      <div class="actions">
        <button class="btn primary" type="submit">Enregistrer</button>
        <a class="btn secondary" href="/admin/content/venues">Annuler</a>
      </div>
    </form>
    </div>`;
}

router.get("/content/venues/new", (_req: Request, res: Response) => {
  res.type("html").send(contentLayout("Nouveau lieu", `<h1>Nouveau lieu</h1>${venueForm({active:true})}`));
});

router.post("/content/venues/new", async (req: Request, res: Response) => {
  const b = req.body as Record<string, string>;
  if (!b.name || !b.city) {
    res.type("html").send(contentLayout("Nouveau lieu", `<h1>Nouveau lieu</h1>${venueForm(b, "Nom et ville sont requis.")}`));
    return;
  }
  await db.insert(marketplaceVenuesTable).values({
    name: b.name, city: b.city, capacity: b.capacity ?? "", style: b.style ?? "",
    description: b.description ?? "",
    options: b.options ? b.options.split("\n").map(s=>s.trim()).filter(Boolean) : [],
    images: b.images ? b.images.split("\n").map(s=>s.trim()).filter(Boolean) : [],
    active: b.active === "1",
  });
  res.redirect("/admin/content/venues");
});

router.get("/content/venues/:id/edit", async (req: Request, res: Response) => {
  const [v] = await db.select().from(marketplaceVenuesTable).where(eq(marketplaceVenuesTable.id, Number(req.params.id)));
  if (!v) { res.status(404).type("html").send(contentLayout("Introuvable","<p>Introuvable</p>")); return; }
  res.type("html").send(contentLayout("Modifier lieu", `<h1>Modifier "${escHtml(v.name)}"</h1>${venueForm(v)}`));
});

router.post("/content/venues/:id/edit", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const b = req.body as Record<string, string>;
  await db.update(marketplaceVenuesTable).set({
    name: b.name, city: b.city, capacity: b.capacity ?? "", style: b.style ?? "",
    description: b.description ?? "",
    options: b.options ? b.options.split("\n").map(s=>s.trim()).filter(Boolean) : [],
    images: b.images ? b.images.split("\n").map(s=>s.trim()).filter(Boolean) : [],
    active: b.active === "1",
  }).where(eq(marketplaceVenuesTable.id, id));
  res.redirect("/admin/content/venues");
});

router.post("/content/venues/:id/toggle", async (req: Request, res: Response) => {
  const [v] = await db.select().from(marketplaceVenuesTable).where(eq(marketplaceVenuesTable.id, Number(req.params.id)));
  if (!v) { res.redirect("/admin/content/venues"); return; }
  await db.update(marketplaceVenuesTable).set({ active: !v.active }).where(eq(marketplaceVenuesTable.id, v.id));
  res.redirect("/admin/content/venues");
});

router.post("/content/venues/:id/delete", async (req: Request, res: Response) => {
  await db.delete(marketplaceVenuesTable).where(eq(marketplaceVenuesTable.id, Number(req.params.id)));
  res.redirect("/admin/content/venues");
});

// ============ RÉALISATIONS ============

router.get("/content/realisations", async (_req: Request, res: Response) => {
  const rows = await db.select().from(realisationsTable).orderBy(desc(realisationsTable.createdAt));
  const listHtml = rows.length === 0
    ? `<p style="color:#888">Aucune réalisation. Cliquez sur "Ajouter" pour commencer.</p>`
    : `<div class="grid">${rows.map(r => `
      <div class="item">
        <h3>${escHtml(r.brideName)} & ${escHtml(r.groomName)}</h3>
        <p>${escHtml(r.weddingType)} · ${escHtml(r.city)}</p>
        <p>${escHtml(r.description.substring(0,100))}${r.description.length>100?"…":""}</p>
        <div class="meta">
          <span class="badge ${r.active ? "active" : "inactive"}">${r.active ? "Actif" : "Inactif"}</span>
          ${r.featured ? '&nbsp;<span class="badge active">À la une</span>' : ""}
          &nbsp;${r.weddingDate ?? ""}
        </div>
        <div class="actions">
          <a class="btn sm secondary" href="/admin/content/realisations/${r.id}/edit">Modifier</a>
          <form method="post" action="/admin/content/realisations/${r.id}/toggle" style="display:inline">
            <button class="btn sm ${r.active ? "danger" : "success"}" type="submit">${r.active ? "Désactiver" : "Activer"}</button>
          </form>
          <form method="post" action="/admin/content/realisations/${r.id}/delete" style="display:inline" onsubmit="return confirm('Supprimer ?')">
            <button class="btn sm danger" type="submit">Supprimer</button>
          </form>
        </div>
      </div>`).join("")}</div>`;

  const body = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">
      <h1>Réalisations (${rows.length})</h1>
      <a class="btn primary" href="/admin/content/realisations/new">+ Ajouter une réalisation</a>
    </div>
    ${listHtml}`;
  res.type("html").send(contentLayout("Réalisations", body));
});

function realisationForm(r: Partial<{brideName:string;groomName:string;weddingType:string;venueName:string;city:string;weddingDate:string|null;description:string;coverImage:string|null;gallery:string[];active:boolean;featured:boolean}> = {}, error = ""): string {
  return `
    ${error ? `<div class="err">${escHtml(error)}</div>` : ""}
    <div class="card">
    <form method="post">
      <label>Prénom mariée *<input name="brideName" required value="${escHtml(r.brideName)}"></label>
      <label>Prénom marié *<input name="groomName" required value="${escHtml(r.groomName)}"></label>
      <label>Type de mariage (ex: Afro-européen, Traditionnel)<input name="weddingType" value="${escHtml(r.weddingType)}"></label>
      <label>Lieu de la cérémonie<input name="venueName" value="${escHtml(r.venueName)}"></label>
      <label>Ville<input name="city" value="${escHtml(r.city)}"></label>
      <label>Date (ex: Mai 2024)<input name="weddingDate" value="${escHtml(r.weddingDate)}"></label>
      <label>Description (storytelling)<textarea name="description" style="min-height:120px">${escHtml(r.description)}</textarea></label>
      <label>URL photo de couverture<input name="coverImage" value="${escHtml(r.coverImage)}"></label>
      <label>Galerie (une URL par ligne)<textarea name="gallery">${(r.gallery ?? []).join("\n")}</textarea></label>
      <label style="flex-direction:row;align-items:center;gap:8px">
        <input type="checkbox" name="featured" value="1" ${r.featured?"checked":""}> À la une
      </label>
      <label style="flex-direction:row;align-items:center;gap:8px">
        <input type="checkbox" name="active" value="1" ${r.active!==false?"checked":""}> Actif
      </label>
      <div class="actions">
        <button class="btn primary" type="submit">Enregistrer</button>
        <a class="btn secondary" href="/admin/content/realisations">Annuler</a>
      </div>
    </form>
    </div>`;
}

router.get("/content/realisations/new", (_req: Request, res: Response) => {
  res.type("html").send(contentLayout("Nouvelle réalisation", `<h1>Nouvelle réalisation</h1>${realisationForm({active:true})}`));
});

router.post("/content/realisations/new", async (req: Request, res: Response) => {
  const b = req.body as Record<string, string>;
  if (!b.brideName || !b.groomName) {
    res.type("html").send(contentLayout("Nouvelle réalisation", `<h1>Nouvelle réalisation</h1>${realisationForm(b, "Prénoms requis.")}`));
    return;
  }
  await db.insert(realisationsTable).values({
    brideName: b.brideName, groomName: b.groomName,
    weddingType: b.weddingType ?? "", venueName: b.venueName ?? "",
    city: b.city ?? "", weddingDate: b.weddingDate || null,
    description: b.description ?? "",
    coverImage: b.coverImage || null,
    gallery: b.gallery ? b.gallery.split("\n").map(s=>s.trim()).filter(Boolean) : [],
    featured: b.featured === "1", active: b.active === "1",
  });
  res.redirect("/admin/content/realisations");
});

router.get("/content/realisations/:id/edit", async (req: Request, res: Response) => {
  const [r] = await db.select().from(realisationsTable).where(eq(realisationsTable.id, Number(req.params.id)));
  if (!r) { res.status(404).type("html").send(contentLayout("Introuvable","<p>Introuvable</p>")); return; }
  res.type("html").send(contentLayout("Modifier réalisation", `<h1>Modifier ${escHtml(r.brideName)} & ${escHtml(r.groomName)}</h1>${realisationForm(r)}`));
});

router.post("/content/realisations/:id/edit", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const b = req.body as Record<string, string>;
  await db.update(realisationsTable).set({
    brideName: b.brideName, groomName: b.groomName,
    weddingType: b.weddingType ?? "", venueName: b.venueName ?? "",
    city: b.city ?? "", weddingDate: b.weddingDate || null,
    description: b.description ?? "",
    coverImage: b.coverImage || null,
    gallery: b.gallery ? b.gallery.split("\n").map(s=>s.trim()).filter(Boolean) : [],
    featured: b.featured === "1", active: b.active === "1",
  }).where(eq(realisationsTable.id, id));
  res.redirect("/admin/content/realisations");
});

router.post("/content/realisations/:id/toggle", async (req: Request, res: Response) => {
  const [r] = await db.select().from(realisationsTable).where(eq(realisationsTable.id, Number(req.params.id)));
  if (!r) { res.redirect("/admin/content/realisations"); return; }
  await db.update(realisationsTable).set({ active: !r.active }).where(eq(realisationsTable.id, r.id));
  res.redirect("/admin/content/realisations");
});

router.post("/content/realisations/:id/delete", async (req: Request, res: Response) => {
  await db.delete(realisationsTable).where(eq(realisationsTable.id, Number(req.params.id)));
  res.redirect("/admin/content/realisations");
});

// ============ MESSAGES ============

router.get("/content/messages", async (_req: Request, res: Response) => {
  const couples = await db
    .select({
      id: couplesTable.id,
      partner1Name: couplesTable.partner1Name,
      partner2Name: couplesTable.partner2Name,
      unread: sql<number>`count(case when ${messagesTable.authorRole} = 'couple' and ${messagesTable.readAt} is null then 1 end)`.as("unread"),
    })
    .from(couplesTable)
    .leftJoin(messagesTable, eq(messagesTable.coupleId, couplesTable.id))
    .groupBy(couplesTable.id, couplesTable.partner1Name, couplesTable.partner2Name)
    .orderBy(desc(couplesTable.updatedAt));

  const listHtml = couples.length === 0
    ? `<p style="color:#888">Aucun couple inscrit.</p>`
    : `<table><thead><tr><th>Couple</th><th>Messages non lus</th><th></th></tr></thead><tbody>
      ${couples.map(c => `<tr>
        <td>${escHtml(c.partner1Name || "—")} & ${escHtml(c.partner2Name || "—")}</td>
        <td>${c.unread > 0 ? `<span class="badge active">${c.unread} nouveaux</span>` : "—"}</td>
        <td><a class="btn sm secondary" href="/admin/content/messages/${c.id}">Voir la conversation</a></td>
      </tr>`).join("")}
      </tbody></table>`;

  res.type("html").send(contentLayout("Messages", `<h1>Messages couples</h1>${listHtml}`));
});

router.get("/content/messages/:coupleId", async (req: Request, res: Response) => {
  const coupleId = Number(req.params.coupleId);
  const [couple] = await db.select().from(couplesTable).where(eq(couplesTable.id, coupleId));
  if (!couple) { res.status(404).type("html").send(contentLayout("Introuvable","<p>Introuvable</p>")); return; }

  const messages = await db.select().from(messagesTable)
    .where(eq(messagesTable.coupleId, coupleId))
    .orderBy(asc(messagesTable.createdAt));

  await db.update(messagesTable)
    .set({ readAt: new Date() })
    .where(eq(messagesTable.coupleId, coupleId));

  const threadHtml = messages.length === 0
    ? `<p style="color:#888">Aucun message.</p>`
    : `<div class="thread">${messages.map(m => `
      <div class="msg ${escHtml(m.authorRole)}">
        <div>${escHtml(m.content)}</div>
        <div class="meta">${m.authorRole === "admin" ? "Vous" : "Couple"} · ${new Date(m.createdAt).toLocaleString("fr-BE")}</div>
      </div>`).join("")}</div>`;

  const replyForm = `
    <div class="card" style="margin-top:24px">
      <h2>Répondre</h2>
      <form method="post">
        <label>Message<textarea name="content" required></textarea></label>
        <button class="btn primary" type="submit">Envoyer</button>
      </form>
    </div>`;

  res.type("html").send(contentLayout(
    `Messages — ${couple.partner1Name} & ${couple.partner2Name}`,
    `<h1>Conversation avec ${escHtml(couple.partner1Name || "—")} & ${escHtml(couple.partner2Name || "—")}</h1>
     <a class="btn secondary sm" href="/admin/content/messages" style="margin-bottom:20px;display:inline-block">← Retour</a>
     ${threadHtml}${replyForm}`
  ));
});

router.post("/content/messages/:coupleId", async (req: Request, res: Response) => {
  const coupleId = Number(req.params.coupleId);
  const { content } = req.body as { content: string };
  if (!content?.trim()) { res.redirect(`/admin/content/messages/${coupleId}`); return; }
  await db.insert(messagesTable).values({ coupleId, authorRole: "admin", content: content.trim() });

  // Notify couple (throttled)
  (async () => {
    const [couple] = await db.select().from(couplesTable).where(eq(couplesTable.id, coupleId)).limit(1);
    if (couple?.email) {
      await notifyConversationMessage({
        to: couple.email,
        locale: couple.locale,
        senderLabel: "Mariage Afro",
        preview: content.trim(),
        conversationKey: `couple-admin:${coupleId}`,
        ctaUrl: `${process.env.PUBLIC_APP_URL || ""}/espace-client/communication`,
      }, req.log);
    }
  })().catch((err) => req.log.error({ err }, "Failed to notify couple of admin message"));

  res.redirect(`/admin/content/messages/${coupleId}`);
});

// ============ WEDDING WEBSITES ============

router.get("/content/wedding-websites", async (_req: Request, res: Response) => {
  const rows = await db
    .select({
      id: weddingWebsitesTable.id,
      coupleId: weddingWebsitesTable.coupleId,
      slug: weddingWebsitesTable.slug,
      title: weddingWebsitesTable.title,
      active: weddingWebsitesTable.active,
      partner1Name: couplesTable.partner1Name,
      partner2Name: couplesTable.partner2Name,
    })
    .from(weddingWebsitesTable)
    .leftJoin(couplesTable, eq(couplesTable.id, weddingWebsitesTable.coupleId))
    .orderBy(desc(weddingWebsitesTable.createdAt));

  const listHtml = rows.length === 0
    ? `<p style="color:#888">Aucun site mariage créé.</p>`
    : `<table><thead><tr><th>Couple</th><th>Titre</th><th>Adresse</th><th>Statut</th><th></th></tr></thead><tbody>
      ${rows.map(r => `<tr>
        <td>${escHtml(r.partner1Name||"—")} & ${escHtml(r.partner2Name||"—")}</td>
        <td>${escHtml(r.title)}</td>
        <td><a href="/mariage/${escHtml(r.slug)}" target="_blank">/mariage/${escHtml(r.slug)}</a></td>
        <td><span class="badge ${r.active?"active":"inactive"}">${r.active?"Publié":"Privé"}</span></td>
        <td>
          <form method="post" action="/admin/content/wedding-websites/${r.id}/toggle" style="display:inline">
            <button class="btn sm ${r.active?"danger":"success"}" type="submit">${r.active?"Dépublier":"Publier"}</button>
          </form>
        </td>
      </tr>`).join("")}
      </tbody></table>`;

  res.type("html").send(contentLayout("Sites mariages", `<h1>Sites mariage des couples</h1>${listHtml}`));
});

router.post("/content/wedding-websites/:id/toggle", async (req: Request, res: Response) => {
  const [site] = await db.select().from(weddingWebsitesTable).where(eq(weddingWebsitesTable.id, Number(req.params.id)));
  if (!site) { res.redirect("/admin/content/wedding-websites"); return; }
  await db.update(weddingWebsitesTable).set({ active: !site.active }).where(eq(weddingWebsitesTable.id, site.id));
  res.redirect("/admin/content/wedding-websites");
});

// ============ VENDOR ACCOUNTS (Espace Pro signup approval) ============

router.get("/content/vendor-accounts", async (_req: Request, res: Response) => {
  const rows = await db
    .select({
      account: vendorAccountsTable,
      vendor: marketplaceVendorsTable,
    })
    .from(vendorAccountsTable)
    .leftJoin(marketplaceVendorsTable, eq(marketplaceVendorsTable.id, vendorAccountsTable.vendorId))
    .orderBy(desc(vendorAccountsTable.createdAt));

  const pending = rows.filter(r => r.account.status === "pending");
  const approved = rows.filter(r => r.account.status === "approved");
  const rejected = rows.filter(r => r.account.status === "rejected");

  function renderRow(r: typeof rows[number]): string {
    const a = r.account;
    const v = r.vendor;
    return `<div class="item">
      <h3>${escHtml(a.businessName || "—")} <span class="badge ${a.status === "approved" ? "active" : "inactive"}">${escHtml(a.status)}</span></h3>
      <p>${escHtml(a.category || "—")} · ${escHtml(a.city || "—")}</p>
      <p style="font-size:12px;color:#666">${escHtml(a.contactName)} · ${escHtml(a.email)}${a.phone ? ` · ${escHtml(a.phone)}` : ""}</p>
      ${a.website ? `<p style="font-size:12px"><a href="${escHtml(a.website)}" target="_blank" rel="noopener">${escHtml(a.website)}</a></p>` : ""}
      ${a.description ? `<p style="font-size:12px;color:#555;margin-top:8px">${escHtml(a.description)}</p>` : ""}
      <div class="meta" style="margin-top:8px">
        Inscrit ${new Date(a.createdAt).toLocaleDateString("fr-BE")}
        ${v ? ` · Fiche marketplace #${v.id} ${v.verified ? "✓" : ""} ${v.active ? "(publié)" : "(masqué)"}` : ""}
      </div>
      <div class="actions" style="margin-top:12px">
        ${a.status !== "approved" ? `<form method="post" action="/admin/content/vendor-accounts/${a.id}/approve" style="display:inline">
          <button class="btn sm success" type="submit">Approuver &amp; publier</button>
        </form>` : ""}
        ${a.status !== "rejected" ? `<form method="post" action="/admin/content/vendor-accounts/${a.id}/reject" style="display:inline" onsubmit="return confirm('Rejeter et masquer la fiche ?')">
          <button class="btn sm danger" type="submit">Rejeter</button>
        </form>` : ""}
        ${v ? `<a class="btn sm secondary" href="/admin/content/vendors/${v.id}/edit">Modifier fiche</a>` : ""}
      </div>
    </div>`;
  }

  function renderSection(title: string, items: typeof rows): string {
    if (items.length === 0) return `<h2 style="margin-top:24px">${escHtml(title)} (0)</h2><p style="color:#888;font-size:13px">Aucun</p>`;
    return `<h2 style="margin-top:24px">${escHtml(title)} (${items.length})</h2><div class="grid">${items.map(renderRow).join("")}</div>`;
  }

  const body = `
    <h1>Comptes prestataires (Espace Pro)</h1>
    <p style="font-size:13px;color:#555;margin-bottom:24px">Les prestataires créent un compte via /espace-pro/register puis remplissent l'onboarding. Approuvez pour publier leur fiche dans la marketplace.</p>
    ${renderSection("En attente de validation", pending)}
    ${renderSection("Approuvés", approved)}
    ${renderSection("Rejetés", rejected)}`;
  res.type("html").send(contentLayout("Comptes Pro", body));
});

router.post("/content/vendor-accounts/:id/approve", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const [a] = await db.select().from(vendorAccountsTable).where(eq(vendorAccountsTable.id, id));
  if (!a) { res.redirect("/admin/content/vendor-accounts"); return; }
  const wasAlreadyApproved = a.status === "approved";
  if (a.vendorId) {
    await db.update(marketplaceVendorsTable)
      .set({ verified: true, active: true })
      .where(eq(marketplaceVendorsTable.id, a.vendorId));
  }
  await db.update(vendorAccountsTable)
    .set({ status: "approved", updatedAt: new Date() })
    .where(eq(vendorAccountsTable.id, id));

  // Send welcome email only on first approval
  if (!wasAlreadyApproved && a.email) {
    notifyVendorApproved({
      to: a.email,
      locale: a.locale,
      businessName: a.businessName || "Mariage Afro",
    }, req.log).catch((err) => req.log.error({ err }, "Failed to send vendor approval email"));
  }

  res.redirect("/admin/content/vendor-accounts");
});

router.post("/content/vendor-accounts/:id/reject", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const [a] = await db.select().from(vendorAccountsTable).where(eq(vendorAccountsTable.id, id));
  if (!a) { res.redirect("/admin/content/vendor-accounts"); return; }
  if (a.vendorId) {
    await db.update(marketplaceVendorsTable)
      .set({ verified: false, active: false })
      .where(eq(marketplaceVendorsTable.id, a.vendorId));
  }
  await db.update(vendorAccountsTable)
    .set({ status: "rejected", updatedAt: new Date() })
    .where(eq(vendorAccountsTable.id, id));
  res.redirect("/admin/content/vendor-accounts");
});

// ============ TEST EMAIL (dev only) ============

router.get("/test-email", (_req: Request, res: Response) => {
  const apiKeyOk = !!process.env.RESEND_API_KEY;
  const fromOk = !!process.env.EMAIL_FROM;
  const adminOk = !!(process.env.ADMIN_EMAIL || process.env.ADMIN_NOTIFY_EMAIL);
  const status = `<div class="card">
    <h2>Configuration</h2>
    <table>
      <tr><th>RESEND_API_KEY</th><td>${apiKeyOk ? '<span class="badge active">configuré</span>' : '<span class="badge inactive">manquant</span>'}</td></tr>
      <tr><th>EMAIL_FROM</th><td>${fromOk ? '<span class="badge active">configuré</span>' : '<span class="badge inactive">défaut: noreply@mariage-afro.com</span>'}</td></tr>
      <tr><th>ADMIN_EMAIL</th><td>${adminOk ? '<span class="badge active">configuré</span>' : '<span class="badge inactive">défaut: info@mariage-afro.com</span>'}</td></tr>
    </table>
  </div>`;
  const form = `<div class="card">
    <h2>Envoyer un email de test</h2>
    <form method="post">
      <label>Adresse de destination
        <input type="email" name="to" required placeholder="vous@example.com">
      </label>
      <label>Type d'email
        <select name="type">
          <option value="admin-lead">1. Admin — nouveau lead</option>
          <option value="vendor-lead">2. Vendor — nouveau lead</option>
          <option value="conversation">3. Conversation — nouveau message</option>
          <option value="rsvp">4. Couple — nouveau RSVP</option>
          <option value="vendor-approved">5. Vendor — candidature approuvée</option>
          <option value="partner-received">6. Partenaire — candidature reçue</option>
        </select>
      </label>
      <label>Langue
        <select name="locale">
          <option value="fr">Français</option>
          <option value="nl">Nederlands</option>
          <option value="en">English</option>
        </select>
      </label>
      <button type="submit" class="btn primary">Envoyer le test</button>
    </form>
  </div>`;
  res.type("html").send(contentLayout("Test emails", `<h1>Test des notifications email</h1>${status}${form}`));
});

router.post("/test-email", async (req: Request, res: Response) => {
  const { to, type, locale } = req.body as Record<string, string>;
  if (!to || !type) {
    res.redirect("/admin/test-email");
    return;
  }
  const loc = (locale || "fr") as "fr" | "nl" | "en";
  const log = req.log;
  const email = await import("../lib/email");

  try {
    if (type === "admin-lead") {
      await email.notifyAdminNewLead({
        source: "general",
        name: "Test Couple",
        email: to,
        phone: "+32 470 00 00 00",
        weddingDate: "2026-08-15",
        guestCount: 120,
        budget: "20 000 €",
        weddingType: "Afro-européen",
        services: ["Photographie", "Traiteur"],
        message: "Ceci est un message de test.",
      }, log);
    } else if (type === "vendor-lead") {
      email._resetConversationThrottleForTests();
      await email.notifyVendorNewLead({
        to,
        locale: loc,
        vendorName: "Studio Lumière",
        contactName: "Aïssa & Marc",
        contactEmail: "couple@example.com",
        contactPhone: "+32 470 11 22 33",
        requestType: "quote",
        weddingDate: "2026-08-15",
        message: "Bonjour, nous adorons votre travail !",
      }, log);
    } else if (type === "conversation") {
      email._resetConversationThrottleForTests();
      await email.notifyConversationMessage({
        to,
        locale: loc,
        senderLabel: "Mariage Afro",
        preview: "Bonjour, votre devis est prêt — rendez-vous dans votre espace pour le consulter.",
        conversationKey: `test:${Date.now()}`,
      }, log);
    } else if (type === "rsvp") {
      await email.notifyCoupleNewRsvp({
        to,
        locale: loc,
        guestName: "Jean-Baptiste Dupont",
        guestEmail: "jb@example.com",
        attending: true,
        guestCount: 2,
        message: "Avec joie, à très vite !",
      }, log);
    } else if (type === "vendor-approved") {
      await email.notifyVendorApproved({
        to,
        locale: loc,
        businessName: "Studio Lumière",
      }, log);
    } else if (type === "partner-received") {
      await email.notifyPartnerApplicationReceived({
        to,
        locale: loc,
        contactName: "Sarah",
        businessName: "Studio Lumière",
        category: "Photographie",
      }, log);
    }
    res.type("html").send(contentLayout("Test envoyé", `<div class="container"><div class="ok">Email \"${type}\" envoyé à ${to} (${loc})${process.env.RESEND_API_KEY ? "" : " — RESEND_API_KEY manquant, l'envoi a été ignoré (voir logs)"}</div><a class="btn secondary" href="/admin/test-email">← Retour</a></div>`));
  } catch (err) {
    log.error({ err, type, to }, "Test email failed");
    res.type("html").send(contentLayout("Erreur", `<div class="container"><div class="err">Échec de l'envoi : ${String((err as Error).message ?? err)}</div><a class="btn secondary" href="/admin/test-email">← Retour</a></div>`));
  }
});

export default router;
