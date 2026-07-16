# claude-code-saas-growth-skills

Skills [Claude Code](https://docs.claude.com/en/docs/claude-code) pour relier l'implémentation
produit, l'instrumentation d'événements analytics, le tracking des conversions publicitaires et le
diagnostic de funnel — pensés pour un solopreneur SaaS ou une petite équipe en
TypeScript/Next.js (App Router), avec [PostHog](https://posthog.com) comme référence analytics.

Stack de référence : **TypeScript, Node.js 22+, Next.js App Router, PostHog** (self-hosted ou
cloud). Aucune hypothèse de déploiement Vercel n'est faite : les exemples fonctionnent aussi bien
sur un VPS self-hosted.

## Pourquoi ce dépôt

Un solopreneur SaaS passe rapidement de "j'ai codé une fonctionnalité" à "je ne sais pas pourquoi
ma conversion baisse". Ces skills couvrent trois étapes reliées entre elles :

1. **Instrumenter** un événement produit de façon cohérente (`saas-event-instrumentation`).
2. **Diagnostiquer** un funnel à partir de ces événements pour trouver où les utilisateurs
   abandonnent (`saas-funnel-diagnosis`).
3. **Câbler** le tracking de conversion vers une plateforme publicitaire une fois la conversion
   confirmée, en toute sécurité (`ads-conversion-tracking`).

## Installation avec Claude Code

Claude Code découvre les skills placés dans `.claude/skills/<nom>/SKILL.md` d'un projet. La source
de vérité de chaque skill de ce dépôt vit dans [`skills/`](skills/) ; pour l'utiliser dans votre
propre projet, copiez le dossier souhaité :

```bash
cp -r skills/saas-event-instrumentation /chemin/vers/votre-projet/.claude/skills/
cp -r skills/saas-funnel-diagnosis /chemin/vers/votre-projet/.claude/skills/
cp -r skills/ads-conversion-tracking /chemin/vers/votre-projet/.claude/skills/
```

Claude Code chargera alors le `SKILL.md` de chaque skill, ainsi que ses sous-dossiers
`references/`, `templates/` et `scripts/` associés. Voir aussi
[.claude/skills/README.md](.claude/skills/README.md).

## Usage

Une fois un skill installé, invoquez-le naturellement dans Claude Code en décrivant votre besoin
(« j'ajoute un événement pour le nouveau flow d'onboarding », « pourquoi ma conversion signup →
paiement a baissé ce mois-ci », « je veux envoyer mes conversions vers Meta Ads »). Claude Code
active le skill pertinent automatiquement en fonction de sa description.

## Convention des skills

Chaque skill suit la même structure :

```
skills/<nom-du-skill>/
  SKILL.md          # frontmatter (name, description) + instructions
  references/        # documentation de fond, checklists (optionnel)
  templates/          # fichiers modèles TypeScript/Markdown à copier-adapter (optionnel)
  scripts/            # utilitaires TypeScript, lecture seule ou dry-run (optionnel)
```

Trois règles transverses s'appliquent à tous les skills de ce dépôt :

- **Confirmation explicite obligatoire** avant toute action externe ou irréversible (appel vers
  une plateforme publicitaire réelle, modification d'un schéma d'événements déjà en production,
  ajout d'une nouvelle dépendance, etc.).
- **Dry-run par défaut** pour tout script ou template construisant un appel externe : le
  comportement par défaut affiche ce qui serait envoyé, sans l'envoyer réellement.
- **Invocation manuelle uniquement** pour certains skills (ex: `saas-event-instrumentation`, via
  `disable-model-invocation` et `argument-hint` en frontmatter) : ceux-ci ne se déclenchent jamais
  automatiquement, uniquement sur demande explicite de l'utilisateur.

## Structure du dépôt

```
.claude/skills/     pointeur d'installation locale pour Claude Code (voir README dédié)
skills/              source de vérité de chaque skill
scripts/             utilitaires partagés au dépôt (hors skills)
templates/           modèles partagés au dépôt (hors skills)
docs/                documentation complémentaire
examples/nextjs-posthog/  exemple minimal Next.js App Router + PostHog self-hosted
tests/               tests (node:test) des scripts des skills
```

## Skills disponibles

| Skill                                                                      | Rôle                                                                                                                                                                       |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`saas-event-instrumentation`](skills/saas-event-instrumentation/SKILL.md) | Audit puis implémentation d'une instrumentation analytics PostHog (invocation manuelle uniquement, `argument-hint: [objectif-produit]`)                                    |
| [`saas-funnel-diagnosis`](skills/saas-funnel-diagnosis/SKILL.md)           | Diagnostic de funnel à partir d'un export agrégé (invocation manuelle uniquement, `argument-hint: [fichier-csv-ou-chemin]`)                                                |
| [`ads-conversion-tracking`](skills/ads-conversion-tracking/SKILL.md)       | Audit puis câblage du tracking de conversion vers des canaux publicitaires externes (invocation manuelle uniquement, `argument-hint: [provider] [objectif-de-conversion]`) |

### Détail : `saas-event-instrumentation`

Ce skill suit une procédure stricte **audit → plan → validation utilisateur → implémentation →
tests → rapport**, et ne s'invoque que manuellement (`/saas-event-instrumentation
[objectif-produit]`) :

- [references/event-taxonomy.md](skills/saas-event-instrumentation/references/event-taxonomy.md) —
  taxonomie par catégories de cycle de vie (signup, onboarding, activation, revenue) et propriétés
  communes.
- [templates/event-catalog.yml](skills/saas-event-instrumentation/templates/event-catalog.yml) —
  modèle de catalogue d'événements à copier dans le projet cible.
- [scripts/validate-event-catalog.ts](skills/saas-event-instrumentation/scripts/validate-event-catalog.ts) —
  valide le format du catalogue, détecte doublons, noms invalides et propriétés interdites (PII
  potentielle).

Si PostHog n'est pas installé dans le projet cible, ce skill ne l'ajoute jamais silencieusement :
il produit un plan et attend une validation explicite avant toute modification de `package.json`.

### Détail : `saas-funnel-diagnosis`

Ce skill transforme un export CSV agrégé (étape, utilisateurs, période) en diagnostic actionnable,
en lecture seule et sans aucun appel API réel. Protocole strict **validation des données → calcul
du funnel → détection du goulot → hypothèses → expérimentations → plan de mesure**, invocation
manuelle uniquement (`/saas-funnel-diagnosis [fichier-csv-ou-chemin]`) :

- [references/metrics-glossary.md](skills/saas-funnel-diagnosis/references/metrics-glossary.md) —
  définitions et formules : activation, conversion, rétention, churn, cohortes, ARPU, MRR.
- [references/hypothesis-checklist.md](skills/saas-funnel-diagnosis/references/hypothesis-checklist.md) —
  causes fréquentes d'abandon, point de départ pour les hypothèses.
- [templates/funnel-report.md](skills/saas-funnel-diagnosis/templates/funnel-report.md) — format du
  rapport final (résumé exécutif, tableau des étapes, goulot, hypothèses classées ICE, événements à
  ajouter, risques et limites, prochaine action unique).
- [scripts/analyze-funnel.ts](skills/saas-funnel-diagnosis/scripts/analyze-funnel.ts) — CLI qui
  parse le CSV, calcule les conversions, détecte les valeurs incohérentes (funnel qui croît d'une
  étape à l'autre, doublons) et produit un rapport Markdown déterministe. Ne dépend d'aucun SDK
  analytics.

Ce skill ne formule jamais de promesse de causalité à partir d'une simple corrélation, signale
toujours ses limites statistiques (taille d'échantillon), et ne recommande jamais de dark pattern.
Toute modification de code qui découlerait du diagnostic exige une confirmation explicite avant
d'être implémentée (via le skill `saas-event-instrumentation`).

### Détail : `ads-conversion-tracking`

**Ce skill ne crée pas de publicités dans Claude et ne dépend d'aucune régie « Claude Ads ».** Il
aide à auditer puis implémenter le tracking de conversion d'un SaaS pour des canaux publicitaires
externes réels (Google Ads, Meta Ads, LinkedIn Ads, OpenAI Ads, canaux UTM custom). Workflow en 8
étapes — **audit → cartographie du parcours → consentement → stratégie client/serveur → plan de
changement → confirmation → implémentation → vérification** — invocation manuelle uniquement
(`/ads-conversion-tracking [provider] [objectif-de-conversion]`) :

- [references/provider-neutral-tracking.md](skills/ads-conversion-tracking/references/provider-neutral-tracking.md) —
  UTM normalisées, attribution first-touch/last-touch, événements de conversion, idempotence,
  déduplication client/serveur, données interdites.
- [references/dedup-checklist.md](skills/ads-conversion-tracking/references/dedup-checklist.md) —
  checklist détaillée de déduplication client/serveur.
- [templates/conversion-tracking-plan.md](skills/ads-conversion-tracking/templates/conversion-tracking-plan.md) —
  plan à remplir et faire valider avant toute implémentation (provider, objectif, événement,
  déclencheur, données envoyées, consentement requis, rollback, validation).
- [templates/conversion-payload.template.ts](skills/ads-conversion-tracking/templates/conversion-payload.template.ts) —
  payload de conversion serveur avec `event_id` partagé et champs hashés, dry-run par défaut.
- [scripts/hash-pii.ts](skills/ads-conversion-tracking/scripts/hash-pii.ts) — hashage SHA-256
  normalisé pour email et téléphone.
- [scripts/audit-tracking-config.ts](skills/ads-conversion-tracking/scripts/audit-tracking-config.ts) —
  audite `.env.example`, fichiers de config et code TypeScript pour repérer des secrets/identifiants
  codés en dur et vérifier la présence d'une variable de consentement, sans jamais révéler la
  valeur détectée.

Ce skill exige une stratégie de consentement validée avant toute activation de pixel ou d'appel
server-side, ne déclenche jamais d'appel réseau réel sans confirmation explicite, et ne prétend
jamais garantir une conformité légale : la checklist du plan de tracking doit être validée par la
personne responsable désignée (DPO, juridique, ou équivalent).

Voir [ROADMAP.md](ROADMAP.md) pour les évolutions envisagées.

## Développement local

```bash
npm install
npm run lint
npm run typecheck
npm run test
npm run format:check
```

## Sécurité

Aucun secret, token, pixel ID réel ou donnée personnelle ne doit être commité dans ce dépôt — voir
[SECURITY.md](SECURITY.md).

## Licence

[MIT](LICENSE) — Anto1nx.
