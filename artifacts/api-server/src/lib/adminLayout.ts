/**
 * Unified admin layout — single sidebar shell shared by admin.ts and admin-content.ts.
 *
 * Drop-in replacements (same call signatures as before):
 *   adminLayout(title, body, showNav, pendingBadge, csrfToken, section)
 *     ← replaces the old local `layout()` in admin.ts
 *   adminContentLayout(title, body, toastMsg, csrfToken, currentPath)
 *     ← replaces the old local `contentLayout()` in admin-content.ts
 */

import { CSRF_FIELD, csrfAutoInjectorScript } from "../middlewares/adminCsrf";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Map admin-content.ts currentPath values to canonical section identifiers. */
function contentPathToSection(path: string): string {
  if (path.startsWith("/content/vendor-accounts")) return "vendor-accounts";
  if (path.startsWith("/content/partner-applications")) return "partner-applications";
  if (path.startsWith("/content/vendors")) return "vendors";
  if (path.startsWith("/content/venues")) return "venues";
  if (path.startsWith("/content/realisations")) return "realisations";
  if (path.startsWith("/content/couples")) return "content-couples";
  if (path.startsWith("/content/messages")) return "messages";
  if (path.startsWith("/content/conversations")) return "conversations";
  if (path.startsWith("/content/wedding-websites")) return "wedding-websites";
  return "";
}

// ─── CSS ─────────────────────────────────────────────────────────────────────

const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;background:#f0ede8;color:#1a1a1a;min-height:100vh;font-size:14px;line-height:1.5}
a{color:#68191e;text-decoration:none}
a:hover{text-decoration:underline}

/* ── Shell layout ─────────────────────────────────────────────────────────── */
.shell{display:flex;min-height:100vh}
.sidebar{width:216px;background:#1a1a1a;color:#e8e4de;display:flex;flex-direction:column;flex-shrink:0;position:sticky;top:0;height:100vh;overflow-y:auto}
.sidebar-brand{padding:18px 16px 14px;border-bottom:1px solid #2a2a2a}
.sidebar-brand a{color:#fff;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;text-decoration:none;display:block;line-height:1.3}
.sidebar-brand a:hover{opacity:.8;text-decoration:none}
.sidebar-brand .sub{color:#555;font-size:10px;letter-spacing:.1em;text-transform:uppercase;margin-top:3px}
.sidebar-nav{flex:1;padding:8px 0;overflow-y:auto}
.nav-group{margin-bottom:4px}
.nav-group-label{padding:10px 14px 3px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#4a4a4a}
.nav-item{display:flex;align-items:center;padding:7px 14px;font-size:12.5px;color:#999;text-decoration:none;transition:background .1s,color .1s;white-space:nowrap;cursor:pointer}
.nav-item:hover{background:#252525;color:#e8e4de;text-decoration:none}
.nav-item.active{background:#68191e;color:#fff4e4;font-weight:600}
.nav-item.active:hover{background:#7a1e23;text-decoration:none}
.nav-badge{background:#c08800;color:#fff;padding:1px 6px;font-size:10px;font-weight:700;border-radius:10px;margin-left:auto;min-width:18px;text-align:center;line-height:1.6}
.sidebar-footer{padding:12px 14px;border-top:1px solid #2a2a2a}
.sidebar-footer form{display:block}
.sidebar-footer button{width:100%;padding:7px;background:none;border:1px solid #333;color:#666;font-size:11px;text-transform:uppercase;letter-spacing:.08em;cursor:pointer;font-family:inherit;transition:border-color .15s,color .15s;border-radius:3px}
.sidebar-footer button:hover{border-color:#666;color:#aaa}
.main{flex:1;min-width:0;display:flex;flex-direction:column;overflow-x:auto}
.main-inner{flex:1;padding:28px 32px;max-width:1260px;width:100%;margin:0 auto}

/* ── Stats cards ──────────────────────────────────────────────────────────── */
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:28px}
.stat{background:#fff;border:1px solid #e8d9bf;padding:20px}
.stat .lbl{font-size:11px;text-transform:uppercase;letter-spacing:.2em;color:#888;margin-bottom:8px}
.stat .val{font-size:32px;font-weight:700;color:#68191e}

/* ── Content cards ────────────────────────────────────────────────────────── */
.card{background:#fff;border:1px solid #ddd;padding:28px;margin-bottom:24px;border-radius:6px;box-shadow:0 1px 3px rgba(0,0,0,.04)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:16px;margin-bottom:24px}
.item{background:#fff;border:1px solid #ddd;padding:18px;border-radius:6px;box-shadow:0 1px 2px rgba(0,0,0,.04);transition:box-shadow .15s}
.item:hover{box-shadow:0 3px 8px rgba(0,0,0,.09)}
.item h3{font-size:15px;font-weight:600;margin-bottom:5px;color:#111}
.item p{font-size:13px;color:#555;margin-bottom:7px;line-height:1.45}
.item .meta{font-size:11.5px;color:#888;margin-bottom:12px;display:flex;flex-wrap:wrap;gap:6px;align-items:center}

/* ── Container & page header ──────────────────────────────────────────────── */
.container{max-width:1200px;margin:0 auto;padding:32px}
h1{font-size:20px;font-weight:700;margin-bottom:24px;letter-spacing:-.01em;color:#111}
h2{font-size:15px;font-weight:600;margin-bottom:14px;color:#222}
.page-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;gap:16px;flex-wrap:wrap}
.page-header h1{margin-bottom:0}

/* ── Filters ──────────────────────────────────────────────────────────────── */
.filters{background:#fff;border:1px solid #e8d9bf;padding:14px 18px;margin-bottom:16px;display:flex;gap:20px;flex-wrap:wrap;align-items:center}
.filters label{font-size:11px;text-transform:uppercase;letter-spacing:.15em;color:#666;font-weight:600;margin-right:6px}
.filters select,.filters input{padding:6px 10px;border:1px solid #ddd;font-family:inherit;font-size:13px;background:#fff}
.filters .reset{margin-left:auto;font-size:12px;color:#68191e}

/* ── Table ────────────────────────────────────────────────────────────────── */
table{width:100%;border-collapse:collapse;font-size:13px}
th{text-align:left;padding:10px 16px;background:#fff4e4;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#666;border-bottom:2px solid #e8d9bf}
td{text-align:left;padding:11px 16px;border-bottom:1px solid #f0ede8}
tbody tr:hover td{background:#fffaf2}
tbody tr:last-child td{border-bottom:none}

/* ── Badges ───────────────────────────────────────────────────────────────── */
.badge{display:inline-block;padding:2px 9px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em}
.badge.type-lead{background:#fff4e4;color:#68191e;border:1px solid #68191e}
.badge.type-vendor{background:#eef0ff;color:#3a3f8a;border:1px solid #3a3f8a}
.badge.type-venue{background:#e9f4ec;color:#2e6b3f;border:1px solid #2e6b3f}
.badge.type-partner{background:#f8e9eb;color:#a02335;border:1px solid #a02335}
.badge.status-new{background:#fff;color:#68191e;border:1px solid #68191e}
.badge.status-in_progress{background:#fff8e1;color:#c08800;border:1px solid #c08800}
.badge.status-done{background:#e8f5e9;color:#2e7d32;border:1px solid #2e7d32}
.badge.active{background:#d5f5e3;color:#1d6d3e;border-radius:12px}
.badge.inactive{background:#f0f0f0;color:#888;border-radius:12px}
.badge.pending{background:#fef9e7;color:#7d6608;border-radius:12px}

/* ── Buttons ──────────────────────────────────────────────────────────────── */
.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}
.btn{display:inline-flex;align-items:center;justify-content:center;padding:8px 18px;font-size:12px;font-weight:600;cursor:pointer;border:1px solid #68191e;background:#fff;color:#68191e;font-family:inherit;text-transform:uppercase;letter-spacing:.1em;transition:background .15s,color .15s;text-decoration:none;white-space:nowrap;border-radius:0}
.btn:hover{background:#68191e;color:#fff;text-decoration:none}
.btn.primary{background:#68191e;color:#fff}
.btn.primary:hover{background:#4d1216}
.btn.danger{background:#c0392b;color:#fff;border-color:#c0392b}
.btn.danger:hover{background:#a93226}
.btn.secondary{background:#e8e4df;color:#1a1a1a;border-color:#ccc}
.btn.secondary:hover{background:#ddd8d2}
.btn.success{background:#2e8b57;color:#fff;border-color:#2e8b57}
.btn.success:hover{background:#25704a}
.btn.sm{padding:5px 12px;font-size:11px}

/* ── Forms ────────────────────────────────────────────────────────────────── */
form{display:flex;flex-direction:column;gap:14px}
.form-section{background:#faf9f7;border:1px solid #e8e4df;border-radius:5px;padding:18px 20px;display:flex;flex-direction:column;gap:14px}
.form-section-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#888;margin-bottom:2px}
label{font-size:13px;font-weight:500;display:flex;flex-direction:column;gap:5px;color:#333}
label.inline{flex-direction:row;align-items:center;gap:8px;font-weight:400}
input,textarea,select{padding:9px 11px;border:1px solid #ccc;font-size:14px;font-family:inherit;background:#fff;width:100%;border-radius:4px;color:#1a1a1a;transition:border-color .15s}
input:focus,textarea:focus,select:focus{outline:none;border-color:#e8c88a;box-shadow:0 0 0 3px rgba(232,200,138,.15)}
textarea{resize:vertical;min-height:80px}
.err{background:#fdecea;border:1px solid #e74c3c;padding:12px 16px;font-size:13px;margin-bottom:16px;color:#c0392b;border-radius:4px}
.ok{background:#eafaf1;border:1px solid #2ecc71;padding:12px 16px;font-size:13px;margin-bottom:16px;color:#1d8348;border-radius:4px}

/* ── Pagination ───────────────────────────────────────────────────────────── */
.pagination{margin-top:20px;display:flex;justify-content:center;gap:10px;font-size:13px}
.pagination a,.pagination span{padding:6px 12px;border:1px solid #e8d9bf;background:#fff}
.pagination .current{background:#68191e;color:#fff4e4;border-color:#68191e}

/* ── Detail pages ─────────────────────────────────────────────────────────── */
.detail-card{background:#fff;border:1px solid #e8d9bf;padding:28px;margin-bottom:24px}
.detail-card h2{font-size:20px;color:#68191e;margin-bottom:16px;font-weight:700}
.field{margin-bottom:14px}
.field-lbl{font-size:11px;text-transform:uppercase;letter-spacing:.15em;color:#888;font-weight:600;margin-bottom:4px}
.field-val{font-size:14px;line-height:1.5;white-space:pre-wrap;word-break:break-word}

/* ── Message threads ──────────────────────────────────────────────────────── */
.thread{display:flex;flex-direction:column;gap:12px}
.msg{padding:12px 16px;max-width:75%;border-radius:6px}
.msg.couple{background:#f0ede8;align-self:flex-start}
.msg.admin{background:#1a1a1a;color:#fff;align-self:flex-end}
.msg .meta{font-size:11px;opacity:.6;margin-top:4px}

/* ── In-page tabs ─────────────────────────────────────────────────────────── */
.tabs{display:flex;gap:0;margin-bottom:24px;border-bottom:2px solid #e8d9bf}
.tab{padding:10px 20px;font-size:13px;font-weight:500;cursor:pointer;text-decoration:none;color:#555;border-bottom:2px solid transparent;margin-bottom:-2px;transition:color .15s}
.tab:hover{color:#68191e;text-decoration:none}
.tab.active{color:#68191e;border-bottom-color:#68191e;font-weight:600}

/* ── Upload zone ──────────────────────────────────────────────────────────── */
.upload-zone{border:2px dashed #ccc;border-radius:6px;padding:24px;text-align:center;background:#faf9f7;cursor:pointer;transition:border-color .2s,background .2s}
.upload-zone:hover,.upload-zone.drag{border-color:#e8c88a;background:#fffbf0}
.upload-zone p{font-size:13px;color:#777;margin-top:6px}
.photo-previews{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px}
.photo-thumb{position:relative;width:80px;height:80px}
.photo-thumb img{width:100%;height:100%;object-fit:cover;border-radius:4px;border:1px solid #ddd}
.photo-thumb .remove-btn{position:absolute;top:-6px;right:-6px;background:#c0392b;color:#fff;border:none;border-radius:50%;width:20px;height:20px;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1}

/* ── Toast notification ───────────────────────────────────────────────────── */
.toast{position:fixed;bottom:24px;right:24px;background:#1a1a1a;color:#fff;padding:14px 20px;border-radius:6px;font-size:13px;font-weight:500;box-shadow:0 4px 16px rgba(0,0,0,.2);opacity:0;transform:translateY(8px);transition:opacity .3s,transform .3s;z-index:9999;max-width:360px}
.toast.show{opacity:1;transform:translateY(0)}
.toast.success{background:#2e8b57}
.toast.error{background:#c0392b}

/* ── Empty state ──────────────────────────────────────────────────────────── */
.empty{text-align:center;padding:48px;color:#888;font-size:13px}

/* ── Login page (no sidebar) ──────────────────────────────────────────────── */
.login-page{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#fff4e4}
.login-card{background:#fff;border:1px solid #e8d9bf;padding:40px;width:100%;max-width:380px}
.login-card h1{color:#68191e;margin-bottom:24px;font-size:22px;text-align:center}
.login-card input{width:100%;padding:12px;border:1px solid #ddd;font-family:inherit;font-size:14px;margin-bottom:14px}
.login-card .btn{width:100%;justify-content:center}
.err{color:#c01a1a;font-size:13px;margin-bottom:12px;text-align:center}
`;

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function sidebar(section: string, pendingBadge: number, csrfToken: string): string {
  const li = (href: string, label: string, sec: string, badge = 0) => {
    const isActive = section === sec;
    const cls = `nav-item${isActive ? " active" : ""}`;
    const ariaCurrent = isActive ? ' aria-current="page"' : "";
    const badgeHtml = badge > 0 ? `<span class="nav-badge">${badge}</span>` : "";
    return `<a href="${href}" class="${cls}"${ariaCurrent}>${label}${badgeHtml}</a>`;
  };
  return `
<aside class="sidebar" aria-label="Navigation administration">
  <div class="sidebar-brand">
    <a href="/admin">Mariage Afro · Admin</a>
    <div class="sub">Backoffice</div>
  </div>
  <nav class="sidebar-nav">
    <div class="nav-group">
      <div class="nav-group-label">Acquisition</div>
      ${li("/admin", "Demandes", "leads")}
      ${li("/admin/reviews", "Avis", "reviews")}
      ${li("/admin/devis", "Devis", "devis")}
    </div>
    <div class="nav-group">
      <div class="nav-group-label">Comptes</div>
      ${li("/admin/accounts", "Validation", "accounts", pendingBadge)}
      ${li("/admin/couples", "Couples", "couples")}
      ${li("/admin/subscriptions", "Abonnements", "subscriptions")}
      ${li("/admin/content/vendor-accounts", "Comptes Pro", "vendor-accounts")}
      ${li("/admin/content/partner-applications", "Candidatures", "partner-applications")}
    </div>
    <div class="nav-group">
      <div class="nav-group-label">Contenu</div>
      ${li("/admin/content/vendors", "Prestataires", "vendors")}
      ${li("/admin/content/venues", "Lieux", "venues")}
      ${li("/admin/content/realisations", "Réalisations", "realisations")}
    </div>
    <div class="nav-group">
      <div class="nav-group-label">Communication</div>
      ${li("/admin/content/couples", "Couples & Sites web", "content-couples")}
      ${li("/admin/content/messages", "Messages", "messages")}
      ${li("/admin/content/conversations", "Conv. Pro", "conversations")}
      ${li("/admin/content/wedding-websites", "Sites mariages", "wedding-websites")}
    </div>
  </nav>
  <div class="sidebar-footer">
    <form method="POST" action="/admin/logout" style="display:block">
      <input type="hidden" name="${CSRF_FIELD}" value="${esc(csrfToken)}">
      <button type="submit">Déconnexion</button>
    </form>
  </div>
</aside>`;
}

// ─── Core shell ───────────────────────────────────────────────────────────────

function shell(
  title: string,
  body: string,
  section: string,
  opts: {
    showNav?: boolean;
    pendingBadge?: number;
    csrfToken?: string;
    toast?: string;
  } = {}
): string {
  const { showNav = true, pendingBadge = 0, csrfToken = "", toast = "" } = opts;
  const csrfMeta = csrfToken ? `<meta name="csrf-token" content="${esc(csrfToken)}">` : "";
  const toastHtml = toast
    ? `<div class="toast" id="__toast" role="status" aria-live="polite">${esc(toast)}</div>
<script>window.addEventListener('load',function(){var t=document.getElementById('__toast');if(t){t.classList.add('show');setTimeout(function(){t.classList.remove('show');},3200);}});</script>`
    : "";

  const head = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} — Mariage Afro Admin</title>${csrfMeta}<style>${CSS}</style><script>${csrfAutoInjectorScript}</script></head>`;

  if (!showNav) {
    return `${head}<body>${body}${toastHtml}</body></html>`;
  }

  return `${head}<body>
<div class="shell">
  ${sidebar(section, pendingBadge, csrfToken)}
  <div class="main">
    <main id="main-content" class="main-inner">${body}</main>
  </div>
</div>
${toastHtml}
</body></html>`;
}

// ─── Public exports ───────────────────────────────────────────────────────────

/**
 * Drop-in replacement for the old local `layout()` in admin.ts.
 * Signature is identical — no call sites need to change.
 */
export function adminLayout(
  title: string,
  body: string,
  showNav = true,
  pendingBadge = 0,
  csrfToken = "",
  section = ""
): string {
  return shell(title, body, section, { showNav, pendingBadge, csrfToken });
}

/**
 * Drop-in replacement for the old local `contentLayout()` in admin-content.ts.
 * Signature is identical — no call sites need to change.
 */
export function adminContentLayout(
  title: string,
  body: string,
  toastMsg = "",
  csrfToken = "",
  currentPath = ""
): string {
  return shell(title, body, contentPathToSection(currentPath), { csrfToken, toast: toastMsg });
}
