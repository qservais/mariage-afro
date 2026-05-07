# Comptes de test — Mariage Afro
**Date :** 7 mai 2026 · Environnement : Dev (Replit)

> Document confidentiel. Ne pas exposer publiquement.

---

## Administration — Panel Express (sans Clerk)

| Champ | Valeur |
|-------|--------|
| URL dev | `http://localhost:8080/admin` |
| URL via proxy Replit | `https://<replit-dev-domain>/api-server/admin` |
| Méthode | Formulaire HTML (`POST /admin/login`) |
| Mot de passe | *(secret Replit `ADMIN_PASSWORD`)* |
| Session | Cookie `mariage_afro_admin` — 7 jours — HttpOnly, SameSite=Lax |

**Test curl rapide :**
```bash
curl -c cookies.txt -X POST http://localhost:8080/admin/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "password=<ADMIN_PASSWORD>"
# → 302 redirect vers /admin + cookie set
curl -b cookies.txt http://localhost:8080/admin
# → 200 dashboard HTML
```

**Sections accessibles après login :**
- `/admin` — Dashboard (stats leads, prestataires)
- `/admin/reviews` — Modération avis
- `/admin/content/vendors` — CRUD prestataires
- `/admin/content/venues` — CRUD lieux
- `/admin/content/realisations` — CRUD réalisations
- `/admin/content/vendor-accounts` — Comptes prestataires / approbation
- `/admin/content/wedding-websites` — Sites mariage
- `/admin/test-email` — Test envoi email Resend

---

## Comptes Clerk — Espace client couple

| Champ | Valeur |
|-------|--------|
| URL inscription | `/espace-client/register` ou `/sign-up` |
| URL connexion | `/espace-client/login` ou `/sign-in` |
| Rôle Clerk | `couple` (metadata) |
| Email de test | `delivered@resend.dev` (Resend simulé) |
| OTP en dev | Visible dans Clerk Dashboard → Logs |

**Workaround démo si Resend domain non vérifié :** Utiliser "Email magic link" Clerk (l'OTP apparaît dans les logs Clerk Dashboard, pas dans la boîte mail).

---

## Comptes Clerk — Espace prestataire

| Champ | Valeur |
|-------|--------|
| URL inscription | `/espace-pro/register` |
| URL connexion | `/espace-pro/login` |
| Rôle Clerk | `vendor` (metadata) |
| Email de test | `delivered@resend.dev` |
| OTP en dev | Visible dans Clerk Dashboard → Logs |

---

## Adresses email de test Resend

| Adresse | Comportement |
|---------|-------------|
| `delivered@resend.dev` | Succès simulé (toujours reçu si domaine vérifié) |
| `bounced@resend.dev` | Bounce simulé |
| `complained@resend.dev` | Spam complaint simulé |

> Tant que `mariage-afro.com` n'est pas vérifié sur Resend, **toutes** les adresses échouent avec `403 domain not verified` — y compris `delivered@resend.dev`. Le problème est côté FROM, pas côté TO.

---

## Données de démo en base (après QA sweep du 7 mai 2026)

| Table | Contenu |
|-------|---------|
| `marketplace_vendors` | 8 prestataires actifs |
| `leads` | ~19 entrées (contact, budget_calc, quiz_result, lead_magnet, service_request) |
| `vendor_requests` | 2 entrées (multi-devis test) |
| `partner_applications` | 1 candidature test (Photo Studio Test) |

---

## URLs clés (dev)

| Service | URL locale |
|---------|-----------|
| Frontend | `http://localhost:21974` |
| API | `http://localhost:8080` |
| Panel admin | `http://localhost:8080/admin` |

---

## Notes avant démo

1. **Email bloqué** — Vérifier `mariage-afro.com` sur resend.com/domains avant toute démo avec envoi email.
2. **ADMIN_EMAIL manquant** — Configurer le secret `ADMIN_EMAIL` pour les notifications internes.
3. **Clerk dev keys** — Warning normal en console dev. Passer aux production keys avant déploiement cloud.
4. **Admin mot de passe** — Récupérer via secret Replit `ADMIN_PASSWORD` uniquement. N'est plus dans `.replit`.
