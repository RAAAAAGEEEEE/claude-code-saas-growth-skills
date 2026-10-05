# Architecture

Le dépôt est un ensemble de skills Claude Code (instructions Markdown et petits utilitaires
TypeScript), pas une application.

```text
skills/<nom>/
  SKILL.md        front-matter (name, description, argument-hint, disable-model-invocation) + procédure
  references/     documentation de fond et checklists
  templates/      modèles à copier-adapter dans le projet cible
  scripts/        utilitaires TypeScript (lecture seule ou dry-run)
tests/            tests node:test des scripts, fixtures dans tests/fixtures/
examples/nextjs-posthog/   exemple minimal Next.js + PostHog
.claude/skills/   pointeur d'installation locale (README seul)
scripts/, templates/       réservés aux utilitaires et modèles partagés (README seuls pour l'instant)
```

Principes :

- `skills/` est la source de vérité de chaque skill ; rien n'y est dupliqué ailleurs.
- Trois skills enchaînés : `saas-event-instrumentation` (instrumenter), `saas-funnel-diagnosis`
  (diagnostiquer), `ads-conversion-tracking` (relier la conversion à une régie externe).
- Les scripts n'effectuent aucun appel réseau. `tsc` les compile vers `dist/` (ignoré par git) ;
  `npm test` exécute les tests compilés.
- CI : `.github/workflows/ci.yml` lance `npm ci`, lint, typecheck, `format:check` et tests sur
  Node 22.

Voir aussi [USAGE.md](USAGE.md), [CONFIGURATION.md](CONFIGURATION.md) et
[PRIVACY_AND_SECURITY.md](PRIVACY_AND_SECURITY.md).
