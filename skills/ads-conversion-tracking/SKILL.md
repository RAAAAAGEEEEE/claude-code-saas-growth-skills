---
name: ads-conversion-tracking
description: Audite puis implémente le tracking de conversion publicitaire d'un SaaS pour des canaux externes (Google Ads, Meta Ads, LinkedIn Ads, OpenAI Ads, UTM custom) — jamais une régie « Claude Ads », ce skill ne crée aucune publicité. Consentement, minimisation des données et dry-run par défaut. Invocation manuelle uniquement.
argument-hint: '[provider] [objectif-de-conversion]'
disable-model-invocation: true
---

# ads-conversion-tracking

## Ce que ce skill n'est pas

Ce skill **ne crée pas de publicités dans Claude** et **ne dépend d'aucune régie « Claude Ads »**
(qui n'existe pas). Il aide à vérifier et implémenter le **tracking de conversion** d'un SaaS déjà
existant vers des canaux publicitaires externes réels :

- Google Ads
- Meta Ads
- LinkedIn Ads
- OpenAI Ads
- canaux custom identifiés par UTM

L'objectif est de relier des campagnes externes déjà en place (ou envisagées) à des événements
SaaS mesurables, sans jamais compromettre le consentement, la minimisation des données ou la
sécurité.

## Invocation

Ce skill s'invoque **uniquement manuellement**, jamais automatiquement à partir d'une simple
mention de publicité ou de marketing dans la conversation :

```
/ads-conversion-tracking google-ads essai_gratuit_converti
/ads-conversion-tracking meta-ads abonnement_demarre
```

`[provider]` identifie le canal concerné (`google-ads`, `meta-ads`, `linkedin-ads`, `openai-ads`,
ou un nom de canal UTM custom). `[objectif-de-conversion]` décrit la conversion business à
mesurer (ex: `essai_gratuit_converti`, `abonnement_demarre`). Si votre version de Claude Code ne
fait pas encore respecter `disable-model-invocation` pour les skills, respectez tout de même cette
contrainte : n'exécutez la procédure ci-dessous que sur demande explicite de l'utilisateur.

## Contraintes non négociables

- **Aucun secret exposé** : ne jamais faire apparaître un token, un secret, une clé de Conversion
  API, ou un identifiant de compte publicitaire de production dans du code, un rapport, ou une
  réponse.
- **Aucune action réseau réelle sans confirmation explicite** : ce skill ne déclenche jamais un
  appel vers Google Ads, Meta, LinkedIn ou tout autre fournisseur sans une confirmation explicite
  de l'utilisateur dans le message courant.
- **Mode audit/dry-run par défaut** : toute construction de payload ou de script d'intégration
  reste en dry-run tant que l'envoi réel n'a pas été explicitement confirmé et activé par
  l'utilisateur.
- **Aucune PII brute** : ni dans une URL, ni dans un paramètre UTM, ni dans un événement client,
  ni dans un log. Les données personnelles exigées par certains fournisseurs (email, téléphone)
  doivent être hashées (SHA-256) avant tout envoi.
- **Consentement obligatoire avant activation** : aucun pixel client ni appel server-side ne doit
  s'activer sans qu'une stratégie de consentement explicite ait été définie et vérifiée en amont.
- **Aucun contenu tiers copié** : toute taxonomie, checklist ou implémentation produite par ce
  skill est une rédaction originale.
- **Aucune prétention de conformité légale** : ce skill ne certifie jamais qu'une implémentation
  est conforme au RGPD, au CCPA ou à toute autre réglementation. Il fournit une checklist (voir
  [templates/conversion-tracking-plan.md](templates/conversion-tracking-plan.md)) à faire valider
  explicitement par la personne responsable (DPO, juridique, ou équivalent selon l'organisation).

## Séparation entre événements produit et événements publicitaires

Un événement analytics produit (catalogue du skill
[saas-event-instrumentation](../saas-event-instrumentation/SKILL.md)) et un événement de
conversion publicitaire **ne sont pas la même chose** et ne doivent jamais être confondus :

|                   | Événement produit                                   | Événement publicitaire                          |
| ----------------- | --------------------------------------------------- | ----------------------------------------------- |
| Destination       | Outil analytics interne (PostHog)                   | Fournisseur publicitaire externe                |
| Usage             | Décision produit, diagnostic de funnel              | Mesure de performance d'une campagne            |
| Champs            | Aussi riches que nécessaires pour l'analyse produit | Strictement minimaux (voir données interdites)  |
| Condition d'envoi | Instrumentation normale du produit                  | Consentement publicitaire explicite obligatoire |

Un événement publicitaire est **dérivé** d'un événement produit déjà existant, jamais créé de
toutes pièces uniquement pour la publicité : voir
[references/provider-neutral-tracking.md](references/provider-neutral-tracking.md).

## Workflow obligatoire

### 1. Audit

- Lire la configuration existante (`.env.example`, fichiers de config, code d'intégration
  publicitaire déjà présent).
- Exécuter [scripts/audit-tracking-config.ts](scripts/audit-tracking-config.ts) pour détecter
  d'éventuels secrets ou identifiants codés en dur, et vérifier la présence d'une variable de
  consentement.
- Ne rien modifier à cette étape.

### 2. Cartographie du parcours

- Identifier l'événement produit source correspondant à `[objectif-de-conversion]` dans le
  catalogue existant (skill `saas-event-instrumentation`).
- Identifier à quel(s) point(s) du parcours utilisateur ce parcours peut être relié à une source
  de trafic externe (paramètres UTM, clic publicitaire entrant).

### 3. Consentement

- Vérifier qu'un mécanisme de consentement publicitaire existe déjà dans le projet (cookie,
  variable de state, bannière).
- S'il n'existe pas, le signaler comme prérequis bloquant : aucune implémentation ne doit
  continuer tant qu'une stratégie de consentement n'est pas définie et validée avec l'utilisateur.

### 4. Stratégie client/serveur

- Décider si la conversion doit être envoyée côté client (pixel), côté serveur (Conversion API),
  ou les deux avec déduplication (voir
  [references/provider-neutral-tracking.md](references/provider-neutral-tracking.md)).
- Toute conversion à valeur financière (abonnement, achat) doit être confirmée côté serveur,
  jamais uniquement côté client.

### 5. Plan de changement

- Remplir [templates/conversion-tracking-plan.md](templates/conversion-tracking-plan.md) :
  provider, objectif, événement, déclencheur, données envoyées, consentement requis, rollback,
  validation.
- Présenter ce plan à l'utilisateur avant toute écriture de code.

### 6. Confirmation

- Attendre une confirmation explicite avant d'implémenter quoi que ce soit.
- Si le plan implique une action réseau réelle (envoi effectif vers le fournisseur), le signaler
  séparément et attendre une confirmation dédiée à cette activation précise.

### 7. Implémentation

- Écrire le code en respectant le plan validé, en dry-run par défaut (voir
  [templates/conversion-payload.template.ts](templates/conversion-payload.template.ts) et
  [scripts/hash-pii.ts](scripts/hash-pii.ts) pour le hashage des données personnelles requises).
- Ne jamais coder en dur un identifiant ou un token — toujours lire depuis `process.env`.

### 8. Vérification

- Ré-exécuter [scripts/audit-tracking-config.ts](scripts/audit-tracking-config.ts) sur le code
  modifié pour confirmer l'absence de secret codé en dur.
- Vérifier manuellement que le mécanisme de consentement bloque bien l'envoi quand le consentement
  n'est pas accordé (voir l'exemple
  [examples/nextjs-posthog](../../examples/nextjs-posthog/README.md)).

## Fichiers du skill

- [references/provider-neutral-tracking.md](references/provider-neutral-tracking.md) — UTM
  normalisées, attribution first-touch/last-touch, événements de conversion, idempotence,
  déduplication client/serveur, données interdites.
- [references/dedup-checklist.md](references/dedup-checklist.md) — checklist détaillée de
  déduplication client/serveur, complémentaire à la référence ci-dessus.
- [templates/conversion-tracking-plan.md](templates/conversion-tracking-plan.md) — plan de
  changement à remplir et faire valider avant toute implémentation.
- [templates/conversion-payload.template.ts](templates/conversion-payload.template.ts) — structure
  d'un payload de conversion serveur avec `event_id` partagé et champs hashés, dry-run par défaut.
- [scripts/hash-pii.ts](scripts/hash-pii.ts) — hashage SHA-256 normalisé pour email et téléphone.
- [scripts/audit-tracking-config.ts](scripts/audit-tracking-config.ts) — audite `.env.example`,
  fichiers de config et code TypeScript pour repérer des secrets/identifiants codés en dur et
  vérifier la présence d'une variable de consentement, sans jamais révéler la valeur détectée.

## Rappel de sécurité et de conformité

Toute clé, token ou identifiant de production observé lors de l'audit doit être signalé comme un
risque immédiatement, jamais recopié dans un rapport ou un commit. Ce skill ne remplace pas une
revue juridique : la checklist de validation du plan de tracking doit être explicitement validée
par la personne responsable désignée (DPO, juridique, ou équivalent) avant toute mise en
production.
