# claude-code-saas-growth-skills

Skills [Claude Code](https://docs.claude.com/en/docs/claude-code) pour relier l'implémentation
produit, l'instrumentation d'événements analytics, le tracking des conversions publicitaires et le
diagnostic de funnel — pensés pour un solopreneur SaaS ou une petite équipe en
TypeScript/Next.js (App Router), avec [PostHog](https://posthog.com) comme référence analytics.

Stack de référence : **TypeScript, Node.js 22+, Next.js App Router, PostHog** (self-hosted ou
cloud). Aucune hypothèse de déploiement Vercel n'est faite : les exemples fonctionnent aussi bien
sur un VPS self-hosted.

## Comment ça marche

Pour un débutant, trois gestes, et aucun copier-coller du dépôt dans la conversation :

1. **Installer les skills une fois** : clonez le dépôt, puis copiez chaque dossier `skills/<nom>`
   dans `~/.claude/skills/<nom>` (disponible dans tous vos projets) ou dans `.claude/skills/<nom>`
   d'un projet (disponible dans ce projet seulement).

   ```bash
   git clone https://github.com/RAAAAAGEEEEE/claude-code-saas-growth-skills
   cd claude-code-saas-growth-skills
   mkdir -p ~/.claude/skills
   cp -r skills/ads-conversion-tracking skills/saas-event-instrumentation skills/saas-funnel-diagnosis ~/.claude/skills/
   ```

   Variante Windows PowerShell :

   ```powershell
   New-Item -ItemType Directory -Force "$HOME\.claude\skills" | Out-Null
   Copy-Item -Recurse -Force skills\ads-conversion-tracking, skills\saas-event-instrumentation, skills\saas-funnel-diagnosis "$HOME\.claude\skills"
   ```

2. **Le lancer** : dans Claude Code, tapez `/<nom>`, où `<nom>` est le champ `name` du `SKILL.md`
   (`/saas-event-instrumentation`, `/saas-funnel-diagnosis` ou `/ads-conversion-tracking`). Ces trois
   skills sont à invocation manuelle : Claude ne les déclenche pas tout seul à partir d'une phrase.
3. **Se laisser guider** : Claude suit pas à pas la procédure du skill et demande votre accord avant
   toute action externe ou irréversible. Vous pouvez ensuite lui parler normalement.

Détail et variante projet : [docs/INSTALLATION.md](docs/INSTALLATION.md).

## Statut

**Alpha, version 0.1.0** (CHANGELOG : [CHANGELOG.md](CHANGELOG.md)). Trois skills, 61 tests sur les
scripts (résultat du 2026-10-05), aucune release publiée, peu de retours d'usage.

## Public cible et prérequis

Solopreneur SaaS ou petite équipe en TypeScript/Next.js. Prérequis : Claude Code et `git` ; Node.js
22 ou plus seulement pour compiler et tester les scripts.

## Quickstart

```bash
npm ci
npm test
node dist/skills/saas-funnel-diagnosis/scripts/analyze-funnel.js tests/fixtures/funnel-metrics-sample.csv
```

Sortie (extrait, exemple réel sur la fixture du dépôt) :

```text
# Rapport d'analyse de funnel
- Période analysée : 2026-06
- Conversion globale (signup_completed → subscription_started) : 15.0 % (150/1000)
```

Autres usages et scripts : [docs/USAGE.md](docs/USAGE.md).

## Pourquoi ce dépôt

Un solopreneur SaaS passe rapidement de "j'ai codé une fonctionnalité" à "je ne sais pas pourquoi
ma conversion baisse". Ces skills couvrent trois étapes reliées entre elles :

1. **Instrumenter** un événement produit de façon cohérente (`saas-event-instrumentation`).
2. **Diagnostiquer** un funnel à partir de ces événements pour trouver où les utilisateurs
   abandonnent (`saas-funnel-diagnosis`).
3. **Câbler** le tracking de conversion vers une plateforme publicitaire une fois la conversion
   confirmée, en toute sécurité (`ads-conversion-tracking`).

## Skills disponibles

| Skill                                                                      | Rôle                                                                                                                                                                       |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`saas-event-instrumentation`](skills/saas-event-instrumentation/SKILL.md) | Audit puis implémentation d'une instrumentation analytics PostHog (invocation manuelle uniquement, `argument-hint: [objectif-produit]`)                                    |
| [`saas-funnel-diagnosis`](skills/saas-funnel-diagnosis/SKILL.md)           | Diagnostic de funnel à partir d'un export agrégé (invocation manuelle uniquement, `argument-hint: [fichier-csv-ou-chemin]`)                                                |
| [`ads-conversion-tracking`](skills/ads-conversion-tracking/SKILL.md)       | Audit puis câblage du tracking de conversion vers des canaux publicitaires externes (invocation manuelle uniquement, `argument-hint: [provider] [objectif-de-conversion]`) |

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
docs/                documentation détaillée
examples/nextjs-posthog/  exemple minimal Next.js App Router + PostHog self-hosted
tests/               tests (node:test) des scripts des skills
```

## Architecture

Des dossiers de skills (instructions Markdown, références, modèles, petits scripts TypeScript sans
appel réseau), des tests `node:test` et un exemple Next.js. Détail :
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Configuration

Les skills n'ont pas de réglage ; l'exemple lit trois variables d'environnement, et le template de
conversion une quatrième (dry-run par défaut). Voir [docs/CONFIGURATION.md](docs/CONFIGURATION.md).

## Sécurité et confidentialité

Aucun secret ni donnée personnelle dans ce dépôt ; aucun appel réseau par défaut. Voir
[docs/PRIVACY_AND_SECURITY.md](docs/PRIVACY_AND_SECURITY.md) et [SECURITY.md](SECURITY.md).

## Limites

Stack ciblée TypeScript/Next.js/PostHog, résultats dépendants de Claude, aucune garantie de
conformité légale, aucune régie testée en réel. Liste complète :
[docs/LIMITATIONS.md](docs/LIMITATIONS.md).

## Roadmap

Non contractuelle : [ROADMAP.md](ROADMAP.md).

## Documentation détaillée

- [Installation](docs/INSTALLATION.md)
- [Usage et détail de chaque skill](docs/USAGE.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Configuration](docs/CONFIGURATION.md)
- [Confidentialité et sécurité](docs/PRIVACY_AND_SECURITY.md)
- [Dépannage](docs/TROUBLESHOOTING.md)
- [Limitations](docs/LIMITATIONS.md)

## Contribuer

Voir [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

[MIT](LICENSE) — Anto1nx.
