---
name: Conversation tab bug pattern
description: Piège useEffect qui override activeConvId après mutation onSuccess dans communication.tsx
---

## Règle
Dans communication.tsx, le useEffect auto-sélectionne les conversations selon le tab actif.
Si onSuccess d'une mutation startConv ne switche pas le tab ET que le useEffect s'exécute
avant le refetch de la query, il override l'activeConvId fraîchement défini.

**Why:** Le useEffect observe [tab, adminConv, vendorConvs, activeConvId]. Quand tab="admin",
il force activeConvId = adminConv.id. Quand tab="vendors", il auto-sélectionne vendorConvs[0]
si !activeConvId. La nouvelle conversation n'est pas encore dans vendorConvs au moment du
premier render post-mutation.

**How to apply:**
- onSuccess : toujours appeler setTab("vendors") AVANT setActiveConvId
- useEffect vendors branch : ne pas auto-sélectionner si activeConvId est déjà défini
  (ne pas tester `!vendorConvs.find(c => c.id === activeConvId)`)
