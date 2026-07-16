---
name: saas-event-instrumentation
description: Audite puis implémente une instrumentation analytics PostHog propre (nommage, propriétés, consentement, absence de PII, cohérence client/serveur) dans un SaaS TypeScript/Next.js. Invocation manuelle uniquement — ne se déclenche jamais automatiquement à partir d'une simple mention d'analytics.
argument-hint: '[objectif-produit]'
disable-model-invocation: true
---

# saas-event-instrumentation

## Invocation

Ce skill s'invoque **uniquement manuellement**, jamais automatiquement à partir d'une mention
générale d'analytics dans la conversation. L'utilisateur le déclenche explicitement avec un
objectif produit en argument, par exemple :

```
/saas-event-instrumentation onboarding après signup
/saas-event-instrumentation flow de résiliation d'abonnement
```

`[objectif-produit]` décrit la fonctionnalité ou le parcours utilisateur à auditer/instrumenter.
Si votre version de Claude Code ne fait pas encore respecter `disable-model-invocation` pour les
skills, respectez tout de même cette contrainte : n'exécutez la procédure ci-dessous que sur
demande explicite de l'utilisateur.

## Fonctionnement sans PostHog installé

Si `posthog-js` et/ou `posthog-node` ne sont pas présents dans les dépendances du projet cible, ce
skill ne les installe **jamais** silencieusement. Il produit un plan d'instrumentation qui liste
la dépendance manquante comme un risque/prérequis, puis attend une validation explicite et séparée
de l'utilisateur avant tout ajout à `package.json`.

## Procédure obligatoire

### 1. Audit (lecture seule)

- Lire le code existant lié à `[objectif-produit]` (composants, route handlers, server actions).
- Lister les événements déjà émis (recherche de `capture(`, `posthog.capture`, catalogue existant
  type `event-catalog.yml`).
- Vérifier la présence de `posthog-js` / `posthog-node` dans `package.json`. Noter l'absence comme
  prérequis si nécessaire.
- Repérer toute clé, DSN ou token PostHog déjà présent en dur dans le code : le signaler comme
  risque de sécurité immédiatement, sans le recopier dans le rapport.
- Ne modifier aucun fichier à cette étape.

### 2. Plan (court)

- Lister les événements à ajouter ou modifier : nom, catégorie, propriétés, déclencheur
  (client/serveur/les deux).
- Indiquer explicitement si une nouvelle dépendance doit être ajoutée.
- Signaler tout risque identifié (PII potentielle, doublon d'événement, incohérence de nommage,
  absence de mécanisme de consentement).
- Présenter ce plan à l'utilisateur avant toute écriture de code.

### 3. Validation utilisateur

- Attendre une confirmation explicite avant d'implémenter quoi que ce soit. Ne jamais supposer
  l'approbation à partir du silence ou d'une réponse ambiguë.
- Si le plan inclut l'ajout de PostHog comme dépendance, le signaler séparément et attendre une
  confirmation dédiée à cet ajout précis.

### 4. Implémentation

- Ajouter/modifier les événements dans le catalogue du projet cible (copie adaptée de
  [templates/event-catalog.yml](templates/event-catalog.yml)).
- Implémenter l'appel `capture()` côté client et/ou serveur selon le plan validé.
- Ne jamais coder en dur une clé, un DSN ou un token PostHog — toujours lire depuis
  `process.env` (voir l'exemple [examples/nextjs-posthog](../../examples/nextjs-posthog/README.md)).
- Respecter la convention de nommage et la taxonomie (voir
  [references/event-taxonomy.md](references/event-taxonomy.md) et
  [references/naming-conventions.md](references/naming-conventions.md)).

### 5. Tests

- Exécuter [scripts/validate-event-catalog.ts](scripts/validate-event-catalog.ts) sur le catalogue
  modifié et corriger tout problème signalé avant de continuer.
- Ajouter ou adapter les tests unitaires du projet cible couvrant la logique d'instrumentation
  ajoutée, si le projet en a.

### 6. Rapport

- Produire la sortie finale obligatoire décrite plus bas, même si l'étape 1 (audit) n'a mené à
  aucun changement.

## Checklist obligatoire avant tout ajout de tracking

### PII (données personnelles)

- [ ] Aucun email, téléphone, nom complet, adresse, IP, ou identifiant gouvernemental dans les
      propriétés d'événement.
- [ ] L'identification de l'utilisateur passe par `distinct_id` (géré par PostHog), jamais par une
      donnée brute identifiante en propriété custom.
- [ ] Aucune propriété ne figure dans `FORBIDDEN_PROPERTY_NAMES` (voir
      [scripts/validate-event-catalog.ts](scripts/validate-event-catalog.ts)).

### Consentement

- [ ] Le tracking respecte le mécanisme de consentement déjà en place dans le projet cible
      (bannière cookie, opt-in explicite).
- [ ] Aucun événement n'est envoyé avant que le consentement analytics soit accordé, si un tel
      mécanisme existe dans le projet.
- [ ] Si aucun mécanisme de consentement n'existe dans le projet cible, ce constat est signalé
      explicitement dans le rapport plutôt que passé sous silence.

### Propriétés d'événements

- [ ] Chaque propriété a un nom stable, un type explicite (`string`, `number`, `boolean`) et une
      raison d'être documentée dans le catalogue.
- [ ] Minimisation des données : seules les propriétés utiles à un diagnostic de funnel ou à une
      décision produit réelle sont ajoutées.
- [ ] Aucune propriété redondante avec une propriété déjà envoyée automatiquement par le SDK
      PostHog (URL, device, etc.).

### Cohérence serveur/client

- [ ] Un événement de conversion critique (paiement confirmé, compte créé) est confirmé côté
      serveur, jamais uniquement côté client.
- [ ] Si un même événement peut être émis des deux côtés, un mécanisme de déduplication (ex:
      `event_id` partagé) est documenté.
- [ ] Le nom et les propriétés d'un événement sont strictement identiques entre client et serveur.

## Sortie finale obligatoire

Toute exécution de ce skill se termine par un rapport structuré selon ce format, même si aucun
événement n'a été ajouté :

```
## Événements ajoutés/modifiés
- <nom_evenement> (<client|serveur|both>) — <description courte>
(ou : "Aucun événement ajouté — audit uniquement.")

## Fichiers modifiés
- <chemin/fichier> — <nature du changement>

## Commandes de validation
- npm run build && node dist/skills/saas-event-instrumentation/scripts/validate-event-catalog.js <chemin_catalogue.yml>
- npm run test (si le projet cible réutilise la suite de tests de ce dépôt comme référence)
```

## Fichiers du skill

- [references/event-taxonomy.md](references/event-taxonomy.md) — taxonomie par catégories de
  cycle de vie, propriétés communes, exemples SaaS documentés.
- [references/naming-conventions.md](references/naming-conventions.md) — règles de nommage
  détaillées (valides/invalides).
- [templates/event-catalog.yml](templates/event-catalog.yml) — modèle de catalogue à copier dans
  le projet cible.
- [templates/event-schema.template.ts](templates/event-schema.template.ts) — variante TypeScript
  type-safe optionnelle du catalogue, pour les projets qui préfèrent typer leurs événements en
  code plutôt qu'en YAML.
- [scripts/validate-event-catalog.ts](scripts/validate-event-catalog.ts) — validateur du catalogue
  YAML (format, doublons, noms invalides, propriétés interdites).
- [scripts/validate-event-name.ts](scripts/validate-event-name.ts) — validateur d'un nom
  d'événement isolé, réutilisé par `validate-event-catalog.ts`.

## Règle de sécurité (rappel)

Toute clé API, DSN PostHog, token ou valeur de production observée dans le code existant lors de
l'audit doit être signalée comme un risque, jamais recopiée dans un rapport, un exemple, ou un
commit. Toute modification d'un événement déjà utilisé en production (renommage, suppression,
changement de type de propriété) casse potentiellement des dashboards existants : signaler ce
risque explicitement et demander confirmation avant de le faire, en préférant un nouvel événement
versionné (`_v2`) à une modification en place.
