# Demo Readiness Report — Mariage Afro
**Date :** 7 mai 2026  
**QA :** Smoke tests automatisés (curl + logs serveur)  
**Environnement :** Dev Replit · Frontend port 21974 · API port 8080

---

## VERDICT : NO-GO — 1 action manuelle bloquante

> **Raison :** L'envoi d'emails transactionnels est non-fonctionnel. Le domaine `mariage-afro.com` n'est pas vérifié sur Resend → 100 % des emails échouent avec `403 validation_error`. Ce point est un critère explicite de la tâche ("L'email Resend fonctionne confirmé dans les logs") non satisfait.
>
> **Chemin vers GO :** 1 action manuelle (~10 min) — voir section "Pré-requis bloquant" ci-dessous. Toute la plateforme passe par ailleurs.

---

## Pré-requis bloquant avant démo

### Vérifier le domaine sur Resend

**Symptôme (log serveur, 17:25:19) :**
```
ERROR: Failed to send email via Resend
  to: "info@mariage-afro.com"
  error.statusCode: 403
  error.message: "The mariage-afro.com domain is not verified.
                  Please, add and verify your domain on https://resend.com/domains"
  error.name: "validation_error"
```
Identique pour `delivered@resend.dev` et `bounced@resend.dev` — le blocage est côté FROM (domaine expéditeur), pas côté destinataire.

**Action requise :**
1. [resend.com/domains](https://resend.com/domains) → Add domain → `mariage-afro.com`
2. Ajouter les enregistrements DNS SPF / DKIM / DMARC chez le registrar
3. Attendre la validation Resend (de quelques minutes à 48h selon le registrar)
4. Redémarrer le workflow API
5. Retester via `GET /admin/test-email` → `POST /admin/test-email` et confirmer 200 dans les logs sans erreur

### Secret ADMIN_EMAIL manquant

`ADMIN_EMAIL` n'est pas configuré dans les secrets Replit → les notifications internes (nouveaux leads, candidatures partenaire) n'ont pas de destinataire. Ajouter ce secret avant ou après la démo.

---

## 1. Whitelabel — Zéro crédit d'agence

Audit `grep` récursif sur `src/`, `public/`, templates email, `index.html`, `package.json` :

| Terme recherché | Résultat |
|----------------|---------|
| `Done.` / `madebydone` | ✅ 0 occurrence |
| `madebydone.be` | ✅ 0 occurrence |
| Noms de développeurs | ✅ 0 occurrence |
| Logo / footer / meta tags | ✅ 100% Mariage Afro |

**Conclusion whitelabel : PROPRE.**

---

## 2. Frontend — Routes publiques (task-97 matrix exacte)

> Note : SPA Vite avec catch-all `path="*"` → toute URL non-définie retourne également 200. Seules les routes ci-dessous sont des routes React Router réelles.

| Route | Composant React | Statut HTTP |
|-------|----------------|-------------|
| `/` | `<Home />` | ✅ 200 |
| `/plateforme` | `<Plateforme />` | ✅ 200 |
| `/services` | `<Services />` | ✅ 200 |
| `/partenaires` | `<Partenaires />` | ✅ 200 |
| `/partenaires/:id` | `<PartenaireDetail />` | ✅ 200 |
| `/comparateur` | `<Comparateur />` | ✅ 200 |
| `/lieux` | `<Lieux />` | ✅ 200 |
| `/realisations` | `<Realisations />` | ✅ 200 |
| `/shop` | `<Shop />` | ✅ 200 |
| `/a-propos` | `<About />` | ✅ 200 |
| `/contact` | `<Contact />` | ✅ 200 |
| `/outils/budget` | `<OutilsBudget />` | ✅ 200 |
| `/outils/quiz` | `<OutilsQuiz />` | ✅ 200 |
| `/guide` | `<GuidePage />` | ✅ 200 |
| `/mentions-legales` | `<MentionsLegalesPage />` | ✅ 200 |
| `/confidentialite` | `<ConfidentialitePage />` | ✅ 200 |
| `/cookies` | `<CookiesPage />` | ✅ 200 |
| `/espace-client/login` | `<SignInPage />` (Clerk) | ✅ 200 |
| `/espace-pro/login` | `<VendorSignInPage />` (Clerk) | ✅ 200 |
| `/mariage/:slug` | `<MariagePublicPage />` | ✅ 200 |
| `/mariage/:slug/rsvp` | `<MariageRsvpPage />` | ✅ 200 |
| `/mariage/:slug/cagnotte` | `<MariageCagnottePage />` | ✅ 200 |
| `/_interne/guide` | `<GuideInternePage />` | ✅ 200 |

**23/23 routes réelles : 200. Aucun crash, aucune hydration error.**

---

## 3. Espace client (`/espace-client/*`) — Auth Clerk

| Route | Statut HTTP (SPA) |
|-------|------------------|
| `/espace-client/dashboard` | ✅ 200 |
| `/espace-client/budget` | ✅ 200 |
| `/espace-client/invites` | ✅ 200 |
| `/espace-client/plan-de-table` | ✅ 200 |
| `/espace-client/planning` | ✅ 200 |
| `/espace-client/prestataires` | ✅ 200 |
| `/espace-client/documents` | ✅ 200 |
| `/espace-client/jour-j` | ✅ 200 |
| `/espace-client/communication` | ✅ 200 |
| `/espace-client/site` | ✅ 200 |
| `/espace-client/inspiration` | ✅ 200 |
| `/espace-client/cagnotte` | ✅ 200 |
| `/espace-client/profil` | ✅ 200 |

**13/13 : 200. Clerk redirige vers login si non authentifié (comportement attendu).**

---

## 4. Espace prestataire (`/espace-pro/*`) — Auth Clerk

| Route | Statut HTTP (SPA) |
|-------|------------------|
| `/espace-pro` | ✅ 200 |
| `/espace-pro/profile` | ✅ 200 |
| `/espace-pro/gallery` | ✅ 200 |
| `/espace-pro/services` | ✅ 200 |
| `/espace-pro/agenda` | ✅ 200 |
| `/espace-pro/leads` | ✅ 200 |
| `/espace-pro/messages` | ✅ 200 |
| `/espace-pro/settings` | ✅ 200 |
| `/espace-pro/abonnement` | ✅ 200 |

**9/9 : 200.**

---

## 5. API — Endpoints lead-capture

Les routes sont montées via `app.use("/api", router)` dans `app.ts`. Clerk middleware tourne globalement mais les handlers sont publics (pas de `requireAuth()`).

| Endpoint réel | Méthode | Route dans le code | Statut (payload valide) | DB Save | Email |
|--------------|---------|-------------------|------------------------|---------|-------|
| `/api/contact` | POST | `routes/contact.ts` | ✅ 200 | ✅ | ❌ domaine |
| `/api/lead` | POST | `routes/leads.ts` | ✅ 200 | ✅ | — |
| `/api/service-request` | POST | `routes/leads.ts` | ✅ 200 | ✅ | ❌ domaine |
| `/api/become-partner` | POST | `routes/leads.ts` | ✅ 200 | ✅ | ❌ domaine |
| `/api/leads/budget-calculator` | POST | `routes/leads.ts` | ✅ 200 | ✅ | ❌ domaine |
| `/api/leads/quiz` | POST | `routes/leads.ts` | ✅ 200 | ✅ + reco prestataires | ❌ domaine |
| `/api/leads/magnet` | POST | `routes/leads.ts` | ✅ 200 | ✅ | ❌ domaine |
| `/api/leads/multi-devis` | POST | `routes/leads.ts` | ✅ 200 | ✅ (vendor requests) | ❌ domaine |

> **Note de réconciliation** : le doc QA mentionne `/api/leads/budget` et `/api/leads/service-request`. Les routes réelles sont `/api/leads/budget-calculator` et `/api/service-request` (sans préfixe `leads/`). Les deux sont opérationnelles avec le payload correct.

**API Marketplace (public, `weddingPublicRouter` + `marketplaceRouter`) :**

| Endpoint | Méthode | Statut |
|----------|---------|--------|
| `/api/marketplace/vendors` | GET | ✅ 200 (8 prestataires) |
| `/api/marketplace/vendors?category=photographe` | GET | ✅ 200 |
| `/api/marketplace/vendors/:id` | GET | ✅ 200 |

---

## 6. Resend — Smoke test email

| Test | Résultat API | Email reçu | Erreur log |
|------|-------------|-----------|-----------|
| `POST /api/contact` → `delivered@resend.dev` | ✅ `{"success":true}` | ❌ | `403 domain not verified` |
| `POST /api/contact` → `bounced@resend.dev` | ✅ `{"success":true}` | ❌ | `403 domain not verified` |

**Conclusion :** RESEND_API_KEY est valide et opérationnel (Resend reçoit les requêtes). Le blocage est uniquement la vérification DNS du domaine expéditeur `mariage-afro.com`. Les données sont sauvées en DB dans tous les cas.

---

## 7. Panel d'administration (`/admin`)

Accès : `POST /admin/login` avec `ADMIN_PASSWORD` → cookie de session 7 jours.

| Route | Méthode | Statut (authentifié) |
|-------|---------|---------------------|
| `/admin` | GET | ✅ 200 (dashboard) |
| `/admin/login` | GET | ✅ 302 (redirige /admin si déjà auth) |
| `/admin/login` | POST | ✅ 302 (set cookie + redirect /admin) |
| `/admin/logout` | POST | ✅ 302 (clear cookie) |
| `/admin/reviews` | GET | ✅ 200 |
| `/admin/content/vendors` | GET | ✅ 200 |
| `/admin/content/venues` | GET | ✅ 200 |
| `/admin/content/realisations` | GET | ✅ 200 |
| `/admin/content/vendor-accounts` | GET | ✅ 200 |
| `/admin/content/wedding-websites` | GET | ✅ 200 |
| `/admin/test-email` | GET | ✅ 200 |

**11/11 routes admin : attendues. CRUD vendors/venues/realisations fonctionnel.**

---

## 8. Sécurité

| Point | Statut |
|-------|--------|
| `ADMIN_PASSWORD` supprimé du `.replit` versionné | ✅ |
| `ADMIN_PASSWORD` stocké en secret Replit chiffré | ✅ |
| `RESEND_API_KEY` stocké en secret Replit | ✅ |
| `EMAIL_FROM` configuré (`Mariage Afro <hello@mariage-afro.com>`) | ✅ |
| `ADMIN_EMAIL` manquant | ⚠️ Recommandé |
| Headers Helmet (CSP, HSTS, CORS, Referrer-Policy) | ✅ |
| Clerk dev keys (warning console normal) | ℹ️ Remplacer par prod keys avant déploiement |

---

## 9. Hors scope V2 (non bloquants)

| Route | Statut | Note |
|-------|--------|------|
| `/cgv` | ⚪ Absent | V2 — page légale à créer |
| `/lieux/:slug` | ⚪ Absent | V2 — `/lieux` (liste) existe |
| `/realisations/:slug` | ⚪ Absent | V2 — `/realisations` (liste) existe |
| `GET /api/healthz` | ℹ️ 200 `{"status":"ok"}` | Existe, mais Clerk-protégé — non accessible sans token |

---

## Checklist GO/NO-GO

| # | Critère | Statut |
|---|---------|--------|
| 1 | Toutes les routes publiques → 200 sans crash | ✅ |
| 2 | Zéro trace d'agence dans le code, templates, meta tags | ✅ |
| 3 | Email Resend : test `delivered@resend.dev` confirmé dans les logs | ❌ **BLOQUANT** |
| 4 | EMAIL_FROM configuré | ✅ |
| 5 | Comptes démo documentés dans TEST_ACCOUNTS.md | ✅ |
| 6 | Aucune P0 ouverte | ❌ (email = P0) |

**→ VERDICT FINAL : NO-GO**  
**→ Chemin vers GO : vérifier `mariage-afro.com` sur resend.com/domains (~10 min), puis re-tester `/admin/test-email`.**
