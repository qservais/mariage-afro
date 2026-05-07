# Comptes de test — Mariage Afro
**Date de création :** 7 mai 2026  
**Environnement :** Dev (Replit)

> Ces informations sont confidentielles. Ne pas versionner en clair en production.

---

## Administration

### Panel Admin (Express — sans Clerk)

| Champ | Valeur |
|-------|--------|
| URL | `https://<replit-dev-domain>/api-server/admin` |
| Méthode | Formulaire HTML (cookie session) |
| Mot de passe | *(voir secret Replit `ADMIN_PASSWORD`)* |
| Session | Cookie `mariage_afro_admin` — durée 7 jours |

**Accès direct en dev :**
```
POST http://localhost:8080/admin/login
Content-Type: application/x-www-form-urlencoded
password=<ADMIN_PASSWORD>
```

---

## Comptes Clerk (Espace client / Espace prestataire)

Les comptes Clerk sont gérés via le dashboard Clerk en mode dev.  
En environnement de développement, Clerk accepte n'importe quelle adresse email avec le code OTP affiché dans les logs.

### Compte couple (démo)

| Champ | Valeur |
|-------|--------|
| Rôle | `couple` |
| Email de test Resend | `delivered@resend.dev` (toujours reçu) |
| Inscription | Via `/espace-client` → Sign Up |
| OTP | Visible dans les logs Clerk (dev mode) |

### Compte prestataire (démo)

| Champ | Valeur |
|-------|--------|
| Rôle | `vendor` |
| Email de test Resend | `delivered@resend.dev` |
| Inscription | Via `/espace-vendeur` → Sign Up |
| OTP | Visible dans les logs Clerk (dev mode) |

> En mode dev Clerk, tout OTP peut être trouvé dans le Clerk Dashboard → Logs.  
> En production, l'OTP sera envoyé par email via les serveurs Clerk.

---

## Emails de test Resend

| Adresse | Comportement |
|---------|-------------|
| `delivered@resend.dev` | Toujours reçu (success simulé) |
| `bounced@resend.dev` | Bounce simulé |
| `complained@resend.dev` | Spam complaint simulé |

> Utiliser `delivered@resend.dev` pour tous les tests fonctionnels jusqu'à vérification du domaine.

---

## Données de démo en base

Suite au QA sweep du 7 mai 2026, les données suivantes sont en DB :

| Table | Entrées de test |
|-------|----------------|
| `leads` | ~17 entrées (contact, budget_calc, quiz_result, lead_magnet, multi-devis, service_request) |
| `vendor_requests` | 2 entrées (multi-devis test) |
| `marketplace_vendors` | 8 prestataires actifs |
| `partner_applications` | 1 candidature test |

---

## URLs clés (dev)

| Service | URL locale |
|---------|-----------|
| Frontend | `http://localhost:21974` |
| API | `http://localhost:8080` |
| Admin panel | `http://localhost:8080/admin` |
| Mockup sandbox | `http://localhost:8081/__mockup` |

---

## Notes importantes

1. **Email bloqué** : Jusqu'à vérification du domaine sur Resend, tous les emails échouent avec `403`. Les leads sont sauvés en DB mais aucune notification ne part.
2. **Clerk dev keys** : Le warning Clerk en console est normal en dev. Configurer les production keys avant déploiement.
3. **ADMIN_EMAIL manquant** : Configurer ce secret pour recevoir les notifications internes (nouveaux leads, candidatures).
