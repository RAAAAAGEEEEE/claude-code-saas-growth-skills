# Usage

Comment invoquer chaque skill et ce qu'il produit. Installation : voir
[INSTALLATION.md](INSTALLATION.md). Les réglages sont dans [CONFIGURATION.md](CONFIGURATION.md).

## Invoquer un skill

Les trois skills portent `disable-model-invocation: true` dans leur front-matter : Claude ne les
charge **jamais** de lui-même à partir d'une phrase en langage naturel. Il faut les lancer
explicitement, avec le nom du skill (champ `name` du `SKILL.md`) :

```text
/saas-event-instrumentation [objectif-produit]
/saas-funnel-diagnosis [fichier-csv-ou-chemin]
/ads-conversion-tracking [provider] [objectif-de-conversion]
```

Exemples : `/saas-funnel-diagnosis exports/funnel-2026-06.csv`, `/ads-conversion-tracking meta
subscription_started`. Une fois le skill lancé, vous pouvez continuer à dialoguer en langage
naturel avec Claude.

## Utiliser les scripts à la main

Les scripts sont écrits en TypeScript et compilés par `npm run build` dans `dist/` (voir
[INSTALLATION.md](INSTALLATION.md)). Commandes exécutées sur ce dépôt :

```bash
node dist/skills/saas-funnel-diagnosis/scripts/analyze-funnel.js tests/fixtures/funnel-metrics-sample.csv
node dist/skills/saas-event-instrumentation/scripts/validate-event-name.js signup_completed
node dist/skills/saas-event-instrumentation/scripts/validate-event-catalog.js skills/saas-event-instrumentation/templates/event-catalog.yml
node dist/skills/ads-conversion-tracking/scripts/audit-tracking-config.js examples/nextjs-posthog
```

`hash-pii.ts` et `funnel-dropoff.ts` sont des fonctions importables sans ligne de commande.

## Détail : `saas-event-instrumentation`

Ce skill suit une procédure stricte **audit → plan → validation utilisateur → implémentation →
tests → rapport**, et ne s'invoque que manuellement (`/saas-event-instrumentation
[objectif-produit]`) :

- [references/event-taxonomy.md](../skills/saas-event-instrumentation/references/event-taxonomy.md) —
  taxonomie par catégories de cycle de vie (signup, onboarding, activation, revenue) et propriétés
  communes.
- [templates/event-catalog.yml](../skills/saas-event-instrumentation/templates/event-catalog.yml) —
  modèle de catalogue d'événements à copier dans le projet cible.
- [scripts/validate-event-catalog.ts](../skills/saas-event-instrumentation/scripts/validate-event-catalog.ts) —
  valide le format du catalogue, détecte doublons, noms invalides et propriétés interdites (PII
  potentielle).

Si PostHog n'est pas installé dans le projet cible, ce skill ne l'ajoute jamais silencieusement :
il produit un plan et attend une validation explicite avant toute modification de `package.json`.

## Détail : `saas-funnel-diagnosis`

Ce skill transforme un export CSV agrégé (étape, utilisateurs, période) en diagnostic actionnable,
en lecture seule et sans aucun appel API réel. Protocole strict **validation des données → calcul
du funnel → détection du goulot → hypothèses → expérimentations → plan de mesure**, invocation
manuelle uniquement (`/saas-funnel-diagnosis [fichier-csv-ou-chemin]`) :

- [references/metrics-glossary.md](../skills/saas-funnel-diagnosis/references/metrics-glossary.md) —
  définitions et formules : activation, conversion, rétention, churn, cohortes, ARPU, MRR.
- [references/hypothesis-checklist.md](../skills/saas-funnel-diagnosis/references/hypothesis-checklist.md) —
  causes fréquentes d'abandon, point de départ pour les hypothèses.
- [templates/funnel-report.md](../skills/saas-funnel-diagnosis/templates/funnel-report.md) — format du
  rapport final (résumé exécutif, tableau des étapes, goulot, hypothèses classées ICE, événements à
  ajouter, risques et limites, prochaine action unique).
- [scripts/analyze-funnel.ts](../skills/saas-funnel-diagnosis/scripts/analyze-funnel.ts) — CLI qui
  parse le CSV, calcule les conversions, détecte les valeurs incohérentes (funnel qui croît d'une
  étape à l'autre, doublons) et produit un rapport Markdown déterministe. Ne dépend d'aucun SDK
  analytics.

Ce skill ne formule jamais de promesse de causalité à partir d'une simple corrélation, signale
toujours ses limites statistiques (taille d'échantillon), et ne recommande jamais de dark pattern.
Toute modification de code qui découlerait du diagnostic exige une confirmation explicite avant
d'être implémentée (via le skill `saas-event-instrumentation`).

## Détail : `ads-conversion-tracking`

**Ce skill ne crée pas de publicités dans Claude et ne dépend d'aucune régie « Claude Ads ».** Il
aide à auditer puis implémenter le tracking de conversion d'un SaaS pour des canaux publicitaires
externes réels (Google Ads, Meta Ads, LinkedIn Ads, OpenAI Ads, canaux UTM custom). Workflow en 8
étapes — **audit → cartographie du parcours → consentement → stratégie client/serveur → plan de
changement → confirmation → implémentation → vérification** — invocation manuelle uniquement
(`/ads-conversion-tracking [provider] [objectif-de-conversion]`) :

- [references/provider-neutral-tracking.md](../skills/ads-conversion-tracking/references/provider-neutral-tracking.md) —
  UTM normalisées, attribution first-touch/last-touch, événements de conversion, idempotence,
  déduplication client/serveur, données interdites.
- [references/dedup-checklist.md](../skills/ads-conversion-tracking/references/dedup-checklist.md) —
  checklist détaillée de déduplication client/serveur.
- [templates/conversion-tracking-plan.md](../skills/ads-conversion-tracking/templates/conversion-tracking-plan.md) —
  plan à remplir et faire valider avant toute implémentation (provider, objectif, événement,
  déclencheur, données envoyées, consentement requis, rollback, validation).
- [templates/conversion-payload.template.ts](../skills/ads-conversion-tracking/templates/conversion-payload.template.ts) —
  payload de conversion serveur avec `event_id` partagé et champs hashés, dry-run par défaut.
- [scripts/hash-pii.ts](../skills/ads-conversion-tracking/scripts/hash-pii.ts) — hashage SHA-256
  normalisé pour email et téléphone.
- [scripts/audit-tracking-config.ts](../skills/ads-conversion-tracking/scripts/audit-tracking-config.ts) —
  audite `.env.example`, fichiers de config et code TypeScript pour repérer des secrets/identifiants
  codés en dur et vérifier la présence d'une variable de consentement, sans jamais révéler la
  valeur détectée.

Ce skill exige une stratégie de consentement validée avant toute activation de pixel ou d'appel
server-side, ne déclenche jamais d'appel réseau réel sans confirmation explicite, et ne prétend
jamais garantir une conformité légale : la checklist du plan de tracking doit être validée par la
personne responsable désignée (DPO, juridique, ou équivalent).

Voir [ROADMAP.md](../ROADMAP.md) pour les évolutions envisagées.
