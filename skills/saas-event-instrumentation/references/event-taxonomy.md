# Taxonomie des événements — saas-event-instrumentation

Cette taxonomie complète les règles de base décrites dans
[naming-conventions.md](naming-conventions.md) avec une organisation par catégories de cycle de
vie produit, pensée pour un SaaS B2B/B2C classique.

## Convention de nommage

- Format : `objet_action`, snake_case strict (`[a-z][a-z0-9_]*`).
- Un événement = une action métier précise et stable dans le temps. Renommer un événement existant
  casse les dashboards : préférer ajouter un nouvel événement versionné (ex: `checkout_started_v2`)
  plutôt que de modifier la sémantique d'un événement déjà en production.
- Chaque événement appartient à une **catégorie** de cycle de vie (voir ci-dessous), utilisée pour
  organiser le catalogue — la catégorie n'est jamais préfixée dans le nom de l'événement lui-même.

## Catégories de cycle de vie

| Catégorie    | Rôle                              | Exemples                                                             |
| ------------ | --------------------------------- | -------------------------------------------------------------------- |
| `signup`     | Création de compte                | `signup_completed`                                                   |
| `onboarding` | Premiers pas post-inscription     | `onboarding_started`, `onboarding_completed`                         |
| `activation` | Usage réel du produit             | `feature_used`                                                       |
| `revenue`    | Conversion et cycle de vie payant | `checkout_started`, `subscription_started`, `subscription_cancelled` |

## Propriétés communes

Toute propriété ajoutée à un événement doit être :

- **stable** : le type et la signification ne changent pas sans versionner l'événement ;
- **minimale** : uniquement ce qui sert un diagnostic de funnel ou une décision produit réelle
  (principe de minimisation des données) ;
- **non identifiante** : jamais de PII (voir la liste `FORBIDDEN_PROPERTY_NAMES` dans
  [scripts/validate-event-catalog.ts](../scripts/validate-event-catalog.ts)).

| Propriété                  | Type   | Usage                                                             |
| -------------------------- | ------ | ----------------------------------------------------------------- |
| `plan`                     | string | Plan tarifaire concerné (`free`, `pro`, `enterprise`)             |
| `source`                   | string | Canal ou origine de l'action (ex: `landing_page`, `referral`)     |
| `amount_cents`             | number | Montant en centimes, jamais en unité flottante                    |
| `currency`                 | string | Code devise ISO 4217 (`EUR`, `USD`)                               |
| `feature_key`              | string | Identifiant stable d'une fonctionnalité (pas son libellé affiché) |
| `cancellation_reason_code` | string | Code de raison fermé (enum), jamais un texte libre utilisateur    |

## Exemples d'événements SaaS

### `signup_completed`

Utilisateur ayant terminé la création de compte. Déclenché **côté serveur**, après confirmation
réelle de la création — jamais uniquement au clic du bouton côté client.

### `onboarding_started`

Premier écran du parcours d'onboarding affiché après signup. Déclenché côté client.

### `onboarding_completed`

Dernière étape de l'onboarding validée. Déclenché côté client, avec la propriété
`steps_completed` pour mesurer le funnel interne à l'onboarding.

### `feature_used`

Usage d'une fonctionnalité clé identifiée par `feature_key`. Un seul événement générique pour
toutes les fonctionnalités clés évite l'explosion du nombre de noms d'événements ; le détail vit
dans la propriété, pas dans le nom.

### `checkout_started`

Démarrage d'un parcours de paiement. Déclenché côté client à l'affichage du formulaire de
paiement.

### `subscription_started`

Confirmation qu'un abonnement payant est actif. Déclenché **côté serveur uniquement**, après
confirmation réelle du fournisseur de paiement (webhook) — jamais sur la seule base d'une
redirection client.

### `subscription_cancelled`

Résiliation d'un abonnement. Déclenché côté serveur, avec `cancellation_reason_code` en enum
fermé plutôt qu'un motif de résiliation en texte libre (risque de PII et de donnée non
exploitable).

## Versionnement

Si la sémantique d'un événement doit changer de façon incompatible (propriété qui change de type,
déclencheur qui change de client à serveur), créer un nouvel événement suffixé `_v2`, `_v3`, etc.,
et marquer l'ancien `status: deprecated` dans le catalogue plutôt que de le modifier en place.
