# Demo Readiness Report — Mariage Afro
**Date:** 7 mai 2026  
**QA Engineer:** Agent automatisé (Task #97)  
**Environnement:** Dev (Replit) · Frontend port 21974 · API port 8080

---

## Résultat global : DEMO-READY avec un pré-requis bloquant

La plateforme est fonctionnellement complète et visuellement prête pour une démo client. Un seul blocage doit être résolu **avant** la démo : la vérification du domaine d'envoi d'emails sur Resend.

---

## 1. BLOCAGE P0 — Domaine Resend non vérifié

**Symptôme :** Toutes les notifications email échouent avec :
```
403 validation_error: The mariage-afro.com domain is not verified.
Please add and verify your domain on https://resend.com/domains
```

**Impact :** Les données sont bien sauvées en base (leads, contacts, devis) mais aucune notification ne part — ni vers l'utilisateur, ni vers l'équipe.

**Action requise (manuelle, ~10 min) :**
1. Se connecter sur [resend.com/domains](https://resend.com/domains)
2. Ajouter le domaine `mariage-afro.com`
3. Copier les enregistrements DNS fournis (SPF, DKIM, DMARC) dans le gestionnaire DNS du domaine
4. Attendre la vérification (quelques minutes à 48h selon le registrar)

**Emails concernés :** contact form, budget calc, quiz style, lead magnet, multi-devis, service request, become-partner, vendor follow-up.

---

## 2. Secret manquant — ADMIN_EMAIL

**Symptôme :** La variable `ADMIN_EMAIL` n'est pas configurée.  
**Impact :** Les emails de notification interne (nouveaux leads, candidatures partenaire) n'ont pas de destinataire.  
**Action :** Ajouter `ADMIN_EMAIL` = adresse email de l'équipe dans les secrets Replit.

---

## 3. Frontend — Routes publiques

| Route | Statut | Notes |
|-------|--------|-------|
| `/` | ✅ 200 | Hero cinématique, intro animée |
| `/partenaires` | ✅ 200 | 8 prestataires actifs, filtres fonctionnels |
| `/partenaires/:id` | ✅ 200 | Fiche prestataire complète |
| `/outils/budget` | ✅ 200 | Calculateur 5 étapes |
| `/outils/quiz` | ✅ 200 | Quiz 7 questions + profil |
| `/contact` | ✅ 200 | Formulaire complet |
| `/tarifs` | ✅ 200 | Plans tarifaires |
| `/a-propos` | ✅ 200 | Page équipe |
| `/mariage/:slug` | ✅ 200 | Page mariage (SPA) |
| `/espace-client` | ✅ 200 | Dashboard couple (Clerk) |
| `/espace-vendeur` | ✅ 200 | Dashboard prestataire (Clerk) |
| `/devenir-partenaire` | ✅ 200 | Formulaire candidature |

Toutes les routes SPA retournent 200 (Vite SPA fallback correct).

---

## 4. API — Endpoints publics

| Endpoint | Méthode | Statut | DB Save | Email |
|----------|---------|--------|---------|-------|
| `POST /api/contact` | POST | ✅ 200 | ✅ | ❌ domaine |
| `POST /api/lead` | POST | ✅ 200 | ✅ | — |
| `POST /api/leads/budget-calculator` | POST | ✅ 200 | ✅ | ❌ domaine |
| `POST /api/leads/quiz` | POST | ✅ 200 | ✅ + reco prestataires | ❌ domaine |
| `POST /api/leads/magnet` | POST | ✅ 200 | ✅ | ❌ domaine |
| `POST /api/leads/multi-devis` | POST | ✅ 200 | ✅ (2 vendor requests) | ❌ domaine |
| `POST /api/service-request` | POST | ✅ 200 | ✅ | ❌ domaine |
| `POST /api/become-partner` | POST | ✅ 200 | ✅ | ❌ domaine |
| `GET /api/marketplace/vendors` | GET | ✅ 200 | — | — |
| `GET /api/marketplace/vendors/:id` | GET | ✅ 200 | — | — |

---

## 5. Panel d'administration (`/admin`)

Accessible via `POST /admin/login` avec mot de passe (cookie session 7j).

| Route admin | Statut |
|-------------|--------|
| `GET /admin` (dashboard) | ✅ 200 |
| `GET/POST /admin/login` | ✅ 200/302 |
| `POST /admin/logout` | ✅ 302 |
| `GET /admin/reviews` | ✅ 200 |
| `GET /admin/content/vendors` | ✅ 200 |
| `GET /admin/content/venues` | ✅ 200 |
| `GET /admin/content/realisations` | ✅ 200 |
| `GET /admin/content/vendor-accounts` | ✅ 200 |
| `GET /admin/test-email` | ✅ 200 |
| `GET /admin/subscriptions` | ✅ 200 |

---

## 6. Whitelabel — Vérification agence

Audit complet (`grep` récursif sur `src/`, `public/`, templates email, `index.html`, `package.json`) :

- **Aucune mention** de `Done.` ou `madebydone.be` ✅
- Logo, footer, Clerk title, meta-tags : 100% Mariage Afro ✅

---

## 7. Sécurité

| Point | Statut |
|-------|--------|
| `ADMIN_PASSWORD` supprimé du `.replit` versionné | ✅ |
| `ADMIN_PASSWORD` stocké en secret Replit chiffré | ✅ |
| `RESEND_API_KEY` stocké en secret Replit | ✅ |
| `EMAIL_FROM` configuré | ✅ |
| Headers de sécurité (Helmet, CSP, HSTS, CORS) | ✅ |
| Clerk dev keys → avertissement normal en dev | ℹ️ (prod keys à setter en prod) |

---

## 8. Périmètre V2 (hors scope démo)

Les éléments suivants sont dans le backlog V2 et ne sont pas des blocages :

- `/cgv` — page conditions générales de vente
- `/lieux/:slug` — fiches lieux détaillées
- `/realisations/:slug` — galeries réalisations
- `/api/health` public (actuellement Clerk-protégé)
- Vérification Clerk production keys

---

## Checklist avant démo

- [ ] **[BLOQUANT]** Vérifier domaine `mariage-afro.com` sur resend.com/domains
- [ ] **[RECOMMANDÉ]** Configurer `ADMIN_EMAIL` dans les secrets Replit
- [ ] **[INFO]** Tester envoi email via `GET /admin/test-email` après vérification domaine
- [ ] **[INFO]** Passer aux Clerk production keys avant mise en production
