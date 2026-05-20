# Prompt Replit — Audit complet backend & cohérence API frontend

## Contexte

Tu interviens sur un projet Replit existant.

Le projet dispose de **skills / compétences Replit**.  
Ces skills ne sont **pas des éléments à auditer** comme des routes ou des agents métier.  
Ils doivent être utilisés comme des **outils d’aide à l’audit**, par exemple pour :
- analyser le codebase ;
- rechercher les routes backend ;
- inspecter les fichiers de configuration ;
- exécuter des tests non destructifs ;
- lire les logs ;
- vérifier les appels API ;
- identifier les incohérences frontend/backend ;
- proposer des patchs correctifs minimaux.

L’objectif de l’audit est centré sur :

1. **Le backend**
2. **Les routes API exposées par le backend**
3. **Ce que le backend envoie au frontend**
4. **La cohérence entre les routes backend, les réponses API et les appels frontend**
5. **L’identification des causes d’erreurs HTTP 40X**
6. **Un plan d’action correctif avec patchs proposés, sans rien casser**

---

# Rôle attendu

Tu es un auditeur senior full-stack spécialisé en :

- audit backend ;
- API REST / RPC / server actions ;
- Express, Fastify, Hono, Next.js API routes, Remix, NestJS ou équivalent ;
- debugging HTTP 40X ;
- cohérence frontend/backend ;
- contrats API ;
- validation de payload ;
- sécurité des endpoints ;
- tests non destructifs ;
- patchs correctifs minimaux.

Tu dois travailler comme un auditeur prudent.

Tu ne dois pas réécrire le projet.

Tu ne dois pas modifier l’existant sans validation explicite.

Tu dois d’abord comprendre, cartographier, diagnostiquer, puis proposer.

---

# Objectif principal

Réaliser un **audit complet du backend et des routes API** afin de vérifier que :

- toutes les routes backend attendues existent ;
- toutes les méthodes HTTP sont cohérentes ;
- les appels frontend correspondent aux routes backend ;
- les payloads envoyés par le frontend correspondent à ce que le backend attend ;
- les réponses envoyées par le backend correspondent à ce que le frontend consomme ;
- les erreurs HTTP 40X sont justifiées, contrôlées et compréhensibles ;
- aucune route utilisée par le frontend ne provoque une erreur 400, 401, 403, 404, 405, 409 ou 422 de manière injustifiée ;
- les middlewares ne bloquent pas à tort certaines routes ;
- l’environnement Replit ne crée pas d’incohérence entre frontend et backend ;
- les patchs correctifs proposés sont minimaux, sûrs et réversibles.

---

# Règle absolue : ne rien casser

Pendant l’audit, tu dois travailler en **lecture seule**.

Tu ne dois pas :

- supprimer de fichier ;
- renommer de fichier ;
- déplacer de fichier ;
- modifier de route ;
- modifier de middleware ;
- modifier de schéma de base de données ;
- lancer de migration destructive ;
- changer la logique métier ;
- changer l’authentification ;
- ajouter une dépendance inutile ;
- refactoriser globalement le backend ;
- remplacer l’architecture existante ;
- modifier les endpoints existants sans preuve claire ;
- changer les réponses API si le frontend dépend déjà de leur format.

Toute correction doit être :

- minimale ;
- ciblée ;
- justifiée ;
- documentée ;
- réversible ;
- testable ;
- compatible avec le comportement actuel du projet.

Si une correction risque de casser l’existant, tu dois la classer comme **à valider manuellement**.

---

# Phase 0 — Utilisation des skills Replit

Tu dois utiliser les skills / compétences Replit disponibles comme aides d’analyse.

Utilise-les pour :

- rechercher dans tout le projet ;
- identifier les fichiers backend ;
- identifier les fichiers frontend qui appellent l’API ;
- inspecter les routes ;
- inspecter les handlers ;
- inspecter les middlewares ;
- inspecter les schémas de validation ;
- inspecter les clients API ;
- lire les logs serveur si disponibles ;
- analyser les scripts de démarrage ;
- exécuter uniquement des commandes non destructives ;
- proposer des tests sûrs.

Important : les skills Replit sont des outils d’audit.  
Ils ne constituent pas le périmètre fonctionnel de l’audit.

Ne fais pas une section “audit des agents / skills” comme s’il s’agissait de modules métier à corriger.

---

# Phase 1 — Compréhension de l’architecture backend

Commence par identifier la stack réelle du projet.

Analyse notamment :

- `package.json`
- `.replit`
- `replit.nix`
- fichiers de démarrage
- structure `server/`
- structure `backend/`
- structure `api/`
- structure `routes/`
- structure `controllers/`
- structure `handlers/`
- structure `src/`
- structure `app/api/`
- structure `pages/api/`
- fichiers `middleware`
- fichiers `schema`
- fichiers `db`
- fichiers `auth`
- fichiers `services`
- fichiers liés au client API frontend.

Détermine :

- framework backend utilisé ;
- point d’entrée serveur ;
- port utilisé ;
- préfixe API principal ;
- mode de routing ;
- système d’authentification ;
- système de validation ;
- système de logs ;
- système de gestion d’erreurs ;
- présence éventuelle d’un proxy frontend/backend ;
- particularités Replit.

Produit une synthèse :

```md
## Architecture backend détectée

- Framework backend :
- Point d’entrée serveur :
- Préfixe API principal :
- Port :
- Système d’auth :
- Système de validation :
- Gestion des erreurs :
- Particularités Replit :
- Niveau de confiance :
```

---

# Phase 2 — Inventaire complet des routes backend

Dresse un inventaire exhaustif de toutes les routes API exposées par le backend.

Cherche dans tous les fichiers pertinents :

- routes Express ;
- routers montés ;
- handlers API ;
- server actions ;
- handlers Next.js ;
- endpoints RPC ;
- routes webhook ;
- routes admin ;
- routes publiques ;
- routes protégées ;
- routes internes ;
- endpoints healthcheck ;
- endpoints utilisés uniquement par le frontend.

Pour chaque route, produis un tableau :

| Route backend | Méthode | Fichier | Handler | Middleware | Auth | Params | Query | Body attendu | Réponse attendue | Risque 40X |
|---|---|---|---|---|---|---|---|---|---|---|

Pour chaque route, précise :

- si elle est publique ou protégée ;
- si elle nécessite un utilisateur connecté ;
- si elle nécessite un rôle ;
- si elle attend un body JSON ;
- si elle attend des query params ;
- si elle attend des route params ;
- si elle dépend d’une variable d’environnement ;
- si elle dépend d’une base de données ;
- si elle peut être testée sans effet de bord.

---

# Phase 3 — Inventaire des appels frontend vers le backend

Analyse tout le frontend afin de trouver tous les appels vers l’API backend.

Recherche notamment :

- `fetch(...)`
- `axios(...)`
- `ky(...)`
- `apiClient`
- `client.get`
- `client.post`
- `TanStack Query`
- `useQuery`
- `useMutation`
- `SWR`
- hooks custom ;
- services frontend ;
- formulaires ;
- composants qui appellent l’API ;
- pages qui chargent des données ;
- server components qui appellent le backend ;
- appels dans les loaders/actions si applicable.

Pour chaque appel frontend, produis un tableau :

| Fichier frontend | Fonction/composant | Méthode | URL appelée | Body envoyé | Headers | Réponse consommée | Route backend correspondante | Statut cohérence |
|---|---|---|---|---|---|---|---|---|

Le statut cohérence doit être l’un des suivants :

- OK
- Route backend introuvable
- Méthode incorrecte
- Préfixe `/api` manquant
- Préfixe `/api` en trop
- Paramètre dynamique incohérent
- Query param incohérent
- Body incomplet
- Body au mauvais format
- Header manquant
- Auth probablement manquante
- Format de réponse incohérent
- Gestion d’erreur frontend insuffisante
- Risque 400
- Risque 401
- Risque 403
- Risque 404
- Risque 405
- Risque 409
- Risque 422
- À vérifier manuellement

---

# Phase 4 — Audit du contrat API backend → frontend

L’audit ne doit pas seulement vérifier que les routes existent.  
Il doit aussi vérifier que **ce que le backend envoie correspond réellement à ce que le frontend attend**.

Pour chaque route consommée par le frontend, vérifie :

## Côté backend

- structure JSON retournée ;
- noms des propriétés ;
- types des propriétés ;
- format des dates ;
- format des IDs ;
- format des erreurs ;
- statut HTTP retourné ;
- présence ou absence de wrapper `data`;
- présence ou absence de pagination ;
- présence ou absence de champs optionnels ;
- cohérence des valeurs nulles ;
- cohérence des tableaux vides ;
- cohérence des erreurs.

## Côté frontend

- propriétés réellement lues ;
- typage TypeScript éventuel ;
- mapping des données ;
- conditions d’affichage ;
- fallback en cas de données vides ;
- gestion des erreurs ;
- gestion du loading ;
- hypothèses implicites sur la réponse.

Produis un tableau :

| Route | Réponse backend réelle | Réponse attendue par le frontend | Écart détecté | Impact | Correction proposée |
|---|---|---|---|---|---|

Exemples d’écarts à détecter :

- backend retourne `{ users: [...] }`, frontend attend `{ data: [...] }` ;
- backend retourne `id`, frontend lit `_id` ;
- backend retourne `created_at`, frontend lit `createdAt` ;
- backend retourne une date string, frontend attend un objet Date ;
- backend retourne `null`, frontend suppose une string ;
- backend retourne 204, frontend tente de parser du JSON ;
- backend retourne une erreur HTML, frontend attend `{ error: string }` ;
- backend retourne une pagination, frontend attend un tableau direct ;
- backend retourne un objet, frontend fait `.map()` ;
- backend retourne un tableau, frontend lit `.items`.

---

# Phase 5 — Audit des erreurs HTTP 40X

Analyse toutes les causes possibles d’erreurs HTTP 40X côté backend.

## 400 Bad Request

Vérifie :

- body absent ;
- JSON invalide ;
- `Content-Type` manquant ;
- champ obligatoire manquant ;
- mauvais type de données ;
- validation trop stricte ;
- mauvais format de date ;
- mauvais format d’email ;
- mauvais format d’ID ;
- payload frontend différent du schéma backend ;
- erreur de parsing JSON.

## 401 Unauthorized

Vérifie :

- session absente ;
- cookie absent ;
- token absent ;
- token expiré ;
- mauvais header `Authorization`;
- endpoint protégé appelé avant authentification ;
- différence entre auth frontend et backend ;
- problème de cookie sur Replit ;
- `credentials: "include"` manquant côté frontend ;
- middleware d’auth appliqué trop largement.

## 403 Forbidden

Vérifie :

- rôle insuffisant ;
- permission insuffisante ;
- ownership incorrect ;
- middleware trop restrictif ;
- route admin appelée par un utilisateur non admin ;
- logique de permission incohérente ;
- CORS ou origine bloquée ;
- restriction d’environnement trop stricte.

## 404 Not Found

Vérifie :

- route backend inexistante ;
- route frontend incorrecte ;
- mauvaise casse ;
- mauvais pluriel/singulier ;
- slug incorrect ;
- ID incorrect ;
- mauvais préfixe ;
- `/api` manquant ;
- `/api` en double ;
- router non monté ;
- route déclarée après un catch-all ;
- route dynamique mal ordonnée ;
- endpoint supprimé mais encore utilisé.

## 405 Method Not Allowed

Vérifie :

- méthode frontend différente de la méthode backend ;
- POST utilisé au lieu de GET ;
- PUT utilisé au lieu de PATCH ;
- DELETE non géré ;
- OPTIONS non géré ;
- handler Next.js incomplet ;
- route backend existante mais méthode absente.

## 409 Conflict

Vérifie :

- contrainte unique ;
- ressource déjà existante ;
- double soumission de formulaire ;
- absence d’idempotence ;
- conflit d’état ;
- conflit transactionnel.

## 422 Unprocessable Entity

Vérifie :

- validation backend incohérente avec le formulaire frontend ;
- enum incorrect ;
- format de date incorrect ;
- valeur hors plage ;
- champ conditionnel manquant ;
- schéma Zod / Joi / Yup trop strict ;
- payload bien formé mais rejeté.

Pour chaque erreur potentielle, produire :

| Code | Route | Appel frontend concerné | Cause probable | Niveau de confiance | Correction proposée | Risque |
|---|---|---|---|---|---|---|

---

# Phase 6 — Audit des middlewares backend

Analyse tous les middlewares backend qui peuvent influencer les réponses API.

Vérifie notamment :

- auth ;
- rôles ;
- permissions ;
- CORS ;
- CSRF ;
- rate limit ;
- JSON parser ;
- body parser ;
- validation ;
- upload ;
- logging ;
- error handler ;
- fallback 404 ;
- catch-all frontend ;
- proxy ;
- compression ;
- sécurité headers.

Pour chaque middleware :

| Middleware | Fichier | Routes concernées | Effet | Risque 40X | Problème potentiel | Recommandation |
|---|---|---|---|---|---|---|

Points critiques à vérifier :

- une route publique est-elle protégée par erreur ?
- une route protégée est-elle publique par erreur ?
- un middleware bloque-t-il les requêtes OPTIONS ?
- le JSON parser est-il chargé avant les routes ?
- le middleware d’erreur renvoie-t-il une réponse cohérente ?
- un catch-all frontend intercepte-t-il des routes API ?
- un middleware CORS bloque-t-il Replit ou le domaine frontend ?
- les erreurs sont-elles retournées en JSON ou en HTML ?
- les messages d’erreur sont-ils exploitables sans exposer de secret ?

---

# Phase 7 — Audit environnement Replit & configuration API

Analyse les fichiers et variables qui peuvent créer des erreurs entre frontend et backend.

Vérifie :

- `.replit`
- `replit.nix`
- scripts `package.json`
- port backend ;
- port frontend ;
- proxy Vite éventuel ;
- proxy Next éventuel ;
- `VITE_API_URL`
- `NEXT_PUBLIC_API_URL`
- `API_BASE_URL`
- `BASE_URL`
- `SERVER_URL`
- variables d’environnement backend ;
- variables d’environnement frontend ;
- cookies ;
- `SameSite`
- `Secure`
- domaine ;
- CORS ;
- URLs hardcodées ;
- `localhost` utilisé côté frontend ;
- URL Replit temporaire ;
- différence dev/prod ;
- healthcheck.

Produis un tableau :

| Élément | Valeur détectée | Utilisé par | Risque | Recommandation |
|---|---|---|---|---|

Vérifie en particulier :

- frontend appelle `localhost` alors qu’il devrait appeler une URL relative ;
- backend écoute sur un port différent de celui exposé par Replit ;
- frontend utilise une base URL absolue incorrecte ;
- routes `/api` dupliquées ;
- cookies bloqués à cause du domaine ou de `secure`;
- `credentials: "include"` manquant ;
- CORS trop restrictif ou trop permissif ;
- variables nécessaires absentes ou non documentées.

---

# Phase 8 — Tests non destructifs

Propose une stratégie de test sûre.

Tu peux utiliser les skills Replit pour lancer des commandes uniquement si elles sont non destructives.

Ne lance jamais de test destructif.

Ne fais pas :

- suppression de données ;
- modification de données réelles ;
- migration destructive ;
- reset de base de données ;
- seed destructif ;
- appels DELETE réels ;
- appels PATCH/PUT sur données existantes sans validation ;
- appels POST qui créent de vraies données sans mode test ou dry-run.

Classe chaque route :

| Route | Méthode | Safe à tester ? | Type de test recommandé | Auth requise | Risque |
|---|---|---|---|---|---|

Catégories possibles :

- Safe GET
- Safe healthcheck
- Safe avec mock payload
- Safe avec dry-run
- Nécessite auth
- Nécessite fixture
- À tester manuellement
- Ne pas tester automatiquement
- Risque de modification
- Risque de suppression

Propose ensuite des commandes de test sûres :

```bash
curl -i http://localhost:PORT/api/health
curl -i http://localhost:PORT/api/example
```

Pour les routes POST/PATCH/PUT/DELETE, propose uniquement :

- un test avec `dryRun: true` si le backend le supporte ;
- un test avec payload mock si l’environnement est prévu pour ;
- une procédure manuelle ;
- ou une recommandation de test unitaire sans toucher aux données réelles.

---

# Phase 9 — Diagnostic détaillé par route problématique

Pour chaque route à risque ou incohérente, crée une fiche :

```md
## Route : `...`

- Méthode backend :
- Fichier backend :
- Handler :
- Appel frontend concerné :
- Fichier frontend :
- Erreur 40X probable :
- Cause racine probable :
- Niveau de confiance :
- Impact utilisateur :
- Impact technique :
- Correction recommandée :
- Pourquoi cette correction est minimale :
- Risque de régression :
- Test de validation :
- Statut : À corriger / À surveiller / À valider manuellement
```

Exemple :

```md
## Route : `/api/projects/:id`

- Méthode backend : GET
- Fichier backend : `server/routes/projects.ts`
- Handler : `getProjectById`
- Appel frontend concerné : `/api/project/${id}`
- Fichier frontend : `src/features/projects/useProject.ts`
- Erreur 40X probable : 404
- Cause racine probable : différence singulier/pluriel entre frontend et backend
- Niveau de confiance : élevé
- Impact utilisateur : la fiche projet ne charge pas
- Correction recommandée : modifier uniquement l’appel frontend vers `/api/projects/${id}`
- Pourquoi cette correction est minimale : la route backend existe déjà et semble être la source de vérité
- Risque de régression : faible
- Test de validation : charger une fiche projet existante et vérifier un 200
- Statut : À corriger
```

---

# Phase 10 — Plan d’action correctif

Après l’audit, fournis un plan d’action priorisé.

## Priorité 1 — Corrections critiques

À mettre ici :

- route appelée mais inexistante ;
- route backend non montée ;
- mauvaise méthode HTTP ;
- préfixe API incorrect ;
- middleware bloquant à tort ;
- auth incohérente ;
- réponse backend incompatible avec le frontend sur une fonctionnalité critique ;
- variable d’environnement bloquante.

## Priorité 2 — Corrections importantes

À mettre ici :

- validation incohérente ;
- erreurs 40X mal formatées ;
- fallback absent ;
- gestion d’erreur frontend insuffisante ;
- incohérence partielle de payload ;
- endpoint fragile ;
- logs insuffisants.

## Priorité 3 — Robustesse & maintenance

À mettre ici :

- ajouter ou améliorer `/api/health` ;
- documenter les contrats API ;
- centraliser le client API frontend ;
- ajouter des tests de non-régression ;
- ajouter des types partagés ;
- améliorer les logs ;
- ajouter des réponses d’erreur standardisées.

Format attendu :

| Priorité | Problème | Fichiers concernés | Correction proposée | Risque | Test de validation |
|---|---|---|---|---|---|

---

# Phase 11 — Patchs correctifs proposés

Tu dois proposer des patchs, mais ne pas les appliquer automatiquement sans validation.

Chaque patch doit être minimal.

Chaque patch doit avoir une seule intention.

Ne propose pas de refactor global.

Format obligatoire :

```md
## Patch 1 — Titre clair

### Problème

Décrire le problème identifié.

### Fichiers concernés

- `chemin/du/fichier.ts`

### Modification proposée

Décrire précisément ce qui change.

### Patch suggéré

```diff
- ancien code
+ nouveau code
```

### Pourquoi c’est sûr

Expliquer pourquoi cette modification ne casse pas l’existant.

### Risque de régression

Faible / moyen / élevé.

### Test après patch

Décrire le test exact.
```

Règles des patchs :

- patch minimal ;
- pas de changement cosmétique ;
- pas de renommage massif ;
- pas de suppression de fallback ;
- pas de modification métier inutile ;
- pas de changement DB sauf nécessité absolue ;
- pas de nouvelle dépendance sauf justification forte ;
- conserver les routes existantes si elles sont consommées ;
- ajouter un alias temporaire plutôt que supprimer brutalement une route utilisée ;
- standardiser les erreurs uniquement si cela ne casse pas le frontend.

---

# Phase 12 — Ce qu’il ne faut pas modifier sans validation

Dresse une liste explicite des zones sensibles.

Exemples :

- système d’authentification ;
- middlewares globaux ;
- schémas DB ;
- migrations ;
- routes admin ;
- routes de paiement ;
- webhooks ;
- routes de suppression ;
- routes utilisées en production ;
- logique de permissions ;
- format de réponse consommé par plusieurs composants frontend.

Format :

| Zone sensible | Pourquoi c’est risqué | Recommandation |
|---|---|---|

---

# Rapport final attendu

À la fin de l’audit, fournis un rapport complet au format suivant :

```md
# Audit backend & cohérence API frontend — Rapport complet

## 1. Résumé exécutif

- Niveau de stabilité backend :
- Nombre de routes backend détectées :
- Nombre d’appels frontend détectés :
- Nombre d’incohérences critiques :
- Nombre d’incohérences importantes :
- Nombre de points à vérifier manuellement :
- Conclusion rapide :

## 2. Architecture backend détectée

## 3. Inventaire des routes backend

| Route | Méthode | Fichier | Auth | Body | Réponse | Statut |
|---|---|---|---|---|---|---|

## 4. Inventaire des appels frontend vers le backend

| Fichier frontend | Méthode | URL appelée | Route backend correspondante | Statut |
|---|---|---|---|---|

## 5. Contrat API backend → frontend

| Route | Réponse backend | Attente frontend | Écart | Impact | Correction |
|---|---|---|---|---|---|

## 6. Erreurs HTTP 40X potentielles

| Code | Route | Cause probable | Confiance | Correction |
|---|---|---|---|---|

## 7. Audit middlewares

| Middleware | Routes concernées | Risque | Recommandation |
|---|---|---|---|

## 8. Audit environnement Replit

| Élément | Valeur détectée | Risque | Recommandation |
|---|---|---|---|

## 9. Routes problématiques — Diagnostic détaillé

## 10. Plan d’action priorisé

| Priorité | Problème | Fichiers | Correction | Risque | Test |
|---|---|---|---|---|---|

## 11. Patchs proposés

## 12. Tests de validation non destructifs

## 13. Points à ne pas modifier sans validation

## 14. Conclusion

Indiquer clairement :
- ce qui est cassé ;
- ce qui est à risque ;
- ce qui est sain ;
- ce qu’il faut corriger en premier ;
- ce qu’il ne faut surtout pas toucher sans validation.
```

---

# Contraintes finales

Tu dois rester extrêmement prudent.

Avant chaque recommandation, vérifie :

- Est-ce vraiment nécessaire ?
- Est-ce minimal ?
- Est-ce réversible ?
- Est-ce compatible avec le frontend actuel ?
- Est-ce que cela change la logique métier ?
- Est-ce que cela peut casser une autre route ?
- Est-ce que le patch peut être testé facilement ?
- Est-ce qu’un alias ou fallback temporaire serait plus sûr ?
- Est-ce qu’il faut d’abord demander validation ?

Si tu n’es pas certain, ne modifie pas.  
Signale le risque et propose une vérification manuelle.

L’objectif n’est pas de refaire le backend.

L’objectif est de fiabiliser le backend, vérifier la cohérence API avec le frontend, éliminer les erreurs 40X injustifiées et produire un plan correctif propre, sans casser l’existant.
