# 🔍 AUDIT TECHNIQUE COMPLET — SITE WEB + BACK-OFFICE ADMIN
## MODE CORRECTION NON-DESTRUCTIVE

## ⚠️ RÈGLES ABSOLUES (À RESPECTER AVANT TOUTE ACTION)

1. **NE RIEN REFACTORER** : ne modifie AUCUNE architecture, AUCUNE logique métier, AUCUN flow utilisateur ou admin existant.
2. **NE RIEN SUPPRIMER** : aucune page, aucun composant, aucune route, aucun endpoint, aucun champ de formulaire, aucune variable d'environnement.
3. **NE RIEN AJOUTER** qui ne soit pas strictement nécessaire pour faire fonctionner ce qui est DÉJÀ prévu dans le code.
4. **CORRIGER UNIQUEMENT** : bugs, erreurs, dysfonctionnements, liens cassés, imports manquants, typages incorrects, appels API défaillants, requêtes DB cassées, etc.
5. **PRÉSERVER** : le design, les textes, les couleurs, les animations, les traductions, la structure des fichiers, les noms de variables, les schémas DB.
6. Si un doute existe entre "corriger" et "modifier le comportement", tu **dois me demander** avant d'agir.

---

## 🧭 DÉTECTION AUTONOME DU CONTEXTE

Avant toute autre action, tu dois **deviner le contexte du projet par toi-même** en inspectant le code. Ne me pose aucune question sur le contexte.

Produis en sortie un bloc :

```
## CONTEXTE DÉTECTÉ
- Nom probable du projet : ...
- Type de site : [Vitrine / E-commerce / SaaS / Blog / Marketplace / Portail / etc.]
- Framework principal : ... (+ version)
- Stack complète détectée : ... (langages, libs UI, ORM, styling, animations, state management)
- Base de données : ... (PostgreSQL, MySQL, SQLite, Neon, Supabase, etc.)
- Système d'authentification : ... (NextAuth, Clerk, Supabase Auth, custom JWT, etc.)
- Plateforme de déploiement cible : ...
- Intégrations tierces identifiées : [Resend, Stripe, Cloudinary, Mailchimp, etc.]
- Langues supportées (i18n) : ...
- Public cible front : [B2B / B2C / Visiteurs anonymes / etc.]
- Rôles admin détectés : [admin, editor, super-admin, etc.]
- Fonctionnalités principales du site public : ...
- Fonctionnalités principales de l'admin : ...
```

Base-toi sur : `package.json`, `README.md` (si présent), structure des dossiers (notamment `/admin`, `/dashboard`, `/api`), middlewares d'auth, schéma Prisma/Drizzle, noms de routes, contenu des composants, variables d'environnement référencées, commentaires, textes visibles.

---

## 📋 PHASE 1 — INVENTAIRE COMPLET (lecture seule, AUCUNE modification)

Produis un rapport structuré en Markdown listant :

### 1.1 Structure du projet
- Arborescence complète des dossiers/fichiers pertinents
- Séparation claire : zone publique vs zone admin vs API
- Stack technique détectée (framework, versions, librairies principales)

### 1.2 Site public — fonctionnalités prévues
Pour chaque feature identifiée, indique :
- Nom et emplacement (page, route, composant)
- État : ✅ Fonctionne | ⚠️ Partiellement cassé | ❌ Non fonctionnel | 🔍 Non testable sans contexte
- Preuve (extrait de code, logs, erreur console)

### 1.3 Back-office admin — fonctionnalités prévues
Pour chaque écran/fonction admin identifiée :
- Nom et emplacement (route, composant)
- Type d'opération : Lecture / Création / Édition / Suppression / Publication / Import / Export
- Entité concernée (articles, produits, clients, commandes, etc.)
- État : ✅ / ⚠️ / ❌ / 🔍

### 1.4 Points d'entrée et flux critiques

**Site public :**
- Routes / pages principales
- SEO : sitemap, robots.txt, meta tags, Schema.org, canonical
- Formulaires publics (contact, newsletter, devis, inscription)
- Tunnel d'achat / réservation (si applicable)
- Recherche, filtres, pagination

**Admin :**
- Page de login admin et flow d'authentification
- Gestion des sessions et tokens
- CRUD complet pour chaque entité (Create / Read / Update / Delete)
- Upload de médias (images, fichiers, PDF)
- Système de rôles et permissions
- Logs d'activité / audit trail (si présent)

**API & DB :**
- Endpoints API (publics et privés)
- Requêtes DB (ORM ou SQL brut)
- Migrations / seeds
- Webhooks entrants/sortants

---

## 🐛 PHASE 2 — DÉTECTION DES ERREURS

Analyse et reporte sans correction immédiate :

### 2.1 Erreurs bloquantes (priorité 1)
- Erreurs de build / compilation / typage (TypeScript, ESLint)
- Imports manquants ou cassés
- Variables d'environnement référencées mais absentes (DB_URL, AUTH_SECRET, etc.)
- Dépendances manquantes dans `package.json`
- Erreurs console (runtime) au chargement et à l'interaction
- Pages qui plantent (front public ou admin)
- Appels API qui retournent 4xx/5xx
- Requêtes DB qui échouent (schéma désynchronisé, migrations manquantes)
- Login admin cassé

### 2.2 Erreurs fonctionnelles côté public (priorité 2)
- Boutons / liens sans action ou mal câblés
- Formulaires de contact qui ne soumettent pas ou n'envoient pas d'email
- Données dynamiques (depuis le CMS/DB) qui ne s'affichent pas
- États de chargement / erreur / vide non gérés
- Recherche, filtres, tri qui ne fonctionnent pas
- Pagination cassée
- Problèmes de timezone, formats de date, devise
- Traductions manquantes (i18n)
- Liens internes 404, redirections cassées

### 2.3 Erreurs fonctionnelles côté admin (priorité 2)
- CRUD incomplet (ex. on peut créer mais pas éditer)
- Sauvegarde de formulaire qui n'enregistre pas en DB
- Validation côté admin manquante ou trop laxiste
- Upload d'images qui échoue ou ne stocke pas l'URL
- Permissions mal appliquées (un editor accède à des actions super-admin)
- Confirmation de suppression manquante (risque de perte de données)
- Pas de feedback utilisateur après une action (toast, redirection)
- Listings sans pagination causant des plantages sur gros volumes
- Données affichées dans l'admin différentes de ce qui est en DB

### 2.4 Erreurs UI/UX (priorité 3)
- Éléments hors viewport, z-index cassés, overflow
- Responsive cassé (mobile / tablette / desktop) — front ET admin
- Images 404, favicon manquant, meta tags absents
- Accessibilité critique (alt text, aria, contraste < AA)
- Animations qui causent des reflows ou plantent
- Tableaux admin illisibles sur mobile

### 2.5 SEO et performance (priorité 3)
- Meta title / description manquants ou dupliqués
- Sitemap.xml absent ou mal généré
- Robots.txt manquant ou bloquant
- Schema.org / JSON-LD absent ou invalide
- Images non optimisées (pas de WebP, pas de lazy loading)
- Core Web Vitals critiques (LCP, CLS)
- Pages admin indexables par erreur (devraient être noindex)

### 2.6 Sécurité et configuration
- Routes admin accessibles sans authentification
- Endpoints API sensibles sans vérification de session/rôle
- Secrets exposés côté client (clés API en `NEXT_PUBLIC_*`)
- CORS / CSP mal configurés
- Validation manquante côté serveur (injection SQL, XSS)
- Tokens en localStorage sans besoin
- Pas de rate limiting sur les formulaires publics (spam)
- Mots de passe stockés en clair ou mal hashés
- Pas de protection CSRF sur les actions admin
- HTTPS / certificats

---

## 🔧 PHASE 3 — PLAN DE CORRECTION (avant exécution)

Avant de modifier quoi que ce soit, produis un tableau :

| # | Zone | Fichier | Ligne | Erreur détectée | Correction proposée | Risque de régression | Validation requise |
|---|------|---------|-------|-----------------|---------------------|----------------------|-------------------|
| 1 | Public/Admin/API/DB | ... | ... | ... | ... | Faible/Moyen/Élevé | Oui/Non |

**ATTENDS MA VALIDATION** avant d'exécuter les corrections marquées "Risque Moyen/Élevé".
Les corrections "Risque Faible" (imports, typos, variables manquantes) peuvent être appliquées directement.

⚠️ **Toute correction touchant la DB (schéma, migration, seed) est automatiquement Risque Élevé et nécessite ma validation.**

---

## ✅ PHASE 4 — CORRECTION

Applique les corrections **une par une**, en respectant strictement :
- Aucune ligne modifiée hors du périmètre listé dans le plan
- Aucun formatage/reformat de code non lié à la correction
- Aucun renommage de variable, fonction, fichier, route, table DB ou colonne
- Aucune modification des dépendances sauf si strictement nécessaire (et dans ce cas, justifie)
- Aucune migration DB sans validation explicite

Après chaque correction, indique :
- ✅ Ce qui a été changé (diff lisible)
- 🧪 Comment vérifier que ça fonctionne (côté public et/ou admin)
- ⚠️ Effets de bord potentiels à surveiller

---

## 🧪 PHASE 5 — TESTS DE VALIDATION

Pour chaque fonctionnalité corrigée, exécute ou simule :

**Côté public :**
- Test du flow utilisateur complet (happy path)
- Test des cas d'erreur (mauvaise saisie, offline, 404)
- Test responsive (mobile/tablette/desktop)
- Test des intégrations tierces (ping des API externes, envoi d'email)

**Côté admin :**
- Login + logout
- CRUD complet sur chaque entité corrigée (créer → lire → éditer → supprimer)
- Upload de médias et persistance des URLs
- Vérification des permissions par rôle
- Cohérence DB ↔ affichage admin ↔ affichage front
- Vérification console : 0 erreur, warnings documentés

Produis un rapport final :
- ✅ Corrections appliquées et validées
- ⚠️ Corrections appliquées mais nécessitant une vérification manuelle de ma part
- ❌ Problèmes détectés mais NON corrigés (avec raison : hors scope, besoin d'info, risque trop élevé)
- 📌 Recommandations pour plus tard (sans les appliquer)

---

## 🚫 CE QUE TU NE DOIS PAS FAIRE

- ❌ Me poser des questions sur le contexte du projet (devine-le)
- ❌ Proposer une "meilleure" architecture
- ❌ Remplacer une lib par une "plus moderne"
- ❌ Ajouter des tests unitaires si absents
- ❌ Mettre à jour les dépendances vers des versions majeures
- ❌ Modifier le design, les copies, les couleurs (front ou admin)
- ❌ Toucher aux fichiers de configuration (`next.config`, `tsconfig`, etc.) sauf si c'est LA cause directe d'un bug
- ❌ Créer de nouveaux fichiers sauf si strictement nécessaire à une correction
- ❌ Modifier le schéma DB sans validation explicite
- ❌ Ajouter de nouveaux champs admin, de nouvelles entités, ou de nouveaux écrans
- ❌ "Améliorer" l'UX admin (réordonner, regrouper, simplifier) — corriger uniquement

---

## 📤 FORMAT DE SORTIE

1. Bloc **CONTEXTE DÉTECTÉ** (déduit par toi seul, sans me demander)
2. Rapport Phase 1 (inventaire — public + admin séparés)
3. Rapport Phase 2 (erreurs détectées, classées par priorité et par zone)
4. Plan Phase 3 (tableau de corrections) → **STOP et attends ma validation**
5. Exécution Phase 4 (avec diffs)
6. Rapport Phase 5 (validation finale)

**Commence maintenant par détecter le contexte, puis enchaîne sur la Phase 1.**
