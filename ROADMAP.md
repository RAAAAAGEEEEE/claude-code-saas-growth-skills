# Roadmap

Ce dépôt démarre avec trois skills couvrant le cycle instrumentation → diagnostic → tracking
publicitaire pour un SaaS.

## Skills v0.1

- [x] [`saas-event-instrumentation`](skills/saas-event-instrumentation/SKILL.md) — audit puis
      implémentation d'une instrumentation analytics PostHog propre (taxonomie d'événements,
      catalogue YAML versionné, validation automatisée des noms/propriétés/PII). Invocation
      manuelle uniquement (`argument-hint: [objectif-produit]`), procédure audit → plan →
      validation → implémentation → tests → rapport.
- [x] [`saas-funnel-diagnosis`](skills/saas-funnel-diagnosis/SKILL.md) — transforme un export CSV
      agrégé en diagnostic de funnel actionnable (calcul des conversions, détection du goulot,
      hypothèses classées ICE, plan de mesure). Lecture seule, aucun appel API réel, aucune
      promesse de causalité, limites statistiques toujours signalées. Invocation manuelle
      uniquement (`argument-hint: [fichier-csv-ou-chemin]`), protocole validation → calcul →
      goulot → hypothèses → expérimentations → plan de mesure.
- [x] [`ads-conversion-tracking`](skills/ads-conversion-tracking/SKILL.md) — audit puis câblage du
      tracking de conversion vers des canaux publicitaires externes (Google Ads, Meta Ads,
      LinkedIn Ads, OpenAI Ads, UTM custom) — ne dépend d'aucune régie « Claude Ads ». Workflow en
      8 étapes (audit → cartographie du parcours → consentement → stratégie client/serveur → plan
      de changement → confirmation → implémentation → vérification), script d'audit détectant
      secrets/identifiants codés en dur sans révéler leur valeur, dry-run par défaut, aucune
      prétention de conformité légale. Invocation manuelle uniquement
      (`argument-hint: [provider] [objectif-de-conversion]`).

## Pistes futures (non engagées)

- Skill de revue de schéma d'événements (détection de doublons/incohérences dans un schéma
  existant).
- Skill d'aide à la configuration de rétention/anonymisation des données PostHog self-hosted.
- Exemples additionnels (Remix, SvelteKit) si la demande de la communauté le justifie.

Toute contribution proposant un nouveau skill doit suivre la convention décrite dans le
[README](README.md#convention-des-skills) et le [CONTRIBUTING.md](CONTRIBUTING.md).
