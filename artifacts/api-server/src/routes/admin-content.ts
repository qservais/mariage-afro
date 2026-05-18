import QRCode from "qrcode";
import express, { Router, Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { ObjectStorageService } from "../lib/objectStorage";
import { recordUploadIntent } from "../lib/uploadIntents";
import {
  marketplaceVendorsTable,
  marketplaceVenuesTable,
  realisationsTable,
  messagesTable,
  conversationsTable,
  weddingWebsitesTable,
  couplesTable,
  vendorAccountsTable,
  weddingJourJTable,
} from "@workspace/db";
import { eq, desc, asc, sql, and, isNull, isNotNull } from "drizzle-orm";
import { adminAuth } from "../middlewares/adminAuth";
import { notifyVendorApproved, notifyConversationMessage, notifyVendorInvitation } from "../lib/email";

const router = Router();
router.use(adminAuth);

function escHtml(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function contentLayout(title: string, body: string, toastMsg = ""): string {
  return `<!DOCTYPE html><html lang="fr"><head>
<meta charset="utf-8"><title>${escHtml(title)} — Admin</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;background:#f0ede8;color:#1a1a1a;min-height:100vh;font-size:14px;line-height:1.5}
.topbar{background:#1a1a1a;color:#fff;padding:0 24px;display:flex;align-items:stretch;gap:0;height:50px;position:sticky;top:0;z-index:100;box-shadow:0 1px 3px rgba(0,0,0,.3)}
.topbar a{color:#e8c88a;text-decoration:none;font-size:12px;font-weight:500;opacity:.85;display:flex;align-items:center;padding:0 12px;letter-spacing:.02em;transition:background .15s,opacity .15s}
.topbar a:hover{opacity:1;background:rgba(255,255,255,.07)}
.topbar a.home{font-weight:700;color:#fff;letter-spacing:.04em;padding-right:16px;border-right:1px solid #333}
.container{max-width:1160px;margin:32px auto;padding:0 20px}
h1{font-size:20px;font-weight:700;margin-bottom:24px;letter-spacing:-.01em;color:#111}
h2{font-size:15px;font-weight:600;margin-bottom:14px;color:#222}
.page-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;gap:16px;flex-wrap:wrap}
.page-header h1{margin-bottom:0}
.card{background:#fff;border:1px solid #ddd;padding:28px;margin-bottom:24px;border-radius:6px;box-shadow:0 1px 3px rgba(0,0,0,.04)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:16px;margin-bottom:24px}
.item{background:#fff;border:1px solid #ddd;padding:18px;border-radius:6px;box-shadow:0 1px 2px rgba(0,0,0,.04);transition:box-shadow .15s}
.item:hover{box-shadow:0 3px 8px rgba(0,0,0,.08)}
.item h3{font-size:15px;font-weight:600;margin-bottom:5px;color:#111}
.item p{font-size:13px;color:#555;margin-bottom:7px;line-height:1.45}
.item .meta{font-size:11.5px;color:#888;margin-bottom:12px;display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:4px}
.btn{display:inline-flex;align-items:center;justify-content:center;padding:9px 18px;font-size:13px;font-weight:500;cursor:pointer;border:none;text-decoration:none;border-radius:4px;transition:opacity .15s,transform .1s;white-space:nowrap}
.btn:active{transform:scale(.98)}
.btn.primary{background:#1a1a1a;color:#fff}
.btn.primary:hover{background:#2d2d2d}
.btn.danger{background:#c0392b;color:#fff}
.btn.danger:hover{background:#a93226}
.btn.secondary{background:#e8e4df;color:#1a1a1a;border:1px solid #ccc}
.btn.secondary:hover{background:#ddd8d2}
.btn.sm{padding:5px 12px;font-size:12px;border-radius:3px}
.btn.success{background:#2e8b57;color:#fff}
.btn.success:hover{background:#25704a}
form{display:flex;flex-direction:column;gap:14px}
.form-section{background:#faf9f7;border:1px solid #e8e4df;border-radius:5px;padding:18px 20px;display:flex;flex-direction:column;gap:14px}
.form-section-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#888;margin-bottom:2px}
label{font-size:13px;font-weight:500;display:flex;flex-direction:column;gap:5px;color:#333}
label.inline{flex-direction:row;align-items:center;gap:8px;font-weight:400}
input,textarea,select{padding:9px 11px;border:1px solid #ccc;font-size:14px;font-family:inherit;background:#fff;width:100%;border-radius:4px;color:#1a1a1a;transition:border-color .15s,box-shadow .15s}
input:focus,textarea:focus,select:focus{outline:none;border-color:#e8c88a;box-shadow:0 0 0 3px rgba(232,200,138,.18)}
textarea{resize:vertical;min-height:80px}
.err{background:#fdecea;border:1px solid #e74c3c;padding:12px 16px;font-size:13px;margin-bottom:16px;color:#c0392b;border-radius:4px}
.ok{background:#eafaf1;border:1px solid #2ecc71;padding:12px 16px;font-size:13px;margin-bottom:16px;color:#1d8348;border-radius:4px}
.badge{display:inline-block;padding:2px 9px;font-size:11px;font-weight:600;border-radius:12px;letter-spacing:.02em}
.badge.active{background:#d5f5e3;color:#1d6d3e}
.badge.inactive{background:#f0f0f0;color:#888}
.badge.pending{background:#fef9e7;color:#7d6608}
table{width:100%;border-collapse:collapse;font-size:13px}
th{text-align:left;padding:10px 14px;background:#faf9f7;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#666;border-bottom:2px solid #e8e4df}
td{text-align:left;padding:11px 14px;border-bottom:1px solid #f0ede8}
tbody tr:hover td{background:#faf9f7}
tbody tr:last-child td{border-bottom:none}
.thread{display:flex;flex-direction:column;gap:12px}
.msg{padding:12px 16px;max-width:75%;border-radius:6px}
.msg.couple{background:#f0ede8;align-self:flex-start}
.msg.admin{background:#1a1a1a;color:#fff;align-self:flex-end}
.msg .meta{font-size:11px;opacity:.6;margin-top:4px}
.tabs{display:flex;gap:0;margin-bottom:24px;border-bottom:2px solid #e5e5e5}
.tab{padding:10px 20px;font-size:14px;font-weight:500;cursor:pointer;text-decoration:none;color:#555;border-bottom:2px solid transparent;margin-bottom:-2px}
.tab.active{color:#1a1a1a;border-bottom-color:#e8c88a}
/* Toast */
.toast{position:fixed;bottom:24px;right:24px;background:#1a1a1a;color:#fff;padding:14px 20px;border-radius:6px;font-size:13px;font-weight:500;box-shadow:0 4px 16px rgba(0,0,0,.2);opacity:0;transform:translateY(8px);transition:opacity .3s,transform .3s;z-index:9999;max-width:360px}
.toast.show{opacity:1;transform:translateY(0)}
.toast.success{background:#2e8b57}
.toast.error{background:#c0392b}
/* Upload photos */
.upload-zone{border:2px dashed #ccc;border-radius:6px;padding:24px;text-align:center;background:#faf9f7;cursor:pointer;transition:border-color .2s,background .2s}
.upload-zone:hover,.upload-zone.drag{border-color:#e8c88a;background:#fffbf0}
.upload-zone p{font-size:13px;color:#777;margin-top:6px}
.photo-previews{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px}
.photo-thumb{position:relative;width:80px;height:80px}
.photo-thumb img{width:100%;height:100%;object-fit:cover;border-radius:4px;border:1px solid #ddd}
.photo-thumb .remove-btn{position:absolute;top:-6px;right:-6px;background:#c0392b;color:#fff;border:none;border-radius:50%;width:20px;height:20px;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1}
.upload-progress{font-size:12px;color:#777;margin-top:8px}
.social-field{display:grid;grid-template-columns:24px 1fr;gap:10px;align-items:center}
.social-icon{font-size:18px;text-align:center}
</style>
</head><body>
<div class="topbar">
  <a class="home" href="/admin">Mariage Afro Admin</a>
  <a href="/admin/content/vendors">Partenaires</a>
  <a href="/admin/content/venues">Lieux</a>
  <a href="/admin/content/realisations">Réalisations</a>
  <a href="/admin/content/messages">Messages</a>
  <a href="/admin/content/conversations">Conv. Pro</a>
  <a href="/admin/content/wedding-websites">Sites mariages</a>
  <a href="/admin/content/vendor-accounts">Comptes Pro</a>
</div>
<div class="container">${body}</div>
${toastMsg ? `<div class="toast success show" id="toast">${escHtml(toastMsg)}</div>` : ""}
<script>
(function(){
  var t=document.getElementById("toast");
  if(t){setTimeout(function(){t.classList.remove("show");},4000);}
})();
</script>
</body></html>`;
}

// ============ MARKETPLACE VENDORS ============

router.get("/content/vendors", async (_req: Request, res: Response) => {
  const vendors = await db.select().from(marketplaceVendorsTable).orderBy(asc(marketplaceVendorsTable.name));
  const toast = _req.query.invite_ok ? "Invitation envoyée avec succès." : (_req.query.saved ? "Partenaire enregistré." : "");
  const listHtml = vendors.length === 0
    ? `<p style="color:#888">Aucun partenaire. Cliquez sur "+ Ajouter" pour commencer.</p>`
    : `<div class="grid">${vendors.map(v => `
      <div class="item">
        <h3>${escHtml(v.name)} ${v.verified ? '<span style="color:#2e8b57;font-size:13px">✓</span>' : ""}</h3>
        <p style="font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:#888;margin-bottom:6px">${escHtml(v.category)} · ${escHtml(v.city)}</p>
        <p>${escHtml(v.tagline)}</p>
        <div class="meta">
          <span class="badge ${v.active ? "active" : "inactive"}">${v.active ? "Actif" : "Inactif"}</span>
          <span>${v.services.length} services</span>
          <span>Note: ${v.rating}/5</span>
          ${v.invitedEmail ? `<span>✉ ${escHtml(v.invitedEmail)}</span>` : ""}
        </div>
        <div class="actions">
          <a class="btn sm secondary" href="/admin/content/vendors/${v.id}/edit">Modifier</a>
          <a class="btn sm secondary" href="/admin/devis?vendor_id=${v.id}" title="Voir les devis">Devis</a>
          <form method="post" action="/admin/content/vendors/${v.id}/toggle" style="display:inline">
            <button class="btn sm ${v.active ? "danger" : "success"}" type="submit">${v.active ? "Désactiver" : "Activer"}</button>
          </form>
          <form method="post" action="/admin/content/vendors/${v.id}/delete" style="display:inline" onsubmit="return confirm('Supprimer définitivement ce partenaire ?')">
            <button class="btn sm danger" type="submit">Supprimer</button>
          </form>
        </div>
        <details style="margin-top:12px;border-top:1px solid #eee;padding-top:10px;">
          <summary style="cursor:pointer;font-size:12px;color:#68191e;font-weight:600;letter-spacing:0.05em;">✉ Lier un compte prestataire par email</summary>
          <form method="post" action="/admin/content/vendors/${v.id}/invite" style="margin-top:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            <input type="email" name="invited_email" required placeholder="email@prestataire.be" value="${escHtml(v.invitedEmail ?? "")}" style="flex:1;min-width:200px;">
            <label style="display:flex;align-items:center;gap:4px;font-size:12px;white-space:nowrap;">
              <input type="checkbox" name="send_email" value="1" checked> Envoyer l'email
            </label>
            <button class="btn sm primary" type="submit">Lier</button>
          </form>
          <p style="font-size:11px;color:#888;margin-top:6px;">Le prestataire crée son compte sur /espace-pro/register avec cet email → il est automatiquement lié à cette fiche.</p>
        </details>
      </div>`).join("")}</div>`;

  const body = `
    <div class="page-header">
      <h1>Partenaires Marketplace <span style="font-size:14px;font-weight:400;color:#888">(${vendors.length})</span></h1>
      <a class="btn primary" href="/admin/content/vendors/new">+ Ajouter un partenaire</a>
    </div>
    ${listHtml}`;
  res.type("html").send(contentLayout("Partenaires", body, toast));
});

router.post("/content/vendors/:id/invite", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const invitedEmail = (req.body as Record<string, string>).invited_email?.trim() ?? "";
  const sendEmail = (req.body as Record<string, string>).send_email === "1";
  if (!invitedEmail) { res.redirect("/admin/content/vendors"); return; }
  await db.update(marketplaceVendorsTable)
    .set({ invitedEmail })
    .where(eq(marketplaceVendorsTable.id, id));
  if (sendEmail) {
    const [v] = await db.select({ name: marketplaceVendorsTable.name }).from(marketplaceVendorsTable).where(eq(marketplaceVendorsTable.id, id));
    notifyVendorInvitation({ to: invitedEmail, vendorName: v?.name ?? "votre entreprise", locale: "fr" }, req.log).catch((err) => req.log.error({ err }, "Failed to send vendor invitation email"));
  }
  res.redirect("/admin/content/vendors?invite_ok=1");
});

function vendorForm(v: Partial<{name:string;category:string;city:string;tagline:string;description:string;services:string[];images:string[];website:string|null;phone:string|null;email:string|null;verified:boolean;active:boolean;rating:number;instagram:string|null;facebook:string|null;tiktok:string|null;youtube:string|null;pinterest:string|null}> = {}, error = ""): string {
  const stdCats = ["Photographie","Vidéo","DJ & Animation","Décoration","Traiteur","Coiffure & Maquillage","Robe de mariée","Transport","Invitations","Autre"];
  const isAutre = v.category ? !stdCats.includes(v.category) || v.category === "Autre" : false;
  const selectVal = isAutre && v.category !== "Autre" ? "Autre" : (v.category ?? "Photographie");
  const autreVal = isAutre && v.category !== "Autre" ? (v.category ?? "") : "";
  const imagesJson = JSON.stringify(v.images ?? []).replace(/</g, "\\u003c").replace(/>/g, "\\u003e");
  return `
    ${error ? `<div class="err">${escHtml(error)}</div>` : ""}
    <div class="card">
    <form method="post" id="vendor-form">
      <input type="hidden" name="images" id="images-hidden" value="${escHtml((v.images ?? []).join("\n"))}">

      <div class="form-section">
        <div class="form-section-title">Informations générales</div>
        <label>Nom *<input name="name" required value="${escHtml(v.name)}"></label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
          <label>Catégorie *
            <select name="category" id="category-select" required onchange="onCatChange(this.value)">
              ${stdCats.map(c => `<option value="${escHtml(c)}" ${selectVal===c?"selected":""}>${escHtml(c)}</option>`).join("")}
            </select>
          </label>
          <label>Ville *<input name="city" required value="${escHtml(v.city)}"></label>
        </div>
        <div id="autre-wrap" style="display:${isAutre ? "flex" : "none"};flex-direction:column;gap:5px">
          <label>Nom exact de la catégorie *<input name="category_autre" id="category-autre" placeholder="ex: Wedding planner, Fleuriste…" value="${escHtml(autreVal)}"></label>
        </div>
        <label>Tagline (résumé court)<input name="tagline" value="${escHtml(v.tagline)}"></label>
        <label>Description<textarea name="description" style="min-height:100px">${escHtml(v.description)}</textarea></label>
        <label>Services (un par ligne)<textarea name="services" style="min-height:80px">${(v.services ?? []).join("\n")}</textarea></label>
      </div>

      <div class="form-section">
        <div class="form-section-title">Photos</div>
        <div class="upload-zone" id="upload-zone" onclick="document.getElementById('photo-file-input').click()">
          <div style="font-size:28px">📷</div>
          <p>Cliquez pour ajouter des photos, ou glissez-déposez ici</p>
          <p style="font-size:11px;color:#aaa">JPG, PNG, WEBP — max 10 Mo par fichier</p>
          <input type="file" id="photo-file-input" accept="image/*" multiple style="display:none" onchange="handleFileSelect(this.files)">
        </div>
        <div class="photo-previews" id="photo-previews"></div>
        <div class="upload-progress" id="upload-progress"></div>
        <p style="font-size:11px;color:#aaa;margin-top:4px">Vous pouvez aussi coller des URLs directement :</p>
        <label style="font-size:12px">URLs manuelles (une par ligne)<textarea id="images-manual" style="min-height:60px;font-size:12px" placeholder="https://example.com/photo.jpg" onchange="syncManualUrls()">${(v.images ?? []).filter(u => u.startsWith("http")).join("\n")}</textarea></label>
      </div>

      <div class="form-section">
        <div class="form-section-title">Contact & Web</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
          <label>Site web<input name="website" type="url" placeholder="https://…" value="${escHtml(v.website)}"></label>
          <label>Email<input name="email" type="email" value="${escHtml(v.email)}"></label>
        </div>
        <label>Téléphone<input name="phone" value="${escHtml(v.phone)}"></label>
      </div>

      <div class="form-section">
        <div class="form-section-title">Réseaux sociaux (optionnel)</div>
        <div class="social-field"><span class="social-icon">📸</span><label>Instagram<input name="instagram" placeholder="https://instagram.com/…" value="${escHtml(v.instagram)}"></label></div>
        <div class="social-field"><span class="social-icon">👤</span><label>Facebook<input name="facebook" placeholder="https://facebook.com/…" value="${escHtml(v.facebook)}"></label></div>
        <div class="social-field"><span class="social-icon">🎵</span><label>TikTok<input name="tiktok" placeholder="https://tiktok.com/@…" value="${escHtml(v.tiktok)}"></label></div>
        <div class="social-field"><span class="social-icon">▶️</span><label>YouTube<input name="youtube" placeholder="https://youtube.com/…" value="${escHtml(v.youtube)}"></label></div>
        <div class="social-field"><span class="social-icon">📌</span><label>Pinterest<input name="pinterest" placeholder="https://pinterest.com/…" value="${escHtml(v.pinterest)}"></label></div>
      </div>

      <div class="form-section">
        <div class="form-section-title">Statut & Note</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
          <label>Note (1–5)<input name="rating" type="number" min="1" max="5" value="${v.rating ?? 5}"></label>
          <div style="display:flex;gap:20px;align-items:center;padding-top:20px">
            <label class="inline"><input type="checkbox" name="verified" value="1" ${v.verified?"checked":""}> Vérifié</label>
            <label class="inline"><input type="checkbox" name="active" value="1" ${v.active!==false?"checked":""}> Actif</label>
          </div>
        </div>
      </div>

      <div class="actions">
        <button class="btn primary" type="submit">Enregistrer</button>
        <a class="btn secondary" href="/admin/content/vendors">Annuler</a>
      </div>
    </form>
    </div>

    <script>
    // --- "Autre" category toggle ---
    function onCatChange(val) {
      var wrap = document.getElementById("autre-wrap");
      var inp = document.getElementById("category-autre");
      if (val === "Autre") { wrap.style.display = "flex"; inp.required = true; }
      else { wrap.style.display = "none"; inp.required = false; }
    }

    // --- Photo upload state ---
    var uploadedPaths = ${imagesJson}.filter(function(u){ return !u.startsWith("http"); });
    var manualUrls = ${imagesJson}.filter(function(u){ return u.startsWith("http"); });

    function getAllImages() {
      return uploadedPaths.concat(manualUrls);
    }
    function syncHiddenField() {
      document.getElementById("images-hidden").value = getAllImages().join("\\n");
    }
    function syncManualUrls() {
      var raw = document.getElementById("images-manual").value;
      manualUrls = raw.split("\\n").map(function(s){ return s.trim(); }).filter(function(s){ return s.length > 0; });
      syncHiddenField();
    }
    function safeImgUrl(path) {
      // Only allow /objects/ paths and https:// URLs — block everything else
      if (path.startsWith("/objects/")) return window.location.origin + "/api/storage" + path;
      if (/^https:\/\//i.test(path)) return path;
      return "";
    }
    function renderPreviews() {
      var container = document.getElementById("photo-previews");
      container.innerHTML = "";
      uploadedPaths.forEach(function(path, i) {
        var safeUrl = safeImgUrl(path);
        if (!safeUrl) return;
        var thumb = document.createElement("div");
        thumb.className = "photo-thumb";
        var img = document.createElement("img");
        img.src = safeUrl;
        img.onerror = function(){ img.style.display = "none"; };
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "remove-btn";
        btn.textContent = "×";
        (function(idx){ btn.addEventListener("click", function(){ removeUploaded(idx); }); })(i);
        thumb.appendChild(img);
        thumb.appendChild(btn);
        container.appendChild(thumb);
      });
    }
    function removeUploaded(i) {
      uploadedPaths.splice(i, 1);
      renderPreviews();
      syncHiddenField();
    }
    renderPreviews();
    syncHiddenField();

    // --- Drag & drop ---
    var zone = document.getElementById("upload-zone");
    zone.addEventListener("dragover", function(e){ e.preventDefault(); zone.classList.add("drag"); });
    zone.addEventListener("dragleave", function(){ zone.classList.remove("drag"); });
    zone.addEventListener("drop", function(e){ e.preventDefault(); zone.classList.remove("drag"); handleFileSelect(e.dataTransfer.files); });

    function handleFileSelect(files) {
      if (!files || !files.length) return;
      Array.from(files).forEach(function(file) { uploadFile(file); });
    }
    function uploadFile(file) {
      var progress = document.getElementById("upload-progress");
      progress.textContent = "Envoi en cours…";
      var xhr = new XMLHttpRequest();
      xhr.open("POST", "/admin/content/vendors/upload-photo");
      xhr.setRequestHeader("x-content-type", file.type || "image/jpeg");
      xhr.onload = function() {
        if (xhr.status === 200) {
          var data = JSON.parse(xhr.responseText);
          uploadedPaths.push(data.objectPath);
          renderPreviews();
          syncHiddenField();
          progress.textContent = "";
        } else {
          progress.textContent = "Erreur lors de l\\'upload (" + xhr.status + ")";
        }
      };
      xhr.onerror = function(){ progress.textContent = "Erreur réseau lors de l\\'upload."; };
      xhr.send(file);
    }

    // --- Final form submit: resolve "Autre" category ---
    document.getElementById("vendor-form").addEventListener("submit", function(e) {
      var sel = document.getElementById("category-select");
      var autre = document.getElementById("category-autre");
      if (sel.value === "Autre" && autre.value.trim()) {
        sel.value = autre.value.trim();
      }
    });
    </script>`;
}

// ---- Admin photo upload (no Clerk required — uses adminAuth cookie) ----
const _objectStorageService = new ObjectStorageService();

router.post(
  "/content/vendors/upload-photo",
  express.raw({ type: "*/*", limit: "50mb" }),
  async (req: Request, res: Response) => {
    const body = req.body as Buffer;
    if (!Buffer.isBuffer(body) || body.length === 0) {
      res.status(400).json({ error: "Empty body" });
      return;
    }
    const contentType = (req.headers["x-content-type"] as string) || "image/jpeg";
    try {
      const uploadURL = await _objectStorageService.getObjectEntityUploadURL();
      const objectPath = _objectStorageService.normalizeObjectEntityPath(uploadURL);
      await recordUploadIntent(objectPath, "admin");
      const gcsRes = await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body,
      });
      if (!gcsRes.ok) {
        req.log.error({ status: gcsRes.status }, "Admin photo upload: GCS failed");
        res.status(502).json({ error: "Storage upload failed" });
        return;
      }
      // Consume the intent and set ACL to public so the photo is publicly readable
      const finalPath = await _objectStorageService.trySetObjectEntityAclPolicy(objectPath, {
        owner: "admin",
        visibility: "public",
      });
      res.json({ objectPath: finalPath });
    } catch (err) {
      req.log.error({ err }, "Admin photo upload error");
      res.status(500).json({ error: "Upload failed" });
    }
  },
);

/** Validate an image path: accept /objects/... and https:// URLs only */
function isSafeImagePath(s: string): boolean {
  return s.startsWith("/objects/") || /^https:\/\//i.test(s);
}

/** Validate a social/web URL: must be https:// */
function isSafeUrl(s: string): boolean {
  return /^https:\/\//i.test(s);
}

function parseVendorBody(b: Record<string, string>) {
  const category = b.category === "Autre" && b.category_autre?.trim()
    ? b.category_autre.trim()
    : (b.category ?? "");
  const rawSocial = (field: string) => b[field]?.trim() && isSafeUrl(b[field].trim()) ? b[field].trim() : null;
  return {
    name: b.name ?? "",
    category,
    city: b.city ?? "",
    tagline: b.tagline ?? "",
    description: b.description ?? "",
    services: b.services ? b.services.split("\n").map(s=>s.trim()).filter(Boolean) : [],
    images: b.images
      ? b.images.split("\n").map(s=>s.trim()).filter(s => s && isSafeImagePath(s))
      : [],
    website: b.website?.trim() && isSafeUrl(b.website.trim()) ? b.website.trim() : null,
    phone: b.phone || null,
    email: b.email || null,
    rating: Number(b.rating) || 5,
    verified: b.verified === "1",
    active: b.active === "1",
    instagram: rawSocial("instagram"),
    facebook: rawSocial("facebook"),
    tiktok: rawSocial("tiktok"),
    youtube: rawSocial("youtube"),
    pinterest: rawSocial("pinterest"),
  };
}

router.get("/content/vendors/new", (_req: Request, res: Response) => {
  res.type("html").send(contentLayout("Nouveau partenaire", `<h1>Nouveau partenaire</h1>${vendorForm({active:true, verified:true})}`));
});

router.post("/content/vendors/new", async (req: Request, res: Response) => {
  const b = req.body as Record<string, string>;
  const parsed = parseVendorBody(b);
  if (!parsed.name || !parsed.city || !parsed.category) {
    res.type("html").send(contentLayout("Nouveau partenaire", `<h1>Nouveau partenaire</h1>${vendorForm(b, "Nom, ville et catégorie sont requis.")}`));
    return;
  }
  await db.insert(marketplaceVendorsTable).values(parsed);
  res.redirect("/admin/content/vendors?saved=1");
});

router.get("/content/vendors/:id/edit", async (req: Request, res: Response) => {
  const [v] = await db.select().from(marketplaceVendorsTable).where(eq(marketplaceVendorsTable.id, Number(req.params.id)));
  if (!v) { res.status(404).type("html").send(contentLayout("Introuvable","<p>Introuvable</p>")); return; }
  res.type("html").send(contentLayout("Modifier partenaire", `<h1>Modifier <span style="color:#68191e">${escHtml(v.name)}</span></h1>${vendorForm(v)}`));
});

router.post("/content/vendors/:id/edit", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const b = req.body as Record<string, string>;
  const parsed = parseVendorBody(b);
  await db.update(marketplaceVendorsTable).set(parsed).where(eq(marketplaceVendorsTable.id, id));
  res.redirect("/admin/content/vendors?saved=1");
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
    <div class="page-header">
      <h1>Lieux <span style="font-size:14px;font-weight:400;color:#888">(${venues.length})</span></h1>
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
    <div class="page-header">
      <h1>Réalisations <span style="font-size:14px;font-weight:400;color:#888">(${rows.length})</span></h1>
      <a class="btn primary" href="/admin/content/realisations/new">+ Ajouter une réalisation</a>
    </div>
    ${listHtml}`;
  res.type("html").send(contentLayout("Réalisations", body));
});

function realisationForm(r: Partial<{brideName:string;groomName:string;weddingType:string;venueName:string;city:string;weddingDate:string|null;description:string;coverImage:string|null;gallery:string[];videoCouple:string|null;videoTeaser:string|null;active:boolean;featured:boolean}> = {}, error = ""): string {
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
      <hr style="border:none;border-top:1px solid #e5e5e5;margin:4px 0">
      <p style="font-size:12px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:.06em;">Vidéos (YouTube, Vimeo, ou URL directe)</p>
      <label>🎥 Vidéo portrait du couple (gauche)<input name="videoCouple" type="url" placeholder="https://youtube.com/embed/..." value="${escHtml(r.videoCouple)}"></label>
      <label>🎬 Teaser du mariage (droite)<input name="videoTeaser" type="url" placeholder="https://youtube.com/embed/..." value="${escHtml(r.videoTeaser)}"></label>
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
    videoCouple: b.videoCouple || null,
    videoTeaser: b.videoTeaser || null,
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
    videoCouple: b.videoCouple || null,
    videoTeaser: b.videoTeaser || null,
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

async function ensureAdminConversation(coupleId: number): Promise<number> {
  const [existing] = await db.select().from(conversationsTable)
    .where(and(eq(conversationsTable.coupleId, coupleId), isNull(conversationsTable.vendorId)))
    .limit(1);
  if (existing) {
    await db.update(messagesTable)
      .set({ conversationId: existing.id })
      .where(and(eq(messagesTable.coupleId, coupleId), isNull(messagesTable.conversationId)));
    return existing.id;
  }
  const [created] = await db.insert(conversationsTable)
    .values({ coupleId, vendorId: null, lastMessageAt: new Date() })
    .returning();
  await db.update(messagesTable)
    .set({ conversationId: created.id })
    .where(and(eq(messagesTable.coupleId, coupleId), isNull(messagesTable.conversationId)));
  return created.id;
}

router.get("/content/messages", async (_req: Request, res: Response) => {
  // Admin↔couple threads only
  const couples = await db
    .select({
      id: couplesTable.id,
      partner1Name: couplesTable.partner1Name,
      partner2Name: couplesTable.partner2Name,
    })
    .from(couplesTable)
    .orderBy(desc(couplesTable.updatedAt));

  const unreadRows = await db
    .select({
      coupleId: conversationsTable.coupleId,
      unread: sql<number>`count(case when ${messagesTable.authorRole} = 'couple' and ${messagesTable.readAt} is null then 1 end)`.as("unread"),
    })
    .from(conversationsTable)
    .leftJoin(messagesTable, eq(messagesTable.conversationId, conversationsTable.id))
    .where(isNull(conversationsTable.vendorId))
    .groupBy(conversationsTable.coupleId);
  const unreadMap = new Map(unreadRows.map((r) => [r.coupleId, Number(r.unread) || 0]));

  const listHtml = couples.length === 0
    ? `<p style="color:#888">Aucun couple inscrit.</p>`
    : `<table><thead><tr><th>Couple</th><th>Messages non lus</th><th></th></tr></thead><tbody>
      ${couples.map(c => {
        const unread = unreadMap.get(c.id) ?? 0;
        return `<tr>
          <td>${escHtml(c.partner1Name || "—")} & ${escHtml(c.partner2Name || "—")}</td>
          <td>${unread > 0 ? `<span class="badge active">${unread} nouveaux</span>` : "—"}</td>
          <td><a class="btn sm secondary" href="/admin/content/messages/${c.id}">Voir la conversation</a></td>
        </tr>`;
      }).join("")}
      </tbody></table>
      <div style="margin-top:32px"><a class="btn secondary sm" href="/admin/content/conversations">→ Conversations Couple ↔ Prestataire (modération)</a></div>`;

  res.type("html").send(contentLayout("Messages", `<h1>Messages couples (admin)</h1>${listHtml}`));
});

router.get("/content/messages/:coupleId", async (req: Request, res: Response) => {
  const coupleId = Number(req.params.coupleId);
  const [couple] = await db.select().from(couplesTable).where(eq(couplesTable.id, coupleId));
  if (!couple) { res.status(404).type("html").send(contentLayout("Introuvable","<p>Introuvable</p>")); return; }

  const convId = await ensureAdminConversation(coupleId);

  const messages = await db.select().from(messagesTable)
    .where(eq(messagesTable.conversationId, convId))
    .orderBy(asc(messagesTable.createdAt));

  await db.update(messagesTable)
    .set({ readAt: new Date() })
    .where(and(eq(messagesTable.conversationId, convId), isNull(messagesTable.readAt)));

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
  const convId = await ensureAdminConversation(coupleId);
  const now = new Date();
  await db.insert(messagesTable).values({
    coupleId,
    conversationId: convId,
    authorRole: "admin",
    content: content.trim(),
  });
  await db.update(conversationsTable).set({ lastMessageAt: now }).where(eq(conversationsTable.id, convId));

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

// ============ CONVERSATIONS COUPLE ↔ VENDOR (modération lecture seule) ============

router.get("/content/conversations", async (_req: Request, res: Response) => {
  const rows = await db
    .select({
      id: conversationsTable.id,
      coupleId: conversationsTable.coupleId,
      vendorId: conversationsTable.vendorId,
      lastMessageAt: conversationsTable.lastMessageAt,
      partner1Name: couplesTable.partner1Name,
      partner2Name: couplesTable.partner2Name,
      vendorName: marketplaceVendorsTable.name,
      vendorCategory: marketplaceVendorsTable.category,
    })
    .from(conversationsTable)
    .leftJoin(couplesTable, eq(couplesTable.id, conversationsTable.coupleId))
    .leftJoin(marketplaceVendorsTable, eq(marketplaceVendorsTable.id, conversationsTable.vendorId))
    .where(isNotNull(conversationsTable.vendorId))
    .orderBy(desc(conversationsTable.lastMessageAt));

  const listHtml = rows.length === 0
    ? `<p style="color:#888">Aucune conversation couple ↔ prestataire.</p>`
    : `<table><thead><tr><th>Couple</th><th>Prestataire</th><th>Dernier message</th><th></th></tr></thead><tbody>
      ${rows.map(r => `<tr>
        <td>${escHtml(r.partner1Name || "—")} & ${escHtml(r.partner2Name || "—")}</td>
        <td>${escHtml(r.vendorName || "—")} <span style="color:#888;font-size:11px">${escHtml(r.vendorCategory || "")}</span></td>
        <td style="font-size:12px;color:#666">${new Date(r.lastMessageAt).toLocaleString("fr-BE")}</td>
        <td><a class="btn sm secondary" href="/admin/content/conversations/${r.id}">Voir (lecture seule)</a></td>
      </tr>`).join("")}
      </tbody></table>`;

  const body = `
    <h1>Conversations Couple ↔ Prestataire</h1>
    <p style="font-size:13px;color:#555;margin-bottom:16px">Vue de modération en lecture seule. Pour répondre à un couple en tant qu'équipe Mariage Afro, utilisez <a href="/admin/content/messages">Messages</a>.</p>
    ${listHtml}`;
  res.type("html").send(contentLayout("Conversations Couple ↔ Pro", body));
});

router.get("/content/conversations/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const [conv] = await db
    .select({
      id: conversationsTable.id,
      coupleId: conversationsTable.coupleId,
      vendorId: conversationsTable.vendorId,
      partner1Name: couplesTable.partner1Name,
      partner2Name: couplesTable.partner2Name,
      vendorName: marketplaceVendorsTable.name,
    })
    .from(conversationsTable)
    .leftJoin(couplesTable, eq(couplesTable.id, conversationsTable.coupleId))
    .leftJoin(marketplaceVendorsTable, eq(marketplaceVendorsTable.id, conversationsTable.vendorId))
    .where(eq(conversationsTable.id, id))
    .limit(1);
  if (!conv) { res.status(404).type("html").send(contentLayout("Introuvable","<p>Introuvable</p>")); return; }

  const messages = await db.select().from(messagesTable)
    .where(eq(messagesTable.conversationId, id))
    .orderBy(asc(messagesTable.createdAt));

  const threadHtml = messages.length === 0
    ? `<p style="color:#888">Aucun message.</p>`
    : `<div class="thread">${messages.map(m => {
        const cls = m.authorRole === "couple" ? "couple" : "admin";
        const who = m.authorRole === "couple" ? "Couple" : (m.authorRole === "vendor" ? "Prestataire" : "Admin");
        return `<div class="msg ${cls}">
          <div>${escHtml(m.content)}</div>
          <div class="meta">${escHtml(who)} · ${new Date(m.createdAt).toLocaleString("fr-BE")}</div>
        </div>`;
      }).join("")}</div>`;

  res.type("html").send(contentLayout(
    `Conversation ${conv.partner1Name} ↔ ${conv.vendorName}`,
    `<h1>${escHtml(conv.partner1Name || "—")} & ${escHtml(conv.partner2Name || "—")} ↔ ${escHtml(conv.vendorName || "—")}</h1>
     <a class="btn secondary sm" href="/admin/content/conversations" style="margin-bottom:20px;display:inline-block">← Retour</a>
     <p style="font-size:12px;color:#888;margin-bottom:16px">Lecture seule — vous ne pouvez pas répondre dans cette conversation.</p>
     ${threadHtml}`
  ));
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
        <td style="white-space:nowrap">
          <form method="post" action="/admin/content/wedding-websites/${r.id}/toggle" style="display:inline">
            <button class="btn sm ${r.active?"danger":"success"}" type="submit">${r.active?"Dépublier":"Publier"}</button>
          </form>
          <a class="btn sm secondary" href="/admin/content/wedding-websites/${escHtml(r.slug)}/jour-j" style="margin-left:6px">Page Jour-J</a>
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

// ============ JOUR-J PUBLIC PAGE (admin config) ============

router.get("/content/wedding-websites/:slug/jour-j", async (req: Request, res: Response) => {
  const slug = String(req.params.slug);
  const [site] = await db
    .select({ id: weddingWebsitesTable.id, slug: weddingWebsitesTable.slug, title: weddingWebsitesTable.title, coupleId: weddingWebsitesTable.coupleId })
    .from(weddingWebsitesTable)
    .where(eq(weddingWebsitesTable.slug, slug));
  if (!site) { res.status(404).type("html").send(contentLayout("Introuvable", "<p>Site non trouvé</p>")); return; }

  const [couple] = await db
    .select({ partner1Name: couplesTable.partner1Name, partner2Name: couplesTable.partner2Name })
    .from(couplesTable).where(eq(couplesTable.id, site.coupleId)).limit(1);

  const [config] = await db.select().from(weddingJourJTable)
    .where(eq(weddingJourJTable.weddingWebsiteId, site.id)).limit(1);

  const publicUrl = `${process.env.PUBLIC_APP_URL || ""}/mariage/${site.slug}/jour-j`;
  const qrDataUrl = await QRCode.toDataURL(publicUrl, {
    width: 200,
    color: { dark: "#68191e", light: "#fff4e4" },
    margin: 2,
  });

  const c = config ?? { menuText: "", timeline: [], bioPartner1: "", bioPartner2: "", driveUrl: "", enabled: false };
  const timelineJson = JSON.stringify(c.timeline ?? []).replace(/</g, "\\u003c");

  const body = `
    <h1>Page Jour-J — ${escHtml(couple?.partner1Name || "—")} &amp; ${escHtml(couple?.partner2Name || "—")}</h1>
    <a class="btn secondary sm" href="/admin/content/wedding-websites" style="margin-bottom:24px;display:inline-block">← Retour aux sites</a>
    <div style="display:flex;gap:32px;flex-wrap:wrap;align-items:flex-start">
      <div class="card" style="flex:1;min-width:320px">
        <h2>Configuration</h2>
        <form method="post">
          <label>
            <input type="checkbox" name="enabled" value="1" ${c.enabled ? "checked" : ""}> Page activée (visible par les invités)
          </label>
          <label>Menu du repas<textarea name="menuText" rows="6" placeholder="Entrée : Velouté…">${escHtml(c.menuText)}</textarea></label>
          <label>Bio partenaire 1<textarea name="bioPartner1" rows="4" placeholder="Quelques mots…">${escHtml(c.bioPartner1)}</textarea></label>
          <label>Bio partenaire 2<textarea name="bioPartner2" rows="4" placeholder="Quelques mots…">${escHtml(c.bioPartner2)}</textarea></label>
          <label>Lien Google Drive (photos partagées)<input type="url" name="driveUrl" value="${escHtml(c.driveUrl || "")}" placeholder="https://drive.google.com/drive/folders/…"></label>
          <label>Programme de la journée (JSON)<br><small style="color:#666">Format : [{"time":"10:00","label":"Cérémonie"}]</small>
            <textarea name="timeline" rows="6" placeholder='[{"time":"10:00","label":"Cérémonie"}]'>${escHtml(timelineJson)}</textarea>
          </label>
          <button class="btn primary" type="submit">Enregistrer</button>
        </form>
      </div>
      <div class="card" style="min-width:240px;text-align:center">
        <h2>QR Code invités</h2>
        <p style="font-size:12px;color:#555;margin-bottom:12px">Pointe vers :<br><a href="${escHtml(publicUrl)}" target="_blank" style="font-size:11px;word-break:break-all">${escHtml(publicUrl)}</a></p>
        <img src="${qrDataUrl}" alt="QR Code" width="200" height="200" style="display:block;margin:0 auto 12px;border:4px solid #fff4e4">
        <a class="btn sm secondary" href="${qrDataUrl}" download="qr-jour-j-${escHtml(site.slug)}.png">Télécharger le QR</a>
        <div style="margin-top:12px">
          <a class="btn sm success" href="${escHtml(publicUrl)}" target="_blank">Voir la page publique →</a>
        </div>
      </div>
    </div>`;

  res.type("html").send(contentLayout(`Jour-J — ${site.slug}`, body));
});

router.post("/content/wedding-websites/:slug/jour-j", async (req: Request, res: Response) => {
  const slug = String(req.params.slug);
  const [site] = await db
    .select({ id: weddingWebsitesTable.id })
    .from(weddingWebsitesTable)
    .where(eq(weddingWebsitesTable.slug, slug));
  if (!site) { res.redirect("/admin/content/wedding-websites"); return; }

  const body = req.body as Record<string, string>;
  const enabled = body.enabled === "1";
  const menuText = (body.menuText || "").trim();
  const bioPartner1 = (body.bioPartner1 || "").trim();
  const bioPartner2 = (body.bioPartner2 || "").trim();
  const rawDriveUrl = (body.driveUrl || "").trim();
  const driveUrl = rawDriveUrl && rawDriveUrl.startsWith("https://") ? rawDriveUrl : null;

  let timeline: { time: string; label: string }[] = [];
  try {
    const parsed = JSON.parse(body.timeline || "[]");
    if (Array.isArray(parsed)) {
      timeline = parsed.filter((s) => s && typeof s.time === "string" && typeof s.label === "string")
        .map((s) => ({ time: String(s.time).slice(0, 20), label: String(s.label).slice(0, 300) }));
    }
  } catch { /* ignore bad JSON */ }

  const [existing] = await db.select().from(weddingJourJTable)
    .where(eq(weddingJourJTable.weddingWebsiteId, site.id)).limit(1);

  const vals = { enabled, menuText, bioPartner1, bioPartner2, driveUrl, timeline, updatedAt: new Date() };
  if (existing) {
    await db.update(weddingJourJTable).set(vals).where(eq(weddingJourJTable.id, existing.id));
  } else {
    await db.insert(weddingJourJTable).values({ weddingWebsiteId: site.id, ...vals });
  }

  res.redirect(`/admin/content/wedding-websites/${slug}/jour-j`);
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
    .set({ status: "approved", validatedAt: new Date(), updatedAt: new Date() })
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

router.use("/test-email", (_req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === "production") {
    res.status(404).type("html").send("Not found");
    return;
  }
  next();
});

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
