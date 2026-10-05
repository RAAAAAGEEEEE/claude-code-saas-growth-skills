# Changelog

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/).

## [Non publié]

### Ajouté

- Documentation détaillée dans `docs/` et section « Comment ça marche » du README.

## [0.1.0] - 2026-07-16

### Ajouté

- Skill `saas-event-instrumentation` : audit puis instrumentation PostHog, catalogue d'événements
  YAML, validation des noms et des propriétés.
- Skill `saas-funnel-diagnosis` : diagnostic de funnel à partir d'un export CSV agrégé.
- Skill `ads-conversion-tracking` : audit et câblage du tracking de conversion publicitaire
  (dry-run par défaut, hashage SHA-256, audit de configuration).
- Exemple `examples/nextjs-posthog`, tests `node:test`, CI GitHub Actions.
