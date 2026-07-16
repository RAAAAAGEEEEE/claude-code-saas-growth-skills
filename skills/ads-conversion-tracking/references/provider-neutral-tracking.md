# Tracking de conversion neutre vis-à-vis du fournisseur

Ce document définit un vocabulaire et des règles communes, applicables quel que soit le canal
publicitaire (Google Ads, Meta Ads, LinkedIn Ads, OpenAI Ads, ou un canal UTM custom), pour éviter
de coupler l'implémentation à un fournisseur particulier.

## UTM normalisées

Cinq paramètres standards, toujours en minuscules, sans espace ni caractère spécial :

| Paramètre      | Rôle                                         | Exemple                 |
| -------------- | -------------------------------------------- | ----------------------- |
| `utm_source`   | Origine du trafic (plateforme)               | `google`, `linkedin`    |
| `utm_medium`   | Type de canal                                | `cpc`, `paid-social`    |
| `utm_campaign` | Nom de campagne, stable et documenté         | `essai-gratuit-2026-06` |
| `utm_content`  | Variante d'annonce ou de créa, pour A/B      | `visuel-a`, `visuel-b`  |
| `utm_term`     | Mot-clé ciblé (recherche payante uniquement) | `saas-facturation`      |

Règles :

- Un référentiel de valeurs autorisées par paramètre doit exister (éviter `utm_source=Google` un
  jour et `utm_source=google-ads` le lendemain, qui casseraient l'agrégation).
- **Aucune PII dans une UTM** : jamais d'email, d'identifiant utilisateur, de nom, dans
  `utm_content` ou `utm_term` — ces paramètres sont visibles dans l'URL, les logs serveur, et les
  outils d'analytics tiers.

## Attribution first-touch / last-touch

- **First-touch** : attribue la conversion à la toute première source de trafic ayant amené
  l'utilisateur, avant même son inscription. Utile pour mesurer l'acquisition initiale.
- **Last-touch** : attribue la conversion à la dernière source de trafic avant l'action de
  conversion elle-même. Utile pour mesurer ce qui a déclenché la décision finale.

Ces deux modèles peuvent donner des résultats très différents pour un même utilisateur ayant vu
plusieurs campagnes ; toujours préciser explicitement lequel est utilisé dans un rapport, jamais
présumé implicitement.

## Événements de conversion

Un événement de conversion publicitaire est **dérivé** d'un événement produit déjà instrumenté
(voir le skill `saas-event-instrumentation`), pas créé indépendamment :

- Nom stable, indépendant du fournisseur (ex: `subscription_started`), traduit ensuite vers le
  format attendu par chaque provider au moment de l'envoi (ex: `Purchase` pour Meta, une action de
  conversion nommée pour Google Ads).
- Champs minimaux uniquement : identifiant d'événement, valeur (montant en centimes + devise),
  catégorie du plan — jamais l'intégralité des propriétés de l'événement produit source.

## Idempotence

Chaque événement de conversion envoyé doit porter un identifiant unique et stable
(`event_id`), généré une seule fois côté serveur, pour garantir qu'un renvoi (retry réseau,
rejouer une file d'attente) ne compte pas deux fois la même conversion auprès du fournisseur.

```
event_id = uuid_v4() généré au moment de la confirmation serveur de la conversion
```

## Déduplication client/serveur

Quand une conversion est envoyée à la fois par un pixel client et par un appel server-side, les
deux envois doivent partager le **même `event_id`** pour que le fournisseur les déduplique
automatiquement plutôt que de compter deux conversions. Voir
[dedup-checklist.md](dedup-checklist.md) pour la checklist complète de vérification.

## Données interdites

Ne jamais envoyer, dans une URL, un paramètre UTM, un événement client ou serveur, ou un log :

- email ou téléphone en clair (hashage SHA-256 requis si le fournisseur l'exige explicitement,
  voir [scripts/hash-pii.ts](../scripts/hash-pii.ts)) ;
- nom complet, adresse postale, date de naissance ;
- identifiant gouvernemental (numéro de sécurité sociale, passeport) ;
- adresse IP précise ou données de géolocalisation fine ;
- toute donnée permettant d'inférer une catégorie sensible (santé, orientation, opinions
  politiques ou religieuses) ;
- données concernant des mineurs, sauf cadre légal et consentement spécifiques explicitement
  validés par la personne responsable désignée.
